// ---------------------------------------------------------------------------
// Mock data for the Willow & Stone Events prototype.
// Everything the three screens display comes from this file. There is no
// backend, database or API — edit the values here to change the prototype.
// ---------------------------------------------------------------------------

export const venue = {
  name: 'Willow & Stone Events',
  manager: 'Dana Whitcomb',
  managerRole: 'Venue Manager',
  managerInitials: 'DW',
  phone: '(612) 555-0110',
  today: 'Saturday, September 12, 2026'
}

// Headline numbers across the top of the dashboard.
export const venueStats = [
  { label: 'Events this month', value: '6', note: '2 this weekend' },
  { label: 'Needs attention', value: '5', note: 'across 3 events', tone: 'attention' },
  { label: 'Guests hosted this month', value: '840', note: 'confirmed counts' },
  { label: 'Outstanding balances', value: '$12,400', note: '3 invoices open' }
]

// The "Needs Attention" queue on the dashboard. The item with id 'decor-time'
// is the one that gets resolved when the user sends the reply on Screen 3.
export const attentionQueue = [
  {
    id: 'decor-time',
    priority: 'Respond today',
    tone: 'urgent',
    title: 'Decorating time change requested by the bride',
    detail: 'Emily Johnson asked to move decorating access from 10:00 AM to 9:00 AM.',
    event: 'Johnson Wedding',
    eventId: 'johnson',
    meta: 'Email received 2 hours ago',
    action: 'Open message'
  },
  {
    id: 'catering-count',
    priority: 'Due Mon, Sep 14',
    tone: 'urgent',
    title: 'Final catering guest count due',
    detail: 'Harvest Table Catering needs the confirmed headcount to lock the order.',
    event: 'Johnson Wedding',
    eventId: 'johnson',
    meta: 'Vendor deadline in 2 days',
    action: 'Open event'
  },
  {
    id: 'balance',
    priority: 'Due Thu, Sep 17',
    tone: 'warning',
    title: 'Remaining balance of $4,250 due soon',
    detail: 'Final payment is still open with 7 days until the event.',
    event: 'Johnson Wedding',
    eventId: 'johnson',
    meta: '85% of contract collected',
    action: 'Open event'
  },
  {
    id: 'bartender',
    priority: 'Due Fri, Sep 18',
    tone: 'warning',
    title: 'One bartender still unconfirmed',
    detail: 'Bar staffing is 2 of 3 confirmed for a 180-guest reception.',
    event: 'Nguyen–Park Wedding',
    eventId: 'nguyen',
    meta: 'Staffing',
    action: 'Open event'
  },
  {
    id: 'coi',
    priority: 'Due Mon, Sep 21',
    tone: 'warning',
    title: 'Missing certificate of insurance',
    detail: 'Fern & Field Florals has not submitted a current COI.',
    event: 'Whitfield Corporate Retreat',
    eventId: 'whitfield',
    meta: 'Vendor compliance',
    action: 'Open event'
  }
]

// Upcoming events list on the dashboard.
export const events = [
  {
    id: 'alvarez',
    name: 'Alvarez & Reed Wedding',
    clients: 'Sofia Alvarez & Chris Reed',
    dateLabel: 'Today · Sat, Sep 12, 2026',
    timeLabel: '5:00 PM Ceremony',
    guests: 120,
    space: 'Garden Terrace · Stone Hall',
    status: 'Event day',
    statusTone: 'live',
    attention: 0,
    openTasks: 0,
    clickable: false
  },
  {
    id: 'johnson',
    name: 'Johnson Wedding',
    clients: 'Emily & Marcus Johnson',
    dateLabel: 'Sat, Sep 19, 2026',
    timeLabel: '4:00 PM Ceremony',
    guests: 150,
    space: 'Garden Terrace · Stone Hall',
    status: '7 days out',
    statusTone: 'soon',
    attention: 3,
    openTasks: 3,
    clickable: true
  },
  {
    id: 'whitfield',
    name: 'Whitfield Corporate Retreat',
    clients: 'Whitfield Partners · Angela Boone',
    dateLabel: 'Thu, Sep 24, 2026',
    timeLabel: '9:00 AM Program',
    guests: 60,
    space: 'Stone Hall',
    status: '12 days out',
    statusTone: 'normal',
    attention: 1,
    openTasks: 4,
    clickable: false
  },
  {
    id: 'nguyen',
    name: 'Nguyen–Park Wedding',
    clients: 'Mina Nguyen & Julian Park',
    dateLabel: 'Sat, Oct 3, 2026',
    timeLabel: '5:30 PM Ceremony',
    guests: 180,
    space: 'Orchard Lawn · Stone Hall',
    status: '21 days out',
    statusTone: 'normal',
    attention: 1,
    openTasks: 6,
    clickable: false
  },
  {
    id: 'brookside',
    name: 'Brookside Foundation Gala',
    clients: 'Brookside Foundation · Ray Ellison',
    dateLabel: 'Fri, Oct 16, 2026',
    timeLabel: '6:30 PM Reception',
    guests: 220,
    space: 'Stone Hall · Courtyard',
    status: '34 days out',
    statusTone: 'normal',
    attention: 0,
    openTasks: 9,
    clickable: false
  }
]

