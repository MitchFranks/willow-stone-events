// ---------------------------------------------------------------------------
// Events, their timeline blocks, and the seed assignments.
//
// An event is split into timeline BLOCKS (setup / ceremony / reception / teardown).
// Each block states its staffing requirement (how many of each role). Assignments are held
// separately in the store so they can change at runtime (accept / decline /
// reassign) — coverage is always computed by comparing the block's
// requirement against the assignments that are currently ACCEPTED.
// ---------------------------------------------------------------------------

// Booking lifecycle for an event. Names vary by venue; these are the common ones.
export const BOOKING_STATUSES = ['Inquiry', 'Tentative hold', 'Booked', 'Completed']

import { KEEP, keep } from './scope.js'

// What a timeline block is for. Setup and teardown are internal operations
// phases (load-in / strike); everything else is a guest-facing moment.
export const BLOCK_KINDS = ['setup', 'guest-facing', 'teardown']

// The prototype's frozen "today". Matches venue.today below.
export const TODAY_KEY = '2026-09-17'

export function daysOut(event) {
  const ms = new Date(`${event.dateKey}T00:00:00Z`) - new Date(`${TODAY_KEY}T00:00:00Z`)
  return Math.round(ms / 86400000)
}

export function daysOutLabel(event) {
  const n = daysOut(event)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n < 0) return `${-n} days ago`
  return `${n} days out`
}

export const EVENT_TYPES = [
  'Wedding',
  'Rehearsal Dinner',
  'Engagement Party',
  'Bridal Shower',
  'Birthday',
  'Corporate Event',
  'Anniversary',
  'Graduation',
  'Other'
]

export const venue = {
  name: 'Willow Stone',
  manager: 'Dana Whitcomb',
  managerRole: 'Venue Manager',
  managerInitials: 'DW',
  managerPhone: '(612) 555-0100',
  today: 'Thursday, September 17, 2026',
  todayShort: 'Thu, Sep 17'
}

