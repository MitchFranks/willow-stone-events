'use client'

// SCREEN 6 — Run of show, as a day calendar.
//
// Modelled on the things people do all day in Google Calendar:
//   • click an empty slot to start a new block, or drag across the grid to
//     make one of exactly the length you want
//   • click a block to open its editor (title, start, end, note, Needs staff)
//   • drag a block to move it; drag its top or bottom edge to resize it
//   • delete from the editor, or focus a block and press Delete; every change
//     drops a toast with an Undo
//   • overlapping blocks sit side by side
// KEYBOARD: "Add block" opens the editor, and every block is focusable: Enter
// edits it, Delete removes it (with Undo).
// A block with Needs staff ticked is also a block in the Staffing Planner.
// Everything snaps to 15 minutes and saves as you go.

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { events } from '@/lib/mock/events'
import { useStore } from '@/lib/store'
import { clockLabel, fromInputValue, parseClock, toInputValue, useTimelineEdits } from '@/lib/timelineEdits'
import { Button, Card, EmptyState, Icon, TextInput, Textarea } from '@/components/ui/primitives'
import { Modal, useConfirm } from '@/components/ui/domain'

const PX = 56 // pixels per hour
const SNAP = 15 // minutes
const DEFAULT_LEN = 60
const MIN_LEN = 15

// The visible window is the same on every run of show, and is remembered.
const VIEW_KEY = 'vue-run-view-v1'
const DEFAULT_VIEW = { start: 360, end: 1380 } // 6:00 AM to 11:00 PM

function readView() {
  try {
    const v = JSON.parse(window.localStorage.getItem(VIEW_KEY) || 'null')
    if (v && Number.isFinite(v.start) && Number.isFinite(v.end) && v.start >= 0 && v.end <= 1440 && v.end - v.start >= 120) return v
  } catch {
    /* fall through to the default */
  }
  return DEFAULT_VIEW
}

const INPUT =
  'w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent'

const snap = (m) => Math.round(m / SNAP) * SNAP
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

/** Start and end in minutes for display. A row with no end shows as 30 minutes. */
function span(row) {
  const s = parseClock(row.time) ?? 0
  let e = parseClock(row.end)
  if (e == null) e = s + 30
  if (e <= s) e += 1440
  return { s, e }
}

/** Side-by-side columns for blocks that overlap, like a calendar day view. */
function layout(items) {
  const sorted = [...items].sort((a, b) => a.s - b.s || b.e - a.e)
  const out = {}
  let cluster = []
  let clusterEnd = -1
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1))
    for (const c of cluster) out[c.id] = { lane: c.lane, lanes }
    cluster = []
  }
  for (const item of sorted) {
    if (cluster.length && item.s >= clusterEnd) {
      flush()
      clusterEnd = -1
    }
    const used = cluster.filter((c) => c.e > item.s).map((c) => c.lane)
    let lane = 0
    while (used.includes(lane)) lane += 1
    cluster.push({ ...item, lane })
    clusterEnd = Math.max(clusterEnd, item.e)
  }
  flush()
  return out
}

const sortRows = (rows) =>
  rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => (parseClock(a.row.time) ?? 0) - (parseClock(b.row.time) ?? 0) || a.i - b.i)
    .map((x) => x.row)

const range = (s, e) => `${clockLabel(s)} – ${clockLabel(e)}`

/* ------------------------------------------------------- display range -- */

