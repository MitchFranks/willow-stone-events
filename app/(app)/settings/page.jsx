'use client'

// Settings: only things that really work in the prototype.
//   Goal & notice          reopen the first-load modal
//   Hidden Up Next items   bring back everything hidden with "Hide"
//   Reset prototype data   put every screen back to its starting state (asks first)
//   Design library         the components the screens are built from, for reviewers
// These live here, not in the main menu, so the menu stays about the work.

import { useStore } from '@/lib/store'
import { useStaffing2 } from '@/lib/staffing/store'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { Breadcrumbs, Button, Card, Icon, PageHeader } from '@/components/ui/primitives'
import { useConfirm } from '@/components/ui/domain'

export default function SettingsPage() {
  const { showIntro, reset: resetIntro } = useOnboarding()
  const { reset: resetStore, dismissedCount, restoreAllAttention, toast } = useStore()
  const planner = useStaffing2()
  const { confirm, dialog } = useConfirm()

  const resetAll = () =>
    confirm({
      title: 'Reset everything?',
      body: 'Every reply, text, task and hidden item you changed goes back to how it started. This cannot be undone.',
      confirmLabel: 'Reset everything',
      danger: true,
      onConfirm: () => {
        resetStore()
        planner.reset()
        resetIntro()
        toast('The prototype is back to its starting state.')
      }
    })

  const showHidden = () => {
    restoreAllAttention()
    toast(`${dismissedCount} hidden ${dismissedCount === 1 ? 'item is' : 'items are'} back in Up Next.`)
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />
      <PageHeader title="Settings" lead="Prototype controls." />

      <div className="max-w-2xl space-y-4">
        <Card title="Your goal and the prototype notice" subtitle="The message shown when you first opened the prototype." icon="info">
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

        <Card title="Hidden Up Next items" subtitle="Items you hid with “Hide” are still open." icon="inbox">
          <p className="text-body leading-relaxed text-ink">
            {dismissedCount
              ? `${dismissedCount} ${dismissedCount === 1 ? 'item is' : 'items are'} hidden from Up Next right now.`
              : 'Nothing is hidden. Everything open is in Up Next.'}
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={showHidden} disabled={!dismissedCount}>
              Show hidden Up Next items ({dismissedCount})
            </Button>
          </div>
        </Card>

        <Card title="Reset prototype data" subtitle="Start over with the original sample weddings and staff." icon="refresh">
          <p className="text-body leading-relaxed text-ink">
            Undoes everything you have done (texts, replies, tasks, hidden items) and shows the first message again.
          </p>
          <div className="mt-4">
            <Button variant="danger" size="sm" onClick={resetAll}>
              <Icon name="refresh" size={13} />
              Reset everything
            </Button>
          </div>
        </Card>

        <Card title="Design library (for reviewers)" subtitle="Not part of the venue manager's work." icon="book">
          <p className="text-body leading-relaxed text-ink">
            Buttons, status badges, cards and Up Next items are defined once and reused on every screen. This page shows
            them all in one place.
          </p>
          <div className="mt-4">
            <Button href="/style-guide" variant="secondary" size="sm">
              Open the design library
              <Icon name="arrowRight" size={13} />
            </Button>
          </div>
        </Card>
      </div>

      {dialog}
    </div>
  )
}
