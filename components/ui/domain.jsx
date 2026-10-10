'use client'

// ---------------------------------------------------------------------------
// DESIGN LIBRARY — domain components
//
// These encode the product's own concepts: an attention item, an event, a
// task, an overlay, a toast. Built on the primitives so the
// borders, status colours and button hierarchy stay consistent.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cx } from '@/lib/cx'
import { daysOutLabel } from '@/lib/mock/events'
import { Button, Icon, ListRow, StatusBadge } from './primitives'

/** The one way to say how many roles are unfilled: "1 open spot", "3 open spots". */
export function openSpots(n) {
  return `${n} open spot${n === 1 ? '' : 's'}`
}

/* ---------------------------------------------------------- UpNextItem --
 *
 * The single most important component in the product. It answers, in order:
 *   how soon  ->  what happened  ->  which event  ->  why it matters  ->  what to do.
 *
 * Status before detail: the chip says whether it needs the user today
 * (status-now) or this week (status-soon) in words, before the title. Only
 * the first item in a list gets the filled ink button, so one action leads.
 * Lists of these sit in a container with `divide-y divide-line`.
 *
 * `onDismiss` adds a quiet "Hide" next to the action, but only for items that
 * are `dismissible`: staffing items can't be hidden, because hiding them would
 * look like fixing them. Pair it with useHideWithUndo so a hide can be undone.
 */

export function UpNextItem({ item, compact = false, first = false, badge = false, onDismiss }) {
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
            <span className="text-small text-ink-muted">
              {item.eventName} · {item.meta}
            </span>
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

        <div className="flex shrink-0 items-center gap-2">
          {onDismiss && item.dismissible && (
            <Button variant="ghost" size="sm" onClick={() => onDismiss(item)}>
              Hide
            </Button>
          )}
          <Button href={item.href} variant={first ? 'primary' : 'secondary'} size="sm">
            {item.actionLabel}
            <Icon name="arrowRight" size={14} />
          </Button>
        </div>
      </div>
    </article>
  )
}

/**
 * Hide an Up Next item, with a toast that can undo it. Returns the handler to
 * pass to UpNextItem's onDismiss. `store` is the useStore() value.
 */
export function useHideWithUndo(store) {
  const { dismissAttention, restoreAttention, toast } = store
  return (item) => {
    dismissAttention(item.id)
    toast(`Hid "${item.title}".`, 'done', {
      small: 'It is still open. Show hidden items on Up Next or in Settings brings it back.',
      actions: [{ label: 'Undo', onClick: () => restoreAttention(item.id) }]
    })
  }
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
            {attentionCount} in Up Next
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
              {openSpots(coverage.short)}
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
              {attentionCount} in Up Next
            </StatusBadge>
          )}
          {coverage && !coverage.complete && (
            <StatusBadge tone="warn" size="sm">
              {openSpots(coverage.short)}
            </StatusBadge>
          )}
          {coverage && coverage.complete && (
            <StatusBadge tone="done" size="sm">
              Fully staffed
            </StatusBadge>
          )}
        </div>
      }
    />
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
// The one overlay in the product. Two shapes, same behaviour:
//   variant="dialog"  centred box (confirmations, short forms)
//   variant="sheet"   right-hand panel, a bottom sheet under 640px (longer
//                     work: asking staff, reviewing texts, a staff phone)
// Focus moves in on open (to [data-autofocus] if present), Tab cycles inside,
// Escape and backdrop click close, and focus returns to the opener. USER
// CONTROL: never trap the tester.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  labelledBy = 'modal-title',
  variant = 'dialog',
  width = 'sm:w-[460px]'
}) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const panel = ref.current
    ;(panel?.querySelector('[data-autofocus]') || panel)?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current?.()
      } else if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    panel?.addEventListener('keydown', onKey)
    return () => {
      panel?.removeEventListener('keydown', onKey)
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus()
    }
  }, [open])

  if (!open) return null

  const sheet = variant === 'sheet'

  return (
    <div
      className={cx(
        'fixed inset-0 z-50 flex bg-black/45',
        sheet ? 'items-end sm:items-stretch sm:justify-end' : 'items-end justify-center sm:items-center sm:p-4'
      )}
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cx(
          'flex w-full flex-col border-line bg-surface shadow-overlay focus:outline-none',
          sheet
            ? cx('max-h-[88vh] rounded-t-3xl border-t sm:max-h-none sm:rounded-none sm:rounded-l-3xl sm:border-t-0 sm:border-l', width)
            : 'max-h-[90vh] max-w-lg rounded-t-md border sm:rounded-md motion-safe:animate-[vue-rise_.2s_ease-out]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 id={labelledBy} className="text-title font-light text-ink">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-small text-ink-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Icon name="x" size={14} />
            <span className="sr-only">Close</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- Toasts --- */
// FEEDBACK: every meaningful action drops one of these. role="status" so it is
// announced to screen readers without stealing focus.
//
// A toast is { id, message, tone?, small?, actions? }. `actions` is a list of
// { label, onClick } shown as small buttons (e.g. Undo, Open Jo's phone); the
// toast closes after an action runs. Hosts own their timing.

export function ToastHost({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-3"
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
          <div className="min-w-0 flex-1">
            <p>{t.message}</p>
            {t.small && <p className="mt-1 text-label text-ink-muted">{t.small}</p>}
            {t.actions?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {t.actions.map((a) => (
                  <Button
                    key={a.label}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      a.onClick()
                      onDismiss(t.id)
                    }}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
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
