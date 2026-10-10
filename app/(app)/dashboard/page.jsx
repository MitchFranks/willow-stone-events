'use client'

// ---------------------------------------------------------------------------
// SCREEN 1 — Dashboard (entry screen).
//
// ENTRY SIGNIFIES THE CAPABILITY: the first line on the page states the product
// promise in plain words, and the very next block is the attention queue. There
// are no vanity metrics above it — the counters that do appear all describe
// work, and each one is a link into that work.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { events, venue } from '@/lib/mock/events'
import { Card, Icon, MetricTile, PageHeader, StatusBadge } from '@/components/ui/primitives'
import { UpNextItem, EventCard } from '@/components/ui/domain'

export default function DashboardPage() {
  const { attention, openPositions, coverageForEvent, attentionForEvent, messageList, taskList } = useStore()

  const urgent = attention.filter((a) => a.tone === 'urgent')
  const soon = attention.filter((a) => a.tone !== 'urgent')
  const unreplied = messageList.filter((m) => m.needsReply && !m.replied).length
  const openTasks = taskList.filter((t) => !t.done).length
  const upcoming = events.slice(0, 3)

  return (
    <div>
      <PageHeader
        title="Here's what to tackle next across your weddings."
        lead={`${venue.name} · ${venue.today}`}
      />

      {/* Counters that describe WORK, not vanity metrics. Each is a route in. */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        <MetricTile
          label="Open positions"
          value={openPositions.length}
          tone={openPositions.length ? 'accent' : 'done'}
          sub={openPositions.length ? 'Positions to fill' : 'Every position filled'}
          href="/staffing"
        />
        <MetricTile
          label="Awaiting reply"
          value={unreplied}
          tone={unreplied ? 'accent' : 'done'}
          sub="Couple and vendor messages"
          href="/messages"
        />
        <MetricTile label="Open tasks" value={openTasks} sub="Across all events" href="/events/evt-1001/tasks" />
      </div>

      {/* ---- THE up-next block. Visually dominant by design. ---- */}
      <section className="mb-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-heading font-medium text-ink">
              <Icon name="list" size={17} className="text-accent" />
              Up next
            </h2>
          </div>
          <Link href="/up-next" className="text-label text-accent underline-offset-2 hover:underline">
            See everything ({attention.length})
          </Link>
        </div>

        {attention.length === 0 ? (
          <Card>
            <p className="py-4 text-center text-body text-ink-muted">
              You&apos;re all caught up. Every event is fully staffed.
            </p>
          </Card>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface shadow-raised">
            {urgent.slice(0, 3).map((item, i) => (
              <UpNextItem key={item.id} item={item} badge first={i === 0} />
            ))}
            {soon.slice(0, 2).map((item, i) => (
              <UpNextItem key={item.id} item={item} badge compact first={urgent.length === 0 && i === 0} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* ---- Upcoming events ---- */}
        <section>
          <div className="mb-2 flex items-end justify-between gap-2">
            <h2 className="text-heading font-medium text-ink">Upcoming events</h2>
            <Link href="/events" className="text-label text-accent underline-offset-2 hover:underline">
              All events
            </Link>
          </div>
          <div className="space-y-2.5">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                coverage={coverageForEvent(event.id)}
                attentionCount={attentionForEvent(event.id).length}
              />
            ))}
          </div>
        </section>

        {/* ---- Staffing coverage at a glance ---- */}
        <section>
          <div className="mb-2 flex items-end justify-between gap-2">
            <h2 className="text-heading font-medium text-ink">Staffing status</h2>
            <Link href="/staffing" className="text-label text-accent underline-offset-2 hover:underline">
              Weekly schedule
            </Link>
          </div>
          <Card bodyClassName="px-0 py-0">
            {events.map((event) => {
              const cov = coverageForEvent(event.id)
              return (
                <Link
                  key={event.id}
                  href={`/staffing/${event.id}`}
                  className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-surface-sunken"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body font-medium text-ink">{event.name}</div>
                    <div className="mt-0.5 text-label text-ink-muted">
                      {cov.filled} of {cov.required} roles confirmed
                      {cov.pending > 0 && ` · ${cov.pending} pending`}
                    </div>
                    {/* Placeholder-style coverage bar — wireframe, not a chart. */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill border border-line bg-surface-sunken">
                      <div
                        className={cx2(cov.complete ? 'bg-status-clear' : 'bg-status-now', 'h-full')}
                        style={{ width: `${cov.required ? (cov.filled / cov.required) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {cov.complete ? (
                    <StatusBadge tone="done" size="sm">
                      OK
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="urgent" size="sm">
                      -{cov.short}
                    </StatusBadge>
                  )}
                </Link>
              )
            })}
          </Card>

          <div className="mt-3">
            <Card title="Today" subtitle={venue.today} icon="calendar">
              <ul className="space-y-2 text-label">
                <li className="flex gap-2">
                  <span className="w-16 shrink-0 font-medium text-ink">8:42 AM</span>
                  <span className="text-ink-muted">Emily Johnson asked to move decorating to 9:00 AM</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-16 shrink-0 font-medium text-ink">7:15 AM</span>
                  <span className="text-ink-muted">Harvest Table asked for the guarantee</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-16 shrink-0 font-medium text-ink">Yesterday</span>
                  <span className="text-ink-muted">Jake Pearson declined the Johnson ceremony assignment</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

// Tiny local helper so this file does not need the cx import for one use.
function cx2(...parts) {
  return parts.filter(Boolean).join(' ')
}
