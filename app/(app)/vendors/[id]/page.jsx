'use client'

// SCREEN 30 — Vendor Detail.

import { use } from 'react'
import { useStore } from '@/lib/store'
import { vendorById } from '@/lib/mock/records'
import { events } from '@/lib/mock/events'
import {
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Field,
  ListRow,
  PageHeader,
  StatusBadge
} from '@/components/ui/primitives'

export default function VendorDetailPage({ params }) {
  const { id } = use(params)
  const vendor = vendorById(id)
  const { messageList } = useStore()

  if (!vendor) return <EmptyState title="No such vendor" />

  const theirEvents = events.filter((e) => vendor.eventIds.includes(e.id))
  // Messages carry no vendorId (only eventId and coupleId), so a vendor's
  // messages are found by their contact's name in the sender line
  // ("Marla Perez · Harvest Table"). Add a vendorId to the data to retire this.
  const theirMessages = messageList.filter((m) => m.from.includes(vendor.contact))

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vendors', href: '/vendors' },
          { label: vendor.name }
        ]}
      />
      <PageHeader
        title={vendor.name}
        lead={vendor.note}
        actions={<StatusBadge tone={vendor.statusTone}>{vendor.status}</StatusBadge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Contact" icon="truck">
          <dl className="space-y-2">
            <Field label="Category" value={vendor.category} />
            <Field label="Contact" value={vendor.contact} />
            <Field label="Phone" value={vendor.phone} />
            <Field label="Email" value={vendor.email} />
          </dl>
        </Card>

        <div className="space-y-4">
          <Card title="Booked on" icon="calendar" bodyClassName="px-0 py-0">
            {theirEvents.map((e) => (
              <ListRow
                key={e.id}
                href={`/events/${e.id}/vendors`}
                title={e.name}
                sub={`${e.dateShort} · ${e.type}`}
              />
            ))}
          </Card>

          {theirMessages.length > 0 && (
            <Card title="Messages" icon="mail" bodyClassName="px-0 py-0">
              {theirMessages.map((m) => (
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
              ))}
            </Card>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Button href="/vendors" variant="secondary" size="sm">
          Back to vendors
        </Button>
      </div>
    </div>
  )
}
