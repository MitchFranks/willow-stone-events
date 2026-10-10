'use client'

// ---------------------------------------------------------------------------
// SCREEN 0 — Welcome.
//
// The one screen that is not the product. Its job is to say what Vue is in a
// single breath and then get out of the way.
//
// Quiet and exact: warm stone, one light display line, one ink button, and
// three live figures set large and light. The figures are read from the live
// store rather than hard-coded, so this screen can never quote a number the
// dashboard disagrees with. No photography, no decoration: the finish comes
// from type, space and hairlines. See docs/STYLE-GUIDE.md.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { events, venue } from '@/lib/mock/events'
import { Button, Icon } from './ui/primitives'
import { UpNextItem } from './ui/domain'

export function Landing() {
  const { attention, openPositions } = useStore()
  const urgent = attention.filter((a) => a.tone === 'urgent').length
  const preview = attention.slice(0, 3)

  const figures = [
    { value: events.length, label: 'Weddings & events' },
    { value: urgent, label: 'To do first' },
    { value: openPositions.length, label: 'Open positions' }
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {/* ------------------------------ header ------------------------------ */}
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-4 md:px-8">
          <span className="flex items-baseline gap-3">
            <span className="text-title font-light">Vue</span>
            <span className="hidden text-small text-ink-muted sm:inline">Wedding venue operations</span>
          </span>

          <Button href="/dashboard" variant="ghost" className="ml-auto">
            Open dashboard
          </Button>
        </div>
      </header>

      {/* ------------------------------- hero -------------------------------- */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-2 lg:items-center">
        <div>
        <p className="text-small text-ink-muted">Wedding operations for {venue.name}</p>

        <h1 className="mt-4 max-w-[18ch] text-title font-light text-balance sm:text-display">
          See what needs you today, and fix it before the wedding.
        </h1>

        <p className="mt-6 max-w-prose text-heading text-ink-muted">
          Vue finds the open staff positions, unanswered messages, unpaid balances and unsigned documents across your
          weddings, and shows what to do about each one.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button href="/up-next" variant="primary" size="lg">
            See what&apos;s up next
            <Icon name="arrowRight" size={16} />
          </Button>
          <Button href="/staffing" variant="secondary" size="lg">
            Fill open positions
          </Button>
        </div>

        {/* Live figures, set large and light. */}
        <dl className="mt-12 hidden grid-cols-3 border-t border-line lg:grid">
          {figures.map((f, i) => (
            <div key={f.label} className={i > 0 ? 'border-l border-line pl-6 pt-6' : 'pt-6'}>
              <dt className="text-small text-ink-muted">{f.label}</dt>
              <dd className="mt-1 text-display font-light tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
        </div>

        {/* ---- Preview: the real Up Next component, read-only, from live data. ---- */}
        {preview.length > 0 && (
          <section aria-label="Preview of the Up Next list">
            <p className="mb-2 text-small text-ink-muted">What you&apos;ll see: your Up Next list</p>
            <div
              inert
              className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface shadow-raised"
            >
              {preview.map((item, i) => (
                <UpNextItem key={item.id} item={item} badge compact={i > 0} first={i === 0} />
              ))}
            </div>
            <p className="mt-3 text-small text-ink-muted">
              Each item says what is wrong, which wedding it affects, and gives one button to fix it.{' '}
              <Link href="/up-next" className="text-accent underline-offset-2 hover:underline">
                Open the full list
              </Link>
            </p>
          </section>
        )}
      </main>

      {/* ------------------------------ footer ------------------------------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-small text-ink-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>Prototype. Everything past this screen is simulated and is being tested for usability.</p>
          <span>
            {venue.manager} · {venue.today}
          </span>
        </div>
      </footer>
    </div>
  )
}
