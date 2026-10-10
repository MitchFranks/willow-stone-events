'use client'

// ---------------------------------------------------------------------------
// Staff phone simulator (spec §B.8), a PROTOTYPE HELPER, not part of the
// product. Proves the loop: the tester sees the text a person received,
// answers it as that person, and watches the reply land on the event screen.
// Also exported as PhoneDrawer (a sheet), fixed to one person.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { venue } from '@/lib/mock/events'
import { Modal } from '@/components/ui/domain'
import { Avatar, Button, FilterChip, Icon, StatusBadge, Textarea } from '@/components/ui/primitives'
import { WORLD } from '@/lib/staffing/adapter'
import {
  MANAGER,
  awayDateText,
  blocksOfRequest,
  callTimeH,
  dayStartMin,
  displayStatus,
  doneH,
  firstName,
  fmtH,
  spaceLabel,
  stampLabel,
  staffById
} from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'
import { TODAY_KEY } from '@/lib/mock/events'
import { AwayDateForm } from './AwayDateForm'
import { PickChips } from './controls'

const REASONS = ['Another job', 'Sick', 'Family', 'Class or school', 'Other']
const ASKS = ['ask', 'change', 'remind']

function ViewChips({ value, onChange }) {
  return (
    <div role="group" aria-label="Phone screen" className="flex gap-2">
      {[
        ['texts', 'Texts'],
        ['dates', 'My dates']
      ].map(([id, label]) => (
        <FilterChip key={id} pressed={value === id} onClick={() => onChange(id)}>
          {label}
        </FilterChip>
      ))}
    </div>
  )
}

