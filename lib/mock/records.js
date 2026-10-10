// ---------------------------------------------------------------------------
// Supporting records: tasks, messages, couples, vendors, payments, documents
// and the per-event activity log.
//
// These are the "context" around the two headline features. They exist so the
// attention items have somewhere real to point at — not as features in their
// own right.
// ---------------------------------------------------------------------------

import { KEEP, keep } from './scope.js'

const allTasks = [
  {
    id: 't-guest-count',
    eventId: 'evt-1001',
    title: 'Submit the guarantee to Harvest Table Catering',
    due: 'Due today',
    dueTone: 'urgent',
    owner: 'Dana Whitcomb',
    done: false,
    detail: 'Catering needs the guaranteed count to lock the order. Contract says 48 hours before service.',
    // Completing this task means entering the number, not just ticking a box.
    input: 'guestCount'
  },
  {
    id: 't-balance',
    eventId: 'evt-1001',
    title: 'Collect remaining balance of $4,250',
    due: 'Due Fri, Sep 18',
    dueTone: 'warn',
    owner: 'Dana Whitcomb',
    done: false,
    detail: 'Final payment is unpaid with 2 days until the event.'
  },
  {
    id: 't-timeline-signoff',
    eventId: 'evt-1001',
    title: 'Get couple sign-off on the day-of timeline',
    due: 'Due Fri, Sep 18',
    dueTone: 'warn',
    owner: 'Dana Whitcomb',
    done: false,
    detail: 'Version 2 has been sent. Waiting on Emily to confirm the 9:00 AM decorating change.'
  },
  {
    id: 't-chairs',
    eventId: 'evt-1001',
    title: 'Confirm ceremony chair count (150)',
    due: 'Completed Sep 12',
    dueTone: 'done',
    owner: 'Caleb Ross',
    done: true,
    detail: 'Counted and staged in the Stone Hall storage room.'
  },
  {
    id: 't-floorplan',
    eventId: 'evt-1001',
    title: 'Floor plan approved by couple',
    due: 'Completed Sep 8',
    dueTone: 'done',
    owner: 'Dana Whitcomb',
    done: true,
    detail: 'Version 3 approved by Emily by email.'
  },
  {
    id: 't-coi',
    eventId: 'evt-1001',
    title: 'Certificates of insurance on file for all vendors',
    due: 'Completed Sep 5',
    dueTone: 'done',
    owner: 'Dana Whitcomb',
    done: true,
    detail: 'All six vendors returned a current COI.'
  },
  {
    id: 't-taylor-cake',
    eventId: 'evt-1003',
    title: 'Confirm cake delivery window',
    due: 'Due Fri, Sep 18',
    dueTone: 'warn',
    owner: 'Theo Marsh',
    done: false,
    detail: 'Bakery has not confirmed whether they arrive before or after guest arrival.'
  },
  {
    id: 't-shah-av',
    eventId: 'evt-1002',
    title: 'Book an AV tech for the slideshow and toasts',
    due: 'Due Mon, Sep 21',
    dueTone: 'warn',
    owner: 'Theo Marsh',
    done: false,
    detail: 'The couple is showing a photo slideshow; our in-house system needs an operator.'
  },
  {
    id: 't-martinez-walkthrough',
    eventId: 'evt-1004',
    title: 'Schedule final walkthrough with the Martinez family',
    due: 'Due Fri, Sep 25',
    dueTone: 'info',
    owner: 'Dana Whitcomb',
    done: false,
    detail: 'Needs to happen at least two weeks out.'
  }
]

