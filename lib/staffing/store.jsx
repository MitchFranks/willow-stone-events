'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · state, actions, persistence, undo and the sim clock.
//
// the planner has its own state under its own localStorage key and never touches
// lib/store.jsx (Planner 1). Every manager action moves the simulated clock by
// two minutes, so "asked 4 min ago" works and runs are deterministic (§C.2).
// Single-level undo: each manager action before a send keeps the previous
// state in memory; sending clears it (§C.6).
// ---------------------------------------------------------------------------

import { useTimelineVersion } from '@/lib/timelineEdits'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { WORLD, makeGuest, registerPerson, seedState, syncPeople } from './adapter'
import {
  activeRequest,
  blockById,
  blocksOfRequest,
  callAbsMin,
  callTimeH,
  coverage,
  evaluate,
  firstName,
  fmtH,
  isShortNotice,
  messageText,
  minToIso,
  openIssues,
  overdue,
  sendKind,
  simNowIso,
  simNowMin,
  sortBlockIds
} from './derive'

export const STORAGE_KEY = 'vue-lowfi-staffing2-v3'

/* ------------------------------------------------------------ pure ops --- */

const nextId = (st, prefix) => `${prefix}${++st.counter}`

/** Guests live in the shared world, which outlives a reset, so skip ids already taken. */
function nextGuestId(st) {
  let id = nextId(st, 'guest')
  while (WORLD.staffMap[id]) id = nextId(st, 'guest')
  return id
}

function log(st, eventId, text) {
  st.activity.unshift({ id: nextId(st, 'a'), at: simNowIso(st), eventId, text })
  if (st.activity.length > 200) st.activity.length = 200
}

const blockNames = (r) => blocksOfRequest(r).map((b) => b.name).join(' + ')

/**
 * Create or extend requests (one per person per event). Returns the ids touched.
 * spec = { eventId, role, blockIds, callOffsetMin, staffIds, reason, source }
 */
export function applyAsk(st, spec) {
  const ev = WORLD.eventMap[spec.eventId]
  const ids = []
  const now = simNowIso(st)
  for (const staffId of spec.staffIds) {
    const existing = activeRequest(staffId, spec.eventId, spec.role, st)
    const target = existing && existing.status !== 'backup' ? existing : null
    const blockIds = sortBlockIds(ev, [...(target?.blockIds || []), ...spec.blockIds])
    // Same offset the Ask panel ranked with: the earlier of the two.
    const callOffsetMin = target ? Math.min(target.callOffsetMin, spec.callOffsetMin) : spec.callOffsetMin
    const cand = { staffId, eventId: spec.eventId, role: spec.role, blockIds, callOffsetMin, ignoreId: existing?.id }
    const found = evaluate(cand, st)
    if (found.some((i) => i.severity === 'block')) continue // already on this event: never double-book
    const hard = found.filter((i) => i.severity === 'hard')
    const overrides = spec.reason ? hard.map((i) => ({ ruleId: i.ruleId, message: i.message, reason: spec.reason, at: now })) : []
    // Asking a backup replaces the backup row, so there is only one live request.
    if (existing && !target) delete st.requests[existing.id]
    if (target) {
      target.blockIds = blockIds
      target.callOffsetMin = callOffsetMin
      target.confirmedBlockIds = target.confirmedBlockIds.filter((b) => blockIds.includes(b))
      target.overrides = [...target.overrides, ...overrides]
      ids.push(target.id)
    } else {
      const id = nextId(st, 'r')
      st.requests[id] = {
        id,
        eventId: spec.eventId,
        staffId,
        role: spec.role,
        blockIds,
        confirmedBlockIds: [],
        callOffsetMin,
        status: 'draft',
        sentAt: null,
        sent: null,
        replyBy: null,
        overrides,
        createdAt: now,
        source: spec.source || 'ask'
      }
      ids.push(id)
    }
  }
  return ids
}

