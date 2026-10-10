# Staffing Planner 2: spec

A second staffing feature, built **beside** the first Staff Planner so the two can be compared side by side. It has its own sidebar item ("Staffing Planner 2", already present), routes under `/staffing2`, its own state, and its own storage key. It never edits Planner 1's files or state.

**Job to be done:** "Help me organize my staff into the roles I need them to fill, at the times they should be there."
**Second priority:** a low learning curve (`BACKLOG.md` B-01 to B-06, B-11).

Research inputs, cited as `01 §x`, `02 §x`, `03 §x`, `04 §x`:
- `research/v2/01-scheduling-tools.md`: how shift-scheduling tools work, screen by screen.
- `research/v2/02-event-venue-staffing.md`: how venues actually staff a wedding.
- `research/v2/03-pain-points-and-ux.md`: pain points, UX patterns, and the critique of version 1 (C1 to C14).
- `research/v2/04-domain-model-and-rules.md`: data model, rules, pseudo-code, and test scenarios.

**Evidence caveat.** No venue manager was interviewed (03 header; 02 §6). Ratios come mostly from vendor blogs (02 §2.2, 04 §3). Every number below that rests on weak evidence is a **configurable default** and is labelled with its confidence.

Words used on screen: couple, wedding/event, timeline block, **spot** (one needed person in one block), **open spot** (a spot nobody has confirmed), **call time**, **done about** (release time), **request**, **backup**, **away date**, Up Next tone. "Shift" appears only in text written to staff.

---

## A. Design thesis

### A.1 Core mental model: invite, confirm, backfill, once per wedding

A wedding is staffed **once**. The manager asks part-time people whether they can work **that day**, waits for yes or no, and refills the gaps when someone says no or drops out. It is **not** a weekly grid that is filled in and then published.

The unit the manager asks for, and the unit staff answer, is **one person's day at one wedding**: "Event Staff at the Johnson wedding, call time 3:00 PM, done about 9:00 PM". Timeline blocks still say **where** people are needed (Ceremony needs 2 Event Staff). A person's request simply lists the blocks they will cover.

```
Needs (per timeline block, per role)     ->  Ask people  ->  They reply     ->  Gaps get backfilled
"Ceremony: 2 Event Staff, 3-5 PM"            (one text per    Yes = Confirmed     "Ask backups": next best people,
 suggested from guest count, editable)        person per       No  = Can't make it  first yes wins, extra yeses
                                              wedding)         Yes but full = Backup  become Backups
```

**Why this model:**
- **Venue staff are an on-call pool.** Servers, bartenders and grounds staff are part-time or on call, and often hold other jobs (02 §2.4, confidence High). The tools built for this work ask first and assign second:
  - Event Staff App sends an availability request, then turns a "Yes" into a shift (02 §1.1).
  - Planning Center auto-reschedules declines to the next available person (02 §1.6).
  - Nowsta offers first-come with applicants kept as backups (02 §1.8).
  - FirstHR calls automatic backfill "the essential feature" (03 §1.1).
- **The top-ranked pains are all about the ask loop.** P1 (call-out scramble), P2 (who is confirmed?), P4 (availability per date) and P11 (no app install) are ranked highest (03 §1.2). Version 1 put every one of them out of scope or simulated it (03 §1.3, C2, C3, C7).
- **One request per person per day.** Staff think "I'm on the Johnson wedding, call time 2:30" (03 C1). Event Staff App groups by call time, which can differ from the event's own times (02 §1.1). Planning Center lets a person accept a whole plan (02 §1.6). A per-block request gives three texts and allows half-accepted days (03 C1).
- **A short "Not sent" holding state stays, as a side path.** Planning Center has "prepared vs sent" and staff.cloud has "provisional, not informed" (02 §1.6, §1.10). Batching cuts notification noise (03 P5). The manager should never *have* to think about it, though (03 §2.5). So the picker's main button sends at once, through a preview, and "Save for later" is secondary.

**Alternatives rejected:**
- A week grid as the building surface. Its rows are mostly empty for events, and it splits the event across cells (03 §2.1).
- Per-block assignments, as in version 1 (03 C1).
- Open shifts that staff claim for themselves. At weddings the manager cares who works (01 §4, "Open-shift claiming" row). So Planner 2 asks *chosen* people. When more are asked than needed, the first yes wins and later yeses become Backups. That gives Nowsta-style backfill without staff self-scheduling.

### A.2 What Planner 2 does differently from version 1

| # | Version 1 | Planner 2 | Evidence |
|---|---|---|---|
| 1 | Assignment per timeline block; three asks for one person's day; no call time | **One request per person per wedding**, listing their blocks, with a call time (block start plus a per-role offset) and a "done about" time | 03 C1; 02 §1.1 call times, §2.3 staggered calls; 04 §3 "call time vs service time" |
| 2 | Assign, then publish; the manager clicks "Mark accepted" to fake replies | **Ask, reply, backfill.** A built-in **Staff phone** simulator answers texts. First yes wins, extra yeses become Backups, and **Ask backups** recovers from a call-out | 03 C2, C3, C7, P1, P2, P11; 02 §1.6, §1.8 |
| 3 | Four tabs; replies on a different tab from the board; availability as a week grid | **One event screen does the whole job.** Needs, people, replies, warnings and backups are inline. The other screens are a list, a team page and the phone | 03 C6, §2.9 |
| 4 | Fixed requirements ("1 server for 150 guests") that cannot be edited | **Editable needs**, with **suggested counts from guest count** using sourced ratio rules and a "Why?" link | 03 C10; 02 §1.3 Caterease, §2.2; 04 §4.6 |
| 5 | Checks run only in the picker; 5 seed assignments break availability unseen; removals are silent | **Rules run live on every request**, at four severities, plus **away dates** per date. A sent snapshot means changes and removals go out as texts. Undo works up to the moment of sending | 04 §1.2 G2, §4.5; 03 C8, C11; 01 §4 "How an override is surfaced" |

Also changed:
- Coverage reads **"12 of 13 spots filled · 1 waiting · 1 to find"** instead of one shortage number that cries wolf (03 §2.3, C4).
- There are 6 status indicators instead of about 9 (03 C5).

### A.3 Principles kept from version 1 (03 C14)

- Planning stays per event.
- Only Confirmed counts as coverage.
- Every status has an icon and a word.
- Warnings rarely block.
- People who fit sort first, with plain reasons.
- Before anything goes out, the manager sees exactly who will be texted.

---

## B. Screens and screenflow

Four screens. Everything else is a drawer or a dialog. A pill `Tabs` bar with three tabs appears on the list, Team and Staff phone screens: **Events · Team · Staff phone**. The event screen is reached from Events and returns by breadcrumb. No tab ever changes meaning (fixes 03 C6).

```
 Sidebar "Staffing Planner 2"
        |
        v
 [1 Events /staffing2] --click event--> [2 Event crew /staffing2/<eventId>] <-- Up Next is not wired (see G)
   |  ^                                    |-- Ask panel (drawer; bottom sheet on phones)
   |  |                                    |-- Send review (dialog): preview + warnings summary
   |  +-------- breadcrumb ----------------|-- Edit needs (dialog): guests, service, counts, suggestions
   |                                       |-- Change times (dialog)
   |                                       |-- Phone drawer (Staff phone for one person)
   +--tab--> [3 Team /staffing2/team]  (people, hours, away dates)
   +--tab--> [4 Staff phone /staffing2/phone] (simulator; pick a person)
```

### B.0 Status vocabulary: six indicators, each an icon and a word

| Indicator | Shown as | Tone (existing `StatusBadge`) | Meaning | Counts as filled? |
|---|---|---|---|---|
| **Not sent** | `dash` + "Not sent", or "Change not sent" | `empty` | Saved, or changed after sending, and the text has not gone out | No |
| **Waiting** | `clock` + "Waiting", plus "asked Mon" or "no reply yet" | `pending` | Text sent, no answer yet | No |
| **Confirmed** | `check` + "Confirmed" | `done` | They said yes | **Yes** |
| **Backup** | `info` + "Backup" | `info` | They said yes, but the spots were already full | No |
| **Can't make it** | `x` + "Can't make it" (or "Dropped out" when they cancel after confirming) | `declined` | They said no. Shown only in the quiet "Said no" list | No |
| **Open spot** | Dashed pill, `plus` + "Open spot" | custom muted dashed chip (not a badge) | Derived gap; never a person | n/a |

Two marks can sit beside a status. Neither is a status of its own:
- **"Check"**: an alert glyph on a `warn` soft pill with a short reason, for soft and hard rule issues.
- **"OK'd"**: a check glyph and the word "OK'd" in faint text, for an override that has been recorded. Hover shows the reason.

Coral appears only on the "Can't make it" badge inside the collapsed "Said no" list. Gaps are shown by the neutral Open spot, never by red (STYLE-GUIDE §8).

### B.1 Screen 1: Events (`/staffing2`)

**Purpose:** "Which weddings need me, and for what?"

**Layout, top to bottom:**
1. `PageHeader`: title "Staffing Planner 2", lead "Ask your team, see who said yes, and fill gaps. One screen per event."
2. `Tabs`: Events (active), Team, Staff phone.
3. A one-line summary sentence, built from the first event that needs action. Examples: "Johnson Wedding needs 1 more Event Staff, 2 days out." or "Everything is staffed for the next 30 days."
4. One `Card` per event, sorted by date. The list covers every seed event; Johnson through Chen all fall within 30 days.
   - **Left side:**
     - name, couple, `dateShort` and days out
     - guests, for example "150 guests" or "Guarantee 132"
   - **Middle:** status chips, every one that applies, in this order:
     - `warn` "Needs 1 more"
     - `empty` "2 not sent"
     - `warn` "Check 1"
     - `pending` "Waiting on 1"
     - `done` "All set" (only when nothing else applies)
   - **Line under the name:** "12 of 13 spots filled · 1 waiting · 1 to find".
   - **Right side:** exactly one button, chosen by the first rule that matches:
     1. Needs more: "Find people".
     2. Not sent: "Send 2".
     3. To check: "Review".
     4. Waiting past the reply-by time: "Remind".
     5. Otherwise "Open" (ghost style).
   - Only the first event that needs action gets the filled primary button, with a `pending` "Do first" badge when it is 3 days out or less. All other buttons are secondary.
   - Clicking the card or its button goes to `/staffing2/<id>`. "Send 2" and "Remind" open the event screen with the Send review already open (query `?send=1`, read in a `Suspense` boundary as v1 does).

