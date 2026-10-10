'use client'

// SCREEN 5 — Event Up Next.
//
// The same queue as the Up Next page, scoped to this one event: what to do
// first, and what is coming up, for this wedding only.

import { use, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button, Card, EmptyState, Icon } from '@/components/ui/primitives'
import { UpNextItem } from '@/components/ui/domain'

const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'staffing', label: 'Staffing' },
  { id: 'message', label: 'Messages' },
  { id: 'task', label: 'Tasks' },
  { id: 'document', label: 'Documents' }
]

export default function EventUpNextPage({ params }) {
  const { id } = use(params)
  const { attentionForEvent, dismissAttention, toast } = useStore()
  const [kind, setKind] = useState('all')

  const all = attentionForEvent(id)
  const filtered = all.filter((a) => kind === 'all' || a.kind === kind)
  const urgent = filtered.filter((a) => a.tone === 'urgent')
  const rest = filtered.filter((a) => a.tone !== 'urgent')

  return (
    <div>
      {all.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {KINDS.map((k) => {
            const n = k.id === 'all' ? all.length : all.filter((a) => a.kind === k.id).length
            if (k.id !== 'all' && n === 0) return null
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
      )}

      {all.length === 0 ? (
        <EmptyState
          title="All caught up"
          body="Nothing needs you on this event right now. New items appear here as soon as something changes."
          icon="check"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body="Switch back to Everything to see the rest."
          action={
            <Button variant="secondary" size="sm" onClick={() => setKind('all')}>
              Show everything
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