/** Send everything unsent in `ids`: asks, changes, removals and reminders. */
export function applySend(st, ids, { urgentAll = false } = {}) {
  const now = simNowIso(st)
  let count = 0
  for (const id of ids) {
    const r = st.requests[id]
    if (!r) continue
    const kind = sendKind(r)
    if (!kind) continue
    const ev = WORLD.eventMap[r.eventId]
    const name = firstName(r.staffId)
    const urgent = kind !== 'cancel' && (urgentAll || isShortNotice(r, st))
    const text = messageText(kind, r, st, { urgent })
    st.messages.unshift({ id: nextId(st, 'm'), staffId: r.staffId, eventId: r.eventId, requestId: r.id, kind, at: now, text, urgent })
    count += 1
    if (kind === 'cancel') {
      r.cancelNotice = 'sent'
      log(st, ev.id, `Told ${name} they're no longer needed (${r.role})`)
    } else if (kind === 'remind') {
      r.replyBy = minToIso(simNowMin(st) + 24 * 60)
      r.remindedAt = now
      log(st, ev.id, `Reminded ${name}`)
    } else {
      // A change still waiting for an answer keeps the offset the person last agreed to.
      const awaitingChange = r.status === 'pending' && r.confirmedBlockIds.length > 0 && r.sent?.prevOffset != null
      const prevOffset = awaitingChange ? r.sent.prevOffset : (r.sent?.callOffsetMin ?? r.callOffsetMin)
      r.sent = { blockIds: [...r.blockIds], callOffsetMin: r.callOffsetMin, prevOffset }
      r.status = 'pending'
      r.sentAt = now
      r.replyBy = null
      r.urgent = urgent
      r.seenAt = null
      log(st, ev.id, kind === 'change' ? `Sent ${name} an update (${blockNames(r)})` : `Asked ${name} (${r.role}, ${blockNames(r)})`)
    }
  }
  return count
}

/** A reply, from the phone or recorded by the manager (spec §D.5). */
export function applyAnswer(st, id, yes, reason) {
  const r = st.requests[id]
  if (!r || r.status !== 'pending') return null
  const ev = WORLD.eventMap[r.eventId]
  const name = firstName(r.staffId)
  r.respondedAt = simNowIso(st)
  if (yes) {
    if (r.confirmedBlockIds.length) {
      // Keep what they already had; confirm an added block only if it still has room.
      const had = r.confirmedBlockIds
      r.status = 'accepted'
      r.confirmedBlockIds = r.blockIds.filter((b) => {
        if (had.includes(b)) return true
        const c = coverage(ev.id, blockById(b), r.role, st, r.id)
        return c.confirmed < c.need
      })
      log(st, ev.id, `${name} said yes to the update (${blockNames(r)})`)
      return 'accepted'
    }
    const anyOpen = r.blockIds.some((b) => {
      const c = coverage(ev.id, blockById(b), r.role, st, r.id)
      return c.confirmed < c.need
    })
    if (anyOpen) {
      r.status = 'accepted'
      r.confirmedBlockIds = [...r.blockIds]
      log(st, ev.id, `${name} said yes (${blockNames(r)})`)
      return 'accepted'
    }
    r.status = 'backup'
    log(st, ev.id, `${name} said yes, but the spots were full, so ${name} is a backup`)
    return 'backup'
  }
  if (r.confirmedBlockIds.length) {
    // A change to a confirmed person was declined: revert to what they agreed.
    const offset = r.sent?.prevOffset ?? r.callOffsetMin
    r.blockIds = [...r.confirmedBlockIds]
    r.callOffsetMin = offset
    r.sent = { blockIds: [...r.blockIds], callOffsetMin: offset }
    r.status = 'accepted'
    log(st, ev.id, `${name} can't do the change; still on from ${fmtH(callTimeH(r, ev))}`)
    return 'reverted'
  }
  r.status = 'declined'
  r.reason = reason || null
  log(st, ev.id, `${name} can't make it${reason ? ` (${reason})` : ''}`)
  return 'declined'
}

function freshState() {
  return seedState()
}

/** Leave out blocks that no longer exist; drop requests that were only for them. */
function dropDeletedBlocks(st) {
  const alive = (id) => !!WORLD.blockMap[id]
  const stale = Object.values(st.requests).some((r) => r.blockIds.some((b) => !alive(b)) || r.confirmedBlockIds.some((b) => !alive(b)))
  if (!stale) return st
  const requests = {}
  for (const [id, r] of Object.entries(st.requests)) {
    const blockIds = r.blockIds.filter(alive)
    if (!blockIds.length) continue
    requests[id] = { ...r, blockIds, confirmedBlockIds: r.confirmedBlockIds.filter(alive) }
  }
  return { ...st, requests }
}