const allMessages = [
  {
    id: 'msg-5001',
    eventId: 'evt-1001',
    coupleId: 'cpl-2001',
    from: 'Emily Johnson',
    fromRole: 'Couple · Johnson Wedding',
    initials: 'EJ',
    subject: 'Can we move decorating to 9:00 AM?',
    received: 'Today, 8:42 AM',
    needsReply: true,
    priority: 'urgent',
    body: [
      'Hi!',
      "We're finalizing our plans and were wondering if we could move our decorating time from 10:00 AM to 9:00 AM on the morning of the wedding. Would that be possible?",
      'Thanks!',
      'Emily'
    ],
    context: [
      { label: 'Current setup window', value: '9:00 AM – 3:00 PM' },
      { label: 'Earliest venue access', value: '8:00 AM (contract)' },
      { label: 'Night before', value: 'No event booked' },
      { label: 'Grounds crew on site', value: '7:30 AM' }
    ],
    suggestedReply:
      "Hi Emily,\n\nA 9:00 AM start works on our end — there's no event the night before and our grounds crew is on site from 7:30 AM.\n\nOne note: Bloom & Bough begin floral load-in at 12:00 PM, so we'd ask that personal decor be placed before then.\n\nI'll update the day-of timeline and let the vendor team know.\n\nWarmly,\nDana Whitcomb\nVenue Manager"
  },
  {
    id: 'msg-5002',
    eventId: 'evt-1001',
    coupleId: null,
    from: 'Marla Perez · Harvest Table',
    fromRole: 'Vendor · Catering',
    initials: 'MP',
    subject: 'Guarantee needed today',
    received: 'Today, 7:15 AM',
    needsReply: true,
    priority: 'urgent',
    body: [
      'Morning Dana,',
      'We need the confirmed headcount for Saturday by end of day today to place the order with our supplier. Last number I have is 150.',
      'Marla'
    ],
    context: [
      { label: 'Last confirmed count', value: '150 guests' },
      { label: 'Contract deadline', value: '48 hours before service' }
    ],
    suggestedReply:
      'Hi Marla,\n\nConfirming 150 guests for Saturday. No changes from the last count.\n\nThanks,\nDana'
  },
  {
    id: 'msg-5003',
    eventId: 'evt-1001',
    coupleId: null,
    from: 'Jake Pearson',
    fromRole: 'Staff · Event Staff',
    initials: 'JP',
    subject: 'Cannot make the ceremony shift Saturday',
    received: 'Yesterday, 6:30 PM',
    needsReply: false,
    priority: 'info',
    body: [
      'Hey Dana,',
      "I have a class that doesn't finish until 4:00 PM on Saturday, so I can't make the 3:00 PM call time for the ceremony. Really sorry for the short notice. I can still do the later reception block if that helps.",
      'Jake'
    ],
    context: [
      { label: 'Shift', value: 'Johnson Wedding · Ceremony' },
      { label: 'Window', value: '3:00 PM – 5:00 PM' }
    ],
    suggestedReply: 'Thanks for letting me know, Jake. I\'ll find cover for the ceremony block.'
  },
  {
    id: 'msg-5004',
    eventId: 'evt-1003',
    coupleId: 'cpl-2003',
    from: 'Rhonda Taylor',
    fromRole: 'Couple · Taylor Engagement Party',
    initials: 'RT',
    subject: 'Adding two more guests',
    received: 'Yesterday, 2:10 PM',
    needsReply: true,
    priority: 'warn',
    body: [
      'Hi Dana,',
      'Two more people can come after all — can we go from 43 to 45? Hopefully not too late to change.',
      'Rhonda'
    ],
    context: [
      { label: 'Current count', value: '45 guests' },
      { label: 'Space capacity', value: 'Courtyard — 60' }
    ],
    suggestedReply: 'Hi Rhonda,\n\n45 is no problem at all — the Courtyard seats 60. I\'ve updated your count.\n\nDana'
  },
  {
    id: 'msg-5005',
    eventId: 'evt-1002',
    coupleId: 'cpl-2002',
    from: 'Priya Shah',
    fromRole: 'Couple · Shah–Patel Rehearsal Dinner',
    initials: 'PS',
    subject: 'Projector and microphone for the 24th',
    received: 'Mon, Sep 14',
    needsReply: false,
    priority: 'info',
    body: [
      'Hi Dana,',
      "We'll need a projector and a handheld mic for a short photo slideshow and toasts after dinner. Can you confirm the room has both?",
      'Priya'
    ],
    context: [{ label: 'Space', value: 'Stone Hall' }],
    suggestedReply: 'Hi Priya,\n\nStone Hall has a ceiling projector and two handheld mics. I\'ll have an AV tech on site.\n\nDana'
  },
  {
    id: 'msg-5006',
    eventId: 'evt-1001',
    coupleId: null,
    from: 'Iris Whelan · Bloom & Bough',
    fromRole: 'Vendor · Florals',
    initials: 'IW',
    subject: 'Load-in confirmed for 12:00 PM',
    received: 'Mon, Sep 14',
    needsReply: false,
    priority: 'done',
    body: ['Confirming our team arrives at 12:00 PM Saturday for floral load-in. — Iris'],
    context: [{ label: 'Load-in', value: '12:00 PM Saturday' }],
    suggestedReply: 'Thanks Iris, see you then.'
  }
]

