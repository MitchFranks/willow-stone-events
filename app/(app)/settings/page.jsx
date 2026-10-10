'use client'

// Settings: only things that really work in the prototype.
//   Goal & notice          reopen the first-load modal
//   Reset prototype data   put every screen back to its starting state
//   Style guide            the design library the screens are built from
// These live here, not in the main menu, so the menu stays about the work.

import { useStore } from '@/lib/store'
import { useStaffing2 } from '@/lib/staffing/store'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { Breadcrumbs, Button, Card, Icon, PageHeader } from '@/components/ui/primitives'

export default function SettingsPage() {
  const { showIntro, reset: resetIntro } = useOnboarding()
  const { reset: resetStore } = useStore()

  const planner = useStaffing2()

  const resetAll = () => {
    resetStore()
    planner.reset()
    resetIntro()
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />
      <PageHeader title="Settings" lead="Prototype controls." />

      <div className="max-w-2xl space-y-4">
        <Card title="Your goal and the prototype notice" subtitle="The message shown when you first opened the prototype." icon="list">
          <p className="text-body leading-relaxed text-ink">
            Forgot what you are trying to do, or want to read the early-stage notice again? Your progress stays as it is.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={showIntro}>
              Show my goal
              <Icon name="arrowRight" size={13} />
            </Button>
          </div>
        </Card>

        <Card title="Reset prototype data" subtitle="Start over with the original sample weddings and staff." icon="clock">
          <p className="text-body leading-relaxed text-ink">
            Undoes everything you have done (assignments, replies, new couples) and shows the first message again.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={resetAll}>
              Reset everything
            </Button>
          </div>
        </Card>

        <Card title="Style guide" subtitle="The shared components every screen is built from." icon="users">
          <p className="text-body leading-relaxed text-ink">
            Buttons, status badges, cards and attention items are defined once and reused on every screen.
          </p>
          <div className="mt-4">
            <Button href="/style-guide" variant="secondary" size="sm">
              Open the style guide
              <Icon name="arrowRight" size={13} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
