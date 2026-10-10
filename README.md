# Vue — Venue Operations

**A low-fidelity, fully clickable prototype of an operations platform for small-to-medium event venues.**

> ⚠️ **This is an early-stage, low-fidelity prototype.** The information and actions shown are
> simulated and are being tested for usability. No backend, no accounts, no real messages.

---

## Product Summary

Vue is an operations platform for wedding venues. It covers the wedding itself and the events around
it — rehearsal dinners, engagement parties, showers, welcome parties and farewell brunches. It is aimed at the person who actually runs the
day: a venue manager or coordinator juggling several upcoming events, their staff, vendors,
deadlines, payments and the last-minute changes that affect all of them at once.

It is not a CRM, an accounting package or a marketing tool. It does one thing: it tells the manager
what needs their attention right now, and gives them the means to deal with it.

---

## Root User Outcome

**Control and confidence.**

The manager needs to know what requires action, and to trust that nothing important is quietly
going wrong somewhere they are not looking. Every design decision in this prototype is subordinate
to that: the system goes looking for problems so the manager does not have to.

---

## Discovery Research Findings

- Event information is scattered across email, calendars, documents, spreadsheets, checklists and
  conversations.
- Last-minute changes are common, and one change cascades — a time change affects staffing,
  vendors, the timeline and the couple.
- Staff scheduling and availability are the hardest thing to coordinate.
- Small venues value simplicity and flexibility; they will abandon a system that becomes another
  thing to maintain.
- Managers do not need *more* information. They need to know **what matters right now**.
- Staff themselves only need their own schedule and the details relevant to them.
- Different parts of an event need different people — setup, ceremony, reception and cleanup are
  effectively four different staffing problems inside one booking.

---

## Core Design Features

### 1. Up Next

The system proactively surfaces anything that requires action rather than making the manager hunt
for it: open staff spots, people still to text, unanswered couple messages, tasks due, documents
awaiting signature and payments due.

An Up Next item does not just say something is wrong. Every item states:

| | |
|---|---|
| **What happened** | "1 of 2 Event Staff confirmed." |
| **Which event** | Johnson Wedding · Ceremony · 3:00 PM–5:00 PM |
| **Why it matters** | "2 days out. Until it is filled, this block runs short-staffed." |
| **What you can do** | One button that goes straight to the fix: "Fill spot" |

**Nothing in this list is hard-coded.** Items are *derived* from the live state of the Staffing
Planner, tasks, messages, documents and payments (`lib/store.jsx`). Resolve the underlying thing and
the item disappears on its own. Staffing items can't be hidden, because hiding them would look like
fixing them; other items can be hidden, with Undo, and brought back from Up Next or Settings.

### 2. Staffing Planner

The manager sees each event by timeline block (Setup, Ceremony, Reception, Teardown) and role, asks
people by text, and tracks who said yes. Asking is "smart" in a modest, explainable way: the Ask
panel lists who is a good fit, who has a heads-up (outside their usual hours, another shift that
day) and who can't be asked, with the reason shown. The manager is never blocked, just informed.

### The loop that connects them

```
open spot on the Johnson Wedding
   → appears in Up Next ("Ceremony: 1 open spot for Event Staff")
   → "Fill spot" opens the Ask panel for that role and block
   → manager asks someone and sends the text
   → Up Next now says "waiting on 1 reply" (asked is not covered)
   → the staff member says yes (simulated in the prototype)
   → the spot fills, the Up Next item resolves, every count updates
   → when every spot is filled: "The Johnson Wedding is fully staffed."
```

This chain is implemented, not mocked per-screen. It was verified in a headless browser: following
each "Fill spot" item, asking, sending and simulating a yes clears all five Johnson Wedding
staffing items, shows the fully-staffed message, and updates the dashboard and sidebar counts.

---

## Why These Features Are Prioritized

Discovery ranked these two highest, and they are causally linked rather than merely adjacent.
Scheduling is where last-minute change does the most damage: a single "can't make it" two days
before a wedding affects the timeline block, the event and the manager's confidence in the whole
booking. An Up Next list with nothing feeding it is just a to-do list; staffing without a feedback
loop is just a rota. Together they produce the actual outcome: the manager finds out about the
problem without looking for it, and can fix it from wherever they happen to be.

Everything else in the prototype (vendors, payments, documents, change history) is supporting
context that exists so Up Next items have somewhere real to point.

---