function ReplyPage({ requestId, onDone }) {
  const { state, answer, markSeen } = useStaffing2()
  const r = state.requests[requestId]
  const [mode, setMode] = useState('ask') // ask | no | result
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    markSeen(requestId)
    // Only on open: opening the reply page records "seen".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  if (!r) return null
  const ev = WORLD.eventMap[r.eventId]
  const bs = blocksOfRequest(r, ev)
  const call = fmtH(callTimeH(r, ev))

  if (mode === 'result') {
    return (
      <div className="space-y-4 py-4 text-center">
        <Icon name={result === 'declined' || result === 'reverted' ? 'info' : 'check'} size={22} className="mx-auto text-ink-muted" />
        <p className="text-body font-medium text-ink">
          {result === 'accepted'
            ? `You're confirmed. See you at ${call}.`
            : result === 'backup'
              ? "Thanks. All spots were already filled, so you're on the backup list. We'll text you if a spot opens."
              : 'Thanks for letting us know.'}
        </p>
        <Button size="sm" onClick={onDone}>
          Back to texts
        </Button>
      </div>
    )
  }

  const pending = r.status === 'pending'

  return (
    <div className="space-y-3">
      <Button size="sm" variant="ghost" onClick={onDone}>
        <Icon name="arrowLeft" size={12} /> Texts
      </Button>
      <div>
        <p className="text-heading font-medium text-ink">{ev.name}</p>
        <p className="text-label text-ink-muted">
          {ev.couple} · {ev.dateShort}
        </p>
      </div>
      <dl className="space-y-1.5 rounded-md bg-surface-sunken px-3 py-3 text-small">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-muted">Role</dt>
          <dd className="font-medium text-ink">{r.role}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-muted">Call time</dt>
          <dd className="font-medium text-ink">
            {call} at {spaceLabel(bs[0]?.spaceId)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-muted">Done about</dt>
          <dd className="text-ink">{fmtH(doneH(r, ev))}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-muted">Working</dt>
          <dd className="text-ink">{bs.map((b) => b.name).join(' + ')}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-muted">What to know</dt>
          <dd className="text-ink">{bs.map((b) => b.note).join(' ')}</dd>
        </div>
      </dl>
      <p className="text-label text-ink-muted">
        Questions? {MANAGER.first}{MANAGER.phone ? ` · ${MANAGER.phone}` : ''}
      </p>

      {!pending ? (
        <p className="rounded-md border border-line px-3 py-2 text-label text-ink-muted">
          Already answered: {displayStatus(r, state).label}.
        </p>
      ) : mode === 'ask' ? (
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setResult(answer(r.id, true))
              setMode('result')
            }}
          >
            Yes, I&apos;ll be there
          </Button>
          <Button onClick={() => setMode('no')}>Can&apos;t make it</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-label font-medium text-ink">Want to say why? (optional)</p>
          <PickChips options={REASONS} value={reason} onChange={setReason} label="Reason" />
          <Textarea
            aria-label="Note (optional)"
            id={`phone-note-${r.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => {
              const why = [reason, note.trim()].filter(Boolean).join(': ')
              setResult(answer(r.id, false, why))
              setMode('result')
            }}>
              Send answer
            </Button>
            <Button variant="ghost" onClick={() => setMode('ask')}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function MyDates({ staffId }) {
  const { state, dropOut, removeAway } = useStaffing2()
  const [confirming, setConfirming] = useState(null)
  const [reason, setReason] = useState('')
  const today = dayStartMin(TODAY_KEY)
  const mine = Object.values(state.requests)
    .filter((r) => r.staffId === staffId && ['accepted', 'backup'].includes(r.status) && dayStartMin(WORLD.eventMap[r.eventId].dateKey) >= today)
    .sort((a, b) => (WORLD.eventMap[a.eventId].dateKey < WORLD.eventMap[b.eventId].dateKey ? -1 : 1))
  const away = state.away.filter((a) => a.staffId === staffId)

  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-2 text-small font-medium text-ink">Coming up</h3>
        {!mine.length && <p className="text-label text-ink-muted">Nothing confirmed yet.</p>}
        <ul className="space-y-2">
          {mine.map((r) => {
            const ev = WORLD.eventMap[r.eventId]
            const s = displayStatus(r, state)
            return (
              <li key={r.id} className="rounded-md border border-line px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-small font-medium text-ink">{ev.name}</p>
                    <p className="text-label text-ink-muted">
                      {ev.dateShort} · {r.role} · call {fmtH(callTimeH(r, ev))}, done about {fmtH(doneH(r, ev))}
                    </p>
                  </div>
                  <StatusBadge tone={s.tone} size="sm">
                    {s.label}
                  </StatusBadge>
                </div>
                {r.status === 'accepted' &&
                  (confirming === r.id ? (
                    <div className="mt-2 space-y-2 rounded-md bg-surface-sunken px-3 py-2.5">
                      <p className="text-label font-medium text-ink">
                        Tell {MANAGER.first} you can&apos;t make the {ev.name}?
                      </p>
                      <PickChips options={REASONS} value={reason} onChange={setReason} label="Reason" />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            dropOut(r.id, reason || null)
                            setConfirming(null)
                            setReason('')
                          }}
                        >
                          Yes, tell {MANAGER.first}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                          Keep it
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" className="mt-2" onClick={() => setConfirming(r.id)}>
                      Can&apos;t make it anymore?
                    </Button>
                  ))}
              </li>
            )
          })}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-small font-medium text-ink">Dates I can&apos;t work</h3>
        <ul className="mb-2 space-y-1.5">
          {away.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-label text-ink">
              <span>{awayDateText(a)}</span>
              <Button size="sm" variant="ghost" onClick={() => removeAway(a.id)}>
                Remove
              </Button>
            </li>
          ))}
          {!away.length && <li className="text-label text-ink-muted">None yet.</li>}
        </ul>
        <AwayDateForm staffId={staffId} addedBy="staff" idPrefix={`phone-away-${staffId}`} />
      </section>
    </div>
  )
}

export function StaffPhone({ staffId }) {
  const { state } = useStaffing2()
  const [tab, setTab] = useState('texts')
  const [replyTo, setReplyTo] = useState(null)
  const person = staffById(staffId)

  useEffect(() => {
    setReplyTo(null)
    setTab('texts')
  }, [staffId])

  if (!person) return null
  const texts = state.messages.filter((m) => m.staffId === staffId)

  return (
    <div className="surface-card mx-auto flex w-full max-w-[360px] flex-col border-dashed border-line-strong sm:min-h-[640px]">
      <p className="border-b border-dashed border-line-strong px-4 py-2 text-label text-ink-muted">
        <span className="font-medium text-ink">Prototype only:</span> this pretends to be {firstName(staffId)}&apos;s phone.
      </p>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Avatar initials={person.initials} size="sm" />
        <div className="min-w-0">
          <p className="text-small font-medium text-ink">{person.name}</p>
          <p className="text-label text-ink-muted">{person.phone}</p>
        </div>
      </div>
      <div className="px-4 pt-3">
        <ViewChips
          value={tab}
          onChange={(t) => {
            setTab(t)
            setReplyTo(null)
          }}
        />
      </div>
      <div className="flex-1 px-4 py-3">
        {tab === 'texts' ? (
          replyTo ? (
            <ReplyPage requestId={replyTo} onDone={() => setReplyTo(null)} />
          ) : !texts.length ? (
            <p className="py-10 text-center text-small text-ink-muted">
              No texts yet. When {MANAGER.first} asks {firstName(staffId)} to work, the text shows up here.
            </p>
          ) : (
            <ul className="space-y-3">
              {texts.map((m) => {
                const r = state.requests[m.requestId]
                const canAnswer = ASKS.includes(m.kind) && r?.status === 'pending' && texts.find((x) => x.requestId === m.requestId && ASKS.includes(x.kind))?.id === m.id
                return (
                  <li key={m.id}>
                    <p className="mb-1 text-label text-ink-muted">
                      {venue.name} · {stampLabel(m.at)}
                    </p>
                    <div className="max-w-[92%] rounded-md bg-surface-sunken px-3 py-2.5 text-small leading-relaxed text-ink">
                      {m.text}
                      {canAnswer && (
                        <Button size="sm" variant="primary" className="mt-2" onClick={() => setReplyTo(m.requestId)}>
                          Tap to answer
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        ) : (
          <MyDates staffId={staffId} />
        )}
      </div>
    </div>
  )
}

/** The same phone in a right-hand sheet, fixed to one person. */
export function PhoneDrawer() {
  const { phoneFor, closePhone } = useStaffing2()
  const person = phoneFor ? staffById(phoneFor) : null
  return (
    <Modal
      variant="sheet"
      open={!!person}
      onClose={closePhone}
      title={person ? `${firstName(person.id)}'s phone (prototype)` : ''}
      subtitle="Answer as them, then close this to see the event update."
      labelledBy="phone-drawer-title"
      width="sm:w-[420px]"
    >
      {person && <StaffPhone staffId={person.id} />}
    </Modal>
  )
}
