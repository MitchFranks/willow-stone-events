'use client'

// ---------------------------------------------------------------------------
// First-run intro: ONE blocking modal (IntroModal) on the first load of any
// screen. It states that this is an early prototype and gives the tester their
// goal. After that there are no tours, spotlights or step-by-step popovers, so
// the app is never walked down a single path.
//
// Shown once per browser (GUIDE_KEY in localStorage). `showIntro` reopens it
// (the "Your goal" button in the top bar); `reset` ("Reset prototype data")
// clears the saved flag and shows it again.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GUIDE_KEY } from '@/lib/onboarding'
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

  const reset = useCallback((to = '/dashboard') => {
    writeJson(GUIDE_KEY, null)
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
      {hydrated && introOpen && <IntroModal onClose={closeIntro} />}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
