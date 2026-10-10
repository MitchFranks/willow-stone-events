'use client'

// ---------------------------------------------------------------------------
// The early-stage notice that sits at the top of every screen: a "Your goal"
// button that reopens the intro modal, and an "Early prototype" pill. Used by
// both the welcome screen's header and the app's top bar, so the two always
// match and the intro's "Your goal at the top of the screen" stays true.
// ---------------------------------------------------------------------------

import { Button, Icon } from '@/components/ui/primitives'
import { useOnboarding } from './OnboardingProvider'

export function PrototypeNotice() {
  const { showIntro } = useOnboarding()
  return (
    <>
      <Button variant="secondary" size="md" onClick={showIntro}>
        <Icon name="info" size={14} className="text-accent" />
        Your goal
      </Button>
      <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 text-label font-medium text-ink-muted">
        Early prototype
      </span>
    </>
  )
}
