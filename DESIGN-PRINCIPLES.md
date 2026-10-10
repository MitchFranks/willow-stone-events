# Design principles applied

How the four required principles — **grouping**, **signifying**, **no interference**, and
**Gall's Law** — shaped this prototype, with the specific places each one shows up.

---

## 1. Grouping

*Related things are perceived as related when they are placed together, enclosed together, or
look alike.*

**Proximity.** On every event tab, the four facts a venue manager is asked for constantly — date,
schedule, guests (expected and guaranteed), spaces — sit in one strip directly under the event
name (`components/EventHeader.jsx`). Each Up Next item keeps its event, block and time on one line
above the title, and its What / Why directly underneath.

**Common region.** Every card is a bordered region on a grey page, and each card holds exactly one
subject: one Up Next section, one timeline block in the planner, the payment schedule. The border
does the grouping work, so no headings need to shout.

**Similarity.** Items with the same job share one shape everywhere in the product. Every status is
the same `StatusBadge`, every filter is the same `FilterChip`, every list is the same `ListRow`,
every overlay is the same `Modal`. When five things look identical, the one that does not belong is
obvious.

**Where the screens are grouped into bands:**

| Screen | Bands, top to bottom |
|--------|---------------------|
| Welcome | What Vue does + one way in → how it works (3 steps) → what's inside → way in again |
| Dashboard | Headline → **Up Next** → counters → events + staffing status + recent activity |
| Up Next | Filters → **Do first** → Coming up |
| Event workspace | Identity + facts → tabs → the tab's one subject |
| Staffing Planner event | Status → notices → one card per block, one row per role → chart and history (collapsed) |

The sidebar is grouped the same way: **Start here** (Up Next, Staffing Planner) has full weight,
**Overview** is ordinary, and **More** is visually quieter.

---

## 2. Signifying

*A signifier is the visible cue that tells the user an action is possible. Affordances are
useless if nobody can see them.*

- **Buttons look like buttons at rest.** Every button is bordered or filled before you hover, and
  shifts down 1px when pressed.
- **Rows that go somewhere carry a chevron.** `ListRow` adds one only when the row is a link.
- **Each Up Next item names its fix.** The button says what it does ("Fill spot", "Open and reply",
  "Open payments"), not "View" or "Go".
- **Filters show their state.** A pressed `FilterChip` is filled ink and announces `aria-pressed`.
- **The way back is always visible.** Breadcrumbs on every screen inside the app, the product name
  links to the welcome screen, and "Your goal" is at the top of every screen.
- **State is labelled, not implied.** Not sent, Waiting, Confirmed, Can't make it; "1 of 4 spots
  filled"; "waiting on 1 reply". The system says what it is doing in words, not only in colour.
- **Prototype-only controls look different on purpose.** The "answer for staff" buttons sit in a
  dashed box labelled "Prototype only", so testers can tell the simulator from the product.

---

## 3. No interference

*Signals compete. If everything is emphasised, nothing is.*

- **One meaning per colour, product-wide.** Vermilion = do first. Ochre = coming up. Slate blue =
  confirmed or done. Neutral grey = ordinary information or waiting. No colour is used
  decoratively, and every colour comes with an icon and a word.
- **Quiet everywhere else.** Neutral surfaces, hairlines, two soft shadow levels and no decorative
  motion, so the few status colours are the only thing competing for attention.
- **One primary action per region.** Only the first Up Next item on a screen gets the filled
  button; everything else is outlined. The welcome screen has one way in, worded the same in all
  three places it appears.
- **Things you can't act on move out of the way.** A spot where everyone needed has been asked
  moves from Do first to Coming up as "waiting on 1 reply". Warnings that don't change the
  staffing sit behind "Show warnings".
- **One word for one idea.** "Open spot" everywhere, never "position", "gap" or "short".
- **A restrained type scale.** A handful of sizes and three weights across the whole product.
  Hierarchy comes from spacing and size, not from competing styles.

---

## 4. Gall's Law

> "A complex system that works is invariably found to have evolved from a simple system that
> worked. A complex system designed from scratch never works and cannot be patched up to make
> it work."

The full product concept includes CRM, contracts, payments, vendor management, staff
scheduling, task management, email integration, reporting and floor plans. Building that from
scratch would produce something that does not work and cannot be tested.

So the prototype grew from **one loop that works** — an open spot appears in Up Next, the manager
asks someone, they say yes, the spot fills, and every count updates — and everything else was
added around it:

- **One source of truth for staffing.** The Staffing Planner's state (`lib/staffing/store.jsx`) is
  the only place staffing lives. Up Next, the dashboard, the event header and the sidebar all
  derive from it, so one reply propagates correctly to every count on every screen.
- **Derived, not scripted.** Up Next items are computed from tasks, messages, documents, payments
  and the planner (`lib/store.jsx`). Nothing on screen is a hard-coded list.
- **Small, fixed data.** Two events, two couples, two vendors and a small team
  (`lib/mock/scope.js`), so the scenario is the same for every tester. The full sample set stays in
  the mock files, and widening the prototype is a matter of editing one list of ids.
- **A design library grown from the screens.** The primitives and domain components were extracted
  from what the screens actually needed, rather than designed up front in the abstract.
- **No backend.** State lives in React context and `localStorage`.

Each of these is a deliberate seam for the next version to grow through: the mock files become an
API client, the stores become server state, and the simulated staff replies become real texts,
without rewriting the parts that already work.

---

## Supporting choices

**Visual tone.** B2B software, not a consumer wedding site. Cool stone-grey neutrals, one deep
green accent for focus and selection, restrained type, and labelled placeholder stubs where photos
will go.

**Hierarchy.** Each screen answers its own question in its first band. The dashboard opens on Up
Next rather than on a calendar, because "what do I do next?" is the question the persona actually
arrives with.

**The manager stays in control.** Nothing is sent or changed without a button press, consequential
actions ask first and say what will happen, and most changes can be undone.
