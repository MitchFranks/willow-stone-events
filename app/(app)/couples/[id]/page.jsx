'use client'

// SCREEN 28 — Couple Detail.

import { use } from 'react'
import { useStore } from '@/lib/store'
import { coupleById } from '@/lib/mock/records'
import { events } from '@/lib/mock/events'
import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Field,
  ListRow,
  PageHeader,
  StatusBadge
} from '@/components/ui/primitives'
import { openSpots } from '@/components/ui/domain'

export default function CoupleDetailPage({ params }) {
  const { id } = use(params)
  const { messageList, attentionForEvent, coverageForEvent } = useStore()
  const couple = coupleById(id)

  if (!couple) return <EmptyState title="No such couple" />

  const theirEvents = events.filter((e) => couple.eventIds.includes(e.id))
  const theirMessages = messageList.filter((m) => m.coupleId === couple.id)

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Couples', href: '/couples' },
          { label: couple.name }
        ]}
      />
      <PageHeader title={couple.name} lead={couple.note} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Contact" icon="user">
          <div className="mb-3 flex items-center gap-3">
            <Avatar initials={couple.initials} />
            <div>
              <div className="text-body font-medium text-ink">{couple.primaryContact}</div>
              <div className="text-label text-ink-muted">Primary contact</div>
            </div>
          </div>
          <dl className="space-y-2">
            <Field label="Email" value={couple.email || 'Not added yet'} />
            <Field label="Phone" value={couple.phone || 'Not added yet'} />
            <Field label="Relationship" value={couple.since} />
          </dl>
        </Card>

        <div className="space-y-4">
          <Card title="Their events" icon="calendar" bodyClassName="px-0 py-0">
            {theirEvents.length === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <p className="text-body text-ink-muted">No wedding booked yet.</p>
                <Button href="/events/new" variant="primary" size="sm">
                  Book their wedding
                </Button>
              </div>
            )}
            {theirEvents.map((e) => {
              const needs = attentionForEvent(e.id).length
              const cov = coverageForEvent(e.id)
              return (
                <ListRow
                  key={e.id}
                  href={`/events/${e.id}`}
                  title={e.name}
                  sub={`${e.dateShort} · ${e.type} · ${e.guests} expected`}
                  trailing={
                    <div className="hidden gap-1.5 sm:flex">
                      {needs > 0 && (
                        <StatusBadge tone="urgent" size="sm">
                          {needs} in Up Next
                        </StatusBadge>
                      )}
                      {cov.complete ? (
                        <StatusBadge tone="done" size="sm">
                          Fully staffed
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="warn" size="sm">
                          {openSpots(cov.short)}
                        </StatusBadge>
                      )}
                    </div>
                  }
                />
              )
            })}
          </Card>

          <Card title="Messages" icon="mail" bodyClassName="px-0 py-0">
            {theirMessages.length === 0 ? (
              <p className="px-4 py-4 text-body text-ink-muted sm:px-6">No messages from this couple.</p>
            ) : (
              // Same status words and tones as the inbox.
              theirMessages.map((m) => (
                <ListRow
                  key={m.id}
                  href={`/messages/${m.id}`}
                  title={m.subject}
                  sub={m.received}
                  trailing={
                    m.replied ? (
                      <StatusBadge tone="done" size="sm">
                        Replied
                      </StatusBadge>
                    ) : m.needsReply ? (
                      <StatusBadge tone={m.priority === 'urgent' ? 'urgent' : 'warn'} size="sm">
                        Needs reply
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="info" size="sm">
                        No reply needed
                      </StatusBadge>
                    )
                  }
                />
              ))
            )}
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Button href="/couples" variant="secondary" size="sm">
          Back to couples
        </Button>
      </div>
    </div>
  )
}
