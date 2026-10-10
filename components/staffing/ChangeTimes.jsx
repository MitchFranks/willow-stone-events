'use client'

// Change times (spec §B.6) and the small "It's fine" dialog, which records
// why a conflict is acceptable. Both undoable.

import { useState } from 'react'
import { Modal } from '@/components/ui/domain'
import { Button, TextInput } from '@/components/ui/primitives'
import { WORLD } from '@/lib/staffing/adapter'
import { openIssues, roleBlocks, staffById } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'
import { BlockToggles, CallTimeSelect, PickChips } from './controls'

export function ChangeTimes({ requestId, onClose }) {
  const { state, changeTimes } = useStaffing2()
  const r = state.requests[requestId]
  const [blocks, setBlocks] = useState(r ? r.blockIds : [])
  const [offset, setOffset] = useState(r ? r.callOffsetMin : 0)
  if (!r) return null
  const ev = WORLD.eventMap[r.eventId]
  const options = roleBlocks(r.eventId, r.role, state)
  const startH = ev.blocks.find((b) => blocks.includes(b.id))?.start ?? 0
  const sent = r.status !== 'draft'

  return (
    <Modal
      open
      onClose={onClose}
      title={`Change ${staffById(r.staffId).name.split(' ')[0]}'s times`}
      labelledBy="change-times-title"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              changeTimes(r.id, blocks, offset)
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-small text-ink-muted">
          {r.role} at the {ev.name}. {sent ? 'They already got a text, so after saving, send them the new times.' : 'Nothing has been sent yet.'}
        </p>
        <div>
          <span className="mb-1.5 block text-small text-ink-muted">Working</span>
          <BlockToggles blocks={options} selected={blocks} onChange={setBlocks} />
        </div>
        <CallTimeSelect id="change-call" startH={startH} value={offset} onChange={setOffset} />
      </div>
    </Modal>
  )
}

export function MarkOkDialog({ requestId, onClose }) {
  const { state, markOk } = useStaffing2()
  const [reason, setReason] = useState('')
  const r = state.requests[requestId]
  if (!r) return null
  const issues = openIssues(r, state).filter((i) => i.severity === 'hard' || i.severity === 'soft')
  const name = staffById(r.staffId).name.split(' ')[0]
  return (
    <Modal
      open
      onClose={onClose}
      title={`Why is this fine for ${name}?`}
      labelledBy="mark-ok-title"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!reason.trim()}
            onClick={() => {
              markOk(r.id, reason.trim())
              onClose()
            }}
          >
            It&apos;s fine
          </Button>
        </>
      }
    >
      <ul className="mb-3 list-disc space-y-1 pl-5 text-small text-ink">
        {issues.map((i) => (
          <li key={i.ruleId + i.message}>{i.message}</li>
        ))}
      </ul>
      <PickChips options={['Checked with them', 'Times can flex', 'Renewal in progress']} value={reason} onChange={setReason} label="Quick reasons" />
      <TextInput
        label="Reason"
        id="ok-reason"
        className="mt-3"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        hint="Pick one above or type your own. The warning stays visible as “You said it's fine”."
      />
    </Modal>
  )
}
