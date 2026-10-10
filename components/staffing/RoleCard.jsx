'use client'

// ---------------------------------------------------------------------------
// One block at one event (spec §B.2 "Role cards"): per role, the coverage, a
// row per person with status, warnings and visible actions, open spots,
// backups, the quiet "Can't make it" list and the guest-count suggestion line.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import { cx } from '@/lib/cx'
import { Avatar, Button, Card, Icon, StatusBadge } from '@/components/ui/primitives'
import {
  blockById,
  coverage,
  fmtH,
  dayLine,
  firstName,
  okdIssues,
  openIssues,
  rangeLabel,
  rolesOf,
  staffById,
  suggestionText,
  suggestions,
  weekdayOf,
  whyText
} from '@/lib/staffing/derive'
import { CheckMark, OkdMark, OpenSpotChip, RequestStatus } from './StatusChip'

/* ---------------------------------------------------------------- person -- */

// Every action for a person is a visible button on their row: nothing hides
// behind a "⋯" menu. Waiting rows also carry the prototype helper that answers
// for staff, in a dashed box so it never reads as part of the real product.
function PersonRow({ r, st, highlight, act }) {
  const p = staffById(r.staffId)
  const first = firstName(r.staffId)
  const issues = r.status === 'cancelled' ? [] : openIssues(r, st)
  const okd = r.status === 'cancelled' ? [] : okdIssues(r, st)
  const real = issues.filter((i) => i.severity === 'soft' || i.severity === 'hard')
  const hard = real.some((i) => i.severity === 'hard')
  const waitingFor = r.status === 'pending' && r.confirmedBlockIds.length ? r.blockIds.filter((b) => !r.confirmedBlockIds.includes(b)) : []
  const ref = useRef(null)

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: 'center' })
  }, [highlight])

  return (
    <div
      ref={ref}
      data-request={r.id}
      className={cx(
        'flex items-start gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0 sm:px-6',
        highlight && 'bg-status-soon-soft/60',
        r.status === 'cancelled' && 'opacity-70'
      )}
    >
      <Avatar initials={p.initials} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-ink">
          {p.name}
          {p.roles.length > 1 && <span className="ml-1.5 text-label font-normal text-ink-muted">{p.roles.join(' · ')}</span>}
        </p>
        <p className="mt-0.5 text-label text-ink-muted">{dayLine(r)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <RequestStatus request={r} st={st} />
          {waitingFor.length > 0 && (
            <span className="text-label text-ink-muted">
              for {waitingFor.map((id) => blockById(id)?.name).join(' + ')}; still confirmed for {r.confirmedBlockIds.map((id) => blockById(id)?.name).join(' + ')}
            </span>
          )}
        </div>
        {(real.length > 0 || okd.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CheckMark issues={issues} />
            <OkdMark overrides={okd} />
          </div>
        )}

        {r.status !== 'cancelled' && (
          <div className="mt-2 flex flex-wrap gap-2">
            {r.status === 'pending' && (
              <Button size="sm" onClick={() => act.remind(r)}>
                Remind
              </Button>
            )}
            {real.length > 0 && (
              <Button size="sm" onClick={() => act.markOk(r, hard)}>
                {hard ? "It's fine, add a reason" : "It's fine"}
              </Button>
            )}
            <Button size="sm" onClick={() => act.changeTimes(r)}>
              Change times
            </Button>
            <Button size="sm" variant="ghost" onClick={() => act.remove(r)}>
              Remove from this event
            </Button>
          </div>
        )}

        {r.status === 'pending' && (
          <div className="mt-3 rounded-md border border-dashed border-line-strong px-3 py-2.5">
            <p className="text-label text-ink-muted">
              <span className="font-medium text-ink">Prototype only:</span> answer for {first}, as if {first} replied to the text.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => act.simulate(r, true)}>
                Simulate: says yes
              </Button>
              <Button size="sm" onClick={() => act.simulate(r, false)}>
                Simulate: can&apos;t make it
              </Button>
              <Button size="sm" variant="ghost" onClick={() => act.phone(r)}>
                <Icon name="phone" size={13} />
                Open {first}&apos;s phone
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ role -- */

// One role inside one block. `highlight` (from an Up Next link) scrolls it into
// view and outlines it, plainly, for a few seconds.
function RoleSection({ eventId, block, role, st, primary, guide, highlight, highlightId, act }) {
  const [why, setWhy] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: 'start' })
  }, [highlight])

  const c = coverage(eventId, block, role, st)
  const rs = Object.values(st.requests).filter((r) => r.eventId === eventId && r.role === role && r.blockIds.includes(block.id))
  const order = { accepted: 0, pending: 1, draft: 2, cancelled: 3 }
  const rows = rs
    .filter((r) => ['accepted', 'pending', 'draft'].includes(r.status) || (r.status === 'cancelled' && r.cancelNotice === 'queued'))
    .sort((a, b) => order[a.status] - order[b.status] || staffById(a.staffId).name.localeCompare(staffById(b.staffId).name))
  const backups = rs.filter((r) => r.status === 'backup')
  const saidNo = rs.filter((r) => r.status === 'declined')
  const sugg = suggestions(eventId, st).filter((s) => s.blockId === block.id && s.role === role)
  const done = c.confirmed >= c.need

  return (
    <div
      ref={ref}
      id={`role-${block.id}-${role.replace(/\s+/g, '-')}`}
      className={cx('scroll-mt-24 border-b border-line last:border-b-0', highlight && 'outline-2 -outline-offset-2 outline-accent')}
    >
      <div className="flex flex-wrap items-center gap-2 bg-surface-sunken px-4 py-2.5 sm:px-6">
        <span className="text-small font-medium text-ink">{role}</span>
        <span className="flex-1 text-label text-ink-muted">
          {c.filled} of {c.need} confirmed
          {c.extra > 0 && ` · ${c.extra} extra`}
        </span>
        {done ? (
          <StatusBadge tone="done" size="sm">
            Fully staffed
          </StatusBadge>
        ) : (
          <span className="inline-flex" data-guide={guide ? 'planner-ask' : undefined}>
            <Button size="sm" variant={primary && c.toFind ? 'primary' : 'secondary'} onClick={() => act.ask(role, [block.id])}>
              Ask people
            </Button>
          </span>
        )}
      </div>

      {rows.map((r) => (
        <PersonRow key={r.id} r={r} st={st} act={act} highlight={highlightId === r.id} />
      ))}

      {c.toFind > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-dashed border-line px-4 py-2.5 sm:px-6">
          <OpenSpotChip count={c.toFind} />
          <span className="flex-1 text-label text-ink-muted">Nobody has been asked yet</span>
        </div>
      )}

      {backups.length > 0 && (
        <div className="border-t border-line px-4 py-3 sm:px-6">
          <p className="text-label font-medium text-ink">Backups ({backups.length})</p>
          <p className="mb-1.5 text-label text-ink-muted">They said yes after the spots were full. Confirm one if a spot opens.</p>
          <ul className="space-y-1.5">
            {backups.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 text-label text-ink-muted">
                <StatusBadge tone="info" size="sm">
                  Backup
                </StatusBadge>
                <span className="flex-1">
                  {staffById(r.staffId).name}, said yes {r.respondedAt ? weekdayOf(r.respondedAt) : ''}
                </span>
                <Button size="sm" onClick={() => act.promote(r)}>
                  Confirm {firstName(r.staffId)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {saidNo.length > 0 && (
        <details className="border-t border-line px-4 py-3 sm:px-6">
          <summary className="cursor-pointer text-label font-medium text-ink-muted">Can&apos;t make it ({saidNo.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {saidNo.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 text-label text-ink-muted">
                <span className="font-medium text-ink">{staffById(r.staffId).name}</span>
                <RequestStatus request={r} st={st} />
                {r.reason && <span>{r.reason.replace(/ — .*$/, '')}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {sugg.map((x) => (
        <div key={`${x.blockId}-${x.role}`} className="border-t border-line px-4 py-2.5 text-label text-ink-muted sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="info" size={12} />
            <span className="flex-1">{suggestionText(x)}</span>
            <Button size="sm" onClick={() => act.applySuggestion(x)}>
              Use {x.suggested}
            </Button>
            <Button size="sm" variant="ghost" aria-expanded={why} onClick={() => setWhy(!why)}>
              Why?
            </Button>
          </div>
          {why && <p className="mt-1.5 pl-5 leading-relaxed">{whyText(role, x.rule)}</p>}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ card -- */

// One timeline block with the roles that staff it. Blocks are listed in time
// order on the page, so the day reads top to bottom.
export function BlockCard({ eventId, block, st, primaryRole, guideRole, highlightRole, highlightId, act }) {
  const roles = rolesOf(block, st)

  return (
    <section id={`block-${block.id}`} className="scroll-mt-24">
      <Card
        title={block.name}
        subtitle={
          <span>
            {rangeLabel(block.start, block.end)}
            {block.guestStart != null && <span> (guests {fmtH(block.guestStart)})</span>}
          </span>
        }
        bodyClassName="px-0 py-0"
      >
        {roles.map((role) => (
          <RoleSection
            key={role}
            eventId={eventId}
            block={block}
            role={role}
            st={st}
            primary={primaryRole === role}
            guide={guideRole === role}
            highlight={highlightRole === role}
            highlightId={highlightId}
            act={act}
          />
        ))}
      </Card>
    </section>
  )
}
