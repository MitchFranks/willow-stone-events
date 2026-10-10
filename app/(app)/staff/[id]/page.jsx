'use client'

// SCREEN 16 — Staff Member Detail. Profile and contact, plus every event this
// person has been asked to work, read from the Staffing Planner with its real
// status. Recording an answer here is the planner's own recordReply, so the
// event page and Up Next update at once, and the toast offers Undo.

import { use } from 'react'
import { staffById as mockStaffById } from '@/lib/mock/staff'
import { TODAY_KEY } from '@/lib/mock/events'
import { Avatar, Breadcrumbs, Button, Card, EmptyState, Field, Icon, PageHeader } from '@/components/ui/primitives'
import { useConfirm } from '@/components/ui/domain'
import { RequestStatus } from '@/components/staffing/StatusChip'
import { WORLD } from '@/lib/staffing/adapter'
import { awayDateText, dayLine, firstName, requestList, usuallyFreeText } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

const STATUS_ORDER = { pending: 0, draft: 1, accepted: 2, backup: 3, declined: 4, cancelled: 5 }

export default function StaffDetailPage({ params }) {
  const { id } = use(params)
  const base = mockStaffById(id)
  const person = WORLD.staffMap[id] || (base && { ...base, roles: [base.role] })
  const { state, hydrated, recordReply, openPhone } = useStaffing2()
  const { confirm, dialog } = useConfirm()

  if (!person) return <EmptyState title="No such staff member" />

  const first = firstName(person.id)
  const requests = requestList(state)
    .filter((r) => r.staffId === person.id && r.status !== 'cancelled' && WORLD.eventMap[r.eventId])
    .filter((r) => WORLD.eventMap[r.eventId].dateKey >= TODAY_KEY)
    .sort((a, b) => {
      const da = WORLD.eventMap[a.eventId].dateKey
      const db = WORLD.eventMap[b.eventId].dateKey
      return da < db ? -1 : da > db ? 1 : STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    })
  const count = (s) => requests.filter((r) => r.status === s).length
  const away = state.away.filter((a) => a.staffId === person.id && (a.endDateKey || a.dateKey) >= TODAY_KEY)
  const teamHref = `/staffing/team?who=${person.id}`

  const recordNo = (r, ev) =>
    confirm({
      title: `Record that ${first} can't make it?`,
      body: `${first}'s spot as ${r.role} at the ${ev.name} opens again and shows in Up Next as an open spot to fill. You can undo this from the message that appears.`,
      confirmLabel: `Record: can't make it`,
      danger: true,
      onConfirm: () => recordReply(r.id, false)
    })

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Staff Directory', href: '/staff' },
          { label: person.name }
        ]}
      />

      <PageHeader
        title={person.name}
        lead={person.note}
        actions={
          <Button href={teamHref} variant="secondary">
            <Icon name="clock" size={14} />
            View availability in Team
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Contact" icon="user">
          <div className="mb-3 flex items-center gap-3">
            <Avatar initials={person.initials} />
            <div>
              <div className="text-body font-medium text-ink">{person.name}</div>
              <div className="text-small text-ink-muted">{person.roles.join(' · ')}</div>
            </div>
          </div>
          <dl className="space-y-2">
            <Field label="Phone" value={person.phone} />
            <Field label="Email" value={person.email} />
            <Field label="Preferred hours" value={person.preferredHours} />
          </dl>
        </Card>

        <Card
          title="Availability"
          icon="calendar"
          subtitle="Planned in Staffing Planner > Team"
          action={
            <Button href={teamHref} size="sm">
              Edit in Team
            </Button>
          }
        >
          <dl className="space-y-2">
            <Field label="Usually free" value={usuallyFreeText(person)} />
            <Field label="Away dates">
              {!hydrated ? '…' : away.length ? (
                <ul className="space-y-1">
                  {away.map((a) => (
                    <li key={a.id}>{awayDateText(a)}</li>
                  ))}
                </ul>
              ) : (
                'None coming up'
              )}
            </Field>
          </dl>
        </Card>
      </div>

      <div className="mt-4">
        <Card
          title="Events asked to work"
          icon="list"
          subtitle={
            hydrated
              ? `${count('accepted')} confirmed · ${count('pending')} waiting · ${count('draft')} not sent · ${count('declined')} can't make it`
              : undefined
          }
          bodyClassName="px-0 py-0"
        >
          {!hydrated ? null : requests.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Not asked to work any upcoming events" body={`When you ask ${first} to work an event in the Staffing Planner, it shows here.`} />
            </div>
          ) : (
            requests.map((r) => {
              const ev = WORLD.eventMap[r.eventId]
              const boardHref = `/staffing/${ev.id}?block=${r.blockIds[0]}&role=${encodeURIComponent(r.role)}`
              return (
                <div key={r.id} className="border-b border-line px-4 py-3 last:border-b-0 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {ev.name} <span className="font-normal text-ink-muted">· {ev.dateShort}</span>
                      </p>
                      <p className="text-small text-ink-muted">
                        {r.role} · {dayLine(r)}
                      </p>
                      {r.status === 'declined' && r.reason && <p className="mt-1 text-small text-ink-muted">Reason: {r.reason}</p>}
                    </div>
                    <RequestStatus request={r} st={state} />
                  </div>

                  {r.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-small text-ink-muted">{first} told you their answer another way?</span>
                      <Button size="sm" onClick={() => recordReply(r.id, true)}>
                        Record: said yes
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => recordNo(r, ev)}>
                        Record: can&apos;t make it
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openPhone(person.id)}>
                        <Icon name="phone" size={13} />
                        Open {first}&apos;s phone (prototype)
                      </Button>
                    </div>
                  )}

                  <div className="mt-2">
                    <Button href={boardHref} size="sm" variant="ghost">
                      Open in the Staffing Planner
                      <Icon name="arrowRight" size={13} />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Button href="/staff" variant="secondary" size="sm">
          Back to directory
        </Button>
      </div>

      {dialog}
    </div>
  )
}
