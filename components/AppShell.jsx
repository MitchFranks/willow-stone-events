'use client'

// ---------------------------------------------------------------------------
// The frame around every screen.
//
// NON-LINEAR NAVIGATION: a persistent sidebar is always on screen (a slide-over
// on mobile), grouped into the four product areas. Every area is reachable from
// everywhere — there is no wizard, no forced order, and no dead ends.
//
// CONVENTIONS: left sidebar + top bar + breadcrumbs is the layout people
// already know from every admin tool they have used.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@/lib/cx'
import { upNextLabel, useStore } from '@/lib/store'
import { venue } from '@/lib/mock/events'
import { Button, Count, Icon } from './ui/primitives'
import { ToastHost } from './ui/domain'
import { useOnboarding } from './onboarding/OnboardingProvider'
import { AccountMenu } from './AccountMenu'

// The two things the product is for come first and are the only items with
// full weight: the attention queue and the staffing planner. Everything else
// is supporting context and sits under "More", visually quieter.
const NAV = [
  {
    heading: 'Do first',
    items: [
      { href: '/up-next', label: 'Up Next', icon: 'check', badge: 'attention' },
      // One workflow, one menu item. The tab bar inside it links its screens.
      { href: '/staffing', match: '/staffing', label: 'Staffing Planner', icon: 'users', badge: 'openPositions' }
    ]
  },
  {
    heading: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'home', exact: true },
      { href: '/events', label: 'Events', icon: 'list' },
      { href: '/staff', label: 'Staff Directory', icon: 'user' }
    ]
  },
  {
    heading: 'More',
    quiet: true,
    items: [
      { href: '/calendar', label: 'Calendar', icon: 'calendar' },
      { href: '/messages', label: 'Messages', icon: 'mail', badge: 'messages' },
      { href: '/couples', label: 'Couples', icon: 'users' },
      { href: '/vendors', label: 'Vendors', icon: 'truck' }
    ]
  }
]

export function AppShell({ children }) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)
  const { attention, openPositions, messageList, toasts, dismissToast } = useStore()
  const { showIntro } = useOnboarding()

  const unreplied = messageList.filter((m) => m.needsReply && !m.replied).length
  const counts = { attention: attention.filter((a) => a.tone === 'urgent').length, openPositions: openPositions.length, messages: unreplied }

  // Highlight only the most specific nav item for the current route, so a
  // parent is not also lit up on a child route. `match` lets one item own a
  // whole section (the staffing workflow owns every /staffing/* page).
  const activeHref = NAV.flatMap((g) => g.items)
    .filter((item) => {
      const base = item.match ?? item.href
      return pathname === base || (!item.exact && pathname.startsWith(`${base}/`))
    })
    .sort((a, b) => (b.match ?? b.href).length - (a.match ?? a.href).length)[0]?.href

  // Close the mobile nav whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen">
      {/* ---- Top bar ---- */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface text-ink">
        <div className="flex h-(--header-height) items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-controls="main-nav"
            className="grid h-9 w-9 place-items-center rounded-sm border border-line-strong bg-surface text-ink transition-colors hover:bg-surface-sunken lg:hidden"
          >
            <Icon name="list" size={16} />
            <span className="sr-only">Toggle navigation</span>
          </button>

          {/* No logo yet: the name is set in Geist Light wherever a mark would go. */}
          <Link href="/" className="flex items-baseline gap-3 rounded-sm" title="Back to the welcome screen">
            <span className="text-title font-light text-ink">Vue</span>
            <span className="hidden text-small text-ink-muted sm:block">Wedding venue operations</span>
          </Link>

          {/* VISIBILITY OF SYSTEM STATUS: the prototype never pretends to be real. */}
          <span className="ml-2 hidden h-6 items-center rounded-full bg-surface-sunken px-2.5 text-label font-medium text-ink-muted sm:inline-flex">
            Early prototype
          </span>

          {/* The tester's goal is always one click away. */}
          <button
            type="button"
            onClick={showIntro}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-line-strong px-3 text-small font-medium text-ink transition-colors hover:bg-surface-sunken"
          >
            <Icon name="check" size={14} className="text-accent" />
            Your goal
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/up-next"
              className="hidden h-9 items-center gap-2 rounded-sm px-3 text-small font-medium text-ink transition-colors hover:bg-surface-sunken sm:inline-flex"
            >
              <Icon
                name={counts.attention ? 'alert' : attention.length ? 'clock' : 'check'}
                size={14}
                className={counts.attention ? 'text-status-now' : attention.length ? 'text-status-soon' : 'text-status-clear'}
              />
              {upNextLabel(attention)}
            </Link>
            <div className="hidden text-right sm:block">
              <div className="text-small font-medium text-ink">{venue.manager}</div>
              <div className="text-label text-ink-muted">{venue.managerRole}</div>
            </div>
            <AccountMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ---- Sidebar ---- */}
        <aside
          id="main-nav"
          className={cx(
            'fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-y-auto border-r border-line bg-surface pt-(--header-height) transition-transform duration-200 ease-calm lg:sticky lg:top-(--header-height) lg:z-0 lg:h-[calc(100vh-var(--header-height))] lg:translate-x-0 lg:pt-0',
            navOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-3" aria-label="Main">
            {NAV.map((group) => (
              <div key={group.heading} className="mb-6">
                <div className={cx('mb-1 px-3 text-label', group.quiet ? 'text-ink-muted/70' : 'font-medium text-ink')}>{group.heading}</div>
                <ul className="space-y-px">
                  {group.items.map((item) => {
                    const active = item.href === activeHref
                    const count = item.badge ? counts[item.badge] : 0
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={cx(
                            'flex h-9 items-center gap-3 rounded-sm px-3 text-small font-medium transition-colors duration-150',
                            active
                              ? 'bg-surface-sunken text-ink font-semibold shadow-[inset_2px_0_0_var(--accent)]'
                              : group.quiet
                                ? 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                                : 'text-ink hover:bg-surface-sunken'
                          )}
                        >
                          <Icon name={item.icon} size={16} className={active ? 'text-accent' : 'text-ink-muted'} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {count > 0 && <Count tone={item.badge === 'attention' || item.badge === 'messages' ? 'urgent' : undefined}>{count}</Count>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-6 border-t border-line pt-4">
              <Button href="/events/new" variant="secondary" size="md" className="w-full">
                <Icon name="plus" size={14} />
                New event
              </Button>
              <p className="mt-3 px-3 text-label text-ink-muted">
                Simulated data. Nothing here is saved to a real system.
              </p>
            </div>
          </nav>
        </aside>

        {navOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ---- Page ---- */}
        <main className="min-w-0 flex-1 px-4 pt-8 pb-12 sm:px-8 sm:pt-12">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>
      </div>

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
