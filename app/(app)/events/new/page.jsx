'use client'

// ---------------------------------------------------------------------------
// SCREEN 14 — Create Event.
//
// Demonstrates that the platform is not wedding-only: the Event Type selector
// changes which optional fields appear. The form validates (errors in red,
// next to the field), then shows a summary to confirm. Being a prototype it
// does not actually persist a new event, and says so plainly.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENT_TYPES } from '@/lib/mock/events'
import { useStore } from '@/lib/store'
import { Alert, Breadcrumbs, Button, Card, Field, PageHeader, Select, TextInput, Textarea } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/domain'

// Different event types expose slightly different optional fields, but they
// all share the same underlying structure.
const EXTRA_FIELDS = {
  Wedding: [
    { id: 'ceremony-time', label: 'Ceremony time', placeholder: '4:00 PM' },
    { id: 'rehearsal', label: 'Rehearsal date', placeholder: 'Friday before' }
  ],
  'Rehearsal Dinner': [{ id: 'wedding-date', label: 'Wedding date', placeholder: 'The day after' }],
  'Engagement Party': [{ id: 'hosted-by', label: 'Hosted by', placeholder: 'Parents of the couple' }],
  'Bridal Shower': [{ id: 'honoree', label: 'Guest of honor', placeholder: '' }],
  'Welcome Party': [{ id: 'arrivals', label: 'Out-of-town guests', placeholder: '60' }],
  'Farewell Brunch': [{ id: 'brunch-time', label: 'Brunch time', placeholder: '10:00 AM' }]
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function NewEventPage() {
  const router = useRouter()
  const { toast } = useStore()
  const [type, setType] = useState('Wedding')
  const [name, setName] = useState('')
  const [couple, setCouple] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')
  const [notes, setNotes] = useState('')
  const [extra, setExtra] = useState({}) // optional field id -> value
  const [errors, setErrors] = useState({})
  const [reviewing, setReviewing] = useState(false)

  const extras = EXTRA_FIELDS[type] || []

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!name.trim()) next.name = 'Give the event a name.'
    if (!couple.trim()) next.couple = 'Add who the event is for.'
    if (!date.trim()) next.date = 'Pick a date.'
    if (guests !== '' && !(Number(guests) > 0)) next.guests = 'Enter a number above 0, or leave it blank.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      document.getElementById(Object.keys(next)[0])?.focus()
      return
    }
    setReviewing(true)
  }

  function create() {
    setReviewing(false)
    toast(`"${name.trim()}" would be created as a ${type}. Nothing is saved in this prototype.`)
    router.push('/events')
  }

  // What the confirmation lists: the basics, then whichever optional fields were filled in.
  const summary = [
    ['Event type', type],
    ['Event name', name.trim()],
    ['Couple', couple.trim()],
    ['Date', formatDate(date)],
    ['Expected guests', guests || 'Not set'],
    ...extras.filter((f) => (extra[f.id] || '').trim()).map((f) => [f.label, extra[f.id].trim()]),
    ...(notes.trim() ? [['Notes', notes.trim()]] : [])
  ]

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Events', href: '/events' }, { label: 'New event' }]}
      />
      <PageHeader title="Create an event" lead="The same structure covers every event type. Only a few optional fields change." />

      <form onSubmit={submit} noValidate>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <Card title="Basics" icon="list">
              <div className="space-y-3">
                <Select
                  label="Event type"
                  id="type"
                  options={EVENT_TYPES}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  hint="Changing this changes the optional fields below."
                />
                <TextInput
                  label="Event name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Okafor Wedding"
                  error={errors.name}
                />
                <TextInput
                  label="Couple"
                  id="couple"
                  value={couple}
                  onChange={(e) => setCouple(e.target.value)}
                  placeholder="Who is the event for?"
                  error={errors.couple}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Date"
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    error={errors.date}
                  />
                  <TextInput
                    label="Expected guests"
                    id="guests"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="150"
                    error={errors.guests}
                  />
                </div>
              </div>
            </Card>

            <Card title={`Optional: ${type}`} icon="info" subtitle="These fields change with the event type">
              <div className="space-y-3">
                {extras.map((f) => (
                  <TextInput
                    key={f.id}
                    label={f.label}
                    id={f.id}
                    placeholder={f.placeholder}
                    value={extra[f.id] || ''}
                    onChange={(e) => setExtra((x) => ({ ...x, [f.id]: e.target.value }))}
                  />
                ))}
                <Textarea
                  label="Notes"
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the team should know."
                />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="What happens next" icon="info">
              <ol className="list-decimal space-y-1.5 pl-4 text-small text-ink-muted">
                <li>The event appears in Events and on the calendar.</li>
                <li>You add the blocks to staff (setup, ceremony, reception, teardown) and who each one needs.</li>
                <li>The Staffing Planner suggests staff from their stated availability.</li>
                <li>You send the texts, and staff say yes or no.</li>
                <li>Any open spot shows up in Up Next.</li>
              </ol>
            </Card>

            <Alert tone="info" title="Prototype limitation">
              Creating an event here does not save a new record. The two sample events stay fixed so the scenario is the
              same for every tester.
            </Alert>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="md">
                Review and create
              </Button>
              <Button variant="secondary" size="md" href="/events">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Modal
        open={reviewing}
        onClose={() => setReviewing(false)}
        title="Create this event?"
        subtitle="Check the details. You can go back and change anything."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewing(false)}>
              Go back
            </Button>
            <Button variant="primary" onClick={create} data-autofocus>
              Create event
            </Button>
          </>
        }
      >
        <dl className="space-y-3">
          {summary.map(([label, value]) => (
            <Field key={label} label={label} value={value} />
          ))}
        </dl>
      </Modal>
    </div>
  )
}
