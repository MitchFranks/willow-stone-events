'use client'

// ---------------------------------------------------------------------------
// First-run guide: two standalone steps, then a short flow to the first win.
//
//   1/2  Welcome       what Vue is, that the guide is short, that it is skippable
//   2/2  What first?   three likely tasks and a "More options" list. The choice
//                      decides which flow comes next.
//   then the flow      one or two "click this next" steps (FLOWS in
//                      lib/onboarding.js), each pointing at the button to click
//                      with the glowing CoachPopover. The last click ends the
//                      guide. Choosing "Staff an upcoming wedding" hands over to
//                      the Staffing Planner guide; "Add my first couple" lands
//                      on Up Next with the add-couple field focused.
//
// Shown once per browser (GUIDE_KEY in localStorage). "Reset prototype data"
// in the sidebar calls reset() here, which brings the guide back and returns
// to the dashboard. Every step can be left with
// Skip, the close button or Esc, and the app is fully usable afterwards.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FLOWS, GUIDE_KEY, PLANNER_GUIDE_KEY, PLANNER_REPLAY_EVENT, makeCouple } from '@/lib/onboarding'
import { GuideDialog } from './GuideDialog'
import { CoachPopover } from './CoachPopover'

const OnboardingContext = createContext(null)

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writeJson(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode or blocked storage: the guide still works in memory */
  }
}

export function OnboardingProvider({ children }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  // welcome | choose | flow | done | skipped
  const [step, setStep] = useState(null)
  const [couple, setCouple] = useState(null)
  // Which first task they chose, and where they are in its flow.
  const [choice, setChoice] = useState(null)
  const [flowIndex, setFlowIndex] = useState(0)
  // One-shot: the user arrived on Up Next from the guide, so focus the field.
  const [arrivedFromGuide, setArrivedFromGuide] = useState(false)

  // Read before paint so the guide never flashes in and out on a reload.
  useLayoutEffect(() => {
    const guide = readJson(GUIDE_KEY)
    // Older saves mid-way through a step that no longer exists simply ask again.
    const saved = guide?.step === 'coach' || guide?.step === 'theme' ? 'choose' : guide?.step
    const flowOk = saved !== 'flow' || (guide?.choice && FLOWS[guide.choice])
    setStep(flowOk ? saved || 'welcome' : 'choose')
    setChoice(flowOk ? guide?.choice || null : null)
    setFlowIndex(flowOk ? guide?.flowIndex || 0 : 0)
    setCouple(guide?.couple || null)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) writeJson(GUIDE_KEY, { step, couple, choice, flowIndex })
  }, [hydrated, step, couple, choice, flowIndex])

  /** Settings: show the welcome guide again, from the dashboard. Keeps their couple. */
  const replay = useCallback(() => {
    setArrivedFromGuide(false)
    setChoice(null)
    setFlowIndex(0)
    setStep('welcome')
    router.push('/dashboard')
  }, [router])

  const skip = useCallback(() => setStep('skipped'), [])
  const start = useCallback(() => {
    setStep('choose')
    // The menu items the flows point at live in the product sidebar. The
    // welcome screen has no sidebar, so step 2 takes the user into the product.
    if (!document.querySelector('[data-onboarding="up-next"]')) router.push('/dashboard')
  }, [router])

  const back = useCallback(() => setStep((s) => (s === 'choose' ? 'welcome' : s)), [])

  /** Step 2: they picked what to do first. Start that flow. */
  const choose = useCallback((id) => {
    if (!FLOWS[id]) return
    // The planner has its own guide; make sure it shows even if it was seen before.
    if (id === 'staffing') {
      try {
        window.localStorage.removeItem(PLANNER_GUIDE_KEY)
      } catch {
        /* blocked storage */
      }
      window.dispatchEvent(new Event(PLANNER_REPLAY_EVENT))
    }
    setChoice(id)
    setFlowIndex(0)
    setStep('flow')
  }, [])

  const flow = step === 'flow' && choice ? FLOWS[choice] : null
  const flowStep = flow ? flow[Math.min(flowIndex, flow.length - 1)] : null

  // The target was clicked: next step of the flow, or the end of the guide.
  const advance = useCallback(() => {
    if (!flow) return
    if (flowIndex < flow.length - 1) {
      setFlowIndex((i) => i + 1)
      return
    }
    // The guide ends the instant the last button is clicked, and is saved as
    // done at once so it can never come back on reload.
    if (choice === 'couple') setArrivedFromGuide(true)
    setStep('done')
  }, [flow, flowIndex, choice])

  const flowBack = useCallback(() => {
    if (flowIndex > 0) setFlowIndex((i) => i - 1)
    else setStep('choose')
  }, [flowIndex])

  const addCouple = useCallback((names) => {
    const record = makeCouple(names)
    setCouple(record)
    setStep((s) => (s === 'done' || s === 'skipped' ? s : 'done'))
    return record
  }, [])

  const consumeArrival = useCallback(() => setArrivedFromGuide(false), [])

  const reset = useCallback((to = '/dashboard') => {
    writeJson(GUIDE_KEY, null)
    setCouple(null)
    setChoice(null)
    setFlowIndex(0)
    setArrivedFromGuide(false)
    setStep('welcome')
    router.push(to)
  }, [router])

  // Which sidebar item the guide is pointing at, so the sidebar can mark it.
  const guideTarget = flowStep?.target.match(/data-onboarding="([^"]+)"/)?.[1] || null

  const value = useMemo(
    () => ({
      hydrated,
      step,
      choice,
      guideTarget,
      couple,
      arrivedFromGuide,
      replay,
      addCouple,
      consumeArrival,
      skip,
      reset
    }),
    [hydrated, step, choice, guideTarget, couple, arrivedFromGuide, replay, addCouple, consumeArrival, skip, reset]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {hydrated && (step === 'welcome' || step === 'choose') && (
        <GuideDialog
          step={step}
          onNext={start}
          onBack={back}
          onChoose={choose}
          onSkip={skip}
        />
      )}
      {hydrated && flowStep && (
        <CoachPopover
          key={`${choice}-${flowIndex}`}
          target={flowStep.target}
          n={flowIndex + 1}
          total={flow.length}
          title={flowStep.title}
          body={flowStep.body}
          onBack={flowBack}
          onSkip={skip}
          onTargetClick={advance}
        />
      )}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
