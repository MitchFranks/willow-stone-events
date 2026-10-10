# Vue — Style Guide

How Vue looks and sounds. The tokens live in `app/globals.css`; the shared components live in
`components/ui/`. A live version of this page (real components, real tokens) is at **`/style-guide`**
in the running app ("Design library (for reviewers)" in Settings). When the two disagree, the code
wins — fix this document.

**The feel:** quiet, exact and calm. Venue staff check Vue between tours, setups and phone calls,
so they should never have to learn it. Luxury here means restraint, precision and calm, not
ornament: cool stone-grey neutrals, one light display line per screen, hairlines instead of heavy boxes,
and colour only when it means something. This is an early prototype: where a photo will go there is
a labelled placeholder instead.

---

## 1. Principles

1. **One thing at a time.** Each screen has one obvious job and one primary action.
2. **Status before detail.** Lead with whether something needs the user (now / soon / clear), then
   what it is, then the details. A manager should get the answer in a five-second glance.
3. **Quiet by default, loud on purpose.** Almost everything is ink on surface. If a colour doesn't
   mean something, remove it.
4. **Familiar over clever.** Standard patterns (a list, a calendar, a form). Premium comes from type,
   spacing and finish, never from interactions someone has to learn.
5. **Dense where it's daily, open where it's rare.** Up Next and the planner use a tight rhythm;
   setup flows and detail pages relax.

---

## 2. Colour

| Token | Light | Dark | Used for |
|---|---|---|---|
| `canvas` | `#F1F2F2` | `#121314` | Page background. Cool stone grey, never pure white or black |
| `surface` | `#FAFAFA` | `#1A1B1D` | Cards, panels, inputs, modals |
| `surface-sunken` | `#E6E7E8` | `#0C0D0E` | Wells: table headers, selected nav row, chips, empty fills |
| `line` | `#DADCDE` | `#2B2D30` | Hairlines between rows and around cards (decorative) |
| `line-strong` | `#878B8F` | `#6B7075` | Borders of inputs, checkboxes and secondary buttons (3:1) |
| `ink` | `#1B1C1E` | `#ECEDEE` | Text and icons; the fill of primary buttons |
| `ink-muted` | `#55595E` | `#9FA3A8` | Secondary text: labels, metadata, helper text (5.6:1+) |
| `on-ink` | `#FAFAFA` | `#121314` | Text on an ink fill |
| `accent` (Laurel) | `#2F4A3E` | `#9CC1AE` | Focus rings, selection, links, the "now" marker. Never a button fill |
| `status-now` / `-soft` | `#A8361A` / `#F5E3DB` | `#F0896A` / `#3A1F17` | Act today: open spots, overdue, can't make it |
| `status-soon` / `-soft` | `#7C5400` / `#F2E8D1` | `#DDB25A` / `#33280F` | Coming up this week, needs a look |
| `status-clear` / `-soft` | `#2B5873` / `#DFE9EF` | `#8DBAD3` / `#172833` | Handled: confirmed, staffed, paid, signed |

**Rules**
1. **One meaning per colour.** Laurel means "selected or focused". The three status pairs mean
   now / soon / clear. Nothing else is coloured.
2. **Primary actions are ink.** Vue has no coloured primary button, so every hue stays free to mean
   a state.
3. **Never colour alone.** Every status carries an icon and a word (`StatusBadge`). `status-clear`
   is blue, not green, so now and clear are never told apart by red/green alone.
4. **Soft fill, strong text.** A `*-soft` background always carries the same family's strong text.
5. **Both themes are first-class.** Dark mode follows the OS setting. Use token utilities only
   (`bg-surface`, `text-ink-muted`): never `dark:` variants, never hex values in components, never
   `text-white` (use `text-on-ink`).

Every text token holds at least 4.5:1 on the grounds it is used on, in both themes.

---

## 3. Typography

One family: **Geist** for all UI text and **Geist Mono** for numbers that need to align (times,
money, counts in tables). Loaded with the `geist` package, so builds do not depend on Google Fonts.
Weights 300, 400 and 500 only: **Vue never uses bold.**

