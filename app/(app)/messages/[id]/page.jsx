'use client'

// ---------------------------------------------------------------------------
// SCREEN 26 — Message Detail / Reply.
//
// Sending a reply marks the thread replied, which removes its Up Next
// item. The context panel beside the message exists so the manager does not
// have to go and look up the event to answer — RECOGNITION OVER RECALL.
// ---------------------------------------------------------------------------

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { eventById } from '@/lib/mock/events'
import { messageById } from '@/lib/mock/records'
import {
  Alert,
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  PageHeader,
  StatusBadge,
  Textarea
} from '@/components/ui/primitives'

export default function MessageDetailPage({ params }) {
  const { id } = use(params)
  const base = messageById(id)
  const { messageList, markReplied, markRead, toast } = useStore()
  const live = messageList.find((m) => m.id === id)
  const [draft, setDraft] = useState(base?.suggestedReply || '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (base) markRead(base.id)
  }, [base, markRead])

  if (!base) return <EmptyState title="No such message" />

  const event = base.eventId ? eventById(base.eventId) : null
  const replied = live?.replied

  function send() {
    if (!draft.trim()) {
      setError('Write something before sending.')
      return
    }
    markReplied(base.id)
    toast(`Reply sent to ${base.from}.`)
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Messages', href: '/messages' },
          { label: base.subject }
        ]}
      />

      <PageHeader
        title={base.subject}
        lead={`${base.from} · ${base.fromRole} · ${base.received}`}
        actions={
          replied ? (
            <StatusBadge tone="done">Replied</StatusBadge>
          ) : base.needsReply ? (
            <StatusBadge tone={base.priority === 'urgent' ? 'urgent' : 'warn'}>Needs reply</StatusBadge>
          ) : (
            <StatusBadge tone="info">No reply needed</StatusBadge>
          )
        }
      />

      {replied && (
        <Alert tone="done" title="Reply sent">
          <p className="mt-1">
            This thread is no longer in Up Next.{' '}
            <Link href="/up-next" className="underline underline-offset-2">
              Check Up Next
            </Link>
            .
          </p>
        </Alert>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card title="Message" icon="mail">
            <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
              <Avatar initials={base.initials} />
              <div>
                <div className="text-body font-medium text-ink">{base.from}</div>
                <div className="text-label text-ink-muted">{base.fromRole}</div>
              </div>
              <span className="ml-auto text-label text-ink-muted">{base.received}</span>
            </div>
            <div className="space-y-2 text-body leading-relaxed text-ink">
              {base.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Card>

          {replied ? (
            <Card title="Your reply" icon="send">
              <div className="whitespace-pre-wrap text-body leading-relaxed text-ink-muted">{draft}</div>
              <p className="mt-3 border-t border-line pt-2 text-label text-ink-muted">
                Sent just now. Nothing actually left the browser — this is a prototype.
              </p>
            </Card>
          ) : (
            <Card title="Reply" icon="send" subtitle="A starting draft is pre-filled. Edit it before sending.">
              <Textarea
                label={`To ${base.from}`}
                id="reply"
                rows={9}
                value={draft}
                error={error}
                onChange={(e) => {
                  setDraft(e.target.value)
                  if (error) setError('')
                }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" size="md" onClick={send}>
                  <Icon name="send" size={14} />
                  Send reply
                </Button>
                <Button variant="secondary" size="md" onClick={() => {
                    setDraft(base.suggestedReply || '')
                    setError('')
                  }}>
                  Reset draft
                </Button>
                <Button href="/messages" variant="secondary" size="md">
                  Back to inbox
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Context" icon="info" subtitle="So you can answer without going to look it up">
            <dl className="space-y-2.5">
              {base.context.map((c) => (
                <Field key={c.label} label={c.label} value={c.value} />
              ))}
            </dl>
          </Card>

          {event && (
            <Card title="Related event" icon="calendar">
              <Link href={`/events/${event.id}`} className="text-body font-medium text-accent hover:underline">
                {event.name}
              </Link>
              <dl className="mt-2 space-y-2">
                <Field label="Date" value={event.date} />
                <Field label="Expected guests" value={`${event.guests}`} />
                <Field label="Spaces" value={event.spaces} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button href={`/events/${event.id}`} variant="secondary" size="sm">
                  Open event
                </Button>
                <Button href={`/staffing/${event.id}`} variant="secondary" size="sm">
                  Staffing
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
