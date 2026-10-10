'use client'

// ---------------------------------------------------------------------------
// Prototype state engine.
//
// STAFFING comes from the Staffing Planner's state (lib/staffing/store.jsx):
// open positions, event coverage and unsent texts are derived from its
// requests, so asking, sending and a reply in the planner clear the matching
// Up Next item. Tasks, messages and documents live here.
//
// The whole point of this file: nothing in the Up Next list is
// hard-coded. Attention items are DERIVED from the current state of assignments,
// tasks, messages and documents. So when Jake declines an assignment, an open position
// appears, and an attention item appears with it. Assign a replacement and all
// three disappear together. The chain is real, not simulated per-screen.
//
//   assignments  ->  open positions  ->  attention items
//   tasks        ->  attention items
//   messages     ->  attention items
//   documents    ->  attention items
//
// State persists to localStorage so a tester can move between screens (and
// reload) without losing their progress. "Reset prototype" clears it.
// ---------------------------------------------------------------------------

import { useTimelineVersion } from '@/lib/timelineEdits'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { events, eventById, seedAssignments, blockById, daysOutLabel } from './mock/events.js'
import { documents, messages, tasks } from './mock/records.js'
import { isAvailable, pluralRole, staff, staffById } from './mock/staff.js'
import { useStaffing2 } from './staffing/store'
import { changed, coverage, requestList, rolesOf, staffById as plannerStaffById } from './staffing/derive'

const StoreContext = createContext(null)

/** Open-position ids are `${blockId}--${role-slug}`; the slug is derived from the role name. */
export function positionIdFor(blockId, role) {
  return `${blockId}--${role.replace(/\s+/g, '-').toLowerCase()}`
}

export function parsePositionId(positionId) {
  const [blockId, slug] = positionId.split('--')
  const found = blockById(blockId)
  const requirement = found?.block.requirements.find(
    (r) => r.role.replace(/\s+/g, '-').toLowerCase() === slug
  )
  return { blockId, role: requirement ? requirement.role : null }
}
const STORAGE_KEY = 'vue-lowfi-prototype-v5'

