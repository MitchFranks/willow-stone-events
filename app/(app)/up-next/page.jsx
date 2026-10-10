'use client'

// ---------------------------------------------------------------------------
// SCREEN 2 — Up Next.
//
// The full queue, filterable by kind and by event. This is the "second route"
// to every problem in the product: anything reachable from the dashboard, an
// event page or the schedule is also reachable from here.
//
// The kind filter lives in the URL (/up-next?kind=task) so other screens can
// deep-link straight to one slice of the queue.
// ---------------------------------------------------------------------------

import { Suspense, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { events } from '@/lib/mock/events'
import { Breadcrumbs, Button, Card, EmptyState, FilterChip, FilterGroup, PageHeader } from '@/components/ui/primitives'
import { UpNextItem, useHideWithUndo } from '@/components/ui/domain'

const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'staffing', label: 'Staffing' },
  { id: 'message', label: 'Messages' },
  { id: 'task', label: 'Tasks' },
  { id: 'document', label: 'Documents' },
  { id: 'payment', label: 'Payments' }
]

// useSearchParams needs a Suspense boundary under the static export.
export default function UpNextPage() {
  return (
    <Suspense fallback={null}>
      <UpNextView />
    </Suspense>
  )
}

function UpNextView() {
  const store = useStore()
  const { attention, dismissedCount, restoreAllAttention, toast } = store
  const hide = useHideWithUndo(store)

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const fromUrl = params.get('kind')
  const kind = KINDS.some((k) => k.id === fromUrl) ? fromUrl : 'all'
  const setKind = (id) => router.replace(id === 'all' ? pathname : `${pathname}?kind=${id}`, { scroll: false })

  const [eventFilter, setEventFilter] = useState('all')

  const filtered = attention.filter(
    (a) => (kind === 'all' || a.kind === kind) && (eventFilter === 'all' || a.eventId === eventFilter)
  )
  const urgent = filtered.filter((a) => a.tone === 'urgent')
  const rest = filtered.filter((a) => a.tone !== 'urgent')

  const showHidden = () => {
    restoreAllAttention()
    toast(`${dismissedCount} hidden ${dismissedCount === 1 ? 'item is' : 'items are'} back in Up Next.`)
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Up Next' }]} />
      <PageHeader title="Up Next" lead="Everything that needs you, most urgent first." />

      {/* Filters — PROGRESSIVE DISCLOSURE for a long queue. */}
      <div className="mb-6 space-y-3">
        <FilterGroup label="Show">
          {KINDS.map((k) => (
            <FilterChip
              key={k.id}
              pressed={kind === k.id}
              onClick={() => setKind(k.id)}
              count={k.id === 'all' ? attention.length : attention.filter((a) => a.kind === k.id).length}
            >
              {k.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Event">
          <FilterChip pressed={eventFilter === 'all'} onClick={() => setEventFilter('all')}>
            All events
          </FilterChip>
          {events.map((e) => {
            const n = attention.filter((a) => a.eventId === e.id).length
            if (!n) return null
            return (
              <FilterChip key={e.id} pressed={eventFilter === e.id} onClick={() => setEventFilter(e.id)} count={n}>
                {e.name}
              </FilterChip>
            )
          })}
        </FilterGroup>

        {dismissedCount > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-small text-ink-muted">
            {dismissedCount} hidden ·
            <Button variant="ghost" size="sm" onClick={showHidden}>
              Show them
            </Button>
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body="Either everything here is handled, or the filters above are hiding it. Try switching back to Everything."
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
        <div className="space-y-6">
          {/* Only the very first item on the page gets the filled button. */}
          {urgent.length > 0 && (
            <Card title={`Do first (${urgent.length})`} icon="alert" bodyClassName="px-0 py-0">
              <div className="divide-y divide-line">
                {urgent.map((item, i) => (
                  <UpNextItem key={item.id} item={item} first={i === 0} onDismiss={hide} />
                ))}
              </div>
            </Card>
          )}

          {rest.length > 0 && (
            <Card title={`Coming up (${rest.length})`} icon="clock" bodyClassName="px-0 py-0">
              <div className="divide-y divide-line">
                {rest.map((item, i) => (
                  <UpNextItem key={item.id} item={item} first={urgent.length === 0 && i === 0} onDismiss={hide} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
