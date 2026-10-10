'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · Team (spec §B.7). The planning view of people: when each
// person is usually free, how loaded they are over the next 30 days, and the
// dates they can't work. Contact details and profiles live in the Staff
// Directory (/staff); each row links there. ?who=<staffId> opens that person.
// ---------------------------------------------------------------------------

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { cx } from '@/lib/cx'
import { Avatar, Button, Card, EmptyState, Icon, PageHeader, StatusBadge } from '@/components/ui/primitives'
import { Staffing2Nav, SkeletonCards } from '@/components/staffing/Nav'
import { AwayDateForm } from '@/components/staffing/AwayDateForm'
import { WORLD } from '@/lib/staffing/adapter'
import { awayDateText, dayStartMin, monthDay, next30, usuallyFreeText } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'
import { TODAY_KEY } from '@/lib/mock/events'

function TeamList() {
  const params = useSearchParams()
  const { state, hydrated, removeAway } = useStaffing2()
  const [open, setOpen] = useState(null)
  const handled = useRef(null)
  const rowRefs = useRef({})

  // A link from the Staff Directory opens that person's row and brings it into view.
  const who = params.get('who')
  useEffect(() => {
    if (!hydrated || !who || handled.current === who || !WORLD.staffMap[who]) return
    handled.current = who
    setOpen(who)
    rowRefs.current[who]?.scrollIntoView({ block: 'start' })
  }, [hydrated, who])

  if (!hydrated) return <SkeletonCards count={4} />
  if (!WORLD.staff.length) return <EmptyState title="No team members yet." icon="users" />

  return (
    <Card title={`Team (${WORLD.staff.length})`} icon="users" bodyClassName="px-0 py-0">
      <ul>
        {WORLD.staff.map((p) => {
          const load = next30(p.id, state)
          const away = state.away.filter((a) => a.staffId === p.id).sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
          const nextAway = away.find((a) => (a.endDateKey || a.dateKey) >= TODAY_KEY)
          const isOpen = open === p.id
          const inDirectory = !p.pool
          return (
            <li
              key={p.id}
              ref={(el) => {
                rowRefs.current[p.id] = el
              }}
              className={cx('scroll-mt-24 border-b border-line last:border-b-0', isOpen && who === p.id && 'outline-2 -outline-offset-2 outline-accent')}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : p.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunken sm:px-6"
              >
                <Avatar initials={p.initials} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-body font-medium text-ink">
                    {p.name}
                    <span className="text-label font-normal text-ink-muted">{p.roles.join(' · ')}</span>
                    {p.pool && (
                      <StatusBadge tone="info" size="sm">
                        On call
                      </StatusBadge>
                    )}
                  </span>
                  <span className="mt-0.5 block text-small text-ink-muted">Usually free: {usuallyFreeText(p)}</span>
                  <span className="mt-0.5 block text-small text-ink">
                    Next 30 days: {load.events} event{load.events === 1 ? '' : 's'} · {load.hours} h
                    {nextAway && <span className="text-ink-muted"> · Away {awayDateText(nextAway)}</span>}
                  </span>
                </span>
                <Icon name="chevronDown" size={15} className={cx('mt-1 shrink-0 text-ink-muted transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-line px-4 py-4 sm:px-6">
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
                            <Button size="sm" variant="ghost" onClick={() => removeAway(a.id)}>
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-small text-ink-muted">None.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-small font-medium text-ink">Add an away date</h3>
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
                  {inDirectory ? (
                    <Button href={`/staff/${p.id}`} size="sm">
                      Profile, contact and requests
                      <Icon name="arrowRight" size={13} />
                    </Button>
                  ) : (
                    <p className="text-small text-ink-muted">On-call helper, not in the Staff Directory{p.phone ? ` · ${p.phone}` : ''}.</p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default function Staffing2TeamPage() {
  return (
    <div>
      <PageHeader
        title="Team"
        lead="For planning: when each person is usually free, how busy they are over the next 30 days, and the dates they can't work. Contact details are in the Staff Directory."
      />
      <Staffing2Nav />
      <Suspense fallback={<SkeletonCards count={4} />}>
        <TeamList />
      </Suspense>
    </div>
  )
}
