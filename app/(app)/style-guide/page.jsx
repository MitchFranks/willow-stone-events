// Live design library, for reviewers (reached from Settings). Renders the real
// tokens and components so it can never drift from the product. The written
// rules are in docs/STYLE-GUIDE.md.

import {
  Alert,
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  Count,
  EmptyState,
  FilterChip,
  Icon,
  ListRow,
  MetricTile,
  PageHeader,
  StatusBadge,
  TextInput
} from '@/components/ui/primitives'
import { UpNextItem } from '@/components/ui/domain'
import { FilterDemo, ModalDemo } from './demos'

// Swatch classes are spelled out in full so Tailwind generates them.
const MEANING = [
  { name: 'accent', role: 'Laurel. Focus, selection, links. Never a button', swatch: 'bg-accent', text: 'text-on-accent' },
  { name: 'status-now', role: "Act today: open spots, overdue, can't make it", swatch: 'bg-status-now-soft', text: 'text-status-now' },
  { name: 'status-soon', role: 'Coming up this week, needs a look', swatch: 'bg-status-soon-soft', text: 'text-status-soon' },
  { name: 'status-clear', role: 'Handled: confirmed, staffed, paid', swatch: 'bg-status-clear-soft', text: 'text-status-clear' }
]

const NEUTRALS = [
  { name: 'ink', swatch: 'bg-ink', text: 'text-on-ink' },
  { name: 'ink-muted', swatch: 'bg-ink-muted', text: 'text-on-ink' },
  { name: 'line-strong', swatch: 'bg-line-strong', text: 'text-on-ink' },
  { name: 'line', swatch: 'bg-line', text: 'text-ink' },
  { name: 'surface-sunken', swatch: 'bg-surface-sunken', text: 'text-ink' },
  { name: 'canvas', swatch: 'bg-canvas border border-line', text: 'text-ink' },
  { name: 'surface', swatch: 'bg-surface border border-line', text: 'text-ink' }
]

const TYPE = [
  { label: 'Display · 40/44 · 300', cls: 'text-display font-light', sample: 'Johnson Wedding' },
  { label: 'Title · 24/30 · 300', cls: 'text-title font-light', sample: 'Fill the reception spots' },
  { label: 'Heading · 16/22 · 500', cls: 'text-heading font-medium', sample: 'Coming up' },
  {
    label: 'Body · 14/20 · 400',
    cls: 'text-body max-w-prose',
    sample: 'Two servers are still needed for the reception. Fill the open spots before Saturday so the Johnson Wedding is fully staffed.'
  },
  { label: 'Small · 13/18 · 400', cls: 'text-small text-ink-muted', sample: 'Received today, 8:42 AM' },
  { label: 'Numbers · Geist Mono', cls: 'font-mono text-small tabular-nums', sample: '4:30 PM · $12,480.00 · 150 guests' }
]

// One vocabulary, product-wide.
const VOCABULARY = [
  ['Up Next', 'The list of everything that needs the manager. Title case everywhere.'],
  ['Do first · Coming up', 'The two groups in Up Next: today, then this week.'],
  ['Open spot', 'A role nobody has confirmed yet: "1 open spot", "3 open spots".'],
  ['Fully staffed', 'Every spot on an event is confirmed.'],
  ['Not sent · Waiting · Confirmed · Can\'t make it', 'The four states of a staff request.'],
  ['N in Up Next', 'How many Up Next items belong to an event or couple.'],
  ['Needs reply · Replied · No reply needed', 'The states of a message.']
]

// One icon per destination. Status icons (alert, clock, check) are never nav icons.
const NAV_ICONS = [
  ['inbox', 'Up Next'],
  ['users', 'Staffing Planner'],
  ['home', 'Dashboard'],
  ['list', 'Events'],
  ['user', 'Staff Directory'],
  ['calendar', 'Calendar'],
  ['mail', 'Messages'],
  ['heart', 'Couples'],
  ['truck', 'Vendors'],
  ['settings', 'Settings'],
  ['menu', 'Mobile nav toggle']
]

const SAMPLE_ITEM = {
  id: 'sample',
  tone: 'urgent',
  title: 'Reception: 2 open spots for servers',
  what: '1 of 3 servers confirmed.',
  why: 'Saturday. Until it is filled, this block runs short-staffed.',
  eventName: 'Johnson Wedding',
  meta: 'Reception · 5:00 PM–11:00 PM',
  actionLabel: 'Fill spots',
  href: '/up-next'
}

export const metadata = { title: 'Design library — Vue' }

