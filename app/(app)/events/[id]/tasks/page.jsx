'use client'

// SCREEN 7 — Event Tasks.
// Ticking a task off removes its Up Next item, because the Up Next list is
// derived from task state rather than stored separately. A task that needs a
// number (the catering guarantee) is completed by sending the number, not by
// ticking a box, so the event never looks done without the count.

import { use, useState } from 'react'
import { useStore } from '@/lib/store'
import { useStaffing2 } from '@/lib/staffing/store'
import { eventOf } from '@/lib/staffing/derive'
import { eventById } from '@/lib/mock/events'
import { Button, Card, EmptyState, StatusBadge, TextInput } from '@/components/ui/primitives'
import { TaskRow } from '@/components/ui/domain'

/** The guarantee task: an inline form instead of a checkbox. */
function GuestCountTask({ task, expected, onSubmit }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const max = Math.ceil(expected * 1.2)

  function submit(e) {
    e.preventDefault()
    const n = Number(value)
    if (value.trim() === '' || !Number.isInteger(n) || n <= 0) {
      setError('Enter the number of guests as a whole number above 0.')
      return
    }
    if (expected > 0 && n > max) {
      setError(`That is more than 20% over the ${expected} expected. Check the number (at most ${max}).`)
      return
    }
    setError(null)
    onSubmit(n)
  }

  return (
    <div className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-ink">{task.title}</p>
        <p className="text-small text-ink-muted">{task.detail}</p>
        <p className="text-small text-ink-muted">Owner: {task.owner}</p>
        <form onSubmit={submit} noValidate className="mt-3 flex flex-wrap items-start gap-2">
          <TextInput
            label="Guaranteed guest count"
            id={`gc-${task.id}`}
            type="number"
            inputMode="numeric"
            min="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={expected ? String(expected) : undefined}
            hint={expected ? `${expected} guests expected.` : undefined}
            error={error}
            className="w-56"
          />
          <Button type="submit" variant="primary" className="mt-[26px]">
            Send to catering
          </Button>
        </form>
      </div>
      <div className="shrink-0">
        <StatusBadge tone={task.dueTone === 'urgent' ? 'urgent' : task.dueTone === 'warn' ? 'warn' : 'info'} size="sm">
          {task.due}
        </StatusBadge>
      </div>
    </div>
  )
}

export default function TasksPage({ params }) {
  const { id } = use(params)
  const { taskList, toggleTask, submitGuestCount, toast } = useStore()
  const { state: planner } = useStaffing2()
  const plannerEvent = eventOf(planner, id)
  const tasks = taskList.filter((t) => t.eventId === id)
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  function handleToggle(task) {
    toggleTask(task.id)
    toast(task.done ? `Reopened "${task.title}".` : `Completed "${task.title}".`)
  }

  function sendCount(task, n) {
    submitGuestCount(task.id, id, n)
    toast(`Sent a guarantee of ${n} guests to catering.`, 'done', {
      small: 'The event header and the Staffing Planner now use this number.'
    })
  }

  // A sent guarantee shows its number when the task is listed as done.
  const withCount = (task) =>
    task.input === 'guestCount' && plannerEvent?.guaranteedCount
      ? { ...task, detail: `Sent: ${plannerEvent.guaranteedCount} guests guaranteed.` }
      : task

  if (tasks.length === 0) {
    return <EmptyState title="No tasks on this event" body="Tasks added here appear in Up Next once they come due." />
  }

  return (
    <div className="space-y-4">
      <Card title="Open" subtitle={`${open.length} remaining`} icon="list" bodyClassName="px-0 py-0">
        {open.length === 0 ? (
          <p className="px-4 py-4 text-body text-ink-muted sm:px-6">Everything on this event is done.</p>
        ) : (
          open.map((task) =>
            task.input === 'guestCount' ? (
              <GuestCountTask
                key={task.id}
                task={task}
                expected={plannerEvent?.expectedGuests ?? eventById(id)?.guests ?? 0}
                onSubmit={(n) => sendCount(task, n)}
              />
            ) : (
              <TaskRow key={task.id} task={task} onToggle={() => handleToggle(task)} />
            )
          )
        )}
      </Card>

      <Card title="Completed" subtitle={`${done.length} done`} icon="check" bodyClassName="px-0 py-0">
        {done.length === 0 ? (
          <p className="px-4 py-4 text-body text-ink-muted sm:px-6">Nothing completed yet.</p>
        ) : (
          done.map((task) => <TaskRow key={task.id} task={withCount(task)} onToggle={() => handleToggle(task)} />)
        )}
      </Card>
    </div>
  )
}
