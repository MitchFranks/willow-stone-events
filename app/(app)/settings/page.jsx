'use client'

// Settings: only things that really work in the prototype.
//   User guides  replay the welcome, Staffing Planner and Events guides

import { useRouter } from 'next/navigation'
import { clearPlannerGuide } from '@/components/onboarding/PlannerGuide'
import { clearEventsGuide } from '@/components/onboarding/EventsGuide'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { Breadcrumbs, Button, Card, Icon, PageHeader } from '@/components/ui/primitives'

export default function SettingsPage() {
  const { replay } = useOnboarding()
  const router = useRouter()

  // One line per guide: what it covers, and a button to run it again.
  const guides = [
    {
      id: 'welcome',
      title: 'Welcome guide',
      text: 'Welcome, choose a first task, and follow its first step. Takes you back to the dashboard. Your couples stay as they are.',
      button: 'Replay welcome guide',
      run: replay
    },
    {
      id: 'planner',
      title: 'Staffing Planner guide',
      text: 'Two steps through the Staffing Planner, pointing at the first button to click.',
      button: 'Replay planner guide',
      run: () => {
        clearPlannerGuide()
        router.push('/staffing')
      }
    },
    {
      id: 'events',
      title: 'Events guide',
      text: 'Three steps through Events: open a wedding, find its run of show, and add a block.',
      button: 'Replay events guide',
      run: () => {
        clearEventsGuide()
        router.push('/events')
      }
    }
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />
      <PageHeader title="Settings" lead="Replay any of the guides. Changes apply straight away and are kept on this device." />

      <div className="max-w-2xl space-y-4">
        <Card title="User guides" subtitle="Run any tour again." icon="list" bodyClassName="px-0 py-0">
          <ul>
            {guides.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-3.5 last:border-b-0">
                <div className="min-w-[220px] flex-1">
                  <p className="text-body font-medium text-ink">{g.title}</p>
                  <p className="mt-0.5 text-small text-ink-muted">{g.text}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={g.run}>
                  {g.button}
                  <Icon name="arrowRight" size={13} />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
