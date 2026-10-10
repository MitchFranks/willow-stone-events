'use client'

// ---------------------------------------------------------------------------
// First-run intro: a blocking modal explains the prototype and gives the
// tester their goal. It offers a skippable tour or free exploration; the tour
// can be exited at any time and never restricts navigation.
//
// Shown once per browser (GUIDE_KEY in localStorage). `showIntro` reopens it
// (the "Your goal" button in the top bar); `reset` ("Reset prototype data")
// clears the saved flag and shows it again.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GUIDE_KEY } from '@/lib/onboarding'
import { IntroModal } from './IntroModal'
import { GuidedTour } from './GuidedTour'

const OnboardingContext = createContext(null)

const TOUR_STEPS = [
  {
    path: '/dashboard',
    title: 'Your venue at a glance',
    body: 'The dashboard brings the venue’s current picture together. Up Next is the priority list, and the counters and summaries below it add context without making you search every section.'
  },
  {
    path: '/up-next',
    title: 'Find what needs attention',
    body: 'Up Next collects actionable items across events, including open staffing spots, messages, and tasks. Choose an item to go directly to the work that will resolve it.'
  },
  {
    path: '/staffing/evt-1001',
    title: 'Work through the staffing goal',
    body: 'The Staffing Planner organizes work by event, timeline block, and role. Open a staffing need, ask an available team member, and use the prototype response controls to see how a reply updates coverage.'
  },
  {
    path: '/events/evt-1001',
    title: 'Explore the event workspace',
    body: 'The event workspace brings the wedding’s timeline and supporting details together. Its tabs let you explore tasks, messages, payments, documents, and other event information in any order.'
  }
]

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
    /* private mode or blocked storage: the intro still works in memory */
  }
}

export function OnboardingProvider({ children }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)
  const [tourStep, setTourStep] = useState(null)

  // Read before paint so the modal never flashes in and out on a reload.
  useLayoutEffect(() => {
    const saved = readJson(GUIDE_KEY)
    setIntroOpen(!saved?.seenIntro)
    setHydrated(true)
  }, [])

  // Written when the modal opens or closes, so closing it by any route sticks.
  useEffect(() => {
    if (hydrated) writeJson(GUIDE_KEY, { seenIntro: !introOpen })
  }, [hydrated, introOpen])

  const showIntro = useCallback(() => setIntroOpen(true), [])
  const closeIntro = useCallback(() => setIntroOpen(false), [])
  const startTour = useCallback(() => {
    setIntroOpen(false)
    setTourStep(0)
    router.push(TOUR_STEPS[0].path)
  }, [router])
  const endTour = useCallback(() => setTourStep(null), [])
  const advanceTour = useCallback(() => {
    if (tourStep === null) return
    const next = tourStep + 1
    if (next >= TOUR_STEPS.length) {
      setTourStep(null)
      return
    }
    setTourStep(next)
    router.push(TOUR_STEPS[next].path)
  }, [router, tourStep])
  const backTour = useCallback(() => {
    if (tourStep === null || tourStep === 0) return
    const previous = tourStep - 1
    setTourStep(previous)
    router.push(TOUR_STEPS[previous].path)
  }, [router, tourStep])

  const reset = useCallback((to = '/dashboard') => {
    writeJson(GUIDE_KEY, null)
    setTourStep(null)
    router.push(to)
    setIntroOpen(true)
  }, [router])

  const value = useMemo(
    () => ({ hydrated, showIntro, reset }),
    [hydrated, showIntro, reset]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {hydrated && introOpen && <IntroModal onClose={closeIntro} onStartTour={startTour} />}
      {hydrated && tourStep !== null && (
        <GuidedTour
          step={tourStep}
          total={TOUR_STEPS.length}
          title={TOUR_STEPS[tourStep].title}
          body={TOUR_STEPS[tourStep].body}
          onBack={backTour}
          onNext={advanceTour}
          onExit={endTour}
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
