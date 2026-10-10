'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · Event crew (spec §B.2). The screen that does the whole
// job: needs, people, replies, warnings and backups, inline. Ask, reply,
// backfill, once per wedding.
// ---------------------------------------------------------------------------

import { Suspense, use, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { pluralRole } from '@/lib/mock/staff'
import { Alert, Breadcrumbs, Button, Card, EmptyState, Icon, PageHeader } from '@/components/ui/primitives'
import { SkeletonCards } from '@/components/staffing/Nav'
import { Chip } from '@/components/staffing/StatusChip'
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
  fmtH,
  rolesOf,
  stampLabel,
  weekdayOf
} from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

function Crew({ eventId }) {
  const params = useSearchParams()
  const store = useStaffing2()
  const { state, hydrated } = store
  const [ask, setAsk] = useState(null)
  const [review, setReview] = useState(null)
  const [editing, setEditing] = useState(false)
  const [changing, setChanging] = useState(null)
  const [marking, setMarking] = useState(null)
  const [highlight, setHighlight] = useState(null)
  const deepLinked = useRef(false)

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

  // Deep links from the events list: ?send=1 opens Send review, ?ask=1 the Ask panel.
  useEffect(() => {
    if (!hydrated || !base || deepLinked.current) return
    deepLinked.current = true
    const s = eventSummary(eventId, state)
    if (params.get('send')) {
      const ids = s.unsent.length ? s.unsent.map((r) => r.id) : s.overdueRs.map((r) => r.id)
      if (ids.length) setReview({ ids })
    } else if (params.get('ask')) {
      const role = Object.keys(s.findByRole)[0]
      if (role) setAsk({ eventId, role, mode: 'ask' })
    }
  }, [hydrated, base, eventId, params, state])

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

  // ---- Notices (at most 3; priority order) ----
  const notices = []
  const dropped = rs
    .filter((r) => r.droppedOut)
    .filter((r) => r.blockIds.some((b) => blockById(b) && coverage(eventId, blockById(b), r.role, state).toFind > 0))
    .sort((a, b) => (a.respondedAt < b.respondedAt ? 1 : -1))[0]
  if (dropped) {
    const gaps = dropped.blockIds
      .filter((b) => blockById(b))
      .map((b) => ({ b: blockById(b), n: coverage(eventId, blockById(b), dropped.role, state).toFind }))
      .filter((x) => x.n > 0)
    const same = gaps.every((g) => g.n === gaps[0].n)
    const names = gaps.map((g) => g.b.name).join(' and ')
    const what = same
      ? `${names} ${gaps.length > 1 ? 'each need' : 'needs'} ${gaps[0].n} more ${pluralRole(dropped.role, gaps[0].n)}.`
      : gaps.map((g) => `${g.b.name} needs ${g.n} more`).join(', ') + ` ${pluralRole(dropped.role, 2)}.`
    const why = [dropped.reason, dropped.hoursBefore != null ? `told you ${dropped.hoursBefore} hours before call time` : null].filter(Boolean).join(', ')
    notices.push({
      key: 'drop',
      tone: 'warn',
      text: `${firstName(dropped.staffId)} can't make it anymore${why ? ` (${why})` : ''}. ${what}`,
      action: (
        <Button
          size="sm"
          variant="primary"
          onClick={() => setAsk({ eventId, role: dropped.role, blockIds: gaps.map((g) => g.b.id), mode: 'backups', dropped })}
        >
          Ask backups
        </Button>
      )
    })
  }
  if (summary.toCheck.length) {
    const n = summary.toCheck.length
    const allSeed = summary.toCheck.every((r) => r.source === 'seed')
    notices.push({
      key: 'check',
      tone: 'info',
      text: allSeed
        ? `${n} ${n === 1 ? 'person is' : 'people are'} scheduled outside their usual hours.`
        : `${n} ${n === 1 ? 'person has' : 'people have'} something to check.`,
      action: (
        <Button
          size="sm"
          onClick={() => {
            setHighlight(null)
            setTimeout(() => setHighlight(summary.toCheck[0].id), 0)
          }}
        >
          Show them
        </Button>
      )
    })
  }
  if (summary.overdueRs.length) {
    const r = summary.overdueRs[0]
    const more = summary.overdueRs.length - 1
    notices.push({
      key: 'reply',
      tone: 'info',
      text: `${firstName(r.staffId)} hasn't replied since ${weekdayOf(r.sentAt)}.${more > 0 ? ` ${more} more waiting past their reply-by time.` : ''}`,
      action: (
        <Button size="sm" onClick={() => setReview({ ids: summary.overdueRs.map((x) => x.id) })}>
          Remind
        </Button>
      )
    })
  }

  const act = {
    ask: (role, blockIds) => setAsk({ eventId, role, blockIds, mode: 'ask' }),
    remind: (r) => setReview({ ids: [r.id] }),
    changeTimes: (r) => setChanging(r.id),
    record: (r, yes) => store.recordReply(r.id, yes),
    markOk: (r, hard) => (hard ? setMarking(r.id) : store.markOk(r.id, null)),
    phone: (r) => store.openPhone(r.staffId),
    remove: (r) => store.remove(r.id),
    promote: (r) => store.promote(r.id),
    applySuggestion: (s) => store.applySuggestion(eventId, s.blockId, s.role, s.suggested)
  }
  const noticePrimary = notices.some((n) => n.key === 'drop')
  const blocksInOrder = base.blocks.slice().sort((x, y) => x.start - y.start)
  let firstFindBlock = null
  // The guide points at the first open spot, or at the first Ask people if everything is filled.
  let guideAsk = null
  for (const b of blocksInOrder) {
    const role = rolesOf(b, state).find((r) => coverage(eventId, b, r, state).toFind > 0)
    if (role) {
      firstFindBlock = { id: b.id, role }
      break
    }
  }
  if (firstFindBlock) guideAsk = firstFindBlock
  else {
    const b = blocksInOrder.find((x) => rolesOf(x, state).length)
    if (b) guideAsk = { id: b.id, role: rolesOf(b, state)[0] }
  }
  const unsentN = summary.unsent.length
  const activity = state.activity.filter((a) => a.eventId === eventId).slice(0, 10)
  const allSet = summary.filled === summary.spots && !summary.toFind && !summary.waiting && !unsentN && !summary.toCheck.length

  return (
    <div>
      {crumbs}
      <PageHeader
        title={ev.name}
        lead={`${ev.couple} · ${ev.dateShort} · ${daysOutText(ev)} · ${ev.expectedGuests} guests${ev.guaranteedCount ? ` (guarantee ${ev.guaranteedCount})` : ' (no guarantee yet)'}`}
        actions={
          <>
            {unsentN > 0 && (
              <Button variant="primary" onClick={() => setReview({ ids: summary.unsent.map((r) => r.id) })}>
                <Icon name="send" size={13} />
                Send {unsentN} text{unsentN === 1 ? '' : 's'}
              </Button>
            )}
            <Button onClick={() => setEditing(true)}>Edit needs</Button>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap gap-2">
          {allSet || summary.filled === summary.spots ? (
            <Chip tone="done" icon="check" title="Only people who said yes count as filled">
              All {summary.spots} spots filled
            </Chip>
          ) : (
            <Chip tone="neutral" icon="check" title="Filled: people who said yes. Only Confirmed counts.">
              {summary.filled} of {summary.spots} spots filled
            </Chip>
          )}
          {summary.waiting > 0 && (
            <Chip tone="pending" icon="clock" title="Waiting: asked, no reply yet">
              {summary.waiting} waiting
            </Chip>
          )}
          {summary.toFind > 0 && (
            <Chip tone="warn" icon="plus" title="To find: open spots nobody has been asked for yet">
              {summary.toFind} to find
            </Chip>
          )}
          {summary.toCheck.length > 0 && (
            <Chip tone="warn" icon="alert" title="To check: people with something to look at, like times outside their usual hours">
              {summary.toCheck.length} to check
            </Chip>
          )}
          {unsentN > 0 && (
            <Chip tone="empty" icon="dash" title="Not sent: saved or changed, and the text has not gone out">
              {unsentN} not sent
            </Chip>
          )}
        </div>
      </PageHeader>

      {notices.length > 0 && (
        <div className="mb-5 space-y-2">
          {notices.slice(0, 3).map((n) => (
            <Alert key={n.key} tone={n.tone} action={n.action}>
              <span className="text-small">{n.text}</span>
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
              Edit needs
            </Button>
          }
        />
      ) : (
        <>
          <TimeChart eventId={eventId} blocks={blocksInOrder} roles={roles} st={state} />
          <div className="space-y-4">
            {blocksInOrder.map((b) => (
              <BlockCard
                key={b.id}
                eventId={eventId}
                block={b}
                st={state}
                primaryRole={!noticePrimary && b.id === firstFindBlock?.id ? firstFindBlock.role : null}
                guideRole={b.id === guideAsk?.id ? guideAsk.role : null}
                highlightId={highlight}
                act={act}
              />
            ))}
          </div>
        </>
      )}

      <details className="surface-card mt-5 px-5 py-3.5">
        <summary className="cursor-pointer text-body font-medium text-ink">Replies and changes ({activity.length})</summary>
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
