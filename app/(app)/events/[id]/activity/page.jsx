'use client'

// SCREEN 13 — Event Activity log.
// Each entry says in plain words whether it still needs anything from you.

import { use } from 'react'
import { activityLog } from '@/lib/mock/records'
import { Card, EmptyState, ListRow, StatusBadge } from '@/components/ui/primitives'

const STATUS_WORDS = {
  urgent: 'Needs you',
  warn: 'Worth a look',
  done: 'Done',
  info: 'No action needed'
}

export default function ActivityLogPage({ params }) {
  const { id } = use(params)
  const entries = activityLog.filter((h) => h.eventId === id)

  return (
    <Card title="Activity log" icon="clock" subtitle="Every change recorded against this event" bodyClassName="px-0 py-0">
      {entries.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No changes recorded" body="Changes to this event will be logged here." />
        </div>
      ) : (
        entries.map((h) => (
          <ListRow
            key={h.id}
            title={h.what}
            sub={`${h.when} · by ${h.who}`}
            trailing={
              <StatusBadge tone={h.tone} size="sm">
                {STATUS_WORDS[h.tone] || STATUS_WORDS.info}
              </StatusBadge>
            }
          />
        ))
      )}
    </Card>
  )
}
