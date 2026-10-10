'use client'

// ---------------------------------------------------------------------------
// Send review (spec §B.4). The only confirmation step, and the confirmation is
// the preview: exactly who gets texted and the full text each one gets, plus a
// single "Check before sending" summary. Nothing here blocks sending.
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { Modal, openSpots } from '@/components/ui/domain'
import { Button, Icon, StatusBadge } from '@/components/ui/primitives'
import { pluralRole } from '@/lib/mock/staff'
import { WORLD } from '@/lib/staffing/adapter'
import { KIND_LABEL, coverage, isShortNotice, messageText, openIssues, rolesOf, sendKind, staffById } from '@/lib/staffing/derive'
import { applyAsk, applySend, useStaffing2 } from '@/lib/staffing/store'

/** prepared = { askSpec?, ids?, opts? } */
export function SendReview({ prepared, onClose, onDone, onChangeTimes }) {
  const { state, askAndSend, send } = useStaffing2()

  const model = useMemo(() => {
    if (!prepared) return null
    const st = structuredClone(state)
    const ids = prepared.askSpec ? applyAsk(st, prepared.askSpec) : prepared.ids
    const urgentAll = !!prepared.opts?.urgentAll
    const items = ids
      .map((id) => st.requests[id])
      .filter(Boolean)
      .map((r) => {
        const kind = sendKind(r)
        if (!kind) return null
        const urgent = kind !== 'cancel' && (urgentAll || isShortNotice(r, st))
        return { r, kind, urgent, text: messageText(kind, r, st, { urgent }) }
      })
      .filter(Boolean)
    const warnings = []
    for (const { r, kind } of items) {
      if (kind === 'cancel') continue
      for (const i of openIssues(r, st)) {
        if (i.severity === 'soft' || i.severity === 'hard') warnings.push({ r, text: `${staffById(r.staffId).name}: ${i.message}` })
      }
    }
    // Gaps this send leaves unfilled.
    const after = structuredClone(st)
    applySend(after, items.map((x) => x.r.id), { urgentAll })
    const eventIds = [...new Set(items.map((x) => x.r.eventId))]
    const gaps = []
    for (const eid of eventIds) {
      for (const b of WORLD.eventMap[eid].blocks) {
        for (const role of rolesOf(b, after)) {
          const c = coverage(eid, b, role, after)
          if (c.toFind > 0) gaps.push(`${b.name} will still have ${openSpots(c.toFind)} for ${pluralRole(role, c.toFind)} that nobody was asked for.`)
        }
      }
    }
    return { items, warnings, gaps, urgentAll }
  }, [prepared, state])

  if (!prepared || !model) return null
  const n = model.items.length
  const title = n ? `Send ${n} text${n === 1 ? '' : 's'}` : 'Nothing to send'

  const doSend = () => {
    if (prepared.askSpec) askAndSend(prepared.askSpec, prepared.opts)
    else send(model.items.map((x) => x.r.id))
    onDone()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      labelledBy="send-review-title"
      footer={
        <>
          <Button onClick={onClose}>Back</Button>
          <Button variant="primary" onClick={doSend} disabled={!n}>
            <Icon name="send" size={13} />
            {title}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-small text-ink-muted">Each person gets one text for their whole day. Texts can&apos;t be unsent.</p>

      {(model.warnings.length > 0 || model.gaps.length > 0) && (
        <section className="mb-4 rounded-md bg-status-soon-soft px-3 py-3">
          <h3 className="flex items-center gap-1.5 text-small font-medium text-status-soon">
            <Icon name="clock" size={13} />
            Worth a look before sending ({model.warnings.length + model.gaps.length})
          </h3>
          <ul className="mt-1.5 space-y-1.5 text-label text-ink">
            {model.warnings.map((w, i) => (
              <li key={`w${i}`} className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span>{w.text}</span>
                {!prepared.askSpec && state.requests[w.r.id] && (
                  <Button size="sm" variant="ghost" onClick={() => onChangeTimes(w.r.id)}>
                    Change times
                  </Button>
                )}
              </li>
            ))}
            {model.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      <ul className="space-y-3">
        {model.items.map(({ r, kind, urgent, text }) => (
          <li key={r.id}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-small font-medium text-ink">{staffById(r.staffId).name}</span>
              <StatusBadge tone={kind === 'cancel' ? 'empty' : urgent && (kind === 'ask' || kind === 'change') ? 'warn' : 'info'} size="sm">
                {urgent && kind === 'ask' ? 'Short notice' : KIND_LABEL[kind]}
              </StatusBadge>
            </div>
            <blockquote className="rounded-md border-l-2 border-line-strong bg-surface-sunken px-3 py-2 text-small leading-relaxed text-ink">
              {text}
            </blockquote>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
