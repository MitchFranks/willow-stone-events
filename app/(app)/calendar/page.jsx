'use client'

// ---------------------------------------------------------------------------
// SCREEN 3 — Calendar.
//
// A deliberately plain month grid. In a low-fidelity prototype a calendar's job
// is to show WHEN things sit relative to each other, not to be a scheduling
// surface, so each day is a box with chips in it, and the chips are links.
// The grid is built from the events list (each event's dateKey), so any month
// can be shown; months with no events say so instead of looking broken.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { TODAY_KEY, events } from '@/lib/mock/events'
import { Breadcrumbs, Button, Card, Icon, ListRow, PageHeader, StatusBadge } from '@/components/ui/primitives'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const pad = (n) => String(n).padStart(2, '0')
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const monthName = (y, m) =>
  new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const [TODAY_Y, TODAY_M] = TODAY_KEY.split('-').map(Number)

/** The chip's tone: the same three states the legend lists. */
function chipTone(items) {
  if (items.some((a) => a.tone === 'urgent')) return 'urgent'
  if (items.length) return 'warn'
  return 'done'
}

const LEGEND = [
  { tone: 'urgent', label: 'Has something to do first' },
  { tone: 'warn', label: 'Has things coming up' },
  { tone: 'done', label: 'All set' }
]

/** The "Today" marker, used in the grid and in the legend so they match. */
function TodayMark() {
  return (
    <StatusBadge tone="info" size="sm">
      Today
    </StatusBadge>
  )
}

export default function CalendarPage() {
  const { attentionForEvent } = useStore()
  // Months counted from January of year 0 so prev/next is a plain +1 / -1.
  const [month, setMonth] = useState(TODAY_Y * 12 + (TODAY_M - 1))
  const y = Math.floor(month / 12)
  const m = month % 12
  const isThisMonth = y === TODAY_Y && m === TODAY_M - 1

  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const leading = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7 // grid starts Monday
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const prefix = `${y}-${pad(m + 1)}-`
  const monthEvents = events.filter((e) => e.dateKey.startsWith(prefix))
  const upcoming = events.filter((e) => e.dateKey >= TODAY_KEY).sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calendar' }]} />
      <PageHeader title="Calendar" lead="When each event sits, and which ones still need something." />

      <Card
        title={monthName(y, m)}
        icon="calendar"
        subtitle={monthEvents.length ? `${monthEvents.length} ${monthEvents.length === 1 ? 'event' : 'events'}` : 'No events'}
        action={
          <div className="flex items-center gap-1">
            {!isThisMonth && (
              <Button size="sm" variant="ghost" onClick={() => setMonth(TODAY_Y * 12 + (TODAY_M - 1))}>
                This month
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setMonth((x) => x - 1)} aria-label="Previous month">
              <Icon name="arrowLeft" size={14} />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMonth((x) => x + 1)} aria-label="Next month">
              <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        }
        bodyClassName="px-2 py-2 sm:px-3 sm:py-3"
      >
        <div className="grid grid-cols-7 gap-1 text-center text-label font-medium text-ink-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} className="min-h-[72px]" />
            const key = keyOf(y, m, day)
            const dayEvents = monthEvents.filter((e) => e.dateKey === key)
            const isToday = key === TODAY_KEY
            return (
              <div
                key={key}
                className={
                  isToday
                    ? 'min-h-[72px] min-w-0 rounded-md border-2 border-accent bg-surface p-1'
                    : 'min-h-[72px] min-w-0 rounded-md border border-line bg-surface p-1'
                }
              >
                <div className="flex flex-wrap items-center gap-1 text-label text-ink-muted">
                  <span className={isToday ? 'font-medium text-ink' : undefined}>{day}</span>
                  {isToday && <TodayMark />}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`} title={event.name} className="block max-w-full hover:underline">
                      <StatusBadge tone={chipTone(attentionForEvent(event.id))} size="sm" className="max-w-full overflow-hidden">
                        <span className="min-w-0 truncate">{event.name}</span>
                      </StatusBadge>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {monthEvents.length === 0 && (
          <p className="mt-3 px-1 text-small text-ink-muted">
            Nothing is booked in {monthName(y, m)}. Use the arrows to move between months.
          </p>
        )}
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card title="Upcoming events" icon="list" bodyClassName="px-0 py-0">
          {upcoming.map((e) => (
            <ListRow key={e.id} href={`/events/${e.id}`} title={e.name} sub={`${e.dateShort} · ${e.type}`} />
          ))}
        </Card>

        <Card title="Key" icon="info">
          <ul className="flex flex-wrap gap-2">
            {LEGEND.map((l) => (
              <li key={l.tone}>
                <StatusBadge tone={l.tone} size="sm">
                  {l.label}
                </StatusBadge>
              </li>
            ))}
            <li className="flex items-center gap-1.5 text-small text-ink-muted">
              <TodayMark /> outlined day
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
