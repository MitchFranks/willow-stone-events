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
import { PlannerGuide, clearPlannerGuide } from './onboarding/PlannerGuide'
import { EventsGuide, clearEventsGuide } from './onboarding/EventsGuide'

const NAV = [
  {
    heading: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'home', exact: true },
      { href: '/up-next', label: 'Up Next', icon: 'check', badge: 'attention', onboarding: 'up-next' },
      { href: '/calendar', label: 'Calendar', icon: 'calendar', onboarding: 'calendar' },
      { href: '/events', label: 'Events', icon: 'list', onboarding: 'events' }
    ]
  },
  {
    heading: 'Staffing',
    items: [
      // One workflow, one menu item. The tab bar inside it links its screens.
      {
        href: '/staffing',
        match: '/staffing',
        label: 'Staffing Planner',
        icon: 'users',
        badge: 'openPositions',
        onboarding: 'staffing'
      }
    ]
  },
  {
    heading: 'People & Comms',
    items: [
      { href: '/staff', label: 'Staff Directory', icon: 'user', onboarding: 'staff' },
      { href: '/messages', label: 'Messages', icon: 'mail', badge: 'messages', onboarding: 'messages' },
      { href: '/couples', label: 'Couples', icon: 'users' },
      { href: '/vendors', label: 'Vendors', icon: 'truck', onboarding: 'vendors' }
    ]
  }
]

export function AppShell({ children }) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)
  const { attention, openPositions, messageList, toasts, dismissToast, reset } = useStore()
  const { reset: resetGuide, guideTarget } = useOnboarding()

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
            Prototype
          </span>

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
                <div className="mb-1 px-3 text-label text-ink-muted">{group.heading}</div>
                <ul className="space-y-px">
                  {group.items.map((item) => {
                    const active = item.href === activeHref
                    // While the first-run guide points at a sidebar item, that item is marked.
                    const guided = guideTarget && item.onboarding === guideTarget && !active
                    const count = item.badge ? counts[item.badge] : 0
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          data-onboarding={item.onboarding}
                          className={cx(
                            'flex h-9 items-center gap-3 rounded-sm px-3 text-small font-medium transition-colors duration-150',
                            active
                              ? 'bg-surface-sunken text-ink font-semibold shadow-[inset_2px_0_0_var(--accent)]'
                              : guided
                                ? 'bg-surface-sunken text-accent ring-1 ring-inset ring-accent'
                                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                          )}
                        >
                          <Icon name={item.icon} size={16} className={active || guided ? 'text-accent' : 'text-ink-muted'} />
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
              <Button href="/events/new" variant="primary" size="md" className="w-full" data-onboarding="new-event">
                <Icon name="plus" size={14} />
                New event
              </Button>
              <button
                type="button"
                onClick={() => {
                  reset()
                  resetGuide()
                  clearPlannerGuide()
                  clearEventsGuide()
                }}
                className="mt-2 h-9 w-full rounded-sm px-3 text-small font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Reset prototype data
              </button>
              {/* Back to a true first visit: the same reset, every user guide, and the home page. */}
              <button
                type="button"
                onClick={() => {
                  reset()
                  resetGuide('/')
                  clearPlannerGuide()
                  clearEventsGuide()
                }}
                className="mt-2 w-full rounded-sm border border-accent-line bg-accent-soft px-3 py-2 text-label font-medium text-accent transition-colors hover:bg-accent hover:text-on-accent"
              >
                Reset Me
              </button>
              <Link href="/style-guide" className="mt-2 flex h-9 items-center justify-center rounded-sm px-3 text-small font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink">
                Style guide
              </Link>
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
      <PlannerGuide />
      <EventsGuide />
    </div>
  )
}
