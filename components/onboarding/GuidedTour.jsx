'use client'

import { useEffect, useRef } from 'react'
import { Button, Icon } from '@/components/ui/primitives'

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

export function GuidedTour({ step, total, title, body, onBack, onNext, onExit }) {
  const ref = useRef(null)
  const exitRef = useRef(onExit)
  exitRef.current = onExit

  useEffect(() => {
    const previous = document.activeElement
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        exitRef.current()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous && previous !== document.body && document.contains(previous)) previous.focus?.()
    }
  }, [])

  useEffect(() => {
    ref.current?.querySelector('[data-autofocus]')?.focus()
  }, [step])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="w-full max-w-lg rounded-md border border-line-strong bg-surface p-6 text-ink shadow-overlay sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-label font-medium text-ink-muted">
            Optional tour · Step {step + 1} of {total}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="grid h-8 w-8 place-items-center rounded-sm text-ink-muted hover:bg-surface-sunken hover:text-ink"
            aria-label="Exit the tour"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <h2 id="tour-title" className="mt-4 text-title font-light" tabIndex={-1} data-autofocus>
          {title}
        </h2>
        <p id="tour-body" className="mt-3 text-body leading-relaxed text-ink">
          {body}
        </p>
        <p className="mt-4 text-small text-ink-muted">
          You can go back or exit the tour at any time to explore the site freely.
        </p>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onExit}>
            Exit tour
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={onBack}>
                <Icon name="arrowLeft" size={14} />
                Back
              </Button>
            )}
            <Button variant="primary" onClick={onNext}>
              {step === total - 1 ? 'Finish tour' : 'Next'}
              {step < total - 1 && <Icon name="arrowRight" size={14} />}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
