'use client'

// ---------------------------------------------------------------------------
// The event as a picture: time runs down the page, one column per role. Each
// bar is a timeline block that needs that role, placed by its start and end.
// Solid = fully staffed, dashed = open spots. Overlapping blocks for one role (say
// dinner service inside the reception) sit side by side in that role's column.
// Tapping a bar jumps to that block's section below.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { cx } from '@/lib/cx'
import { Icon } from '@/components/ui/primitives'
import { coverage, firstName, fmtH, openSpotsText, rangeLabel, rolesOf } from '@/lib/staffing/derive'

const PX_PER_HOUR = 32

/** What a bar says: the state first, the count under it. */
function headline(c) {
  if (c.confirmed >= c.need) return c.extra > 0 ? `Fully staffed +${c.extra}` : 'Fully staffed'
  if (c.toFind > 0) return openSpotsText(c.toFind)
  if (c.waiting > 0) return `${c.waiting} waiting`
  return `${c.notSent} not sent`
}

function lanesFor(items) {
  const ends = []
  return items
    .slice()
    .sort((a, b) => a.block.start - b.block.start)
    .map((it) => {
      let lane = ends.findIndex((e) => e <= it.block.start)
      if (lane === -1) lane = ends.length
      ends[lane] = it.block.end
      return { ...it, lane }
    })
}

export function TimeChart({ eventId, blocks, roles, st }) {
  if (!blocks.length || !roles.length) return null
  const first = Math.floor(Math.min(...blocks.map((b) => b.start)))
  const last = Math.ceil(Math.max(...blocks.map((b) => b.end)))
  const height = (last - first) * PX_PER_HOUR
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i)

  const columns = roles.map((role) => {
    const items = blocks
      .filter((b) => rolesOf(b, st).includes(role))
      .map((block) => ({ block, c: coverage(eventId, block, role, st) }))
    const laid = lanesFor(items)
    return { role, laid, lanes: Math.max(1, ...laid.map((x) => x.lane + 1)) }
  })

  const segments = lanesFor(blocks.map((block) => ({ block })))
  const segLanes = Math.max(1, ...segments.map((x) => x.lane + 1))

  const jump = (id) => {
    document.getElementById(`block-${id}`)?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="overflow-x-auto" role="group" aria-label="Staffing by time and role">
      <div className="grid min-w-[620px]" style={{ gridTemplateColumns: `60px 118px repeat(${columns.length}, minmax(110px, 1fr))` }}>
        <div />
        <Link
          href={`/events/${eventId}/timeline`}
          title="Edit this timeline"
          className="px-1 pb-2 text-center text-label font-medium text-accent underline-offset-2 hover:underline"
        >
          Run of show
        </Link>
        {columns.map(({ role }) => (
          <div key={role} className="px-1 pb-2 text-center text-label font-medium text-ink">
            {role}
          </div>
        ))}

        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-label text-ink-muted" style={{ top: (h - first) * PX_PER_HOUR }}>
              {fmtH(h)}
            </span>
          ))}
        </div>

        <div className="relative border-l border-line" style={{ height }}>
          {hours.map((h) => (
            <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: (h - first) * PX_PER_HOUR }} />
          ))}
          {segments.map(({ block, lane }) => (
            <button
              key={block.id}
              type="button"
              onClick={() => jump(block.id)}
              title={`${block.name} ${rangeLabel(block.start, block.end)}`}
              className="absolute flex flex-col overflow-hidden rounded-md border border-line bg-surface-sunken px-2 py-1 text-left text-label leading-tight text-ink transition-colors hover:border-line-strong"
              style={{
                top: (block.start - first) * PX_PER_HOUR + 2,
                height: (block.end - block.start) * PX_PER_HOUR - 4,
                left: `calc(${(lane / segLanes) * 100}% + 4px)`,
                width: `calc(${100 / segLanes}% - 8px)`
              }}
            >
              <span className="truncate font-medium text-ink">{block.name}</span>
              <span className="truncate text-ink-muted">{rangeLabel(block.start, block.end)}</span>
            </button>
          ))}
        </div>

        {columns.map(({ role, laid, lanes }) => (
          <div key={role} className="relative border-l border-line" style={{ height }}>
            {hours.map((h) => (
              <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: (h - first) * PX_PER_HOUR }} />
            ))}
            {laid.map(({ block, c, lane }) => {
              const done = c.confirmed >= c.need
              const open = c.toFind > 0
              const tall = (block.end - block.start) * PX_PER_HOUR >= 70
              const names = Object.values(st.requests)
                .filter((r) => r.eventId === eventId && r.role === role && (r.status === 'accepted' || r.status === 'pending') && r.confirmedBlockIds.includes(block.id))
                .map((r) => firstName(r.staffId))
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => jump(block.id)}
                  title={`${block.name} ${rangeLabel(block.start, block.end)}: ${c.filled} of ${c.need} ${role}`}
                  className={cx(
                    'absolute flex flex-col overflow-hidden rounded-md border px-2 py-1 text-left text-label leading-tight transition-colors hover:brightness-95',
                    done && 'border-status-clear-soft bg-status-clear-soft text-status-clear',
                    !done && open && 'border-dashed border-accent bg-surface-sunken/50 text-accent',
                    !done && !open && 'border-line bg-surface-sunken text-ink-muted'
                  )}
                  style={{
                    top: (block.start - first) * PX_PER_HOUR + 2,
                    height: (block.end - block.start) * PX_PER_HOUR - 4,
                    left: `calc(${(lane / lanes) * 100}% + 4px)`,
                    width: `calc(${100 / lanes}% - 8px)`
                  }}
                >
                  <span className="flex items-center gap-1 font-medium">
                    <Icon name={done ? 'check' : open ? 'plus' : 'clock'} size={10} />
                    <span className="truncate">{headline(c)}</span>
                  </span>
                  <span className="truncate">
                    {c.filled} of {c.need}
                  </span>
                  {tall && names.length > 0 && <span className="mt-0.5 truncate text-label opacity-80">{names.join(', ')}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
