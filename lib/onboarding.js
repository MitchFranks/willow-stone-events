// ---------------------------------------------------------------------------
// First-run intro: constants and pure helpers.
//
// Deliberately NOT a client module, so server files (the couple route's
// generateStaticParams) can import the constants as plain values.
//
//   guide   whether the intro modal has been seen, and the first couple they
//           typed in. Kept in its own key so it never collides with the
//           prototype store (lib/store.jsx).
// ---------------------------------------------------------------------------

export const GUIDE_KEY = 'vue-onboarding-v3'

/** The first couple has a fixed id so the static export can prebuild its page. */
export const FIRST_COUPLE_ID = 'cpl-2000'

// ---- couples ---------------------------------------------------------------

/** "Ava Martin & Leo Chen" -> "AL"; "Ava Martin" -> "AM". */
export function initialsFor(names) {
  const partners = names
    .split(/\s*(?:&|\+|\band\b|,)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (partners.length >= 2) return (partners[0][0] + partners[1][0]).toUpperCase()
  const words = (partners[0] || names).trim().split(/\s+/)
  return ((words[0]?.[0] || '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() || '?'
}

/** A minimal couple record, same shape as lib/mock/records.js `couples`. */
export function makeCouple(names) {
  const name = names.trim().replace(/\s+/g, ' ')
  const primaryContact = name.split(/\s*(?:&|\+|\band\b|,)\s*/i)[0] || name
  return {
    id: FIRST_COUPLE_ID,
    name,
    primaryContact,
    email: '',
    phone: '',
    initials: initialsFor(name),
    eventIds: [],
    since: 'Added today',
    note: 'Added during setup. Book their wedding when you are ready.',
    addedByGuide: true
  }
}
