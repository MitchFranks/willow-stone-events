// ---------------------------------------------------------------------------
// Staffing Planner · derived values. Pure functions, no React (spec §D.5).
//
// Everything takes the the planner state `st` and reads the seed world from the
// adapter. Times inside are absolute minutes (UTC-based, timezone-free) so the
// simulated clock and the rules agree on every machine.
// ---------------------------------------------------------------------------

import { TODAY_KEY, venue } from '@/lib/mock/events'
import { ROLES, formatHour, pluralRole } from '@/lib/mock/staff'
import { WORLD } from './adapter'
import { BASE_NOW, SPACES } from './seed'
import { NO_RULE_ROLES, RATIO_RULES, RULES, SETTINGS, SEVERITY_RANK } from './rules'

/* ------------------------------------------------------------------ time -- */

export const isoToMin = (iso) => Date.parse(`${iso}:00Z`) / 60000
export const minToIso = (m) => new Date(m * 60000).toISOString().slice(0, 16)
export const dayStartMin = (dateKey) => Date.parse(`${dateKey}T00:00:00Z`) / 60000
export const simNowMin = (st) => isoToMin(BASE_NOW) + (st.tick || 0) * SETTINGS.simStepMin
export const simNowIso = (st) => minToIso(simNowMin(st))

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LONG = { Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays', Fri: 'Fridays', Sat: 'Saturdays', Sun: 'Sundays' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const weekdayOf = (isoOrKey) => WEEKDAYS[new Date(`${isoOrKey.slice(0, 10)}T00:00:00Z`).getUTCDay()]
export const dateLabel = (dateKey) => {
  const d = new Date(`${dateKey}T00:00:00Z`)
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}
export const monthDay = (dateKey) => {
  const d = new Date(`${dateKey}T00:00:00Z`)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}
export const timeOfIso = (iso) => {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  return formatHour(h + m / 60)
}
/** "Thu 10:06 AM" */
export const stampLabel = (iso) => `${weekdayOf(iso)} ${timeOfIso(iso)}`

/** "just now", "4 min ago", "3 h ago", or the weekday. */
export function agoLabel(iso, st) {
  const diff = simNowMin(st) - isoToMin(iso)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${Math.round(diff)} min ago`
  if (diff < 24 * 60 && iso.slice(0, 10) === simNowIso(st).slice(0, 10)) return `${Math.round(diff / 60)} h ago`
  return weekdayOf(iso)
}

export const fmtH = (h) => formatHour(((h % 24) + 24) % 24)

/** 15,17 -> "3:00–5:00 PM"; 9,15 -> "9:00 AM–3:00 PM" */
export function rangeLabel(start, end) {
  const a = fmtH(start)
  const b = fmtH(end)
  if (a.slice(-2) === b.slice(-2) && Math.floor(start) % 12 !== 0) return `${a.slice(0, -3)}–${b}`
  return `${a}–${b}`
}

/* ---------------------------------------------------------------- lookup -- */

export const staffById = (id) => WORLD.staffMap[id] || null
export const firstName = (id) => (staffById(id)?.name || id).split(' ')[0]
export const blockById = (id) => WORLD.blockMap[id]?.block || null
export const spaceLabel = (spaceId) => SPACES[spaceId] || 'the venue'
export const MANAGER = (() => {
  return { name: venue.manager, first: venue.manager.split(' ')[0], phone: venue.managerPhone || '' }
})()

const EDITABLE_EVENT_FIELDS = ['expectedGuests', 'guaranteedCount', 'serviceStyle', 'bar', 'barStations', 'suppliedBy']

/**
 * Event with the runtime edits (guests, guarantee, service, bar) merged in. Only
 * those fields can change, so dates, times and blocks always match WORLD.eventMap.
 */
export function eventOf(st, id) {
  const base = WORLD.eventMap[id]
  if (!base) return null
  const edits = st.eventEdits?.[id] || {}
  const merged = { ...base }
  for (const k of EDITABLE_EVENT_FIELDS) if (k in edits) merged[k] = edits[k]
  return merged
}

export const eventWord = (ev) => (ev.type === 'Wedding' ? 'wedding' : 'event')

export function daysOutOf(ev) {
  return Math.round((dayStartMin(ev.dateKey) - dayStartMin(TODAY_KEY)) / 1440)
}

export function daysOutText(ev) {
  const n = daysOutOf(ev)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n < 0) return `${-n} days ago`
  return `${n} days out`
}

export function guestsText(ev) {
  if (ev.guaranteedCount) return `Guarantee ${ev.guaranteedCount}`
  return `${ev.expectedGuests} guests`
}

/* -------------------------------------------------------------- requests -- */

export const LIVE = ['draft', 'pending', 'accepted', 'backup']
export const live = (r) => LIVE.includes(r.status)
const sameSet = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x))
export const changed = (r) =>
  !!r.sent && live(r) && r.status !== 'draft' && (!sameSet(r.sent.blockIds, r.blockIds) || r.sent.callOffsetMin !== r.callOffsetMin)

export const requestList = (st) => Object.values(st.requests)
export const requestsOf = (st, eventId) => requestList(st).filter((r) => r.eventId === eventId)

export function sortBlockIds(ev, ids) {
  const order = ev.blocks.map((b) => b.id)
  return [...new Set(ids)].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

export function blocksOfRequest(r, ev = WORLD.eventMap[r.eventId]) {
  return ev.blocks.filter((b) => r.blockIds.includes(b.id))
}

/** Call time and "done about", as decimal hours. */
export function callTimeH(r, ev = WORLD.eventMap[r.eventId], blockIds = r.blockIds, offset = r.callOffsetMin) {
  const bs = ev.blocks.filter((b) => blockIds.includes(b.id))
  if (!bs.length) return null
  return bs[0].start + (offset || 0) / 60
}
export function doneH(r, ev = WORLD.eventMap[r.eventId], blockIds = r.blockIds) {
  const bs = ev.blocks.filter((b) => blockIds.includes(b.id))
  return bs.length ? bs[bs.length - 1].end : null
}
export function callAbsMin(r, ev = WORLD.eventMap[r.eventId]) {
  const h = callTimeH(r, ev)
  return h == null ? null : dayStartMin(ev.dateKey) + h * 60
}

/** "Ceremony + Reception · call 3:00 PM, done about 9:00 PM" or a split day. */
export function dayLine(r, ev = WORLD.eventMap[r.eventId]) {
  const bs = blocksOfRequest(r, ev)
  if (!bs.length) return ''
  const contiguous = bs.every((b, i) => i === 0 || bs[i - 1].end === b.start)
  const call = fmtH(callTimeH(r, ev))
  if (contiguous || bs.length === 1) {
    return `${bs.map((b) => b.name).join(' + ')} · call ${call}, done about ${fmtH(doneH(r, ev))}`
  }
  const parts = bs.map((b, i) => `${b.name} ${rangeLabel(i === 0 ? callTimeH(r, ev) : b.start, b.end)}`)
  return parts.join(' and ')
}

/** Per-block intervals in absolute minutes. The call offset moves the first one. */
export function intervals(r, ev = WORLD.eventMap[r.eventId]) {
  const day = dayStartMin(ev.dateKey)
  const bs = ev.blocks.filter((b) => r.blockIds.includes(b.id))
  return bs.map((b, i) => ({
    start: day + (b.start + (i === 0 ? (r.callOffsetMin || 0) / 60 : 0)) * 60,
    end: day + b.end * 60,
    spaceId: b.spaceId,
    blockId: b.id,
    eventId: ev.id
  }))
}

const hoursOf = (ivs) => ivs.reduce((n, iv) => n + (iv.end - iv.start) / 60, 0)

export function replyByMin(r) {
  if (r.replyBy) return isoToMin(r.replyBy)
  if (!r.sentAt) return null
  const sent = isoToMin(r.sentAt)
  if (r.urgent) return sent + SETTINGS.shortReplyByHours * 60
  const call = callAbsMin(r)
  return Math.min(sent + SETTINGS.replyByHours * 60, call == null ? Infinity : call - SETTINGS.replyBeforeCallHours * 60)
}

export const overdue = (r, st) => r.status === 'pending' && replyByMin(r) != null && simNowMin(st) > replyByMin(r)

export function isShortNotice(r, st) {
  const call = callAbsMin(r)
  return call != null && call - simNowMin(st) < SETTINGS.shortNoticeHours * 60
}

/* -------------------------------------------------------------- coverage -- */

export function needOf(block, role, st) {
  const override = st.needs?.[block.id]?.[role]
  if (override != null) return override
  return block.requirements.find((q) => q.role === role)?.count ?? 0
}

/** Roles with a need or a live request on this block, in ROLES order. */
export function rolesOf(block, st) {
  const set = new Set(block.requirements.map((q) => q.role))
  for (const role of Object.keys(st.needs?.[block.id] || {})) set.add(role)
  for (const r of requestList(st)) if (live(r) && r.blockIds.includes(block.id)) set.add(r.role)
  return ROLES.filter((role) => set.has(role) && (needOf(block, role, st) > 0 || requestList(st).some((r) => live(r) && r.role === role && r.blockIds.includes(block.id))))
}

export function coverage(eventId, block, role, st, excludeId = null) {
  const rs = requestList(st).filter((r) => r.eventId === eventId && r.role === role && live(r) && r.id !== excludeId)
  const isConf = (r) => (r.status === 'accepted' || r.status === 'pending') && r.confirmedBlockIds.includes(block.id)
  const confirmedRs = rs.filter(isConf)
  const waitingRs = rs.filter((r) => r.status === 'pending' && r.blockIds.includes(block.id) && !r.confirmedBlockIds.includes(block.id))
  const notSentRs = rs.filter((r) => (r.status === 'draft' || changed(r)) && r.blockIds.includes(block.id) && !r.confirmedBlockIds.includes(block.id))
  const need = needOf(block, role, st)
  const confirmed = confirmedRs.length
  const waiting = waitingRs.length
  const notSent = notSentRs.length
  return {
    need,
    confirmed,
    filled: Math.min(need, confirmed),
    waiting,
    notSent,
    toFind: Math.max(0, need - confirmed - waiting - notSent),
    extra: Math.max(0, confirmed - need),
    gap: Math.max(0, need - confirmed),
    waitingRs,
    notSentRs
  }
}

/** Roles the event uses, in ROLES order. */
export function eventRoles(eventId, st) {
  const ev = WORLD.eventMap[eventId]
  const set = new Set()
  for (const b of ev.blocks) for (const role of rolesOf(b, st)) set.add(role)
  for (const r of requestsOf(st, eventId)) if (r.status !== 'cancelled') set.add(r.role)
  return ROLES.filter((r) => set.has(r))
}

/** Blocks where this role has a need or a live request. */
export function roleBlocks(eventId, role, st) {
  const ev = WORLD.eventMap[eventId]
  return ev.blocks.filter((b) => rolesOf(b, st).includes(role))
}

export function eventSummary(eventId, st) {
  const ev = WORLD.eventMap[eventId]
  let spots = 0
  let filled = 0
  let toFind = 0
  const findByRole = {}
  for (const b of ev.blocks) {
    for (const role of rolesOf(b, st)) {
      const c = coverage(eventId, b, role, st)
      spots += c.need
      filled += c.filled
      toFind += c.toFind
      if (c.toFind) findByRole[role] = (findByRole[role] || 0) + c.toFind
    }
  }
  const rs = requestsOf(st, eventId)
  const waitingRs = rs.filter((r) => r.status === 'pending')
  const unsent = rs.filter((r) => r.status === 'draft' || changed(r) || (r.status === 'cancelled' && r.cancelNotice === 'queued'))
  const toCheck = rs.filter((r) => live(r) && r.status !== 'backup' && openIssues(r, st).some((i) => i.severity !== 'info'))
  const overdueRs = waitingRs.filter((r) => overdue(r, st))
  return { spots, filled, waiting: waitingRs.length, waitingRs, toFind, findByRole, unsent, toCheck, overdueRs }
}

/** The one way to say how many roles are unfilled: "1 open spot", "3 open spots". */
export const openSpotsText = (n) => `${n} open spot${n === 1 ? '' : 's'}`

/** Fully staffed: every spot has someone confirmed. Warnings and unsent texts don't change that. */
export const fullyStaffed = (s) => s.spots > 0 && s.filled >= s.spots

/** "12 of 13 spots filled · 1 waiting · 1 open spot nobody was asked for" */
export function summaryLine(s) {
  if (fullyStaffed(s)) return `Fully staffed: all ${s.spots} spots filled`
  const parts = [`${s.filled} of ${s.spots} spots filled`]
  if (s.waiting) parts.push(`${s.waiting} waiting for a reply`)
  if (s.toFind) parts.push(`${openSpotsText(s.toFind)} nobody was asked for`)
  if (s.unsent.length) parts.push(`${s.unsent.length} not sent`)
  return parts.join(' · ')
}

/* ----------------------------------------------------------------- rules -- */

const issue = (ruleId, message, extra = {}) => ({ ruleId, severity: RULES[ruleId].severity, message, ...extra })

function windowsText(ws) {
  return ws.map((w) => rangeLabel(w.start, w.end)).join(', ')
}

function overlapsAway(a, dateKey, iv) {
  const end = a.endDateKey || a.dateKey
  if (dateKey < a.dateKey || dateKey > end) return false
  if (a.start == null || a.end == null) return true
  const day = dayStartMin(dateKey)
  return day + a.start * 60 < iv.end && iv.start < day + a.end * 60
}

const FREE_DAY_ORDER = ['Sat', 'Fri', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']

/** "Sat 8:00 AM–11:00 PM · Fri 2:00–11:00 PM". Weekend first: that is when events are. Used by Team and the Staff Directory alike. */
export function usuallyFreeText(p) {
  const parts = FREE_DAY_ORDER.filter((d) => p.availability?.[d]?.length).map((d) => `${d} ${p.availability[d].map((w) => rangeLabel(w.start, w.end)).join(', ')}`)
  return parts.length ? parts.join(' · ') : 'No usual hours set'
}

export function awayText(a) {
  const why = a.reason ? `: ${a.reason}` : ''
  if (a.start == null || a.end == null) return `Away all day${why}`
  if (a.start === 0) return `Away until ${fmtH(a.end)}${why}`
  if (a.end >= 24) return `Away from ${fmtH(a.start)}${why}`
  return `Away ${rangeLabel(a.start, a.end)}${why}`
}

export function awayDateText(a) {
  const dates = a.endDateKey && a.endDateKey !== a.dateKey ? `${dateLabel(a.dateKey)} to ${dateLabel(a.endDateKey)}` : dateLabel(a.dateKey)
  let time = 'all day'
  if (a.start != null && a.end != null) time = a.start === 0 ? `until ${fmtH(a.end)}` : a.end >= 24 ? `from ${fmtH(a.start)}` : rangeLabel(a.start, a.end)
  return `${dates} ${time}${a.reason ? ` · ${a.reason}` : ''}`
}

function weekStartKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`)
  const back = (d.getUTCDay() + 6) % 7
  return minToIso(dayStartMin(dateKey) - back * 1440).slice(0, 10)
}