const allEvents = [
  {
    id: 'evt-1001',
    dateKey: '2026-09-19',
    name: 'Johnson Wedding',
    type: 'Wedding',
    couple: 'Emily & Marcus Johnson',
    coupleId: 'cpl-2001',
    date: 'Saturday, September 19, 2026',
    dateShort: 'Sat, Sep 19',
    day: 'Sat',
    guests: 150,
    spaces: 'Garden Terrace · Stone Hall',
    status: '2 days out',
    headline: '4:00 PM ceremony',
    primary: true,
    blocks: [
      {
        id: 'evt-1001-setup',
        name: 'Setup',
        kind: 'setup',
        start: 9,
        end: 15,
        requirements: [{ role: 'Grounds', count: 2 }],
        note: 'Chairs, tables, floral staging on the Garden Terrace.'
      },
      {
        id: 'evt-1001-ceremony',
        name: 'Ceremony',
        kind: 'guest-facing',
        start: 15,
        end: 17,
        requirements: [
          { role: 'Venue Manager', count: 1 },
          { role: 'Event Staff', count: 2 }
        ],
        note: 'Guest arrival 3:30 PM, ceremony begins 4:00 PM.'
      },
      {
        id: 'evt-1001-reception',
        name: 'Reception',
        kind: 'guest-facing',
        start: 17,
        end: 21,
        requirements: [
          { role: 'Event Captain', count: 1 },
          { role: 'Event Staff', count: 2 },
          { role: 'Bartender', count: 1 },
          { role: 'Server', count: 1 }
        ],
        note: 'Stone Hall. Dinner service at 6:00 PM, two bar stations.'
      },
      {
        id: 'evt-1001-cleanup',
        name: 'Teardown',
        kind: 'teardown',
        start: 21,
        end: 23,
        requirements: [{ role: 'Grounds', count: 2 }, { role: 'Event Staff', count: 1 }],
        note: 'Breakdown and venue close by 11:00 PM.'
      }
    ]
  },
  {
    id: 'evt-1003',
    dateKey: '2026-09-19',
    name: 'Taylor Engagement Party',
    type: 'Engagement Party',
    couple: 'Rhonda Taylor & Sam Brooks',
    coupleId: 'cpl-2003',
    date: 'Saturday, September 19, 2026',
    dateShort: 'Sat, Sep 19',
    day: 'Sat',
    guests: 45,
    spaces: 'Courtyard',
    status: '2 days out',
    headline: '6:00 PM — engagement party',
    blocks: [
      {
        id: 'evt-1003-setup',
        name: 'Setup',
        kind: 'setup',
        start: 15,
        end: 17.5,
        requirements: [{ role: 'Grounds', count: 1 }],
        note: 'Courtyard string lights and long table.'
      },
      {
        id: 'evt-1003-reception',
        name: 'Reception',
        kind: 'guest-facing',
        start: 17.5,
        end: 22,
        requirements: [
          { role: 'Event Staff', count: 1 },
          { role: 'Bartender', count: 1 }
        ],
        note: 'Buffet plus open bar.'
      }
    ]
  },
  {
    id: 'evt-1002',
    dateKey: '2026-09-24',
    name: 'Shah–Patel Rehearsal Dinner',
    type: 'Rehearsal Dinner',
    couple: 'Priya Shah & Dev Patel',
    coupleId: 'cpl-2002',
    date: 'Thursday, September 24, 2026',
    dateShort: 'Thu, Sep 24',
    day: 'Thu',
    guests: 60,
    spaces: 'Stone Hall',
    status: '7 days out',
    headline: '6:30 PM rehearsal dinner',
    blocks: [
      {
        id: 'evt-1002-setup',
        name: 'Setup',
        kind: 'setup',
        start: 13,
        end: 17,
        requirements: [{ role: 'Grounds', count: 1 }],
        note: 'Slideshow and mic check with the couple at 4:00 PM.'
      },
      {
        id: 'evt-1002-dinner',
        name: 'Dinner',
        kind: 'guest-facing',
        start: 18,
        end: 22,
        requirements: [
          { role: 'Event Captain', count: 1 },
          { role: 'Server', count: 2 }
        ],
        note: 'Three-course seated service.'
      }
    ]
  },
  {
    id: 'evt-1004',
    dateKey: '2026-10-03',
    name: 'Martinez Wedding Reception',
    type: 'Wedding',
    couple: 'Ana & Diego Martinez',
    coupleId: 'cpl-2004',
    date: 'Saturday, October 3, 2026',
    dateShort: 'Sat, Oct 3',
    day: 'Sat',
    guests: 180,
    spaces: 'Orchard Lawn · Stone Hall',
    status: '16 days out',
    headline: '5:30 PM reception only',
    blocks: [
      {
        id: 'evt-1004-setup',
        name: 'Setup',
        kind: 'setup',
        start: 10,
        end: 16,
        requirements: [{ role: 'Grounds', count: 2 }],
        note: 'Largest floor plan of the season.'
      },
      {
        id: 'evt-1004-reception',
        name: 'Reception',
        kind: 'guest-facing',
        start: 17,
        end: 22,
        requirements: [
          { role: 'Venue Manager', count: 1 },
          { role: 'Event Staff', count: 3 },
          { role: 'Bartender', count: 2 }
        ],
        note: 'Two bars, dance floor in Stone Hall.'
      }
    ]
  },
  {
    id: 'evt-1005',
    dateKey: '2026-10-16',
    name: 'Chen–Wu Wedding',
    type: 'Wedding',
    couple: 'Wei Chen & Lian Wu',
    coupleId: 'cpl-2005',
    date: 'Friday, October 16, 2026',
    dateShort: 'Fri, Oct 16',
    day: 'Fri',
    guests: 70,
    spaces: 'Garden Terrace',
    status: '29 days out',
    headline: '5:00 PM — intimate garden wedding',
    blocks: [
      {
        id: 'evt-1005-setup',
        name: 'Setup',
        kind: 'setup',
        start: 12,
        end: 16,
        requirements: [{ role: 'Grounds', count: 1 }],
        note: 'Garden Terrace, weather backup in Stone Hall.'
      },
      {
        id: 'evt-1005-reception',
        name: 'Reception',
        kind: 'guest-facing',
        start: 17,
        end: 21,
        requirements: [
          { role: 'Event Staff', count: 2 },
          { role: 'Server', count: 1 }
        ],
        note: 'Family-style dinner.'
      }
    ]
  }
]

export function eventById(id) {
  return events.find((e) => e.id === id) || null
}

export function blockById(segId) {
  for (const event of events) {
    const seg = event.blocks.find((s) => s.id === segId)
    if (seg) return { event, block: seg }
  }
  return null
}

/** Every block across every event, flattened — used by the weekly schedule. */
export function allBlocks() {
  return events.flatMap((event) => event.blocks.map((block) => ({ event, block })))
}

