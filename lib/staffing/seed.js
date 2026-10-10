// ---------------------------------------------------------------------------
// Staffing Planner · seed extras.
//
// the planner reads the v1 seed (lib/mock/events.js, lib/mock/staff.js) read-only
// and layers these extras on top through lib/staffing/adapter.js. Nothing here
// is visible to the first Staff Planner. See docs/STAFFING-PLANNER-2-SPEC.md §D.2.
// ---------------------------------------------------------------------------

export const BASE_NOW = '2026-10-10T10:00' // matches TODAY_KEY
export const SEED_SENT_AT = '2026-10-07T12:00' // seed asks went out Wed
export const SEED_RESPONDED_AT = '2026-10-08T18:20'

export const SPACES = {
  'garden-terrace': 'Garden Terrace',
  'stone-hall': 'Stone Hall',
  courtyard: 'Courtyard',
  'orchard-lawn': 'Orchard Lawn'
}

export const BLOCK_EXTRAS = {
  'evt-1001-setup': { spaceId: 'garden-terrace' },
  'evt-1001-ceremony': { spaceId: 'garden-terrace', guestStart: 15.5 },
  'evt-1001-reception': { spaceId: 'stone-hall' },
  'evt-1001-cleanup': { spaceId: 'stone-hall' },
  'evt-1003-setup': { spaceId: 'courtyard' },
  'evt-1003-reception': { spaceId: 'courtyard' },
  'evt-1002-setup': { spaceId: 'stone-hall' },
  'evt-1002-dinner': { spaceId: 'stone-hall' },
  'evt-1004-setup': { spaceId: 'orchard-lawn' },
  'evt-1004-reception': { spaceId: 'stone-hall' },
  'evt-1005-setup': { spaceId: 'garden-terrace' },
  'evt-1005-reception': { spaceId: 'garden-terrace' }
}

// Open question G.2 #1: confirm suppliedBy with the pilot venue.
export const EVENT_EXTRAS = {
  'evt-1001': { serviceStyle: 'plated', bar: 'full', barStations: 2, suppliedBy: { Server: 'caterer' } },
  'evt-1003': { serviceStyle: 'buffet', bar: 'full', barStations: 1, suppliedBy: { Server: 'caterer' } },
  'evt-1002': { serviceStyle: 'plated', bar: 'none', barStations: 0 },
  'evt-1004': { serviceStyle: 'plated', bar: 'full', barStations: 2, suppliedBy: { Server: 'caterer' } },
  'evt-1005': { serviceStyle: 'family', bar: 'none', barStations: 0 }
}

// Merged onto v1 staff by the adapter.
export const STAFF_EXTRAS = {
  'stf-4003': { roles: ['Server', 'Event Staff'] },
  'stf-4004': { credentials: [{ type: 'alcohol-service', expiresOn: '2027-05-01' }] },
  'stf-4005': { credentials: [{ type: 'alcohol-service', expiresOn: '2026-11-01' }] }
}

// On-call pool. These exist only in the planner. The 12-person v1 seed is too
// small to show backfill; real venues keep a much larger roster than any one
// event uses (02 §2.4, 03 §1.1).
export const POOL_STAFF = [
  {
    id: 'stf-4013', name: 'Tessa Nguyen', initials: 'TN', role: 'Event Staff', roles: ['Event Staff'], pool: true,
    phone: '(612) 555-0237', preferredHours: 'Up to 20/week',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [{ start: 16, end: 23 }], Sat: [{ start: 12, end: 23 }], Sun: [{ start: 10, end: 18 }] }
  },
  {
    id: 'stf-4014', name: 'Andre Wilson', initials: 'AW', role: 'Server', roles: ['Server', 'Event Staff'], pool: true,
    phone: '(612) 555-0248', preferredHours: '10–20/week',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [{ start: 17, end: 23 }], Sat: [{ start: 14, end: 23 }], Sun: [] }
  },
  {
    id: 'stf-4015', name: 'Mei Lin', initials: 'ML', role: 'Bartender', roles: ['Bartender'], pool: true,
    phone: '(612) 555-0259', preferredHours: 'Up to 15/week',
    credentials: [{ type: 'alcohol-service', expiresOn: '2027-08-01' }],
    availability: { Mon: [], Tue: [], Wed: [], Thu: [{ start: 16, end: 23 }], Fri: [{ start: 16, end: 24 }], Sat: [{ start: 15, end: 24 }], Sun: [] }
  },
  {
    id: 'stf-4016', name: 'Rosa Delgado', initials: 'RD', role: 'Grounds', roles: ['Grounds'], pool: true,
    phone: '(612) 555-0260', preferredHours: '15–25/week',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [{ start: 8, end: 18 }], Fri: [{ start: 8, end: 18 }], Sat: [{ start: 8, end: 20 }], Sun: [] }
  }
]

export const SEED_AWAY = [
  { id: 'aw-jake', staffId: 'stf-4006', dateKey: '2026-10-10', start: 0, end: 16, reason: 'Class', addedBy: 'staff' },
  { id: 'aw-ben', staffId: 'stf-4012', dateKey: '2026-11-08', endDateKey: '2026-11-09', reason: 'Family trip', addedBy: 'staff' }
]
