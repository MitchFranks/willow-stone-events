# Vue (lowfi) — Data Dictionary

The prototype's data model, in the words the screens use. There is no database. Everything is
either **seed data** (static JS in `lib/mock/`) or **runtime state** (one React context in
`lib/store.jsx`, persisted to `localStorage` under `vue-lowfi-prototype-v3`). Anything the UI
calls an "open position", "Up Next item" or "coverage" is **derived** — never stored.

Items marked ⚠️ are the most ambiguous; they are explained in [Ambiguities](#ambiguities).

**Terminology.** Vue is wedding-focused and there is no single agreed wedding glossary. The names
below follow common wedding-venue and catering usage (timeline / run of show, guarantee, venue
coordinator, banquet staff roles). Where usage varies by venue, the row says so — see
[Terminology notes](#6-terminology-notes-and-sources) for sources and confidence. Several names are
working choices to be confirmed against a real venue contract and BEO.

---

## 1. How it fits together

```
Couple ──1:N── Event ──1:N── Timeline block ──1:N── Staffing requirement (role + count)
                 │                │
                 │                └──1:N── Assignment ──N:1── Staff
                 │                          (staff-facing UI: "shift")
                 ├──1:N── Task
                 ├──1:N── Message     (Message.coupleId → Couple, optional)
                 ├──1:N── Document
                 ├──1:N── Activity log entry
                 ├──1:1── Payment plan (keyed by event id)
                 ├──1:1── Run of show   (keyed by event id)
                 └──N:M── Vendor       (Vendor.eventIds[])

DERIVED:  Assignment + Staffing requirement  ──►  Open position  ──┐
          Task, Message, Document ─────────────────────────────────┴─►  Attention item
```

Every cross-reference is a string id (`eventId`, `coupleId`, `staffId`, `blockId`).
Times are **decimal 24-hour numbers** (`9.5` = 9:30 AM), days are `Mon…Sun`, and most display
dates are **pre-formatted strings**, not date values.

---

## 2. Seed entities

### Event &nbsp; `lib/mock/events.js` · screens: *Events*, *Calendar*, event workspace

| Field | Type | Meaning / example |
|---|---|---|
| `id` | string | URL key. `johnson`, `taylor`, `acme`, `martinez`, `chen` |
| `name` | string | Display name. "Johnson Wedding" |
| `type` | enum | One of `EVENT_TYPES`: Wedding, Rehearsal Dinner, Engagement Party, Bridal Shower, Welcome Party, Farewell Brunch. Ceremony and reception are **timeline blocks**, not event types |
| `couple` | string | Display text, e.g. "Emily & Marcus Johnson" |
| `coupleId` | string → Couple | The real link |
| `dateKey` | `YYYY-MM-DD` | The only true date. Used for clash detection and days-out |
| `date`, `dateShort`, `day` | string | "Saturday, October 10, 2026" / "Sat, Oct 10" / "Sat". Hand-typed duplicates of `dateKey` ⚠️ |
| `expectedGuests` | number | Planning headcount. Can still change |
| `guaranteedCount` | number \| null | The **guarantee**: the final count the venue/caterer bills for. `null` until submitted ⚠️ |
| `spaces` | string | Free text, e.g. "Garden Terrace · Stone Hall" |
| `bookingStatus` | enum | One of `BOOKING_STATUSES`: Inquiry, Tentative hold, Booked, Completed. Names vary by venue |
| *(days out)* | derived | `daysOutLabel(event)` — "2 days out", computed from `dateKey` against the frozen `TODAY_KEY` |
| `headline` | string | One-line summary shown on cards: "4:00 PM ceremony" |
| `primary` | boolean? | Only `johnson` has it. Marks the scenario event; makes its open positions `urgent` instead of `warn` |
| `blocks` | Timeline block[] | See below |

### Timeline block &nbsp; (nested in Event) · screens: *Weekly Schedule*, *Staffing Planner*, event *Staffing* tab

A staffed block of an event's day. The unit of scheduling. Wedding venues and coordinators talk
about the **timeline** or **run of show**; the blocks are the staffed parts of it.

| Field | Type | Meaning / example |
|---|---|---|
| `id` | string | `johnson-ceremony` (ids keep their original spelling) |
| `name` | string | "Setup", "Ceremony", "Reception", "Dinner", "Teardown". Free text, not an enum ⚠️ |
| `kind` | enum | One of `BLOCK_KINDS`: `setup` (load-in), `guest-facing`, `teardown` (strike). Setup and teardown are internal **operations** phases, not guest moments |
| `start`, `end` | number | Decimal hours. `15` → `17` is 3:00–5:00 PM |
| `requirements` | Staffing requirement[] | What the block requires |
| `note` | string | Planner's note |

### Staffing requirement &nbsp; (nested in Timeline block)

| Field | Type | Meaning |
|---|---|---|
| `role` | enum | One of `ROLES` |
| `count` | number | How many people of that role the block requires |

### Staff &nbsp; `lib/mock/staff.js` · screens: *Staff Directory*, staff profile, *Availability*

12 people.

| Field | Type | Meaning / example |
|---|---|---|
| `id` | string | `dana`, `jake`, `marisol` … |
| `name`, `initials` | string | "Jake Pearson" / "JP" |
| `role` | enum | One of `ROLES`: Venue Manager, Event Captain, Event Staff, Bartender, Server, Grounds. **One role per person** ⚠️ |
| `phone`, `email` | string | Contact |
| `preferredHours` | string | Free text: "20–30/week". Not used in any logic |
| `note` | string | Scheduler's note, e.g. "Declined the Johnson ceremony shift — has a class until 4:00 PM" |
| `availability` | `{ Mon…Sun: Window[] }` | Weekly recurring windows. `Window = { start, end }` in decimal hours. Empty array = unavailable that day |

Availability is **weekly and recurring only** — there are no date-specific exceptions or time off.
A person is "available" for a block only if one window **fully covers** it (`isAvailable`).

### Couple &nbsp; `lib/mock/records.js` · screens: *Couples*, couple profile

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `johnson-emily` (primary contact, not the couple) |
| `name` | string | "Emily & Marcus Johnson" — the billing party |
| `primaryContact` | string | The person you actually write to: "Emily Johnson" |
| `email`, `phone`, `initials` | string | Contact |
| `eventIds` | string[] | Events booked (all currently length 1) |
| `since` | string | "Booked February 2026". Display text |
| `note` | string | Free text |

### Vendor &nbsp; · screens: *Vendors*, vendor profile, event *Vendors* tab

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `harvest-table` |
| `name`, `category` | string | "Harvest Table Catering" / "Caterer". Category values in use: Caterer, Florist, DJ/Band, Photographer, Bakery, Transportation. Still free text, not an enum ⚠️ |
| `contact`, `phone`, `email` | string | One contact person per vendor |
| `eventIds` | string[] | Events they work. The only many-to-many link in the model |
| `status` | string | "Guarantee due", "Confirmed", "Awaiting confirmation". Free text |
| `statusTone` | tone | Colour of the status pill ⚠️ |
| `note` | string | Free text |

### Task &nbsp; · screens: event *Tasks* tab

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `t-guest-count` |
| `eventId` | string → Event | |
| `title`, `detail` | string | "Submit the guarantee to Harvest Table Catering" |
| `due` | string | Display text: "Due today", "Due Sun, Oct 11", "Completed Sep 12" ⚠️ |
| `dueTone` | tone | `urgent`, `warn`, `info`, `done`. **Also decides whether the task appears in Up Next** ⚠️ |
| `owner` | string | Person's name as text (not an id) |
| `done` | boolean | Seed value only. Live value = `doneTaskIds` in state |

### Message &nbsp; · screens: *Messages*, message detail, event *Messages* tab

An inbound email. The sender may be a couple, a vendor or a staff member.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `m-decor-time` |
| `eventId` | string → Event | |
| `coupleId` | string → Couple \| null | Set only when the sender is a couple |
| `from`, `fromRole`, `initials` | string | Sender as text: "Marla Perez · Harvest Table" / "Vendor · Catering" |
| `subject`, `received` | string | `received` is display text: "Today, 8:42 AM" ⚠️ |
| `body` | string[] | One entry per paragraph |
| `needsReply` | boolean | Does this email require an answer? Seed value |
| `priority` | tone | `urgent`, `warn`, `info`, `done` |
| `context` | `{label, value}[]` | The facts panel next to the email: "Earliest venue access — 8:00 AM (contract)" |
| `suggestedReply` | string | The AI draft shown as "Suggested reply" |

### Document &nbsp; · screens: event *Documents* tab

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `d5` |
| `eventId` | string → Event | |
| `name`, `kind` | string | "Day-of timeline v2" / `PDF` \| `DOC` \| `XLS` |
| `updated` | string | Display date |
| `status` | string | "Signed", "On file", "Approved", "Final", "Awaiting signature", "Awaiting couple" |
| `tone` | tone | `done`, `warn`, `urgent`. **`urgent` = appears in Up Next** ⚠️ |

### Payment plan &nbsp; · screens: event *Payments* tab

An **object keyed by event id**, not an array. Shown as the **contract total** with a schedule of
deposit, installments and final balance.

| Field | Type | Meaning |
|---|---|---|
| `total`, `paid` | number (USD) | Contract value / amount received. `paid` is stored, not summed from the schedule |
| `schedule[]` | Installment[] | `{ id, label, amount, when, state }` — labels: Booking deposit / Deposit, Second/Third installment, Final balance |
| `schedule[].state` | enum | `paid`, `due`, `scheduled`. `when` is display text: "Due Oct 11, 2026" |

### Run of show &nbsp; `timelines` · screens: event *Timeline* tab

Object keyed by event id → array of `{ id, time, title, note, tone? }`. `time` is display text
("3:00 PM"). The run of show is a separate hand-written list from the timeline blocks, even though
they describe the same day (see open question 1 below).

### Activity log entry &nbsp; `activityLog` · screens: event *Activity Log* tab

`{ id, eventId, when, who, what, tone }` — a log line like "Jake Pearson · Declined the Ceremony
assignment (3:00–5:00 PM)". Static: nothing writes new entries when you act in the prototype.

### Venue &nbsp; (single object)

`name`, `manager` ("Dana Whitcomb", the signed-in user), `managerRole`, `managerInitials`,
`today` ("Saturday, October 10, 2026"), `todayShort`. `today` is **hard-coded** (and mirrored by
`TODAY_KEY`); nothing reads the real clock.

---

## 3. Runtime state

The one thing the user can change. Lives in `StoreProvider`; seeded from the files above.

| State field | Shape | Used for |
|---|---|---|
| `assignments` | `{ [assignmentId]: Assignment }` | Who is on which timeline block, and whether they said yes. See below |
| `doneTaskIds` | string[] | Tasks ticked off. Starts with every task whose seed `done` is true |
| `repliedMessageIds` | string[] | Messages the manager has answered |
| `readMessageIds` | string[] | Messages opened (replying also marks read) |
| `signedDocumentIds` | string[] | Documents the manager has signed — flips status to "Signed" |
| `publishedEventIds` | string[] | Events whose schedule is "Published". Starts as `johnson`, `taylor` |
| `dismissedAttentionIds` | string[] | Attention items hidden by the user |
| `offers` | `{ [positionId]: { staffIds } }` | Open positions offered to several eligible people. Nothing is assigned until one claims it (Staff replies → Simulate claim) |
| `seenIntro` | boolean | Has the early-stage prototype modal been shown |

### Assignment ⚠️

The stored link between one staff member and one timeline block, in a role. Manager-facing screens
say **assignment**; wording aimed at staff ("accept or decline their shift") still says **shift**,
because that is how workers talk about it. The data model uses one name only: `Assignment`.

| Field | Type | Meaning |
|---|---|---|
| `id` / `assignmentId` | string | `${blockId}--${staffId}`, e.g. `johnson-ceremony--jake` |
| `blockId` | string → Timeline block | |
| `staffId` | string → Staff | |
| `role` | enum | The role they are filling. Seed data always matches `Staff.role`, but nothing enforces it |
| `status` | enum | `draft` (shown "Not sent": assigned but not published), `pending`, `accepted`, `declined` |
| `overridden`, `warning` | boolean?, string? | Set when the manager assigned despite a soft warning (outside availability, double-booked, declined before, other role). Kept so the warning stays visible |
| `declineReason` | string? | Present only when declined: "Class until 4:00 PM…" |

**Counting rule:** only `accepted` assignments count toward a staffing requirement. `draft` and `pending` do
**not** — an unsent or unanswered assignment is not confirmed. `declined` records are kept (so the UI can say who
declined) but ignored for staffing and clash checks.

---

## 4. Derived objects (never stored)

### Open position &nbsp; "Open Positions" screen, red badge in the sidebar ⚠️

One per **(timeline block, role)** where accepted assignments < `Staffing requirement.count`.

| Field | Meaning |
|---|---|
| `id` | `${blockId}--${role-slug}`, e.g. `johnson-ceremony--event-staff` |
| `event`, `block`, `role` | What is short |
| `required` / `accepted` / `pending` | Counts for that role in that block |
| `short` | `required − accepted` |
| `declinedBy` | Staff who declined that role in that block |
| `urgency` | `urgent` if the event is `primary`, otherwise `warn` |

### Replacement candidate &nbsp; "Fill position" screen

Computed per open position: every Staff with the matching role who is not already on the block.

| Field | Meaning |
|---|---|
| `available` | Weekly availability fully covers the block hours |
| `clash` | Another non-declined assignment that same `dateKey` with overlapping hours (or null) |
| `eligible` | `available && !clash`. Eligible people sort first |

### Event staffing status &nbsp; "Fully staffed" / "Short N staff" badges

`{ required, filled, pending, short, complete }` summed across all of an event's blocks
(`coverageForEvent`). `filled` never counts more than the requirement's `count` per role, so
over-assigning doesn't hide an open position elsewhere.

### Up Next item &nbsp; "Up Next" list, `/up-next` (internal name: `attention`)

Built fresh on every state change from four sources, then sorted `urgent → warn → pending → info`.

| Field | Meaning |
|---|---|
| `id` | Prefixed by source: `openPosition:…`, `msg:…`, `task:…`, `doc:…` |
| `kind` | `staffing` \| `message` \| `task` \| `document` |
| `tone` | `urgent` (shown as **Do first**) or `warn` (shown as **Coming up**) |
| `title`, `what`, `why`, `meta` | The three lines of copy on each card: what happened / why it matters / short tag |
| `eventId`, `eventName` | Which event |
| `actionLabel`, `href` | Button text and target, e.g. "Find replacement" → `/staffing/open-positions/<positionId>` |

| Source | Raises an item when |
|---|---|
| Open position | Any open position exists |
| Message | `needsReply` is true **and** not replied |
| Task | Not done **and** `dueTone` is `urgent` or `warn` (`info` and `done` never do) |
| Document | `tone === 'urgent'` and not signed |

---

## 5. Vocabulary

### Enumerations

| Name | Values |
|---|---|
| `ROLES` | Venue Manager · Event Captain · Event Staff · Bartender · Server · Grounds |
| `DAYS` | Mon · Tue · Wed · Thu · Fri · Sat · Sun |
| `EVENT_TYPES` | Wedding · Rehearsal Dinner · Engagement Party · Bridal Shower · Welcome Party · Farewell Brunch |
| `BOOKING_STATUSES` | Inquiry · Tentative hold · Booked · Completed |
| `BLOCK_KINDS` | setup · guest-facing · teardown |
| Assignment `status` | accepted · pending · declined (shown as Accepted / Pending / Declined) |
| Payment `state` | paid · due · scheduled |
| Attention `kind` | staffing · message · task · document |
| Tone | `urgent` (act now) · `warn` (due soon) · `info` (FYI) · `done` (settled) · plus `pending` / `declined` for assignment badges ⚠️ |

### Where screen wording comes from

| Sidebar / screen phrase | Data behind it |
|---|---|
| Staff Planner (one sidebar item, four tabs: Week · Event board · Team availability · Staff replies) | The staffing feature, `/staffing/*`. The Event board (`/staffing/<eventId>`) is the primary screen: one row per timeline block, slots per required role, an assign panel with soft warnings, and a Publish and notify dialog |
| Up Next | Attention items (derived) |
| Events | `events` |
| Week tab | Events in one week with staffing and unsent-change badges |
| Event board tab | Timeline blocks + Staffing requirements + Assignments, with the assign panel |
| Team availability tab | `staff.availability` plus the week's assignments |
| Staff replies tab | Declined and pending assignments, and open `offers` |
| Staff Directory | `staff` |
| Messages · Couples · Vendors | `messages`, `couples`, `vendors` |
| Event tabs: Timeline · Staffing · … · Activity Log | `timelines` (shown as "Run of show"), blocks, `activityLog` |
| "Fully staffed" / "Short N staff" | Event staffing status (derived) |
| "Find replacement" / "Fill position" | Replacement candidates for one open position |
| Staffing request | The "Send request to everyone with this role" flow — keyed by open-position id, **not a stored record** ⚠️ |
| "Suggested reply" | `Message.suggestedReply` |
| New event form | Collects type, name, couple, date, expected guests, then only shows a toast — **nothing is saved** |

---

## 6. Terminology notes and sources

How each name was chosen. **Confidence:** High = read directly; Medium = consistent across several
summaries; Low = single/vague source or varies by venue. Not all sources could be read in full: The
Knot returned HTTP 403 and was **not read**; NACE's public site has no glossary; wedding-contract and
banquet-captain sources were search summaries only. APEX/EIC is a meetings-industry standard and was
used only as a secondary reference. Treat every row as a working choice until checked against a real
venue contract and BEO.

| Vue term | Replaced | Why | Confidence |
|---|---|---|---|
| Timeline block | Segment | Coordinators say *timeline* / *run of show*; "function" is a hotel/catering word and unsettled for weddings | Medium that "timeline" is used; Low on the block name |
| Run of show | Day-of timeline (card title) | Offbeat Wed uses timeline and run of show interchangeably | High |
| Setup / Teardown with `kind` | Setup / Cleanup | Load-in and strike are operations phases, not guest moments | Medium |
| Event types without Ceremony / Reception | Ceremony, Reception types | These are parts of a wedding, not separate events. Rehearsal dinner is a standard separate event | Medium |
| `expectedGuests` + `guaranteedCount` | `guests` | Venue contracts have a guarantee date after which the count is billed regardless | Medium (lead time varies by venue) |
| Submit the guarantee | Send final guest count | Matches the contract term | Medium |
| `bookingStatus` + derived days out | Hand-typed `status` | Hold/booked names vary by venue | Low |
| Venue Manager, Event Captain | Manager | Distinguishes venue staff leadership (venue coordinator vs day-of coordinator hired by the couple); the captain leads service | High on the coordinator definitions, Medium on captain |
| Vendor categories (Caterer, Florist, Photographer, DJ/Band, Bakery, Transportation) | Free-text categories | Common wedding vendor set | Medium |
| Open position | Coverage gap | "Coverage" is scheduling jargon; not wedding-specific | Low |
| Staffing requirement | Need | "Need" is vague | Low |
| Assignment (data), "shift" (staff-facing copy only) | Shift / assignment used interchangeably | Neither is wedding-specific; "shift" is how workers say it, "assignment" is the database word | Low |
| Couple | Client | The booking party on a wedding is two partners, often plus a separate payer. Used on every event, so for birthdays and corporate events it means the host | Medium |
| Activity log | History | Software term, clearer than "change history" | n/a |
| Primary contact | `primary` on Client (now Couple) | The person you write to, distinct from the billing party | Low |

### Terms not yet in the model

Worth adding when the data supports them: **vendor meals** (counted in catering headcount),
**rehearsal**, **cocktail hour** as its own block, **day-of coordinator** / **wedding planner** as
external parties, **BEO** (banquet event order), **ceremony site / reception space** per event,
**load-in / load-out** for vendors, **certificate of insurance**, **rider**, **F&B minimum** and
**attrition**, **hold**, and staff **time off / availability exceptions**.

### Open questions

1. Is a block like "Cocktail Hour" a timeline block that needs staff, or only a run-of-show entry?
   That decides whether blocks and the run of show can be merged into one schedule. Today they are
   still separate lists.
2. Does the venue employ a **venue coordinator**, or do couples bring a day-of coordinator? Either
   changes who "Venue Manager" is. No staff member currently holds a Venue Coordinator role.
3. Collect one real contract and BEO from a pilot venue to settle "guarantee", "timeline" and staff
   roles; check The Knot's glossary manually.
4. "Couple" is the name for the booking party on every event, including birthdays and corporate events, where it really means the host. Revisit if non-wedding events become common.

---

## Ambiguities

1. **Assignment, shift, request and open position are four words for overlapping things.**
   - The *Assignment* is the stored record (a person on a timeline block). Staff-facing copy calls it a **shift**; the route is `/staffing/assignments/[assignmentId]`.
   - An **open position** is a derived shortfall, not a record.
   - A **staffing request** (`/staffing/requests/[reqId]`) is a screen, not a record. Its `reqId` is actually an *open-position id*, and sending it stores nothing.
   - Net effect: there is no persisted "request to fill a position" — nothing remembers who was asked. If you want one, it needs to become a real entity.

2. **"Tone" is both colour and logic.** The same vocabulary (`urgent / warn / info / done`) appears on Task (`dueTone`), Message (`priority`), Document (`tone`), Vendor (`statusTone`), Activity log and Run of show. In Task and Document it also *decides whether an Up Next item exists* — a document needs `tone: 'urgent'` and a task needs `urgent`/`warn`, while the text `status` ("Awaiting couple") is ignored. Restyling a pill would silently change what shows up on the dashboard. `pending` is in the sort order but nothing produces it.

3. **Dates and "how soon" are mostly typed text, not values.** `Event.dateKey` is a real date and "days out" is now computed from it, but `date`, `dateShort`, `day`, `Task.due`, `Message.received`, payment `when` and `venue.today` are hand-written strings, and "today" is frozen at Oct 10, 2026. Nothing recomputes overdue or urgency; only the staffing-clash check and days-out use an actual date.

4. **The same real-world fact is stored in several places.** The Johnson guest count lives in `Event.expectedGuests`, in the guarantee task, in the catering message ("Last number I have is 150"), in the vendor status "Guarantee due" and in a run-of-show note. `guaranteedCount` is `null` until the guarantee is submitted, and nothing sets it. The $4,250 balance is in a Task, a payment installment and the Activity log. Only the Task, Message and Document records are wired into Up Next, so resolving the *thing* (e.g. paying the balance) does not clear the *task* — ticking the task is what clears it.

5. **A person can have only one role, and role means two things.** `Staff.role` is a single value and a requirement's `role` is matched to it exactly. Nobody can be a Server *and* a Bartender, and the model can't say "Theo can run receptions, Dana can't". Venue Manager (Dana) and Event Captain (Theo) are now separate roles, but a block's `name` is still loose free text (the Shah–Patel rehearsal dinner's block is named "Dinner", the others "Reception").
