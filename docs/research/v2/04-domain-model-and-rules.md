# 04 — Staffing domain model and rules engine (Staffing Planner 2)

Researcher D · accessed and written 2026-10-09 · scope: the data and logic under the scheduler, not screens.

**Evidence labels used throughout.** **[R]** = I read the primary page or spec myself. **[S]** = search-engine summary only (not opened, or opening failed); treat as unverified. **[V1]** = taken from the first research pass (`docs/research/STAFF-SCHEDULING-SOFTWARE.md`) and not re-checked here. **[Seed]** = computed by running `lib/mock/*.js` through a script on 2026-10-09. Full list in [§9 Sources](#9-sources).

---

## 0. Summary

1. **Keep Vue's shape, add what's missing.** Event → timeline block → staffing requirement → assignment is the same shape as Planning Center's Plan → NeededPosition → PlanPerson [R] and Microsoft Graph's schedule → openShift (`openSlotCount`) → shift [R]. Planner 2 extends this shape. It does not replace it.
2. **Add eight records:** `Space`, `Credential`, `AvailabilityException` (one-off unavailable, extra available, prefer, avoid), `TimeOffRequest`, a stored `Offer` with per-person responses, `ChangeRequest` (drop, swap, cover), `StaffingTemplate`/`RatioRule`, and `AuditEvent`. Each one matches a record that at least two mature tools have.
3. **Staff can hold more than one role, with credentials that expire.** `Staff.role` stays as the primary role for back-compat. `Staff.roles[]` and `Staff.credentials[]` drive eligibility. Alcohol service is a credential that a requirement can demand.
4. **Assignment lifecycle adds four states:** `cancelled`, `no_show`, `completed`, and `standby` (as a kind). It also gets a sent snapshot, so the app knows when something has "changed since sent". The counting rule stays as it is: only `accepted` primary assignments count.
5. **Every rule is evaluated live, not just at assign time.** Today Vue checks rules only when listing candidates. The seed data already contains **5 live assignments outside the person's availability** that nothing flags [Seed]. Planner 2 shows conflicts on existing assignments too.
6. **Severity has four levels, and almost everything can be overridden.** All the vendors I read warn rather than block: Deputy has `Warning` plus `WarningOverrideComment` [R], Planning Center shows blockouts as a warning [R], Sling's clopening check is "alert only, no penalty" [R], and When I Work's `hours_max` says "a manager may still schedule the user beyond this value" [R]. Only data-integrity rules block outright. Hard rules need a reason to override. Soft rules need one click.
7. **Rules work on work spans, not blocks.** Contiguous blocks for the same person merge into one span (Marisol: Ceremony 3–5 plus Reception 5–9 is one 6-hour span). Breaks, rest, split shifts and daily hours are all computed from spans. Timefold's "max one shift per day" hard rule [R] would be wrong for Vue, because blocks are segments of one working day.
8. **Ratio rules suggest headcounts and never edit requirements.** Industry ratios exist (bartender 1 per 50–75 guests, plated service 1–2 servers per 10–12 guests [R, low-authority sources]). Many wedding venues get servers from the caterer, so a ratio applies only where the venue supplies that role.
9. **Labor rules come as a jurisdiction pack with parameters, not hard-coded constants.** The default pack is Minnesota, since the seed phone numbers are 612. It contains: FLSA 40-hour weekly overtime on a fixed 168-hour workweek [R]; Minnesota 48-hour overtime for employers not covered by FLSA [R]; Minnesota paid 15-minute rest per 4 consecutive hours and unpaid 30-minute meal at 6+ consecutive hours, effective 2026-01-01 [R]. Minimum rest between days (10 hours, as in Oregon and Timefold) is an optional soft rule.
10. **Planner 2 gets its own storage key** (`vue-lowfi-staffing2-v1`) and reads the existing seeds through an adapter. Seeds stay usable and Planner 1 is not disturbed.

---

## 1. Vue today: the model as built

Read from `docs/DATA-DICTIONARY.md`, `lib/store.jsx`, `lib/mock/events.js` and `lib/mock/staff.js`.

```
Event ─1:N─ Timeline block {id, name, kind, start, end (decimal h), requirements[{role, count}], note}
                 └─1:N─ Assignment {id=`${blockId}--${staffId}`, blockId, staffId, role,
                                    status: draft|pending|accepted|declined, overridden?, warning?, declineReason?}
Staff {id, role (one), availability {Mon..Sun: [{start,end}]}, preferredHours (free text)}
State.offers {[positionId]: {staffIds}}          publishedEventIds[]
DERIVED openPositions (block×role where accepted < count) · candidatesForSlot (soft warnings) · coverageForEvent
```

### 1.1 What works and should stay
- The counting rule: only `accepted` counts, and `draft`/`pending` are visible but not coverage. This matches Planning Center's Confirmed/Unconfirmed/Declined `status` on PlanPerson [R] and Deputy's `ConfirmStatus` 0–3 (Not required, Required, Confirmed, Declined) [R].
- Open positions are **derived**, not stored. Microsoft Graph and When I Work store open shifts as records (`openSlotCount` [R], `user_id = 0` for an open shift [R]). In Vue the requirement already holds the count, so deriving is simpler and avoids drift.
- Warnings don't block, and an override is remembered (`overridden`, `warning`). Deputy has the same pair (`Warning`, `WarningOverrideComment`) [R].
- `draft` → `pending` on publish. This is the same idea as Graph's `draftShift` → `sharedShift` on share [R], Deputy's private draft vs published [R], and Planning Center's `notification_prepared_at` vs `notification_sent_at` [R].

### 1.2 Gaps and drift (verified)
| # | Finding | Evidence |
|---|---|---|
| G1 | Seed events use `guests` and a string `status`. The data dictionary documents `expectedGuests`, `guaranteedCount` and `bookingStatus`, which **don't exist in `events.js`**. `EVENT_TYPES` in code (Birthday, Corporate Event…) also differs from the dictionary (Welcome Party, Farewell Brunch). | Code read |
| G2 | Rules run **only on candidates**. Live assignments are never re-checked. Five non-declined seeds sit outside availability: Caleb `johnson-cleanup` Sat 21–23 (free 7–17), Caleb `taylor-setup` 15–17.5, Sophie `shah-setup` (draft) Thu 13–17 (free 8–16), Theo `shah-dinner` Thu 18–22 (free 12–20), Marisol `chen-reception` Fri 17–21 (free 10–20). | [Seed] |
| G3 | Assignment id `${blockId}--${staffId}` means re-inviting someone who declined **overwrites** the decline record. Decline history is lost. | `assignStaff` |
| G4 | Requirements have no id. A position id is `blockId--role-slug`, so a block can't have two requirements for the same role (for example "Bar lead" plus "Bartender"). | `positionIdFor` |
| G5 | The overlap check is same-`dateKey` and strict-interval only. It has no idea of spaces, travel time or changeover, rest across midnight, or blocks that end after midnight. | `candidatesForSlot` |
| G6 | Availability is weekly windows only (a whitelist, so the default is unavailable). There are no exceptions, no time off and no preferences. A block must be **fully** covered by a single window. | `isAvailable` |
| G7 | No hours accounting (daily, weekly, overtime), no breaks, and no fairness. `preferredHours` is free text and unused. | staff.js |
| G8 | `offers` has no timestamps, mode, expiry or per-person response. `claimOffer` writes `accepted` directly. | store.jsx |
| G9 | Nothing writes an audit trail. `activityLog` is static. | Dictionary §2 |
| G10 | Grace (Server, pending) on Johnson Reception is a deliberate **surplus**: requirement 1, Nina already accepted. Coverage caps `filled` at `count`, but the surplus itself isn't surfaced. | [Seed] |

### 1.3 What the seed day actually looks like (Sat 2026-09-19) [Seed]
| Person | Blocks (non-declined) | Hours | Spread | Gaps | Note |
|---|---|---|---|---|---|
| Caleb | Johnson Setup 9–15 · **Taylor** Setup 15–17.5 · Johnson Teardown 21–23 | 10.5 | 14 h | 0, 3.5 h | Two events, two spaces (Garden Terrace → Courtyard) back to back with 0 minutes between. Two blocks are outside availability. |
| Sophie | Johnson Setup 9–15 · Teardown 21–23 | 8 | 14 h | 6 h | Classic split shift. The 6-hour setup span triggers a Minnesota meal break. |
| Marisol | Ceremony 15–17 · Reception 17–21 | 6 | 6 h | 0 | One 6-hour span, so a Minnesota meal break applies. |
| Omar | Reception 17–21 · Teardown 21–23 | 6 | 6 h | 0 | Same as Marisol. |

These four people cover most of the interesting rules without inventing anything.

---

## 2. How mature tools model the domain

### 2.1 Concept map
| Concept | When I Work (OpenAPI spec) [R] | Deputy API [R] | Planning Center Services API [R] | Microsoft Graph Shifts [R] | Others | Vue today → Planner 2 |
|---|---|---|---|---|---|---|
| **Shift** (person × time) | `Shift`: `user_id` (0 = open), `position_id`, `location_id`, `site_id`, `start_time`, `end_time`, `break_time`, `breaks[]`, `published`, `notified_at`, `acknowledged(_at)`, `linked_users`, `instances` | `Roster`: `Employee`, `OperationalUnit`, `StartTime`, `EndTime`, `Mealbreak`, `Slots[]`, `Published`, `Open`, `ConfirmStatus`, `Warning`, `WarningOverrideComment`, `SwapStatus` | `PlanPerson`: `status` C/U/D, `team_position_name`, `decline_reason`, `notification_prepared_at/sent_at/read_at`, `can_accept_partial` | `shift`: `userId`, `schedulingGroupId`, `draftShift`, `sharedShift`, `isStagedForDeletion` | Connecteam: `assignedUserIds`, `openSpots`, `isOpenShift`, `isRequireAdminApproval` [R] | Assignment, extended |
| **Position / role** | `Position` (name, color, sort); `User.positions[]` = **many per person** | `OperationalUnit` (area) | `TeamPosition` with `tags`, `tag_groups`, `negative_tag_groups` | `schedulingGroup` ("usually by role") | Timefold: `requiredSkill` per shift [R] | Role; Staff gets `roles[]` |
| **Demand** (count needed) | OpenShift `instances` | `Open` roster | **`NeededPosition`**: `quantity`, `team_position_name` | `openShiftItem.openSlotCount` | — | Staffing requirement (already) |
| **Schedule / publish** | `published`, `published_date` | Private draft → published (filled/open) [R] | `prepare_notification` → sent | `schedule/share` copies draft → shared and notifies | Sling: editing re-notifies, and the employee re-accepts [R] | Publish + sent snapshot |
| **Availability** | `AvailabilityEvent`: `type` 1 = unavailable, 2 = **preferred**; `all_day`; `recurrence` (RFC 5545 RRULE); `recurrence_end` → **default available, store exceptions** | — | `Blockout` (`starts_at`, `ends_at`, `reason`, `repeat_frequency/interval/period`, `repeat_until`); `PersonTeamPositionAssignment.schedule_preference` ("Every other week", …), `preferred_weeks` | `timeOff` | Timefold: `unavailableDates` (hard), `undesiredDates` (soft penalty), `desiredDates` (soft reward) [R] | Weekly windows + exceptions + prefer/avoid |
| **Time off** | `Request`: `start_time`, `end_time`, `type_id`, `paid`, `hours`, `user_status` 0 Pending · 1 Canceled · 2 Accepted · 3 Expired · 4 Denied | — | (Blockout) | `timeOffRequest` (a `scheduleChangeRequest`), `timeOffReason` | Homebase: blackout dates, limits, advance notice [S] | TimeOffRequest |
| **Open shift / offer** | `is_open`, `linked_users` (null = all eligible), `requires_openshift_approval`; `OpenShiftApprovalRequest.status` 0 Pending · 1 Approved · 4 Canceled · 5 Expired · 6 Denied. Default is first-come; approval mode = "shift bidding" [R help] | `Open`, `ApprovalRequired` | — | `openShift` + `openShiftChangeRequest` | Connecteam `openSpots` [R] | Offer (stored) |
| **Swap / drop / cover** | `Swap`: `type` 1 Swap · 2 Drop · 3 Alert; `status` 0 Pending · 1 Approved · 2 Declined · 3 Completed · 4 Canceled · 5 Expired; `user_status` adds Pending Approval / Pending Acceptance / Denied | `SwapStatus` 0/4 Pending/5 Approved/6 Cancelled/7 Declined, `SwapManageBy` | — | `swapShiftsChangeRequest`, `offerShiftRequest`; base `scheduleChangeRequest.state` pending/approved/declined, `assignedTo` sender/recipient/manager/system, `senderMessage`, `managerActionMessage` | Homebase: trade = shift-for-shift, cover = one-way, both manager-approved [R] | ChangeRequest |
| **Template** | `ScheduleTemplate` (name, date range), `ShiftTemplate` (times, position, breaks) | — | Scheduling templates [V1] | copy shifts setting | — | StaffingTemplate |
| **Skill / certification** | positions + tags (help) [R] | Training module; missing training means "not recommended", override is flagged [S] | Team assignment via tags | — | Timefold `requiredSkill` = hard [R] | Credential (with expiry) |
| **Location** | `Location` (`max_hours`, geo), `Site` (sub-location with address) | `OperationalUnit` | — | — | — | Space |
| **Break** | `ScheduledBreak` `type` 1 paid / 2 unpaid, `length`; `break_time` | `Mealbreak`, `Slots[]` paid/unpaid | — | `shiftActivity` (for example a lunch activity, `isPaid`) | — | Planned break (optional) |
| **Overtime / hour limits** | `Overtime.accountSettings`: `weeklyOvertimeThreshold` (ex. 40), `dailyOvertimeThreshold` (ex. 8), `dailyDoubleOvertimeThreshold` (ex. 10); `User.hours_max` (soft), `hours_preferred` | `Cost` | Max plans per day/month (preference warning) [R] | — | Sling OT alerts [S]; 7shifts: violations are warnings and you can still publish [S] | RuleSet params + Staff targets |
| **Rest / clopening / split** | — | — | — | — | Sling clopening: configurable minimum rest (example 10 h), **consecutive days only**, alert only [R]. Sling spread-of-hours: >10 h first-in to last-out → +1 h pay (NY rule) [R]. Timefold: ≥10 h between shifts = hard [R] | Rest + spread rules |
| **Fairness** | `hours_preferred` | — | "Up to N times per month", household preferences [R] | — | Timefold `balanceEmployeeShiftAssignments` (load-balance unfairness) [R] | Fairness score in ranking |
| **Notification** | `alerted`, `notified_at`, `acknowledged_at` | `ConfirmTime`, `ConfirmBy` | `notification_*` timestamps | Updating `sharedShift` notifies | Sling: re-notify on edit [R] | Notification outbox |
| **Audit** | `ShiftHistory.type`: created, confirmed, published, unpublished, reassigned, taken, deleted, location_changed, position_changed, position_removed, site_removed, site_changed, break_changed, break_removed, time_changed, accepted, released | `Creator`, `Created`, `Modified` | `status_updated_at`, `notification_changed_by_name` | `changeTrackedEntity`: createdBy, lastModifiedBy, timestamps | — | AuditEvent |

Shiftboard: I could not reach any primary Shiftboard or ScheduleBase developer documentation. Search returned only Rosterfy and Connecteam pages. **Shiftboard is not used as evidence here.** One Rosterfy search summary mentioned `shift_can_withdraw_limit` ("how long before the shift starts withdrawing stops being allowed") [S]. It supports the cancellation-cutoff idea in §3.7, but it is unverified.

### 2.2 Patterns worth copying
1. **Availability as exceptions, with a typed preference.** When I Work stores only `unavailable` (1) and `preferred` (2) events with RRULE recurrence [R], so the default is available. Planning Center stores blockouts with a reason and recurrence [R]. Timefold separates *unavailable* (hard) from *undesired* and *desired* (soft) [R]. Vue's staff are part-time event staff who say when they *can* work, so its whitelist windows suit them. Planner 2 keeps the windows and adds typed, dated exceptions on top.
2. **Two-phase change requests with an explicit "whose move is it".** Graph's `assignedTo` (sender/recipient/manager/system) plus `state` [R] and When I Work's `user_status` "Pending Acceptance" vs "Pending Approval" [R] separate "waiting on the coworker" from "waiting on the manager". Homebase and Sling keep the original shift on the original person until the change is approved [R][V1].
3. **Draft and shared copies, staged deletion.** Graph keeps `draftShift` and `sharedShift` side by side and stages deletes until share [R]. Vue can do the same with one `sent` snapshot per assignment. Removing a sent assignment becomes a cancellation that notifies the person, not a silent delete.
4. **Open shifts restricted to a list.** When I Work `linked_users` (null = everyone eligible) [R]. Eligibility for pickup means: holds the position/tags, no conflicting published shift, no approved time off, not hidden, and (when overlaps are allowed) same location and not over max hours [R help].
5. **First-come vs manager-picks is a per-offer flag.** `requires_openshift_approval` [R], `ApprovalRequired` [R], `isRequireAdminApproval` [R].
6. **Typed audit vocabulary.** When I Work's `ShiftHistory.type` list [R] is a ready-made action enum.
7. **Violations warn, overrides are recorded.** Deputy's `WarningOverrideComment` [R]. 7shifts says violations are warnings and you can still publish [S, page 403]. Planning Center blockouts warn [R].

### 2.3 Where Vue must differ from shift-based tools
- **The demand unit is a block inside an event, not a free-floating shift.** One person often works several blocks in a row. Rules about breaks, rest, daily hours and split shifts must use **merged work spans**. Timefold's `oneShiftPerDay` hard constraint [R] would flag every normal wedding day.
- **The guest count drives demand.** Restaurants forecast by sales. Venues get a contracted **guarantee**. Ratio rules use `guaranteedCount ?? expectedGuests`.
- **Who supplies service staff varies by event.** At many venues the caterer brings servers. So ratio suggestions need a "provided by venue / caterer" switch per role per event. The seed backs this up: a `Harvest Table Catering` vendor exists, and Johnson's reception has 1 Server for 150 guests.

---

## 3. Event and banquet rules: findings

| Rule area | What the sources say | Strength | Planner 2 default |
|---|---|---|---|
| **Staff-to-guest ratios** | Formal multi-course: "1 to 2 waiters per 10 to 12 guests"; buffet: "1 waiter per 25 guests"; cocktails: "1 bartender per 50 to 75 guests" (Dummies) [R]. Bartender baseline "1 for every 50 guests"; 100–150 guests → 2 bartenders + 1 barback (On The Fly) [R]. Plated 1 per 10–12, passed 1 per 25, buffet 1 per 3 chafing dishes; full bar 1 bartender + barback per 50, beer/wine 1 per 60–80, cocktail-heavy 1 per 30–40; captain/lead "required for crews of five or more"; plan for "10–15% no-shows" (Breakroom) [R]. | **Low.** Consumer and vendor blogs, not standards. | `RatioRule` suggestions only (soft/info), parameterised and editable. They never change requirements automatically. |
| **Minimum rest between shifts** | Oregon (500+ employees in retail, hospitality or food service): not in the first 10 hours after the previous calendar day's shift unless the employee asks; 1.5× pay if it happens [R]. Sling clopening: configurable (example 10 h), consecutive days only [R]. Timefold sample: ≥10 h, hard [R]. | Medium (law covers big employers only) | `R-REST` soft, 10 h, consecutive days only. Can be made hard in a jurisdiction pack. |
| **Max hours / overtime** | FLSA: OT after 40 hours in a workweek, which is "a fixed and regularly recurring period of 168 hours"; no federal daily OT [R]. Minnesota: OT after 48 for employers covered only by state law; FLSA-covered employers use 40 [R]. When I Work has weekly, daily and daily-double thresholds as account settings [R]. | High | `R-WEEK-OT` soft at `weeklyOvertimeHours = 40`, `workweekStart = Mon`. `R-DAY-OT` off by default (`dailyOvertimeHours = null`). `R-MAX-PREF` soft against `staff.maxHoursPerWeek`. |
| **Breaks** | Minnesota from 2026-01-01: paid ≥15-minute rest within each 4 consecutive hours; unpaid ≥30-minute meal when working 6+ consecutive hours [R, DLI]. | High (MN) | `R-MEAL` info on spans ≥ 6 h without a planned meal; `R-REST-BREAK` info on spans ≥ 4 h. Neither blocks. |
| **Split shifts / spread of hours** | Sling spread of hours: >10 h first-in to last-out → +1 h at minimum wage (a New York rule) [R]. Restaurant365 docs: split rules look at the gap between two shifts on the same day [S]. | Medium (jurisdictional) | `R-SPLIT` info when a same-day gap ≥ `splitGapHours` (1 h); `R-SPREAD` info when spread > 10 h. Both off unless the pack enables them. |
| **Call time vs service time** | A captain runs a pre-service lineup of about 12 minutes, "before guest arrival", and must confirm all staff are present (MangoApps SOP) [R]. Hotel captain job pages say functions are set 15 minutes before start [S]. Vue's own seed: Jake can't make "a 3:00 PM call time" for a block whose guests arrive 3:30 and ceremony is 4:00. | Medium | `block.start` **is** the default call time. Add optional `block.guestStart` for display. Requirement gets `callOffsetMin` (negative = earlier, e.g. Captain −30). Assignment can override `start`/`end`. |
| **Alcohol service certification** | Moorhead, MN city code: training required for managers and employees selling alcohol at on-sale licensees [R]. Statewide Minnesota requirement: **search summaries contradict each other** [S]. Deputy: missing required training → not recommended; override is flagged; training can expire [S]. | Medium on "it's local", low on Minnesota state law | `Credential` type `alcohol-service` with `expiresOn`. Bartender requirements default to `requiredCredentials: ['alcohol-service']`. `R-CRED` is hard (override with reason). Expiring within 30 days of the event is soft. |
| **Role leads** | Breakroom: captain/lead for crews of 5+ [R, low]. MangoApps: the captain assigns roles and zones at lineup [R]. The seed already has an Event Captain role and notes such as "Bar lead" and "Server lead". | Low–medium | `requirement.leadCount` (0..count) plus `staff.roles[].canLead`. `R-LEAD` hard-ish (override with reason) when a lead slot is filled by someone who can't lead. `R-LEAD-SUGGEST` info when a guest-facing block has ≥5 staff and no lead. |
| **Same-day multi-event overlap and travel** | When I Work: overlapping open-shift pickups must be at the same location [R help]. Sling: conflicts shown across positions and locations [R]. Seed: Caleb goes from Johnson Setup (Garden Terrace) to Taylor Setup (Courtyard) with a 0-minute gap. | Medium | `Space` records plus a `changeoverMin(spaceA, spaceB)` matrix (default 0 for the same space, 15 for a different space at the same venue). `R-OVERLAP` hard. `R-CHANGEOVER` soft. |
| **No-show / cancellation** | Instawork: cancel <24 h before start = late cancel; no-show = didn't come and didn't cancel, marked after 60 minutes; free cancel within 15 minutes of booking; shift must be confirmed 16 h before start [R]. NextCrew: trackable confirmation, automatic reminders, a day-before acknowledgment check, keep missed shifts as records to build reliability history [R]. | Medium (agency practice, not law) | States `cancelled` (with `lateCancel` derived from `policy.lateCancelHours = 24`) and `no_show` (only after call time + `noShowGraceMin = 60`). `confirmByHours = 48` escalation in Up Next. Reliability stats are derived and feed ranking. |
| **Backups / standby** | "10–15% no-shows", keep standby workers (Breakroom) [R, low]. Agencies bill late cancels "regardless of whether or not a standby is worked" [S]. | Low | `Assignment.kind = 'standby'`. Standby doesn't count toward coverage. **Promote** turns it into primary-accepted in one action. Suggest 1 standby per 10 staff on events ≥ 100 guests (info). |
| **Minors** | 7shifts uses birth date to apply federal hour and curfew limits [S]. | — | Out of scope (no birth dates in the model). Listed in open questions. |
| **Predictive scheduling notice** | Oregon: schedule posted 14 days ahead; premium pay for late changes [R]. | Medium (big employers only) | Optional `R-NOTICE` info: "Published less than N days before the event". Off by default. |

---

## 4. Proposed model for Staffing Planner 2

### 4.1 Principles
1. **Stored = what people decided. Derived = everything computed from it.** Open positions, coverage, conflicts, hours, fairness, suggestions and reliability are never stored.
2. **Seeds stay valid.** Every new field is optional with a default, and an adapter fills it in (§6).
3. **Rules are data.** Each rule has an id, severity, parameters and copy, so a jurisdiction pack or venue setting changes behaviour without code changes.
4. **History is append-only.** Status changes write an `AuditEvent`. Re-inviting someone creates a new assignment instead of overwriting the old one.
5. **Times stay as decimal hours on a `dateKey`** (prototype convention). A block may end after 24 (e.g. `24.5` = 12:30 AM the next day). All rule math uses `absMinutes(dateKey, h)`.

### 4.2 Entity diagram
```
RuleSet (venue settings + jurisdiction pack)            Space ──┐
                                                                 │
Couple ─1:N─ Event ─1:N─ TimelineBlock ─1:N─ StaffingRequirement ─1:N─ Assignment ─N:1─ Staff
              │  (guest counts,     (spaceId, call/      (id, role, count, leadCount,     (kind primary|standby,   │ roles[], credentials[],
              │   service flags)     guest times)         requiredCredentials, callOffset)  status, sent snapshot,  │ availability windows,
              │                                            │                                overrides[], history)   │ targets, reliability (derived)
              │                                            └─1:N─ Offer ─1:N─ OfferRecipient                         ├─1:N─ AvailabilityException
              │                                                                                                      ├─1:N─ TimeOffRequest
              ├─1:N─ (derived) OpenPosition, Coverage, Suggestion                                                    └─1:N─ Credential
              └─1:N─ AuditEvent (also feeds event Activity log)          ChangeRequest (drop|swap|cover) ─→ Assignment(s)
StaffingTemplate ─1:N─ TemplateBlock ─1:N─ TemplateRequirement          RatioRule (in RuleSet)      Notification (outbox)
```

### 4.3 Entities and fields
New fields are **bold**. Everything new is optional unless marked *req*.

#### RuleSet (one per venue; seed in a new `lib/mock/staffing2.js`)
| Field | Type | Default | Meaning |
|---|---|---|---|
| `jurisdiction` | string | `'US-MN'` | Picks the default parameters below |
| `workweekStart` | Day | `'Mon'` | FLSA fixed 168-hour workweek [R] |
| `weeklyOvertimeHours` | number | 40 | FLSA [R]. MN-only employers would use 48 [R] |
| `dailyOvertimeHours` | number \| null | null | No federal daily OT [R]; some states have it [S] |
| `maxHoursPerDay` | number \| null | 12 | Venue policy, soft |
| `minRestHours` | number \| null | 10 | Oregon / Timefold / Sling example [R] |
| `restBreakEveryHours` / `restBreakMin` | number | 4 / 15 | MN 2026 [R] |
| `mealBreakAfterHours` / `mealBreakMin` | number | 6 / 30 | MN 2026 [R] |
| `splitGapHours`, `spreadLimitHours` | number \| null | 1 / null | Split-shift and spread-of-hours info rules (off by default in MN) |
| `changeoverMin` | `{ default, sameSpace, bySpacePair? }` | `{15, 0}` | Travel and changeover buffer |
| `lateCancelHours` | number | 24 | Instawork [R] |
| `noShowGraceMin` | number | 60 | Instawork [R] |
| `confirmByHours` | number | 48 | Escalate unanswered pending (venue choice; Instawork uses 16 h [R]) |
| `credentialWarnDays` | number | 30 | Warn when a credential expires soon |
| `ruleOverrides` | `{ [ruleId]: { severity?, enabled? } }` | `{}` | Venue tuning |
| `ratioRules` | RatioRule[] | see §4.6 | Suggested headcounts |

#### Space (new)
`{ id, name, indoor: boolean }`. Seeds: `garden-terrace`, `stone-hall`, `courtyard`, `orchard-lawn`, all parsed from `event.spaces`.

#### Role (promote the `ROLES` strings to records; keep the strings as ids)
`{ id: 'Bartender', label, plural, defaultCredentials: ['alcohol-service'], canBeLead: true, venueSupplied: true }`
`plural` replaces the `ALREADY_PLURAL` special case.

#### Staff (extends)
| Field | Type | Notes |
|---|---|---|
| `role` | Role | **Kept.** Primary role, for back-compat |
| **`roles`** | `{ role, primary, canLead, since? }[]` | Adapter fills `[{ role: staff.role, primary: true, canLead: false }]`. Matches When I Work `User.positions[]` [R] |
| **`credentials`** | Credential[] | See below |
| **`skills`** | string[] | Free tags, e.g. `ceremony-setup`, `sound`. Planning Center TeamPosition `tags` [R] |
| `availability` | `{Mon..Sun: Window[]}` | **Kept** as recurring "usually free" windows |
| **`targetHoursPerWeek`** | `{ min?, max? }` | Parsed from `preferredHours` ("20–30/week" → 20/30, "Up to 40/week" → max 40). When I Work `hours_preferred` / `hours_max` [R] |
| **`maxEventsPerMonth`** | number? | Planning Center "Up To" preference [R] |
| **`active`** | boolean | Default true. Inactive = integrity block |
| **`employment`** | `'hourly'|'salaried'|'exempt'` | When I Work `User.type` bit flags [R]. Exempt staff skip OT rules |

#### Credential (new, nested in Staff)
`{ id, type: 'alcohol-service'|'food-handler'|string, issuedOn?: dateKey, expiresOn?: dateKey, verified: boolean, note? }`

#### AvailabilityException (new)
| Field | Type | Notes |
|---|---|---|
| `id`, `staffId` | string | |
| `kind` | `'unavailable'|'available'|'prefer'|'avoid'` | When I Work types 1/2 [R] + Timefold desired/undesired [R] + an extra-availability case |
| `dateKey` / `endDateKey` | dateKey | Range, inclusive |
| `start`, `end` | number? | Omit for all day |
| `repeat` | `{ every: 'week'|'month', interval: 1, until?: dateKey }?` | Simplified from Planning Center `repeat_*` [R] / RFC 5545 [R] |
| `reason` | string? | Planning Center blockout `reason` [R]; shown to managers |

**Precedence when checking one date:** approved time off > `unavailable` exception > `available` exception > recurring weekly window. `prefer`/`avoid` only affect ranking.

#### TimeOffRequest (new)
`{ id, staffId, dateKey, endDateKey, start?, end?, reason?, status: 'pending'|'approved'|'denied'|'cancelled', requestedAt, decidedBy?, decidedAt?, managerNote? }`.
Status names follow When I Work `user_status` (Pending / Canceled / Accepted / Denied / Expired [R]), with `approved` for Accepted. `expired` is derived (still pending after its start date).

#### Event (extends)
| Field | Notes |
|---|---|
| **`expectedGuests`** | Adapter: `expectedGuests ?? guests` (fixes G1) |
| **`guaranteedCount`** | `null` until the guarantee is submitted |
| **`bookingStatus`** | Adapter default `'Booked'`. `R-EVENT-NOT-BOOKED` soft blocks publish for `Inquiry`/`Tentative hold` |
| **`serviceStyle`** | `'plated'|'buffet'|'family'|'stations'|'cocktail'`. Johnson = plated (inferred from "Dinner service at 6:00 PM"; confirm) |
| **`bar`** | `'none'|'beer-wine'|'full'|'signature'` and `barStations` (Johnson note: "two bar stations") |
| **`suppliedBy`** | `{ [role]: 'venue'|'caterer' }`. Default `venue`. Gates ratio suggestions |
| **`templateId`** | The template it was built from, if any |

#### TimelineBlock (extends)
| Field | Notes |
|---|---|
| `start`, `end` | **Kept.** Meaning made explicit: staffed **call** to **release** |
| **`guestStart`**, **`guestEnd`** | Optional, display only ("Guests 3:30, ceremony 4:00") |
| **`spaceId`** | → Space. Adapter maps from `event.spaces` and the block note where possible, else the event's first space |
| **`staffed`** | Default true. Lets a run-of-show-only block like "Cocktail hour" exist without requirements (Dictionary open question 1) |

#### StaffingRequirement (extends; now has an id)
| Field | Type | Notes |
|---|---|---|
| **`id`** | string | Adapter: `${blockId}--${roleSlug}` (keeps current position ids stable). A new second requirement for the same role gets a suffix: `--bartender-2` |
| `role`, `count` | | Kept |
| **`leadCount`** | number | Default 0. Slots that need someone with `canLead` |
| **`requiredCredentials`** | string[] | Default `role.defaultCredentials` |
| **`requiredSkills`** | string[] | Soft unless listed in `hardSkills` |
| **`callOffsetMin`** | number | Default 0. −30 = arrive 30 minutes before block start |
| **`source`** | `'manual'|'template'|'ratio'` | Where the number came from, for the audit trail |
| **`standbyCount`** | number | Default 0. Wanted standby people |

#### Assignment (extends; the centre of the model)
| Field | Type | Notes |
|---|---|---|
| `id` | string | Seeds keep `${blockId}--${staffId}`. **New ones are `asg_<counter>`** so history survives re-invites (fixes G3) |
| `blockId`, `staffId`, `role` | | Kept |
| **`requirementId`** | string | Adapter derives from block + role |
| **`kind`** | `'primary'|'standby'` | Default primary |
| `status` | enum | `draft`, `pending`, `accepted`, `declined` (kept) + **`cancelled`**, **`no_show`**, **`completed`** |
| **`isLead`** | boolean | Fills a lead slot |
| **`start`, `end`** | number? | Override block times (partial or early call). Default = block ± `callOffsetMin`. Planning Center `can_accept_partial` [R] |
| **`sent`** | `{ at, start, end, role, blockId }?` | Snapshot at publish. Graph `sharedShift` [R] |
| **`respondedAt`**, `declineReason` | | `declineReason` kept. Sling makes a reason mandatory on decline [R] |
| **`cancelledAt`, `cancelledBy`** | | `'staff'` or `'manager'` |
| **`overrides`** | `{ ruleId, message, reason?, by, at }[]` | Replaces `overridden`/`warning`. Adapter maps the old pair to `[{ ruleId:'legacy', message: warning }]`; writers also keep setting `overridden`/`warning` for Planner 1 compatibility |
| **`offerId`** | string? | Set when created by claiming an offer |
| **`createdAt`, `createdBy`** | | |

#### Offer (replaces `offers[positionId] = {staffIds}`)
| Field | Type | Notes |
|---|---|---|
| `id` | string | `off_<n>` |
| `requirementId` | string | The open position it fills |
| `slots` | number | ≤ current shortfall. Graph `openSlotCount` [R], Connecteam `openSpots` [R] |
| `mode` | `'first_come'|'manager_picks'` | When I Work default first-come vs "require pickup approval" [R] |
| `recipients` | `{ staffId, sentAt, response: 'none'|'interested'|'claimed'|'passed', respondedAt? }[]` | When I Work `linked_users` [R]. `null` audience = "everyone eligible at send time" (snapshotted) |
| `status` | `'open'|'filled'|'withdrawn'|'expired'` | `filled` when claimed ≥ slots. When I Work approval statuses Pending / Approved / Canceled / Expired / Denied [R] |
| `expiresAt` | iso? | Default: 24 h before call time |
| `createdAt`, `createdBy` | | |

#### ChangeRequest (new; swap, drop, cover)
| Field | Notes |
|---|---|
| `type` | `'drop'` (release to an offer) · `'cover'` (give to a named coworker, one-way) · `'swap'` (two assignments trade people). When I Work Swap types [R]; Homebase trade vs cover [R] |
| `fromAssignmentId`, `toStaffId?`, `toAssignmentId?` | |
| `state` | `'pending_recipient'|'pending_manager'|'approved'|'declined'|'cancelled'|'expired'` |
| `assignedTo` | derived from state: `recipient` / `manager` / `none`. Graph `assignedTo` [R] |
| `senderMessage`, `managerMessage`, timestamps | Graph `senderMessage` / `managerActionMessage` [R] |
| **Invariant** | The original assignment stays `accepted` and counts until the request is `approved`. Homebase / Sling [R][V1] |

#### StaffingTemplate (new)
`{ id, name, eventType, guestRange: [min,max], blocks: [{ name, kind, relativeStart, duration, spaceRole?, requirements: [{ role, count, leadCount, callOffsetMin }] }] }`.
`relativeStart` is hours from the main guest-facing block's `guestStart`. When I Work `ScheduleTemplate` / `ShiftTemplate` [R]; Planning Center templates [V1]. "Copy staffing from another event" stays as is.

#### RatioRule (new, inside RuleSet)
`{ id, role, perGuests, min, max?, appliesTo: { blockKinds: ['guest-facing'], serviceStyle?: [...], bar?: [...] }, perStation?: number, source: 'text + URL', confidence: 'low' }`

#### Notification (new outbox; prototype only)
`{ id, staffId, kind: 'new'|'changed'|'cancelled'|'offer'|'reminder'|'change_request', assignmentIds, createdAt, sentAt?, readAt? }`. Planning Center `notification_prepared_at` / `sent_at` / `read_at` [R]. Publish writes one per person, grouped. When I Work advises publishing in bulk to cut notifications [V1].

#### AuditEvent (new)
`{ id, at, actor: staffId|'system', entity: 'assignment'|'offer'|'changeRequest'|'timeOff'|'requirement', entityId, eventId?, action, from?, to?, reason?, ruleIds? }`.
`action` vocabulary, based on When I Work `ShiftHistory.type` [R]: `created, published, accepted, declined, reassigned, time_changed, role_changed, cancelled, no_show, completed, offered, claimed, override, promoted_standby, removed`. The event Activity log tab reads these, which fixes G9.

### 4.4 Assignment lifecycle

```
                 publish                accept
   ┌─────────┐ ─────────► ┌─────────┐ ─────────► ┌──────────┐  event day passes  ┌───────────┐
   │  draft  │            │ pending │            │ accepted │ ─────────────────► │ completed │
   └─────────┘ ◄───────── └─────────┘            └──────────┘                    └───────────┘
     │   ▲   edit after publish (time/role/block) returns to pending on next publish
     │   │                    │ decline (reason req.)      │ staff cancels         │ manager marks after call + grace
     │   │                    ▼                            ▼                       ▼
  remove (hard delete,  ┌──────────┐                ┌───────────┐            ┌─────────┐
  never sent)           │ declined │                │ cancelled │            │ no_show │
                        └──────────┘                └───────────┘            └─────────┘
  manager removes a SENT assignment ───────────────► cancelled (cancelledBy: manager) + Notification
```

| From → To | Actor | Preconditions | Side effects |
|---|---|---|---|
| ∅ → draft | Manager | No live assignment for this staff on this requirement. Rules evaluated; `hard` needs a reason; `block` refuses | Audit `created` (+ `override`) |
| ∅ → accepted | System via offer claim (first-come) | Offer open, recipient listed, slot free, re-evaluated with no `block` | Offer recipient `claimed`; offer `filled` when slots are used; audit `claimed` |
| draft → pending | Manager publishes | — | `sent` snapshot; Notification `new`; audit `published` |
| draft → ∅ | Manager | Never sent | Delete. No notification |
| pending → accepted / declined | Staff (simulated) | Declined needs `declineReason` | `respondedAt`; withdraws open offers on that requirement if now covered |
| pending/accepted → draft-dirty | Manager edits time, role or block | Already sent | Status stays, `changedSinceSent` becomes true (derived). Next publish sets status → `pending` and sends `changed` (Sling re-accept [R]). Notes-only edits don't need re-confirming |
| pending/accepted → cancelled | Staff | Before call time | `lateCancel` derived if `< lateCancelHours` before call; open position reappears; audit |
| pending/accepted → cancelled | Manager removes | Was sent | Notification `cancelled` (Graph staged deletion [R]) |
| accepted → no_show | Manager | `now ≥ call + noShowGraceMin` on the event date | Reliability stat; open position reappears if the event isn't over |
| accepted → completed | System | Event date passed | Hours history for fairness |
| declined → (new assignment) | Manager re-invites | — | **New id**; `R-DECLINED-BEFORE` soft; old record kept |
| standby → primary accepted | Manager "Promote" | Standby was `accepted` | Kind changes; audit `promoted_standby` |

**Counting.** Covered = `kind === 'primary' && status === 'accepted'`. *Projected* = covered + primary `pending` (shown as hatched, never as filled). `draft` = "not sent". Standby is shown separately and never counts.

**"Live" for conflict checks** = status ∈ {draft, pending, accepted}, any kind. Standby overlaps are soft, not hard.

### 4.5 Rules catalogue

Severity: **`block`** = cannot be saved (integrity). **`hard`** = saving needs an override reason; the assignment shows a red mark. **`soft`** = warning; one-click "Assign anyway"; amber mark. **`info`** = shown in the panel and ranking only.
Who can override: `hard` → Venue Manager role (prototype: the signed-in user, Dana). `soft` → anyone who can schedule.

| Id | Rule | Default | Param | Message (manager copy) |
|---|---|---|---|---|
| I-ACTIVE | Staff inactive | block | — | "Ana is no longer active" |
| I-DUP | Same person already live on this requirement or block | block | — | "Already on this timeline block" |
| I-TIME | Assignment end ≤ start, or outside the block by more than 2 h | block | — | — |
| R-OVERLAP | Overlaps another live primary assignment (call to release) | hard | — | "Also on Reception at Taylor Engagement Party, 5:30–10:00 PM" |
| R-TIMEOFF | Approved time off overlaps | hard | — | "Approved time off: family wedding" |
| R-TIMEOFF-PENDING | Pending time-off request overlaps | soft | — | "Asked for time off (pending)" |
| R-BLOCKOUT | `unavailable` exception overlaps | hard | — | "Blocked out: exams" |
| R-AVAIL | Weekly window plus exceptions don't cover the interval | soft | — | "Free 4:00–11:00 PM only" (shows the partial window) |
| R-ROLE | Role not in `staff.roles` | soft | — | "Usually works as Server" (kept from today) |
| R-CRED | Required credential missing, or expired by the event date | hard | — | "No alcohol service certificate" / "Certificate expired Oct 1" |
| R-CRED-SOON | Credential expires within `credentialWarnDays` after the event | soft | 30 | — |
| R-LEAD | Lead slot filled by someone without `canLead` | soft | — | — |
| R-CHANGEOVER | Gap to the adjacent assignment at a different space < changeover | soft | 15 min | "No time to move from Garden Terrace to Courtyard" |
| R-REST | Gap from the previous day's last span < `minRestHours` | soft | 10 | "Only 9 h rest after Friday's rehearsal dinner" |
| R-DAY-MAX | Worked hours on the date > `maxHoursPerDay` | soft | 12 | — |
| R-DAY-OT | Worked hours on the date > `dailyOvertimeHours` | soft | off | — |
| R-WEEK-OT | Week hours (by `workweekStart`) > `weeklyOvertimeHours` | soft | 40 | "Goes into overtime (42 h this week)" |
| R-MAX-PREF | Week hours > `targetHoursPerWeek.max` | soft | — | "Over their preferred 30 h" |
| R-MONTH-PREF | Events this month > `maxEventsPerMonth` | info | — | Planning Center "Not Preferred" [R] |
| R-DECLINED-BEFORE | Has a declined record on this block | soft | — | Kept from today |
| R-AVOID / R-PREFER | Overlaps an `avoid` / `prefer` exception | info | — | Ranking only |
| R-MEAL | Span ≥ `mealBreakAfterHours` and no planned meal | info | 6 h | "Plan a 30-min meal break (6 h span)" |
| R-REST-BREAK | Span ≥ 4 h | info | 4 h | "Plan a 15-min paid rest break" |
| R-SPLIT / R-SPREAD | Same-day gap ≥ `splitGapHours` / spread > limit | info | 1 h / off | "Split shift: 9–3 and 9–11 PM" |
| R-RELIABILITY | Late cancels / no-shows in the last 180 days | info | — | "1 late cancel in the last 6 months" |
| E-RATIO | Requirement count below the ratio suggestion (event level) | info | — | "Suggested 3 Bartenders for 150 guests (1 per 50, full bar)" |
| E-LEAD-SUGGEST | Guest-facing block with ≥5 staff and no lead | info | 5 | — |
| E-NOT-BOOKED | Publishing an event that isn't `Booked` | soft | — | — |
| E-UNANSWERED | Pending with no reply within `confirmByHours` of call | Up Next `warn` → `urgent` at 24 h | 48 | "Grace hasn't replied; Reception is in 40 h" |

**Live re-evaluation.** Every rule runs over every live assignment on every state change, not just in the assign panel. An existing assignment with a new violation (for example time off approved later) shows the mark and raises an Up Next item. An override **only covers the rule id and message it was made for**. If the violation goes away, the mark goes away (derived). If a different violation appears, it needs its own override.

### 4.6 Ratio defaults (editable; all low confidence)
| Id | Role | Applies when | Formula | Source |
|---|---|---|---|---|
| ratio-bar-full | Bartender | `bar ∈ {full, signature}` | `max(1, ceil(g/50))`, plus 1 per extra `barStation` beyond what that gives | On The Fly, Dummies (50–75), Breakroom [R] |
| ratio-bar-bw | Bartender | `bar = beer-wine` | `max(1, ceil(g/75))` | Dummies 50–75, Breakroom 60–80 [R] |
| ratio-server-plated | Server | `serviceStyle = plated` and `suppliedBy.Server = venue` | `ceil(g/12)` | Dummies, Breakroom [R] |
| ratio-server-buffet | Server | buffet/stations, venue-supplied | `ceil(g/25)` | Dummies [R] |
| ratio-server-passed | Server or Event Staff | cocktail block | `ceil(g/25)` | Breakroom [R] |
| ratio-lead | Event Captain | guest-facing staff ≥ 5 | 1 | Breakroom [R] |
| ratio-standby | any | `g ≥ 100` | `ceil(total/10)` standby | Breakroom 10–15% [R] |

`g = event.guaranteedCount ?? event.expectedGuests`.

---

## 5. Pseudo-code for the key derivations

All functions are pure: `(state, seeds, ruleSet) → value`. Memoise per state version, as the current `useMemo` code does.

### 5.1 Times, intervals and work spans
```js
const abs = (dateKey, h) => dayIndex(dateKey) * 1440 + Math.round(h * 60)   // minutes since an epoch; h may be > 24
function interval(asg) {
  const { event, block } = blockById(asg.blockId)
  const req = requirementById(asg.requirementId)
  const s = asg.start ?? block.start + (req?.callOffsetMin ?? 0) / 60
  const e = asg.end ?? block.end
  return { start: abs(event.dateKey, s), end: abs(event.dateKey, e), dateKey: event.dateKey, spaceId: block.spaceId, eventId: event.id }
}
const isLive = a => ['draft', 'pending', 'accepted'].includes(a.status)

// Merge contiguous assignments into spans. Gap ≤ mergeGapMin and same event OR same space = one span.
function workSpans(staffId, assignments, { mergeGapMin = 0 } = {}) {
  const items = assignments.filter(a => a.staffId === staffId && isLive(a) && a.kind !== 'standby')
                           .map(a => ({ a, ...interval(a) })).sort((x, y) => x.start - y.start)
  const spans = []
  for (const it of items) {
    const last = spans.at(-1)
    if (last && it.start - last.end <= mergeGapMin) { last.end = Math.max(last.end, it.end); last.items.push(it) }
    else spans.push({ start: it.start, end: it.end, dateKey: it.dateKey, items: [it] })
  }
  return spans   // span length drives meal/rest-break rules; spans per date drive split/spread
}
const hoursOn = (spans, dateKey) => sum(spans.filter(s => s.dateKey === dateKey).map(s => (s.end - s.start) / 60))
const weekKey = (dateKey, ruleSet) => startOfWorkweek(dateKey, ruleSet.workweekStart)   // fixed 168 h window (FLSA)
```

### 5.2 Coverage and open positions
```js
function coverage(requirement, assignments) {
  const mine = assignments.filter(a => a.requirementId === requirement.id)
  const prim = mine.filter(a => a.kind !== 'standby')
  const n = st => prim.filter(a => a.status === st).length
  const accepted = n('accepted'), pending = n('pending'), draft = n('draft')
  const filled = Math.min(accepted, requirement.count)
  const leadsFilled = prim.filter(a => a.status === 'accepted' && a.isLead).length
  return {
    required: requirement.count, accepted, pending, draft, filled,
    short: requirement.count - filled,
    surplus: Math.max(0, accepted + pending - requirement.count),        // G10: Grace
    projectedShort: Math.max(0, requirement.count - accepted - pending),
    leadShort: Math.max(0, (requirement.leadCount ?? 0) - leadsFilled),
    standby: mine.filter(a => a.kind === 'standby' && a.status === 'accepted').length,
    declinedBy: prim.filter(a => a.status === 'declined').map(a => a.staffId),
    cancelled: prim.filter(a => a.status === 'cancelled' || a.status === 'no_show'),
  }
}
const openPositions = reqs => reqs.map(r => ({ r, c: coverage(r, A) }))
                                  .filter(({ c }) => c.short > 0 || c.leadShort > 0)
// urgency: hoursUntil(call) < 48 → urgent; event.primary → urgent (kept); else warn
```

### 5.3 Rule evaluation (conflicts)
```js
function evaluate(cand /* {staffId, requirementId, start?, end?, kind, isLead, ignoreAssignmentId?} */, ctx) {
  const v = []                             // {ruleId, severity, message, data}
  const p = staffById(cand.staffId), req = requirementById(cand.requirementId)
  const { event, block } = blockOf(req), iv = interval({ ...cand, blockId: block.id })
  const others = ctx.assignments.filter(a => a.staffId === p.id && isLive(a) && a.id !== cand.ignoreAssignmentId)

  if (!p.active) v.push(R('I-ACTIVE'))
  if (others.some(a => a.blockId === block.id)) v.push(R('I-DUP'))

  for (const o of others) {
    const oi = interval(o)
    if (oi.start < iv.end && iv.start < oi.end)
      v.push(R(o.kind === 'standby' || cand.kind === 'standby' ? 'R-OVERLAP-STANDBY' : 'R-OVERLAP', { other: o }))
    else if (oi.spaceId !== iv.spaceId) {
      const gap = oi.end <= iv.start ? iv.start - oi.end : oi.start - iv.end
      if (gap < changeover(oi.spaceId, iv.spaceId, ctx.ruleSet)) v.push(R('R-CHANGEOVER', { other: o, gap }))
    }
  }
  const tor = ctx.timeOff.filter(t => t.staffId === p.id && overlaps(t, iv))
  if (tor.some(t => t.status === 'approved')) v.push(R('R-TIMEOFF'))
  else if (tor.some(t => t.status === 'pending')) v.push(R('R-TIMEOFF-PENDING'))

  const avail = availabilityOn(p, event.dateKey, ctx.exceptions)   // windows after precedence rules
  if (avail.blockedBy) v.push(R('R-BLOCKOUT', { reason: avail.blockedBy.reason }))
  else if (!covers(avail.windows, iv)) v.push(R('R-AVAIL', { windows: avail.windows, coveredMin: overlapMin(avail.windows, iv) }))

  if (!p.roles.some(r => r.role === req.role)) v.push(R('R-ROLE'))
  if (cand.isLead && !p.roles.some(r => r.role === req.role && r.canLead)) v.push(R('R-LEAD'))
  for (const type of req.requiredCredentials ?? []) {
    const c = p.credentials.find(c => c.type === type)
    if (!c || (c.expiresOn && c.expiresOn < event.dateKey)) v.push(R('R-CRED', { type, expired: !!c }))
    else if (c.expiresOn && daysBetween(event.dateKey, c.expiresOn) <= ctx.ruleSet.credentialWarnDays) v.push(R('R-CRED-SOON'))
  }
  if (ctx.assignments.some(a => a.staffId === p.id && a.blockId === block.id && a.status === 'declined')) v.push(R('R-DECLINED-BEFORE'))

  // hours-based rules: evaluate the hypothetical schedule WITH the candidate
  const spans = workSpans(p.id, [...others, { ...cand, blockId: block.id, status: 'draft' }])
  const day = hoursOn(spans, event.dateKey), week = hoursInWeek(spans, weekKey(event.dateKey, ctx.ruleSet))
  if (ctx.ruleSet.maxHoursPerDay && day > ctx.ruleSet.maxHoursPerDay) v.push(R('R-DAY-MAX', { day }))
  if (p.employment !== 'exempt' && week > ctx.ruleSet.weeklyOvertimeHours) v.push(R('R-WEEK-OT', { week }))
  if (p.targetHoursPerWeek?.max && week > p.targetHoursPerWeek.max) v.push(R('R-MAX-PREF', { week }))
  const prev = lastSpanBefore(spans, event.dateKey), first = firstSpanOn(spans, event.dateKey)
  if (ctx.ruleSet.minRestHours && prev && first && (first.start - prev.end) / 60 < ctx.ruleSet.minRestHours) v.push(R('R-REST'))
  const mine = spans.find(s => s.start <= iv.start && iv.end <= s.end)
  if (mine && (mine.end - mine.start) / 60 >= ctx.ruleSet.mealBreakAfterHours) v.push(R('R-MEAL'))
  // R-SPLIT, R-SPREAD, R-PREFER/AVOID, R-RELIABILITY, R-MONTH-PREF similarly
  return v.map(x => ({ ...x, severity: severityFor(x.ruleId, ctx.ruleSet) }))
}

// Existing assignments: same function with ignoreAssignmentId = a.id, then subtract overrides that still match
const conflictsFor = a => evaluate({ ...a, ignoreAssignmentId: a.id }, ctx)
                   .filter(x => !a.overrides?.some(o => o.ruleId === x.ruleId && o.message === x.message))
```

### 5.4 Eligibility ranking
```js
function rankCandidates(requirement, ctx, { allRoles = false } = {}) {
  const { event, block } = blockOf(requirement)
  return staff
    .filter(p => p.active && (allRoles || p.roles.some(r => r.role === requirement.role)))
    .map(p => {
      const v = evaluate({ staffId: p.id, requirementId: requirement.id, kind: 'primary' }, ctx)
      const worst = maxSeverity(v)                                // none < info < soft < hard < block
      const reasons = []
      let score = 0
      const add = (n, why) => { score += n; reasons.push([n, why]) }
      if (p.roles.find(r => r.role === requirement.role)?.primary) add(10, 'Primary role')
      if (adjacentSameEvent(p, block, ctx)) add(15, 'Already working the block before/after')   // continuity (Omar → Ceremony)
      if (prefersDate(p, event, ctx)) add(8, 'Prefers this date')
      const week = projectedWeekHours(p, block, ctx), t = p.targetHoursPerWeek
      if (t?.min && week <= t.min) add(Math.min(10, t.min - week), 'Below their target hours')
      add(-fairnessLoad(p, ctx) * 2, 'Recent workload vs teammates')                 // §5.6
      add(-(lateCancels180(p) * 5 + noShows180(p) * 15), 'Reliability')
      for (const x of v) add(-({ info: 2, soft: 12, hard: 40, block: 1000 }[x.severity]), x.message)
      return { person: p, violations: v, worst, score, reasons }
    })
    .sort((a, b) => sevRank(a.worst) - sevRank(b.worst) || b.score - a.score || a.person.name.localeCompare(b.person.name))
}
// Groups shown in the panel: "Good fit" (none/info) · "Check first" (soft) · "Needs override" (hard) · hidden (block)
```
The panel shows `reasons`, so the ranking can always be explained. Neither Deputy's nor Homebase's recommendation logic is documented in anything I could read [S]. Vue's should be transparent.

### 5.5 Suggested headcounts
```js
function suggestions(event, ruleSet) {
  const g = event.guaranteedCount ?? event.expectedGuests
  const out = []
  for (const block of event.blocks.filter(b => b.kind === 'guest-facing' && b.staffed !== false)) {
    for (const rule of ruleSet.ratioRules.filter(r => matches(r.appliesTo, event, block))) {
      if ((event.suppliedBy?.[rule.role] ?? 'venue') !== 'venue') continue        // caterer brings servers
      let n = Math.max(rule.min ?? 0, Math.ceil(g / rule.perGuests))
      if (rule.perStation && event.barStations > n) n = event.barStations
      if (rule.max) n = Math.min(n, rule.max)
      const current = sum(block.requirements.filter(r => r.role === rule.role).map(r => r.count))
      if (n !== current) out.push({ blockId: block.id, role: rule.role, suggested: n, current, delta: n - current,
                                    basis: `1 per ${rule.perGuests} guests`, guestsUsed: g, ruleId: rule.id, confidence: 'low' })
    }
  }
  return out  // UI: "Apply" writes requirement.count with source:'ratio' + audit; never automatic
}
```

### 5.6 Fairness
```js
// Rolling 28 days around the event, same role. Load = hours + 4 × weekend evening blocks. Timefold load-balance idea [R].
function fairnessLoad(p, ctx) {
  const peers = staff.filter(s => s.roles.some(r => r.role === p.role))
  const load = s => hoursIn(s, ctx.window28) + 4 * weekendEvenings(s, ctx.window28)
  const mean = avg(peers.map(load))
  return (load(p) - mean) / Math.max(1, mean)      // > 0 = busier than average → ranking penalty
}
```

---

## 6. Migration and compatibility

**Approach:** Planner 2 reads the unchanged seed files through `normalize()` and keeps its own runtime state under **`vue-lowfi-staffing2-v1`**. Planner 1 (`vue-lowfi-prototype-v3`) is untouched, so the two can be compared side by side. Extra seed data lives in a new file, `lib/mock/staffing2.js` (rule set, spaces, extra roles, credentials, exceptions, time off). **`events.js` and `staff.js` are not edited.**

| Current | Planner 2 (adapter) |
|---|---|
| `event.guests` | `expectedGuests = guests`; `guaranteedCount = null`; `bookingStatus = 'Booked'` |
| `event.spaces` "Garden Terrace · Stone Hall" | Split into `Space` ids. `block.spaceId` from an explicit map in `staffing2.js` (e.g. `johnson-ceremony → garden-terrace`, `johnson-reception → stone-hall`, `taylor-* → courtyard`) |
| `requirement {role,count}` | `+ id = positionIdFor(blockId, role)`, `leadCount 0`, `requiredCredentials = role default`, `callOffsetMin 0`, `source 'manual'` |
| `staff.role` | `roles = [{ role, primary: true, canLead: note mentions "lead" }]` plus extras from `staffing2.js` |
| `staff.preferredHours` text | Parsed into `targetHoursPerWeek` |
| seed assignment | Keeps its id; `requirementId` derived; `kind 'primary'`; seeds that are pending/accepted/declined get `sent = { at: SEED_PUBLISHED_AT, ...times }` |
| `overridden`, `warning` | `overrides = [{ ruleId: 'legacy', message: warning }]` |
| `offers[positionId].staffIds` | `Offer { requirementId: positionId, slots: 1, mode: 'first_come', recipients }` |
| `publishedEventIds` | Derived: an event is "published" if any assignment has `sent` |
| `activityLog` (static) | Shown first, then AuditEvents |

**Suggested `staffing2.js` seed additions** (small, and each one exercises a rule):
- Credentials: Priya `alcohol-service` exp 2027-05-01; **Luis `alcohol-service` exp 2026-10-01** (valid for Johnson and Taylor on Sep 19, expired for Martinez on Oct 3).
- Extra roles: Nina also `Event Staff`; Marisol `Event Staff` with `canLead`; Priya `Bartender` with `canLead`; Theo `Event Captain` with `canLead`.
- Exception: Jake `unavailable` Sat Sep 19 before 16:00, reason "Class" (makes the existing decline reason structured).
- Time off: Ben **pending** Oct 16–17 (Chen is Oct 16; Ben isn't on Chen, so this only shows up as a candidate warning).
- Event fields: Johnson `serviceStyle 'plated'`, `bar 'full'`, `barStations 2`, `suppliedBy { Server: 'caterer' }` (open question: confirm with the pilot venue).

---

## 7. Edge cases and test scenarios

Format: **Given / When / Then**. "Seed" = no extra data needed. Times use the prototype's decimal hours.

### Coverage and lifecycle
1. **Seed: Johnson ceremony open position.** Ceremony Event Staff `count 2`; Marisol accepted, Jake declined. → `coverage.short = 1`, `declinedBy = ['jake']`, one open position `johnson-ceremony--event-staff`.
2. **Seed: surplus.** Johnson Reception Server `count 1`: Nina accepted, Grace pending → `short 0`, `surplus 1`. If Grace accepts, `filled` stays 1 and `surplus` stays 1, and there's no open position elsewhere.
3. **Re-invite after decline.** Assign Jake again to Johnson Ceremony → a new id `asg_n` is created. The old declined record still exists. `R-DECLINED-BEFORE` (soft) is shown.
4. **Edit after publish.** Change Omar's accepted Reception assignment to start 16.5 → `changedSinceSent = true` and the status shows "Changed, not sent". On publish → `pending` plus a `changed` notification. Editing only a note → no re-confirm.
5. **Remove a sent assignment.** Remove Ben (accepted, Taylor) → status `cancelled`, `cancelledBy: 'manager'`, notification `cancelled`, open position appears. Removing a **draft** (Nina on Shah) → hard delete, no notification.
6. **Late cancel.** Staff cancels an accepted assignment 20 h before call → `lateCancel = true` (< 24). Reliability count +1. The open position's urgency is `urgent` (< 48 h).
7. **No-show timing.** "Mark no-show" is disabled before call + 60 min on the event date and enabled after. Marking it reopens the position if the block hasn't ended.
8. **Standby promote.** Johnson Reception has 1 accepted standby Event Staff. Omar cancels → short 1. Promote the standby → short 0, and the standby count drops by 1.
9. **Two requirements for the same role.** Add "Bar lead" (Bartender, `leadCount 1`) next to Bartender in one block → ids `…--bartender` and `…--bartender-2`. Coverage is counted separately.
10. **Requirement count lowered below accepted.** Reception Event Staff from 2 → 1 with two accepted → `surplus 1`. The coverage badge doesn't hide shortages elsewhere (same cap as today).

### Availability, time off and credentials
11. **Seed: existing violations surface.** On load, conflicts are listed for exactly these 5: Caleb `johnson-cleanup`, Caleb `taylor-setup`, Sophie `shah-setup`, Theo `shah-dinner`, Marisol `chen-reception` (all `R-AVAIL`, soft). Up Next shows one grouped item per event.
12. **Partial window message.** Jake for Johnson Ceremony 15–17 with Sat window 16–23 → `R-AVAIL` "Free 4:00–11:00 PM only", `coveredMin = 60`.
13. **Precedence.** Weekly window says free. An `unavailable` exception on that date → `R-BLOCKOUT` (hard). Then an `available` exception on another date when the weekly window is empty → no `R-AVAIL`.
14. **Time off after the fact.** Marisol is accepted on Martinez (Oct 3). Approve her time off for Oct 3 → `R-TIMEOFF` (hard) appears on the **existing** assignment and in Up Next. Denying it removes the conflict.
15. **Credential expiry boundary.** Luis expires 2026-10-01. Johnson and Taylor (Sep 19) → `R-CRED-SOON` (12 days ≤ 30). Martinez (Oct 3) → `R-CRED` expired (hard). With `expiresOn === event.dateKey` → valid (the check is `<`).
16. **Multi-role.** Nina has roles Server and Event Staff. As a candidate for Event Staff she gets no `R-ROLE`. Grace (Server only) gets `R-ROLE` soft.

### Time math
17. **Seed: Caleb Sep 19.** Spans: 9–17.5 (Johnson Setup and Taylor Setup merge, gap 0) and 21–23. Day hours = 10.5, spread = 14 h. `R-CHANGEOVER` fires (garden-terrace → courtyard, gap 0 < 15). `R-MEAL` fires on the 8.5 h span.
18. **Seed: Sophie split shift.** 9–15 and 21–23 → `R-MEAL` on 9–15 (6 h ≥ 6). `R-SPLIT` info (gap 6 h ≥ 1). `R-SPREAD` only if the pack sets `spreadLimitHours = 10`.
19. **Seed: Marisol continuity.** Ceremony 15–17 + Reception 17–21 → one 6 h span → `R-MEAL`. Ranking for the Johnson Ceremony slot: **Omar first** (on Reception 17–21, so the continuity bonus applies and his Sat window 13–23 covers 15–17). Then Ben (`R-AVAIL`, Sat 17–23). Then Jake (`R-AVAIL` + `R-DECLINED-BEFORE`). Marisol is excluded (`I-DUP`).
20. **Rest boundary.** Add a Fri rehearsal block 18–23 for Caleb. Sat Setup at 9 → rest = 10 h → no `R-REST` (the check is `<`). Move the Friday end to 23.5 → 9.5 h → `R-REST`.
21. **After midnight.** A block 21–24.5 (ends 12:30 AM). Overlap with next-day 0–2 is detected via `abs()`. Weekly hours attribute the whole block to the start date's workweek (document this choice).
22. **Workweek boundary.** `workweekStart = 'Mon'`. Shifts on Sun (week A) and Mon (week B) don't add up. 40.0 h → no `R-WEEK-OT`; 40.25 h → `R-WEEK-OT`. An `exempt` employee → never.
23. **Overlap edge.** Block A 15–17, block B 17–21 → not overlapping (strict `<`). Add `callOffsetMin −30` to B → B starts at 16.5 → `R-OVERLAP` hard with A.
24. **Standby overlap.** Standby on Taylor 17.5–22 plus primary on Johnson Reception 17–21 → `R-OVERLAP-STANDBY` (soft), not hard.

### Offers and change requests
25. **First-come race.** Offer 1 slot to Omar and Ben. Omar claims → accepted assignment, offer `filled`. Ben claims next → refused with "Already filled", and his recipient response stays `none`.
26. **Multi-slot.** Offer with `slots 2` and 3 recipients. After 1 claim, the offer is still `open` and `short` = 1.
27. **Manager-picks mode.** Claims set `response: 'interested'`. Nothing is assigned until the manager picks, which creates an `accepted` assignment.
28. **Re-check on claim.** Between sending and claiming, the recipient gets approved time off → the claim is refused (hard violation without an override) and the manager sees why.
29. **Offer auto-withdraw.** The position gets filled another way (a direct assign is accepted) → offer `withdrawn`, and recipients get no claim option.
30. **Swap keeps liability.** Omar asks to swap his Johnson Reception with Ben's Taylor Reception. While `pending_recipient` or `pending_manager`, both originals stay `accepted` and coverage is unchanged. On `approved`, both moves are re-evaluated. Any hard violation means the manager must override or decline.
31. **Drop → offer.** Approved drop creates an Offer for that requirement. The original assignment moves to `cancelled` (`cancelledBy: 'staff'`, not late if ≥ 24 h before call) **only when someone claims** (Sling's "originator stays liable" [V1]).

### Suggestions and events
32. **Ratios.** Johnson (150 guests, full bar, 2 stations): Bartender suggested `ceil(150/50) = 3` vs 1 (delta +2). Server suppressed (`suppliedBy.Server = caterer`). Martinez 180 → Bartender 4 vs 2. Taylor 45 → 1 vs 1 → no suggestion. Shah 60 plated, venue-supplied → Server `ceil(60/12) = 5` vs 2.
33. **Guarantee wins.** Set Johnson `guaranteedCount = 132` → Bartender suggestion = 3 (`ceil(2.64)`). Requirement counts don't change until "Apply".
34. **Event not booked.** An event with `bookingStatus 'Tentative hold'` → publish shows `E-NOT-BOOKED` (soft). Drafts are allowed.
35. **Unanswered pending.** Grace pending on Johnson Reception. With the frozen clock at 10:00 on Oct 10 and a call at 17:00 that day (7 hours away) → `E-UNANSWERED` urgent. More than 24 hours away → warn.
36. **Block not staffed.** A "Cocktail hour" block with `staffed: false` and no requirements → no coverage row, no suggestions, still on the run of show.

### Integrity
37. Assignment to a deleted block or requirement → shown in an "Orphaned" list. It isn't counted and can't be published.
38. `count: 0` requirement → no slots, no open position. Assignments on it are all surplus.
39. Override recorded for `R-AVAIL` "Free 7:00 AM–5:00 PM only". The staff member later widens their window → the mark disappears. If they narrow it to a different message → a new violation, which needs a new override.
40. Reset prototype clears `vue-lowfi-staffing2-v1` only. Planner 1 state is untouched.

---

## 8. Open questions for the lead / pilot venue
1. **Who supplies servers and bartenders at the pilot venue,** the venue or the caterer? This decides whether ratio rules matter at all for Server.
2. **Jurisdiction.** Is the venue covered by FLSA (40 h) or only by Minnesota law (48 h)? Does the city require alcohol-server training (Moorhead does [R]; the state-level picture is unverified)?
3. Should `block.start` officially mean **call time**? The seed's own decline reason ("3:00 PM call time") says yes.
4. Should Planner 2 **share** assignments with Planner 1 (one truth for Up Next) or stay separate for a clean comparison? This document recommends separate, with Up Next items from Planner 2 tagged as such.
5. Do minors work events (curfews and hour caps)? If yes, add `birthDate` and a minor rule pack (7shifts does this [S]).
6. Is time-and-a-half for short rest (Oregon) relevant anywhere the venue operates? If not, keep `R-REST` soft.

---

## 9. Sources

All accessed **2026-10-09**. "Read" means the page or spec content was retrieved and used directly. "Search-summary only" means only a search engine's summary was seen. "Blocked" means retrieval failed (code given).

| # | URL | Status | Used for |
|---|---|---|---|
| 1 | https://apidocs.wheniwork.com/external/index.html | Read (Redoc loader only) | Located the spec file |
| 2 | https://apidocs.wheniwork.com/external/monolith/docs-master.json | **Read** (OpenAPI JSON, parsed) | Shift, OpenShiftApprovalRequest, Request, Swap, AvailabilityEvent, Position, Site, ScheduleTemplate, ShiftTemplate, ScheduledBreak, ShiftHistory, Overtime, User |
| 3 | https://help.wheniwork.com/articles/how-openshifts-work/ | **Read** | Open-shift eligibility, first-come vs approval |
| 4 | https://help.wheniwork.com/articles/identifying-scheduling-conflicts/ | **Read** | Shift vs availability conflicts, banner |
| 5 | https://apis.io/schemas/when-i-work/when-i-work-shift/ | Search-summary only | Superseded by #2 |
| 6 | https://developer.deputy.com/docs/roster | **Read** | Roster fields, ConfirmStatus, SwapStatus, Warning/WarningOverrideComment, Slots |
| 7 | https://developer.deputy.com/docs/shifts-overview | **Read** | Draft / open / filled states |
| 8 | https://developer.deputy.com/deputy-docs/docs/roster | Blocked (404) | — |
| 9 | https://help.deputy.com/hc/en-au/articles/4657753960463 (and …/4755140802319, …/4692576829967), https://www.deputy.com/help/adding-training-requirements/ | Search-summary only | Training requirement, expiry, override flagged |
| 10 | https://api.planningcenteronline.com/services/v2/documentation/2018-11-01/vertices/plan_person | **Read** (JSON) | PlanPerson status C/U/D, notification timestamps, can_accept_partial |
| 11 | …/vertices/needed_position | **Read** | NeededPosition quantity |
| 12 | …/vertices/blockout | **Read** | Blockout fields, repeat_* |
| 13 | …/vertices/scheduling_preference, …/team_position, …/person_team_position_assignment, …/schedule | **Read** | Preferences, tags, schedule_preference |
| 14 | https://developer.planning.center/docs/#/apps/services | Read (SPA shell; resource names only) | Resource list |
| 15 | https://help.planningcenter.com/en/142872-manage-blockout-dates.html | **Read** | Blockout UX, warning not block |
| 16 | https://help.planningcenter.com/en/142873-set-your-scheduling-preferences.html | **Read** | Max per month/day, preference warnings |
| 17 | https://help.planningcenter.com/en/manage-blockout-dates.html, …/set-your-scheduling-preferences.html | Blocked (404) | — |
| 18 | https://learn.microsoft.com/en-us/graph/api/resources/schedule?view=graph-rest-1.0 | **Read** | Schedule relationships and feature flags |
| 19 | https://learn.microsoft.com/en-us/graph/api/resources/shift?view=graph-rest-1.0 | **Read** | draftShift / sharedShift, staged deletion |
| 20 | https://learn.microsoft.com/en-us/graph/api/resources/openshift?view=graph-rest-1.0 | **Read** | Open shift |
| 21 | https://learn.microsoft.com/en-us/graph/api/resources/openshiftitem?view=graph-rest-1.0 | **Read** | openSlotCount |
| 22 | https://learn.microsoft.com/en-us/graph/api/resources/shiftitem?view=graph-rest-1.0 | **Read** | activities (breaks) |
| 23 | https://learn.microsoft.com/en-us/graph/api/resources/schedulechangerequest?view=graph-rest-1.0 | **Read** | state, assignedTo, messages |
| 24 | https://learn.microsoft.com/en-us/graph/api/resources/timeoff?view=graph-rest-1.0 | **Read** | timeOff draft/shared |
| 25 | https://developers.7shifts.com/reference/introduction | Read (no object schemas on page) | Confirms REST v2 only |
| 26 | https://developers.7shifts.com/reference/createshift | Blocked (404) | — |
| 27 | https://kb.7shifts.com/hc/en-us/articles/38813443647379-… | Blocked (403); search-summary only | "Warnings, not blockers" |
| 28 | https://kb.7shifts.com/hc/en-us/articles/50666495915667 | Search-summary only | Minor labor compliance |
| 29 | https://docs.restaurant365.com/docs/admin-page-split-rules | Search-summary only | Split / clopening rule definitions (Restaurant365, not 7shifts) |
| 30 | https://support.getsling.com/en/articles/5273200-clopening | **Read** | Clopening rule |
| 31 | https://support.getsling.com/en/articles/5410224-what-is-the-spread-of-hours-setting-for | **Read** | Spread of hours |
| 32 | https://support.getsling.com/en/articles/1821074-conflicts | **Read** | Cross-position/location conflicts |
| 33 | https://support.getsling.com/en/articles/4319967-shift-acceptance | **Read** | Accept/deny, reason required, re-notify on edit |
| 34 | https://support.getsling.com/en/articles/4683228-set-overtime | Search-summary only | OT alerts |
| 35 | https://www.joinhomebase.com/employee-scheduling/shift-swapping | **Read** (marketing page) | Trade vs cover, manager approval |
| 36 | https://www.joinhomebase.com/glossary/schedule-conflicts | Search-summary only | Conflict types, time-off limits |
| 37 | https://developer.connecteam.com/docs/scheduler-create-shifts | **Read** | openSpots, isRequireAdminApproval |
| 38 | https://developer.rosterfy.com/api-docs/openapi/shift-module/createashift | Search-summary only | shift_can_withdraw_limit |
| 39 | Shiftboard / ScheduleBase developer docs | **Not found** (no primary page surfaced) | Not used |
| 40 | https://raw.githubusercontent.com/TimefoldAI/timefold-quickstarts/stable/use-cases/employee-scheduling/src/main/java/org/acme/employeescheduling/solver/EmployeeSchedulingConstraintProvider.java | **Read** (source code) | Hard/soft constraint set |
| 41 | https://docs.timefold.ai/timefold-solver/latest/quickstart/shared/school-timetabling/school-timetabling-constraints | Blocked (404) | — |
| 42 | https://www.dol.gov/agencies/whd/fact-sheets/23-flsa-overtime-pay | **Read** | 40 h, workweek definition, no daily OT |
| 43 | https://dli.mn.gov/business/employment-practices/overtime-laws | **Read** | MN 48 h; more protective standard applies |
| 44 | https://www.dli.mn.gov/news/new-minimum-wage-rates-changes-meal-and-rest-break-laws-take-effect-jan-1-2026 | **Read** | MN rest/meal breaks 2026 |
| 45 | https://www.dli.mn.gov/business/employment-practices/minnesota-break-laws | Blocked (404) | — |
| 46 | https://www.dli.mn.gov/breaks | Search-summary only | Same break rules |
| 47 | https://www.oregon.gov/boli/workers/Pages/predictive-scheduling.aspx | **Read** | 10 h rest, 14-day notice, premiums |
| 48 | https://www.moorheadmn.gov/business-development/liquor-server-training/ | **Read** | City-mandated server training |
| 49 | https://minnesota.servingalcohol.com, https://servingalcohol.com/trends-insights/minnesota-trends/ | Search-summary only (contradictory) | MN state requirement **unverified** |
| 50 | https://dummies.com/article/how-many-servers-do-you-need-at-your-wedding-reception-172146 | **Read** (consumer guide) | Server/bartender ratios |
| 51 | https://www.ontheflytapsters.com/staffing-guide | **Read** (vendor guide) | Bartender ratios |
| 52 | https://www.breakroomapp.com/blog/large-event-catering-staffing | **Read** (vendor blog) | Ratios, lead for 5+, 10–15% no-show buffer |
| 53 | https://www.mangoapps.com/templates/sop/banquet-captain-pre-service-lineup-sop | **Read** (vendor template) | Lineup before guest arrival |
| 54 | Hotel banquet captain job postings (careers.crescenthotels.com etc.) | Search-summary only | "Functions set 15 minutes prior" |
| 55 | https://help.instawork.com/en/articles/6122001-cancellation-policy | **Read** | Late cancel 24 h, no-show 60 min, confirm by 16 h |
| 56 | https://www.nextcrew.com/blog/how-to-prevent-and-track-no-shows | **Read** (vendor blog) | Reminders, reliability history |
| 57 | https://nowsta.com/blog/hidden-cost-of-no-shows-event-staffing-operations/, https://executional.co.uk/cancellations/ | Search-summary only | Standby billing |
| 58 | `docs/research/STAFF-SCHEDULING-SOFTWARE.md` | Read (internal, v1) | [V1] items: Planning Center templates, Sling "originator stays liable", When I Work bulk publish |
| 59 | `docs/DATA-DICTIONARY.md`, `docs/STAFF-PLANNER-SPEC.md`, `lib/store.jsx`, `lib/mock/events.js`, `lib/mock/staff.js` | Read (internal code) | §1 and seed scenarios |