const allCouples = [
  {
    id: 'cpl-2001',
    name: 'Emily & Marcus Johnson',
    primaryContact: 'Emily Johnson',
    email: 'emily.johnson@email.test',
    phone: '(612) 555-0147',
    initials: 'EJ',
    eventIds: ['evt-1001'],
    since: 'Booked February 2026',
    note: 'Planner is Rachel Adeyemi at Lark & Ivy Events.'
  },
  {
    id: 'cpl-2003',
    name: 'Rhonda Taylor & Sam Brooks',
    primaryContact: 'Rhonda Taylor',
    email: 'rhonda.taylor@email.test',
    phone: '(612) 555-0310',
    initials: 'RT',
    eventIds: ['evt-1003'],
    since: 'Booked July 2026',
    note: 'Engagement party. Returning couple — a family member hosted a shower here in 2024.'
  },
  {
    id: 'cpl-2002',
    name: 'Priya Shah & Dev Patel',
    primaryContact: 'Priya Shah',
    email: 'priya.shah@email.test',
    phone: '(612) 555-0422',
    initials: 'PS',
    eventIds: ['evt-1002'],
    since: 'Booked June 2026',
    note: 'Rehearsal dinner for a Saturday wedding at a nearby church.'
  },
  {
    id: 'cpl-2004',
    name: 'Ana & Diego Martinez',
    primaryContact: 'Ana Martinez',
    email: 'ana.martinez@email.test',
    phone: '(612) 555-0533',
    initials: 'AM',
    eventIds: ['evt-1004'],
    since: 'Booked March 2026',
    note: 'Reception only — ceremony is off site.'
  },
  {
    id: 'cpl-2005',
    name: 'Wei Chen & Lian Wu',
    primaryContact: 'Wei Chen',
    email: 'wei.chen@email.test',
    phone: '(612) 555-0644',
    initials: 'WC',
    eventIds: ['evt-1005'],
    since: 'Booked May 2026',
    note: 'Intimate garden wedding, family only.'
  }
]

const allVendors = [
  {
    id: 'vnd-3001',
    name: 'Harvest Table Catering',
    category: 'Caterer',
    contact: 'Marla Perez',
    phone: '(612) 555-0701',
    email: 'marla@harvesttable.test',
    eventIds: ['evt-1001', 'evt-1002', 'evt-1004'],
    status: 'Guarantee due',
    statusTone: 'urgent',
    note: 'Needs the Johnson guarantee today.'
  },
  {
    id: 'vnd-3002',
    name: 'Bloom & Bough',
    category: 'Florist',
    contact: 'Iris Whelan',
    phone: '(612) 555-0712',
    email: 'iris@bloomandbough.test',
    eventIds: ['evt-1001', 'evt-1005'],
    status: 'Confirmed',
    statusTone: 'done',
    note: 'Load-in 12:00 PM Saturday.'
  },
  {
    id: 'vnd-3003',
    name: 'Northline Sound',
    category: 'DJ/Band',
    contact: 'Devon Hart',
    phone: '(612) 555-0723',
    email: 'devon@northlinesound.test',
    eventIds: ['evt-1001', 'evt-1003', 'evt-1004'],
    status: 'Confirmed',
    statusTone: 'done',
    note: 'Ceremony mic plus reception sound.'
  },
  {
    id: 'vnd-3004',
    name: 'Juniper Photo Co.',
    category: 'Photographer',
    contact: 'Ana Cruz',
    phone: '(612) 555-0734',
    email: 'ana@juniperphoto.test',
    eventIds: ['evt-1001'],
    status: 'Confirmed',
    statusTone: 'done',
    note: 'Arrives 2:00 PM.'
  },
  {
    id: 'vnd-3005',
    name: 'Sweet Larkspur Bakery',
    category: 'Bakery',
    contact: 'Jo Bennett',
    phone: '(612) 555-0745',
    email: 'jo@sweetlarkspur.test',
    eventIds: ['evt-1001', 'evt-1003'],
    status: 'Awaiting confirmation',
    statusTone: 'warn',
    note: 'Has not confirmed the Taylor delivery window.'
  },
  {
    id: 'vnd-3006',
    name: 'Grand Avenue Coach',
    category: 'Transportation',
    contact: 'Terry Malone',
    phone: '(612) 555-0756',
    email: 'terry@grandavecoach.test',
    eventIds: ['evt-1001'],
    status: 'Confirmed',
    statusTone: 'done',
    note: 'Two runs from Hotel Brixton.'
  }
]

