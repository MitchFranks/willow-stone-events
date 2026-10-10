// ---------------------------------------------------------------------------
// First-run guide: constants and pure helpers.
//
// Deliberately NOT a client module, so server files (the couple route's
// generateStaticParams) can import the constants as plain values.
//
//   guide   which step of the 2-step guide they are on, and the first couple
//           they typed in. Kept in its own key so it never collides with the
//           prototype store (lib/store.jsx).
// ---------------------------------------------------------------------------

export const GUIDE_KEY = 'vue-onboarding-v2'

/** The first couple has a fixed id so the static export can prebuild its page. */
export const FIRST_COUPLE_ID = 'cpl-2000'

// ---- couples ---------------------------------------------------------------

/** "Ava Martin & Leo Chen" -> "AL"; "Ava Martin" -> "AM". */
export function initialsFor(names) {
  const partners = names
    .split(/\s*(?:&|\+|\band\b|,)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (partners.length >= 2) return (partners[0][0] + partners[1][0]).toUpperCase()
  const words = (partners[0] || names).trim().split(/\s+/)
  return ((words[0]?.[0] || '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() || '?'
}

/** A minimal couple record, same shape as lib/mock/records.js `couples`. */
export function makeCouple(names) {
  const name = names.trim().replace(/\s+/g, ' ')
  const primaryContact = name.split(/\s*(?:&|\+|\band\b|,)\s*/i)[0] || name
  return {
    id: FIRST_COUPLE_ID,
    name,
    primaryContact,
    email: '',
    phone: '',
    initials: initialsFor(name),
    eventIds: [],
    since: 'Added today',
    note: 'Added during setup. Book their wedding when you are ready.',
    addedByGuide: true
  }
}

/** Staffing Planner guide: its saved flag and the event that brings it back. */
export const PLANNER_GUIDE_KEY = 'vue-planner-guide-v1'
export const PLANNER_REPLAY_EVENT = 'vue-planner-guide-replay'

/** Events guide: its saved flag and the event that brings it back. */
export const EVENTS_GUIDE_KEY = 'vue-events-guide-v1'
export const EVENTS_REPLAY_EVENT = 'vue-events-guide-replay'

/**
 * Step 2 of the welcome guide asks what the user wants to do first. The first
 * three are the likeliest; the rest sit behind "More options". The choice
 * picks the screen flow they are walked through next (FLOWS below).
 */
export const FIRST_CHOICES = [
  { id: 'couple', icon: 'users', title: 'Add my first couple', hint: 'Start with their names' },
  { id: 'staffing', icon: 'user', title: 'Staff an upcoming wedding', hint: 'Ask your team and fill gaps' },
  { id: 'calendar', icon: 'calendar', title: "See what's coming up", hint: 'Weddings by date' }
]

export const MORE_CHOICES = [
  { id: 'messages', icon: 'mail', title: 'Reply to a message', hint: 'Couples, vendors and staff' },
  { id: 'availability', icon: 'clock', title: "Check my team's availability", hint: 'Who is free, and when' },
  { id: 'vendors', icon: 'truck', title: 'Review my vendors', hint: 'Caterers, florists and more' },
  { id: 'new-event', icon: 'plus', title: 'Create a new event', hint: 'Set up a wedding from scratch' }
]

/**
 * A flow is a list of "click this next" steps. Each step points at one thing
 * (data-onboarding or data-guide attribute) and moves on when it is clicked;
 * the last click ends the guide.
 */
const nav = (id) => `[data-onboarding="${id}"]`
export const FLOWS = {
  couple: [
    {
      target: nav('up-next'),
      title: 'This is Up Next',
      body: 'The things that need you wait here, most useful first. Click it to add your first couple.'
    }
  ],
  staffing: [
    {
      target: nav('staffing'),
      title: 'Open the Staffing Planner',
      body: 'See which weddings need people, then ask your team. Click it to begin.'
    }
  ],
  calendar: [
    {
      target: nav('calendar'),
      title: "Here's your calendar",
      body: 'Every wedding, by date. Click it to take a look.'
    }
  ],
  messages: [
    {
      target: nav('messages'),
      title: 'Your messages',
      body: 'Couples, vendors and staff in one place. Click it to see what needs a reply.'
    }
  ],
  availability: [
    {
      target: nav('staff'),
      title: 'Open the Staff Directory',
      body: 'Everyone on your team is here. Click it, then check who is free.'
    },
    {
      target: '[data-guide="view-availability"]',
      title: "See who's free",
      body: "This shows each person's availability across the week. Click View availability."
    }
  ],
  vendors: [
    {
      target: nav('vendors'),
      title: 'Your vendors',
      body: 'Caterers, florists and more. Click it to review them.'
    }
  ],
  'new-event': [
    {
      target: nav('events'),
      title: 'Open Events',
      body: 'Every wedding lives here. Click it, then start a new one.'
    },
    {
      target: '[data-guide="new-event"]',
      title: 'Create an event',
      body: 'Click New event to set up a wedding from scratch.'
    }
  ]
}
