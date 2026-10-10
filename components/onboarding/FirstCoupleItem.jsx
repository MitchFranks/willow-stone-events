'use client'

// ---------------------------------------------------------------------------
// The first Up Next item for a new venue: "Add your couple's names".
//
// One field, one button, shown on Up Next until a couple is added. Submitting records a
// minimal couple (names, initials, id), shows a small celebration (the quick
// win), and the item leaves Up Next. The couple then appears in Couples with
// its own page.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { FIRST_COUPLE_ID } from '@/lib/onboarding'
import { Button, Icon, StatusBadge, TextInput } from '@/components/ui/primitives'
import { useOnboarding } from './OnboardingProvider'

export function FirstCoupleItem() {
  const { hydrated, couple, addCouple } = useOnboarding()
  const { toast } = useStore()
  const [names, setNames] = useState('')
  const [error, setError] = useState('')
  const [added, setAdded] = useState(null)
  const inputRef = useRef(null)
  const winRef = useRef(null)

  useEffect(() => {
    if (added) winRef.current?.focus()
  }, [added])

  if (!hydrated) return null

  if (added) {
    return (
      <section
        aria-labelledby="first-couple-win"
        className="relative mb-5 overflow-hidden rounded-md border border-status-clear-soft bg-status-clear-soft px-5 py-5"
      >
        {/* Decoration only: a few soft dots that drift up once. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {['left-[12%] bg-status-clear', 'left-[30%] bg-accent', 'left-[55%] bg-status-soon', 'left-[78%] bg-status-now', 'left-[90%] bg-status-clear'].map(
            (cls, i) => (
              <span
                key={cls}
                className={`absolute bottom-2 h-2 w-2 rounded-full opacity-0 motion-safe:animate-[vue-sparkle_1.2s_ease-out_forwards] ${cls}`}
                style={{ animationDelay: `${i * 90}ms` }}
              />
            )
          )}
        </span>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-status-clear text-on-ink motion-safe:animate-[vue-pop_.45s_ease-out]">
            <Icon name="check" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="first-couple-win" ref={winRef} tabIndex={-1} className="text-heading font-medium text-status-clear outline-none">
              Your first couple is in
            </h2>
            <p className="mt-0.5 text-body text-ink">
              {added.name} {added.name.includes('&') || / and /i.test(added.name) ? 'are' : 'is'} now in Couples. Add
              their wedding date whenever you are ready.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button href={`/couples/${FIRST_COUPLE_ID}`} variant="primary" size="sm">
              View couple
              <Icon name="arrowRight" size={13} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAdded(null)}>
              Close
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (couple) return null

  function submit(e) {
    e.preventDefault()
    if (!names.trim()) {
      setError('Type at least one name to add the couple.')
      inputRef.current?.focus()
      return
    }
    const record = addCouple(names)
    setAdded(record)
    toast(`${record.name} added to Couples.`)
  }

  return (
    <section aria-labelledby="first-couple-title" className="mb-5">
      <article className="rounded-md border border-line border-l-[3px] border-l-accent bg-surface px-5 py-4 shadow-raised">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge tone="pending" size="sm">
            Do first
          </StatusBadge>
          <span className="text-label text-ink-muted">Getting started · takes a few seconds</span>
        </div>
        <h2 id="first-couple-title" className="text-title font-medium leading-snug text-ink">
          Add your couple’s names
        </h2>
        <p className="mt-1 text-small leading-relaxed text-ink-muted">
          Start with the couple whose wedding you are working on next. Dates and details can come later.
        </p>
        <form onSubmit={submit} noValidate className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextInput
            ref={inputRef}
            id="first-couple-names"
            label="Couple’s names"
            placeholder="e.g. Ava Martin & Leo Chen"
            autoComplete="off"
            value={names}
            onChange={(e) => {
              setNames(e.target.value)
              if (error) setError('')
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'first-couple-error' : undefined}
            className="flex-1"
          />
          <Button type="submit" variant="primary" className="sm:mb-px">
            Add couple
          </Button>
        </form>
        {error && (
          <p id="first-couple-error" className="mt-1.5 text-label text-ink">
            {error}
          </p>
        )}
      </article>
    </section>
  )
}
