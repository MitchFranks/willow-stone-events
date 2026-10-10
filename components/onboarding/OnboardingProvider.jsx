'use client'

// ---------------------------------------------------------------------------
// First-run intro: ONE blocking modal (IntroModal) on the first load of any
// screen. It states that this is an early prototype and gives the tester their
// goal. After that there are no tours, spotlights or step-by-step popovers, so
// the app is never walked down a single path.
//
// Shown once per browser (GUIDE_KEY in localStorage). `showIntro` reopens it
// (the "Your goal" button in the top bar); `reset` ("Reset prototype data")
// clears the saved flag and shows it again. This provider also holds the
// couple added from Up Next (FirstCoupleItem), kept in the same saved key.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GUIDE_KEY, makeCouple } from '@/lib/onboarding'
import { IntroModal } from './IntroModal'

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
    /* private mode or blocked storage: the intro still works in memory */
  }
}

export function OnboardingProvider({ children }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)
  const [couple, setCouple] = useState(null)

  // Read before paint so the modal never flashes in and out on a reload.
  useLayoutEffect(() => {
    const saved = readJson(GUIDE_KEY)
    setIntroOpen(!saved?.seenIntro)
    setCouple(saved?.couple || null)
    setHydrated(true)
  }, [])

  // Written when the modal opens or closes, so closing it by any route sticks.
  useEffect(() => {
    if (hydrated) writeJson(GUIDE_KEY, { seenIntro: !introOpen, couple })
  }, [hydrated, introOpen, couple])

  const showIntro = useCallback(() => setIntroOpen(true), [])
  const closeIntro = useCallback(() => setIntroOpen(false), [])

  const addCouple = useCallback((names) => {
    const record = makeCouple(names)
    setCouple(record)
    return record
  }, [])

  const reset = useCallback(() => {
    writeJson(GUIDE_KEY, null)
    setCouple(null)
    setIntroOpen(true)
    router.push('/dashboard')
  }, [router])

  const value = useMemo(
    () => ({ hydrated, couple, addCouple, showIntro, reset }),
    [hydrated, couple, addCouple, showIntro, reset]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {hydrated && introOpen && <IntroModal onClose={closeIntro} />}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
