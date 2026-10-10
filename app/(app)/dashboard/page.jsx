'use client'

// ---------------------------------------------------------------------------
// SCREEN 1 — Dashboard (entry screen).
//
// ENTRY SIGNIFIES THE CAPABILITY: the first line on the page states the product
// promise in plain words, and the very next block is Up Next. There are no
// vanity metrics above it — the counters below it all describe work, and each
// one is a link into that work.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useStaffing2 } from '@/lib/staffing/store'
import { agoLabel } from '@/lib/staffing/derive'
import { events, eventById, venue } from '@/lib/mock/events'
import { activityLog } from '@/lib/mock/records'
import { Card, EmptyState, ListRow, MetricTile, PageHeader, StatusBadge } from '@/components/ui/primitives'
import { UpNextItem, EventCard, openSpots } from '@/components/ui/domain'

const LINK = 'text-small text-accent underline-offset-4 hover:underline'

export default function DashboardPage() {
  const { attention, openPositions, coverageForEvent, attentionForEvent, messageList } = useStore()
  const { state: planner } = useStaffing2()

  const urgent = attention.filter((a) => a.tone === 'urgent')
  const soon = attention.filter((a) => a.tone !== 'urgent')
  const spots = openPositions.reduce((n, p) => n + p.short, 0)
  const unreplied = messageList.filter((m) => m.needsReply && !m.replied).length
  const tasksDue = attention.filter((a) => a.kind === 'task').length
  const upcoming = events.slice(0, 3)

  // Recent activity, derived from real state so every line can be found again
  // where it lives: planner replies and asks first (newest), then the sample
  // activity log. A log entry links to its message when there is one.
  const recent = [
    ...(planner.activity || []).slice(0, 3).map((a) => ({
      id: a.id,
      title: eventById(a.eventId)?.name || 'Staffing Planner',
      text: a.text,
      when: agoLabel(a.at, planner),
      href: `/staffing/${a.eventId}`
    })),
    ...activityLog.map((h) => {
      const message = messageList.find((m) => m.from === h.who && m.eventId === h.eventId)
      return {
        id: h.id,
        title: h.who,
        text: h.what,
        when: `${h.when} · ${eventById(h.eventId)?.name || 'No event'}`,
        href: message ? `/messages/${message.id}` : `/events/${h.eventId}`
      }
    })
  ]

  return (
    <div>
      <PageHeader
        title="Here's what to tackle next across your weddings."
        lead={`${venue.name} · ${venue.today}`}
      />

      {/* ---- Up Next. First and visually dominant by design. ---- */}
      <section className="mb-8">
        {attention.length === 0 ? (
          <EmptyState title="All caught up" body="Nothing needs you right now. Every event is fully staffed." />
        ) : (
          <Card
            title="Up Next"
            icon="inbox"
            subtitle={urgent.length ? `${urgent.length} to do first` : `${attention.length} coming up`}
            action={
              <Link href="/up-next" className={LINK}>
                See everything ({attention.length})
              </Link>
            }
            bodyClassName="px-0 py-0"
          >
            <div className="divide-y divide-line">
              {urgent.slice(0, 3).map((item, i) => (
                <UpNextItem key={item.id} item={item} badge first={i === 0} />
              ))}
              {soon.slice(0, 2).map((item, i) => (
                <UpNextItem key={item.id} item={item} badge compact first={urgent.length === 0 && i === 0} />
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Counters that describe WORK, not vanity metrics. Each is a route in. */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricTile
          label="Open spots"
          value={spots}
          tone={spots ? 'urgent' : 'done'}
          sub={spots ? 'Across your upcoming events' : 'Every event is fully staffed'}
          href="/staffing"
        />
        <MetricTile
          label="Awaiting reply"
          value={unreplied}
          tone={unreplied ? undefined : 'done'}
          sub="Couple and vendor messages"
          href="/messages"
        />
        <MetricTile label="Tasks due" value={tasksDue} sub="In Up Next, across all events" href="/up-next?kind=task" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ---- Upcoming events ---- */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="text-heading font-medium text-ink">Upcoming events</h2>
            <Link href="/events" className={LINK}>
              All events
            </Link>
          </div>
          <div className="space-y-3">
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

        <div className="space-y-6">
          {/* ---- Staffing coverage at a glance ---- */}
          <Card
            title="Staffing status"
            icon="users"
            action={
              <Link href="/staffing" className={LINK}>
                Staffing Planner
              </Link>
            }
            bodyClassName="px-0 py-0"
          >
            {events.map((event) => {
              const cov = coverageForEvent(event.id)
              return (
                <ListRow
                  key={event.id}
                  href={`/staffing/${event.id}`}
                  title={event.name}
                  sub={`${cov.filled} of ${cov.required} spots confirmed${cov.pending > 0 ? ` · ${cov.pending} waiting` : ''}`}
                  trailing={
                    cov.complete ? (
                      <StatusBadge tone="done" size="sm">
                        Fully staffed
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="urgent" size="sm">
                        {openSpots(cov.short)}
                      </StatusBadge>
                    )
                  }
                />
              )
            })}
          </Card>

          <Card title="Recent activity" subtitle="Newest first" bodyClassName="px-0 py-0">
            {recent.length === 0 ? (
              <p className="px-4 py-4 text-small text-ink-muted sm:px-6">Nothing yet.</p>
            ) : (
              recent.map((r) => <ListRow key={r.id} href={r.href} title={r.title} sub={r.when} meta={r.text} />)
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