// Today's on-site schedule (dashboard right rail).
export const todaySchedule = [
  { time: '8:00 AM', title: 'Grounds & setup crew on site', detail: 'Alvarez & Reed Wedding', state: 'done' },
  { time: '10:30 AM', title: 'Site walkthrough with client', detail: 'Whitfield Corporate Retreat', state: 'done' },
  { time: '1:00 PM', title: 'Staff call time — 9 scheduled', detail: 'Alvarez & Reed Wedding', state: 'now' },
  { time: '5:00 PM', title: 'Ceremony — Garden Terrace', detail: 'Alvarez & Reed Wedding', state: 'upcoming' },
  { time: '11:00 PM', title: 'Breakdown & venue close', detail: 'Alvarez & Reed Wedding', state: 'upcoming' }
]

// Recent activity feed (dashboard right rail).
export const recentActivity = [
  {
    icon: 'mail',
    text: 'Emily Johnson sent a message about decorating time',
    event: 'Johnson Wedding',
    when: '2 hours ago',
    unread: true
  },
  {
    icon: 'dollar',
    text: 'Payment received — $3,000 deposit',
    event: 'Nguyen–Park Wedding',
    when: 'Yesterday, 4:12 PM'
  },
  {
    icon: 'check',
    text: 'Harvest Table Catering confirmed the final menu',
    event: 'Johnson Wedding',
    when: 'Yesterday, 11:05 AM'
  },
  {
    icon: 'file',
    text: 'Venue contract signed by Ray Ellison',
    event: 'Brookside Foundation Gala',
    when: 'Thu, Sep 10'
  },
  {
    icon: 'users',
    text: 'Staff schedule published to 9 team members',
    event: 'Alvarez & Reed Wedding',
    when: 'Wed, Sep 9'
  }
]

// ---------------------------------------------------------------------------
// Johnson Wedding — everything shown in the event workspace on Screen 2.
// ---------------------------------------------------------------------------

