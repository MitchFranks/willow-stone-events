'use client'

// ---------------------------------------------------------------------------
// DESIGN LIBRARY — primitives
//
// Every screen in the prototype is assembled from these. Nothing re-implements
// a border, a status colour or a button style locally.
//
// SIMILARITY  One component per job, so anything with the same function looks
//             identical everywhere in the product.
// SIGNIFIERS  Buttons are filled or bordered at rest, not only on hover.
// NEVER COLOUR ALONE  StatusBadge always pairs a colour with a glyph and a word.
// QUIET BY DEFAULT  Ink on surface. Colour only for status, selection and focus.
//
// The rules behind every class here are in docs/STYLE-GUIDE.md.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { cx } from '@/lib/cx'

/* ------------------------------------------------------------------ Icon -- */
// One outline set: 1.5px stroke on a 24px grid, drawn in the current text
// colour. Status icons have fixed jobs: alert = act now, clock = coming up,
// check = handled.

const PATHS = {
  alert: <path d="M12 3.6 2.8 19.6h18.4L12 3.6Zm0 5.8v4.4m0 3h.01" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 1.9" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  dash: <path d="M6 12h12" />,
  users: (
    <>
      <path d="M16 20v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M17 4.2a3.5 3.5 0 0 1 0 6.6M22 20v-1.6a4 4 0 0 0-3-3.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  mail: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="1.5" />
      <path d="m3.4 6.5 8.6 6.2 8.6-6.2" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2.8v18.4" />
      <path d="M16.5 6.7H9.9a2.9 2.9 0 0 0 0 5.8h4.2a2.9 2.9 0 0 1 0 5.8H7" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  arrowRight: <path d="M5 12h13.5M13 5.5l5.5 6.5-5.5 6.5" />,
  arrowLeft: <path d="M19 12H5.5M11 5.5 5.5 12 11 18.5" />,
  chevronRight: <path d="m9.5 5.5 7 6.5-7 6.5" />,
  chevronDown: <path d="M5.5 9.5 12 16.5l6.5-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  grip: <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth="3" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10 11v5.5M14 11v5.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </>
  ),
  truck: (
    <>
      <path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8.2h.01" />
    </>
  ),
  send: <path d="M21.5 2.5 2.5 9.2l8 3.8 3.8 8 7.2-18.5Z" />,
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
}

export function Icon({ name, size = 16, className = '' }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg
      className={cx('shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  )
}

/* ---------------------------------------------------------------- Button -- */
// Every action is one of these. `primary` (ink fill) is the one action a
// region exists for: one per region. Buttons never take a status colour,
// except `danger`, whose text says the action destroys something.

const BUTTON_VARIANTS = {
  primary: 'border-transparent bg-ink text-on-ink hover:bg-ink/85',
  secondary: 'border-line-strong bg-surface text-ink hover:bg-surface-sunken',
  danger: 'border-line-strong bg-surface text-status-now hover:bg-status-now-soft',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-surface-sunken',
  // Outline for use on top of a dark photo (the landing hero).
  onDark: 'border-white/70 bg-transparent text-white hover:bg-white/10'
}

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-small gap-1.5',
  md: 'h-9 px-4 text-small gap-2',
  lg: 'h-11 px-5 text-body gap-2'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  href,
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}) {
  const cls = cx(
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm border font-medium',
    'transition-[background-color,border-color,transform] duration-150 ease-calm active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  )
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}

/* ----------------------------------------------------------- StatusBadge -- */
// The triage language. NEVER COLOUR ALONE: tone -> {colours, glyph, default
// label}. Callers may pass their own words but can never drop the glyph.
//   urgent   status-now    act today or it slips
//   warn     status-soon   coming up this week
//   done     status-clear  handled or on track
//   pending / info / empty  neutral: plain information, waiting, nothing yet

const TONES = {
  urgent: { cls: 'bg-status-now-soft text-status-now', icon: 'alert', label: 'Urgent' },
  warn: { cls: 'bg-status-soon-soft text-status-soon', icon: 'clock', label: 'Due soon' },
  pending: { cls: 'bg-surface-sunken text-ink-muted', icon: 'clock', label: 'Pending' },
  done: { cls: 'bg-status-clear-soft text-status-clear', icon: 'check', label: 'Confirmed' },
  info: { cls: 'bg-surface-sunken text-ink-muted', icon: 'info', label: 'Info' },
  declined: { cls: 'bg-status-now-soft text-status-now', icon: 'x', label: 'Declined' },
  empty: { cls: 'bg-surface-sunken text-ink-muted', icon: 'dash', label: 'Unassigned' }
}

export function StatusBadge({ tone = 'info', children, size = 'md', className = '' }) {
  const t = TONES[tone] || TONES.info
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full text-label font-medium',
        size === 'sm' ? 'h-5 px-2' : 'h-6 pl-2 pr-2.5',
        t.cls,
        className
      )}
    >
      <Icon name={t.icon} size={size === 'sm' ? 12 : 13} />
      {children || t.label}
    </span>
  )
}