**States:**
- *Loading* (before the store has read localStorage): show three skeleton cards (`surface-card` with muted bars). Do not render seed numbers that would then jump.
- *Empty*: `EmptyState` "No events in the next 30 days." with body "Events appear here as soon as they are booked."
- *Error* (saved state could not be parsed): an `Alert` (`info` tone) reading "Your saved Planner 2 changes couldn't be read, so it started fresh from the sample data." The seed is used and the bad key is overwritten.

### B.2 Screen 2: Event crew (`/staffing2/<eventId>`), the screen that does the whole job

**Header** (`Breadcrumbs` "Staffing Planner 2 › Johnson Wedding" plus `PageHeader`):
- **Title:** event name.
- **Lead:** "Emily & Marcus Johnson · Sat, Sep 19 · 2 days out · 150 guests (no guarantee yet)".
- **Actions:**
  - **"Send N"** (primary). Shown only when there is something unsent: new requests, changes or removals. The label counts people, for example "Send 2 texts". It opens Send review.
  - **"Edit needs"** (secondary). Opens Edit needs.
- **Summary row:** four chips with icons and words, for example `check` "12 of 13 spots filled", `clock` "1 waiting", `plus` "1 to find", `alert` "1 to check". Each chip has hover text that teaches the term, for example "Waiting: asked, no reply yet" (03 §2.9).

**Notices** (at most 3 `Alert`s, `info` or `warn` tone, never `urgent`). Each one has one action. Priority order:
1. **Dropped out:** "Marisol can't make it anymore (Sick, told you 53 hours before call time). Ceremony and Reception each need 1 more Event Staff." Action: **Ask backups** (primary, the only filled button in this region).
2. **Check:** "2 people are booked outside what they usually work. These were set up before Planner 2 checked." Action: "Show them". It scrolls to the first flagged row and highlights it.
3. **No reply:** "Grace hasn't replied since Mon." Action: "Remind".

**Day line:** the timeline blocks as small chips in time order. Example: "Setup 9:00 AM–3:00 PM · Ceremony 3:00–5:00 PM (guests 3:30) · Reception 5:00–9:00 PM · Teardown 9:00–11:00 PM". This is read-only. It shows where the times come from.

**Role cards.** One `Card` per role the event needs, in `ROLES` order: Venue Manager, Event Captain, Event Staff, Bartender, Server, Grounds.
- **Card title:** the role. The subtitle shows **per-block coverage**: "Ceremony 1 of 2 · Reception 2 of 2 · Teardown 1 of 1", each with a `check` or `plus` glyph.
- **Card action:** "Ask people". It is primary only if the role has a spot to find and the page has no notice primary; otherwise secondary.
- **Person rows** (`ListRow` style, 44px or taller), one per live request in this role:
  - `Avatar`, name, and roles if more than one.
  - **Line 2:** the blocks and times, for example "Ceremony + Reception · call 3:00 PM, done about 9:00 PM". Split days read "Setup 9:00 AM–3:00 PM and Teardown 9:00–11:00 PM".
  - **Status badge** from B.0. A Waiting row adds "asked Mon", "seen 2 min ago" or "no reply yet".
  - **Mark:** "Check: usually free until 5:00 PM Sat" or "Needs a reason: alcohol certificate expired Oct 1". Hover shows every issue.
  - **`⋯` menu** (button plus popover; Escape closes it). Items depend on status:
    - Remind (Waiting)
    - Change times
    - Record their reply › Yes / No (Waiting; used when they phoned in)
    - Use as confirmed (Backup)
    - Mark as OK (has an issue; hard issues need a reason)
    - Open their phone
    - Remove from this wedding
- **Open spot rows**, dashed, one per block with a gap. Example: "Open spot · Ceremony 3:00–5:00 PM". The button is "Ask people" (ghost). It opens the Ask panel with that block preselected. If Waiting or Not sent people already cover the gap, the row instead reads "Waiting on Tessa for this spot" and has no button. This stops over-asking (03 C4).
- **Backups** (shown only if there are any): "Backups (1): Grace Lindqvist, said yes Thu", with "Use as confirmed".
- **Said no** (collapsed `details`): "Said no (1)". Expanded: "Jake Pearson · Can't make it · Class until 4:00 PM". Dropped-out people are listed here as "Dropped out".
- **Suggestion line** (quiet `info` text, only when the ratio suggestion differs from the current count). Example: "For 150 guests we'd suggest 3 Bartenders on Reception (1 per 50, full bar). · Use 3 · Why?" "Use 3" applies at once with an Undo toast. "Why?" shows the rule text, its sources and its confidence (C.4).

**Replies and changes** (a collapsed `Card` at the bottom). The last 10 activity entries, newest first. Example: "Thu 10:06 AM · Tessa said yes (Ceremony)".

**States:**
- *Loading:* skeleton, same as B.1.
- *Unknown id:* `EmptyState` "We couldn't find that event" with a "Back to events" button.
- *Event with no needs:* `EmptyState` "No crew needs yet." with the action "Edit needs".
- *All set:* the summary chip reads `done` "All 13 spots filled" and there are no notices.
- *A role with nobody who fits:* in the Ask panel (below).

**Phone layout (375 px):** cards are full width, coverage chips and buttons wrap, the `⋯` menu opens as a bottom sheet, and there is no horizontal scrolling (B-13).

### B.3 Ask panel (drawer; a bottom sheet under 640 px)

It opens from "Ask people", an Open spot, "Ask backups", or the event list's "Find people".

**Layout, top to bottom:**
- **Title:** "Ask for Event Staff". Subtitle: "Johnson Wedding · Sat, Sep 19".
- **Working:** block toggle chips for this role's blocks, for example `[✓ Ceremony 3–5 PM] [ Reception ] [ Teardown ]`. The blocks with gaps are preselected. At least one must stay selected.
- **Call time:** a `Select` with "On time (3:00 PM)", "15 min early", "30 min early", "1 hour early". The default comes from the role's default offset (C.2).
- **Search box:** autofocused, filters by name.
- **"Show other roles"** toggle.
- **Candidate groups**, in this order. Each row has a checkbox, `Avatar`, name, one line of good reasons and plain-sentence issues:
  1. **"Said they're free (n)"**: Backups for this role at this event. Each row has an inline "Confirm" button instead of a checkbox.
  2. **"Good fit (n)"**: no issues, or only info. Example line: "Free all Saturday · 0 events in the next 30 days · 6 h that week".
  3. **"Check first (n)"**: soft issues, for example "Usually free from 5:00 PM on Saturdays".
  4. **"Needs a reason (n)"**: hard issues, for example "Away until 4:00 PM: Class".
  5. **"Can't be asked (n)"**: collapsed. Example: "Already on this wedding as Server". There are no checkboxes in this group.
- **Already on this wedding in the same role** (for example Omar, who works Reception): he is listed in **Good fit** as "Add Ceremony to Omar's day (on Reception from 5:00 PM)". Asking him **changes his existing request**; it does not create a second one.
- **Sticky footer:**
  - A hint when more people are ticked than there are open spots: "2 asked for 1 spot. The first to say yes gets it; the other goes on the backup list."
  - **Reason field** (when a hard-issue person is ticked): "Why is this OK for Jake?" Quick picks are "Checked with them" and "Times can flex", plus free text. "Ask" stays disabled until a reason is given.
  - **"Ask 2 people"** (primary): opens Send review limited to these requests.
  - **"Save for later"** (secondary): creates Not sent requests, closes the panel, and shows an Undo toast.

**"Ask backups" mode:**
- The selected blocks are those of the person who dropped out.
- The top 3 **Good fit** people who are not already on the event are pre-ticked.
- The footer reads "Ask 2 people now". Texts go out with a "Short notice" prefix and a 2-hour reply-by time.

**Empty group state:** "No Event Staff fits Sat, Sep 19." with two actions, "Show other roles" and "Show people who need a reason".

**Keyboard and focus:**
- Escape closes the panel, and focus returns to the button that opened it.
- Tab cycles inside the panel.
- Space ticks the focused row.
- Enter on the footer button asks.

This fixes 03 C13.

### B.4 Send review (dialog, `Modal`)

This is the only confirmation step, and the confirmation *is* the preview (03 §2.5). It is used for sends, reminders and Ask-backups.

**Layout:**
- **Title:** "Send 3 texts". Lead: "Each person gets one message for their whole day."
- **"Check before sending (n)"** (the single warnings summary; 01 §4 "7shifts-style single warnings summary"). One line per issue on the people *in this send*, for example "Ben Alvarez: usually free from 5:00 PM on Saturdays; this asks for 3:00 PM." Each line has a "Change" link that closes the dialog and opens Change times for that person. It also lists events with open spots that this send leaves unfilled, for example "Ceremony still has 1 open spot after this." Nothing here blocks sending.
- **Messages:** one row per person.
  - A kind badge: "New", "Time change", "No longer needed", "Reminder" or "Short notice".
  - The full text that will go out (C.7), in a quoted box.
  - Removals must be listed. The removed person always gets a text (03 C11, P6).
