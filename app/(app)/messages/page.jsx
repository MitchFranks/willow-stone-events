'use client'

// SCREEN 25 — Message Inbox.

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Avatar, Breadcrumbs, Button, Card, EmptyState, ListRow, PageHeader, StatusBadge } from '@/components/ui/primitives'

const FILTERS = [
  { id: 'needs-reply', label: 'Needs reply' },
  { id: 'all', label: 'All' },
  { id: 'replied', label: 'Replied' }
]

export default function InboxPage() {
  const { messageList } = useStore()
  const [filter, setFilter] = useState('needs-reply')

  const counts = {
    'needs-reply': messageList.filter((m) => m.needsReply && !m.replied).length,
    all: messageList.length,
    replied: messageList.filter((m) => m.replied).length
  }

  const filtered = messageList.filter((m) => {
    if (filter === 'needs-reply') return m.needsReply && !m.replied
    if (filter === 'replied') return m.replied
    return true
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Messages' }]} />
      <PageHeader
        title="Messages"
        lead="Couples, vendors and staff."
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={
              filter === f.id
                ? 'rounded-md border border-accent bg-surface-sunken px-2.5 py-1 text-label font-medium text-accent'
                : 'rounded-md border border-line bg-surface px-2.5 py-1 text-label text-ink hover:bg-surface-sunken'
            }
          >
            {f.label} ({counts[f.id]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="check"
          title={filter === 'needs-reply' ? 'Nothing waiting on a reply' : 'Nothing here'}
          body={
            filter === 'needs-reply'
              ? 'Every couple and vendor message has been answered.'
              : 'Try a different filter.'
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
              Show all messages
            </Button>
          }
        />
      ) : (
        <Card bodyClassName="px-0 py-0">
          {filtered.map((m) => (
            <ListRow
              key={m.id}
              href={`/messages/${m.id}`}
              leading={<Avatar initials={m.initials} />}
              title={m.subject}
              sub={`${m.from} · ${m.fromRole}`}
              meta={m.received}
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
                    No action
                  </StatusBadge>
                )
              }
            />
          ))}
        </Card>
      )}
    </div>
  )
}
