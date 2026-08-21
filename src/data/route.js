// Route tuning. Distance drives everything now: your character auto-advances
// along the trail as real miles accrue (steps -> miles, or GPS on a run).
// "Shared mechanics, tuned per goal" — each goal sets pacing.

import { migrateGoalId } from './goals';

export const STEPS_PER_MILE = 2000; // standard estimate for step -> distance

// Per-goal pacing: milestone spacing, encounter cadence, and which effort pays
// a bonus. workoutXpMult scales workout XP; mileXpMult scales walking XP.
// Forge Might pays for the gym, Travel Light pays for the road, Take Root pays
// a little for everything — three playstyles over the same engine.
export const GOAL_PACING = {
  muscle: { milestoneMi: 0.3, encMin: 0.12, encMax: 0.24, workoutXpMult: 1.3, mileXpMult: 1.0, trail: 'Forge Road' },
  lean: { milestoneMi: 0.2, encMin: 0.08, encMax: 0.16, workoutXpMult: 1.0, mileXpMult: 1.4, trail: 'Swiftwater Run' },
  root: { milestoneMi: 0.25, encMin: 0.1, encMax: 0.2, workoutXpMult: 1.1, mileXpMult: 1.15, trail: 'Grove Walk' },
};

export function pacingForGoal(goalId) {
  return GOAL_PACING[migrateGoalId(goalId)] || GOAL_PACING.root;
}

export const ROUTE = { milestoneMi: 0.25 };

export function formatMiles(mi) {
  return `${(mi || 0).toFixed(2)} mi`;
}

export default ROUTE;
