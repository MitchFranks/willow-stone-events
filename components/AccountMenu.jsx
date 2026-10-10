'use client'

// ---------------------------------------------------------------------------
// The signed-in person at the bottom of the sidebar, as a menu button.
//
// The button shows initials, name and role; it opens a small pop-out upward
// with two links: Account and Settings. Behaves like a menu:
// aria-haspopup / aria-expanded on the button, closes on outside click, Esc,
// Tab out and choosing an item, and focus returns to the button. Arrow keys,
// Home and End move between items; Tab and Enter work as normal.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { cx } from '@/lib/cx'
import { venue } from '@/lib/mock/events'
import { Avatar, Icon } from './ui/primitives'
import { usePrototypeReset } from '@/lib/usePrototypeReset'

const ITEMS = [
  { href: '/', label: 'Welcome page', icon: 'home' },
  { href: '/account', label: 'Account', icon: 'user' },
  { href: '/settings', label: 'Settings', icon: 'settings' }
]

export function AccountMenu() {
  const { resetPrototype, dialog } = usePrototypeReset()
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const button = useRef(null)
  const menuId = useId()

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) button.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) close(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      const links = [...(wrap.current?.querySelectorAll('[role="menuitem"]') || [])]
      const at = links.indexOf(document.activeElement)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const next = e.key === 'ArrowDown' ? (at + 1) % links.length : (at - 1 + links.length) % links.length
        links[at === -1 && e.key === 'ArrowUp' ? links.length - 1 : next]?.focus()
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        links[e.key === 'Home' ? 0 : links.length - 1]?.focus()
      } else if (e.key === 'Tab') {
        // Tabbing out of the menu closes it and lets focus carry on.
        const last = links[links.length - 1]
        const onButton = document.activeElement === button.current
        if ((!e.shiftKey && document.activeElement === last) || (e.shiftKey && onButton)) close(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-surface-sunken',
          open && 'bg-surface-sunken'
        )}
      >
        <Avatar initials={venue.managerInitials} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-medium text-ink">{venue.manager}</span>
          <span className="block truncate text-label text-ink-muted">{venue.managerRole}</span>
        </span>
        <Icon name="chevronDown" size={14} className={cx('text-ink-muted transition-transform', !open && 'rotate-180')} />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute inset-x-0 bottom-[calc(100%+8px)] z-50 overflow-hidden rounded-md border border-line bg-surface motion-safe:animate-[vue-rise_.18s_ease-out]"
        >
          <ul role="none" className="p-1.5">
            {ITEMS.map((item) => (
              <li key={item.href} role="none">
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => close()}
                  className="flex h-9 items-center gap-3 rounded-sm px-3 text-small font-medium text-ink transition-colors hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-offset-0"
                >
                  <Icon name={item.icon} size={15} className="text-ink-muted" />
                  {item.label}
                </Link>
              </li>
            ))}
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close(false)
                  resetPrototype()
                }}
                className="flex h-9 w-full items-center gap-3 rounded-sm px-3 text-left text-small font-medium text-status-now transition-colors hover:bg-status-now-soft focus-visible:bg-status-now-soft focus-visible:outline-offset-0"
              >
                <Icon name="refresh" size={15} />
                Reset prototype data
              </button>
            </li>
          </ul>
        </div>
      )}
      {dialog}
    </div>
  )
}
