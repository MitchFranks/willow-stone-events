'use client'

// ---------------------------------------------------------------------------
// The one thing shown on first load: a blocking modal that says, in plain
// English, (1) this is an early low-fidelity prototype and (2) what the tester
// is trying to do. It does not say which buttons to press: there is no single
// path, and the tester is free to leave through either button, Esc or the
// close button. Focus is trapped inside while it is open and returns to where
// it was afterwards. The header's "Your goal" button brings it back.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { Button, Icon } from '@/components/ui/primitives'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function IntroModal({ onClose }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    ref.current?.querySelector('[data-autofocus]')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous && previous !== document.body && document.contains(previous)) previous.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        aria-describedby="intro-body"
        className="w-full max-w-lg rounded-md border border-line-strong bg-surface p-6 text-ink sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 text-label font-medium text-ink-muted">
            Early-stage prototype
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-sm text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <Icon name="x" size={16} />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <h2 id="intro-title" className="mt-4 text-title font-light">
          Welcome to Vue
        </h2>

        <div id="intro-body" className="mt-4 space-y-5 text-body leading-relaxed">
          <p>
            This is an <strong className="font-semibold">early, low-fidelity prototype</strong> of a tool for wedding
            venue managers. The people, weddings and numbers are made up, nothing you do is saved to a real system, and
            no real messages are sent. Some details are rough on purpose: we are testing the idea, not the polish.
          </p>

          <div className="rounded-sm border border-line-strong bg-surface-sunken px-4 py-3">
            <p className="text-label font-medium text-ink-muted">Your goal</p>
            <p className="mt-1">
              You are Dana, the venue manager. <strong className="font-semibold">The Johnson Wedding is this Saturday</strong>{' '}
              and it is short on staff. Find out what needs attention and make sure the wedding is fully staffed.
            </p>
          </div>

          <p className="text-small text-ink-muted">
            There is no set route: explore however you like. Bring this back any time with &ldquo;Your goal&rdquo; at
            the top of the screen.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            I&apos;ll look around first
          </Button>
          <Button variant="primary" size="md" onClick={onClose} data-autofocus>
            Got it, let&apos;s start
            <Icon name="arrowRight" size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
