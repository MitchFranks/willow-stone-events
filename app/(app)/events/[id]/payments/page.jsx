'use client'

// SCREEN 10 — Event Payments.
// Recording a due installment asks first, then offers an Undo; it also clears
// the matching Up Next item, because Up Next is derived from payment state.

import { use } from 'react'
import { useStore } from '@/lib/store'
import { money } from '@/lib/mock/records'
import { Button, Card, EmptyState, Field, StatusBadge } from '@/components/ui/primitives'
import { useConfirm } from '@/components/ui/domain'

const STATE = {
  paid: { tone: 'done', label: 'Paid' },
  due: { tone: 'warn', label: 'Due' },
  scheduled: { tone: 'info', label: 'Scheduled' }
}

export default function PaymentsPage({ params }) {
  const { id } = use(params)
  const { paymentsForEvent, recordPayment, undoPayment, toast } = useStore()
  const { confirm, dialog } = useConfirm()
  const pay = paymentsForEvent(id)

  if (!pay) {
    return <EmptyState title="No payment schedule" body="This event has no invoicing set up yet." />
  }

  const outstanding = pay.total - pay.paid
  const pct = Math.round((pay.paid / pay.total) * 100)

  function askToRecord(row) {
    confirm({
      title: `Record ${money(row.amount)} as paid?`,
      body: `This marks the ${row.label.toLowerCase()} as received today. Only do this once the money has arrived.`,
      confirmLabel: 'Record payment',
      onConfirm: () => {
        recordPayment(id, row.id)
        toast(`Recorded the ${row.label.toLowerCase()} of ${money(row.amount)}.`, 'done', {
          actions: [{ label: 'Undo', onClick: () => undoPayment(id, row.id) }]
        })
      }
    })
  }

  function undo(row) {
    undoPayment(id, row.id)
    toast(`The ${row.label.toLowerCase()} is due again.`)
  }

  return (
    <div className="space-y-4">
      <Card title="Balance" icon="dollar" subtitle={`${pct}% collected`}>
        <dl className="grid grid-cols-3 gap-3">
          <Field label="Contract total" value={money(pay.total)} />
          <Field label="Paid to date" value={money(pay.paid)} />
          <Field label="Outstanding">
            <span className={outstanding > 0 ? 'font-medium text-status-soon' : 'text-status-clear'}>{money(outstanding)}</span>
          </Field>
        </dl>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full border border-line bg-surface-sunken"
          role="progressbar"
          aria-label="Share of the contract collected"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full bg-status-clear" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card title="Payment schedule" icon="list" bodyClassName="px-0 py-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-body">
            <caption className="sr-only">Payment schedule</caption>
            <thead>
              <tr className="border-b border-line text-left text-small text-ink-muted">
                <th scope="col" className="px-4 py-2 font-normal sm:px-6">
                  Installment
                </th>
                <th scope="col" className="px-4 py-2 font-normal">
                  When
                </th>
                <th scope="col" className="px-4 py-2 text-right font-normal">
                  Amount
                </th>
                <th scope="col" className="px-4 py-2 font-normal">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 sm:px-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pay.schedule.map((row) => {
                const s = STATE[row.state] || STATE.scheduled
                return (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 font-medium text-ink sm:px-6">{row.label}</td>
                    <td className="px-4 py-3 text-small text-ink-muted">{row.when}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">{money(row.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={s.tone} size="sm">
                        {s.label}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      {row.state === 'due' && (
                        <Button size="sm" variant="primary" onClick={() => askToRecord(row)}>
                          Record payment
                        </Button>
                      )}
                      {row.recordedHere && (
                        <Button size="sm" variant="ghost" onClick={() => undo(row)}>
                          Undo
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {dialog}
    </div>
  )
}