## Low-Fidelity Prototype Notice

This prototype is deliberately early-stage. It uses cool neutrals, one accent colour and three
status colours that always come with an icon and a word, and **no photography**: wherever a photo
will go (the welcome screen's hero, closing section and "Who it's for" cards) there is a labelled
placeholder stub (a box with a cross and a note saying what the photo should show).

Users are told this in four places:

- A blocking modal on first load of any screen (`components/onboarding/IntroModal.jsx`) that says,
  in plain English, that this is an early, low-fidelity prototype with made-up data, and gives the
  tester their goal.
- An **"Early prototype"** pill and a **"Your goal"** button at the top of every screen, including
  the welcome screen (`components/onboarding/PrototypeNotice.jsx`). The button reopens the modal.
- A note in the sidebar: *"Simulated data. Nothing here is saved to a real system."*
- Anything that only exists to make the prototype testable is labelled as such: "Staff phone
  (prototype)", "Prototype only: answer for staff", "Design library (for reviewers)".

There are no tours or coach popovers. The modal can be closed with either button, the close button
or Esc, and the app is then fully free-form.

## Prototype Goal

Testers are given this goal in the opening modal:

> **You are Dana, the venue manager. The Johnson Wedding is this Saturday and it is short on staff.
> Find out what needs attention and make sure the wedding is fully staffed.**

The modal does **not** say which buttons to press. There are several routes to the fix:

- Welcome screen → **Open Up Next** → "Fill spot" on any Johnson Wedding item
- Dashboard → the Up Next list, the "Open spots" counter, or the Staffing status list
- Sidebar → **Staffing Planner** → Johnson Wedding
- Events → Johnson Wedding → the **Staffing planner** tab or the "5 open spots" badge
- Staff Directory → a person → record their reply on a waiting request

Because staff can't log in, the tester answers for them: every waiting person has a dashed
**"Prototype only: answer for …"** box with *Simulate: says yes* / *Simulate: can't make it*, and
there is a full **Staff phone (prototype)** view.

The seeded scenario (two events, set in `lib/mock/scope.js`; "today" is Thursday 17 September 2026):

- **Johnson Wedding** — Saturday 19 September 2026, 150 guests, 4:00 PM ceremony, **5 open spots**
  across Setup, Ceremony, Reception and Teardown
- An unanswered couple request to move decorating to 9:00 AM
- A catering guest-count guarantee due today (entered on the Tasks tab)
- A day-of timeline awaiting your signature
- A final balance of $4,250 due tomorrow
- **Shah–Patel Rehearsal Dinner** — Thursday 24 September, a second, less urgent event, so Up Next
  has something to prioritise against

---

## Screen Map

Every route has a job; none are filler.

### Entry and overview
| Route | Screen |
|---|---|
| `/` | Welcome (entry): what Vue does, one way in ("Open Up Next") |
| `/up-next` | Up Next (filterable by kind and event, e.g. `/up-next?kind=task`) |
| `/dashboard` | Dashboard: Up Next first, then counts, events, staffing status, recent activity |
| `/calendar` | Calendar, month by month |
| `/events` | Events |

### Event workspace
| Route | Screen |
|---|---|
| `/events/[id]` | Event Up Next |
| `/events/[id]/timeline` | Run of show (day view editor) |
| `/events/[id]/tasks` | Tasks, including the guest-count guarantee |
| `/events/[id]/vendors` | Vendors |
| `/events/[id]/payments` | Payments (record a payment) |
| `/events/[id]/messages` | Messages |
| `/events/[id]/documents` | Documents (sign) |
| `/events/[id]/activity` | Activity log |
| `/events/new` | Create event |

### Staffing
| Route | Screen |
|---|---|
| `/staffing` | Staffing Planner: events |
| `/staffing/[eventId]` | Staffing Planner: one event's spots and people (deep-linkable to a block and role) |
| `/staffing/team` | Team: availability and away dates, for planning |
| `/staffing/phone` | Staff phone (prototype simulator) |
| `/staff` | Staff directory: people and contact details |
| `/staff/[id]` | Staff member: their requests and replies |

### Communication and people
| Route | Screen |
|---|---|
| `/messages`, `/messages/[id]` | Inbox and reply |
| `/couples`, `/couples/[id]` | Couples |
| `/vendors`, `/vendors/[id]` | Vendors |

### Account
| Route | Screen |
|---|---|
| `/account` | Account (read-only) |
| `/settings` | Settings: show my goal, show hidden Up Next items, reset |
| `/style-guide` | Design library (for reviewers) |

Dynamic routes are statically generated for every seeded record, so any of them can be deep-linked.

---

## Usability Principles Implemented

**Capability first on entry.** The welcome screen's headline is the product promise ("Know what
needs fixing before the wedding."), followed by one primary action worded the same in the header,
hero and closing section. The other areas are listed underneath as one consistent set of links.
Inside the app, the dashboard opens on Up Next before any counter.

**Guide attention.** Up Next is split into **Do first** and **Coming up**. Only the first item on a
screen has the filled button, so one action leads. Counters stay neutral unless they describe work.

**Gestalt: proximity and common region.** The four facts a manager is constantly asked for (date,
schedule, guests, spaces) sit in one strip under the event name on every event tab. Every group of
related content sits inside one bordered `Card`; the tab strip and its panel read as one object.

**Gestalt: similarity.** One component per job, used everywhere: every status is a `StatusBadge`,
every list row is a `ListRow`, every filter is a `FilterChip`, every overlay is a `Modal`.

**Signifiers.** Buttons are bordered or filled at rest, not only on hover. Clickable rows carry a
chevron. Tabs show an underline when active. A pressed filter is filled ink. Focus is a visible
2px outline.

**Conventions.** Left sidebar, top bar, breadcrumbs, tabs, a month calendar with previous/next, and
dialogs with Cancel on the left and the action on the right. Each navigation destination has its own
icon, and status icons (alert, clock, check) are never used as navigation icons.

**One vocabulary.** An unfilled role is always an "open spot" ("3 open spots"); a covered event is
"Fully staffed"; a staff request is Not sent, Waiting, Confirmed or Can't make it. "Up Next" is
always written the same way.

**Feedback.** Every meaningful action shows a toast, most with Undo: "Recorded the final balance of
$4,250.", "Sent a guarantee of 142 guests to catering.", "Day-of timeline v2 is signed." Finishing
the goal shows "The Johnson Wedding is fully staffed."

**Visibility of system status.** "1 of 4 spots filled", Waiting vs Confirmed, "waiting on 1 reply"
in Up Next, live counts in the sidebar, and the guarantee shown in the event header once it is sent.

**Error prevention and recovery.** Recording a payment, signing a document, recording a "can't make
it", resetting the run of show and resetting the prototype all ask first and say what will happen.
Hiding an Up Next item, removing someone from an event, simulated replies and run-of-show edits can
be undone. Forms show inline errors (red, with an icon) instead of silently fixing input.

**Recognition over recall.** The reply screen shows the event context beside the message. The Ask
panel shows each person's usual hours and conflicts before you ask them.

**Progressive disclosure.** The event workspace is tabs rather than one long page; the staffing
chart and change history are behind disclosures; warnings that don't block staffing are behind
"Show warnings".

**User control.** Every dialog has Cancel and closes on Escape or backdrop click. Every screen has
breadcrumbs. "Your goal" is always one click away. Reset is in Settings.

**Accessibility.** Semantic tables and lists, `<button>` for actions and `<a>` for navigation, labels
bound to every form control, `aria-invalid` on fields with errors, `aria-current` on active nav,
`aria-pressed` on filters, `role="status"` on toasts, focus trapped in dialogs and returned after.

---

## Up Next Design

"Up Next" signals priority without creating chronic stress. Priority is shown by order and wording,
not alarm:

- The list is split into **Do first** and **Coming up**. The sidebar count shows only what to do
  first ("2 to do first"), never a raw total.
- Copy is calm and specific: "Ceremony: 1 open spot for Event Staff", "Reply to Emily Johnson",
  "Day-of timeline v2 is ready for your signature".
- A spot that has been asked for but not answered moves to Coming up as "waiting on 1 reply", so
  the Do first list only holds things the manager can act on.
- When the list is empty the product says "All caught up".

The status tones are defined once, in `components/ui/primitives.jsx`:

| Tone | Meaning | Colour | Glyph |
|---|---|---|---|
| `urgent` | Do first / act today | `status-now` (vermilion) | alert |
| `warn` | Coming up this week | `status-soon` (ochre) | clock |
| `pending` | Waiting on a reply | neutral | clock |
| `done` | Confirmed / complete | `status-clear` (slate blue) | check |
| `declined` | Can't make it | `status-now` | x |
| `info` / `empty` | Informational / nothing yet | neutral | i / dash |

**Colour is never used alone.** `StatusBadge` always renders colour **plus** an icon **plus** a word.

---

## Event Types

Vue is built for weddings. `/events/new` offers six types (Wedding, Rehearsal Dinner, Engagement
Party, Bridal Shower, Welcome Party, Farewell Brunch) and changes its optional fields with the
selection. The underlying structure (timeline blocks, staffing, tasks, payments) is shared.

---

## Design Library / Component Reuse

Two files hold the visual system, and every screen is assembled from them. The full rules are in
[`docs/STYLE-GUIDE.md`](docs/STYLE-GUIDE.md), and a live version is at `/style-guide`.

**`components/ui/primitives.jsx`**
`Icon` · `Button` (4 variants × 3 sizes) · `StatusBadge` · `Card` · `PageHeader` · `Breadcrumbs` ·
`Tabs` · `Count` · `FilterChip` · `FilterGroup` · `EmptyState` · `Alert` · `ListRow` · `Field` ·
`Avatar` · `TextInput` / `Select` / `Textarea` (with hint and error states) · `SectionNote` ·
`MetricTile`

**`components/ui/domain.jsx`**
`UpNextItem` · `useHideWithUndo` · `EventCard` · `EventRow` · `TaskRow` · `Modal` (dialog and sheet) ·
`ToastHost` (with actions such as Undo) · `useConfirm` · `openSpots`

**Shell:** `components/AppShell.jsx` (sidebar, top bar, the one toast stack, the prototype phone) ·
`components/EventHeader.jsx` (event identity, facts strip, tabs) ·
`components/onboarding/IntroModal.jsx` · `components/onboarding/PrototypeNotice.jsx`

**Staffing components** (`components/staffing/`) are built on the same library: the Ask panel and
the staff phone are `Modal variant="sheet"`, statuses are `StatusBadge`, toasts go through the shared
`ToastHost`, and form fields are the shared inputs.

**Design tokens:** `app/globals.css` defines spacing, type, radius, neutrals, the single accent and
the status ramps as CSS custom properties consumed through Tailwind v4's `@theme`. Light and dark
follow the OS.

**State:** `lib/staffing/store.jsx` holds the Staffing Planner (requests, replies, undo);
`lib/store.jsx` holds tasks, messages, documents and payments and derives Up Next from both. Both
persist to `localStorage`.

---

## Team Responsibilities

Fill these in with real names. The codebase is split so these four areas can be worked on without
editing the same files.

- **[Team Member]** — Welcome / Dashboard / Up Next — `components/Landing.jsx`, `app/(app)/dashboard/`, `app/(app)/up-next/`, `app/(app)/calendar/`
- **[Team Member]** — Events — `app/(app)/events/`, `components/EventHeader.jsx`
- **[Team Member]** — Staffing — `app/(app)/staffing/`, `app/(app)/staff/`, `components/staffing/`, `lib/staffing/`
- **[Team Member]** — Communication & people — `app/(app)/messages/`, `app/(app)/couples/`, `app/(app)/vendors/`

Shared files to coordinate on before editing: `lib/store.jsx`, `lib/staffing/store.jsx`, `components/ui/*`, `app/globals.css`.

---

## Running Locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Production build:

```bash
npm run build     # static export into out/
npx serve out
```

**Resetting:** the prototype remembers your changes in `localStorage`. Use **Settings → Reset
everything** to restore the seeded scenario and see the intro again.

---

## Public Deployment

Deployed from `main` to GitHub Pages by `.github/workflows/deploy.yml`:

**<https://mitchfranks.github.io/vue/>**

---

## Known Prototype Limitations

- **No backend.** All state is React context plus `localStorage`, scoped to one browser.
- **Two sample events.** The data is trimmed to two events, two couples, two vendors and a small team
  (`lib/mock/scope.js`) so every tester sees the same scenario.
- **Creating an event does not persist.** `/events/new` validates and shows a review of what would be
  created, but the sample events are fixed. The screen says so.
- **Staff cannot log in.** The tester answers for staff with the clearly labelled "Simulate" buttons
  or the Staff phone (prototype).
- **No real messages.** Sending texts, replies and the catering guarantee change state and show
  confirmation, but nothing leaves the browser.
- **Recording a payment is a manual mark.** There is no payment processing.