- **Footer:** "Back" (secondary) and "Send 3 texts" (primary).

**After sending:**
- A toast: "Sent 3 texts. Replies show up on this page." with the link "Open Tessa's phone". The toast has **no Undo**. Its small print reads "Texts can't be unsent. To change something, edit it and send an update."
- The undo history is cleared.

### B.5 Edit needs (dialog)

**Fields:**
- **Guests expected:** a number.
- **Guarantee:** a number. It is optional; the hint reads "Final count, usually 48–72 h before" (02 §2.1).
- **Service:** Plated, Buffet, Family style, Stations, Cocktail only.
- **Bar:** None, Beer & wine, Full bar.
- **Bar stations:** a number.
- **Servers come from:** Venue or Caterer. When Caterer is chosen, server suggestions are suppressed (04 §2.3).

**Needs table:** one section per timeline block, one row per role.
- Each row has a stepper ("− 2 +") and a **Suggested** column showing "3 · Use", or "—" when no rule applies.
- **"+ Add a role to Reception"** is a `Select` of `ROLES`.
- Lowering a count below the number already confirmed is allowed. The extra confirmed people then show "Extra" on the event screen; nobody is removed automatically.

**"How suggestions work"** (collapsed): the rule table from C.4, with its sources and confidence, plus a note that rules are venue defaults.

**Footer:** "Save needs" (primary). Saving shows the toast "Needs updated." with Undo.

### B.6 Change times (small dialog)

- The same block toggles and call-time select as in the Ask panel.
- **"Save"**. If the request was already sent, the row becomes "Change not sent" and the header "Send N" count goes up.
- Undo toast.

### B.7 Screen 3: Team (`/staffing2/team`)

**Purpose:** who is on the team, how loaded they are, and which dates they can't work. This is the minimal, date-specific availability (03 P4, C8).

**Layout:**
- `Tabs`.
- A `Card` "Team" containing a list. It is **not** a week grid.
- **One row per person:**
  - `Avatar` and name.
  - Roles, plus an "On call" tag for the pool people.
  - "Usually free: Sat 7 AM–5 PM, Fri 7 AM–5 PM…", taken from the weekly windows and read-only.
  - **"Next 30 days: 3 events · 21 h"**.
  - Next away date.
- **Clicking a row** expands it in place to show:
  - **Away dates:** a list of entries such as "Sat, Sep 19 until 4:00 PM · Class", each with "Remove" (Undo toast).
  - **"Add away date"** form: date (`TextInput type=date`), "All day" or From and To (`Select` of half hours), optional reason, then "Add".
  - Adding a date that clashes with an existing request shows the toast: "Marisol is booked at the Martinez Wedding that day. It's flagged there for you." This **does not** remove her.
  - Credential lines, for example "Alcohol service: expires Oct 1, 2026".
- **Footer link:** "Reset Planner 2 sample data". It clears `vue-lowfi-staffing2-v1` only, then shows an Undo toast.

**States:**
- *Loading:* skeleton rows.
- *Empty:* impossible with seed data, but the `EmptyState` reads "No team members yet."

### B.8 Screen 4: Staff phone (`/staffing2/phone`) and the phone drawer

**Purpose:** prove the loop. The manager sees the text each person received, answers it as that person, and watches the reply land on the event screen (03 C3, P11).

**Screen layout:**
- `Tabs`.
- **"Viewing as"** `Select` of every person, defaulting to the most recent recipient.
- A **phone frame**: a 360 × 700 rounded `surface-card` that fills the full width on phones.
- **Inside the frame, two pill tabs: "Texts" and "My dates".**
  - **Texts:** messages newest first, as SMS-style bubbles from "Willow & Stone Events" (`venue.name`). Each bubble that asks something has a link: "Tap to answer". Tapping it opens the **reply page** inside the frame:
    - Event name, couple, date.
    - **Role**, **"Call time 3:00 PM at Garden Terrace"**, **"Done about 9:00 PM"**, the block names, the block note as "What to know", and "Questions? Dana · (612) 555-0110".
    - Two buttons: **"Yes, I'll be there"** (primary) and **"Can't make it"** (secondary).
    - "Can't make it" shows optional reason chips (Another job · Sick · Family · Class or school · Other), an optional note, and **"Send answer"**. A reason is **not** required (03 §2.8, C13).
    - **After answering**, one of three results:
      - "You're confirmed. See you at 3:00 PM."
      - "Thanks. All spots were already filled, so you're on the backup list. We'll text you if a spot opens."
      - "Thanks for letting us know."
    - Opening the reply page records `seenAt`, so the manager sees "seen".
  - **My dates:** the person's upcoming confirmed and backup requests.
    - Each confirmed one has **"Can't make it anymore?"**. It asks "Tell Dana you can't make the Johnson wedding?" with reason chips and **"Yes, tell Dana"**. This is the call-out (C.1).
    - Below that is "Dates I can't work", using the same Add-away-date form as Team, with `addedBy: 'staff'`.
- **Empty state** (no messages): "No texts yet. When Dana asks Grace to work, the text shows up here."

**Phone drawer:** "Open their phone", from a person row or the post-send toast, opens the same `StaffPhone` component in a right-hand drawer, fixed to that person. The event screen stays visible behind it on desktop, so the reply visibly updates the row.

---

## C. Behaviours

### C.1 Request lifecycle

**Stored statuses:** `draft`, `pending`, `accepted`, `backup`, `declined`, `cancelled`.
**Displayed as:** Not sent, Waiting, Confirmed, Backup, Can't make it. Cancelled requests are not displayed after their notice is sent; they remain only in activity.

A request has two block lists:
- **`blockIds`**: the current plan.
- **`confirmedBlockIds`**: the blocks the person has actually said yes to.

This keeps a confirmed person counted while a change is out for an answer. It follows Sling and Homebase: "the original person remains responsible until the change is approved" (01 §1.5, 04 §4.3 ChangeRequest invariant).

| From → To | Who | Trigger | Effect |
|---|---|---|---|
| ∅ → draft | Manager | Ask panel "Save for later" | Not sent. Undo toast |
| ∅ or draft → pending | Manager | Send (from the Ask panel or "Send N") | `sentAt`, `sent` snapshot, `replyBy`, one message. Activity "Asked Tessa" |
| draft → ∅ | Manager | Remove | Hard delete, no message. Undo toast |
| pending → accepted | Staff (phone) or manager (Record their reply) | "Yes", **and** at least one of `blockIds` still has an open spot for this role | `confirmedBlockIds = blockIds`, `respondedAt`. Activity |
| pending → backup | Same | "Yes", but every block in `blockIds` is already full for this role | "Backup". Phone shows the backup copy |
| pending → declined | Same | "Can't make it" | `reason` is optional. If it was a change to a confirmed person: **revert** `blockIds = confirmedBlockIds`, status stays `accepted`, Activity "Omar can't do the earlier call; still on from 5:00 PM" |
| accepted or backup → (changed) | Manager | Change times, or Ask adds a block to an existing person | No status change. Derived `changed = true` shows "Change not sent". `confirmedBlockIds` is trimmed to blocks still in `blockIds` |
| changed → pending | Manager | Send | Message kind `change`. Newly added blocks are Waiting; `confirmedBlockIds` still count |
| backup → accepted | Manager | "Use as confirmed" / "Confirm" | `confirmedBlockIds = blockIds`. A `confirmed` text is logged at once; no review, because they already said yes. Toast "Grace is confirmed. We texted her." Undo is available until the next send |
| accepted → declined, `droppedOut: true` | Staff (phone "Can't make it anymore") | Before call time | Spots reopen. `shortNotice` if under 72 h to call. Event notice 1 (B.2). Activity |
| pending or accepted or backup → cancelled | Manager | Remove a sent request | `cancelNotice: 'queued'`. It appears in Send review as "No longer needed". Coverage drops at once. Undo works until sent |
| cancelled (queued) → cancelled (sent) | Manager | Send | Message kind `cancel` |
| declined → new request | Manager | Ask again | A **new id**. The old record stays in "Said no". Soft rule R-ASKED-BEFORE (fixes 04 G3) |

**Counting** (one block, one role):
- **Confirmed** = requests with `status ∈ {accepted, pending}` and the block in `confirmedBlockIds`. Pending is included only for a change that is out.
- **Filled** = min(confirmed, need).
- **Waiting** = `pending` with the block in `blockIds` but not in `confirmedBlockIds`.
- **Not sent** = `draft`, or changed, with the block not confirmed.
- **To find** = max(0, need − confirmed − waiting − notSent).
- **Extra** = max(0, confirmed − need).

Backup, declined and cancelled never count.

**Reply-by** is display only. It is the earlier of `sentAt + 48 h` and `call − 24 h`, and `sentAt + 2 h` for short-notice asks. Past reply-by, the badge reads "Waiting · no reply yet" and the Remind action is suggested.
- Confidence: Low. 48 h is the "confirm 24–48 h before" practice (02 §2.1 step 5).
- The value lives in the `SETTINGS` constant.

### C.2 Times

- **Call time** = the first block's `start` + `callOffsetMin` (negative means early).
  - Role default offsets live in `SETTINGS.callOffsetByRole`: Event Captain −30; all others 0.
  - Confidence: Medium. The captain's pre-service lineup happens before guests arrive (04 §3; 02 §2.3).
  - Event Staff stays at 0, so Jake's seed reason ("can't make a 3:00 PM call time") stays true.
- **Done about** = the last block's `end`.
- **Rule intervals** are computed **per block**, not first-to-last. A split day (Caleb 9–3 and 9–11 PM) does not overlap the Taylor setup (3–5:30 PM).
- **The clock is frozen and simulated.** Base `2026-10-10T10:00` local, matching `TODAY_KEY`. Every user action increments `tick`, and `simNow = base + tick × 2 min`. So "asked 4 min ago" works and tests are deterministic.
- **Short notice** = under `SETTINGS.shortNoticeHours` (72) before the call time.
  - Johnson's call at 3:00 PM on Sat is 53 h from base, so it is short notice.
  - Confidence: Low. The figure comes from the 03 P6 suggestion (about 72 h).