| Style | Utility | Size / line | Weight | Used for |
|---|---|---|---|---|
| Display | `text-display` | 40 / 44 | 300 | The one anchor fact per screen (`PageHeader` title) |
| Title | `text-title` | 24 / 30 | 300–400 | Modal titles, page titles on small screens |
| Heading | `text-heading` | 16 / 22 | 500 | Card titles, list item titles, leads |
| Body | `text-body` | 14 / 20 | 400 | Default UI text |
| Small | `text-small` | 13 / 18 | 400–500 | Labels above values, metadata, buttons, tabs |
| Label | `text-label` | 12 / 16 | 500 | Status chips, counts, captions |

A light weight at a large size is the signature: it reads as expensive, where heavy weights read as
loud. Sentence case everywhere; no all-caps labels. Keep reading text under 72 characters wide.

---

## 4. Space, shape and depth

- **Spacing** is a 4px unit fixed in px (`--spacing: 4px`). Use steps 1, 2, 3, 4, 6, 8 and 12
  (4–48px). Card padding is `px-6 py-4` (`px-4` on phones); page sections are 24–48px apart.
- **Radius:** `rounded-sm` (6px) for controls (buttons, inputs, menu items, nav rows),
  `rounded-md` (12px) for containers (cards, modals, toasts), `rounded-full` only for status chips,
  filter chips, counts and avatars. **A pill always means a state, never an action.**
- **Depth:** two levels. `shadow-raised` for cards on the canvas, `shadow-overlay` for anything
  floating (menus, modals, sheets, toasts). No glass, blur or glows; the landing hero's dark wash
  over its photo is the one gradient.
- **Motion** confirms, it doesn't decorate: 150ms for hover and press, about 200ms for panels, with
  `ease-calm` (`cubic-bezier(0.2, 0, 0, 1)`). Nothing lifts on hover; colour changes instead.
  `prefers-reduced-motion` is respected globally.
- **Focus** is a 2px solid Laurel ring with a 2px offset on every interactive element. Never remove
  it (`focus:outline-none` is not allowed).

---

## 5. Components

Always use the shared component rather than restyling by hand.

| Need | Use |
|---|---|
| Any action | `Button` — `primary` (ink fill, one per region), `secondary` (bordered), `ghost` (borderless), `danger` (bordered, status-now text). Sizes `sm` / `md` / `lg` |
| A status | `StatusBadge tone="urgent \| warn \| done \| pending \| info \| declined \| empty"` |
| A count behind a tab or nav item | `Count` (neutral; hide it at zero). In the sidebar it carries a label for tooltips and screen readers ("2 to do first") |
| Filters | `FilterChip` (a toggle with `aria-pressed`; pressed = ink fill) inside a labelled `FilterGroup` |
| A grouped subject | `Card` (one card = one subject; the border never takes a status colour) |
| A list of things | `ListRow` inside `Card bodyClassName="px-0 py-0"`; `UpNextItem` lists sit in a `divide-y divide-line` container inside a `Card` |
| An Up Next item | `UpNextItem` (`first` for the one filled button on the page; `onDismiss` with `useHideWithUndo` adds "Hide" + an Undo toast, only on `dismissible` items — never staffing) |
| An unfilled-role count | `openSpots(n)` → "1 open spot", "3 open spots" |
| A number with a label | `MetricTile` (large, light figure) |
| A person | `Avatar` (initials, no colour per person) |
| Messages to the user | `Alert` (inline), toast (transient; may carry `actions` such as Undo), `EmptyState` (nothing here yet) |
| An overlay | `Modal` — `variant="dialog"` (centred: confirmations, short forms) or `variant="sheet"` (right-hand panel, bottom sheet on phones: longer work) |
| A destructive action | `useConfirm()` with `danger: true` before it runs |
| Page navigation | `Breadcrumbs` + `Tabs` (underline tabs, each its own URL) |
| Forms | `TextInput`, `Select`, `Textarea`: label above in `text-small`, hint below. Pass `error` to show a validation message (status-now, with a glyph) in place of the hint |
| Account menu | `AccountMenu` |

