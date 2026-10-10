'use client'

// Staffing Planner tab bar: Events · Team · Staff phone (prototype). Shown on
// the list, Team and phone screens. The event screen is reached from Events and returns
// by breadcrumb, so no tab ever changes meaning (spec §B).

import { usePathname } from 'next/navigation'
import { Tabs } from '@/components/ui/primitives'

export function Staffing2Nav() {
  const pathname = (usePathname() || '').replace(/\/$/, '')
  const active = pathname.endsWith('/team') ? 'team' : pathname.endsWith('/phone') ? 'phone' : 'events'
  return (
    <Tabs
      active={active}
      tabs={[
        { id: 'events', label: 'Events', href: '/staffing' },
        { id: 'team', label: 'Team', href: '/staffing/team' },
        { id: 'phone', label: 'Staff phone (prototype)', href: '/staffing/phone' }
      ]}
    />
  )
}

/** Muted placeholder cards shown until saved state has been read. */
export function SkeletonCards({ count = 3 }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface-card px-5 py-5">
          <div className="h-4 w-48 rounded-full bg-surface-sunken" />
          <div className="mt-3 h-3 w-72 max-w-full rounded-full bg-surface-sunken" />
          <div className="mt-4 flex gap-2">
            <div className="h-5 w-24 rounded-full bg-surface-sunken" />
            <div className="h-5 w-20 rounded-full bg-surface-sunken" />
          </div>
        </div>
      ))}
    </div>
  )
}