### C.3 Rules and severity

There are four severities (04 §4.5), in UI words:

| Severity | UI group | Manager can still ask? |
|---|---|---|
| **block** | "Can't be asked" | No. Data integrity only |
| **hard** | "Needs a reason" | Yes, with a reason that is stored in `overrides` |
| **soft** | "Check first" | Yes, in one click. Listed in Send review |
| **info** | Shown as a reason line only | Yes; affects ranking only |

The prototype user is always the manager (Dana), so every hard rule is overridable. Staff-side self-service would hide hard-issue requests, but staff never self-claim in Planner 2 (01 §4 "WIW asymmetry").

| Id | Rule | Sev | Message (example) |
|---|---|---|---|
| I-ON-EVENT | Already has a live request at this event in a **different** role | block | "Already on this wedding as Server" |
| I-SAME | Already has a live request at this event in this role, covering the selected blocks | block | "Already on Ceremony" |
| R-OVERLAP | A block interval overlaps a live request (draft, pending, accepted or backup) at **another** event | hard | "Also on Reception at Taylor Engagement Party, 5:30–10:00 PM" |
| R-AWAY | An away date covers the interval | hard | "Away until 4:00 PM: Class" |
| R-CRED | The role requires `alcohol-service`, and it is missing or expired by the event date (expiry `<` dateKey) | hard | "Alcohol certificate expired Oct 1" |
| R-AVAIL | Weekly windows don't cover a block interval | soft | "Usually free 7:00 AM–5:00 PM on Saturdays" |
| R-ROLE | Role not in `roles` | soft | "Usually works as Server" |
| R-ASKED-BEFORE | Has a declined request at this event | soft | "Said no to this wedding on Tue" |
| R-CHANGEOVER | At another event in a different space, with less than 15 min between | soft | "No time to get from Garden Terrace to Courtyard (0 min)" |
| R-LONG-DAY | More than 12 h on that date, all events | soft | "Would be 13 h that day" |
| R-WEEK | More than 40 h in the Mon–Sun week, or above their usual maximum | soft | "Would be 34 h that week; usually up to 30" |
| R-CRED-SOON | The certificate expires within 30 days after the event | info | "Certificate expires Oct 1" |
| R-LOAD | Events in the next 30 days | info | "3 events in the next 30 days" (fairness) |

**Configurable defaults:** 12 h, 40 h, 15 min, 30 days and the roles that need credentials are all in `SETTINGS`.
- 40 h is FLSA (High). 12 h is venue policy (Low). The 15-min changeover is Low (04 §3).
- Bartender is the only role that needs `alcohol-service`. Confidence: Medium that requirements are local and expire; the state picture is unverified (02 §2.6, 04 §3).

**Rules run live.**
- **Every live request** is evaluated on every state change (`evaluate(request, ignoreSelf)`), not only in the picker.
- **An override covers one issue.** It covers the `ruleId + message` it was made for. If the issue disappears, the mark disappears. A new issue needs a new override (04 §4.5, scenario 39).
- **Hard issues on existing requests** come from seeds or later away dates. They show "Needs a reason" plus **Mark as OK**, which asks for the reason.
- **Soft issues on existing requests** show "Check", plus **Mark as OK** in one click.

**Cut from the 04 catalogue** (deferred): meal and rest breaks, rest between days, split shift, spread of hours, daily overtime, lead slots, reliability and standby overlap.

### C.4 Suggested counts from guest count

**Formula:** `g = guaranteedCount ?? expectedGuests`.
- Suggestions apply only to **guest-facing** blocks.
- They are skipped for any role the event's `suppliedBy` marks as caterer.
- They **never** change needs on their own. The manager taps "Use N" (04 §5.5).

| Rule id | Role | Applies when | Default | Confidence and sources |
|---|---|---|---|---|
| server-plated | Server | service = plated | `ceil(g / 10)` | **High** for 1:10 as the anchor: CMU policy, Caterease example, Mayfair, Breakroom (02 §2.2). Range 1:8 to 1:12; 04 uses 1:12 (Low) |
| server-family | Server | service = family style | `ceil(g / 15)` | **Low**: no direct source; set between plated and buffet. Confirm with the venue |
| server-buffet | Server | service = buffet or stations | `ceil(g / 25)` | **Medium**: CMU 1:30, Turnozo 1:30, Mayfair 1:15–20 (02 §2.2) |
| bar-full | Bartender | bar = full | `max(ceil(g / 50), barStations)` | **High** for 1:50 (02 §2.2; 04 §4.6) |
| bar-bw | Bartender | bar = beer & wine | `max(ceil(g / 75), barStations)` | **Medium**: Dummies 50–75, Breakroom 60–80 |
| captain | Event Captain | guest-facing block needing 5 or more people in total | 1 | **Medium**: Breakroom "five or more staff"; Qwick "100+ guests" (02 §2.2) |

Event Staff, Grounds and Venue Manager have **no default rule**. The only evidence is "setup crew 2–4 per event", from one Low source (02 §2.2). "Why?" for these roles reads "No reliable rule of thumb; set your own." Rules live in `lib/staffing2/rules.js` as data: `{ id, role, when, perGuests, min, source, confidence }`. There is no UI for editing them (see E.4).

### C.5 Away dates (minimal date-specific availability)

**Record:** `{ id, staffId, dateKey, endDateKey?, start?, end?, reason?, addedBy: 'manager'|'staff' }`. No `start`/`end` means all day.

**There is no approval workflow.**
- On-call event staff stating a date they can't work is a fact, not a time-off request (03 P4; 02 §2.4).
- Precedence follows 04 §4.3: an away date beats the weekly window.
- Extra availability on a date ("I *can* do the 19th") is deferred.

### C.6 Undo instead of confirm dialogs

- **Single-level undo.** Every manager action before a send pushes the previous state into an in-memory `undo` slot. It is not persisted, and the next action replaces it.
- **The toast** ("Saved. Undo") lasts 10 s (B-11).
- **Actions with Undo:**
  - save for later
  - remove
  - change times
  - edit needs and "Use N"
  - mark as OK
  - record their reply
  - use as confirmed
  - add or remove an away date
  - reset
- **Sending clears undo.** Anything that sends asks through Send review instead.
- **There are no other confirmation dialogs.**
- **Staff-side "Can't make it anymore"** has its own inline confirmation, because it is the staff member's consequential act.

### C.7 Messages (simulated texts)

- **One message per person per send** (03 P5).
- **Templates** (the first name comes from `name`):
  - **New:** "Hi Tessa, can you work the Johnson Wedding on Sat, Sep 19? Event Staff, call time 3:00 PM at Garden Terrace, done about 5:00 PM. Tap to answer."
  - **Time change:** "Update for the Johnson Wedding on Sat, Sep 19: call time is now 3:00 PM (was 5:00 PM), done about 11:00 PM. Tap to confirm."
  - **No longer needed:** "Change of plan: you're no longer needed for the Martinez Wedding Reception on Sat, Oct 3. Sorry for the shuffle. Questions? Dana, (612) 555-0110."
  - **Reminder:** "Reminder: can you work the Johnson Wedding on Sat, Sep 19? Tap to answer."
  - **Confirmed (backup promoted):** "Good news: you're on for the Johnson Wedding on Sat, Sep 19. Server, call time 5:00 PM."
- **Short-notice prefix** (under 72 h): "Short notice: ".
- **The space** is taken from the first block's `spaceId` label.

### C.8 Hours, cost and fairness: what fits

**In scope:**
- **Hours per person:** that day, that week and the next 30 days. Shown on the picker's reason line and on Team.
- **Events in the next 30 days.** It sorts ties in the picker (fewer first) and is shown as R-LOAD info (03 P9, P10, C9).

**Out of scope:**
- **Cost.** There are no wages in the seed. Cost is deferred.

---

## D. Data and state

### D.1 Files and ownership

| File | What it holds | Edits seeds? |
|---|---|---|
| `lib/mock/events.js`, `lib/mock/staff.js` | v1 seeds, **imported read-only** | No |
| `lib/staffing2/seed.js` | Planner 2-only extras: spaces, block extras, event extras, staff extras, on-call pool, away dates, `BASE_NOW`, `SEED_SENT_AT` | New |
| `lib/staffing2/rules.js` | `SETTINGS`, `RULES` (id → severity, copy), `RATIO_RULES` | New |
| `lib/staffing2/adapter.js` | `buildWorld()`, `seedRequests()` | New |
| `lib/staffing2/derive.js` | Pure functions: coverage, evaluate, rank, suggestions, summaries, message text | New |
| `lib/staffing2/store.jsx` | `Staffing2Provider`, actions, persistence, undo, sim clock | New |

### D.2 Seed extras (`lib/staffing2/seed.js`)

