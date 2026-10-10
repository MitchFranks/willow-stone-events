'use client'

// Small controls shared by the Ask panel, Change times and the phone: block
// toggle chips, the call-time select and quick-pick reason chips. All built
// from the design library's FilterChip and Select.

import { FilterChip, Select } from '@/components/ui/primitives'
import { fmtH, rangeLabel } from '@/lib/staffing/derive'

export function BlockToggles({ blocks, selected, onChange, gaps = {}, label = 'Working' }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      if (selected.length === 1) return // at least one must stay selected
      onChange(selected.filter((x) => x !== id))
    } else onChange([...selected, id])
  }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {blocks.map((b) => (
        <FilterChip key={b.id} pressed={selected.includes(b.id)} onClick={() => toggle(b.id)}>
          {b.name} {rangeLabel(b.start, b.end)}
          {gaps[b.id] ? <span className="font-normal opacity-70">· {gaps[b.id]} open</span> : null}
        </FilterChip>
      ))}
    </div>
  )
}

export const CALL_OFFSETS = [0, -15, -30, -60]

export function callOptionLabel(offset, startH) {
  const t = fmtH(startH + offset / 60)
  if (offset === 0) return `On time (${t})`
  if (offset === -60) return `1 hour early (${t})`
  return `${-offset} min early (${t})`
}

export function CallTimeSelect({ id = 'call-time', startH, value, onChange }) {
  const opts = CALL_OFFSETS.includes(value) ? CALL_OFFSETS : [...CALL_OFFSETS, value].sort((a, b) => b - a)
  return (
    <Select
      label="Call time"
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      options={opts.map((o) => ({ value: o, label: callOptionLabel(o, startH) }))}
    />
  )
}

/** Quick-pick chips (reasons). Picking the pressed one clears it. */
export function PickChips({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <FilterChip key={o} pressed={value === o} onClick={() => onChange(value === o ? '' : o)}>
          {o}
        </FilterChip>
      ))}
    </div>
  )
}
