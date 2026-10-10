'use client'

// ---------------------------------------------------------------------------
// DESIGN LIBRARY — domain components
//
// These encode the product's own concepts: an attention item, an event, a
// shift, a staff member, an availability grid. Built on the primitives so the
// borders, status colours and button hierarchy stay consistent.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cx } from '@/lib/cx'
import { hourLabel } from '@/lib/store'
import { daysOutLabel } from '@/lib/mock/events'
import { Avatar, Button, Card, Icon, ListRow, StatusBadge } from './primitives'

/* ---------------------------------------------------------- UpNextItem --
 *
 * The single most important component in the product. It answers, in order:
 *   how soon  ->  what happened  ->  which event  ->  why it matters  ->  what to do.
 *
 * Status before detail: the chip says whether it needs the user today
 * (status-now) or this week (status-soon) in words, before the title. Only
 * the first item in a list gets the filled ink button, so one action leads.
 * Lists of these sit in a container with `divide-y divide-line`.
 */

export function UpNextItem({ item, compact = false, first = false, badge = false }) {
  const urgent = item.tone === 'urgent'
  return (
    <article className="bg-surface px-4 py-4 transition-colors duration-150 hover:bg-surface-sunken/40 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Only where the list is not already grouped under "Do first" / "Coming up". */}
            {badge && (
              <StatusBadge tone={urgent ? 'urgent' : 'warn'} size="sm">
                {urgent ? 'Do first' : 'Coming up'}
              </StatusBadge>
            )}
            <Link
              href={`/events/${item.eventId}`}
              className="rounded-sm px-1 text-small text-ink-muted transition-colors hover:text-accent"
            >
              {item.eventName}
            </Link>
            <span className="text-small text-ink-muted">· {item.meta}</span>
          </div>

          <h3 className="text-heading font-medium text-ink">{item.title}</h3>

          {!compact && (
            <dl className="mt-2 space-y-1 text-small">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink-muted">What</dt>
                <dd className="text-ink">{item.what}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink-muted">Why</dt>
                <dd className="text-ink">{item.why}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="shrink-0">
          <Button href={item.href} variant={first ? 'primary' : 'secondary'} size="sm">
            {item.actionLabel}
            <Icon name="arrowRight" size={14} />
          </Button>
        </div>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------- EventCard -- */

export function EventCard({ event, coverage, attentionCount = 0, guide = false }) {
  return (
    <Link
      href={`/events/${event.id}`}
      data-guide={guide ? 'events-first' : undefined}
      className="block rounded-md border border-line bg-surface px-6 py-5 shadow-raised transition-colors duration-150 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-heading font-medium text-ink">{event.name}</h3>
            <span className="text-small text-ink-muted">{event.type}</span>
          </div>
          <p className="mt-1 text-small text-ink-muted">
            {event.dateShort} · {event.headline} · {event.guests} expected
          </p>
          <p className="text-small text-ink-muted">{event.spaces}</p>
        </div>
        <Icon name="chevronRight" size={16} className="mt-1 text-ink-muted" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {attentionCount > 0 ? (
          <StatusBadge tone="urgent" size="sm">
            {attentionCount} up next
          </StatusBadge>
        ) : (
          <StatusBadge tone="done" size="sm">
            All set
          </StatusBadge>
        )}
        {coverage &&
          (coverage.complete ? (
            <StatusBadge tone="done" size="sm">
              Fully staffed
            </StatusBadge>
          ) : (
            <StatusBadge tone="warn" size="sm">
              Needs {coverage.short} more
            </StatusBadge>
          ))}
        <span className="ml-auto text-small text-ink-muted">{event.bookingStatus} · {daysOutLabel(event)}</span>
      </div>
    </Link>
  )
}

/* --------------------------------------------------------------- EventRow -- */

export function EventRow({ event, coverage, attentionCount = 0 }) {
  return (
    <ListRow
      href={`/events/${event.id}`}
      title={event.name}
      sub={`${event.dateShort} · ${event.type} · ${event.guests} expected`}
      meta={event.spaces}
      trailing={
        <div className="hidden items-center gap-2 sm:flex">
          {attentionCount > 0 && (
            <StatusBadge tone="urgent" size="sm">
              {attentionCount}
            </StatusBadge>
          )}
          {coverage && !coverage.complete && (
            <StatusBadge tone="warn" size="sm">
              Needs {coverage.short} more
            </StatusBadge>
          )}
          {coverage && coverage.complete && (
            <StatusBadge tone="done" size="sm">
              Staffed
            </StatusBadge>
          )}
        </div>
      }
    />
  )
}

/* -------------------------------------------------------------- StaffCard -- */

export function StaffCard({ person, shiftCount, trailing }) {
  return (
    <ListRow
      href={`/staff/${person.id}`}
      leading={<Avatar initials={person.initials} />}
      title={person.name}
      sub={`${person.role} · ${person.preferredHours}`}
      meta={shiftCount != null ? `${shiftCount} shift${shiftCount === 1 ? '' : 's'} this week` : undefined}
      trailing={trailing}
    />
  )
}

/* -------------------------------------------------------------- AssignmentCard -- */
// Used in staff detail and shift lists. Shows status with a badge, and the
// accept/decline controls when the viewer can act on them.

export function AssignmentCard({ assignment, event, block, onAccept, onDecline, showActions }) {
  const tone =
    assignment.status === 'accepted'
      ? 'done'
      : assignment.status === 'declined'
        ? 'declined'
        : assignment.status === 'draft'
          ? 'info'
          : 'pending'
  return (
    <div className="border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/staffing/${event.id}`} className="font-medium text-ink transition-colors hover:text-accent">
            {event.name}
          </Link>
          <p className="text-small text-ink-muted">
            {block.name} · {event.dateShort} · {hourLabel(block.start)}–{hourLabel(block.end)}
          </p>
          <p className="text-small text-ink-muted">Role: {assignment.role}</p>
          {assignment.status === 'declined' && assignment.declineReason && (
            <p className="mt-1 text-small text-status-now">Reason: {assignment.declineReason}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge tone={tone} size="sm">
            {assignment.status === 'accepted'
              ? 'Accepted'
              : assignment.status === 'declined'
                ? 'Declined'
                : assignment.status === 'draft'
                  ? 'Not sent'
                  : 'Pending'}
          </StatusBadge>
          {showActions && assignment.status !== 'declined' && (
            <div className="flex gap-1.5">
              {assignment.status !== 'accepted' && (
                <Button size="sm" variant="secondary" onClick={onAccept}>
                  Accept
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={onDecline}>
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Link
          href={`/staffing/${event.id}?block=${block.id}&role=${encodeURIComponent(assignment.role)}`}
          className="text-small text-accent underline-offset-4 hover:underline"
        >
          Open on the board
        </Link>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- EventBlock -- */
// One block of an event (Setup / Ceremony / Reception / Teardown) with its
// staffing requirement and who is currently on it.

export function EventBlock({ event, block, assignments, openPositions, children }) {
  const blockPositions = openPositions.filter((g) => g.block.id === block.id)
  return (
    <Card
      title={block.name}
      subtitle={`${hourLabel(block.start)} – ${hourLabel(block.end)}${block.kind === 'setup' ? ' · Load-in / setup (operations)' : block.kind === 'teardown' ? ' · Teardown (operations)' : ''}`}
      action={
        blockPositions.length ? (
          <StatusBadge tone="warn" size="sm">
            Needs {blockPositions.reduce((n, g) => n + g.short, 0)}
          </StatusBadge>
        ) : (
          <StatusBadge tone="done" size="sm">
            Staffed
          </StatusBadge>
        )
      }
      bodyClassName="px-0 py-0"
    >
      <p className="border-b border-line px-4 py-3 text-small text-ink-muted sm:px-6">{block.note}</p>

      <div className="border-b border-line px-4 py-3 sm:px-6">
        <div className="text-small text-ink-muted">Requires</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {block.requirements.map((requirement) => {
            const filled = assignments.filter((a) => a.role === requirement.role && a.status === 'accepted').length
            const ok = filled >= requirement.count
            return (
              <span
                key={requirement.role}
                className={cx(
                  'inline-flex h-6 items-center gap-1 rounded-full pl-2 pr-2.5 text-label font-medium',
                  ok ? 'bg-status-clear-soft text-status-clear' : 'bg-status-now-soft text-status-now'
                )}
              >
                <Icon name={ok ? 'check' : 'alert'} size={13} />
                {requirement.role}: <span className="font-mono tabular-nums">{filled}/{requirement.count}</span>
              </span>
            )
          })}
        </div>
      </div>

      {children}
    </Card>
  )
}

/* -------------------------------------------------------- AvailabilityGrid -- */
// A simple 7-day x hour grid. Filled cells = stated availability. Deliberately
// blocky and unstyled-looking; this is a wireframe of a scheduling grid.

const GRID_START = 7
const GRID_END = 24

export function AvailabilityGrid({ person, highlight }) {
  const days = Object.keys(person.availability)
  const hours = []
  for (let h = GRID_START; h < GRID_END; h += 1) hours.push(h)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse font-mono text-label tabular-nums">
        <caption className="sr-only">{person.name} weekly availability</caption>
        <thead>
          <tr>
            <th scope="col" className="w-10 border border-line bg-surface-sunken p-1 text-left font-sans font-medium text-ink-muted">
              Day
            </th>
            {hours.map((h) => (
              <th key={h} scope="col" className="border border-line bg-surface-sunken p-1 font-normal text-ink-muted">
                {h % 12 === 0 ? 12 : h % 12}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <th scope="row" className="border border-line bg-surface-sunken p-1 text-left font-sans font-medium text-ink">
                {day}
              </th>
              {hours.map((h) => {
                const free = (person.availability[day] || []).some((w) => w.start <= h && w.end >= h + 1)
                const isHighlight =
                  highlight && highlight.day === day && h >= Math.floor(highlight.start) && h < highlight.end
                return (
                  <td
                    key={h}
                    className={cx(
                      'border border-line p-0',
                      free ? 'bg-status-clear-soft' : 'bg-surface',
                      isHighlight && 'outline-2 outline-offset-[-2px] outline-accent'
                    )}
                  >
                    <span className="sr-only">
                      {day} {hourLabel(h)} {free ? 'available' : 'unavailable'}
                    </span>
                    <span className="block h-4 w-full" />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex flex-wrap items-center gap-4 text-small text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 border border-line bg-status-clear-soft" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 border border-line bg-surface" /> Not available
        </span>
        {highlight && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 border-2 border-accent" /> Position being filled
          </span>
        )}
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- TaskRow --- */

export function TaskRow({ task, onToggle }) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-6">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.done}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`task-${task.id}`}
          className={cx('block cursor-pointer', task.done ? 'text-ink-muted' : 'text-ink')}
        >
          {task.title}
        </label>
        <p className="text-small text-ink-muted">{task.detail}</p>
        <p className="text-small text-ink-muted">Owner: {task.owner}</p>
      </div>
      <div className="shrink-0">
        {task.done ? (
          <StatusBadge tone="done" size="sm">
            Done
          </StatusBadge>
        ) : (
          <StatusBadge tone={task.dueTone === 'urgent' ? 'urgent' : task.dueTone === 'warn' ? 'warn' : 'info'} size="sm">
            {task.due}
          </StatusBadge>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- Modal --- */
// Focus is moved into the dialog on open and Escape closes it. Backdrop click
// closes too — USER CONTROL: never trap the tester.

export function Modal({ open, onClose, title, children, footer, labelledBy = 'modal-title' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-md border border-line bg-surface shadow-overlay sm:rounded-md motion-safe:animate-[vue-rise_.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <h2 id={labelledBy} className="text-title font-light text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Icon name="x" size={14} />
            <span className="sr-only">Close</span>
          </button>
        </header>
        <div className="px-6 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

/* ----------------------------------------------------- ConfirmationToast --- */
// FEEDBACK: every meaningful action drops one of these. role="status" so it is
// announced to screen readers without stealing focus.

export function ToastHost({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-3"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md border border-line bg-surface px-4 py-3 text-ink shadow-overlay motion-safe:animate-[vue-rise_.2s_ease-out]"
        >
          <Icon
            name={t.tone === 'urgent' ? 'alert' : 'check'}
            size={16}
            className={cx('mt-0.5', t.tone === 'urgent' ? 'text-status-now' : 'text-status-clear')}
          />
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => onDismiss(t.id)} className="rounded-sm text-ink-muted transition-colors hover:text-ink">
            <Icon name="x" size={13} />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------- ConfirmDialog ----- */
// ERROR PREVENTION: wraps a destructive/confusing action in an explicit step.

export function useConfirm() {
  const [pending, setPending] = useState(null)
  const confirm = (config) => setPending(config)
  const close = () => setPending(null)
  const dialog = (
    <Modal
      open={!!pending}
      onClose={close}
      title={pending?.title || ''}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant={pending?.danger ? 'danger' : 'primary'}
            onClick={() => {
              pending?.onConfirm?.()
              close()
            }}
          >
            {pending?.confirmLabel || 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-ink">{pending?.body}</p>
    </Modal>
  )
  return { confirm, dialog }
}
