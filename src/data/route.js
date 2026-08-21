// Route tuning. Distance drives everything now: your character auto-advances
// along the trail as real miles accrue (steps -> miles, or GPS on a run).
// "Shared mechanics, tuned per goal" — each goal sets pacing.

export const STEPS_PER_MILE = 2000; // standard estimate for step -> distance

// Per-goal pacing (milestone spacing, encounter cadence, workout XP bonus).
export const GOAL_PACING = {
  distance: { milestoneMi: 0.2, encMin: 0.08, encMax: 0.16, workoutXpMult: 1.0, trail: 'Cardio Trail' },
  strength: { milestoneMi: 0.3, encMin: 0.12, encMax: 0.24, workoutXpMult: 1.25, trail: 'Power Path' },
  balance: { milestoneMi: 0.25, encMin: 0.1, encMax: 0.2, workoutXpMult: 1.1, trail: 'Balanced Way' },
};

export function pacingForGoal(goalId) {
  return GOAL_PACING[goalId] || GOAL_PACING.balance;
}

export const ROUTE = { milestoneMi: 0.25 };

export function formatMiles(mi) {
  return `${(mi || 0).toFixed(2)} mi`;
}

export default ROUTE;