function initialState() {
  return {
    // assignmentId -> { blockId, staffId, role, status, declineReason, overridden, warning }
    // status: draft (assigned, not yet sent) | pending | accepted | declined
    assignments: Object.fromEntries(
      seedAssignments.map((a) => [`${a.blockId}--${a.staffId}`, { ...a, id: `${a.blockId}--${a.staffId}` }])
    ),
    doneTaskIds: tasks.filter((t) => t.done).map((t) => t.id),
    repliedMessageIds: [],
    readMessageIds: [],
    signedDocumentIds: [],
    publishedEventIds: ['evt-1001'],
    // positionId -> { staffIds }  who an open position was offered to
    offers: {},
    dismissedAttentionIds: [],
    seenIntro: false
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(initialState)
  const [toasts, setToasts] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const { state: planner } = useStaffing2()

  // Rehydrate after mount so the server-rendered HTML and the first couple
  // render match (static export would otherwise warn about a mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setState((s) => ({ ...s, ...JSON.parse(saved) }))
    } catch {
      /* private mode or blocked storage — the prototype still works in memory */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state, hydrated])

  // ---- feedback -----------------------------------------------------------

  const toast = useCallback((message, tone = 'done') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // ---- actions ------------------------------------------------------------

  const setAssignmentStatus = useCallback(
    (assignmentId, status, declineReason) => {
      setState((s) => {
        const existing = s.assignments[assignmentId]
        if (!existing) return s
        // Once someone accepts, any outstanding offer for that position is moot.
        let offers = s.offers
        if (status === 'accepted') {
          const positionId = positionIdFor(existing.blockId, existing.role)
          if (offers[positionId]) {
            offers = { ...offers }
            delete offers[positionId]
          }
        }
        return {
          ...s,
          offers,
          assignments: {
            ...s.assignments,
            [assignmentId]: { ...existing, status, declineReason: declineReason ?? existing.declineReason }
          }
        }
      })
    },
    []
  )

  /**
   * Assigning saves a DRAFT ("Not sent"). Nothing is confirmed, and the open
   * position stays open, until the schedule is published and the person accepts.
   * A soft warning can be overridden; the override is kept so it stays visible.
   */
  const assignStaff = useCallback((blockId, staffId, role, opts = {}) => {
    const id = `${blockId}--${staffId}`
    setState((s) => ({
      ...s,
      assignments: {
        ...s.assignments,
        [id]: {
          id,
          blockId,
          staffId,
          role,
          status: opts.status || 'draft',
          ...(opts.overridden ? { overridden: true, warning: opts.warning } : {})
        }
      }
    }))
  }, [])

  /** Offer an open position to several eligible people. Nothing is assigned until one claims it. */
  const offerPosition = useCallback((positionId, staffIds) => {
    setState((s) => ({ ...s, offers: { ...s.offers, [positionId]: { staffIds } } }))
  }, [])

  /** Simulates one offered person claiming the position: they become an accepted assignment. */
  const claimOffer = useCallback((positionId, staffId) => {
    const { blockId, role } = parsePositionId(positionId)
    if (!blockId || !role) return
    const id = `${blockId}--${staffId}`
    setState((s) => {
      const offers = { ...s.offers }
      delete offers[positionId]
      return {
        ...s,
        offers,
        assignments: { ...s.assignments, [id]: { id, blockId, staffId, role, status: 'accepted' } }
      }
    })
  }, [])

  /** Copy staffing from another event onto blocks that have nobody yet, as drafts. */
  const copyStaffing = useCallback((fromEventId, toEventId) => {
    const from = eventById(fromEventId)
    const to = eventById(toEventId)
    if (!from || !to) return 0
    let copied = 0
    setState((s) => {
      const next = { ...s.assignments }
      for (const block of to.blocks) {
        const hasPeople = Object.values(next).some((a) => a.blockId === block.id && a.status !== 'declined')
        if (hasPeople) continue
        const source = from.blocks.find((b) => b.name === block.name)
        if (!source) continue
        for (const a of Object.values(s.assignments)) {
          if (a.blockId !== source.id || a.status === 'declined') continue
          const id = `${block.id}--${a.staffId}`
          next[id] = { id, blockId: block.id, staffId: a.staffId, role: a.role, status: 'draft' }
          copied += 1
        }
      }
      return { ...s, assignments: next }
    })
    return copied
  }, [])

  const removeAssignment = useCallback((assignmentId) => {
    setState((s) => {
      const next = { ...s.assignments }
      delete next[assignmentId]
      return { ...s, assignments: next }
    })
  }, [])

  const toggleTask = useCallback((taskId) => {
    setState((s) => ({
      ...s,
      doneTaskIds: s.doneTaskIds.includes(taskId)
        ? s.doneTaskIds.filter((t) => t !== taskId)
        : [...s.doneTaskIds, taskId]
    }))
  }, [])

  const markReplied = useCallback((messageId) => {
    setState((s) => ({
      ...s,
      repliedMessageIds: s.repliedMessageIds.includes(messageId)
        ? s.repliedMessageIds
        : [...s.repliedMessageIds, messageId],
      readMessageIds: s.readMessageIds.includes(messageId) ? s.readMessageIds : [...s.readMessageIds, messageId]
    }))
  }, [])

  const markRead = useCallback((messageId) => {
    setState((s) =>
      s.readMessageIds.includes(messageId) ? s : { ...s, readMessageIds: [...s.readMessageIds, messageId] }
    )
  }, [])

  const signDocument = useCallback((docId) => {
    setState((s) => ({
      ...s,
      signedDocumentIds: s.signedDocumentIds.includes(docId)
        ? s.signedDocumentIds
        : [...s.signedDocumentIds, docId]
    }))
  }, [])

  /** Publish: every draft ("Not sent") on the event becomes pending, i.e. staff are asked. */
  const publishSchedule = useCallback((eventId) => {
    setState((s) => {
      const event = eventById(eventId)
      const blockIds = event ? event.blocks.map((b) => b.id) : []
      const assignments = { ...s.assignments }
      for (const a of Object.values(s.assignments)) {
        if (blockIds.includes(a.blockId) && a.status === 'draft') assignments[a.id] = { ...a, status: 'pending' }
      }
      return {
        ...s,
        assignments,
        publishedEventIds: s.publishedEventIds.includes(eventId)
          ? s.publishedEventIds
          : [...s.publishedEventIds, eventId]
      }
    })
  }, [])

  const dismissAttention = useCallback((id) => {
    setState((s) => ({ ...s, dismissedAttentionIds: [...s.dismissedAttentionIds, id] }))
  }, [])

  const setSeenIntro = useCallback((seen) => setState((s) => ({ ...s, seenIntro: seen })), [])

  const reset = useCallback(() => {
    setState(initialState())
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  // ---- derived: assignments ----------------------------------------------------

  const timelineVersion = useTimelineVersion()
  const assignmentList = useMemo(() => Object.values(state.assignments), [state.assignments, timelineVersion])

  const assignmentsForBlock = useCallback(
    (blockId) => assignmentList.filter((a) => a.blockId === blockId),
    [assignmentList]
  )

  const assignmentsForStaff = useCallback(
    (staffId) =>
      assignmentList
        .filter((a) => a.staffId === staffId)
        .map((a) => {
          const found = blockById(a.blockId)
          return found ? { ...a, event: found.event, block: found.block } : null
        })
        .filter(Boolean),
    [assignmentList]
  )

  // ---- derived: open positions --------------------------------------------
  //
  // An open position is a (block, role) pair where accepted assignments < required.
  // Pending assignments deliberately do NOT count as covered — an unanswered
  // assignment request is not coverage, and that distinction is the point of the
  // accept/decline loop.

  const openPositions = useMemo(() => {
    const out = []
    for (const event of events) {
      for (const block of event.blocks) {
        for (const role of rolesOf(block, planner)) {
          const c = coverage(event.id, block, role, planner)
          if (c.gap <= 0) continue
          const declined = requestList(planner).filter(
            (r) => r.eventId === event.id && r.role === role && r.status === 'declined' && r.blockIds.includes(block.id)
          )
          out.push({
            id: `${block.id}--${role.replace(/\s+/g, '-').toLowerCase()}`,
            eventId: event.id,
            event,
            block,
            role,
            required: c.need,
            accepted: c.confirmed,
            pending: c.waiting,
            draft: c.notSent,
            short: c.gap,
            declinedBy: declined.map((r) => plannerStaffById(r.staffId)).filter(Boolean),
            urgency: event.primary ? 'urgent' : 'warn'
          })
        }
      }
    }
    return out
  }, [planner])

  const openPositionById = useCallback((id) => openPositions.find((g) => g.id === id) || null, [openPositions])

  /**
   * Who could fill this slot? Every person gets a list of SOFT warnings (never a
   * block): outside their availability, double-booked, declined this before,
   * or usually a different role. The manager can always assign anyway.
   */
  const candidatesForSlot = useCallback(
    (block, role, { allRoles = false } = {}) => {
      const found = blockById(block.id)
      if (!found) return []
      const { event } = found
      const onBlock = assignmentList.filter((a) => a.blockId === block.id && a.status !== 'declined').map((a) => a.staffId)

      return staff
        .filter((person) => allRoles || person.role === role)
        .map((person) => {
          const warnings = []
          const windows = person.availability[event.day] || []
          if (!isAvailable(person, event.day, block.start, block.end)) {
            warnings.push({
              kind: 'availability',
              text: windows.length
                ? `Free ${windows.map((w) => `${hourLabel(w.start)}–${hourLabel(w.end)}`).join(', ')} only`
                : `Not available ${event.day}`
            })
          }
          const clash = assignmentList
            .filter((a) => a.staffId === person.id && a.status !== 'declined')
            .map((a) => blockById(a.blockId))
            .filter(Boolean)
            .find(
              ({ event: e, block: s }) =>
                e.dateKey === event.dateKey && s.id !== block.id && s.start < block.end && s.end > block.start
            )
          if (clash) {
            warnings.push({
              kind: 'overlap',
              text: `${clash.block.name} at ${clash.event.name}, ${hourLabel(clash.block.start)}–${hourLabel(clash.block.end)}`
            })
          }
          const previous = state.assignments[`${block.id}--${person.id}`]
          if (previous && previous.status === 'declined') {
            warnings.push({ kind: 'declinedBefore', text: 'Declined this timeline block' })
          }
          if (person.role !== role) warnings.push({ kind: 'otherRole', text: `Usually works as ${person.role}` })
          return { person, warnings, eligible: warnings.length === 0, alreadyOnBlock: onBlock.includes(person.id) }
        })
        .sort(
          (x, y) =>
            Number(x.alreadyOnBlock) - Number(y.alreadyOnBlock) ||
            x.warnings.length - y.warnings.length ||
            Number(y.person.role === role) - Number(x.person.role === role)
        )
    },
    [assignmentList, state.assignments]
  )

  /** Coverage summary for a whole event — drives the staffing badge everywhere. */
  const coverageForEvent = useCallback(
    (eventId) => {
      const event = eventById(eventId)
      if (!event) return { required: 0, filled: 0, short: 0, complete: true, pending: 0, draft: 0 }
      let required = 0
      let filled = 0
      let pending = 0
      let draft = 0
      for (const block of event.blocks) {
        for (const role of rolesOf(block, planner)) {
          const c = coverage(event.id, block, role, planner)
          required += c.need
          filled += c.filled
          pending += c.waiting
          draft += c.notSent
        }
      }
      return { required, filled, pending, draft, short: required - filled, complete: filled >= required }
    },
    [planner]
  )

  // ---- derived: tasks / messages / documents ------------------------------

  const taskList = useMemo(
    () => tasks.map((t) => ({ ...t, done: state.doneTaskIds.includes(t.id) })),
    [state.doneTaskIds]
  )

  const messageList = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        replied: state.repliedMessageIds.includes(m.id),
        read: state.readMessageIds.includes(m.id)
      })),
    [state.repliedMessageIds, state.readMessageIds]
  )

  const documentList = useMemo(
    () =>
      documents.map((d) =>
        state.signedDocumentIds.includes(d.id) ? { ...d, status: 'Signed', tone: 'done' } : d
      ),
    [state.signedDocumentIds]
  )

  // ---- derived: ATTENTION -------------------------------------------------
  //
  // Everything above funnels into here. Each item answers the four questions
  // the product is built around: what happened, which event, why it matters,
  // what you can do next.

  const attention = useMemo(() => {
    const items = []

    // 1. Open positions
    for (const openPosition of openPositions) {
      const who = openPosition.declinedBy[0]
      items.push({
        id: `openPosition:${openPosition.id}`,
        kind: 'staffing',
        tone: openPosition.urgency,
        title: `${openPosition.block.name} needs ${openPosition.short} more ${pluralRole(openPosition.role, openPosition.short)}`,
        what: who
          ? `${who.name} declined the ${openPosition.block.name.toLowerCase()} assignment.`
          : `${openPosition.block.name} has ${openPosition.accepted} of ${openPosition.required} ${openPosition.role} confirmed.`,
        why: openPosition.event.primary
          ? `${daysOutLabel(openPosition.event)}. Until it is filled, this block runs short-staffed.`
          : `${daysOutLabel(openPosition.event)}.`,
        eventId: openPosition.event.id,
        eventName: openPosition.event.name,
        meta: `${openPosition.block.name} · ${hourLabel(openPosition.block.start)}–${hourLabel(openPosition.block.end)}`,
        actionLabel: 'Fill position',
        href: `/staffing/${openPosition.event.id}?block=${openPosition.block.id}&role=${encodeURIComponent(openPosition.role)}`
      })
    }

    // 1b. Asks saved in the planner but never sent as texts
    for (const event of events) {
      const drafts = requestList(planner).filter(
        (r) => r.eventId === event.id && (r.status === 'draft' || changed(r))
      ).length
      if (!drafts) continue
      items.push({
        id: `publish:${event.id}`,
        kind: 'staffing',
        tone: 'warn',
        title: `Send ${drafts} ${drafts === 1 ? 'text' : 'texts'}`,
        what: 'People are chosen, but they have not been asked yet.',
        why: 'Sending the text lets each person say yes or no.',
        eventId: event.id,
        eventName: event.name,
        meta: `${drafts} not sent`,
        actionLabel: 'Review and send',
        href: `/staffing/${event.id}?send=1`
      })
    }

    // 2. Messages awaiting a reply
    for (const m of messageList) {
      if (!m.needsReply || m.replied) continue
      const event = m.eventId ? eventById(m.eventId) : null
      items.push({
        id: `msg:${m.id}`,
        kind: 'message',
        tone: m.priority === 'urgent' ? 'urgent' : 'warn',
        title: `Reply to ${m.from}`,
        what: `"${m.subject}" — received ${m.received.toLowerCase()}.`,
        why: event
          ? `A quick reply keeps everyone on the same page before the event.`
          : 'No reply has been sent yet.',
        eventId: m.eventId,
        eventName: event ? event.name : 'No event',
        meta: m.fromRole.split(' · ')[0],
        actionLabel: 'Open and reply',
        href: `/messages/${m.id}`
      })
    }

    // 3. Tasks that are due and not done
    for (const t of taskList) {
      if (t.done || t.dueTone === 'done' || t.dueTone === 'info') continue
      const event = eventById(t.eventId)
      items.push({
        id: `task:${t.id}`,
        kind: 'task',
        tone: t.dueTone === 'urgent' ? 'urgent' : 'warn',
        title: t.title,
        what: t.detail,
        why: `${t.due} · owned by ${t.owner}.`,
        eventId: t.eventId,
        eventName: event ? event.name : 'No event',
        meta: t.due,
        actionLabel: 'Open event tasks',
        href: `/events/${t.eventId}/tasks`
      })
    }

    // 4. Documents awaiting signature
    for (const d of documentList) {
      if (d.tone !== 'urgent') continue
      const event = eventById(d.eventId)
      items.push({
        id: `doc:${d.id}`,
        kind: 'document',
        tone: 'warn',
        title: `${d.name} is ready for your signature`,
        what: `Last updated ${d.updated}.`,
        why: 'Once it is signed, the couple has formally agreed to the schedule.',
        eventId: d.eventId,
        eventName: event ? event.name : 'No event',
        meta: 'Awaiting signature',
        actionLabel: 'Open documents',
        href: `/events/${d.eventId}/documents`
      })
    }

    const order = { urgent: 0, warn: 1, pending: 2, info: 3 }
    return items
      .filter((i) => !state.dismissedAttentionIds.includes(i.id))
      .sort((a, b) => (order[a.tone] ?? 9) - (order[b.tone] ?? 9))
  }, [openPositions, planner, messageList, taskList, documentList, state.dismissedAttentionIds])

  const attentionForEvent = useCallback((eventId) => attention.filter((a) => a.eventId === eventId), [attention])

  const value = {
    hydrated,
    // raw state
    assignments: state.assignments,
    publishedEventIds: state.publishedEventIds,
    offers: state.offers,
    seenIntro: state.seenIntro,
    // collections
    taskList,
    messageList,
    documentList,
    // staffing
    assignmentList,
    assignmentsForBlock,
    assignmentsForStaff,
    openPositions,
    openPositionById,
    candidatesForSlot,
    coverageForEvent,
    // attention
    attention,
    attentionForEvent,
    // actions
    setAssignmentStatus,
    assignStaff,
    offerPosition,
    claimOffer,
    copyStaffing,
    removeAssignment,
    toggleTask,
    markReplied,
    markRead,
    signDocument,
    publishSchedule,
    dismissAttention,
    setSeenIntro,
    reset,
    // feedback
    toasts,
    toast,
    dismissToast
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  useTimelineVersion() // draw again after a timeline edit
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export function hourLabel(h) {
  const wrapped = ((h % 24) + 24) % 24 // blocks that cross midnight run past 24
  const hour24 = Math.floor(wrapped)
  const mins = Math.round((wrapped - hour24) * 60)
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return mins ? `${hour12}:${String(mins).padStart(2, '0')} ${suffix}` : `${hour12}:00 ${suffix}`
}

/**
 * Calm, priority-first summary of an Up Next list: "2 to do first", else
 * "5 coming up", else "All caught up". Never a raw alarm count.
 */
export function upNextLabel(items) {
  const first = items.filter((i) => i.tone === 'urgent').length
  if (first) return `${first} to do first`
  if (items.length) return `${items.length} coming up`
  return 'All caught up'
}