/* ------------------------------------------------------------------ Card -- */
// COMMON REGION: one card = one subject inside a hairline boundary. The
// border never takes a status colour; urgency lives in the rows, not the frame.

export function Card({ title, subtitle, icon, action, children, className = '', bodyClassName = '' }) {
  return (
    <section className={cx('overflow-hidden rounded-md border border-line bg-surface shadow-raised', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-heading font-medium text-ink">
              {icon && <Icon name={icon} size={16} className="text-ink-muted" />}
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-small text-ink-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cx('px-4 py-4 sm:px-6', bodyClassName)}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------ PageHeader -- */
// The one display-size anchor of a screen. A light weight at size reads as
// expensive; the lead stays in muted body text.

export function PageHeader({ title, lead, actions, children }) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title font-light text-balance text-ink sm:text-display">{title}</h1>
          {lead && <p className="mt-3 max-w-prose text-heading text-ink-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

/* ----------------------------------------------------------- Breadcrumbs -- */

export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-small text-ink-muted">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <Icon name="chevronRight" size={12} />}
          {item.href ? (
            <Link href={item.href} className="rounded-sm px-1 py-0.5 transition-colors hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="px-1 py-0.5 text-ink">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ Tabs -- */
// Rendered as real links so every tab is its own URL — that is what makes the
// navigation non-linear and deep-linkable. The active tab is ink with a Laurel
// underline; a count announces what sits behind a tab without opening it.

export function Tabs({ tabs, active }) {
  return (
    <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <Link
            key={tab.id}
            href={tab.href}
            data-guide={tab.guide}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-small font-medium transition-colors duration-150',
              isActive ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {tab.label}
            {tab.count != null && <Count tone={tab.tone}>{tab.count}</Count>}
          </Link>
        )
      })}
    </div>
  )
}

/** A small number that announces hidden content. `urgent` when the number is the reason to look. */
export function Count({ tone, children }) {
  return (
    <span
      className={cx(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-label tabular-nums',
        tone === 'urgent' ? 'bg-status-now-soft text-status-now' : 'bg-surface-sunken text-ink-muted'
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------ EmptyState -- */

export function EmptyState({ title, body, action, icon = 'check' }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong px-4 py-12 text-center">
      <Icon name={icon} size={20} className="mx-auto mb-3 text-ink-muted" />
      <p className="text-heading font-medium text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-prose text-small text-ink-muted">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- Alert -- */
// An inline moment placed where the user is looking. Tones follow StatusBadge.

const ALERT_TONES = {
  urgent: ['bg-status-now-soft', 'text-status-now'],
  declined: ['bg-status-now-soft', 'text-status-now'],
  warn: ['bg-status-soon-soft', 'text-status-soon'],
  done: ['bg-status-clear-soft', 'text-status-clear'],
  pending: ['bg-surface-sunken', 'text-ink-muted'],
  info: ['bg-surface-sunken', 'text-ink-muted'],
  empty: ['bg-surface-sunken', 'text-ink-muted']
}

export function Alert({ tone = 'info', title, children, action }) {
  const t = TONES[tone] || TONES.info
  const [bg, fg] = ALERT_TONES[tone] || ALERT_TONES.info
  return (
    <div className={cx('flex flex-wrap items-start gap-3 rounded-md px-4 py-3', bg)} role={tone === 'urgent' ? 'alert' : 'status'}>
      <Icon name={t.icon} size={16} className={cx('mt-0.5', fg)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children && <div className={cx('text-small', title ? 'mt-0.5 text-ink-muted' : 'text-ink')}>{children}</div>}
      </div>
      {action}
    </div>
  )
}

/* --------------------------------------------------------------- ListRow -- */
// The generic row used by every list in the product. Rows are separated by
// hairlines rather than boxed one by one, so the exception stands out.

export function ListRow({ href, leading, title, sub, meta, trailing, onClick, className = '' }) {
  const inner = (
    <>
      {leading && <div className="shrink-0 text-ink-muted">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-ink">{title}</div>
        {sub && <div className="truncate text-small text-ink-muted">{sub}</div>}
        {meta && <div className="text-small text-ink-muted">{meta}</div>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2 text-small text-ink-muted">{trailing}</div>}
      {(href || onClick) && <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />}
    </>
  )

  const cls = cx(
    'flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 sm:px-6',
    (href || onClick) && 'transition-colors duration-150 hover:bg-surface-sunken/60',
    className
  )

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

/* ----------------------------------------------------------------- Field -- */
// A labelled value: label in muted small text, value in ink.

export function Field({ label, value, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children || value}</dd>
    </div>
  )
}

/* --------------------------------------------------------------- Avatar --- */
// Initials in a circle. No photos of people, no colour per person.

export function Avatar({ initials, size = 'md' }) {
  return (
    <span
      className={cx(
        'inline-grid shrink-0 place-items-center rounded-full bg-surface-sunken font-medium tracking-wide text-ink ring-1 ring-line ring-inset',
        size === 'sm' ? 'h-7 w-7 text-label' : 'h-9 w-9 text-label'
      )}
    >
      {initials}
    </span>
  )
}

/* ------------------------------------------------------------ Form bits --- */

const LABEL = 'mb-1.5 block text-small text-ink-muted'
const CONTROL =
  'block w-full rounded-sm border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-muted/70 transition-colors focus:border-accent focus-visible:outline-offset-0'
const HINT = 'mt-1.5 text-small text-ink-muted'

export function TextInput({ label, id, hint, className = '', ...rest }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input id={id} className={cx(CONTROL, 'h-9')} {...rest} />
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  )
}

export function Select({ label, id, options = [], hint, className = '', ...rest }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select id={id} className={cx(CONTROL, 'h-9')} {...rest}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  )
}

export function Textarea({ label, id, hint, className = '', ...rest }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <textarea id={id} className={cx(CONTROL, 'py-2 leading-6')} {...rest} />
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------ SectionNote -- */

export function SectionNote({ children }) {
  return <p className="mb-3 max-w-prose text-small text-ink-muted">{children}</p>
}

/* ----------------------------------------------------------- MetricTile --- */
// One number that matters, set large and light. The label carries the
// meaning; an urgent or done tone only tints the number.

export function MetricTile({ label, value, tone, sub, href }) {
  const body = (
    <>
      <div className="text-small text-ink-muted">{label}</div>
      <div
        className={cx(
          'mt-2 text-display font-light tabular-nums',
          tone === 'urgent' ? 'text-status-now' : tone === 'done' ? 'text-status-clear' : 'text-ink'
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-2 text-small text-ink-muted">{sub}</div>}
    </>
  )
  const cls = cx(
    'block rounded-md border border-line bg-surface px-6 py-4 shadow-raised',
    href && 'transition-colors duration-150 hover:border-line-strong'
  )
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