export const payments = {
  'evt-1001': {
    total: 28400,
    paid: 24150,
    schedule: [
      { id: 'p1', label: 'Booking deposit', amount: 8400, when: 'Paid Feb 14, 2026', state: 'paid' },
      { id: 'p2', label: 'Second installment', amount: 9750, when: 'Paid Jun 1, 2026', state: 'paid' },
      { id: 'p3', label: 'Third installment', amount: 6000, when: 'Paid Aug 15, 2026', state: 'paid' },
      { id: 'p4', label: 'Final balance', amount: 4250, when: 'Due Sep 18, 2026', state: 'due' }
    ]
  },
  'evt-1003': {
    total: 4800,
    paid: 4800,
    schedule: [
      { id: 'p1', label: 'Deposit', amount: 1600, when: 'Paid Jul 3, 2026', state: 'paid' },
      { id: 'p2', label: 'Balance', amount: 3200, when: 'Paid Sep 10, 2026', state: 'paid' }
    ]
  },
  'evt-1002': {
    total: 9200,
    paid: 4600,
    schedule: [
      { id: 'p1', label: 'Deposit', amount: 4600, when: 'Paid Jun 20, 2026', state: 'paid' },
      { id: 'p2', label: 'Balance', amount: 4600, when: 'Due Sep 22, 2026', state: 'due' }
    ]
  },
  'evt-1004': {
    total: 31500,
    paid: 10500,
    schedule: [
      { id: 'p1', label: 'Deposit', amount: 10500, when: 'Paid Mar 8, 2026', state: 'paid' },
      { id: 'p2', label: 'Second installment', amount: 10500, when: 'Due Sep 20, 2026', state: 'due' },
      { id: 'p3', label: 'Final balance', amount: 10500, when: 'Due Sep 28, 2026', state: 'scheduled' }
    ]
  },
  'evt-1005': {
    total: 7400,
    paid: 2400,
    schedule: [
      { id: 'p1', label: 'Deposit', amount: 2400, when: 'Paid May 2, 2026', state: 'paid' },
      { id: 'p2', label: 'Balance', amount: 5000, when: 'Due Oct 9, 2026', state: 'scheduled' }
    ]
  }
}

const allDocuments = [
  { id: 'd1', eventId: 'evt-1001', name: 'Signed venue contract', kind: 'PDF', updated: 'Feb 14, 2026', status: 'Signed', tone: 'done' },
  { id: 'd2', eventId: 'evt-1001', name: 'Certificate of insurance', kind: 'PDF', updated: 'Sep 5, 2026', status: 'On file', tone: 'done' },
  { id: 'd3', eventId: 'evt-1001', name: 'Final floor plan v3', kind: 'PDF', updated: 'Sep 8, 2026', status: 'Approved', tone: 'done' },
  { id: 'd4', eventId: 'evt-1001', name: 'Catering menu selections', kind: 'PDF', updated: 'Sep 11, 2026', status: 'Final', tone: 'done' },
  { id: 'd5', eventId: 'evt-1001', name: 'Day-of timeline v2', kind: 'DOC', updated: 'Sep 16, 2026', status: 'Awaiting signature', tone: 'urgent' },
  { id: 'd6', eventId: 'evt-1003', name: 'Venue agreement', kind: 'PDF', updated: 'Jul 3, 2026', status: 'Signed', tone: 'done' },
  { id: 'd7', eventId: 'evt-1002', name: 'Signed venue contract', kind: 'PDF', updated: 'Jun 20, 2026', status: 'Signed', tone: 'done' },
  { id: 'd8', eventId: 'evt-1002', name: 'Dietary requirements list', kind: 'XLS', updated: 'Sep 15, 2026', status: 'Awaiting couple', tone: 'warn' },
  { id: 'd9', eventId: 'evt-1004', name: 'Signed venue contract', kind: 'PDF', updated: 'Mar 8, 2026', status: 'Signed', tone: 'done' },
  { id: 'd10', eventId: 'evt-1005', name: 'Signed venue contract', kind: 'PDF', updated: 'May 2, 2026', status: 'Signed', tone: 'done' }
]

const allActivityLog = [
  { id: 'h1', eventId: 'evt-1001', when: 'Today, 8:42 AM', who: 'Emily Johnson', what: 'Requested decorating time move from 10:00 AM to 9:00 AM', tone: 'urgent' },
  { id: 'h2', eventId: 'evt-1001', when: 'Yesterday, 6:30 PM', who: 'Jake Pearson', what: 'Declined the Ceremony assignment (3:00–5:00 PM)', tone: 'urgent' },
  { id: 'h3', eventId: 'evt-1001', when: 'Yesterday, 11:05 AM', who: 'Marla Perez', what: 'Requested the guarantee', tone: 'warn' },
  { id: 'h4', eventId: 'evt-1001', when: 'Mon, Sep 14', who: 'Iris Whelan', what: 'Confirmed floral load-in at 12:00 PM', tone: 'done' },
  { id: 'h5', eventId: 'evt-1001', when: 'Sep 12', who: 'Dana Whitcomb', what: 'Published the staffing schedule to 8 team members', tone: 'info' },
  { id: 'h6', eventId: 'evt-1001', when: 'Sep 8', who: 'Emily Johnson', what: 'Approved floor plan v3', tone: 'done' },
  { id: 'h7', eventId: 'evt-1003', when: 'Yesterday, 2:10 PM', who: 'Rhonda Taylor', what: 'Increased guest count from 43 to 45', tone: 'warn' },
  { id: 'h8', eventId: 'evt-1002', when: 'Mon, Sep 14', who: 'Priya Shah', what: 'Asked about projector and microphone', tone: 'info' }
]