```js
export const BASE_NOW = '2026-10-10T10:00'          // matches TODAY_KEY
export const SEED_SENT_AT = '2026-10-07T12:00'      // seed asks went out Wed
export const SPACES = { 'garden-terrace': 'Garden Terrace', 'stone-hall': 'Stone Hall', courtyard: 'Courtyard', 'orchard-lawn': 'Orchard Lawn' }
export const BLOCK_EXTRAS = {
  'johnson-setup': { spaceId: 'garden-terrace' }, 'johnson-ceremony': { spaceId: 'garden-terrace', guestStart: 15.5 },
  'johnson-reception': { spaceId: 'stone-hall' }, 'johnson-cleanup': { spaceId: 'stone-hall' },
  'taylor-setup': { spaceId: 'courtyard' }, 'taylor-reception': { spaceId: 'courtyard' },
  'shah-setup': { spaceId: 'stone-hall' }, 'shah-dinner': { spaceId: 'stone-hall' },
  'martinez-setup': { spaceId: 'orchard-lawn' }, 'martinez-reception': { spaceId: 'stone-hall' },
  'chen-setup': { spaceId: 'garden-terrace' }, 'chen-reception': { spaceId: 'garden-terrace' }
}
export const EVENT_EXTRAS = {   // open question G.2 #1: confirm suppliedBy with the pilot venue
  johnson:  { serviceStyle: 'plated',  bar: 'full', barStations: 2, suppliedBy: { Server: 'caterer' } },
  taylor:   { serviceStyle: 'buffet',  bar: 'full', barStations: 1, suppliedBy: { Server: 'caterer' } },
  shah:     { serviceStyle: 'plated',  bar: 'none', barStations: 0 },
  martinez: { serviceStyle: 'plated',  bar: 'full', barStations: 2, suppliedBy: { Server: 'caterer' } },
  chen:     { serviceStyle: 'family',  bar: 'none', barStations: 0 }
}
export const STAFF_EXTRAS = {   // merged onto v1 staff by the adapter
  nina:    { roles: ['Server', 'Event Staff'] },
  priya:   { credentials: [{ type: 'alcohol-service', expiresOn: '2027-05-01' }] },
  luis:    { credentials: [{ type: 'alcohol-service', expiresOn: '2026-10-01' }] }
}
// On-call pool. These exist only in Planner 2. The 12-person v1 seed is too small to show backfill;
// real venues keep a much larger roster than any one event uses (02 §2.4, 03 §1.1).
export const POOL_STAFF = [
  { id: 'tessa', name: 'Tessa Nguyen', initials: 'TN', role: 'Event Staff', roles: ['Event Staff'], pool: true,
    phone: '(612) 555-0237', preferredHours: 'Up to 20/week',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [{ start: 16, end: 23 }], Sat: [{ start: 12, end: 23 }], Sun: [{ start: 10, end: 18 }] } },
  { id: 'andre', name: 'Andre Wilson', initials: 'AW', role: 'Server', roles: ['Server', 'Event Staff'], pool: true,
    phone: '(612) 555-0248', preferredHours: '10–20/week',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [{ start: 17, end: 23 }], Sat: [{ start: 14, end: 23 }], Sun: [] } },
  { id: 'mei', name: 'Mei Lin', initials: 'ML', role: 'Bartender', roles: ['Bartender'], pool: true,
    phone: '(612) 555-0259', preferredHours: 'Up to 15/week',
    credentials: [{ type: 'alcohol-service', expiresOn: '2027-08-01' }],
    availability: { Mon: [], Tue: [], Wed: [], Thu: [{ start: 16, end: 23 }], Fri: [{ start: 16, end: 24 }], Sat: [{ start: 15, end: 24 }], Sun: [] } },
  { id: 'rosa', name: 'Rosa Delgado', initials: 'RD', role: 'Grounds', roles: ['Grounds'], pool: true,
    phone: '(612) 555-0260', preferredHours: '15–25/week',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [{ start: 8, end: 18 }], Fri: [{ start: 8, end: 18 }], Sat: [{ start: 8, end: 20 }], Sun: [] } }
]
export const SEED_AWAY = [
  { id: 'aw-jake', staffId: 'jake', dateKey: '2026-09-19', start: 0, end: 16, reason: 'Class', addedBy: 'staff' },
  { id: 'aw-ben', staffId: 'ben', dateKey: '2026-10-16', endDateKey: '2026-10-17', reason: 'Family trip', addedBy: 'staff' }
]
```

### D.3 Adapter (`lib/staffing2/adapter.js`)

`buildWorld()` runs once at module load and is pure.

- **Events:** `{ ...event, expectedGuests: event.guests, guaranteedCount: null, ...EVENT_EXTRAS[id], blocks: event.blocks.map(b => ({ ...b, ...BLOCK_EXTRAS[b.id] })) }`.
  - Seed `requirements` are the **base needs**.
  - Runtime overrides come from state `needs` and `eventEdits`.
- **Staff:** v1 staff, each merged with `{ roles: [staff.role], credentials: [], pool: false, ...STAFF_EXTRAS[id] }`, followed by `POOL_STAFF`.
  - `targetMaxHours` is parsed from `preferredHours`: the last number in "20–30/week" or "Up to 40/week".

`seedRequests()` groups `seedAssignments` by `(eventId, staffId, role)`:

```js
const statusRank = { declined: 0, draft: 1, pending: 2, accepted: 3 }   // least settled wins if mixed (never happens in seed)
for each group g:
  id = `${eventId}--${staffId}`;  blockIds = g.map(a => a.blockId) in block order
  status = lowest-rank status in g
  confirmedBlockIds = status === 'accepted' ? blockIds : []
  sentAt = status === 'draft' ? null : SEED_SENT_AT;  sent = sentAt ? { blockIds, callOffsetMin } : null
  respondedAt = (accepted|declined) ? '2026-09-15T18:20' : null;  reason = g[0].declineReason ?? null
  callOffsetMin = SETTINGS.callOffsetByRole[role] ?? 0;  overrides = []; source = 'seed'
```

**Result:** 28 requests.
- Johnson 10: Caleb (Setup + Teardown), Sophie (Setup + Teardown), Dana, Marisol (Ceremony + Reception), Jake (declined), Theo, Omar (Reception + Teardown), Priya, Nina and Grace (pending).
- Taylor 3: Caleb, Ben, Luis.
- Shah 3: Sophie (draft), Theo, Nina (draft).
- Martinez 8: Caleb, Sophie, Dana, Marisol, Omar, Ben, Priya, Luis.
- Chen 4: Sophie, Marisol, Omar, Grace.

**Isolation:**
- Planner 1 keeps `vue-lowfi-prototype-v3` and `lib/store.jsx` untouched.
- Planner 2 imports only `events`, `seedAssignments`, `staff`, `ROLES`, `formatHour`, `pluralRole` and `daysOutLabel` from `lib/mock/*`.
- It **must not** import `useStore` or the v1 components.

### D.4 Runtime state (`localStorage` key **`vue-lowfi-staffing2-v1`**)

```js
{
  version: 1,
  tick: 0,                                  // sim clock: simNow = BASE_NOW + tick * 2 min
  counter: 0,                               // for new ids: r1, r2 … m1 … a1 …
  requests: { [id]: Request },
  needs: { [blockId]: { [role]: number } }, // overrides; absent = seed requirement count. A role absent from the seed = added
  eventEdits: { [eventId]: { expectedGuests?, guaranteedCount?, serviceStyle?, bar?, barStations?, suppliedBy? } },
  away: Away[],                             // starts as SEED_AWAY
  messages: Message[],                      // simulated outbox (the Staff phone reads it)
  activity: { id, at, eventId, text }[]
}
Request = { id, eventId, staffId, role, blockIds[], confirmedBlockIds[], callOffsetMin,
            status: 'draft'|'pending'|'accepted'|'backup'|'declined'|'cancelled',
            sentAt?, sent?: { blockIds[], callOffsetMin }, replyBy?, urgent?, seenAt?,
            respondedAt?, reason?, droppedOut?, cancelNotice?: 'queued'|'sent',
            overrides: { ruleId, message, reason?, at }[], createdAt, source: 'seed'|'ask'|'backup' }
Message = { id, staffId, eventId, requestId, kind: 'ask'|'change'|'cancel'|'remind'|'confirmed',
            at, text, urgent?: boolean }
```

**Loading and saving:**
- Hydrate in `useEffect`, the same as v1, and expose `hydrated`.
- If the parse fails or `version !== 1`, use the seed and set `loadError = true`. That drives the B.1 alert.
- Save on every change after hydration.
- **Reset** removes only this key. `undo` and `loadError` stay in memory.

### D.5 Derived values (pure, in `derive.js`; memoise in the provider with `useMemo` on `state`)

