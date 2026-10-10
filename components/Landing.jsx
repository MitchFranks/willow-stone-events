'use client'

// ---------------------------------------------------------------------------
// SCREEN 0 — Welcome.
//
// The one screen that is not the product. The first screenful says what Vue
// is in a single breath: one line, two buttons, and a picture of the product
// on a laptop and a phone. Scrolling down gives short sections on how it
// works, what is inside, and who it is for, each kept to a line or two.
//
// Hero photo: public/images/hero-wedding.jpg, "Elegant wedding reception
// tables with floral decorations" by Mathis Payet Descombes, Unsplash License
// (https://unsplash.com/photos/FeO_txj9yVc).
//
// The two previews are simplified drawings of the Up Next screen, mostly grey
// bars. The only words in them are the top items' titles, read from the live
// store, so the picture always matches what the product will show.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { cx } from '@/lib/cx'
import { asset } from '@/lib/asset'
import { Button, Icon } from './ui/primitives'

/** A grey placeholder line standing in for text. */
function Bar({ className }) {
  return <span className={cx('block h-1.5 rounded-full bg-line-strong', className)} />
}

/** One Up Next row: status dot, title (or a grey bar), and the action button. */
function PreviewRow({ title, urgent, first, small = false }) {
  return (
    <div className={cx('flex items-center gap-2 border-b border-line last:border-b-0', small ? 'px-3 py-2.5' : 'px-4 py-3')}>
      <span className={cx('h-2 w-2 shrink-0 rounded-full', urgent ? 'bg-status-now' : 'bg-status-soon')} />
      {title ? (
        <span className="min-w-0 flex-1 truncate text-label font-medium text-ink">{title}</span>
      ) : (
        <span className="flex-1">
          <Bar className="w-full" />
        </span>
      )}
      <span
        className={cx(
          'shrink-0 rounded-sm border px-2 py-0.5 font-medium',
          small ? 'text-[10px]' : 'text-[11px]',
          first ? 'border-ink bg-ink text-on-ink' : 'border-line-strong text-ink'
        )}
      >
        Fix
      </span>
    </div>
  )
}

function DesktopPreview({ items }) {
  return (
    <div className="overflow-hidden rounded-md border border-line-strong bg-surface shadow-raised">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface-sunken px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-line-strong" />
        ))}
      </div>
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-28 shrink-0 space-y-3 border-r border-line p-3 sm:block">
          <Bar className="w-12 bg-ink" />
          <Bar className="w-16" />
          <Bar className="w-14" />
          <Bar className="w-10" />
          <Bar className="w-16" />
        </div>
        {/* Up Next */}
        <div className="min-w-0 flex-1 p-4">
          <p className="mb-3 text-small font-medium text-ink">Up next</p>
          <div className="rounded-sm border border-line">
            {items.map((item, i) => (
              <PreviewRow key={item.id} title={item.title} urgent={item.tone === 'urgent'} first={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhonePreview({ items }) {
  return (
    <div className="w-44 shrink-0 rounded-[1.75rem] border-4 border-ink bg-surface p-1.5 shadow-raised">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong" />
      <div className="px-2 pb-1">
        <p className="mb-2 text-[11px] font-medium text-ink">Up next</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        {items.map((item, i) => (
          <PreviewRow key={item.id} small urgent={item.tone === 'urgent'} first={i === 0} />
        ))}
      </div>
      <div className="mt-3 mb-1 flex justify-around px-2">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cx('h-1.5 w-5 rounded-full', i === 0 ? 'bg-ink' : 'bg-line-strong')} />
        ))}
      </div>
    </div>
  )
}

// ---- Below the fold: short sections that explain the product. ----

const STEPS = [
  { icon: 'search', title: 'Vue spots the problem', body: 'A declined shift, an unanswered couple, a payment due.' },
  { icon: 'alert', title: 'You see why it matters', body: 'Which wedding it affects and how soon.' },
  { icon: 'check', title: 'You fix it in one click', body: 'Every item comes with the button that solves it.' }
]

const FEATURES = [
  { icon: 'list', title: 'Up Next', body: 'One list of everything that needs you, most urgent first.', href: '/up-next' },
  { icon: 'users', title: 'Staffing Planner', body: 'See open spots, text your team, and track who said yes.', href: '/staffing' },
  { icon: 'clock', title: 'Staff availability', body: 'Know who is free before you ask them to work.', href: '/staffing/team' },
  { icon: 'calendar', title: 'Events', body: 'Weddings, rehearsal dinners and brunches, each with its own run of show.', href: '/events' },
  { icon: 'mail', title: 'Messages', body: 'Couple, vendor and staff messages, filed to the right event.', href: '/messages' },
  { icon: 'dollar', title: 'Payments & documents', body: 'Balances due and contracts waiting for a signature.', href: '/events/evt-1001/payments' }
]

