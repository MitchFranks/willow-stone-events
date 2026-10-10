'use client'

// ---------------------------------------------------------------------------
// The persistent header + tab bar shared by every event sub-screen.
//
// RECOGNITION OVER RECALL: the event's date, time, guest count, staffing state
// and attention count stay on screen no matter which tab you are on, so nobody
// has to remember them while moving around.
//
// The staffing badge and the "Staffing planner" tab both lead to the planner,
// so the way from "this wedding is short" to fixing it is one click.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { upNextLabel, useStore } from '@/lib/store'
import { useStaffing2 } from '@/lib/staffing/store'
import { eventOf } from '@/lib/staffing/derive'
import { openSpots } from './ui/domain'
import { Breadcrumbs, Field, Icon, PageHeader, StatusBadge, Tabs } from './ui/primitives'

export function EventHeader({ event }) {
  const pathname = usePathname()
  const { coverageForEvent, attentionForEvent, taskList, messageList, documentList, paymentsForEvent } = useStore()
  const { state: planner } = useStaffing2()

  const coverage = coverageForEvent(event.id)
  const attention = attentionForEvent(event.id)
  const anyUrgent = attention.some((a) => a.tone === 'urgent')
  const openTasks = taskList.filter((t) => t.eventId === event.id && !t.done)
  const urgentTask = openTasks.some((t) => t.dueTone === 'urgent')
  const unreplied = messageList.filter((m) => m.eventId === event.id && m.needsReply && !m.replied).length
  const toSign = documentList.filter((d) => d.eventId === event.id && d.tone === 'urgent').length
  const dueNow = (paymentsForEvent(event.id)?.schedule || []).filter((p) => p.state === 'due').length
  // Guest numbers live in the planner: the Tasks tab and Edit needs both change them there.
  const plannerEvent = eventOf(planner, event.id)
  const guests = plannerEvent?.expectedGuests ?? event.guests
  const guarantee = plannerEvent?.guaranteedCount

  // Counts only where there is something to act on; urgent only when it is.
  const base = `/events/${event.id}`
  const plannerHref = `/staffing/${event.id}`
  const tabs = [
    { id: 'overview', label: 'Up Next', href: base, count: attention.length || null, tone: anyUrgent ? 'urgent' : null },
    {
      id: 'staffing',
      label: (
        <>
          Staffing planner
          <Icon name="arrowRight" size={12} className="text-ink-muted" />
        </>
      ),
      href: plannerHref,
      count: coverage.complete ? null : coverage.short,
      tone: coverage.complete ? null : 'urgent'
    },
    { id: 'timeline', label: 'Run of show', href: `${base}/timeline`, guide: 'tab-timeline' },
    { id: 'tasks', label: 'Tasks', href: `${base}/tasks`, count: openTasks.length || null, tone: urgentTask ? 'urgent' : null },
    { id: 'vendors', label: 'Vendors', href: `${base}/vendors` },
    { id: 'payments', label: 'Payments', href: `${base}/payments`, count: dueNow || null },
    { id: 'messages', label: 'Messages', href: `${base}/messages`, count: unreplied || null, tone: unreplied ? 'urgent' : null },
    { id: 'documents', label: 'Documents', href: `${base}/documents`, count: toSign || null },
    { id: 'activity', label: 'Activity log', href: `${base}/activity` }
  ]

  const active = tabs.slice(1).find((t) => pathname.startsWith(t.href))?.id || 'overview'

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Events', href: '/events' },
          { label: event.name }
        ]}
      />

      <PageHeader
        title={event.name}
        lead={`${event.couple} · ${event.type}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {attention.length > 0 ? (
              <StatusBadge tone={anyUrgent ? 'urgent' : 'warn'}>{upNextLabel(attention)}</StatusBadge>
            ) : (
              <StatusBadge tone="done">All set</StatusBadge>
            )}
            {/* The staffing badge is a way in: it opens this event in the planner. */}
            <Link
              href={plannerHref}
              title="Open the Staffing Planner for this event"
              className="inline-flex items-center rounded-full underline-offset-4 hover:underline"
            >
              <StatusBadge tone={coverage.complete ? 'done' : 'warn'}>
                {coverage.complete ? 'Fully staffed' : openSpots(coverage.short)}
                <Icon name="chevronRight" size={12} />
              </StatusBadge>
            </Link>
          </div>
        }
      >
        {/* The four facts that are true no matter which tab you are on. */}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-line py-3 sm:grid-cols-4">
          <Field label="Date" value={event.date} />
          <Field label="Schedule" value={event.headline} />
          <Field
            label="Guests"
            value={`${guests} expected · ${guarantee ? `${guarantee} guaranteed` : 'guarantee not sent'}`}
          />
          <Field label="Spaces" value={event.spaces} />
        </dl>
      </PageHeader>

      <Tabs tabs={tabs} active={active} />
    </>
  )
}
