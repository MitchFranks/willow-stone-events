'use client'

// Add an away date: a date (or all day), optional From–To, optional reason.
// Shared by Team (addedBy manager) and the Staff phone (addedBy staff).

import { useState } from 'react'
import { TODAY_KEY } from '@/lib/mock/events'
import { Button, FilterChip, Select, TextInput } from '@/components/ui/primitives'
import { fmtH } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

const HALF_HOURS = Array.from({ length: 49 }, (_, i) => i / 2)

export function AwayDateForm({ staffId, addedBy = 'manager', idPrefix = 'away' }) {
  const { addAway } = useStaffing2()
  const [dateKey, setDateKey] = useState(TODAY_KEY)
  const [allDay, setAllDay] = useState(true)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(16)
  const [reason, setReason] = useState('')
  const valid = dateKey && (allDay || end > start)

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    addAway({ staffId, dateKey, ...(allDay ? {} : { start, end }), reason: reason.trim() || null, addedBy })
    setReason('')
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border border-line p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Date" id={`${idPrefix}-date`} type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
        <div>
          <span className="mb-1.5 block text-small text-ink-muted">Time</span>
          <div className="flex gap-2" role="group" aria-label="All day or part of the day">
            {[
              [true, 'All day'],
              [false, 'Part of the day']
            ].map(([v, label]) => (
              <FilterChip key={label} pressed={allDay === v} onClick={() => setAllDay(v)}>
                {label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="From"
            id={`${idPrefix}-from`}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            options={HALF_HOURS.slice(0, -1).map((h) => ({ value: h, label: h === 0 ? 'Start of day' : fmtH(h) }))}
          />
          <Select
            label="To"
            id={`${idPrefix}-to`}
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
            error={end > start ? null : '"To" must be after "From".'}
            options={HALF_HOURS.slice(1).map((h) => ({ value: h, label: h === 24 ? 'End of day' : fmtH(h) }))}
          />
        </div>
      )}
      <TextInput label="Reason (optional)" id={`${idPrefix}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Class, family, another job…" />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!valid}>
          Add away date
        </Button>
      </div>
    </form>
  )
}
