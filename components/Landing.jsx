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

export function Landing() {
  const { attention, openPositions } = useStore()
  const urgent = attention.filter((a) => a.tone === 'urgent').length

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
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 md:px-8">
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
        <dl className="mt-16 grid max-w-3xl grid-cols-1 border-t border-line sm:grid-cols-3">
          {figures.map((f, i) => (
            <div key={f.label} className={i > 0 ? 'border-t border-line pt-6 sm:border-t-0 sm:border-l sm:pl-6' : 'pt-6'}>
              <dt className="text-small text-ink-muted">{f.label}</dt>
              <dd className="mt-1 text-display font-light tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
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