function liveFor(staffId, st, ignoreId) {
  return requestList(st).filter((r) => r.staffId === staffId && live(r) && r.id !== ignoreId)
}

export function hoursOn(staffId, dateKey, st, cand) {
  const evs = liveFor(staffId, st, cand?.ignoreId).filter((r) => r.status !== 'backup' && WORLD.eventMap[r.eventId].dateKey === dateKey)
  let h = evs.reduce((n, r) => n + hoursOf(intervals(r)), 0)
  if (cand) h += hoursOf(intervals(cand))
  return Math.round(h * 10) / 10
}

export function hoursInWeek(staffId, dateKey, st, cand) {
  const wk = weekStartKey(dateKey)
  const evs = liveFor(staffId, st, cand?.ignoreId).filter((r) => r.status !== 'backup' && weekStartKey(WORLD.eventMap[r.eventId].dateKey) === wk)
  let h = evs.reduce((n, r) => n + hoursOf(intervals(r)), 0)
  if (cand) h += hoursOf(intervals(cand))
  return Math.round(h * 10) / 10
}

export function next30(staffId, st) {
  const from = dayStartMin(TODAY_KEY)
  const to = from + SETTINGS.windowDays * 1440
  const rs = requestList(st).filter((r) => {
    if (r.staffId !== staffId || !live(r) || r.status === 'backup') return false
    const d = dayStartMin(WORLD.eventMap[r.eventId].dateKey)
    return d >= from && d <= to
  })
  const events = new Set(rs.map((r) => r.eventId))
  return { events: events.size, hours: Math.round(rs.reduce((n, r) => n + hoursOf(intervals(r)), 0) * 10) / 10 }
}
export const eventsNext30 = (staffId, st) => next30(staffId, st).events

