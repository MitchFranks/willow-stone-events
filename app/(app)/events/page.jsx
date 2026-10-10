'use client'

// SCREEN 4 — Events (list). Each card carries the same staffing words as
// everywhere else: "N open spots" or "Fully staffed".

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { EVENT_TYPES, events } from '@/lib/mock/events'
import { Breadcrumbs, Button, EmptyState, Icon, PageHeader, Select, TextInput } from '@/components/ui/primitives'
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

      <div className="mb-4 flex flex-wrap items-start gap-2">
        <TextInput
          label="Search"
          id="event-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Event or couple name"
          className="min-w-[180px] flex-1"
        />
        <Select
          label="Event type"
          id="event-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={['All types', ...EVENT_TYPES]}
        />
        <Select
          label="Sort by"
          id="event-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          options={[
            { value: 'soonest', label: 'Date: soonest first' },
            { value: 'latest', label: 'Date: latest first' },
            { value: 'name', label: 'Name: A to Z' }
          ]}
        />
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
