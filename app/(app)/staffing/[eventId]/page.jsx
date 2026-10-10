'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · Event crew (spec §B.2). The screen that does the whole
// job: needs, people, replies, warnings and backups, inline. Ask, reply,
// backfill, once per wedding. When every spot is confirmed it says so at the
// top, with anything still left to do spelled out.
// ---------------------------------------------------------------------------

import { Suspense, use, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { pluralRole } from '@/lib/mock/staff'
import { Alert, Breadcrumbs, Button, EmptyState, Icon, PageHeader, StatusBadge } from '@/components/ui/primitives'
import { openSpots } from '@/components/ui/domain'
import { SkeletonCards } from '@/components/staffing/Nav'
import { BlockCard } from '@/components/staffing/RoleCard'
import { TimeChart } from '@/components/staffing/TimeChart'
import { AskPanel } from '@/components/staffing/AskPanel'
import { SendReview } from '@/components/staffing/SendReview'
import { ChangeTimes, MarkOkDialog } from '@/components/staffing/ChangeTimes'
import { EditNeeds } from '@/components/staffing/EditNeeds'
import { WORLD } from '@/lib/staffing/adapter'
import {
  blockById,
  coverage,
  daysOutText,
  eventOf,
  eventRoles,
  eventSummary,
  firstName,
  fullyStaffed,
  rolesOf,
  stampLabel,
  weekdayOf
} from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const theName = (name) => (/^the /i.test(name) ? name : `The ${name}`)

/** The first role, in time order, that still has spots nobody was asked for (else any unfilled role). */
function firstOpenRole(base, st) {
  const blocks = base.blocks.slice().sort((x, y) => x.start - y.start)
  for (const pick of [(c) => c.toFind > 0, (c) => c.gap > 0]) {
    for (const b of blocks) {
      const role = rolesOf(b, st).find((r) => pick(coverage(base.id, b, r, st)))
      if (role) return { blockId: b.id, role }
    }
  }
  return null
}

function Crew({ eventId }) {
  const params = useSearchParams()
  const store = useStaffing2()
  const { state, hydrated } = store
  const [ask, setAsk] = useState(null)
  const [review, setReview] = useState(null)
  const [editing, setEditing] = useState(false)
  const [changing, setChanging] = useState(null)
  const [marking, setMarking] = useState(null)
  const [highlight, setHighlight] = useState(null) // a request id
  const [spot, setSpot] = useState(null) // { blockId, role } from an Up Next link
  const handledQuery = useRef(null)

  const closeAsk = useCallback(() => setAsk(null), [])
  const closeReview = useCallback(() => setReview(null), [])
  const doneReview = useCallback(() => {
    setReview(null)
    setAsk(null)
  }, [])
  const closeEditing = useCallback(() => setEditing(false), [])
  const closeChanging = useCallback(() => setChanging(null), [])
  const closeMarking = useCallback(() => setMarking(null), [])
  const changeFromReview = useCallback((id) => {
    setReview(null)
    setChanging(id)
  }, [])

  const base = WORLD.eventMap[eventId]
  const summary = base && hydrated ? eventSummary(eventId, state) : null
  const query = params.toString()

  // Deep links (Up Next, the events list). Handled once per distinct query, so
  // following a second Up Next link while already here still works.
  //   ?send=1                     opens Send review
  //   ?block=..&role=..&ask=1     opens the Ask panel for that role and block
  //   ?ask=1                      opens it for the first role with open spots
  //   ?block=..&role=..           scrolls to that role in that block and outlines it
  useEffect(() => {
    if (!hydrated || !base || handledQuery.current === query) return
    handledQuery.current = query
    const s = eventSummary(eventId, state)
    const block = base.blocks.find((b) => b.id === params.get('block')) || null
    const roleParam = params.get('role')
    const role = roleParam && eventRoles(eventId, state).includes(roleParam) ? roleParam : null
    if (params.get('send')) {
      const ids = s.unsent.length ? s.unsent.map((r) => r.id) : s.overdueRs.map((r) => r.id)
      if (ids.length) setReview({ ids })
      return
    }
    if (params.get('ask')) {
      const target = role ? { blockId: block?.id, role } : firstOpenRole(base, state)
      const targetBlock = target?.blockId ? blockById(target.blockId) : null
      const stillOpen = target && (targetBlock ? coverage(eventId, targetBlock, target.role, state).gap > 0 : true)
      if (stillOpen) {
        const blockIds = targetBlock && rolesOf(targetBlock, state).includes(target.role) ? [targetBlock.id] : undefined
        setAsk({ eventId, role: target.role, blockIds, mode: 'ask' })
        return
      }
      // The spot was filled since the link was made: show it instead of asking.
      if (target?.blockId) setSpot({ blockId: target.blockId, role: target.role })
      return
    }
    if (block && role) setSpot({ blockId: block.id, role })
    else if (block) document.getElementById(`block-${block.id}`)?.scrollIntoView({ block: 'start' })
  }, [hydrated, base, eventId, params, query, state])

  // The outline from a deep link is brief: it only says "this one".
  useEffect(() => {
    if (!spot && !highlight) return undefined
    const t = setTimeout(() => {
      setSpot(null)
      setHighlight(null)
    }, 4000)
    return () => clearTimeout(t)
  }, [spot, highlight])

  if (!base) {
    return (
      <EmptyState
        title="We couldn't find that event"
        icon="calendar"
        action={
          <Button href="/staffing" variant="primary">
            Back to events
          </Button>
        }
      />
    )
  }

  const ev = eventOf(state, eventId)
  const crumbs = <Breadcrumbs items={[{ label: 'Staffing Planner', href: '/staffing' }, { label: ev.name }]} />
  if (!hydrated) {
    return (
      <div>
        {crumbs}
        <SkeletonCards />
      </div>
    )
  }

  const roles = eventRoles(eventId, state)
  const rs = Object.values(state.requests).filter((r) => r.eventId === eventId)
  const unsentN = summary.unsent.length
  const done = fullyStaffed(summary)
  const showWarnings = () => {
    setHighlight(null)
    setTimeout(() => setHighlight(summary.toCheck[0].id), 0)
  }

  // ---- Notices: one Alert stack, at most 2, most important first ----
  const notices = []
  if (done) {
    // Done is done: leftovers are listed, but they never hide the success.
    const left = []
    if (unsentN) left.push(`send ${plural(unsentN, 'text', 'texts')} (button at the top)`)
    if (summary.waiting) left.push(`${plural(summary.waiting, 'person is', 'people are')} still waiting for a reply; a yes now makes them a backup`)
    if (summary.toCheck.length) left.push(`${plural(summary.toCheck.length, 'warning', 'warnings')} to look at, which don't change the staffing`)
    notices.push({
      key: 'done',
      tone: 'done',
      title: `${theName(ev.name)} is fully staffed.`,
      text: left.length ? `Every spot has someone confirmed. Still to do here: ${left.join('; ')}.` : 'Every spot has someone confirmed. Nothing else to do here.',
      action: (
        <div className="flex flex-wrap gap-2">
          {summary.toCheck.length > 0 && (
            <Button size="sm" onClick={showWarnings}>
              Show warnings
            </Button>
          )}
          <Button size="sm" variant="primary" href="/up-next">
            Back to Up Next
            <Icon name="arrowRight" size={13} />
          </Button>
        </div>
      )
    })
  }
  const dropped = rs
    .filter((r) => r.droppedOut)
    .filter((r) => r.blockIds.some((b) => blockById(b) && coverage(eventId, blockById(b), r.role, state).toFind > 0))
    .sort((a, b) => (a.respondedAt < b.respondedAt ? 1 : -1))[0]
  if (dropped) {
    const gaps = dropped.blockIds
      .filter((b) => blockById(b))
      .map((b) => ({ b: blockById(b), n: coverage(eventId, blockById(b), dropped.role, state).toFind }))
      .filter((x) => x.n > 0)
    const what = gaps.map((g) => `${g.b.name} has ${openSpots(g.n)}`).join(', ') + ` for ${pluralRole(dropped.role, 2)}.`
    const why = [dropped.reason, dropped.hoursBefore != null ? `told you ${dropped.hoursBefore} hours before call time` : null].filter(Boolean).join(', ')
    notices.push({
      key: 'drop',
      tone: 'urgent',
      text: `${firstName(dropped.staffId)} can't make it anymore${why ? ` (${why})` : ''}. ${what}`,
      action: (
        <Button
          size="sm"
          variant="primary"
          onClick={() => setAsk({ eventId, role: dropped.role, blockIds: gaps.map((g) => g.b.id), mode: 'backups', dropped })}
        >
          Find a replacement
        </Button>
      )
    })
  }
  if (summary.overdueRs.length) {
    const r = summary.overdueRs[0]
    const more = summary.overdueRs.length - 1
    notices.push({
      key: 'reply',
      tone: 'warn',
      text: `${firstName(r.staffId)} hasn't replied since ${weekdayOf(r.sentAt)}.${more > 0 ? ` ${more} more ${more === 1 ? 'is' : 'are'} past their reply-by time.` : ''}`,
      action: (
        <Button size="sm" onClick={() => setReview({ ids: summary.overdueRs.map((x) => x.id) })}>
          Remind
        </Button>
      )
    })
  }
  if (!done && summary.toCheck.length) {
    const n = summary.toCheck.length
    notices.push({
      key: 'check',
      tone: 'info',
      text: `${plural(n, 'person has', 'people have')} a warning about their day, like working outside their usual hours. It doesn't stop the event being fully staffed.`,
      action: (
        <Button size="sm" onClick={showWarnings}>
          Show them
        </Button>
      )
    })
  }

  const act = {
    ask: (role, blockIds) => setAsk({ eventId, role, blockIds, mode: 'ask' }),
    remind: (r) => setReview({ ids: [r.id] }),
    changeTimes: (r) => setChanging(r.id),
    simulate: (r, yes) => store.recordReply(r.id, yes),
    markOk: (r, hard) => (hard ? setMarking(r.id) : store.markOk(r.id, null)),
    phone: (r) => store.openPhone(r.staffId),
    remove: (r) => store.remove(r.id),
    promote: (r) => store.promote(r.id),
    applySuggestion: (s) => store.applySuggestion(eventId, s.blockId, s.role, s.suggested)
  }
  const noticePrimary = notices.some((n) => n.key === 'drop')
  const blocksInOrder = base.blocks.slice().sort((x, y) => x.start - y.start)
  // The first open spot gets the one filled "Ask people" button.
  let firstFindBlock = null
  for (const b of blocksInOrder) {
    const role = rolesOf(b, state).find((r) => coverage(eventId, b, r, state).toFind > 0)
    if (role) {
      firstFindBlock = { id: b.id, role }
      break
    }
  }
  const activity = state.activity.filter((a) => a.eventId === eventId).slice(0, 10)

  return (
    <div>
      {crumbs}
      <PageHeader
        title={ev.name}
        lead={`${ev.couple} · ${ev.dateShort} · ${daysOutText(ev)} · ${ev.expectedGuests} guests${ev.guaranteedCount ? ` (guarantee ${ev.guaranteedCount})` : ''}`}
        actions={
          <>
            {unsentN > 0 && (
              <Button variant="primary" onClick={() => setReview({ ids: summary.unsent.map((r) => r.id) })}>
                <Icon name="send" size={13} />
                Send {plural(unsentN, 'text', 'texts')}
              </Button>
            )}
            <Button onClick={() => setEditing(true)}>Change how many people you need</Button>
          </>
        }
      >
        {/* At most three: filled, waiting, open spots nobody was asked for. */}
        <div className="mt-4 flex flex-wrap gap-2">
          {done ? (
            <StatusBadge tone="done">Fully staffed</StatusBadge>
          ) : (
            <StatusBadge tone="info">
              {summary.filled} of {summary.spots} spots filled
            </StatusBadge>
          )}
          {summary.waiting > 0 && <StatusBadge tone="pending">{summary.waiting} waiting for a reply</StatusBadge>}
          {summary.toFind > 0 && <StatusBadge tone="warn">{openSpots(summary.toFind)} nobody was asked for</StatusBadge>}
        </div>
      </PageHeader>

      {notices.length > 0 && (
        <div className="mb-6 space-y-2">
          {notices.slice(0, 2).map((n) => (
            <Alert key={n.key} tone={n.tone} title={n.title} action={n.action}>
              {n.text}
            </Alert>
          ))}
        </div>
      )}

      {!roles.length ? (
        <EmptyState
          title="No crew needs yet."
          body="Add the roles this event needs, block by block."
          icon="users"
          action={
            <Button variant="primary" onClick={() => setEditing(true)}>
              Change how many people you need
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {blocksInOrder.map((b) => (
              <BlockCard
                key={b.id}
                eventId={eventId}
                block={b}
                st={state}
                primaryRole={!noticePrimary && b.id === firstFindBlock?.id ? firstFindBlock.role : null}
                guideRole={b.id === firstFindBlock?.id ? firstFindBlock.role : null}
                highlightRole={spot?.blockId === b.id ? spot.role : null}
                highlightId={highlight}
                act={act}
              />
            ))}
          </div>

          <details className="surface-card mt-6 px-4 py-3 sm:px-6">
            <summary className="cursor-pointer text-small font-medium text-ink">The day at a glance (chart)</summary>
            <div className="mt-3">
              <TimeChart eventId={eventId} blocks={blocksInOrder} roles={roles} st={state} />
            </div>
          </details>
        </>
      )}

      <details className="surface-card mt-4 px-4 py-3 sm:px-6">
        <summary className="cursor-pointer text-small font-medium text-ink">Replies and changes ({activity.length})</summary>
        {activity.length ? (
          <ul className="mt-2 space-y-1.5 text-small text-ink">
            {activity.map((a) => (
              <li key={a.id}>
                <span className="text-ink-muted">{stampLabel(a.at)} ·</span> {a.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-small text-ink-muted">Nothing yet. Asks, replies and changes show up here.</p>
        )}
      </details>

      {ask && (
        <AskPanel
          key={`${ask.role}-${ask.mode}-${(ask.blockIds || []).join()}`}
          config={ask}
          hidden={!!review}
          onClose={closeAsk}
          onAsk={(spec, opts) => setReview({ askSpec: spec, opts })}
        />
      )}
      {review && <SendReview prepared={review} onClose={closeReview} onDone={doneReview} onChangeTimes={changeFromReview} />}
      {editing && <EditNeeds eventId={eventId} onClose={closeEditing} />}
      {changing && <ChangeTimes requestId={changing} onClose={closeChanging} />}
      {marking && <MarkOkDialog requestId={marking} onClose={closeMarking} />}
    </div>
  )
}

export default function Staffing2EventPage({ params }) {
  const { eventId } = use(params)
  return (
    <Suspense fallback={null}>
      <Crew eventId={eventId} />
    </Suspense>
  )
}