```js
const live = r => ['draft','pending','accepted','backup'].includes(r.status)
const needOf = (block, role, st) => st.needs[block.id]?.[role] ?? block.requirements.find(q => q.role === role)?.count ?? 0
const changed = r => r.sent && live(r) && r.status !== 'draft' &&
      (!sameSet(r.sent.blockIds, r.blockIds) || r.sent.callOffsetMin !== r.callOffsetMin)

function coverage(event, block, role, st) {
  const rs = Object.values(st.requests).filter(r => r.eventId === event.id && r.role === role && live(r))
  const confirmed = rs.filter(r => (r.status === 'accepted' || r.status === 'pending') && r.confirmedBlockIds.includes(block.id)).length
  const waiting   = rs.filter(r => r.status === 'pending' && r.blockIds.includes(block.id) && !r.confirmedBlockIds.includes(block.id)).length
  const notSent   = rs.filter(r => (r.status === 'draft' || changed(r)) && r.blockIds.includes(block.id) && !r.confirmedBlockIds.includes(block.id)).length
  const need = needOf(block, role, st)
  return { need, confirmed, filled: Math.min(need, confirmed), waiting, notSent,
           toFind: Math.max(0, need - confirmed - waiting - notSent), extra: Math.max(0, confirmed - need) }
}

function eventSummary(event, st, world) {      // drives the list and the header chips
  let spots = 0, filled = 0, waiting = 0, toFind = 0
  for (const b of event.blocks) for (const role of rolesOf(b, st)) { const c = coverage(event, b, role, st); spots += c.need; filled += c.filled; toFind += c.toFind }
  waiting = requestsOf(event).filter(r => r.status === 'pending').length      // people, not spots
  const unsent = requestsOf(event).filter(r => r.status === 'draft' || changed(r) || r.cancelNotice === 'queued')
  const toCheck = requestsOf(event).filter(r => live(r) && openIssues(r, st, world).some(i => i.severity !== 'info'))
  return { spots, filled, waiting, toFind, unsent, toCheck }
}

function evaluate(cand /* {staffId, eventId, role, blockIds, callOffsetMin, ignoreId} */, st, world) {
  const out = [], p = staffById(cand.staffId), ev = eventById(cand.eventId)
  const ivs = intervals(cand, ev)                     // per block: {start,end (abs minutes), spaceId, blockId}
  const mine = Object.values(st.requests).filter(r => r.staffId === p.id && live(r) && r.id !== cand.ignoreId)
  const here = mine.filter(r => r.eventId === ev.id)
  if (here.some(r => r.role !== cand.role)) out.push(issue('I-ON-EVENT'))
  else if (here.some(r => cand.blockIds.every(b => r.blockIds.includes(b)))) out.push(issue('I-SAME'))
  for (const r of mine.filter(r => r.eventId !== ev.id)) for (const o of intervals(r)) for (const iv of ivs) {
    if (o.start < iv.end && iv.start < o.end) out.push(issue('R-OVERLAP', { other: r, o }))
    else if (o.spaceId !== iv.spaceId && gapMin(o, iv) < SETTINGS.changeoverMin) out.push(issue('R-CHANGEOVER', { o, iv }))
  }
  const away = st.away.find(a => a.staffId === p.id && ivs.some(iv => overlapsAway(a, ev.dateKey, iv)))
  if (away) out.push(issue('R-AWAY', { away }))
  if (!ivs.every(iv => coveredByWindow(p.availability[ev.day], iv))) out.push(issue('R-AVAIL', { windows: p.availability[ev.day] }))
  if (!p.roles.includes(cand.role)) out.push(issue('R-ROLE'))
  if (SETTINGS.credentialsByRole[cand.role]) credentialCheck(p, ev, out)    // R-CRED hard / R-CRED-SOON info
  if (Object.values(st.requests).some(r => r.staffId === p.id && r.eventId === ev.id && r.status === 'declined')) out.push(issue('R-ASKED-BEFORE'))
  const day = hoursOn(p.id, ev.dateKey, st, cand), week = hoursInWeek(p.id, ev.dateKey, st, cand)
  if (day > SETTINGS.maxHoursPerDay) out.push(issue('R-LONG-DAY', { day }))
  if (week > Math.min(SETTINGS.weeklyHours, p.targetMaxHours ?? Infinity)) out.push(issue('R-WEEK', { week }))
  out.push(issue('R-LOAD', { n: eventsNext30(p.id, st) }))
  return dedupe(out)                                   // one issue per ruleId+message
}
const openIssues = (r, st, w) => evaluate({ ...r, ignoreId: r.id }, st, w)
      .filter(i => !r.overrides.some(o => o.ruleId === i.ruleId && o.message === i.message))

function rank(event, role, blockIds, st, world, { allRoles }) {
  return world.staff.filter(p => allRoles || p.roles.includes(role)).map(p => {
    const existing = activeRequest(p.id, event.id, role, st)                       // extension case
    if (existing && blockIds.every(b => existing.blockIds.includes(b)))            // already covers it (Marisol on Ceremony)
      return { person: p, issues: [issue('I-SAME')], group: 'cant', score: 0, existing }
    const issues = evaluate({ staffId: p.id, eventId: event.id, role, blockIds: union(existing?.blockIds, blockIds), ignoreId: existing?.id }, st, world)
    const group = existing?.status === 'backup' ? 'backup' : groupOf(maxSeverity(issues))   // backup|good|check|reason|cant
    let score = 0
    if (existing) score += 15                         // continuity: already working next to this block (04 §5.4)
    if (p.roles[0] === role) score += 5               // primary role
    score -= 2 * eventsNext30(p.id, st)               // fairness (03 P10)
    return { person: p, issues, group, score, existing }
  }).sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || b.score - a.score || a.person.name.localeCompare(b.person.name))
}

function suggestions(event, st) {                    // C.4. Returns [{blockId, role, current, suggested, rule}]
  const e = { ...event, ...st.eventEdits[event.id] }, g = e.guaranteedCount ?? e.expectedGuests
  return event.blocks.filter(b => b.kind === 'guest-facing').flatMap(b => RATIO_RULES
    .filter(r => r.when(e, b, st) && (e.suppliedBy?.[r.role] ?? 'venue') === 'venue')
    .map(r => ({ blockId: b.id, role: r.role, current: needOf(b, r.role, st), suggested: r.count(g, e, b, st), rule: r }))
    .filter(s => s.suggested !== s.current))
}
```

**Reply handling** (`answer(requestId, yes, reason)`, called by the phone and by "Record their reply"):

```js
if (yes) {
  const ev = eventById(r.eventId)
  const anyOpen = r.blockIds.some(b => { const c = coverage(ev, blockById(b), r.role, stWithout(r)); return c.confirmed < c.need })
  if (anyOpen) set(r, { status: 'accepted', confirmedBlockIds: r.blockIds })
  else         set(r, { status: 'backup' })
} else if (r.confirmedBlockIds.length) set(r, { status: 'accepted', blockIds: r.confirmedBlockIds, callOffsetMin: r.sent.prevOffset ?? r.callOffsetMin })  // change declined → revert
else set(r, { status: 'declined', reason })
// in every branch: respondedAt = simNow; tick++; activity line
```

**Send** (`send(requestIds)`): for each request it does the following.
- **Draft or changed:** status → `pending`, set `sent` (keeping `prevOffset`), `sentAt`, `replyBy` and `urgent`, and push the message (`ask` or `change`).
- **Cancel queued:** push the `cancel` message and set `cancelNotice: 'sent'`.
- Then `tick++`, add activity, clear undo.

### D.6 Seed violations: how Planner 2 flags them

The v1 seed holds 5 requests that sit outside the person's weekly availability, and nothing flags them (04 §1.2 G2). Planner 2's live `openIssues()` finds them on first load, and the Planner 2 seed extras add 1 hard issue.

| Event | Person | Issues on load | Shown as |
|---|---|---|---|
| Johnson | Caleb (Setup + Teardown) | R-AVAIL (Teardown 9–11 PM vs Sat 7 AM–5 PM); R-CHANGEOVER (Garden Terrace → Courtyard Taylor setup, 0 min) | "Check" |
| Taylor | Caleb | R-AVAIL (3:00–5:30 PM vs until 5 PM); R-CHANGEOVER | "Check" |
| Shah–Patel | Sophie (Not sent) | R-AVAIL (1–5 PM vs Thu 8 AM–4 PM) | "Check" |
| Shah–Patel | Theo | R-AVAIL (6–10 PM vs Thu 12–8 PM) | "Check" |
| Chen–Wu | Marisol | R-AVAIL (5–9 PM vs Fri 10 AM–8 PM) | "Check" |
| Martinez | Luis | R-CRED (expired Oct 1, event Oct 3) | "Needs a reason" |

**On screen:**
- **Event screen:** notice 2 ("N people are booked outside what they usually work. These were set up before Planner 2 checked.") with "Show them".
- **Each row:** the mark, plus "Mark as OK" in the row menu. A hard issue asks for a reason.
- **Events list:** a "Check N" chip.

Nothing is removed automatically.

---

## E. Build plan (one developer-agent session)

Before writing code, read `node_modules/next/dist/docs/` (AGENTS.md). Copy the v1 patterns already proven in this repo:
- **Dynamic route:** a server `layout.jsx` with `generateStaticParams`, and `use(params)` in a client page (see `app/(app)/staffing/[eventId]/`).
- **Search params:** `useSearchParams` inside `Suspense`.
- **Client files:** `'use client'` on every client file.

### E.1 Files

**New: routes.**

| Path | Notes |
|---|---|
| `app/(app)/staffing2/layout.jsx` | Server component. Renders `<Staffing2Provider>{children}<UndoToast/></Staffing2Provider>` |
| `app/(app)/staffing2/page.jsx` | **Replaces** the placeholder. Events list (B.1) |
| `app/(app)/staffing2/[eventId]/layout.jsx` | `generateStaticParams` over `events` |
| `app/(app)/staffing2/[eventId]/page.jsx` | Event crew (B.2) |
| `app/(app)/staffing2/team/page.jsx` | Team (B.7) |
| `app/(app)/staffing2/phone/page.jsx` | Staff phone (B.8) |

**New: library code.**

| Path | Notes |
|---|---|
| `lib/staffing2/seed.js` | D.2 |
| `lib/staffing2/rules.js` | `SETTINGS`, `RULES` (id → severity, group, copy function), `RATIO_RULES` |
| `lib/staffing2/adapter.js` | D.3 |
| `lib/staffing2/derive.js` | D.5. Pure, with no React |
| `lib/staffing2/store.jsx` | Provider and actions: `ask`, `saveForLater`, `send`, `answer`, `remind`, `remove`, `changeTimes`, `promote`, `markOk`, `setNeeds`, `setEventEdits`, `applySuggestion`, `addAway`, `removeAway`, `markSeen`, `dropOut`, `undo`, `reset`; plus `hydrated` and `loadError` |

**New: components.**

| Path | Notes |
|---|---|
| `components/staffing2/Nav.jsx` | `Tabs`: Events, Team, Staff phone |
| `components/staffing2/StatusChip.jsx` | The B.0 vocabulary, plus the Check, OK'd and Open spot chips |
| `components/staffing2/RoleCard.jsx` | Role card with person rows, open spots, backups, said no, suggestion line, and the row `⋯` menu |
| `components/staffing2/AskPanel.jsx` | B.3 |
| `components/staffing2/SendReview.jsx` | B.4 |
| `components/staffing2/EditNeeds.jsx` | B.5 |
| `components/staffing2/ChangeTimes.jsx` | B.6 |
| `components/staffing2/StaffPhone.jsx` | B.8, including `PhoneDrawer` |
| `components/staffing2/AwayDateForm.jsx` | Shared by Team and the phone |
| `components/staffing2/UndoToast.jsx` | Planner 2's own toast host with an Undo button. It does not touch the shared `ToastHost` |