export default function StyleGuidePage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
          { label: 'Design library' }
        ]}
      />
      <PageHeader
        title="Design library"
        lead="For reviewers. Every screen is built from these components. Quiet on purpose: hairlines, two shadow levels, colour only for status."
      />

      <div className="space-y-6">
        <Card title="Vocabulary" subtitle="The same words on every screen, in sentence case." icon="book">
          <dl className="divide-y divide-line">
            {VOCABULARY.map(([term, meaning]) => (
              <div key={term} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[18rem_1fr] sm:gap-6">
                <dt className="font-medium text-ink">{term}</dt>
                <dd className="text-small text-ink-muted">{meaning}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Colour that means something" icon="info">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MEANING.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-md border border-line">
                <div className={`${c.swatch} ${c.text} px-4 py-6 font-medium`}>{c.name}</div>
                <p className="px-4 py-3 text-small text-ink-muted">{c.role}</p>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-6 text-small text-ink-muted">Neutrals: almost everything is ink on surface</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {NEUTRALS.map((n) => (
              <div key={n.name} className={`${n.swatch} ${n.text} rounded-sm px-3 py-4 text-label font-medium`}>
                {n.name}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Typography: Geist, never bold" icon="list">
          <dl className="divide-y divide-line">
            {TYPE.map((t) => (
              <div key={t.label} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <dt className="text-small text-ink-muted">{t.label}</dt>
                <dd className={`${t.cls} text-ink`}>{t.sample}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Icons" subtitle="One outline set. One icon per destination in the sidebar." icon="grid">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {NAV_ICONS.map(([name, label]) => (
              <li key={name} className="flex items-center gap-3 text-small text-ink">
                <Icon name={name} size={16} className="text-ink-muted" />
                {label}
                <span className="font-mono text-label text-ink-muted">{name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-small text-ink-muted">
            Status icons have fixed jobs: <Icon name="alert" size={13} className="inline" /> act now,{' '}
            <Icon name="clock" size={13} className="inline" /> coming up, <Icon name="check" size={13} className="inline" />{' '}
            handled.
          </p>
        </Card>

        <Card title="Buttons" icon="send">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg">
              Fill spots
              <Icon name="arrowRight" size={16} />
            </Button>
            <Button variant="primary">
              <Icon name="plus" size={14} />
              New event
            </Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="ghost">Hide</Button>
            <Button variant="danger">Reset everything</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
          <p className="mt-4 text-small text-ink-muted">
            One ink button per region. Buttons are never coloured: colour means state, not action.
          </p>
        </Card>

        <Card title="Status: icon and word, never colour alone" icon="check">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="urgent">Do first</StatusBadge>
            <StatusBadge tone="warn">Coming up</StatusBadge>
            <StatusBadge tone="warn">2 open spots</StatusBadge>
            <StatusBadge tone="done">Fully staffed</StatusBadge>
            <StatusBadge tone="info">Not sent</StatusBadge>
            <StatusBadge tone="pending">Waiting</StatusBadge>
            <StatusBadge tone="done">Confirmed</StatusBadge>
            <StatusBadge tone="declined">Can&apos;t make it</StatusBadge>
            <span className="ml-2 inline-flex items-center gap-2 text-small text-ink-muted">
              Counts stay neutral <Count>7</Count>
            </span>
          </div>
        </Card>

        <Card title="Filters" subtitle="Pills mean state: a pressed chip is filled ink." icon="search">
          <div className="space-y-3">
            <FilterDemo />
            <div className="flex flex-wrap gap-2">
              <FilterChip pressed count={2}>
                Pressed
              </FilterChip>
              <FilterChip count={4}>Not pressed</FilterChip>
            </div>
          </div>
        </Card>

        <Card title="Up Next item" subtitle="Status, what, which event, why, then one action." icon="inbox" bodyClassName="px-0 py-0">
          <UpNextItem item={SAMPLE_ITEM} first badge />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Cards and lists" icon="calendar" bodyClassName="px-0 py-0">
            <ListRow
              leading={<Avatar initials="EJ" />}
              title="Emily & Marcus Johnson"
              sub="Johnson Wedding · Sat, Sep 19"
              trailing={
                <StatusBadge tone="urgent" size="sm">
                  3 in Up Next
                </StatusBadge>
              }
              href="/couples/cpl-2001"
            />
            <ListRow
              leading={<Avatar initials="PS" />}
              title="Priya Shah & Dev Patel"
              sub="Shah–Patel Rehearsal Dinner · Thu, Sep 24"
              trailing={
                <StatusBadge tone="done" size="sm">
                  All set
                </StatusBadge>
              }
              href="/couples/cpl-2002"
            />
          </Card>

          <Card title="Form fields" icon="user">
            <div className="space-y-4">
              <TextInput label="Couple" id="sg-couple" placeholder="Emily & Marcus Johnson" />
              <TextInput label="Expected guests" id="sg-guests" placeholder="150" hint="You can change this until the guarantee is due." />
              <TextInput label="Event name" id="sg-error" defaultValue="" error="Add a name for the event." />
            </div>
          </Card>
        </div>

        <Card title="Overlays" subtitle="One Modal, two shapes. Escape and the backdrop always close it." icon="grid">
          <ModalDemo />
        </Card>

        <div className="grid gap-6 sm:grid-cols-3">
          <MetricTile label="Open spots" value="2" tone="urgent" sub="Across your upcoming events" />
          <MetricTile label="Confirmed" value="18" tone="done" sub="Across 2 events" />
          <MetricTile label="Tasks due" value="1" sub="In Up Next, across all events" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Alert tone="warn" title="Guarantee due Friday">
            Harvest Table needs the final count 48 hours before service.
          </Alert>
          <EmptyState title="Nothing waiting on a reply" body="Every couple and vendor message has been answered." />
        </div>
      </div>
    </div>
  )
}
