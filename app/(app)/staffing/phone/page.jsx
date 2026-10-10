'use client'

// ---------------------------------------------------------------------------
// Staffing Planner · Staff phone (spec §B.8). A PROTOTYPE SIMULATOR, not part
// of the product: pick a person, read the texts they got, and answer as them.
// ---------------------------------------------------------------------------

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader, Select } from '@/components/ui/primitives'
import { Staffing2Nav, SkeletonCards } from '@/components/staffing/Nav'
import { StaffPhone } from '@/components/staffing/StaffPhone'
import { WORLD } from '@/lib/staffing/adapter'
import { useStaffing2 } from '@/lib/staffing/store'

function PhoneScreen() {
  const params = useSearchParams()
  const { state, hydrated } = useStaffing2()
  const [who, setWho] = useState(null)

  useEffect(() => {
    if (!hydrated || who) return
    const wanted = params.get('who')
    setWho(WORLD.staffMap[wanted] ? wanted : state.messages[0]?.staffId || 'stf-4003')
  }, [hydrated, who, params, state.messages])

  const counts = Object.fromEntries(WORLD.staff.map((p) => [p.id, state.messages.filter((m) => m.staffId === p.id).length]))

  return (
    <div>
      <PageHeader
        title="Staff phone (prototype)"
        lead="Not part of the product. This stands in for each person's own phone so you can answer texts as them. Replies land on the event screen."
      />
      <Staffing2Nav />
      {!hydrated || !who ? (
        <SkeletonCards count={1} />
      ) : (
        <div className="space-y-4">
          <Select
            label="Viewing as"
            id="viewing-as"
            className="mx-auto max-w-[360px]"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            options={WORLD.staff.map((p) => ({
              value: p.id,
              label: `${p.name}${counts[p.id] ? ` (${counts[p.id]} text${counts[p.id] === 1 ? '' : 's'})` : ''}`
            }))}
          />
          <StaffPhone staffId={who} />
        </div>
      )}
    </div>
  )
}

export default function Staffing2PhonePage() {
  return (
    <Suspense fallback={null}>
      <PhoneScreen />
    </Suspense>
  )
}
