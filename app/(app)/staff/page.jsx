'use client'

// SCREEN 15 — Staff Directory. The people view: who works here, their role
// and how to reach them, with request counts read from the Staffing Planner.
// Availability and away dates are planned in Staffing Planner > Team; each
// profile links to that person there.

import { useState } from 'react'
import { ROLES, staff } from '@/lib/mock/staff'
import { TODAY_KEY } from '@/lib/mock/events'
import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Icon,
  ListRow,
  PageHeader,
  Select,
  StatusBadge,
  TextInput
} from '@/components/ui/primitives'
import { WORLD } from '@/lib/staffing/adapter'
import { requestList } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

/** Planner requests for upcoming events, counted by status. */
function countsFor(staffId, st) {
  const rs = requestList(st).filter((r) => r.staffId === staffId && WORLD.eventMap[r.eventId]?.dateKey >= TODAY_KEY)
  return {
    confirmed: rs.filter((r) => r.status === 'accepted').length,
    waiting: rs.filter((r) => r.status === 'pending').length,
    declined: rs.filter((r) => r.status === 'declined').length
  }
}

export default function StaffDirectoryPage() {
  const { state, hydrated } = useStaffing2()
  const [role, setRole] = useState('All roles')
  const [query, setQuery] = useState('')

  const people = staff.map((p) => WORLD.staffMap[p.id] || { ...p, roles: [p.role] })
  const filtered = people.filter(
    (p) =>
      (role === 'All roles' || p.roles.includes(role)) &&
      (query.trim() === '' || p.name.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff Directory' }]} />
      <PageHeader
        title="Staff directory"
        lead="Everyone who works here and how to reach them. Open a person for their profile and the events they've been asked to work."
        actions={
          <Button href="/staffing/team" variant="secondary" size="md" data-guide="view-availability">
            <Icon name="clock" size={14} />
            Availability and away dates
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <TextInput
          label="Search"
          id="staff-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name"
          className="min-w-[180px] flex-1"
        />
        <Select
          label="Role"
          id="staff-role"
          options={['All roles', ...ROLES]}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No one matches"
          body="Try a different role or clear the search."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRole('All roles')
                setQuery('')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <Card bodyClassName="px-0 py-0">
          {filtered.map((person) => {
            const n = hydrated ? countsFor(person.id, state) : null
            return (
              <ListRow
                key={person.id}
                href={`/staff/${person.id}`}
                leading={<Avatar initials={person.initials} />}
                title={person.name}
                sub={`${person.roles.join(' · ')} · ${person.phone}`}
                meta={person.email}
                trailing={
                  n && (
                    <div className="hidden gap-1.5 sm:flex">
                      {n.confirmed > 0 && (
                        <StatusBadge tone="done" size="sm">
                          {n.confirmed} confirmed
                        </StatusBadge>
                      )}
                      {n.waiting > 0 && (
                        <StatusBadge tone="pending" size="sm">
                          {n.waiting} waiting
                        </StatusBadge>
                      )}
                      {n.declined > 0 && (
                        <StatusBadge tone="declined" size="sm">
                          {n.declined} can&apos;t make it
                        </StatusBadge>
                      )}
                    </div>
                  )
                }
              />
            )
          })}
        </Card>
      )}
    </div>
  )
}
