# Design principles applied

How the four required principles — **grouping**, **signifying**, **no interference**, and
**Gall's Law** — shaped this prototype, with the specific places each one shows up.

---

## 1. Grouping

*Related things are perceived as related when they are placed together, enclosed together, or
look alike.*

**Proximity.** On the event workspace, the four facts a venue manager is asked for constantly —
date, ceremony time, guest count, spaces — sit in one tight band directly under the event name,
not scattered through the page. Each vendor's name, role, contact and note sit on one line
rather than in separate columns.

**Common region.** Every card is a bordered, white region on a warm grey page, and each card
holds exactly one subject: payments, vendors, staff, documents, communication. The border does
the grouping work, so no headings need to shout.

**Similarity.** Items with the same job share one shape everywhere in the product. Every status
label is the same `Pill` component; every person is the same `Avatar`; every list of things is
the same `row`. When five things look identical, the one that does not belong is obvious.

**Where the page is grouped into bands:**

| Screen | Bands, top to bottom |
|--------|---------------------|
| Dashboard | Greeting → stats → **needs attention** → events (left) + today & activity (right) |
| Workspace | Identity → **needs attention** → running the day (left) + client/money/paper (right) |
| Communication | The message and the reply (left) + the context needed to answer (right) |

The left/right split on screens 2 and 3 is itself a grouping decision: operational information
on the left, commercial and human information on the right.

---

## 2. Signifying

*A signifier is the visible cue that tells the user an action is possible. Affordances are
useless if nobody can see them.*

- **Buttons look pressed when pressed.** Every `.btn` shifts down 1px on `:active` and changes
  background on `:hover`, so a click visibly registers (`styles.css`).
- **The one clickable event row announces itself.** The Johnson Wedding row is the only row in
  the upcoming-events list that renders as a `<button>`, and it is the only row that gets a
  chevron, a hover lift, a green ring and a cursor change. The chevron slides right on hover.
- **The draft field looks typeable.** The AI reply sits in a bordered, inset, resizable textarea
  with a focus ring — the standard signifier for "you can edit this" — plus the explicit line
  *"You are editing the draft. It sends only when you press Send reply."*
- **The way back is always visible.** A persistent breadcrumb bar, a `← All events` /
  `← Johnson Wedding workspace` back link on every subscreen, and a clickable product name in
  the top bar. There is never a dead end.
- **State is labelled, not implied.** `Draft · not sent`, `Awaiting your reply`, `Sent just now`,
  `Replied`, `Resolved` — the system says what it is doing in words, not only in colour.

---

## 3. No interference

*Signals compete. If everything is emphasised, nothing is.*

- **One meaning per colour, product-wide.** Red-clay = act now. Amber = due soon. Green =
  settled or on track. Warm neutral = ordinary information. No colour is ever used decoratively,
  and no colour carries a second meaning on a different screen.
- **Normal information is never tinted.** Of the four stat tiles on the dashboard, only
  *Needs attention* has a background. The timeline is neutral grey except for the single row
  awaiting a decision. This is what lets the attention signal win without being loud.
- **No false affordances.** The attention items belonging to events that were not built out
  (Nguyen–Park, Whitfield) render as *visibly disabled* buttons with an explanatory tooltip,
  and the unbuilt top-nav items are greyed out. A prototype that looks clickable everywhere and
  responds nowhere teaches the tester the wrong thing about the product.
- **One primary action per region.** Each screen has exactly one filled green button in view at
  a time: *Open message* on the dashboard, *Open message & reply* in the workspace, *Send reply*
  in the composer. Secondary and quiet button styles carry everything else.
- **A restrained type scale.** Three sizes and three weights across the whole product. Hierarchy
  comes from spacing and weight rather than from competing font sizes.

---

## 4. Gall's Law

> "A complex system that works is invariably found to have evolved from a simple system that
> worked. A complex system designed from scratch never works and cannot be patched up to make
> it work."

The full product concept includes CRM, contracts, payments, vendor management, staff
scheduling, task management, email integration, AI, reporting and floor plans. Building that
from scratch would produce something that does not work and cannot be tested.

So this prototype is the **simple system that works first**:

- **Three screens**, chosen because together they carry the entire value proposition. No login,
  settings, onboarding or pricing — none of which teach us anything about whether the core idea
  is any good.
- **Two state variables** (`screen`, `resolvedIds`) instead of a router and a store. One
  resolved item propagates correctly to every count on every screen, which proves the model is
  sound before anything is built on top of it.
- **One data file.** All content lives in `src/data.js`, so the prototype can be re-aimed at a
  different venue, event or scenario without touching a component.
- **Two dependencies.** React and Vite. No component library, no CSS framework, no backend.
- **A design system of five primitives** — Card, Pill, Avatar, Icon, Field — grown from what the
  screens actually needed, rather than designed up front in the abstract.

Each of these is a deliberate seam for the next version to grow through: `screen` becomes a
router, `data.js` becomes an API client, `resolvedIds` becomes server state — without
rewriting the parts that already work.

---

## Supporting choices

**Visual tone.** B2B software, not a consumer wedding site. Willow green and warm stone
neutrals, an off-white page, restrained type, no photography and no script fonts. Warmth comes
from the neutral temperature rather than from decoration — appropriate for wedding work without
becoming a pink wedding website.

**Hierarchy.** Each screen answers its own question in its first band. The dashboard opens on
what needs attention rather than on a calendar, because "what do I do next?" is the question the
persona actually arrives with.

**The AI is a drafter, not a sender.** The suggested reply is labelled a draft, shows the venue
data it was built from, is fully editable, and is only ever sent by a human pressing a button.
Control is the value proposition, so the assistant is never permitted to act alone.