export const johnson = {
  id: 'johnson',
  name: 'Johnson Wedding',
  date: 'Saturday, September 19, 2026',
  ceremony: '4:00 PM Ceremony',
  guests: 150,
  countdown: '7 days out',
  package: 'Full-Day Estate Package',
  spaces: 'Garden Terrace (ceremony) · Stone Hall (reception)',

  contacts: [
    {
      name: 'Emily Johnson',
      role: 'Bride · Primary contact',
      email: 'emily.johnson@email.com',
      phone: '(612) 555-0147',
      initials: 'EJ',
      primary: true
    },
    {
      name: 'Marcus Johnson',
      role: 'Groom',
      email: 'm.johnson@email.com',
      phone: '(612) 555-0193',
      initials: 'MJ'
    },
    {
      name: 'Rachel Adeyemi',
      role: 'Planner · Lark & Ivy Events',
      email: 'rachel@larkandivy.com',
      phone: '(612) 555-0288',
      initials: 'RA'
    }
  ],

  timeline: [
    {
      time: '9:00 AM',
      title: 'Decorating access — client & planner',
      detail: 'Change requested from 10:00 AM. Awaiting your response.',
      flagged: true
    },
    { time: '12:00 PM', title: 'Vendor load-in', detail: 'Bloom & Bough florals, Northline Sound' },
    { time: '1:00 PM', title: 'Cake delivery', detail: 'Sweet Larkspur Bakery' },
    { time: '1:30 PM', title: 'Staff call time', detail: '8 team members on site' },
    { time: '3:30 PM', title: 'Guest arrival & parking opens', detail: 'Shuttle from Grand Avenue Coach' },
    { time: '4:00 PM', title: 'Ceremony', detail: 'Garden Terrace · 150 chairs set' },
    { time: '4:45 PM', title: 'Cocktail hour', detail: 'Courtyard · 2 bar stations' },
    { time: '6:00 PM', title: 'Reception & dinner service', detail: 'Stone Hall · 15 rounds of 10' },
    { time: '10:30 PM', title: 'Send-off', detail: 'Front drive · sparkler exit approved' },
    { time: '11:00 PM', title: 'Breakdown complete & venue close', detail: 'All vendors off property' }
  ],

  payments: {
    total: '$28,400',
    paid: '$24,150',
    remaining: '$4,250',
    percent: 85,
    dueLabel: 'Due Thursday, September 17, 2026',
    schedule: [
      { label: 'Booking deposit', amount: '$8,400', when: 'Paid Feb 14, 2026', state: 'paid' },
      { label: 'Second installment', amount: '$9,750', when: 'Paid Jun 1, 2026', state: 'paid' },
      { label: 'Third installment', amount: '$6,000', when: 'Paid Aug 15, 2026', state: 'paid' },
      { label: 'Final balance', amount: '$4,250', when: 'Due Sep 17, 2026', state: 'due' }
    ]
  },

  vendors: [
    {
      name: 'Harvest Table Catering',
      role: 'Catering',
      contact: 'Marla Perez',
      state: 'Count due',
      tone: 'attention',
      note: 'Final headcount due Mon, Sep 14'
    },
    { name: 'Bloom & Bough', role: 'Florals', contact: 'Iris Whelan', state: 'Confirmed', tone: 'ok', note: 'Load-in 12:00 PM' },
    { name: 'Northline Sound', role: 'DJ & AV', contact: 'Devon Hart', state: 'Confirmed', tone: 'ok', note: 'Ceremony mic + reception' },
    { name: 'Juniper Photo Co.', role: 'Photography', contact: 'Ana Cruz', state: 'Confirmed', tone: 'ok', note: 'Arrives 2:00 PM' },
    { name: 'Sweet Larkspur Bakery', role: 'Cake & desserts', contact: 'Jo Bennett', state: 'Confirmed', tone: 'ok', note: 'Delivery 1:00 PM' },
    { name: 'Grand Avenue Coach', role: 'Guest shuttle', contact: 'Terry Malone', state: 'Confirmed', tone: 'ok', note: '2 runs from Hotel Brixton' }
  ],

  staff: [
    { name: 'Dana Whitcomb', role: 'Venue manager', time: '1:30 PM', initials: 'DW' },
    { name: 'Theo Marsh', role: 'Event captain', time: '1:30 PM', initials: 'TM' },
    { name: 'Nina Kovac', role: 'Server lead', time: '2:30 PM', initials: 'NK' },
    { name: 'Priya Raman', role: 'Bar lead', time: '3:00 PM', initials: 'PR' },
    { name: 'Luis Ortega', role: 'Bartender', time: '3:00 PM', initials: 'LO' },
    { name: 'Grounds crew (3)', role: 'Setup & breakdown', time: '8:00 AM', initials: 'GC' }
  ],

  tasks: [
    { id: 'decor-time', label: 'Respond to decorating time change request', due: 'Due today', open: true, flagged: true },
    { id: 'catering-count', label: 'Submit final guest count to Harvest Table', due: 'Due Mon, Sep 14', open: true, flagged: true },
    { id: 'balance', label: 'Collect remaining balance of $4,250', due: 'Due Thu, Sep 17', open: true, flagged: true },
    { id: 'walkthrough', label: 'Final walkthrough with couple', due: 'Completed Sep 5', open: false },
    { id: 'chairs', label: 'Confirm ceremony chair count (150)', due: 'Completed Sep 4', open: false },
    { id: 'floorplan', label: 'Floor plan approved by client', due: 'Completed Aug 28', open: false },
    { id: 'schedule', label: 'Publish staff schedule', due: 'Completed Sep 8', open: false },
    { id: 'vendor-coi', label: 'Certificates of insurance on file for all vendors', due: 'Completed Aug 30', open: false }
  ],

  documents: [
    { name: 'Signed venue contract', meta: 'PDF · Signed Feb 14, 2026', state: 'Signed', tone: 'ok' },
    { name: 'Certificate of insurance', meta: 'PDF · Received Aug 30, 2026', state: 'On file', tone: 'ok' },
    { name: 'Final floor plan v3', meta: 'PDF · Approved Aug 28, 2026', state: 'Approved', tone: 'ok' },
    { name: 'Catering menu selections', meta: 'PDF · Updated Sep 11, 2026', state: 'Final', tone: 'ok' },
    { name: 'Day-of timeline v2', meta: 'DOC · Updated Sep 9, 2026', state: 'Awaiting sign-off', tone: 'attention' }
  ],

  messages: [
    {
      id: 'decor-time',
      from: 'Emily Johnson',
      initials: 'EJ',
      subject: 'Decorating time on the morning of the wedding',
      preview: 'We were wondering if we could move our decorating time from 10:00 AM to 9:00 AM…',
      when: '2 hours ago',
      needsReply: true
    },
    {
      from: 'Marla Perez · Harvest Table',
      initials: 'MP',
      subject: 'Reminder: final guest count due Monday',
      preview: 'Just a friendly nudge — we need the confirmed number by Monday to place the order.',
      when: 'Yesterday, 11:05 AM'
    },
    {
      from: 'Rachel Adeyemi · Lark & Ivy',
      initials: 'RA',
      subject: 'Rehearsal timing for Friday',
      preview: 'Confirming the rehearsal for 5:00 PM on the 18th — does that still work on your end?',
      when: 'Wed, Sep 9'
    },
    {
      from: 'Emily Johnson',
      initials: 'EJ',
      subject: 'Floor plan looks perfect!',
      preview: 'Thank you for turning this around so fast. Approved from us!',
      when: 'Fri, Aug 28'
    }
  ]
}

