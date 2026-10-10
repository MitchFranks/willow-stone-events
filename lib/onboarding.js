// ---------------------------------------------------------------------------
// First-run intro: constants.
//
// Deliberately NOT a client module, so any file (server or client) can import
// the constants as plain values.
//
//   guide   whether the intro modal has been seen. Kept in its own key so it
//           never collides with the prototype store (lib/store.jsx).
// ---------------------------------------------------------------------------

export const GUIDE_KEY = 'vue-onboarding-v3'
