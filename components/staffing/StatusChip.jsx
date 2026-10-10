'use client'

// Request status and the marks that can sit beside it, all on StatusBadge:
// the status itself (Not sent · Waiting · Confirmed · Can't make it, plus
// Removed and Backup), a warning about the person's day, and "You said it's fine".

import { Icon, StatusBadge } from '@/components/ui/primitives'
import { openSpots } from '@/components/ui/domain'
import { displayStatus } from '@/lib/staffing/derive'

export function RequestStatus({ request, st, size = 'sm', showNote = true }) {
  const s = displayStatus(request, st)
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={s.tone} size={size}>
        {s.label}
      </StatusBadge>
      {showNote && s.note && <span className="text-label text-ink-muted">{s.note}</span>}
    </span>
  )
}

/**
 * A warning about someone's day. "Heads up" for things worth a look (outside
 * their usual hours); "Conflict" for things that need a reason (away, double-
 * booked, no certificate). The first message is spelled out; hover lists all.
 */
export function CheckMark({ issues }) {
  const real = issues.filter((i) => i.severity === 'soft' || i.severity === 'hard')
  if (!real.length) return null
  const hard = real.find((i) => i.severity === 'hard')
  const first = hard || real[0]
  return (
    <span title={real.map((i) => i.message).join('\n')} className="inline-flex max-w-full flex-wrap items-center gap-1.5">
      <StatusBadge tone="warn" size="sm">
        {hard ? 'Conflict' : 'Heads up'}
      </StatusBadge>
      <span className="text-label text-ink">
        {first.message}
        {real.length > 1 && ` (+${real.length - 1} more)`}
      </span>
    </span>
  )
}

/** A warning the manager already said is fine. Hover shows the reason. */
export function OkdMark({ overrides }) {
  if (!overrides?.length) return null
  return (
    <span
      title={overrides.map((o) => `${o.message}${o.reason ? ` · Fine because: ${o.reason}` : ''}`).join('\n')}
      className="inline-flex items-center gap-1 text-label text-ink-muted"
    >
      <Icon name="check" size={12} />
      You said it&apos;s fine
    </span>
  )
}

/** Open spots: a derived gap, never a person. Neutral, never red. */
export function OpenSpotChip({ count = 1 }) {
  return (
    <StatusBadge tone="empty" size="sm">
      {openSpots(count)}
    </StatusBadge>
  )
}