/* -------------------------------------------------------------- context --- */

const Ctx = createContext(null)

export function Staffing2Provider({ children }) {
  const [state, setState] = useState(freshState)
  const stateRef = useRef(state)
  const [hydrated, setHydrated] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [undoSlot, setUndoSlotState] = useState(null)
  const undoRef = useRef(null)
  const setUndoSlot = useCallback((v) => {
    undoRef.current = v
    setUndoSlotState(v)
  }, [])
  const [toast, setToast] = useState(null)
  const [phoneFor, setPhoneFor] = useState(null)

  useEffect(() => {
    let next = null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.version === 1 && parsed.requests) next = parsed
        else setLoadError(true)
      }
    } catch {
      setLoadError(true)
    }
    if (next) {
      // People added by hand in the Ask panel come back with the saved state.
      for (const p of next.people || []) registerPerson(p)
      stateRef.current = next
      setState(next)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [state, hydrated])

  const showToast = useCallback((t) => setToast({ id: Math.random().toString(36).slice(2), ...t }), [])
  // Pass the toast's id so a toast that replaced it (say "Undone.") stays up.
  const dismissToast = useCallback((id) => setToast((t) => (id == null || t?.id === id ? null : t)), [])

  /**
   * Apply a mutation to a copy of the state. opts.undo keeps the previous
   * state in the undo slot; opts.clearUndo empties it (sends, drop-outs);
   * opts.noTick leaves the sim clock alone (a staff member opening a text).
   */
  const commit = useCallback(
    (fn, opts = {}) => {
      const prev = stateRef.current
      const draft = dropDeletedBlocks(structuredClone(prev))
      if (!opts.noTick) draft.tick = (draft.tick || 0) + 1
      const result = fn(draft)
      if (result === false) return undefined
      stateRef.current = draft
      setState(draft)
      if (opts.undo) setUndoSlot({ state: prev })
      else if (opts.clearUndo) setUndoSlot(null)
      if (opts.toast) {
        const t = typeof opts.toast === 'function' ? opts.toast(result, draft) : opts.toast
        if (t) showToast({ ...t, undo: !!opts.undo })
      }
      return result
    },
    [showToast, setUndoSlot]
  )

  const actions = useMemo(() => {
    const req = (id) => stateRef.current.requests[id]
    return {
      /** Add someone who is not in the pool (the Ask panel's free-text field). Returns their id. */
      addPerson(name, role) {
        return commit((st) => {
          const person = makeGuest(nextGuestId(st), name.trim(), role)
          st.people = [...(st.people || []), person]
          registerPerson(person)
          return person.id
        })
      },
      /** Save for later: Not sent requests, with Undo. */
      saveForLater(spec) {
        return commit((st) => applyAsk(st, spec), {
          undo: true,
          toast: (ids) => ({ message: `Saved ${ids.length} request${ids.length === 1 ? '' : 's'} for later. Nothing was sent.` })
        })
      },
      /** Ask and send in one step (after Send review). */
      askAndSend(spec, opts = {}) {
        return commit(
          (st) => {
            const ids = applyAsk(st, spec)
            applySend(st, ids, opts)
            return ids
          },
          { clearUndo: true, toast: (ids, st) => sentToast(ids, st) }
        )
      },
      send(ids) {
        return commit(
          (st) => {
            applySend(st, ids)
            return ids
          },
          { clearUndo: true, toast: (sent, st) => sentToast(sent, st) }
        )
      },
      /**
       * Manager records a reply that came in some other way (a call, in
       * person), or answers for staff in the prototype. Undoable.
       */
      recordReply(id, yes, reason) {
        if (!req(id)) return undefined
        const name = firstName(req(id).staffId)
        return commit((st) => applyAnswer(st, id, yes, reason), {
          undo: true,
          toast: (res) => replyToast(name, res)
        })
      },
      /**
       * Staff phone reply (the prototype's phone simulator). Undoable too, so a
       * tester who taps the wrong answer for someone can take it back.
       */
      answer(id, yes, reason) {
        if (!req(id)) return undefined
        const name = firstName(req(id).staffId)
        return commit((st) => applyAnswer(st, id, yes, reason), {
          undo: true,
          toast: (res) => replyToast(name, res)
        })
      },
      markSeen(id) {
        const r = req(id)
        if (!r || r.seenAt || r.status !== 'pending') return
        commit((st) => {
          st.requests[id].seenAt = simNowIso(st)
        }, { noTick: true })
      },
      dropOut(id, reason) {
        return commit(
          (st) => {
            const r = st.requests[id]
            if (!r || r.status !== 'accepted') return false
            const call = callAbsMin(r)
            if (call == null) return false
            const hoursBefore = Math.max(0, Math.round((call - simNowMin(st)) / 60))
            r.shortNotice = isShortNotice(r, st)
            r.hoursBefore = hoursBefore
            r.status = 'declined'
            r.droppedOut = true
            r.reason = reason || null
            r.respondedAt = simNowIso(st)
            log(st, r.eventId, `${firstName(r.staffId)} can't make it anymore${reason ? ` (${reason})` : ''}, ${hoursBefore} h before call time`)
            return true
          },
          { clearUndo: true }
        )
      },
      remove(id) {
        const r = req(id)
        if (!r) return undefined
        const name = firstName(r.staffId)
        return commit(
          (st) => {
            const x = st.requests[id]
            if (!x || x.status === 'cancelled') return false
            // Nothing was promised to a draft.
            if (x.status === 'draft') {
              delete st.requests[id]
              return 'deleted'
            }
            // Someone who said no, or is only a backup, was never counted on: nobody to tell.
            const told = x.status === 'pending' || x.status === 'accepted'
            if (x.status === 'declined') x.declinedBefore = true // keep "said no to this event" for later asks
            x.status = 'cancelled'
            if (told) x.cancelNotice = 'queued'
            log(st, x.eventId, `Removed ${name} (${x.role})`)
            return told ? 'queued' : 'quiet'
          },
          {
            undo: true,
            toast: (res) => ({
              message: res === 'deleted' ? `Removed ${name}. Nothing had been sent.` : res === 'quiet' ? `Removed ${name}.` : `Removed ${name}. Send the update to let ${name} know.`
            })
          }
        )
      },
      changeTimes(id, blockIds, callOffsetMin) {
        if (!req(id)) return undefined
        const name = firstName(req(id).staffId)
        return commit(
          (st) => {
            const r = st.requests[id]
            if (!r) return false
            const ev = WORLD.eventMap[r.eventId]
            r.blockIds = sortBlockIds(ev, blockIds)
            r.callOffsetMin = callOffsetMin
            r.confirmedBlockIds = r.confirmedBlockIds.filter((b) => r.blockIds.includes(b))
          },
          { undo: true, toast: { message: `Changed ${name}'s times.` } }
        )
      },
      promote(id) {
        if (!req(id)) return undefined
        const name = firstName(req(id).staffId)
        return commit(
          (st) => {
            const r = st.requests[id]
            if (!r) return false
            r.status = 'accepted'
            r.confirmedBlockIds = [...r.blockIds]
            r.sent = { blockIds: [...r.blockIds], callOffsetMin: r.callOffsetMin }
            st.messages.unshift({ id: nextId(st, 'm'), staffId: r.staffId, eventId: r.eventId, requestId: r.id, kind: 'confirmed', at: simNowIso(st), text: messageText('confirmed', r, st) })
            log(st, r.eventId, `${name} moved from backup to confirmed`)
          },
          { undo: true, toast: { message: `${name} is confirmed. We texted ${name}.` } }
        )
      },
      markOk(id, reason) {
        if (!req(id)) return undefined
        const name = firstName(req(id).staffId)
        return commit(
          (st) => {
            const r = st.requests[id]
            if (!r) return false
            const issues = openIssues(r, st).filter((i) => i.severity !== 'info')
            r.overrides = [...r.overrides, ...issues.map((i) => ({ ruleId: i.ruleId, message: i.message, reason: reason || null, at: simNowIso(st) }))]
          },
          { undo: true, toast: { message: `Noted: the warning for ${name} is fine.` } }
        )
      },
      saveNeeds(eventId, needsByBlock, edits) {
        return commit(
          (st) => {
            for (const [blockId, roles] of Object.entries(needsByBlock)) st.needs[blockId] = { ...(st.needs[blockId] || {}), ...roles }
            st.eventEdits[eventId] = { ...(st.eventEdits[eventId] || {}), ...edits }
            log(st, eventId, 'Changed how many people are needed')
          },
          { undo: true, toast: { message: 'Saved how many people you need.' } }
        )
      },
      /** The guaranteed guest count sent to catering (the event's Tasks tab). */
      setGuarantee(eventId, n) {
        return commit(
          (st) => {
            st.eventEdits[eventId] = { ...(st.eventEdits[eventId] || {}), guaranteedCount: n }
            log(st, eventId, `Guarantee set to ${n}`)
          },
          { undo: true }
        )
      },
      applySuggestion(eventId, blockId, role, n) {
        return commit(
          (st) => {
            st.needs[blockId] = { ...(st.needs[blockId] || {}), [role]: n }
            log(st, eventId, `${blockById(blockId).name} now needs ${n} ${role}`)
          },
          { undo: true, toast: { message: `${blockById(blockId).name} now needs ${n}.` } }
        )
      },
      addAway(away) {
        return commit(
          (st) => {
            const a = { ...away, id: nextId(st, 'aw') }
            st.away.push(a)
            const clashes = Object.values(st.requests).filter(
              (r) => r.staffId === a.staffId && ['draft', 'pending', 'accepted', 'backup'].includes(r.status) && evaluate({ ...r, ignoreId: r.id }, st).some((i) => i.awayId === a.id)
            )
            return clashes.map((r) => WORLD.eventMap[r.eventId].name)
          },
          {
            undo: true,
            toast: (clashes) => {
              const name = firstName(away.staffId)
              if (clashes.length) return { message: `${name} is booked at the ${clashes.join(' and the ')} that day. It's flagged there for you.` }
              return { message: `Away date added for ${name}.` }
            }
          }
        )
      },
      removeAway(id) {
        return commit(
          (st) => {
            st.away = st.away.filter((a) => a.id !== id)
          },
          { undo: true, toast: { message: 'Away date removed.' } }
        )
      },
      reset() {
        const prev = stateRef.current
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        const next = freshState()
        syncPeople(next.people)
        stateRef.current = next
        setState(next)
        setLoadError(false)
        setUndoSlot({ state: prev })
        showToast({ message: 'Sample data restored.', undo: true })
      },
      undo() {
        const slot = undoRef.current
        if (!slot) return
        setUndoSlot(null)
        syncPeople(slot.state.people)
        stateRef.current = slot.state
        setState(slot.state)
        setToast({ id: `undone-${Date.now()}`, message: 'Undone.' })
      }
    }
  }, [commit, showToast, setUndoSlot])

  // A deleted timeline block can still be named in saved requests. Hide those
  // references so nothing reads a block that is gone.
  const timelineVersion = useTimelineVersion()
  const safeState = useMemo(() => dropDeletedBlocks(state), [state, timelineVersion])

  const value = useMemo(
    () => ({
      state: safeState,
      hydrated,
      loadError,
      canUndo: !!undoSlot,
      toast,
      dismissToast,
      showToast,
      phoneFor,
      openPhone: setPhoneFor,
      closePhone: () => setPhoneFor(null),
      ...actions
    }),
    [safeState, hydrated, loadError, undoSlot, toast, dismissToast, showToast, phoneFor, actions]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function replyToast(name, res) {
  if (res === 'accepted') return { message: `${name} said yes and is confirmed.` }
  if (res === 'backup') return { message: `${name} said yes, but the spots were already full, so ${name} is a backup.` }
  if (res === 'reverted') return { message: `${name} can't do the new times, so ${name} keeps the old ones.` }
  return { message: `${name} can't make it. The spot is open again.` }
}

function sentToast(ids, st) {
  const n = ids.filter((id) => st.requests[id]).length
  const firstAsk = ids.map((id) => st.requests[id]).find((r) => r && r.status !== 'cancelled')
  return {
    message: `Sent ${n} text${n === 1 ? '' : 's'}. Replies show up on this page.`,
    small: "Texts can't be unsent. In this prototype, answer for staff under each Waiting person.",
    phone: firstAsk ? firstAsk.staffId : null
  }
}

export function useStaffing2() {
  const ctx = useContext(Ctx)
  useTimelineVersion() // draw again after a timeline edit
  if (!ctx) throw new Error('useStaffing2 must be used inside Staffing2Provider')
  return ctx
}

export { overdue }
