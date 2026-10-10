'use client'

// ---------------------------------------------------------------------------
// The run of show: one editable list per event.
//
// Every row is something that happens at a time. A row with "Needs staff"
// ticked is also a block in the Staffing Planner (it has a start and an end,
// and shows up in the chart); a row without it is just a line in the run of
// show. So there is one list to edit, and the planner's blocks follow it.
//
// The sample data lives in plain module objects, so an edit changes those
// objects in place (the main store's copy of each block, the Staffing
// Planner's copy, and the run of show shown on the event overview) and is
// saved in this browser so it survives a reload. A version number in context
// tells every screen that reads a store to draw again.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { events } from '@/lib/mock/events'
import { timelines } from '@/lib/mock/records'
import { WORLD } from '@/lib/staffing/adapter'

const RUN_KEY = 'vue-run-of-show-v2'

const Ctx = createContext({ version: 0, rowsFor: () => [], setRows: () => {}, resetEvent: () => {}, resetAll: () => {} })

function read(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null') || {}
  } catch {
    return {}
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* blocked storage: the edit still applies for this visit */
  }
}

// ---- "9:00 AM" <-> minutes <-> "09:00" (for the time field) ----

export function parseClock(text) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(text || '').trim())
  if (!m) return null
  const hour = Number(m[1])
  if (hour < 1 || hour > 12 || Number(m[2]) > 59) return null
  let h = hour % 12
  if (m[3].toUpperCase() === 'PM') h += 12
  return h * 60 + Number(m[2])
}

