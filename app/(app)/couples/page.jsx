'use client'

// SCREEN 27 — Couples.

import { couples } from '@/lib/mock/records'
import { events } from '@/lib/mock/events'
import { useStore } from '@/lib/store'
import { Avatar, Breadcrumbs, Card, ListRow, PageHeader, StatusBadge } from '@/components/ui/primitives'

export default function CouplesPage() {
  const { attentionForEvent } = useStore()

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Couples' }]} />
      <PageHeader title="Couples" lead={`${couples.length} couples with an event on the books.`} />

      <Card bodyClassName="px-0 py-0">
        {couples.map((c) => {
          const theirEvents = events.filter((e) => c.eventIds.includes(e.id))
          const needs = theirEvents.reduce((n, e) => n + attentionForEvent(e.id).length, 0)
          return (
            <ListRow
              key={c.id}
              href={`/couples/${c.id}`}
              leading={<Avatar initials={c.initials} />}
              title={c.name}
              sub={[c.primaryContact, c.email].filter(Boolean).join(' · ')}
              meta={theirEvents.length ? theirEvents.map((e) => e.name).join(', ') : 'No wedding booked yet'}
              trailing={
                needs > 0 ? (
                  <StatusBadge tone="urgent" size="sm">
                    {needs} in Up Next
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="done" size="sm">
                    All set
                  </StatusBadge>
                )
              }
            />
          )
        })}
      </Card>
    </div>
  )
}
