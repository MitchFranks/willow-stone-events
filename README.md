# Willow & Stone Events — Venue Management Prototype

IS 551 · Interactive prototype + written analysis

---

## About this project

This is a working three-screen prototype of an event venue management platform. The fictional
venue is called Willow & Stone Events, and the prototype follows one real scenario: a wedding
coming up in seven days that has three loose ends the manager hasn't dealt with yet.

**What it is:** a clickable React prototype with realistic fake data. Three screens, no backend,
no database, no login, no real email.

**Who it's for:** managers and coordinators at small-to-medium wedding and event venues.

**The problem it goes after:** the information about a single event lives in five or six
different places, so figuring out what's actually done and what's still hanging is slow and
easy to get wrong.

**Important scope note:** this is deliberately *not* a complete event-management product. A real
version of this would need a CRM, contracts, invoicing, vendor portals, staff scheduling, floor
plans, reporting, and an actual email integration. I built three screens because the assignment
is about testing whether the core value proposition lands, not about shipping a SaaS product.
Anything that didn't help test that idea got left out on purpose.

---

## Running Locally

Built with **React 18** and **Vite 5**, plain CSS, no UI framework. You need Node.js 18+.

```bash
cd willow-stone-events
npm install
npm run dev
```

Vite prints a local URL (usually http://localhost:5173) and opens it in your browser. `Ctrl + C`
stops it.

To check the production build:

```bash
npm run build     # builds into dist/
npm run preview   # serves the built version locally
```

**Note on resetting:** sending the reply on Screen 3 changes the prototype's state for the rest
of that session. Just refresh the page to put everything back to the starting state.

All the fake content — event names, dates, vendors, payments, the bride's email, the AI draft —
lives in one file, `src/data.js`, so it's easy to change without digging through components.

---

## 1. Need

Event venue managers coordinate the details of each event across email, calendars, spreadsheets,
documents, payment records, vendor communication, and staff schedules. Because that information
is spread across separate systems that don't talk to each other, it's hard to quickly tell what
has already been handled, what is still outstanding, and whether something time-sensitive is
about to be missed. The risk isn't that any single piece of information is unavailable — it's
that no one place shows the current state of an event, so staying on top of it depends on
memory and manual checking.

## 2. Persona

Coordinators and managers at small-to-medium wedding and event venues — the kind of place that
books somewhere between 30 and 80 events a year and runs with a very small office team, often
one or two people handling everything. They're usually juggling five to ten upcoming events at
different stages at the same time: one happening this weekend, one that's a week out and needs
final numbers, a few that are months away.

Their current toolkit is email for client and vendor communication, a shared calendar for
bookings, spreadsheets for guest counts and payments, and a folder of PDFs for contracts and
floor plans. They're not looking for new software to learn. They're comfortable with the tools
they have — the problem is how many of them there are.

## 3. Primary Capability

The user can open a single upcoming event, see its complete current status in one place, and
act on the items that need a response without leaving the system or opening another tool.

## 4. Fundamental Value

**Control.**

The manager can tell, at a glance and with confidence, where every event stands — and knows that
anything needing their attention has surfaced on its own instead of waiting to be discovered.
The value isn't that the work gets done faster. It's that nothing important slips by unnoticed.

---

# The Three Screens

The flow is **Dashboard → Johnson Wedding → Message + AI reply**, and the state carries back the
other way when you resolve something.

## Screen 1 — Venue Dashboard

**Primary job:** answer "what needs my attention?" before answering anything else.

**What's actually on it:** a greeting with today's date (Saturday, September 12, 2026) and a
one-line summary of how many items are waiting. Four stat tiles across the top — events this
month, needs attention, guests this month, outstanding balances — where only the *Needs
attention* tile is colored in. Then the big one: a red-bordered **Needs attention** panel with
five items sorted by what's due first, each tagged with which event it belongs to and each with
an action button. Below that, an **Upcoming events** list of five bookings with dates, client
names, guest counts, spaces, and an attention badge or an "On track" badge. On the right side,
**Today's schedule** (five time slots for the wedding happening on site today) and **Recent
activity** (five recent things that happened across all events).

**Why it earned a slot:** this is the screen that has to carry the fundamental value on its own.
If a venue manager can't look at this for a few seconds and come away knowing what's on fire,
nothing on the other two screens matters. It's also the only screen that shows more than one
event, which is what makes the "juggling five things at once" problem visible.

**Design question it examines:** *Can a venue manager understand within a few seconds what's
happening at their venue and what they need to do next?*

## Screen 2 — Johnson Wedding Event Workspace

**Primary job:** show the complete status of one event without making the user open anything
else.

**What's actually on it:** the event name and clients at the top with a "3 need attention" badge,
then a row of four key facts (date — Saturday, September 19, 2026 · ceremony — 4:00 PM · guest
count — 150 confirmed · spaces — Garden Terrace / Stone Hall). Under that, a **Needs your
attention** band with three cards: the decorating time change, the final catering count due
Sept 14, and the $4,250 balance due Sept 17. The first card has the button that goes to Screen 3.

Below the fold it splits into two columns. Left side is running the day: a ten-stop **Day-of
timeline** (the 9:00 AM decorating row is highlighted red because it's unresolved), **Tasks**
(3 open, 5 complete), **Vendors** (6, with one flagged "Count due"), and **Staff** (6 entries
with call times). Right side is the client and business stuff: **Client & contacts** (Emily
Johnson the bride as primary, Marcus Johnson, and Rachel Adeyemi the planner, with emails and
phone numbers), **Payments** ($28,400 total, $24,150 paid, $4,250 remaining, with a progress bar
and the full installment history), **Documents & contracts** (5 files with status labels), and
**Recent communication** (4 messages automatically filed to this event, with the unanswered one
highlighted).

**Why it earned a slot:** this is the screen that proves the primary capability. The whole claim
of the product is "one place instead of six," and this is the only way to actually demonstrate
that — by putting the contract, the money, the vendors, the staff, the timeline, and the emails
in a single view that a manager would currently have to assemble from four browser tabs and a
filing cabinet.

**Design question it examines:** *Does putting all of this together in one view actually make
the manager feel more informed and in control than what they do now, or is it just a lot of
information on one page?*

## Screen 3 — Message + AI Assistant

**Primary job:** let the manager resolve one of the attention items end to end without leaving
the product.

**What's actually on it:** on the left, the bride's actual email asking to move decorating from
10:00 AM to 9:00 AM, and below it a **Suggested reply** panel. The panel is labeled "Draft · not
sent," shows a row of chips listing what the draft was based on (the Sept 19 timeline, the venue
access terms in the contract, the booking calendar for Sept 18–19, the grounds crew schedule,
and the open guest-count task), and puts the draft in a fully editable text box. Buttons are
Restore original draft, Cancel, and **Send reply**.

On the right is the context panel — event, date, ceremony, guests, current decorating window,
earliest allowed venue access, whether anything is booked the night before, when the grounds
crew arrives, and the next vendor load-in — ending with a green "No conflict found — a 9:00 AM
start is available" line. Under that, the other two open items for this event, and the client's
phone numbers.

When you hit Send reply, the button shows "Sending…" for a beat, then a green banner confirms
the reply went out and the item is resolved. The sent email appears in the thread underneath the
bride's message. Going back to Screen 2, the timeline row now reads "Confirmed 9:00 AM," the
task is checked off, and the badge drops to "2 need attention." The dashboard counter drops from
5 to 4.

**Why it earned a slot:** without this screen, the product is just a nicer dashboard — it tells
you about problems but you still have to go to Outlook to do anything. This screen is what turns
"I can see what needs attention" into "I can handle what needs attention," which is the
difference between an information product and a control product.

**Design question it examines:** *Would having communication and AI drafting inside the event
system meaningfully cut down the work of managing an event — and would a venue manager trust an
AI-written reply enough to send it to a client?*

---

# Design Question Plan / Feedback Questions

I have **not** collected any feedback yet. These are the four questions I would ask actual venue managers,
plus what I'm predicting they'll say and why I think that. Writing the predictions down first is
the point — if the real answers don't match, that tells me something.

### Question 1 — Category: Capability

**Question:** "I'm going to show you this screen for five seconds, then hide it. After that, tell
me what you think this product does."

**My prediction:** They'll say something close to "it shows your upcoming events and what you
need to deal with." I think they'll specifically mention the red section or use the word
"attention," because that's the only colored block on an otherwise neutral page.

**What in the prototype made me predict that:** On the dashboard, the **Needs attention** panel
is the only element with a red border and tinted background, and it sits above the events list.
Of the four stat tiles, only *Needs attention* is colored. I deliberately kept everything else
neutral grey and white so that in a five-second glance there's really only one thing to look at.
If this prediction is wrong, my color hierarchy isn't doing what I think it is.

### Question 2 — Category: Need

**Question:** "Walk me through the last time you had to check on an event that was a week or two
out. What did you actually open, and in what order?"

**My prediction:** They'll list at least three separate places — email first, then a calendar or
a spreadsheet, then a contract or invoice folder — and I think they'll mention having to check
something twice or ask a coworker because they weren't sure it had been handled.

**What in the prototype made me predict that:** This question is really testing whether the whole
premise is true. The three attention items I chose (an unanswered client email, a vendor deadline
for a guest count, and an unpaid balance) each come from a *different* system in real life —
inbox, vendor communication, accounting. If they describe a workflow where everything already
lives in one tool, my need statement is weaker than I think it is.

### Question 3 — Category: Persona

**Question:** "How many events do you personally have in progress right now, and who else at the
venue would know their status if you were out sick tomorrow?"

**My prediction:** I'm guessing five to ten active events and a very uncomfortable pause on the
second half — either "nobody, really" or "my manager could figure it out from my email."

**What in the prototype made me predict that:** I designed the dashboard around five concurrent
events at different stages (one happening today, one seven days out, three further away) and
built it for a single named person, Dana Whitcomb. If it turns out they only handle one or two
events at a time, or that a team shares every event, then a multi-event dashboard isn't solving
their actual problem and my persona is off.

### Question 4 — Category: Value

**Question:** "What's the thing you most worry about forgetting in the week before an event?"

**My prediction:** Final guest counts for catering, and money that hasn't come in yet. I also
think at least one person will say something about a client request they meant to answer and
didn't get back to.

**What in the prototype made me predict that:** Those are literally the three attention items I
picked for the Johnson Wedding — unanswered bride email, catering count due, balance due. I
chose them because they felt like the obvious candidates, but I'm essentially guessing. If they
name something completely different (weather backup plans, a staff no-show, a rental delivery),
then the prototype is demonstrating control over the wrong things and I should swap the example
data.

---

# Design Justification and First Read

Going through the actual screens honestly, including the parts I'm not happy with.

### 1. Does the landing screen communicate the primary capability and fundamental value at first glance?

Mostly yes. The subheading under the greeting reads "One event on site today and 5 items waiting
on you across 3 events," which states the capability in words before any layout does the work.
Then the **Needs attention** panel is the only red element on the page, and it's above the events
list, so the eye lands on it first.

Where it falls short: the page never says what the product *is*. The top bar says "Willow & Stone
Events / Venue Operations," which is the venue's name, not a description. Someone who's never
seen it might understand "these are things I need to do" without understanding "this pulls
together email, payments, and vendors." The value (control) comes across; the mechanism doesn't.

### 2. Does every element on the landing screen earn its place?

Three things I'd defend, one I'd cut, and one that's actively a problem:

- **Needs attention panel** — earns it. It's the primary job.
- **Upcoming events list** — earns it. It's how the multi-event reality becomes visible, and it's
  the only route into Screen 2.
- **Today's schedule** — earns it, barely. It grounds the product in a real operating day and
  supports the "what's happening right now" half of the question.
- **Recent activity** — this is the weakest element. It's five lines of things that already
  happened, which is the opposite of "what needs my attention." Its only real job is signaling
  that the system is automatically capturing events from other tools. I'd consider cutting it or
  shrinking it.
- **The disabled top nav (Events / Calendar / Inbox)** — this one is a genuine problem. I greyed
  those out on purpose so the prototype wouldn't promise screens that don't exist, but in
  practice the first thing I instinctively did when trying to get to the event page was click
  "Events," and nothing happened. A signifier that looks like navigation but isn't costs the user
  time. This is my strongest candidate for the revision.

The four stat tiles are also worth flagging. Three of them (events this month, guests hosted,
outstanding balances) are context, not action. They don't compete visually because they're
neutral while the attention tile is red, but they're the closest thing on the page to decoration.

### 3. What's visually grouped together on each screen?

**Dashboard:** four bands top to bottom — identity/greeting, the stat row, the attention panel,
then a two-column split with events on the left and today/activity on the right. The grouping
logic is "everything that requires a decision is above everything that's just context."

**Event workspace:** identity band (name + the four key facts), then the attention band, then a
two-column split where the left column is *running the day* (timeline, tasks, vendors, staff) and
the right column is *the client and the business* (contacts, payments, documents, communication).
That left/right division is itself a grouping decision — operational vs. commercial.

**Communication screen:** left column is the conversation (the bride's message and the reply I'm
writing), right column is everything I need in order to answer (event context, other open items,
client phone numbers). Grouped by "the thing I'm doing" vs. "what I need to know to do it."

### 4. How are Gestalt principles used to communicate those groups?

**Proximity** — the four facts a manager gets asked for constantly (date, ceremony time, guest
count, spaces) sit in one tight band directly under the event name rather than being scattered.
Each vendor's name, role, contact, and status note are on one line together. In the payment card,
the three figures sit in a row directly above the progress bar that describes them.

**Common region** — every group is inside a bordered white card on a warm grey background, and
each card holds exactly one subject. The border does the grouping, which means the headings don't
have to be loud.

**Similarity** — anything with the same function looks identical everywhere in the product. Every
status label is the same pill component, every person is the same circular avatar with initials,
every list of things uses the same row layout. The payoff is that when five vendors look the same
and one has an amber "Count due" pill, the exception is obvious without reading.

**Continuity** — the day-of timeline uses a vertical line connecting each stop, so it reads as a
sequence instead of ten separate facts.

There's also a deliberate rule about color that supports all of this: red-clay means act now,
amber means due soon, green means settled, and everything else stays neutral. No color is used
decoratively anywhere, which is what allows the attention signals to win without being loud.
(More detail on this in `DESIGN-PRINCIPLES.md`.)

### 5. Do Screens 2 and 3 stay focused on the primary capability?

Screen 2 mostly does. Everything on it is a real part of an event's status, and the three
attention cards are placed above the detail so the screen leads with action rather than data.
The honest risk is density — it's a long page, and a first-time user could read it as "a lot of
information" rather than "everything in one place." I think the card boundaries and the two-column
split hold it together, but this is the thing I'd most want to watch someone actually use.

Screen 3 stays tight. There's nothing on it that isn't either the message, the reply, or context
needed to write the reply. I resisted adding an inbox list or a full email client, which would
have been a fourth screen wearing a disguise.

### 6. Can the user get back to the landing screen from everywhere?

Yes, multiple ways from both subscreens:

- The **Willow & Stone Events** logo in the top bar is a button that returns to the dashboard from
  any screen.
- A **breadcrumb bar** appears on Screens 2 and 3 with a "← Dashboard" link, and on Screen 3 the
  breadcrumb also includes a "Johnson Wedding" link back to Screen 2.
- Screen 2 has an "← All events" link above the event title.
- Screen 3 has a "← Johnson Wedding workspace" link above the subject line, plus **Back to event**
  and **Dashboard** buttons in the green confirmation banner after sending.

So the way back is never more than one click, and there's no dead end. The weaker direction is
*forward* — getting from the dashboard into Screen 2 depends on knowing the Johnson Wedding row
is clickable, and at rest the only cue is a very light grey chevron that's easy to miss.

---

## Initial AI Output and Revision

**Revision to be completed after reviewing the initial prototype.**

### TODO — what I still need to document here

Once I've branched off main and made my revision, this section needs to cover:

- [ ] **What the AI initially got wrong, skipped, or oversimplified.** Be specific about the
      actual output, not generic complaints. (Starting candidates from my first read above: the
      disabled Events/Calendar/Inbox nav items that look clickable but aren't; the nearly
      invisible chevron as the only resting-state cue that the Johnson Wedding row opens; the
      Recent activity card that doesn't support the screen's primary job; the fact that the
      landing screen never states what the product actually does.)
- [ ] **What I changed.** The concrete edits — which files, which elements, what the new behavior
      is.
- [ ] **Why I changed it.** Tie it back to the first-read evaluation or to a design question from
      the plan above.
- [ ] **Which principle motivated the change.** Name the specific one — signifiers/signaling,
      proximity, similarity, common region, hierarchy, or avoiding interference between signals —
      and explain how the change serves it.
- [ ] **Before-and-after evidence.** Screenshots of the same element before and after, or a clear
      side-by-side description of the old behavior vs. the new behavior.

### Git workflow for this assignment

- [ ] Commit the initial AI-generated version to `main` (this is that version)
- [ ] Create a branch for revisions
- [ ] Make the revision and commit it
- [ ] Open a pull request and merge it into `main`
- [ ] Deploy the final version to a public URL and add the link here

---

## Project Structure

```
willow-stone-events/
├── index.html                 page shell, font, favicon
├── package.json               scripts and dependencies
├── vite.config.js             dev server + build settings
├── README.md                  this file
├── DESIGN-PRINCIPLES.md       longer notes on grouping, signifiers, and Gall's Law
└── src/
    ├── main.jsx               React entry point
    ├── App.jsx                all app state and navigation between the three screens
    ├── data.js                every piece of mock content in the prototype
    ├── styles.css             the whole design system in one file
    └── components/
        ├── AppShell.jsx       top bar, breadcrumbs, footer — wraps all three screens
        ├── Dashboard.jsx      Screen 1
        ├── EventWorkspace.jsx Screen 2
        ├── Communication.jsx  Screen 3
        └── ui.jsx             shared pieces: Card, Pill, Avatar, Icon, Field
```

There's no router and no server. `App.jsx` holds two pieces of state — which screen is showing,
and which attention items have been resolved — and every count on every screen is calculated from
that second one. That's why resolving the decorating request on Screen 3 correctly updates the
badge on Screen 2 and the counter on Screen 1 without any of them being hardcoded.
