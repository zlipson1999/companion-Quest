// Distance has two deliberately different meanings in Companion Quest.
//
// A selected outdoor trail can advance its quota, roll its milestone meter and
// mint Trail Credit. Gym cardio is still real movement and still belongs in
// the player's fitness record, but it must never leak into those trail-only
// systems. Keeping the decision here gives the reducer and tests one invariant
// instead of relying on every caller to remember three separate booleans.

import { ROUTES } from '../data/routes';

const GYM_ACTIVITIES = new Set(['gym-cardio', 'ride']);

export function distancePolicy({ routeId, activity } = {}) {
  const gym = GYM_ACTIVITIES.has(activity);
  if (gym && routeId) {
    throw new Error('distancePolicy: gym cardio cannot carry a routeId');
  }
  if (routeId && !ROUTES.some((route) => route.id === routeId)) {
    throw new Error(`distancePolicy: unknown routeId ${routeId}`);
  }
  const trail = !!routeId;
  return {
    trail,
    advancesTrail: trail,
    earnsTrailCredit: trail,
    advancesTrailMilestones: trail,
  };
}

export default distancePolicy;
