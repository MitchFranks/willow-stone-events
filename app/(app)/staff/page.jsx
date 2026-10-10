'use client'

// SCREEN 15 — Staff Directory.

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { ROLES, staff } from '@/lib/mock/staff'
import {
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Icon,
  PageHeader,
  Select,
  StatusBadge,
  TextInput
} from '@/components/ui/primitives'
import { StaffCard } from '@/components/ui/domain'

export default function StaffDirectoryPage() {
  const { assignmentsForStaff } = useStore()
  const [role, setRole] = useState('All roles')
  const [query, setQuery] = useState('')

  const filtered = staff.filter(
    (p) =>
      (role === 'All roles' || p.role === role) &&
      (query.trim() === '' || p.name.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff Directory' }]} />
      <PageHeader
        title="Staff directory"
        lead="Open anyone to see their availability and shifts."
        actions={
          <Button href="/staffing/team" variant="primary" size="md" data-guide="view-availability">
            <Icon name="clock" size={14} />
            View availability
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
            const shifts = assignmentsForStaff(person.id)
            const declined = shifts.filter((s) => s.status === 'declined').length
            const pending = shifts.filter((s) => s.status === 'pending').length
            return (
              <StaffCard
                key={person.id}
                person={person}
                shiftCount={shifts.length}
                trailing={
                  <div className="hidden gap-1.5 sm:flex">
                    {declined > 0 && (
                      <StatusBadge tone="declined" size="sm">
                        {declined} declined
                      </StatusBadge>
                    )}
                    {pending > 0 && (
                      <StatusBadge tone="pending" size="sm">
                        {pending} pending
                      </StatusBadge>
                    )}
                  </div>
                }
              />
            )
          })}
        </Card>
      )}
    </div>
  )
}
