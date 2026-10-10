'use client'

// Account: who is signed in. Read-only in this prototype, so the page ends
// with links to where the work and the real controls are (no dead end).

import { venue } from '@/lib/mock/events'
import { Alert, Avatar, Breadcrumbs, Card, Field, Icon, ListRow, PageHeader, TextInput } from '@/components/ui/primitives'

// Example contact details for the prototype. Not a real address or number.
const CONTACT = {
  email: 'dana@willowstone.example',
  phone: '(555) 010-0142'
}

export default function AccountPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Account' }]} />
      <PageHeader title="Account" lead="Signed in on this device." />

      <div className="max-w-2xl space-y-4">
        <Alert tone="info" title="This is a prototype">
          These details are examples. Nothing here can be edited or is saved anywhere.
        </Alert>

        <Card title="Profile" icon="user">
          <div className="mb-5 flex items-center gap-3">
            <Avatar initials={venue.managerInitials} />
            <div>
              <div className="text-heading font-medium text-ink">{venue.manager}</div>
              <div className="text-small text-ink-muted">{venue.managerRole}</div>
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={venue.manager} />
            <Field label="Role" value={venue.managerRole} />
            <Field label="Initials" value={venue.managerInitials} />
            <Field label="Venue" value={venue.name} />
          </dl>
        </Card>

        <Card title="Contact" subtitle="Read only in this prototype." icon="mail">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="account-email" label="Email" value={CONTACT.email} readOnly />
            <TextInput id="account-phone" label="Phone" value={CONTACT.phone} readOnly />
          </div>
        </Card>

        <Card title="Where to next" bodyClassName="px-0 py-0">
          <ListRow href="/up-next" leading={<Icon name="inbox" size={16} />} title="Up Next" sub="What needs you across every event" />
          <ListRow href="/settings" leading={<Icon name="settings" size={16} />} title="Settings" sub="Your goal, hidden items and resetting the prototype" />
          <ListRow href="/dashboard" leading={<Icon name="home" size={16} />} title="Dashboard" sub="Back to the overview" />
        </Card>
      </div>
    </div>
  )
}
