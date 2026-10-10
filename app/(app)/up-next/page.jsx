'use client'

// ---------------------------------------------------------------------------
// SCREEN 2 — Up Next Center.
//
// The full queue, filterable by kind and by event. This is the "second route"
// to every problem in the product: anything reachable from the dashboard, an
// event page or the schedule is also reachable from here.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { events } from '@/lib/mock/events'
import { Breadcrumbs, Button, Card, EmptyState, Icon, PageHeader } from '@/components/ui/primitives'
import { UpNextItem } from '@/components/ui/domain'

const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'staffing', label: 'Staffing' },
  { id: 'message', label: 'Messages' },
  { id: 'task', label: 'Tasks' },
  { id: 'document', label: 'Documents' }
]

export default function UpNextPage() {
  const { attention, dismissAttention, toast } = useStore()
  const [kind, setKind] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')

  const filtered = attention.filter(
    (a) => (kind === 'all' || a.kind === kind) && (eventFilter === 'all' || a.eventId === eventFilter)
  )
  const urgent = filtered.filter((a) => a.tone === 'urgent')
  const rest = filtered.filter((a) => a.tone !== 'urgent')

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Up Next' }]} />
      <PageHeader
        title="Up next"
        lead="Everything that needs you, most useful first."
      />

      {/* Filters — PROGRESSIVE DISCLOSURE for a long queue. */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => {
            const n = k.id === 'all' ? attention.length : attention.filter((a) => a.kind === k.id).length
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
                className={
                  kind === k.id
                    ? 'rounded-md border border-accent bg-surface-sunken px-2.5 py-1 text-label font-medium text-accent'
                    : 'rounded-md border border-line bg-surface px-2.5 py-1 text-label text-ink hover:bg-surface-sunken'
                }
              >
                {k.label} ({n})
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setEventFilter('all')}
            aria-pressed={eventFilter === 'all'}
            className={
              eventFilter === 'all'
                ? 'rounded-md border border-accent bg-surface-sunken px-2.5 py-1 text-label font-medium text-accent'
                : 'rounded-md border border-line bg-surface px-2.5 py-1 text-label text-ink hover:bg-surface-sunken'
            }
          >
            All events
          </button>
          {events.map((e) => {
            const n = attention.filter((a) => a.eventId === e.id).length
            if (!n) return null
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setEventFilter(e.id)}
                aria-pressed={eventFilter === e.id}
                className={
                  eventFilter === e.id
                    ? 'rounded-md border border-accent bg-surface-sunken px-2.5 py-1 text-label font-medium text-accent'
                    : 'rounded-md border border-line bg-surface px-2.5 py-1 text-label text-ink hover:bg-surface-sunken'
                }
              >
                {e.name} ({n})
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body="Either everything here is resolved, or the filters above are hiding it. Try switching back to Everything."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setKind('all')
                setEventFilter('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {urgent.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 flex items-center gap-2 text-body font-medium text-accent">
                <Icon name="check" size={15} />
                Do first ({urgent.length})
              </h2>
              <div className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface shadow-raised">
                {urgent.map((item, i) => (
                  <div key={item.id} className="relative">
                    <UpNextItem item={item} first={i === 0} />
                    <button
                      type="button"
                      onClick={() => {
                        dismissAttention(item.id)
                        toast('Moved out of Up Next.')
                      }}
                      className="absolute bottom-2 right-3 rounded-full border border-line bg-surface px-2.5 py-0.5 text-label font-medium text-ink-muted hover:bg-surface-sunken hover:text-accent"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-body font-medium text-ink-muted">
                <Icon name="clock" size={15} />
                Coming up ({rest.length})
              </h2>
              <div className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface shadow-raised">
                {rest.map((item, i) => (
                  <UpNextItem key={item.id} item={item} first={urgent.length === 0 && i === 0} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