**Shared files: no edits are required.**
- The sidebar item already exists in `components/AppShell.jsx`.
- Reuse `components/ui/primitives.jsx` (`Button`, `StatusBadge`, `Card`, `PageHeader`, `Breadcrumbs`, `Tabs`, `EmptyState`, `Alert`, `ListRow`, `Avatar`, `TextInput`, `Select`, `Textarea`, `Icon`) and `Modal` from `components/ui/domain.jsx`.
- If a needed icon is missing, use the closest existing glyph. **Do not modify** `app/(app)/staffing/**`, `lib/store.jsx`, `lib/mock/*` or the v1 components.
- *Optional, only if time remains:* append a short "Staffing Planner 2" section to `docs/DATA-DICTIONARY.md`.

### E.2 Implementation order (the app builds after each step)

1. **Data layer.**
   - Write `seed.js`, `rules.js`, `adapter.js`, `derive.js` and `store.jsx`, plus the layout with the provider.
   - Keep the placeholder page, and have it temporarily print `eventSummary` for each event.
   - **Check:** the numbers in F.2 scenarios 1, 2 and 14 match, and `next build` passes.
2. **Events list and the read-only event screen.**
   - Build `Nav`, `StatusChip`, `RoleCard` (rows, open spots, said no, backups and marks; no menu actions yet), and the `[eventId]` route with `generateStaticParams`.
   - Add the header chips, notices, day line, and loading, empty and error states.
   - **Check:** F.1 items 1–4.
3. **Asking and sending.**
   - Build `AskPanel` (ranking, groups, multi-select, reason for hard issues, Save for later, extension of an existing request) and `SendReview` (warnings summary and message preview).
   - Add the row menu actions: Remind, Remove (with the cancel notice), Change times (`ChangeTimes`), Mark as OK, and Record their reply.
   - Build `UndoToast` and the undo slot.
   - **Check:** F.1 items 5–9.
4. **Staff phone and recovery.**
   - Build `StaffPhone` (texts, reply page, backup copy, seen), the `/phone` route, `PhoneDrawer`, "Can't make it anymore" with the drop-out notice, the "Ask backups" mode, and "Use as confirmed".
   - **Check:** F.1 items 10–13.
5. **Needs and suggestions.**
   - Build `EditNeeds` (event fields, steppers, add a role, suggestions, "How suggestions work") and the role-card suggestion line with "Use N" and "Why?".
   - **Check:** F.1 items 14–15.
6. **Team and away dates.**
   - Build the Team page (rows, hours and events in the next 30 days, credentials, away dates add and remove), `AwayDateForm` in the phone's "My dates", and reset.
   - **Check:** F.1 items 16–18, then do a 375 px pass.

### E.3 Order of cuts if the session runs short

Cut from the bottom up, and leave the app buildable after each cut.
1. Drop step 6's Team page to a read-only list. Keep away dates only in the phone's "My dates".
2. Drop "Why?" popovers. Keep the rule text in "How suggestions work".
3. Drop `PhoneDrawer`. Use only the `/staffing2/phone` route, and link to it from the toast.
4. Drop R-CHANGEOVER, R-LONG-DAY and R-WEEK. Keep block, R-OVERLAP, R-AWAY, R-CRED, R-AVAIL, R-ROLE and R-ASKED-BEFORE.
5. Drop "Record their reply" from the row menu. The phone is the only way to reply.

**Never cut:** the one-request-per-person model, the Staff phone reply loop, first-yes-wins with Backups, Ask backups, Send review with removals, live rule marks on seed data, and Undo.

### E.4 Deferred (not built in this session)

- Up Next items and a sidebar badge for Planner 2. These would need edits to `lib/store.jsx` and `AppShell`.
- No-show marking and reliability history.
- Swaps and staff-suggested cover.
- Manager-picks mode.
- Lead slots.
- Meal, rest, split and spread rules.
- Labour cost.
- Editing ratio rules in the UI.
- Adding or removing timeline blocks.
- Copying needs from another event.
- Reconfirmation 24–48 h out.
- Notification channels and digest.

---

## F. Acceptance criteria and test scenarios

### F.1 Acceptance criteria (check in a browser)

1. The sidebar item "Staffing Planner 2" opens `/staffing2`. It lists the 5 seed events, each with a "N of M spots filled" line and exactly one action button. `/staffing` (v1) still behaves exactly as before.
2. Every status shown in Planner 2 is one of the six in B.0, each with an icon and a word. No coral appears outside the "Said no" list.
3. Johnson's event screen shows every role card with per-block coverage, Jake under "Said no" with his reason, one Open spot on Ceremony, and Grace as Waiting with "no reply yet".
4. On first load, the six people in D.6 carry a Check or Needs-a-reason mark, and the events list shows the matching "Check" chips.
5. The Ask panel ranks people into the groups in B.3, with plain reasons. A hard-issue person cannot be asked without a reason. Escape closes the panel and returns focus.
6. "Ask 1 person" opens Send review showing the exact text and the warnings summary. Sending moves the person to Waiting and shows the post-send toast, which has no Undo.
7. "Save for later" creates Not sent, the header shows "Send N texts", and Undo removes it.
8. Removing a sent person drops coverage at once, queues a "No longer needed" text in Send review, and Undo restores the person until the send happens. Removing a Not sent person deletes it, with Undo.
9. Change times on a confirmed person shows "Change not sent". Their old blocks still count as filled until they answer.
10. In the Staff phone, the recipient sees one text per send and the reply page shows call time, done-about time, place and contact. "Yes" makes them Confirmed (or Backup if the spots are full). "Can't make it" moves them to Said no without needing a reason. The event screen reflects each change.
11. "Can't make it anymore" on a confirmed person reopens their spots and shows the drop-out notice with "Ask backups".
12. "Ask backups" pre-selects up to 3 Good-fit people not already on the event, and sends "Short notice" texts. The first yes is Confirmed, and later yeses become Backups.
13. "Use as confirmed" on a Backup confirms them and logs a "you're on" text.
14. Edit needs changes counts, guests, guarantee, service and bar, and adds a role. Suggestions appear with their basis and confidence, and "Use N" applies with Undo.
15. No requirement count ever changes without a manager action.
16. Team lists every person, including the 4 on-call people, with events and hours for the next 30 days and their away dates.
17. Adding an away date that clashes with an existing request flags that request at once. Removing the away date clears the flag.
18. A reload keeps Planner 2 state under `vue-lowfi-staffing2-v1`. "Reset Planner 2 sample data" restores the seed without changing v1 state. Every Planner 2 screen works at 375 px with no horizontal scroll. `next build` (static export) succeeds.

### F.2 Test scenarios (seed data; Given / When / Then; adapted from 04 §7)

