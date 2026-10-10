'use client'

// ---------------------------------------------------------------------------
// Prototype state engine.
//
// STAFFING comes from the Staffing Planner's state (lib/staffing/store.jsx):
// open spots, event coverage and unsent texts are derived from its requests,
// so asking, sending and a reply in the planner clear the matching Up Next
// item. Tasks, messages, documents and payments live here.
//
// The whole point of this file: nothing in the Up Next list is hard-coded.
// Up Next items are DERIVED from the current state:
//
//   planner requests  ->  open spots  ->  Up Next items
//   tasks             ->  Up Next items
//   messages          ->  Up Next items
//   documents         ->  Up Next items
//   payments          ->  Up Next items
//
// State persists to localStorage so a tester can move between screens (and
// reload) without losing their progress. "Reset prototype data" clears it.
// ---------------------------------------------------------------------------

import { useTimelineVersion } from '@/lib/timelineEdits'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { events, eventById, daysOutLabel } from './mock/events.js'
import { documents, messages, money, payments, tasks } from './mock/records.js'
import { pluralRole } from './mock/staff.js'
import { useStaffing2 } from './staffing/store'
import { changed, coverage, requestList, rolesOf, staffById as plannerStaffById } from './staffing/derive'

const StoreContext = createContext(null)

const STORAGE_KEY = 'vue-lowfi-prototype-v6'

function initialState() {
  return {
    doneTaskIds: tasks.filter((t) => t.done).map((t) => t.id),
    repliedMessageIds: [],
    readMessageIds: [],
    signedDocumentIds: [],
    // `${eventId}:${paymentId}` recorded as paid in the prototype
    paidPaymentIds: [],
    // Up Next item ids the manager chose to hide. Staffing items can't be hidden.
    dismissedAttentionIds: []
  }
}