export function clockLabel(mins) {
  const total = ((Math.round(mins) % 1440) + 1440) % 1440
  const h24 = Math.floor(total / 60)
  const mm = String(total % 60).padStart(2, '0')
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${mm} ${suffix}`
}

export const toInputValue = (text) => {
  const m = parseClock(text)
  return m == null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export const fromInputValue = (value) => {
  const m = /^(\d{2}):(\d{2})$/.exec(value)
  return m ? clockLabel(Number(m[1]) * 60 + Number(m[2])) : null
}

const hoursToClock = (h) => clockLabel(h * 60)

// ---- the sample data, as it was before any edit ----

const originalLists = {}
const originalRuns = {}
const cache = {} // eventId -> rows
let remembered = false

const cloneBlock = (b) => ({ ...b, requirements: b.requirements.map((r) => ({ ...r })) })

function remember() {
  if (remembered) return
  remembered = true
  for (const ev of events) {
    const world = WORLD.eventMap[ev.id]
    originalLists[ev.id] = { main: ev.blocks.map(cloneBlock), planner: (world?.blocks || []).map(cloneBlock) }
    originalRuns[ev.id] = (timelines[ev.id] || []).map((e) => ({ ...e }))
  }
}

/** Blocks and run-of-show lines become one list, in time order. */
function initialRows(eventId) {
  const blocks = (originalLists[eventId]?.main || []).map((b) => ({
    id: b.id,
    time: hoursToClock(b.start),
    end: hoursToClock(b.end),
    title: b.name,
    note: b.note || '',
    needsStaff: true
  }))
  const lines = (originalRuns[eventId] || []).map((e) => ({
    id: e.id,
    time: e.time,
    end: null,
    title: e.title,
    note: e.note || '',
    needsStaff: false,
    ...(e.tone ? { tone: e.tone } : {})
  }))
  return [...blocks, ...lines]
    .map((row, i) => ({ row, i }))
    .sort((a, b) => (parseClock(a.row.time) ?? 0) - (parseClock(b.row.time) ?? 0) || a.i - b.i)
    .map((x) => x.row)
}

// ---- keeping the planner's blocks in step with the rows ----

function blockTimes(row) {
  const startMin = parseClock(row.time) ?? 0
  const endMin = parseClock(row.end) ?? startMin + 60
  const start = startMin / 60
  let end = endMin / 60
  if (end === start) end = start + 1 // no end set: default to an hour
  else if (end < start) end += 24
  return { start, end }
}

function syncBlocks(eventId, rows) {
  const ev = events.find((e) => e.id === eventId)
  const world = WORLD.eventMap[eventId]
  if (!ev || !world) return
  const wanted = rows.filter((r) => r.needsStaff)
  const wantedIds = new Set(wanted.map((r) => r.id))

  // Blocks whose row no longer needs staff (or is gone).
  for (const list of [ev.blocks, world.blocks]) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (!wantedIds.has(list[i].id)) {
        delete WORLD.blockMap[list[i].id]
        list.splice(i, 1)
      }
    }
  }

  for (const row of wanted) {
    const { start, end } = blockTimes(row)
    const patch = { name: row.title || 'Untitled', start, end }
    // A block that comes back (undo, or ticking "Needs staff" again) gets its
    // sample details back; a brand-new row starts from the defaults.
    const fresh = (copy) =>
      copy
        ? cloneBlock(copy)
        : { id: row.id, kind: 'guest-facing', requirements: [{ role: 'Event Staff', count: 1 }], note: row.note || '' }
    const main = ev.blocks.find((b) => b.id === row.id)
    if (main) {
      Object.assign(main, patch, { note: row.note || main.note || '' })
    } else {
      ev.blocks.push({ ...fresh(originalLists[eventId]?.main.find((b) => b.id === row.id)), ...patch, note: row.note || '' })
    }
    let planner = world.blocks.find((b) => b.id === row.id)
    if (planner) {
      Object.assign(planner, patch)
    } else {
      planner = { ...fresh(originalLists[eventId]?.planner.find((b) => b.id === row.id)), ...patch, note: row.note || '' }
      world.blocks.push(planner)
    }
    WORLD.blockMap[row.id] = { block: planner, event: world }
  }

  // Both copies in time order, like the sample data.
  for (const list of [ev.blocks, world.blocks]) list.sort((a, b) => a.start - b.start)
}

function putRows(eventId, rows) {
  cache[eventId] = rows
  // The event overview reads plain run-of-show lines from here; staffing blocks live in the planner.
  timelines[eventId] = rows.filter((r) => !r.needsStaff).map(({ id, time, title, note, tone }) => ({ id, time, title, note, ...(tone ? { tone } : {}) }))
  syncBlocks(eventId, rows)
}

export function TimelineEditsProvider({ children }) {
  const [version, setVersion] = useState(0)

  // After first paint, apply what this browser saved, then draw again.
  useEffect(() => {
    remember()
    const saved = read(RUN_KEY)
    let any = false
    for (const [eventId, rows] of Object.entries(saved)) {
      if (Array.isArray(rows) && events.some((e) => e.id === eventId)) {
        putRows(eventId, rows)
        any = true
      }
    }
    if (any) setVersion((v) => v + 1)
  }, [])

  const rowsFor = useCallback((eventId) => {
    remember()
    if (!cache[eventId]) cache[eventId] = initialRows(eventId)
    return cache[eventId]
  }, [])

  const setRows = useCallback((eventId, rows) => {
    remember()
    putRows(eventId, rows)
    const all = read(RUN_KEY)
    all[eventId] = rows
    write(RUN_KEY, all)
    setVersion((v) => v + 1)
  }, [])

  /** Put one event's run of show and blocks back to the sample data. */
  const resetEvent = useCallback((eventId) => {
    remember()
    const ev = events.find((e) => e.id === eventId)
    const world = WORLD.eventMap[eventId]
    const original = originalLists[eventId]
    if (ev && world && original) {
      for (const old of world.blocks) delete WORLD.blockMap[old.id]
      ev.blocks.splice(0, ev.blocks.length, ...original.main.map(cloneBlock))
      world.blocks.splice(0, world.blocks.length, ...original.planner.map(cloneBlock))
      for (const copy of world.blocks) WORLD.blockMap[copy.id] = { block: copy, event: world }
    }
    delete cache[eventId]
    timelines[eventId] = (originalRuns[eventId] || []).map((e) => ({ ...e }))
    const all = read(RUN_KEY)
    delete all[eventId]
    write(RUN_KEY, all)
    setVersion((v) => v + 1)
  }, [])

  const resetAll = useCallback(() => {
    for (const event of events) resetEvent(event.id)
    try {
      window.localStorage.removeItem('vue-run-view-v1')
    } catch {
      /* blocked storage: timeline data is still restored in memory */
    }
  }, [resetEvent])

  const value = useMemo(() => ({ version, rowsFor, setRows, resetEvent, resetAll }), [version, rowsFor, setRows, resetEvent, resetAll])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useTimelineEdits = () => useContext(Ctx)

/** Reading this makes a screen draw again after a timeline edit. */
export const useTimelineVersion = () => useContext(Ctx).version