/** "Display earlier" / "Display later": asks which time to show from, or until. */
function RangeButton({ label, icon, options, initial, onApply, onReset, up, disabled, disabledNote }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initial)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledNote : label}
        onClick={() => {
          setValue(initial)
          setOpen((v) => !v)
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-semibold text-ink-2 transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-ink-2"
      >
        <Icon name="chevronDown" size={12} className={icon === 'up' ? 'rotate-180' : undefined} />
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          className={`absolute left-0 z-30 w-60 rounded-2xl border border-line bg-surface p-3 shadow-pop ${up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          <label htmlFor={`range-${label}`} className="text-[13px] font-semibold text-ink">
            {label === 'Display earlier' ? 'Show the day from' : 'Show the day until'}
          </label>
          <select id={`range-${label}`} value={value} onChange={(e) => setValue(Number(e.target.value))} className={INPUT + ' mt-2'}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted">Applies to every run of show.</p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button type="button" onClick={() => { onReset(); setOpen(false) }} className="text-[12px] font-semibold text-muted hover:text-accent">
              Back to 6 AM – 11 PM
            </button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onApply(value)
                setOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- editor -- */
// The library Modal, so it behaves like every other dialog: focus moves in,
// Escape closes, focus returns to the block. Nothing is fixed silently: a
// blank title or an end before the start is shown as an error on the field.

/** "12:00 AM" as an end time means midnight, the end of the day. */
const endMinutes = (text) => {
  const e = parseClock(text)
  return e === 0 ? 1440 : e
}

function Editor({ value, isNew, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(value)
  const [errors, setErrors] = useState({})
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = () => {
    const s = parseClock(form.time)
    const e = endMinutes(form.end)
    const next = {}
    if (!form.title.trim()) next.title = 'Give the block a title.'
    if (s == null) next.time = 'Enter a start time.'
    if (e == null) next.end = 'Enter an end time.'
    else if (s != null && e <= s) next.end = `Ends before it starts. Pick a time after ${clockLabel(s)}.`
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({ ...form, time: clockLabel(s), end: clockLabel(e), title: form.title.trim() })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'New block' : 'Edit block'}
      labelledBy="block-editor-title"
      footer={
        <>
          {!isNew && (
            <Button variant="danger" onClick={onDelete} className="mr-auto">
              <Icon name="trash" size={15} />
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="space-y-3"
      >
        <TextInput
          label="Title"
          id="blk-title"
          data-autofocus
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. First dance"
          error={errors.title}
        />

        <div className="grid grid-cols-2 gap-2">
          <TextInput
            label="Starts"
            id="blk-start"
            type="time"
            value={toInputValue(form.time)}
            onChange={(e) => set({ time: fromInputValue(e.target.value) || '' })}
            error={errors.time}
          />
          <TextInput
            label="Ends"
            id="blk-end"
            type="time"
            value={toInputValue(form.end)}
            onChange={(e) => set({ end: fromInputValue(e.target.value) || '' })}
            error={errors.end}
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-sm border border-line px-3 py-2.5">
          <input
            type="checkbox"
            checked={form.needsStaff}
            onChange={(e) => set({ needsStaff: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
          />
          <span>
            <span className="block text-small font-medium text-ink">Needs staff</span>
            <span className="block text-small text-ink-muted">Shows up in the Staffing Planner so you can fill it.</span>
          </span>
        </label>

        <Textarea
          label="Note"
          id="blk-note"
          rows={2}
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder="Optional"
        />

        {/* Enter in a field saves, like the Save button. */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Save
        </button>
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ page -- */

export default function RunOfShowPage({ params }) {
  const { id } = use(params)
  const { version, rowsFor, setRows, resetEvent } = useTimelineEdits()
  const event = events.find((e) => e.id === id)
  const rows = rowsFor(id)

  // The visible day: 6 AM to 11 PM unless the user asked for more. A block
  // outside the window is never hidden, so the window grows to hold it.
  const [view, setViewState] = useState(DEFAULT_VIEW)
  useEffect(() => setViewState(readView()), [])
  const setView = (next) => {
    setViewState(next)
    try {
      window.localStorage.setItem(VIEW_KEY, JSON.stringify(next))
    } catch {
      /* blocked storage: the choice still applies for this visit */
    }
  }
  const spans = rows.map(span)
  const lo = Math.min(view.start, ...spans.map((x) => Math.floor(x.s / 60) * 60))
  const hi = Math.min(1440, Math.max(view.end, ...spans.map((x) => Math.ceil(Math.min(x.e, 1440) / 60) * 60)))
  const height = ((hi - lo) / 60) * PX
  const hours = Array.from({ length: (hi - lo) / 60 + 1 }, (_, i) => lo / 60 + i)

  const { toast } = useStore()
  const { confirm, dialog } = useConfirm()
  const gridRef = useRef(null)
  const dragRef = useRef(null)
  const [preview, setPreview] = useState(null) // { id|'draft', s, e } while dragging
  const [editor, setEditor] = useState(null) // { id|null, values }
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  /** Save the rows; with a message, say so in a toast that can undo it. */
  const commit = useCallback(
    (next, message) => {
      const before = rowsRef.current
      setRows(id, sortRows(next))
      if (message) toast(message, 'done', { actions: [{ label: 'Undo', onClick: () => setRows(id, before) }] })
    },
    [id, setRows, toast]
  )

  const minuteAt = (clientY) => {
    const box = gridRef.current.getBoundingClientRect()
    return lo + ((clientY - box.top) / PX) * 60
  }

  const openNew = (s, e) => {
    setEditor({ id: null, values: { id: `${id}-r-${Date.now().toString(36)}`, time: clockLabel(s), end: clockLabel(e), title: '', note: '', needsStaff: false } })
  }

  const openEdit = (r) => setEditor({ id: r.id, values: { ...r, end: r.end || clockLabel(span(r).e), note: r.note || '' } })

  /** Keyboard and button route to a new block: the first free hour after the last one. */
  const addBlock = () => {
    const last = rows.reduce((m, r) => Math.max(m, span(r).e), lo + 8 * 60)
    const s = clamp(Math.ceil(last / 30) * 30, lo, hi - DEFAULT_LEN)
    setPreview({ id: 'draft', s, e: s + DEFAULT_LEN })
    openNew(s, s + DEFAULT_LEN)
  }

  const saveEditor = (values) => {
    const exists = rows.some((r) => r.id === values.id)
    commit(
      exists ? rows.map((r) => (r.id === values.id ? { ...r, ...values } : r)) : [...rows, values],
      exists ? `Saved “${values.title}”.` : `Added “${values.title}” at ${values.time}.`
    )
    setEditor(null)
    setPreview(null)
  }

  const deleteRow = (rowId) => {
    const row = rows.find((r) => r.id === rowId)
    commit(
      rows.filter((r) => r.id !== rowId),
      `Deleted “${row?.title || 'block'}”.`
    )
    setEditor(null)
  }

  const askReset = () =>
    confirm({
      title: 'Reset the run of show?',
      body: 'Every change to this event’s run of show goes back to the sample data, including blocks you added or deleted. This can’t be undone.',
      confirmLabel: 'Reset to sample',
      danger: true,
      onConfirm: () => {
        resetEvent(id)
        toast('The run of show is back to the sample data.')
      }
    })

  // ---- pointer: create, move, resize ----
  const onPointerDown = (e) => {
    if (e.button !== 0) return
    const rowId = e.target.closest('[data-row]')?.getAttribute('data-row')
    const edge = e.target.closest('[data-edge]')?.getAttribute('data-edge') || null
    const row = rowId && rowId !== 'draft' ? rows.find((r) => r.id === rowId) : null
    const startY = e.clientY
    const m0 = minuteAt(startY)

    if (row) {
      const { s, e: end } = span(row)
      dragRef.current = { kind: edge ? `resize-${edge}` : 'move', id: row.id, startY, m0, s0: s, e0: end, moved: false }
    } else {
      const anchor = clamp(Math.floor(m0 / SNAP) * SNAP, lo, hi - MIN_LEN)
      dragRef.current = { kind: 'create', startY, anchor, moved: false }
    }
    setEditor(null)
    setPreview(null)
    e.preventDefault()

    // Where the dragged block would land for a given pointer position.
    const landing = (d, m) => {
      if (d.kind === 'move') {
        const dur = d.e0 - d.s0
        const s = clamp(snap(d.s0 + (m - d.m0)), lo, hi - dur)
        return { s, e: s + dur }
      }
      if (d.kind === 'resize-bottom') return { s: d.s0, e: clamp(snap(m), d.s0 + MIN_LEN, hi) }
      if (d.kind === 'resize-top') return { s: clamp(snap(m), lo, d.e0 - MIN_LEN), e: d.e0 }
      const cur = clamp(snap(m), lo, hi)
      return { s: Math.min(d.anchor, cur), e: Math.min(Math.max(d.anchor + MIN_LEN, cur), hi) }
    }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d) return
      if (Math.abs(ev.clientY - d.startY) > 4) d.moved = true
      if (!d.moved) return
      const { s, e: end } = landing(d, minuteAt(ev.clientY))
      setPreview({ id: d.kind === 'create' ? 'draft' : d.id, s, e: end })
    }

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const d = dragRef.current
      dragRef.current = null
      if (!d) return

      if (!d.moved) {
        // A plain click.
        if (d.kind === 'create') {
          const s = clamp(Math.floor(d.anchor / 30) * 30, lo, hi - DEFAULT_LEN)
          setPreview({ id: 'draft', s, e: s + DEFAULT_LEN })
          openNew(s, s + DEFAULT_LEN)
        } else {
          const r = rowsRef.current.find((x) => x.id === d.id)
          if (r) openEdit(r)
        }
        return
      }

      const { s, e: end } = landing(d, minuteAt(ev.clientY))
      if (d.kind === 'create') {
        setPreview({ id: 'draft', s, e: end })
        openNew(s, end)
      } else {
        setPreview(null)
        commit(
          rowsRef.current.map((r) => (r.id === d.id ? { ...r, time: clockLabel(s), end: clockLabel(end) } : r)),
          d.kind === 'move' ? 'Block moved.' : 'Block resized.'
        )
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const closeEditor = useCallback(() => {
    setEditor(null)
    setPreview((p) => (p && p.id === 'draft' ? null : p))
  }, [])

  if (!event) return <EmptyState title="No such event" />

  const shown = rows.map((r) => {
    const base = span(r)
    const p = preview && preview.id === r.id ? preview : null
    return { row: r, s: p ? p.s : base.s, e: p ? p.e : base.e }
  })
  const draft = preview && preview.id === 'draft' ? preview : null
  const positions = layout(shown.map((x) => ({ id: x.row.id, s: x.s, e: x.e })))
  const staffed = rows.filter((r) => r.needsStaff).length

  const renderBlock = ({ row, s, e }) => {
    const pos = positions[row.id] || { lane: 0, lanes: 1 }
    const top = ((s - lo) / 60) * PX
    const h = Math.max(((e - s) / 60) * PX, 20)
    const tone = row.tone === 'urgent' ? 'urgent' : row.needsStaff ? 'staff' : 'plain'
    const active = editor?.id === row.id || preview?.id === row.id
    return (
      <div
        key={row.id}
        data-row={row.id}
        role="button"
        tabIndex={0}
        aria-label={`${row.title || '(No title)'}, ${range(s, e)}${row.needsStaff ? ', needs staff' : ''}. Enter to edit, Delete to remove.`}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault()
            openEdit(row)
          } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
            ev.preventDefault()
            deleteRow(row.id)
          }
        }}
        title={`${row.title || '(No title)'}, ${range(s, e)}`}
        className={[
          'absolute cursor-grab select-none overflow-hidden rounded-md border px-2 py-1 text-left text-label leading-tight transition-shadow active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
          tone === 'urgent' ? 'border-status-now-soft bg-status-now-soft text-status-now' : '',
          tone === 'staff' ? 'border-accent bg-surface text-accent' : '',
          tone === 'plain' ? 'border-line bg-surface-sunken text-ink' : '',
          active ? 'z-20 ring-2 ring-accent' : 'z-10 hover:shadow-raised'
        ].join(' ')}
        style={{
          top: top + 1,
          height: h - 2,
          left: `calc(${(pos.lane / pos.lanes) * 100}% + 2px)`,
          width: `calc(${100 / pos.lanes}% - 5px)`
        }}
      >
        <span data-edge="top" className="absolute inset-x-0 top-0 h-2 cursor-ns-resize" />
        <span className="block truncate font-medium">{row.title || '(No title)'}</span>
        {h >= 38 && <span className="block truncate opacity-85">{range(s, e)}</span>}
        {h >= 56 && row.needsStaff && (
          <span className="mt-0.5 flex items-center gap-1 text-label font-medium opacity-90">
            <Icon name="users" size={11} /> Needs staff
          </span>
        )}
        {h >= 74 && row.note && <span className="mt-0.5 block truncate text-label opacity-80">{row.note}</span>}
        <span data-edge="bottom" className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" />
      </div>
    )
  }

  return (
    <div className="space-y-3" data-version={version}>
      <Card
        title="Run of show"
        icon="clock"
        subtitle={
          <>
            {rows.length} blocks · {staffed} need staff and appear in the{' '}
            <Link href={`/staffing/${id}`} className="text-ink underline underline-offset-4 hover:text-accent">
              Staffing Planner
            </Link>
            . Click or drag on the grid to add a block; drag a block to move it.
          </>
        }
        action={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={askReset}>
              Reset to sample
            </Button>
            <Button size="sm" variant="primary" data-guide="run-create" onClick={addBlock}>
              <Icon name="plus" size={13} />
              Add block
            </Button>
          </div>
        }
        bodyClassName="px-0 py-0"
      >
        <div className="px-3 pt-3 sm:px-4">
          <div className="ml-14 pl-3">
            <RangeButton
              label="Display earlier"
              icon="up"
              initial={Math.max(0, lo - 120)}
              options={Array.from({ length: lo / 60 }, (_, i) => ({ value: i * 60, label: clockLabel(i * 60) }))}
              onApply={(start) => setView({ ...view, start })}
              onReset={() => setView(DEFAULT_VIEW)}
              disabled={lo <= 0}
              disabledNote="Already showing from midnight"
            />
          </div>
        </div>
        <div className="flex px-3 py-2 sm:px-4">
          <div className="relative w-14 shrink-0" style={{ height }} aria-hidden="true">
            {hours.map((h, i) =>
              i === hours.length - 1 ? null : (
                <span key={h} className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-label text-ink-muted" style={{ top: ((h * 60 - lo) / 60) * PX }}>
                  {clockLabel(h * 60)}
                </span>
              )
            )}
          </div>

          <div
            ref={gridRef}
            onPointerDown={onPointerDown}
            className="relative flex-1 cursor-cell touch-none border-l border-line"
            style={{ height }}
            role="group"
            aria-label="Run of show day view. Click or drag on empty space to add a block."
          >
            {hours.map((h) => (
              <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line" style={{ top: ((h * 60 - lo) / 60) * PX }} />
            ))}
            {hours.slice(0, -1).map((h) => (
              <div key={`half-${h}`} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/60" style={{ top: ((h * 60 + 30 - lo) / 60) * PX }} />
            ))}

            {shown.map(renderBlock)}

            {draft && (
              <div
                data-row="draft"
                className="pointer-events-none absolute inset-x-1 z-20 overflow-hidden rounded-sm border-2 border-dashed border-accent bg-surface-sunken px-2 py-1 text-label font-medium text-accent"
                style={{ top: ((draft.s - lo) / 60) * PX + 1, height: Math.max(((draft.e - draft.s) / 60) * PX, 20) - 2 }}
              >
                {(editor?.values.title || '(No title)') + ' · ' + range(draft.s, draft.e)}
              </div>
            )}
          </div>
        </div>
        <div className="px-3 pb-3 sm:px-4">
          <div className="ml-14 pl-3">
            <RangeButton
              label="Display later"
              icon="down"
              up
              initial={Math.min(1440, hi + 120)}
              options={Array.from({ length: (1440 - hi) / 60 }, (_, i) => ({ value: hi + (i + 1) * 60, label: hi + (i + 1) * 60 === 1440 ? '12:00 AM (midnight)' : clockLabel(hi + (i + 1) * 60) }))}
              onApply={(end) => setView({ ...view, end })}
              onReset={() => setView(DEFAULT_VIEW)}
              disabled={hi >= 1440}
              disabledNote="Already showing until midnight"
            />
          </div>
        </div>
      </Card>

      {editor && (
        <Editor
          key={editor.values.id}
          value={editor.values}
          isNew={!editor.id}
          onSave={saveEditor}
          onDelete={() => deleteRow(editor.id)}
          onClose={closeEditor}
        />
      )}

      {dialog}
    </div>
  )
}