/**
 * Every issue with asking `cand` = {staffId, eventId, role, blockIds, callOffsetMin, ignoreId}.
 * Runs live on every request, not only in the picker (spec §C.3).
 */
export function evaluate(cand, st) {
  const out = []
  const p = staffById(cand.staffId)
  const ev = eventOf(st, cand.eventId)
  if (!p || !ev || !cand.blockIds.length) return out
  const ivs = intervals(cand, ev)
  const mine = liveFor(p.id, st, cand.ignoreId)
  const here = mine.filter((r) => r.eventId === ev.id)
  const onOther = here.find((r) => r.role !== cand.role)
  if (onOther) out.push(issue('I-ON-EVENT', `Already on this ${eventWord(ev)} as ${onOther.role}`))
  else {
    const same = here.find((r) => cand.blockIds.every((b) => r.blockIds.includes(b)))
    if (same) out.push(issue('I-SAME', `Already on ${blocksOfRequest(same, ev).map((b) => b.name).join(' + ')}`))
  }
  for (const r of mine.filter((x) => x.eventId !== ev.id)) {
    const oev = WORLD.eventMap[r.eventId]
    for (const o of intervals(r, oev)) {
      for (const iv of ivs) {
        if (o.start < iv.end && iv.start < o.end) {
          const ob = blockById(o.blockId)
          out.push(issue('R-OVERLAP', `Also on ${ob.name} at ${oev.name}, ${rangeLabel((o.start - dayStartMin(oev.dateKey)) / 60, (o.end - dayStartMin(oev.dateKey)) / 60)}`))
        } else if (o.spaceId !== iv.spaceId) {
          const gap = Math.max(o.start - iv.end, iv.start - o.end)
          if (gap >= 0 && gap < SETTINGS.changeoverMin) {
            const [first, second] = o.end <= iv.start ? [o, iv] : [iv, o]
            out.push(issue('R-CHANGEOVER', `No time to get from ${spaceLabel(first.spaceId)} to ${spaceLabel(second.spaceId)} (${Math.round(gap)} min)`))
          }
        }
      }
    }
  }
  const away = st.away.find((a) => a.staffId === p.id && ivs.some((iv) => overlapsAway(a, ev.dateKey, iv)))
  if (away) out.push(issue('R-AWAY', awayText(away), { awayId: away.id }))
  const credType = SETTINGS.credentialsByRole[cand.role]
  if (credType) {
    const cred = (p.credentials || []).find((c) => c.type === credType)
    if (!cred) out.push(issue('R-CRED', 'No alcohol certificate on file'))
    else if (cred.expiresOn < ev.dateKey) out.push(issue('R-CRED', `Alcohol certificate expired ${monthDay(cred.expiresOn)}`))
    else if (dayStartMin(cred.expiresOn) - dayStartMin(ev.dateKey) <= SETTINGS.credSoonDays * 1440)
      out.push(issue('R-CRED-SOON', `Certificate expires ${monthDay(cred.expiresOn)}`))
  }
  const windows = p.availability?.[ev.day] || []
  const day = dayStartMin(ev.dateKey)
  const covered = (iv) => windows.some((w) => day + w.start * 60 <= iv.start && day + w.end * 60 >= iv.end)
  if (!ivs.every(covered)) {
    out.push(issue('R-AVAIL', windows.length ? `Usually free ${windowsText(windows)} on ${WEEKDAY_LONG[ev.day]}` : `Not usually free on ${WEEKDAY_LONG[ev.day]}`))
  }
  if (!p.roles.includes(cand.role)) out.push(issue('R-ROLE', `Usually works as ${p.roles.join(' or ')}`))
  const said = requestList(st).find((r) => r.staffId === p.id && r.eventId === ev.id && (r.status === 'declined' || r.declinedBefore) && r.id !== cand.ignoreId)
  if (said) out.push(issue('R-ASKED-BEFORE', `Said they can't make this ${eventWord(ev)}${said.respondedAt ? ` on ${weekdayOf(said.respondedAt)}` : ''}`))
  const dayH = hoursOn(p.id, ev.dateKey, st, cand)
  if (dayH > SETTINGS.maxHoursPerDay) out.push(issue('R-LONG-DAY', `Would be ${dayH} h that day`))
  const weekH = hoursInWeek(p.id, ev.dateKey, st, cand)
  const cap = Math.min(SETTINGS.weeklyHours, p.targetMaxHours ?? Infinity)
  if (weekH > cap) out.push(issue('R-WEEK', `Would be ${weekH} h that week${p.targetMaxHours && p.targetMaxHours < SETTINGS.weeklyHours ? `; usually up to ${p.targetMaxHours}` : ''}`))
  const n = eventsNext30(p.id, st)
  out.push(issue('R-LOAD', `${n} event${n === 1 ? '' : 's'} in the next 30 days`, { n, dayH, weekH }))
  const seen = new Set()
  return out.filter((i) => {
    const k = `${i.ruleId}|${i.message}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function openIssues(r, st) {
  return evaluate({ ...r, ignoreId: r.id }, st).filter(
    (i) => !(r.overrides || []).some((o) => o.ruleId === i.ruleId && o.message === i.message)
  )
}

/** Issues the manager said are fine, that still apply. */
export function okdIssues(r, st) {
  const all = evaluate({ ...r, ignoreId: r.id }, st)
  return (r.overrides || []).filter((o) => all.some((i) => i.ruleId === o.ruleId && i.message === o.message))
}

export const maxSeverity = (issues) =>
  issues.reduce((m, i) => (SEVERITY_RANK[i.severity] > SEVERITY_RANK[m] ? i.severity : m), 'info')

export const GROUP_OF = { info: 'good', soft: 'check', hard: 'reason', block: 'cant' }
export const GROUP_ORDER = { backup: 0, good: 1, check: 2, reason: 3, cant: 4 }

export function activeRequest(staffId, eventId, role, st) {
  return requestList(st).find((r) => r.staffId === staffId && r.eventId === eventId && r.role === role && live(r)) || null
}

/** People for an Ask panel, grouped and sorted (spec §D.5 rank). */
export function rank(eventId, role, blockIds, st, { allRoles = false, callOffsetMin = 0 } = {}) {
  const ev = eventOf(st, eventId)
  return WORLD.staff
    .filter((p) => allRoles || p.roles.includes(role))
    .map((p) => {
      const existing = activeRequest(p.id, eventId, role, st)
      if (existing && existing.status !== 'backup' && blockIds.every((b) => existing.blockIds.includes(b))) {
        return { person: p, issues: [issue('I-SAME', `Already on ${blocksOfRequest(existing, ev).map((b) => b.name).join(' + ')}`)], group: 'cant', score: 0, existing }
      }
      const union = sortBlockIds(ev, [...(existing?.blockIds || []), ...blockIds])
      const issues = evaluate(
        { staffId: p.id, eventId, role, blockIds: union, callOffsetMin: existing && existing.status !== 'backup' ? Math.min(existing.callOffsetMin, callOffsetMin) : callOffsetMin, ignoreId: existing?.id },
        st
      )
      const group = existing?.status === 'backup' ? 'backup' : GROUP_OF[maxSeverity(issues)]
      let score = 0
      if (existing) score += 15
      if (p.roles[0] === role) score += 5
      score -= 2 * eventsNext30(p.id, st)
      return { person: p, issues, group, score, existing }
    })
    .sort(
      (a, b) =>
        GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || b.score - a.score || a.person.name.localeCompare(b.person.name)
    )
}

/** One line of plain good reasons for a candidate. */
export function goodReasons(person, ev, issues) {
  const load = issues.find((i) => i.ruleId === 'R-LOAD')
  const parts = []
  if (!issues.some((i) => i.ruleId === 'R-AVAIL' || i.ruleId === 'R-AWAY')) {
    const ws = person.availability?.[ev.day] || []
    const allDay = ws.some((w) => w.start <= 9 && w.end >= 22)
    parts.push(allDay ? `Free all ${WEEKDAY_LONG[ev.day].slice(0, -1)}` : `Usually free ${windowsText(ws)}`)
  }
  if (load) {
    parts.push(load.message)
    parts.push(`${load.weekH} h that week`)
  }
  return parts.join(' · ')
}

/* ----------------------------------------------------------- suggestions -- */

export function suggestions(eventId, st) {
  const ev = eventOf(st, eventId)
  const g = ev.guaranteedCount || ev.expectedGuests
  const out = []
  for (const b of WORLD.eventMap[eventId].blocks) {
    if (b.kind !== 'guest-facing') continue
    const need = (role) => needOf(b, role, st)
    const totalOthers = ROLES.filter((r) => r !== 'Event Captain').reduce((n, r) => n + need(r), 0)
    for (const rule of RATIO_RULES) {
      if ((ev.suppliedBy?.[rule.role] ?? 'venue') !== 'venue') continue
      if (!rule.when(ev, b, need, totalOthers)) continue
      const suggested = rule.count(g, ev)
      const current = need(rule.role)
      if (suggested !== current) out.push({ blockId: b.id, blockName: b.name, role: rule.role, current, suggested, rule, guests: g })
    }
  }
  return out
}

/** Suggestion for every row of Edit needs, including matches (for the "Suggested" column). */
export function suggestedFor(eventId, blockId, role, st) {
  const ev = eventOf(st, eventId)
  const b = blockById(blockId)
  if (!b || b.kind !== 'guest-facing') return null
  if ((ev.suppliedBy?.[role] ?? 'venue') !== 'venue') return { suppressed: true }
  const g = ev.guaranteedCount || ev.expectedGuests
  const need = (r) => needOf(b, r, st)
  const totalOthers = ROLES.filter((r) => r !== 'Event Captain').reduce((n, r) => n + need(r), 0)
  const rule = RATIO_RULES.find((x) => x.role === role && x.when(ev, b, need, totalOthers))
  return rule ? { suggested: rule.count(g, ev), rule } : null
}

export function suggestionText(s) {
  const who = `${s.suggested} ${pluralRole(s.role, s.suggested)}`
  if (s.rule.perGuests) return `For ${s.guests} guests we'd suggest ${who} on ${s.blockName} (${s.rule.basis}).`
  return `We'd suggest ${who} on ${s.blockName} (${s.rule.basis}).`
}

export function whyText(role, rule) {
  if (!rule) return NO_RULE_ROLES.includes(role) ? 'No reliable rule of thumb; set your own.' : 'No rule applies here.'
  return `${rule.basis}. Confidence: ${rule.confidence}. Source: ${rule.source}`
}

/* -------------------------------------------------------------- messages -- */

export const KIND_LABEL = { ask: 'Asking', change: 'Time change', cancel: 'No longer needed', remind: 'Reminder', confirmed: "You're on" }

/** Text a person would receive for this request (spec §C.7). */
export function messageText(kind, r, st, { urgent = false } = {}) {
  const ev = WORLD.eventMap[r.eventId]
  const first = firstName(r.staffId)
  const prefix = urgent ? 'Short notice: ' : ''
  const bs = blocksOfRequest(r, ev)
  const space = spaceLabel(bs[0]?.spaceId)
  const call = bs.length ? fmtH(callTimeH(r, ev)) : ''
  const done = bs.length ? fmtH(doneH(r, ev)) : ''
  const on = `the ${ev.name} on ${ev.dateShort}`
  switch (kind) {
    case 'ask':
      return `${prefix}Hi ${first}, can you work ${on}? ${r.role}, call time ${call} at ${space}, done about ${done}. Tap to answer.`
    case 'change': {
      const oldCall = r.sent ? fmtH(callTimeH(r, ev, r.sent.blockIds, r.sent.callOffsetMin)) : call
      const oldDone = r.sent ? fmtH(doneH(r, ev, r.sent.blockIds)) : done
      const callPart = oldCall !== call ? `call time is now ${call} (was ${oldCall})` : `call time ${call}`
      const donePart = oldDone !== done ? `done about ${done} (was ${oldDone})` : `done about ${done}`
      return `${prefix}Update for ${on}: you're on ${bs.map((b) => b.name).join(' + ')}, ${callPart}, ${donePart}. Tap to confirm.`
    }
    case 'cancel': {
      const names = (r.sent?.blockIds || r.blockIds).map((id) => blockById(id)?.name).filter(Boolean).join(' + ')
      return `Change of plan: you're no longer needed for the ${ev.name} ${names} on ${ev.dateShort}. Sorry for the shuffle. Questions? ${MANAGER.first}${MANAGER.phone ? `, ${MANAGER.phone}` : ''}.`
    }
    case 'remind':
      return `${prefix}Reminder: can you work ${on}? Tap to answer.`
    case 'confirmed':
      return `Good news: you're on for ${on}. ${r.role}, call time ${call}.`
    default:
      return ''
  }
}

/** What a send would do for one request: kind + text, or null if nothing to send. */
export function sendKind(r) {
  if (r.status === 'cancelled' && r.cancelNotice === 'queued') return 'cancel'
  if (r.status === 'draft') return 'ask'
  if (changed(r)) return r.status === 'backup' ? 'ask' : 'change'
  if (r.status === 'pending') return 'remind'
  return null
}

/* ---------------------------------------------------------------- status -- */

/**
 * The product vocabulary for one request: Not sent · Waiting · Confirmed ·
 * Can't make it, plus Removed and Backup. The note says the rest in words.
 */
export function displayStatus(r, st) {
  if (r.status === 'cancelled')
    return r.cancelNotice === 'queued'
      ? { tone: 'empty', label: 'Removed', note: `not told yet: send a text to let ${firstName(r.staffId)} know` }
      : { tone: 'empty', label: 'Removed' }
  if (r.status === 'draft') return { tone: 'empty', label: 'Not sent' }
  if (changed(r)) return { tone: 'empty', label: 'Not sent', note: 'new times not sent yet' }
  if (r.status === 'pending') {
    let note = r.sentAt ? `asked ${agoLabel(r.sentAt, st)}` : ''
    if (r.seenAt) note = `seen ${agoLabel(r.seenAt, st)}`
    if (overdue(r, st)) note = 'no reply yet'
    return { tone: 'pending', label: 'Waiting', note, partial: r.confirmedBlockIds.length > 0 }
  }
  if (r.status === 'accepted') return { tone: 'done', label: 'Confirmed' }
  if (r.status === 'backup') return { tone: 'info', label: 'Backup', note: 'said yes after the spots were full' }
  if (r.status === 'declined') return { tone: 'declined', label: "Can't make it", note: r.droppedOut ? 'dropped out after saying yes' : '' }
  return { tone: 'info', label: r.status }
}

/* ------------------------------------------------------------- list view -- */

/**
 * Status badges + the one thing to do for an event card (spec §B.1). The
 * first badge is the staffing state; the second, if any, is what is left.
 */
export function eventCardModel(eventId, st) {
  const s = eventSummary(eventId, st)
  const chips = []
  if (fullyStaffed(s)) chips.push({ tone: 'done', label: 'Fully staffed' })
  else if (s.toFind) chips.push({ tone: 'warn', label: openSpotsText(s.toFind) })
  if (s.waiting) chips.push({ tone: 'pending', label: `${s.waiting} waiting` })
  else if (s.unsent.length) chips.push({ tone: 'empty', label: `${s.unsent.length} not sent` })
  let action = { kind: 'open', label: 'Open' }
  if (s.toFind) action = { kind: 'find', label: 'Fill spots' }
  else if (s.unsent.length) action = { kind: 'send', label: `Send ${s.unsent.length} text${s.unsent.length === 1 ? '' : 's'}` }
  else if (s.overdueRs.length) action = { kind: 'remind', label: 'Remind' }
  else if (s.waiting) action = { kind: 'open', label: 'Check replies' }
  return { summary: s, chips, action, needsAction: action.kind !== 'open' }
}

/** One-line summary sentence for the events list. */
export function listSentence(st) {
  for (const ev of WORLD.events) {
    const { summary: s, action } = eventCardModel(ev.id, st)
    if (action.kind === 'open') continue
    const when = daysOutText(ev)
    if (s.toFind) {
      const entries = Object.entries(s.findByRole)
      const what = entries.map(([role, n]) => `${n} ${pluralRole(role, n)}`).join(' and ')
      return `${ev.name} has ${openSpotsText(s.toFind)} (${what}), ${when}.`
    }
    if (s.unsent.length) return `${ev.name} has ${s.unsent.length} text${s.unsent.length === 1 ? '' : 's'} not sent yet, ${when}.`
    if (s.overdueRs.length) return `${ev.name} is waiting on ${s.overdueRs.length} ${s.overdueRs.length === 1 ? 'reply' : 'replies'}, ${when}.`
  }
  return 'Every event in the next 30 days is fully staffed.'
}