1. **Johnson ceremony gap** (04 #1). Given the seed, then Ceremony Event Staff shows 1 of 2, `toFind 1`, and Jake is under Said no. The Johnson summary is "12 of 13 spots filled · 1 waiting · 1 to find".
2. **Grace is extra** (04 #2). Given that Nina is confirmed on Reception Server (need 1) and Grace is pending, then Server reads 1 of 1, Grace shows Waiting, and `toFind 0`. When Grace says yes in the phone, she becomes **Backup** and her phone shows the backup copy. When she instead says no, she moves to Said no and coverage does not change.
3. **Ranking for the ceremony spot** (04 #19, extended). When "Ask people" is opened on the Ceremony Open spot, the groups are:
   - **Good fit:** Omar first (continuity; "Add Ceremony to Omar's day"), then Tessa, then Andre.
   - **Check first:** Ben (R-AVAIL: Sat from 5 PM).
   - **Needs a reason:** Jake (R-AWAY "Class" plus R-ASKED-BEFORE).
   - **Can't be asked:** Marisol (I-SAME).
   - With "Show other roles" on, Nina appears under Can't be asked (I-ON-EVENT, Server).
4. **Ask Tessa.** When Tessa is ticked and "Ask 1 person" then "Send 1 text" is pressed, Tessa is Waiting and the Ceremony row reads "Waiting on Tessa for this spot". When Tessa says yes in the phone, Ceremony is 2 of 2 and Johnson becomes 13 of 13 · 1 waiting (Grace).
5. **First yes wins.** When both Tessa and Andre are asked for the one Ceremony spot (hint shown) and both say yes, the first is Confirmed and the second becomes Backup.
6. **Extension and decline** (04 #4 adapted). When Omar is asked for Ceremony and the change is sent, his row shows Waiting for Ceremony while Reception and Teardown stay Confirmed and coverage does not drop. When Omar answers no, he reverts to "call 5:00 PM", stays Confirmed, Ceremony gets its Open spot back, and activity says so.
7. **Re-ask after decline** (04 #3). When Jake is asked again with a reason, a new request id is created, the old declined record stays in Said no, and the new one shows "OK'd" with the reason.
8. **Shah–Patel drafts.** Given the seed, the header shows "Send 2 texts" (Sophie, Nina) and the list shows "2 not sent". When Send is pressed, the warnings summary lists Sophie's R-AVAIL, both texts are previewed, and after sending both are Waiting. Server still shows 1 to find.
9. **Shah–Patel suggestion.** The Server suggestion reads "6 Servers for 60 guests (1 per 10, plated)". "Use 6" sets the need to 6 (to find 5). Undo sets it back to 2.
10. **Johnson bar suggestion** (04 #32, #33). Bartender is suggested at 3 (`ceil(150/50)`, stations 2), and Server is suppressed (caterer). Setting the guarantee to 132 keeps 3. Martinez suggests 4 Bartenders and 1 Event Captain on Reception (6 needed, ≥ 5). Taylor has no Bartender suggestion (1 = 1).
11. **Luis's certificate** (04 #15). Martinez shows Luis as "Needs a reason: alcohol certificate expired Oct 1". "Mark as OK" requires a reason, and the mark then becomes "OK'd". On Taylor (Sep 19), Luis shows only info "expires Oct 1", which does not count toward Check.
12. **Remove a sent person** (04 #5). When Ben is removed from Taylor, Event Staff becomes 0 of 1, the header shows "Send 1 text" with "No longer needed: Ben", and Undo restores Ben as Confirmed. Removing Nina's Shah draft deletes it with no text.
13. **Call-out** (03 P1). Starting from a fresh seed, in the phone as Marisol, "Can't make it anymore" on Johnson with the reason Sick shows the notice "Marisol can't make it anymore (Sick, told you 53 hours before call time)". Ceremony becomes 0 of 2 and Reception 1 of 2. "Ask backups" pre-ticks Tessa and Andre, but not Ben (R-OVERLAP with Taylor reception, hard) or Jake. The texts start with "Short notice:".
14. **Seed violations** (04 #11). On load, exactly the six requests in D.6 have open issues, and the Johnson summary chip reads "1 to check" (Caleb).
15. **Away date after the fact** (04 #14). On Team, adding an all-day away date for Marisol on Oct 3 ("Family") shows a toast naming Martinez, and her Martinez row shows "Needs a reason: Away all day: Family". Removing the away date clears the mark.
16. **Overlap** (04 #23). Asking Ben for Johnson Reception puts him in "Needs a reason", because he is also on the Taylor Reception from 5:30 to 10:00 PM.
17. **Changeover** (04 #17). Caleb's Johnson row shows "No time to get from Garden Terrace to Courtyard (0 min)".
18. **Isolation** (04 #40). After several Planner 2 actions, `/staffing` still shows Jake declined and Shah's drafts as Not sent, and `vue-lowfi-prototype-v3` is unchanged. Reset in Planner 2 does not touch it, and v1's "Reset prototype data" does not touch Planner 2.

---

## G. Out of scope and open questions

### G.1 Out of scope (Planner 2, this build)

- Real SMS or email, accounts, sign-in for staff, signed links. The phone is a simulator.
- Up Next and sidebar badge integration (E.4). Planner 2's own list and notices stand in for them.
- Clock-in, check-in, no-show marking, reliability scores, timesheets, payroll, wages, labour cost, gratuity distribution (02 §2.4).
- Swaps, drops, staff-to-staff cover, and staff self-claiming open spots. Manager approval policies.
- Weekly availability editing (read-only here), time-off approval, recurring away dates, and "extra availability" dates.
- Lead and captain slots, uniforms, stations or sections, pre-shift briefings, BEO distribution (02 §5 items 7 and 11).
- Breaks, rest, split-shift and spread-of-hours rules; jurisdiction packs; minors (04 §3).
- Agency or marketplace placeholders ("2 servers from agency") (02 §4 item 12).
- Templates, copying needs or crews from another event, multi-event day board.
- One person working two roles at the same event (blocked by I-ON-EVENT).
- Editing ratio rules in the UI. They are data in `rules.js`.

### G.2 Open questions for the product owner

1. **Who supplies servers and bartenders at the pilot venue, the venue or the caterer?** The spec assumes the caterer supplies servers at Johnson, Taylor and Martinez. This decides whether server suggestions matter at all (04 §8 Q1).
2. **Should a timeline block's start officially be the call time?** The spec says yes, with a role offset (only the captain is 30 minutes early). Jake's seed reason ("a 3:00 PM call time") supports this.
3. **Is first-yes-wins acceptable when several people are asked?** Or does the manager want to pick from everyone who said yes? Manager-picks is deferred.
4. **Is a 72-hour "short notice" window right, and a 48-hour reply-by?** Both are Low-confidence defaults.
5. **Should Planner 2 feed Up Next and the sidebar badge** if it is chosen over v1? That needs shared-store edits (04 §8 Q4).
6. **Is one role per person per wedding acceptable**, or do staff routinely bartend at cocktail hour and then serve dinner (02 §4 item 5)?
7. **Are the 4 on-call pool people a fair stand-in for the venue's real roster size?** The research suggests 40 or more for 8–10 events a month (02 §2.4, Low).
8. **Validate the comparison with 3 to 5 venue managers.** Time "from 'Johnson needs 1 more' to confirmed" and "recover from Marisol's Friday call-out" in both planners (03 §1.3).

---

## H. Implementation notes (build session, 2026-10-09)

Built in `app/(app)/staffing2/`, `components/staffing2/`, `lib/staffing2/`. No shared or v1 file was edited. Decisions where the spec was ambiguous:

1. **Ratio rules apply only to blocks that already list the role** (Server and Bartender rules), so a ceremony is never handed bartenders. The captain rule applies to any guest-facing block where the other roles total 5 or more.
2. **"Extra" confirmed people** are shown in the role card's coverage line ("Reception 2 of 1 · 1 extra"), not as a tag on a person row, because which person is "extra" is arbitrary.
3. **Open spots** render as one dashed row per block with a count ("5 open spots"), plus one "Waiting on X for this spot" row per person already covering the gap.
4. **Yes to a change** (a confirmed person asked to add a block) always confirms all blocks; it never turns them into a Backup.
5. **Ask → Send review → Back** returns to the Ask panel with ticks intact; nothing is created until "Send". The Send review previews against a copy of the state, so "Change" links in the warnings summary only appear for requests that already exist.
6. **Over-ask hint** counts people already waiting on the selected blocks ("2 asked for 1 spot").
7. **Staff-phone replies and drop-outs clear the undo slot**, so a manager Undo can never revert a staff member's answer. Manager "Record their reply" is undoable.
8. **Check notice wording** is generic ("N people have something to check, such as times outside what they usually work…") because Martinez's flag is an expired certificate, not availability.
9. **Remove** shows the person as "Removal not sent" (a Not sent variant) until the update goes out.
10. **Drop-out notice** stays until the reopened spots are covered by someone confirmed, waiting or not sent.
11. **Card padding:** the shared `Card` ignores `bodyClassName="px-0 py-0"` (default padding wins in the cascade), so Planner 2 cancels it with negative margins inside its own markup. The shared component is unchanged; v1 has the same quirk.
12. **Events list "Find people"** opens the event screen with the Ask panel open for the first role that has a spot to find (`?ask=1`).
13. Supporting files beyond E.1: `components/staffing2/Drawer.jsx` (drawer/bottom sheet with focus return) and `components/staffing2/controls.jsx` (block toggles, call-time select, reason chips).

## I. Acceptance checklist (F.1), run in the browser on 2026-10-09

| # | Result | Notes |
|---|---|---|
| 1 | Pass | 5 events, one action each (Johnson "Find people" primary + "Do first"). `/staffing` v1 unchanged. |
| 2 | Pass | Six indicators, each icon + word. Coral only on "Can't make it"/"Dropped out" in "Said no". |
| 3 | Pass | Per-block coverage; Jake under Said no with reason; one Ceremony open spot; Grace "Waiting · no reply yet". |
| 4 | Pass | Exactly Caleb ×2, Sophie, Theo, Marisol (Chen), Luis flagged; list shows matching "Check" chips; Johnson "1 to check". |
| 5 | Pass | Groups match F.2 #3 (Omar, Tessa, Andre / Ben / Jake / Marisol). Ask disabled until Jake has a reason. Escape closes and focus returns to the opener. |
| 6 | Pass | Send review shows exact text + "Check before sending"; person becomes Waiting; toast has no Undo, links to their phone. |
| 7 | Pass (code path) | Save for later creates Not sent with Undo; header "Send N texts" verified with the Shah seed drafts. |
| 8 | Pass | Ben removed from Taylor: 0 of 1, "Send 1 text" with "No longer needed"; Undo restores. Draft removal deletes. |
| 9 | Pass | Omar extension: "Waiting for Ceremony; still confirmed for Reception + Teardown", coverage held at 12 of 13. |
| 10 | Pass | Phone reply page shows call time, place, done-about, contact; Yes → Confirmed, full → Backup, No needs no reason; "seen" updates live. |
| 11 | Pass | Marisol "Can't make it anymore" (Sick) → "told you 53 hours before call time", spots reopen, "Ask backups". |
| 12 | Pass | Ask backups pre-ticks Good-fit people not on the event (Andre; Tessa excluded once on the event); Ben/Jake in Needs a reason; "Short notice:" prefix. First yes Confirmed, later yes Backup. |
| 13 | Pass | "Use as confirmed" confirms and logs the "Good news: you're on…" text. |
| 14 | Pass | Edit needs: guests, guarantee (132 keeps Bartender at 3), service, bar, stations, servers-from, steppers, add a role, "How suggestions work". "Use 6" on Shah applies with Undo. |
| 15 | Pass | Needs change only via Save needs / Use N. |
| 16 | Pass | Team lists 16 people incl. 4 "On call", next-30-day events and hours, away dates, certificates. |
| 17 | Pass | Marisol away Oct 3 → toast names Martinez, row shows "Needs a reason: Away all day: Family"; Remove clears it. |
| 18 | Pass | State persists under `vue-lowfi-staffing2-v1`; Reset leaves `vue-lowfi-prototype-v3` untouched. 375 px: no horizontal scroll on all four screens; Ask panel is a bottom sheet. `next build` passes. |

Known gaps: browser window resizing was unavailable, so the 375 px pass used a 375 px same-origin iframe. Keyboard Tab-cycling in the drawer was not exercised by hand. Deferred items in E.4 remain out of scope.