const AUDIENCE = [
  { title: 'Venue managers', body: 'See every wedding at a glance and stay ahead of the week.' },
  { title: 'Event staff', body: 'Get one text with your shift, and answer yes or no.' }
]

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-small font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-title font-light text-balance">{title}</h2>
    </div>
  )
}

export function Landing() {
  const { attention } = useStore()
  const items = attention.slice(0, 4)

  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas text-ink">
      {/* Transparent top bar, laid over the hero photo. */}
      <header className="absolute inset-x-0 top-0 z-10 border-b border-white/15">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 md:px-8">
          <span className="text-title font-light text-white">Vue</span>
          <Button href="/dashboard" variant="onDark" className="ml-auto">
            Open dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1">
      {/* Full-bleed photo; the dark wash keeps the white type readable. */}
      <section
        className="relative isolate bg-ink bg-cover bg-center"
        style={{ backgroundImage: `url(${asset('/images/hero-wedding.jpg')})` }}
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
      <div className="mx-auto grid w-full max-w-6xl content-center gap-12 px-4 pt-30 pb-16 md:px-8 lg:min-h-dvh lg:grid-cols-[1fr_1.2fr] lg:items-center lg:pt-14">
        <div>
          <h1 className="max-w-[16ch] text-title font-light text-balance text-white sm:text-display">
            Know what needs fixing before the wedding.
          </h1>
          <p className="mt-4 max-w-md text-heading text-white/80">
            Staff every event, answer every couple, and catch loose ends before the big day.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/up-next" variant="secondary" size="lg">
              See what&apos;s up next
              <Icon name="arrowRight" size={16} />
            </Button>
            <Button href="/staffing" variant="onDark" size="lg">
              Fill open positions
            </Button>
          </div>

          <a href="#how-it-works" className="mt-10 inline-flex items-center gap-1.5 text-small text-white/70 hover:text-white">
            How it works
            <Icon name="chevronDown" size={14} />
          </a>
        </div>

        {/* Product preview: laptop with a phone overlapping its corner. */}
        {items.length > 0 && (
          <div role="img" aria-label="Vue's Up Next list on a computer and a phone">
            {/* Small screens: just the phone. */}
            <div aria-hidden="true" className="flex justify-center sm:hidden">
              <PhonePreview items={items.slice(0, 3)} />
            </div>
            <div aria-hidden="true" className="relative hidden pr-16 pb-10 sm:block">
              <DesktopPreview items={items} />
              <div className="absolute right-0 bottom-0">
                <PhonePreview items={items.slice(0, 3)} />
              </div>
            </div>
          </div>
        )}
      </div>
      </section>

      {/* ------------------------------ how it works ----------------------------- */}
      <section id="how-it-works" className="scroll-mt-4 border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8">
          <SectionHeading eyebrow="How it works" title="Problems come to you. You don't go looking." />
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-ink">
                  <Icon name={step.icon} size={18} />
                </span>
                <p className="mt-4 text-label text-ink-muted">Step {i + 1}</p>
                <h3 className="mt-1 text-heading font-medium">{step.title}</h3>
                <p className="mt-1 text-body text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------- features ------------------------------- */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8">
          <SectionHeading eyebrow="What's inside" title="Everything a wedding venue runs on, in one place." />
          <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="bg-surface">
                <Link href={f.href} className="group block h-full p-6 transition-colors hover:bg-surface-sunken">
                  <Icon name={f.icon} size={20} className="text-accent" />
                  <h3 className="mt-4 flex items-center gap-1 text-heading font-medium">
                    {f.title}
                    <Icon name="chevronRight" size={14} className="text-ink-muted transition-transform group-hover:translate-x-0.5" />
                  </h3>
                  <p className="mt-1 text-body text-ink-muted">{f.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------- audience ------------------------------- */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8">
          <SectionHeading eyebrow="Who it's for" title="Built for the people who run the day." />
          <div className="grid gap-8 sm:grid-cols-2">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="border-l-2 border-accent pl-5">
                <h3 className="text-heading font-medium">{a.title}</h3>
                <p className="mt-1 text-body text-ink-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- closing CTA ----------------------------- */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <h2 className="max-w-lg text-title font-light text-balance">The Johnson Wedding is Saturday. Is it ready?</h2>
          <Button href="/up-next" variant="primary" size="lg">
            See what&apos;s up next
            <Icon name="arrowRight" size={16} />
          </Button>
        </div>
      </section>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-small text-ink-muted md:px-8">
          Early prototype. All data is simulated. Photo by Mathis Payet Descombes on Unsplash.
        </p>
      </footer>
    </div>
  )
}
