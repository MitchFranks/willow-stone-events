'use client'

// ---------------------------------------------------------------------------
// SCREEN 3 — Calendar.
//
// A deliberately plain month grid. In a low-fidelity prototype a calendar's job
// is to show WHEN things sit relative to each other, not to be a scheduling
// surface — so each day is a box with chips in it, and the chips are links.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { events } from '@/lib/mock/events'
import { Breadcrumbs, Card, Icon, PageHeader, StatusBadge } from '@/components/ui/primitives'

// September 2026: the 1st is a Tuesday. Grid starts Monday.
const MONTH_DAYS = 30
const LEADING_BLANKS = 1
const TODAY = 17

const EVENTS_BY_DAY = {
  19: ['evt-1001'],
  24: ['evt-1002']
}

export default function CalendarPage() {
  const { coverageForEvent, attentionForEvent } = useStore()
  const cells = []
  for (let i = 0; i < LEADING_BLANKS; i += 1) cells.push(null)
  for (let d = 1; d <= MONTH_DAYS; d += 1) cells.push(d)

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calendar' }]} />
      <PageHeader
        title="Calendar"
        lead="September 2026"
      />

      <Card bodyClassName="px-2 py-2 sm:px-3 sm:py-3">
        <div className="grid grid-cols-7 gap-1 text-center text-label font-medium tracking-wide text-ink-muted">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} className="min-h-[72px] rounded-md border border-transparent" />
            const ids = EVENTS_BY_DAY[day] || []
            const isToday = day === TODAY
            return (
              <div
                key={day}
                className={
                  isToday
                    ? 'min-h-[72px] rounded-md border-2 border-accent bg-surface-sunken p-1'
                    : 'min-h-[72px] rounded-md border border-line bg-surface p-1'
                }
              >
                <div className={isToday ? 'text-label font-medium text-accent' : 'text-label text-ink-muted'}>
                  {day}
                  {isToday && <span className="ml-1 font-medium">Today</span>}
                </div>
                <div className="mt-1 space-y-1">
                  {ids.map((id) => {
                    const event = events.find((e) => e.id === id)
                    const needs = attentionForEvent(id).length
                    return (
                      <Link
                        key={id}
                        href={`/events/${id}`}
                        className={
                          needs
                            ? 'block truncate rounded-md border border-line-strong bg-surface-sunken px-1 py-0.5 text-label font-medium text-accent hover:bg-surface-sunken/70'
                            : 'block truncate rounded-md border border-status-clear-soft bg-status-clear-soft px-1 py-0.5 text-label font-medium text-status-clear'
                        }
                        title={event.name}
                      >
                        {event.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card title="Later in the season" icon="calendar">
          <ul className="space-y-2">
            {events
              .filter((e) => !['evt-1001', 'evt-1002'].includes(e.id))
              .map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center gap-2 text-body hover:text-accent">
                    <Icon name="chevronRight" size={13} className="text-ink-muted" />
                    <span className="font-medium">{e.name}</span>
                    <span className="text-label text-ink-muted">{e.dateShort}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </Card>

        <Card title="Key" icon="info">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="pending" size="sm">
              Has things to do
            </StatusBadge>
            <StatusBadge tone="done" size="sm">
              All set
            </StatusBadge>
            <span className="inline-flex items-center gap-1 rounded-pill border-2 border-accent px-2 py-0.5 text-label text-accent">
              Today
            </span>
          </div>
          <p className="mt-2 text-label text-ink-muted">
            This month is the only one populated in the prototype. Other months would work the same way.
          </p>
        </Card>
      </div>
    </div>
  )
}
