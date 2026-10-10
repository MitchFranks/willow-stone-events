'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · Events (spec §B.1). "Which weddings need me, and for what?"
// One card per event with every chip that applies and exactly one action.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert, Button, EmptyState, Icon, PageHeader, StatusBadge } from '@/components/ui/primitives'
import { Staffing2Nav, SkeletonCards } from '@/components/staffing/Nav'
import { Chip } from '@/components/staffing/StatusChip'
import { WORLD } from '@/lib/staffing/adapter'
import { daysOutOf, daysOutText, eventCardModel, eventOf, guestsText, summaryLine } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

export default function Staffing2EventsPage() {
  const router = useRouter()
  const { state, hydrated, loadError } = useStaffing2()

  const evs = [...WORLD.events].filter((e) => daysOutOf(e) >= 0 && daysOutOf(e) <= 30).sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0))
  const models = evs.map((e) => ({ ev: eventOf(state, e.id), m: eventCardModel(e.id, state) }))
  const firstActionId = models.find((x) => x.m.needsAction)?.ev.id

  const hrefFor = (ev, action) => {
    if (action.kind === 'send' || action.kind === 'remind') return `/staffing/${ev.id}?send=1`
    if (action.kind === 'find') return `/staffing/${ev.id}?ask=1`
    return `/staffing/${ev.id}`
  }

  return (
    <div>
      <PageHeader title="Staffing Planner" lead="Which events still need people." />
      <Staffing2Nav />

      {loadError && (
        <div className="mb-4">
          <Alert tone="info">Your saved planner changes couldn&apos;t be read, so it started fresh from the sample data.</Alert>
        </div>
      )}

      {!hydrated ? (
        <SkeletonCards />
      ) : !models.length ? (
        <EmptyState title="No events in the next 30 days." body="Events appear here as soon as they are booked." icon="calendar" />
      ) : (
        <>
          <div className="space-y-4">
            {models.map(({ ev, m }) => {
              const primary = ev.id === firstActionId
              const href = hrefFor(ev, m.action)
              return (
                <article
                  key={ev.id}
                  onClick={() => router.push(`/staffing/${ev.id}`)}
                  className={`${primary ? 'ring-2 ring-accent ' : ''}surface-card flex cursor-pointer flex-col gap-3 px-6 py-4 transition-colors duration-150 hover:border-line-strong sm:flex-row sm:items-center`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/staffing/${ev.id}`}
                        data-guide={primary ? 'planner-event' : undefined}
                        onClick={(e) => e.stopPropagation()}
                        className="text-heading font-medium text-ink hover:text-accent"
                      >
                        {ev.name}
                      </Link>
                      {primary && daysOutOf(ev) <= 3 && (
                        <StatusBadge tone="pending" size="sm">
                          Do first
                        </StatusBadge>
                      )}
                    </div>
                    <p className="mt-0.5 text-label text-ink-muted">
                      {ev.couple} · {ev.dateShort} · {daysOutText(ev)} · {guestsText(ev)}
                    </p>
                    <p className="mt-1 text-small text-ink">{summaryLine(m.summary)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.chips.map((c) =>
                        c.icon ? (
                          <Chip key={c.label} tone={c.tone} icon={c.icon}>
                            {c.label}
                          </Chip>
                        ) : (
                          <StatusBadge key={c.label} tone={c.tone} size="sm">
                            {c.label}
                          </StatusBadge>
                        )
                      )}
                    </div>
                  </div>
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button href={href} variant={primary ? 'primary' : m.action.kind === 'open' ? 'ghost' : 'secondary'} size="sm">
                      {m.action.label}
                      <Icon name="arrowRight" size={13} />
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
