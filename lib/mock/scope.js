// ---------------------------------------------------------------------------
// Prototype data scope.
//
// To keep first-run simple, the prototype starts with two of each thing: two
// weddings, two couples, two vendors, two tasks, two messages, two documents
// and two activity entries, plus a six-person team (one per role). The full
// sample set still lives in the mock files; each file filters itself through
// this list, so widening the prototype is a matter of editing the ids below.
// ---------------------------------------------------------------------------

export const KEEP = {
  events: ['evt-1001', 'evt-1002'],
  staff: ['stf-4001', 'stf-4002', 'stf-4003', 'stf-4004', 'stf-4007', 'stf-4010'],
  couples: ['cpl-2001', 'cpl-2002'],
  vendors: ['vnd-3001', 'vnd-3002'],
  tasks: ['t-guest-count', 't-shah-av'],
  messages: ['msg-5001', 'msg-5005'],
  documents: ['d5', 'd8'],
  activity: ['h1', 'h8'],
  // The on-call pool (one person per field role) gives every open position at least one person to ask.
  pool: ['stf-4013', 'stf-4014', 'stf-4015', 'stf-4016']
}

export const keep = (list, ids) => list.filter((item) => ids.includes(item.id))
