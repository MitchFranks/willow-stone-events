'use client'

// SCREEN 12 — Event Documents.
// Marking a document signed asks first, can be undone, and removes its Up Next
// item. Dana signs for the venue, so a waiting document is "Awaiting your
// signature" until it is "Signed".

import { use } from 'react'
import { useStore } from '@/lib/store'
import { Button, Card, EmptyState, ListRow, StatusBadge } from '@/components/ui/primitives'
import { useConfirm } from '@/components/ui/domain'

export default function DocumentsPage({ params }) {
  const { id } = use(params)
  const { documentList, signDocument, unsignDocument, toast } = useStore()
  const { confirm, dialog } = useConfirm()
  const docs = documentList.filter((d) => d.eventId === id)
  const toSign = docs.filter((d) => d.tone === 'urgent').length

  function askToSign(d) {
    confirm({
      title: `Mark "${d.name}" as signed?`,
      body: 'Do this once you have signed it. The couple then sees the schedule as agreed.',
      confirmLabel: 'Mark signed',
      onConfirm: () => {
        signDocument(d.id)
        toast(`${d.name} is signed.`, 'done', {
          actions: [{ label: 'Undo', onClick: () => unsignDocument(d.id) }]
        })
      }
    })
  }

  return (
    <Card
      title="Documents and contracts"
      icon="file"
      subtitle={`${docs.length} ${docs.length === 1 ? 'file' : 'files'}${toSign ? ` · ${toSign} ready for your signature` : ''}`}
      bodyClassName="px-0 py-0"
    >
      {docs.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No documents" body="Contracts and plans attached to this event will show here." />
        </div>
      ) : (
        docs.map((d) => (
          <ListRow
            key={d.id}
            title={d.name}
            sub={`${d.kind} · Updated ${d.updated}`}
            trailing={
              <>
                <StatusBadge tone={d.tone} size="sm">
                  {d.tone === 'urgent' ? 'Awaiting your signature' : d.status}
                </StatusBadge>
                {d.tone === 'urgent' && (
                  <Button size="sm" variant="primary" onClick={() => askToSign(d)}>
                    Mark signed
                  </Button>
                )}
              </>
            }
          />
        ))
      )}
      {dialog}
    </Card>
  )
}
