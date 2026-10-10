'use client'

// The interactive samples on the design library page (it is a server page,
// so anything with state lives here).

import { useState } from 'react'
import { Button, FilterChip, FilterGroup } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/domain'

export function FilterDemo() {
  const [kind, setKind] = useState('all')
  const kinds = [
    { id: 'all', label: 'Everything', count: 5 },
    { id: 'staffing', label: 'Staffing', count: 3 },
    { id: 'message', label: 'Messages', count: 1 }
  ]
  return (
    <FilterGroup label="Show">
      {kinds.map((k) => (
        <FilterChip key={k.id} pressed={kind === k.id} onClick={() => setKind(k.id)} count={k.count}>
          {k.label}
        </FilterChip>
      ))}
    </FilterGroup>
  )
}

export function ModalDemo() {
  const [open, setOpen] = useState(null)
  const close = () => setOpen(null)
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setOpen('dialog')}>Open a dialog</Button>
      <Button onClick={() => setOpen('sheet')}>Open a sheet</Button>

      <Modal
        open={open === 'dialog'}
        onClose={close}
        labelledBy="sg-dialog-title"
        title="Remove Jo from the reception?"
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="danger" onClick={close}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-ink">The spot opens again and shows up in Up Next. Used for confirmations and short forms.</p>
      </Modal>

      <Modal
        open={open === 'sheet'}
        onClose={close}
        variant="sheet"
        labelledBy="sg-sheet-title"
        title="Ask staff"
        subtitle="Johnson Wedding · Reception"
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" onClick={close}>
              Send texts
            </Button>
          </>
        }
      >
        <p className="text-ink">
          A right-hand panel (a bottom sheet on phones) for longer work: asking staff, reviewing texts, a staff phone.
        </p>
      </Modal>
    </div>
  )
}
