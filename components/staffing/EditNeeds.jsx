'use client'

// ---------------------------------------------------------------------------
// Change how many people you need (spec §B.5 "Edit needs"): event fields, a
// stepper per block and role, the Suggested column, "+ Add a role", and "How
// suggestions work". Suggestions never change the numbers on their own;
// saving is one undoable action.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/domain'
import { Button, Icon, Select, TextInput } from '@/components/ui/primitives'
import { ROLES } from '@/lib/mock/staff'
import { WORLD } from '@/lib/staffing/adapter'
import { BAR_TYPES, NO_RULE_TEXT, RATIO_RULES, SERVICE_STYLES } from '@/lib/staffing/rules'
import { coverage, eventOf, needOf, rangeLabel, rolesOf, suggestedFor } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

export function EditNeeds({ eventId, onClose }) {
  const { state, saveNeeds } = useStaffing2()
  const base = WORLD.eventMap[eventId]
  const ev0 = eventOf(state, eventId)
  const [fields, setFields] = useState({
    expectedGuests: String(ev0.expectedGuests ?? ''),
    guaranteedCount: ev0.guaranteedCount ? String(ev0.guaranteedCount) : '',
    serviceStyle: ev0.serviceStyle || 'plated',
    bar: ev0.bar || 'none',
    barStations: String(ev0.barStations ?? 0),
    serversFrom: ev0.suppliedBy?.Server === 'caterer' ? 'caterer' : 'venue'
  })
  const [needs, setNeeds] = useState(() => {
    const out = {}
    for (const b of base.blocks) {
      out[b.id] = {}
      for (const role of rolesOf(b, state)) out[b.id][role] = needOf(b, role, state)
    }
    return out
  })

  const edits = useMemo(
    () => ({
      expectedGuests: Number(fields.expectedGuests) || 0,
      guaranteedCount: fields.guaranteedCount ? Number(fields.guaranteedCount) : null,
      serviceStyle: fields.serviceStyle,
      bar: fields.bar,
      barStations: Number(fields.barStations) || 0,
      suppliedBy: { ...(ev0.suppliedBy || {}), Server: fields.serversFrom }
    }),
    [fields, ev0.suppliedBy]
  )
  // A preview state so the Suggested column follows the form as you type.
  const preview = useMemo(
    () => ({ ...state, needs: { ...state.needs, ...needs }, eventEdits: { ...state.eventEdits, [eventId]: { ...(state.eventEdits[eventId] || {}), ...edits } } }),
    [state, needs, edits, eventId]
  )

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))
  const step = (blockId, role, d) =>
    setNeeds((n) => ({ ...n, [blockId]: { ...n[blockId], [role]: Math.max(0, (n[blockId][role] || 0) + d) } }))
  const setCount = (blockId, role, v) => setNeeds((n) => ({ ...n, [blockId]: { ...n[blockId], [role]: v } }))

  return (
    <Modal
      open
      onClose={onClose}
      title="Change how many people you need"
      labelledBy="edit-needs-title"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              saveNeeds(eventId, needs, edits)
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Guests expected" id="en-guests" type="number" min="0" value={fields.expectedGuests} onChange={set('expectedGuests')} />
          <TextInput label="Guarantee" id="en-guarantee" type="number" min="0" value={fields.guaranteedCount} onChange={set('guaranteedCount')} hint="Final count, usually 48–72 h before" />
          <Select
            label="Service"
            id="en-service"
            value={fields.serviceStyle}
            onChange={set('serviceStyle')}
            options={SERVICE_STYLES.map((s) => ({ value: s.id, label: s.label }))}
          />
          <Select label="Bar" id="en-bar" value={fields.bar} onChange={set('bar')} options={BAR_TYPES.map((s) => ({ value: s.id, label: s.label }))} />
          <TextInput label="Bar stations" id="en-stations" type="number" min="0" value={fields.barStations} onChange={set('barStations')} />
          <Select
            label="Servers come from"
            id="en-servers"
            value={fields.serversFrom}
            onChange={set('serversFrom')}
            hint={fields.serversFrom === 'caterer' ? 'Server suggestions are turned off.' : undefined}
            options={[
              { value: 'venue', label: 'Venue' },
              { value: 'caterer', label: 'Caterer' }
            ]}
          />
        </div>

        {base.blocks.map((b) => {
          const roles = ROLES.filter((r) => r in needs[b.id])
          const missing = ROLES.filter((r) => !(r in needs[b.id]))
          return (
            <section key={b.id}>
              <h3 className="text-body font-medium text-ink">
                {b.name} <span className="font-normal text-ink-muted">{rangeLabel(b.start, b.end)}</span>
              </h3>
              <table className="mt-1.5 w-full table-fixed text-small">
                <colgroup>
                  <col />
                  <col className="w-[120px]" />
                  <col className="w-[84px]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-label text-ink-muted">
                    <th className="py-1 font-medium">Role</th>
                    <th className="py-1 font-medium">Needed</th>
                    <th className="py-1 text-right font-medium">Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => {
                    const sug = suggestedFor(eventId, b.id, role, preview)
                    const n = needs[b.id][role]
                    const confirmed = coverage(eventId, b, role, state).confirmed
                    return (
                      <tr key={role} className="border-t border-line">
                        <td className="py-1.5 pr-2 text-ink">
                          {role}
                          {n < confirmed && <span className="block text-label text-ink-muted">{confirmed} confirmed; extras stay on</span>}
                        </td>
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Button size="sm" className="w-8 px-0" aria-label={`Fewer ${role} on ${b.name}`} disabled={n === 0} onClick={() => step(b.id, role, -1)}>
                              <Icon name="minus" size={13} />
                            </Button>
                            <span className="w-6 text-center font-medium tabular-nums">{n}</span>
                            <Button size="sm" className="w-8 px-0" aria-label={`More ${role} on ${b.name}`} onClick={() => step(b.id, role, 1)}>
                              <Icon name="plus" size={13} />
                            </Button>
                          </span>
                        </td>
                        <td className="py-1.5 text-right text-ink-muted">
                          {sug && sug.suggested != null ? (
                            <span title={`${sug.rule.basis} · confidence ${sug.rule.confidence}`}>
                              {sug.suggested}
                              {sug.suggested !== n && (
                                <Button size="sm" variant="ghost" className="ml-1 px-2" onClick={() => setCount(b.id, role, sug.suggested)}>
                                  Use
                                </Button>
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {missing.length > 0 && (
                <Select
                  aria-label={`Add a role to ${b.name}`}
                  id={`en-add-${b.id}`}
                  className="mt-2 w-fit"
                  value=""
                  onChange={(e) => e.target.value && setCount(b.id, e.target.value, 1)}
                  options={[{ value: '', label: `+ Add a role to ${b.name}` }, ...missing]}
                />
              )}
            </section>
          )
        })}

        <details className="rounded-md border border-line px-3 py-2.5">
          <summary className="cursor-pointer text-small font-medium text-ink">How suggestions work</summary>
          <p className="mt-2 text-label text-ink-muted">
            Suggestions use the guarantee if there is one, otherwise guests expected. They apply only to guest-facing blocks, skip roles the caterer supplies, and never change your numbers unless you choose &quot;Use&quot;. These are venue defaults, not rules you must follow.
          </p>
          <ul className="mt-2 space-y-1.5 text-label text-ink">
            {RATIO_RULES.map((r) => (
              <li key={r.id}>
                <span className="font-medium">{r.role}:</span> {r.basis}. Confidence {r.confidence}. {r.source}
              </li>
            ))}
            <li>
              <span className="font-medium">Event Staff, Grounds, Venue Manager:</span> {NO_RULE_TEXT}
            </li>
          </ul>
        </details>
      </div>
    </Modal>
  )
}