// ---------------------------------------------------------------------------
// Screen 3 — the message thread, the event context panel and the AI draft.
// ---------------------------------------------------------------------------

export const thread = {
  subject: 'Decorating time on the morning of the wedding',
  linkedEvent: 'Johnson Wedding · Sat, Sep 19, 2026',
  from: 'Emily Johnson',
  fromEmail: 'emily.johnson@email.com',
  initials: 'EJ',
  when: 'Today, 8:42 AM',
  body: [
    'Hi!',
    "We're finalizing our plans and were wondering if we could move our decorating time from 10:00 AM to 9:00 AM on the morning of the wedding. Would that be possible?",
    'Thanks!',
    'Emily'
  ]
}

// Context the manager would otherwise have to look up in other systems.
export const threadContext = [
  { label: 'Event', value: 'Johnson Wedding' },
  { label: 'Date', value: 'Sat, Sep 19, 2026 · 7 days out' },
  { label: 'Ceremony', value: '4:00 PM · Garden Terrace' },
  { label: 'Guests', value: '150 confirmed' },
  { label: 'Current decorating window', value: '10:00 AM – 12:00 PM' },
  { label: 'Earliest venue access', value: '8:00 AM (contract terms)' },
  { label: 'Sep 18 (night before)', value: 'No event booked · rehearsal 5:00 PM' },
  { label: 'Grounds crew on site', value: '7:30 AM on Sep 19' },
  { label: 'Next vendor load-in', value: 'Bloom & Bough, 12:00 PM' }
]

// What the assistant looked at to write the draft.
export const aiBasis = [
  'Sep 19 day-of timeline',
  'Venue access terms in the signed contract',
  'Booking calendar for Sep 18–19',
  'Grounds crew schedule',
  'Open task: final guest count'
]

export const aiDraft = `Hi Emily,

Thanks for reaching out — we're looking forward to the 19th!

A 9:00 AM start for decorating works on our end. There is no event on the property the night before, and our grounds crew is on site from 7:30 AM, so the Garden Terrace and Stone Hall will both be open and ready for you at 9:00.

Two notes so your team can plan around it:

- Your updated access window is 9:00 AM to 12:00 PM. Bloom & Bough begin their floral load-in at 12:00 PM, so we ask that personal decor be placed before then.
- Anyone helping should check in at the Stone Hall service entrance.

I'll update the day-of timeline and let Rachel and the vendor team know about the change.

One last thing while I have you: Harvest Table needs your final guest count by Monday, September 14. Just reply with the number and I'll pass it along.

Warmly,
Dana Whitcomb
Venue Manager, Willow & Stone Events
(612) 555-0110`