// ---------------------------------------------------------------------------
// Seed assignments. assignment id is `${blockId}:${staffId}`.
//
// The Johnson ceremony is deliberately short-staffed: it needs 2 Event Staff
// and only Jake was assigned — and Jake has DECLINED. That is the scenario the
// whole prototype is built around.
// ---------------------------------------------------------------------------

const allSeedAssignments = [
  // ---- Johnson Wedding ----------------------------------------------------
  // THE scenario: the ceremony needs 2 Event Staff. Marisol has accepted and
  // Jake has DECLINED, leaving exactly one open position. Everything else on this event
  // is covered, so the one real problem is easy to see.
  { blockId: 'evt-1001-setup', staffId: 'stf-4010', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1001-setup', staffId: 'stf-4011', role: 'Grounds', status: 'accepted' },

  { blockId: 'evt-1001-ceremony', staffId: 'stf-4001', role: 'Venue Manager', status: 'accepted' },
  { blockId: 'evt-1001-ceremony', staffId: 'stf-4007', role: 'Event Staff', status: 'accepted' },
  {
    blockId: 'evt-1001-ceremony',
    staffId: 'stf-4006',
    role: 'Event Staff',
    status: 'declined',
    declineReason: 'Class until 4:00 PM — cannot make a 3:00 PM call time.'
  },

  { blockId: 'evt-1001-reception', staffId: 'stf-4002', role: 'Event Captain', status: 'accepted' },
  { blockId: 'evt-1001-reception', staffId: 'stf-4007', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1001-reception', staffId: 'stf-4008', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1001-reception', staffId: 'stf-4004', role: 'Bartender', status: 'accepted' },
  { blockId: 'evt-1001-reception', staffId: 'stf-4003', role: 'Server', status: 'accepted' },
  // One extra person awaiting a reply — shows the "pending" state without
  // creating an open position, because the block is already covered without them.
  { blockId: 'evt-1001-reception', staffId: 'stf-4009', role: 'Server', status: 'pending' },

  { blockId: 'evt-1001-cleanup', staffId: 'stf-4011', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1001-cleanup', staffId: 'stf-4010', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1001-cleanup', staffId: 'stf-4008', role: 'Event Staff', status: 'accepted' },

  // ---- Taylor Engagement Party (same day as Johnson — a real clash source) --------
  { blockId: 'evt-1003-setup', staffId: 'stf-4010', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1003-reception', staffId: 'stf-4012', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1003-reception', staffId: 'stf-4005', role: 'Bartender', status: 'accepted' },

  // ---- Shah–Patel Rehearsal Dinner: deliberately one Server short (secondary open position) ---------
  { blockId: 'evt-1002-setup', staffId: 'stf-4011', role: 'Grounds', status: 'draft' },
  { blockId: 'evt-1002-dinner', staffId: 'stf-4002', role: 'Event Captain', status: 'accepted' },
  { blockId: 'evt-1002-dinner', staffId: 'stf-4003', role: 'Server', status: 'draft' },

  // ---- Martinez Reception (fully staffed, further out) --------------------
  { blockId: 'evt-1004-setup', staffId: 'stf-4010', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1004-setup', staffId: 'stf-4011', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1004-reception', staffId: 'stf-4001', role: 'Venue Manager', status: 'accepted' },
  { blockId: 'evt-1004-reception', staffId: 'stf-4007', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1004-reception', staffId: 'stf-4008', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1004-reception', staffId: 'stf-4012', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1004-reception', staffId: 'stf-4004', role: 'Bartender', status: 'accepted' },
  { blockId: 'evt-1004-reception', staffId: 'stf-4005', role: 'Bartender', status: 'accepted' },

  // ---- Chen–Wu Wedding (fully staffed) ----------------------------------
  { blockId: 'evt-1005-setup', staffId: 'stf-4011', role: 'Grounds', status: 'accepted' },
  { blockId: 'evt-1005-reception', staffId: 'stf-4007', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1005-reception', staffId: 'stf-4008', role: 'Event Staff', status: 'accepted' },
  { blockId: 'evt-1005-reception', staffId: 'stf-4009', role: 'Server', status: 'accepted' }
]

// Only the events in lib/mock/scope.js, and only assignments for people and
// blocks that are still part of the prototype.
export const events = keep(allEvents, KEEP.events)

const keptBlockIds = events.flatMap((event) => event.blocks.map((block) => block.id))
export const seedAssignments = allSeedAssignments.filter(
  (a) => keptBlockIds.includes(a.blockId) && KEEP.staff.includes(a.staffId)
)
