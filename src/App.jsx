// ---------------------------------------------------------------------------
// App state + navigation.
//
// GALL'S LAW: this is deliberately the simplest thing that works — two pieces
// of state and a switch. A router, a server and a real inbox can replace these
// later, but the prototype has to work first before it is allowed to get
// complicated.
//
//   screen        which of the three screens is showing
//   resolvedIds   which "needs attention" items have been cleared
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell.jsx'
import { Dashboard } from './components/Dashboard.jsx'
import { EventWorkspace } from './components/EventWorkspace.jsx'
import { Communication } from './components/Communication.jsx'
import { attentionQueue, events } from './data.js'

export default function App() {
  const [screen, setScreen] = useState('dashboard')
  const [resolvedIds, setResolvedIds] = useState([])

  // Each screen starts at the top, the way a page navigation would.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [screen])

  const attention = attentionQueue.map((item) => ({
    ...item,
    resolved: resolvedIds.includes(item.id)
  }))

  // Live per-event counts so the dashboard badge, the workspace header and the
  // stat tile can never disagree with each other.
  const eventAttention = Object.fromEntries(
    events.map((event) => [event.id, attention.filter((i) => i.eventId === event.id && !i.resolved).length])
  )

  const johnsonAttention = attention.filter((item) => item.eventId === 'johnson')
  const replySent = resolvedIds.includes('decor-time')

  function navigate(target) {
    setScreen(target)
  }

  function handleSendReply() {
    setResolvedIds((ids) => (ids.includes('decor-time') ? ids : [...ids, 'decor-time']))
  }

  const crumbs =
    screen === 'event'
      ? [{ label: 'Johnson Wedding' }]
      : screen === 'message'
        ? [
            { label: 'Johnson Wedding', to: 'event' },
            { label: 'Decorating time request' }
          ]
        : []

  return (
    <AppShell crumbs={crumbs} onNavigate={navigate}>
      {screen === 'dashboard' && (
        <Dashboard
          attention={attention}
          eventAttention={eventAttention}
          onOpenEvent={() => navigate('event')}
          onOpenMessage={() => navigate('message')}
        />
      )}

      {screen === 'event' && (
        <EventWorkspace
          attention={johnsonAttention}
          replySent={replySent}
          onBack={() => navigate('dashboard')}
          onOpenMessage={() => navigate('message')}
        />
      )}

      {screen === 'message' && (
        <Communication
          replySent={replySent}
          onSend={handleSendReply}
          onBackToEvent={() => navigate('event')}
          onBackToDashboard={() => navigate('dashboard')}
        />
      )}
    </AppShell>
  )
}