`Button variant="onDark"` is a white outline for use only on the landing page's dark hero.

**Layout:** a fixed sidebar (sunken active row with a Laurel marker), a 56px top bar, content up to
1120px wide, 32–48px of space above each page title.

**Navigation icons**, one per destination (never reuse one across destinations, never use a status
icon for navigation):

| Icon | Destination |
|---|---|
| `inbox` | Up Next |
| `users` | Staffing Planner |
| `home` | Dashboard |
| `list` | Events |
| `user` | Staff Directory |
| `calendar` | Calendar |
| `mail` | Messages |
| `heart` | Couples |
| `truck` | Vendors |
| `settings` | Settings |
| `menu` | The mobile nav toggle |

Status icons have fixed jobs: `alert` act now, `clock` coming up, `check` handled.

**No logo yet.** The name "Vue" is set in Geist Light wherever a mark would go.

---

## 6. Voice

- Plain words, sentence case, no jargon the venue manager would not say out loud.
- Lead with the fact the user acts on: "Reception: 2 open spots for servers. Fill spots."
- Wedding vocabulary first: couple, guarantee, run of show, timeline block, open spot. The
  canonical terms are in [`DATA-DICTIONARY.md`](./DATA-DICTIONARY.md).
- **One vocabulary, product-wide:**
  - **Up Next** (title case everywhere: page titles, headings, nav, breadcrumbs, toasts).
  - **Do first** / **Coming up** for the two groups in Up Next.
  - An unfilled role is an **open spot** ("1 open spot", "3 open spots"); a covered event is
    **Fully staffed**.
  - A staff request is **Not sent · Waiting · Confirmed · Can't make it**.
  - A message **Needs reply · Replied · No reply needed**.
  - An event's or couple's share of the queue reads **N in Up Next**.
  - Labels and headings are in sentence case.
- Calm, not cute. No exclamation marks in errors, no emoji, no "magical" or "special day".
- Button labels are verbs: "Send reply", "Fill spots", never "OK" or "Submit".

---

## 7. Priority without stress ("Up Next")

Operations software tends to shout. Vue should not. Priority is conveyed by **order, wording and
one quiet chip**, not by alarm screens or ever-growing red counts.

- The list is called **Up Next**. Items are **Do first** (`status-now` chip) or **Coming up**
  (`status-soon` chip). Only the first item gets the filled button.
- Counters show only what to do first (`2 to do first`), never the total backlog. Empty = **All caught up**.
- Counts in the sidebar, top bar and tabs are neutral. Never a red badge for a plain count; the
  chip on the row carries the urgency. The one exception is the Up Next sidebar count, which counts
  only Do first items and is labelled "N to do first".
- Shortages say **1 open spot**, not "Short 1" or "-1". Titles say what to do ("Reply to Emily Johnson"), not what is wrong.
- Non-staffing items can be hidden ("Hide", with Undo). Staffing items cannot: hiding them would look
  like fixing them. Hidden items come back from "N hidden · Show them" on Up Next or from Settings.

---

## 8. Do / don't

| Do | Don't |
|---|---|
| One ink primary button per region | Two competing primary buttons, or a coloured one |
| Token utilities (`text-ink-muted`, `bg-status-now-soft`) | Hex values, `text-white`, `dark:` variants |
| `rounded-sm` controls, `rounded-md` containers | Pill-shaped buttons, nav items or inputs |
| `shadow-raised` / `shadow-overlay` tokens | Custom `shadow-[...]` values, hover lifts |
| Pair every status colour with an icon and a word | Rely on colour to say "urgent" |
| Weights 300–500 | `font-semibold`, `font-bold`, `font-extrabold` |
| The type scale (`text-small`, `text-heading`...) | Arbitrary sizes like `text-[13px]` |
| Keep copy in sentence case | ALL CAPS LABELS |

---

## 9. Changing the look

Edit tokens in `app/globals.css`: the raw values at the top (light, then dark), mapped into
Tailwind by `@theme inline`. Because components only use the semantic names, a re-skin is a token
change, not a component hunt. If you add a token, add it to the table in section 2 and to the
`/style-guide` page.
