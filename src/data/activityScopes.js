// Activity scopes: the one vocabulary for "what kind of effort was this",
// so gym work can never quietly leak into trail rewards — or the reverse.
//
// Every quest requirement declares the scopes it accepts, and everything
// that records effort can say which scope it belongs to. The hard rules,
// centralized here instead of re-decided per screen:
//
//   - Only `trail_activity` — a delta carrying a real routeId — may advance
//     a trail quota, milestone meter, encounter, Warden, pin or charm.
//   - Mileage alone does not make something trail work. GPS alone does not.
//     Manually entered distance NEVER does: it is a display total from a
//     physical machine, scope gym_cardio, full stop.
//   - Quest Credits do not make an activity trail-related either; the
//     cardio award is duration-pay for gym work and says nothing about
//     trails.

export const SCOPES = ['gym_cardio', 'gym_strength', 'gym_attendance', 'healthy_habit', 'trail_activity'];

// The scope of a distance delta, mirroring state/distancePolicy.js: a real
// routeId is the ONLY way to be trail activity.
export function distanceScope({ routeId, activity } = {}) {
  if (routeId) return 'trail_activity';
  if (activity === 'ride' || activity === 'gym-cardio') return 'gym_cardio';
  return 'gym_cardio';
}

// What each quest requirement KIND measures. This is the source of truth the
// quests declare from; a requirement whose declared scopes disagree with its
// kind is a build failure in the ledger test.
export const REQ_KIND_SCOPES = {
  // distanceMi counts real walking wherever it happens — trail or deck —
  // and both are honest movement. Trail QUOTAS are a separate system that
  // only routeId reaches; this requirement reads the shared odometer.
  miles: ['trail_activity', 'gym_cardio'],
  rides: ['gym_cardio'],
  cardio: ['gym_cardio'],
  machineSessions: ['gym_cardio'],
  distinctMachines: ['gym_cardio'],
  workouts: ['gym_strength'],
  checkins: ['gym_attendance'],
  moduleLogs: ['healthy_habit'],
  moduleGoalDays: ['healthy_habit'],
};

export function scopesForReqKind(kind) {
  return REQ_KIND_SCOPES[kind] || [];
}

// Can effort of `scope` legally progress requirement `req`?
export function reqAcceptsScope(req, scope) {
  const declared = (req && req.scopes) || scopesForReqKind(req && req.kind);
  return declared.includes(scope);
}

export default { SCOPES, REQ_KIND_SCOPES, distanceScope, scopesForReqKind, reqAcceptsScope };
