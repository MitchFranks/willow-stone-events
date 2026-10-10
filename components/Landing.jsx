'use client'

// ---------------------------------------------------------------------------
// SCREEN 0 — Welcome.
//
// The one screen that is not the product. Its job is to say what Vue is in a
// single breath and then get out of the way: one line, two buttons, and a
// picture of the product on a laptop and a phone.
//
// The two previews are simplified drawings of the Up Next screen, mostly grey
// bars. The only words in them are the top items' titles, read from the live
// store, so the picture always matches what the product will show.
// ---------------------------------------------------------------------------

import { useStore } from '@/lib/store'
import { cx } from '@/lib/cx'
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

export function Landing() {
  const { attention } = useStore()
  const items = attention.slice(0, 4)

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 md:px-8">
          <span className="text-title font-light">Vue</span>
          <Button href="/dashboard" variant="ghost" className="ml-auto">
            Open dashboard
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <h1 className="max-w-[16ch] text-title font-light text-balance sm:text-display">
            Know what needs fixing before the wedding.
          </h1>
          <p className="mt-4 text-heading text-ink-muted">Staffing and loose ends for wedding venues.</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/up-next" variant="primary" size="lg">
              See what&apos;s up next
              <Icon name="arrowRight" size={16} />
            </Button>
            <Button href="/staffing" variant="secondary" size="lg">
              Fill open positions
            </Button>
          </div>
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
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-small text-ink-muted md:px-8">
          Early prototype. All data is simulated.
        </p>
      </footer>
    </div>
  )
}
