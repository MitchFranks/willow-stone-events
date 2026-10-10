'use client'

import { events } from '@/lib/mock/events'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { useConfirm } from '@/components/ui/domain'
import { useStaffing2 } from '@/lib/staffing/store'
import { useStore } from '@/lib/store'
import { useTimelineEdits } from '@/lib/timelineEdits'

export function usePrototypeReset() {
  const { reset: resetStore } = useStore()
  const planner = useStaffing2()
  const { resetAll: resetTimelines } = useTimelineEdits()
  const { reset: resetIntro } = useOnboarding()
  const { confirm, dialog } = useConfirm()

  const resetPrototype = () =>
    confirm({
      title: 'Reset everything?',
      body: 'Replies, tasks, messages, staffing changes, timeline edits, hidden items, and display preferences will return to the sample state. This cannot be undone.',
      confirmLabel: 'Reset everything',
      danger: true,
      onConfirm: () => {
        resetTimelines()
        planner.reset({ undoable: false, notify: false })
        resetStore()
        resetIntro('/')
      }
    })

  return { resetPrototype, dialog }
}
