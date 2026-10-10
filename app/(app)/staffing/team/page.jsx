'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · Team (spec §B.7). Who is on the team, how loaded they
// are, and which dates they can't work. A list, not a week grid.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { cx } from '@/lib/cx'
import { Avatar, Card, EmptyState, Icon, PageHeader, StatusBadge } from '@/components/ui/primitives'
import { Staffing2Nav, SkeletonCards } from '@/components/staffing/Nav'
import { AwayDateForm } from '@/components/staffing/AwayDateForm'
import { WORLD } from '@/lib/staffing/adapter'
import { awayDateText, dayStartMin, monthDay, next30, rangeLabel } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'
import { TODAY_KEY } from '@/lib/mock/events'

const DAY_ORDER = ['Sat', 'Fri', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']

function usuallyFree(p) {
  const parts = DAY_ORDER.filter((d) => p.availability?.[d]?.length).map((d) => `${d} ${p.availability[d].map((w) => rangeLabel(w.start, w.end)).join(', ')}`)
  return parts.length ? parts.join(' · ') : 'No usual hours set'
}

export default function Staffing2TeamPage() {
  const { state, hydrated, removeAway } = useStaffing2()
  const [open, setOpen] = useState(null)

  return (
    <div>
      <PageHeader title="Team" lead="Who's on the team, how busy they are over the next 30 days, and the dates they can't work." />
      <Staffing2Nav />

      {!hydrated ? (
        <SkeletonCards count={4} />
      ) : !WORLD.staff.length ? (
        <EmptyState title="No team members yet." icon="users" />
      ) : (
        <Card title={`Team (${WORLD.staff.length})`} icon="users" bodyClassName="px-0 py-0">
          <ul className="-mx-5 -my-4">
            {WORLD.staff.map((p) => {
              const load = next30(p.id, state)
              const away = state.away.filter((a) => a.staffId === p.id).sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
              const nextAway = away.find((a) => (a.endDateKey || a.dateKey) >= TODAY_KEY)
              const isOpen = open === p.id
              return (
                <li key={p.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-sunken/50"
                  >
                    <Avatar initials={p.initials} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-body font-medium text-ink">
                        {p.name}
                        <span className="text-label font-normal text-ink-muted">{p.roles.join(' · ')}</span>
                        {p.pool && <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-label font-medium text-ink">On call</span>}
                      </span>
                      <span className="mt-0.5 block text-label text-ink-muted">Usually free: {usuallyFree(p)}</span>
                      <span className="mt-0.5 block text-label text-ink">
                        Next 30 days: {load.events} event{load.events === 1 ? '' : 's'} · {load.hours} h
                        {nextAway && <span className="text-ink-muted"> · Away {awayDateText(nextAway)}</span>}
                      </span>
                    </span>
                    <Icon name="chevronDown" size={15} className={cx('mt-1 shrink-0 text-ink-muted transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t border-line bg-surface-sunken/40 px-5 py-4">
                      <div>
                        <h3 className="text-small font-medium text-ink">Away dates</h3>
                        {away.length ? (
                          <ul className="mt-1.5 space-y-1.5">
                            {away.map((a) => (
                              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-small text-ink">
                                <span>
                                  {awayDateText(a)}
                                  <span className="ml-1.5 text-label text-ink-muted">added by {a.addedBy === 'staff' ? p.name.split(' ')[0] : 'you'}</span>
                                </span>
                                <button type="button" onClick={() => removeAway(a.id)} className="text-label font-medium text-accent hover:underline">
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-label text-ink-muted">None.</p>
                        )}
                      </div>
                      <div>
                        <h3 className="mb-1.5 text-small font-medium text-ink">Add away date</h3>
                        <AwayDateForm staffId={p.id} addedBy="manager" idPrefix={`team-away-${p.id}`} />
                      </div>
                      {p.credentials?.length > 0 && (
                        <div>
                          <h3 className="text-small font-medium text-ink">Certificates</h3>
                          <ul className="mt-1 space-y-1">
                            {p.credentials.map((c) => (
                              <li key={c.type} className="flex flex-wrap items-center gap-2 text-small text-ink">
                                Alcohol service: expires {monthDay(c.expiresOn)}, {c.expiresOn.slice(0, 4)}
                                {dayStartMin(c.expiresOn) - dayStartMin(TODAY_KEY) < 45 * 1440 && (
                                  <StatusBadge tone="warn" size="sm">
                                    Expires soon
                                  </StatusBadge>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-label text-ink-muted">
                        {p.phone} · {p.preferredHours}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