export const timelines = {
  'evt-1001': [
    { id: 'tl1', time: '9:00 AM', title: 'Decorating access — couple & planner', note: 'Change requested from 10:00 AM. Awaiting your response.', tone: 'urgent' },
    { id: 'tl2', time: '12:00 PM', title: 'Vendor load-in', note: 'Bloom & Bough florals, Northline Sound' },
    { id: 'tl3', time: '1:00 PM', title: 'Cake delivery', note: 'Sweet Larkspur Bakery' },
    { id: 'tl4', time: '3:00 PM', title: 'Staff call time — Ceremony', note: '1 venue manager + 2 event staff' },
    { id: 'tl5', time: '3:30 PM', title: 'Guest arrival & parking opens', note: 'Shuttle from Hotel Brixton' },
    { id: 'tl6', time: '4:00 PM', title: 'Ceremony', note: 'Garden Terrace · 150 chairs set' },
    { id: 'tl7', time: '4:45 PM', title: 'Cocktail hour', note: 'Courtyard · 2 bar stations' },
    { id: 'tl8', time: '6:00 PM', title: 'Reception & dinner service', note: 'Stone Hall · 15 rounds of 10' },
    { id: 'tl9', time: '10:30 PM', title: 'Send-off', note: 'Front drive · sparkler exit approved' },
    { id: 'tl10', time: '11:00 PM', title: 'Breakdown complete & venue close', note: 'All vendors off property' }
  ],
  'evt-1003': [
    { id: 'tt1', time: '3:00 PM', title: 'Setup begins', note: 'Courtyard string lights, long table' },
    { id: 'tt2', time: '5:30 PM', title: 'Guests arrive', note: '45 guests' },
    { id: 'tt3', time: '6:00 PM', title: 'Dinner & toasts', note: 'Buffet service' },
    { id: 'tt4', time: '10:00 PM', title: 'Close', note: 'Courtyard cleared' }
  ],
  'evt-1002': [
    { id: 'ta1', time: '1:00 PM', title: 'Setup begins', note: 'Stone Hall, seated rounds' },
    { id: 'ta2', time: '4:00 PM', title: 'Slideshow and mic check', note: 'Projector and handheld mic' },
    { id: 'ta3', time: '6:30 PM', title: 'Seated dinner', note: 'Three courses' },
    { id: 'ta4', time: '8:30 PM', title: 'Slideshow & toasts', note: '20 minutes' },
    { id: 'ta5', time: '10:00 PM', title: 'Close', note: '' }
  ],
  'evt-1004': [
    { id: 'tm1', time: '10:00 AM', title: 'Setup begins', note: 'Largest floor plan of the season' },
    { id: 'tm2', time: '5:30 PM', title: 'Reception begins', note: 'Orchard Lawn into Stone Hall' },
    { id: 'tm3', time: '10:00 PM', title: 'Close', note: '' }
  ],
  'evt-1005': [
    { id: 'tc1', time: '12:00 PM', title: 'Setup begins', note: 'Garden Terrace' },
    { id: 'tc2', time: '5:00 PM', title: 'Wedding dinner', note: 'Family-style service' },
    { id: 'tc3', time: '9:00 PM', title: 'Close', note: '' }
  ]
}

export function coupleById(id) {
  return couples.find((c) => c.id === id) || null
}

export function vendorById(id) {
  return vendors.find((v) => v.id === id) || null
}

export function messageById(id) {
  return messages.find((m) => m.id === id) || null
}

export function money(n) {
  return `$${n.toLocaleString('en-US')}`
}

// Two of each, per lib/mock/scope.js.
export const tasks = keep(allTasks, KEEP.tasks)
export const messages = keep(allMessages, KEEP.messages)
export const couples = keep(allCouples, KEEP.couples)
export const vendors = keep(allVendors, KEEP.vendors).map((v) => ({
  ...v,
  eventIds: v.eventIds.filter((id) => KEEP.events.includes(id))
}))
export const documents = keep(allDocuments, KEEP.documents)
export const activityLog = keep(allActivityLog, KEEP.activity)