/** "1 open spot", "3 open spots". The one phrasing for unfilled roles. */
function openSpotsText(n) {
  return `${n} open spot${n === 1 ? '' : 's'}`
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(initialState)
  const [toasts, setToasts] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const { state: planner, setGuarantee } = useStaffing2()

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

  /**
   * toast(message, tone?, { actions?, small? }). Toasts with actions (Undo)
   * stay up longer so there is time to use them.
   */
  const toast = useCallback((message, tone = 'done', opts = {}) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, tone, actions: opts.actions, small: opts.small }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.actions?.length ? 8000 : 4000)
  }, [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // ---- actions ------------------------------------------------------------

  const toggleTask = useCallback((taskId) => {
    setState((s) => ({
      ...s,
      doneTaskIds: s.doneTaskIds.includes(taskId)
        ? s.doneTaskIds.filter((t) => t !== taskId)
        : [...s.doneTaskIds, taskId]
    }))
  }, [])

  /** Submit the guaranteed guest count: sets it on the event and completes the task. */
  const submitGuestCount = useCallback(
    (taskId, eventId, count) => {
      setGuarantee(eventId, count)
      setState((s) => (s.doneTaskIds.includes(taskId) ? s : { ...s, doneTaskIds: [...s.doneTaskIds, taskId] }))
    },
    [setGuarantee]
  )

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

  const unsignDocument = useCallback((docId) => {
    setState((s) => ({ ...s, signedDocumentIds: s.signedDocumentIds.filter((d) => d !== docId) }))
  }, [])

  const recordPayment = useCallback((eventId, paymentId) => {
    const key = `${eventId}:${paymentId}`
    setState((s) => (s.paidPaymentIds.includes(key) ? s : { ...s, paidPaymentIds: [...s.paidPaymentIds, key] }))
  }, [])

  const undoPayment = useCallback((eventId, paymentId) => {
    const key = `${eventId}:${paymentId}`
    setState((s) => ({ ...s, paidPaymentIds: s.paidPaymentIds.filter((k) => k !== key) }))
  }, [])

  const dismissAttention = useCallback((id) => {
    setState((s) =>
      s.dismissedAttentionIds.includes(id) ? s : { ...s, dismissedAttentionIds: [...s.dismissedAttentionIds, id] }
    )
  }, [])

  const restoreAttention = useCallback((id) => {
    setState((s) => ({ ...s, dismissedAttentionIds: s.dismissedAttentionIds.filter((x) => x !== id) }))
  }, [])

  const restoreAllAttention = useCallback(() => setState((s) => ({ ...s, dismissedAttentionIds: [] })), [])

  const reset = useCallback(() => {
    setState(initialState())
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const timelineVersion = useTimelineVersion()

  // ---- derived: open spots ------------------------------------------------
  //
  // An open spot is a (block, role) pair with fewer confirmed people than it
  // needs. Someone who has been asked but not yet said yes does NOT count as
  // covered: an unanswered text is not coverage.

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
            // Nobody asked yet for this many of the open spots.
            toFind: c.toFind,
            declinedBy: declined.map((r) => plannerStaffById(r.staffId)).filter(Boolean),
            urgency: event.primary ? 'urgent' : 'warn'
          })
        }
      }
    }
    return out
  }, [planner, timelineVersion])

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

  /** Payment schedule for an event, with prototype-recorded payments applied. */
  const paymentsForEvent = useCallback(
    (eventId) => {
      const plan = payments[eventId]
      if (!plan) return null
      let paid = plan.paid
      const schedule = plan.schedule.map((p) => {
        if (p.state !== 'paid' && state.paidPaymentIds.includes(`${eventId}:${p.id}`)) {
          paid += p.amount
          return { ...p, state: 'paid', when: 'Recorded today', recordedHere: true }
        }
        return p
      })
      return { ...plan, paid, schedule }
    },
    [state.paidPaymentIds]
  )

  // ---- derived: ATTENTION -------------------------------------------------
  //
  // Everything above funnels into here. Each item answers the four questions
  // the product is built around: what happened, which event, why it matters,
  // what you can do next.

  const allAttention = useMemo(() => {
    const items = []

    // 1. Open spots. While nobody has been asked for a spot it is something to
    //    do; once everyone needed has been asked it is only something to wait on.
    for (const spot of openPositions) {
      const who = spot.declinedBy[0]
      const spotLink = `/staffing/${spot.event.id}?block=${spot.block.id}&role=${encodeURIComponent(spot.role)}`
      const base = {
        kind: 'staffing',
        eventId: spot.event.id,
        eventName: spot.event.name,
        meta: `${spot.block.name} · ${hourLabel(spot.block.start)}–${hourLabel(spot.block.end)}`,
        dismissible: false
      }
      if (spot.toFind > 0) {
        items.push({
          ...base,
          id: `openPosition:${spot.id}`,
          tone: spot.urgency,
          title: `${spot.block.name}: ${openSpotsText(spot.short)} for ${pluralRole(spot.role, spot.short)}`,
          what: who
            ? `${who.name} can't make the ${spot.block.name.toLowerCase()} shift.`
            : `${spot.accepted} of ${spot.required} ${pluralRole(spot.role, spot.required)} confirmed.`,
          why: spot.event.primary
            ? `${daysOutLabel(spot.event)}. Until it is filled, this block runs short-staffed.`
            : `${daysOutLabel(spot.event)}.`,
          actionLabel: spot.toFind === 1 ? 'Fill spot' : 'Fill spots',
          href: `${spotLink}&ask=1`
        })
      } else if (spot.pending > 0) {
        items.push({
          ...base,
          id: `waiting:${spot.id}`,
          tone: 'warn',
          title: `${spot.block.name}: waiting on ${spot.pending} ${spot.pending === 1 ? 'reply' : 'replies'} for ${pluralRole(spot.role, spot.short)}`,
          what: `You asked ${spot.pending} ${spot.pending === 1 ? 'person' : 'people'}. The spot stays open until someone says yes.`,
          why: `${daysOutLabel(spot.event)}. If nobody says yes, ask someone else.`,
          actionLabel: 'Check replies',
          href: spotLink
        })
      }
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
        dismissible: false,
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
        dismissible: true,
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
        dismissible: true,
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
        dismissible: true,
        actionLabel: 'Open documents',
        href: `/events/${d.eventId}/documents`
      })
    }

    // 5. Payments due
    for (const event of events) {
      const plan = paymentsForEvent(event.id)
      if (!plan) continue
      for (const p of plan.schedule) {
        if (p.state !== 'due') continue
        items.push({
          id: `pay:${event.id}:${p.id}`,
          kind: 'payment',
          tone: 'warn',
          title: `Collect the ${p.label.toLowerCase()} of ${money(p.amount)}`,
          what: `${money(plan.total - plan.paid)} of ${money(plan.total)} is still unpaid.`,
          why: `${daysOutLabel(event)}. The balance is due before the event.`,
          eventId: event.id,
          eventName: event.name,
          meta: p.when,
          dismissible: true,
          actionLabel: 'Open payments',
          href: `/events/${event.id}/payments`
        })
      }
    }

    const order = { urgent: 0, warn: 1, pending: 2, info: 3 }
    return items.sort((a, b) => (order[a.tone] ?? 9) - (order[b.tone] ?? 9))
  }, [openPositions, planner, messageList, taskList, documentList, paymentsForEvent])

  // Hidden items are still open; they are only kept out of the list.
  const attention = useMemo(
    () => allAttention.filter((i) => !state.dismissedAttentionIds.includes(i.id)),
    [allAttention, state.dismissedAttentionIds]
  )
  const hiddenAttention = useMemo(
    () => allAttention.filter((i) => state.dismissedAttentionIds.includes(i.id)),
    [allAttention, state.dismissedAttentionIds]
  )
  const dismissedCount = hiddenAttention.length

  const attentionForEvent = useCallback((eventId) => attention.filter((a) => a.eventId === eventId), [attention])

  const value = {
    hydrated,
    // collections
    taskList,
    messageList,
    documentList,
    paymentsForEvent,
    // staffing
    openPositions,
    coverageForEvent,
    // Up Next
    attention,
    attentionForEvent,
    hiddenAttention,
    dismissedCount,
    // actions
    toggleTask,
    submitGuestCount,
    markReplied,
    markRead,
    signDocument,
    unsignDocument,
    recordPayment,
    undoPayment,
    dismissAttention,
    restoreAttention,
    restoreAllAttention,
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
