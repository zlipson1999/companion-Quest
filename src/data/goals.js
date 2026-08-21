// The life goal the player picks at the start. Each goal pairs them with an
// original starter companion AND sets a real playstyle: route pacing, trail
// name, and which kind of effort pays a bonus (see GOAL_PACING in route.js).
//
// The three goals are the three reasons people actually open a fitness app:
// build muscle, lose fat, build the habit. Named for the game world rather
// than the gym — "Travel Light" is a kinder sentence than "lose weight", and
// it means the same thing.

export const GOALS = [
  {
    id: 'muscle',
    name: 'Forge Might',
    tagline: 'Muscle is made, set by set.',
    description: 'Lift, push, and log real sets. Workouts pay extra XP, and every new personal best stokes the forge.',
    starterId: 'emberkit',
    focus: 'workouts',
  },
  {
    id: 'lean',
    name: 'Travel Light',
    tagline: 'Move more, carry less.',
    description: 'Miles are the engine. Walks and runs pay extra XP, milestones come quicker, and steady motion burns the load away.',
    starterId: 'dewbble',
    focus: 'miles',
  },
  {
    id: 'root',
    name: 'Take Root',
    tagline: 'Small habits, deep roots.',
    description: 'Show up a little every day — water, sleep, movement. A balanced bonus to everything, because steady grows strong.',
    starterId: 'sproutle',
    focus: 'consistency',
  },
];

// Saves written before this goal set exist with the old ids. The mapping keeps
// the spirit of the old choice: distance was about moving, strength about
// lifting, balance about consistency.
export const LEGACY_GOAL_IDS = { distance: 'lean', strength: 'muscle', balance: 'root' };

export function migrateGoalId(id) {
  return LEGACY_GOAL_IDS[id] || id;
}

export function getGoal(id) {
  const gid = migrateGoalId(id);
  return GOALS.find((g) => g.id === gid) || null;
}

export default GOALS;
