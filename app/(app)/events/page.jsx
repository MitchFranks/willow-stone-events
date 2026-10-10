'use client'

// SCREEN 4 — Events (list).

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { EVENT_TYPES, events } from '@/lib/mock/events'
import { Breadcrumbs, Button, Card, EmptyState, Icon, PageHeader } from '@/components/ui/primitives'
import { EventCard } from '@/components/ui/domain'

export default function EventsPage() {
  const { coverageForEvent, attentionForEvent } = useStore()
  const [type, setType] = useState('All types')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('soonest')

  const filtered = events.filter(
    (e) =>
      (type === 'All types' || e.type === type) &&
      (query.trim() === '' ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.couple.toLowerCase().includes(query.toLowerCase()))
  )

  // Chronological by default, so the next wedding is first.
  const sorted = filtered.slice().sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    const diff = a.dateKey.localeCompare(b.dateKey)
    return sort === 'latest' ? -diff : diff
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Events' }]} />
      <PageHeader
        title="Events"
        lead="Weddings and the events around them."
        actions={
          <Button href="/events/new" variant="primary" size="md">
            <Icon name="plus" size={14} />
            New event
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="event-search" className="mb-1 block text-label font-medium text-ink">
            Search
          </label>
          <input
            id="event-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Event or couple name"
            className="w-full h-9 rounded-sm border border-line-strong bg-surface px-3 text-body placeholder:text-ink-muted focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="event-type" className="mb-1 block text-label font-medium text-ink">
            Event type
          </label>
          <select
            id="event-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-sm border border-line-strong bg-surface px-3 text-body focus:border-accent"
          >
            {['All types', ...EVENT_TYPES].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event-sort" className="mb-1 block text-label font-medium text-ink">
            Sort by
          </label>
          <select
            id="event-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-sm border border-line-strong bg-surface px-3 text-body focus:border-accent"
          >
            <option value="soonest">Date: soonest first</option>
            <option value="latest">Date: latest first</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No events match"
          body="Try a different event type or clear the search box."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setType('All types')
                setQuery('')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {sorted.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              guide={i === 0}
              coverage={coverageForEvent(event.id)}
              attentionCount={attentionForEvent(event.id).length}
            />
          ))}
        </div>
      )}
    </div>
  )
}
