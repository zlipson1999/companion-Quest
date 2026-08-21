// The Workouts module: short real routines you can do any time (outside of
// Route battles) to grow your companion. Completing one logs real effort and
// grants XP + bond. Built to be expanded later.

export const WORKOUTS = [
  {
    id: 'mobility',
    name: 'Morning Mobility',
    intensity: 'Easy',
    minutes: 5,
    description: 'A gentle wake-up for your body.',
    steps: ['Neck rolls — 5 each way', 'Arm circles — 20 seconds', 'Standing toe touches — 10', 'Hip circles — 10 each way'],
    reward: { xp: 20, bond: 6 },
  },
  {
    id: 'strength',
    name: 'Strength Circuit',
    intensity: 'Medium',
    minutes: 10,
    description: 'Build real, usable strength.',
    steps: ['Push-ups — 10', 'Squats — 15', 'Lunges — 10 each leg', 'Plank — 30 seconds'],
    reward: { xp: 45, bond: 12 },
  },
  {
    id: 'hiit',
    name: 'Quick HIIT',
    intensity: 'Hard',
    minutes: 8,
    description: 'Short, sharp, and effective.',
    steps: ['Jumping jacks — 30', 'High knees — 30 seconds', 'Burpees — 8', 'Rest — 30 seconds, then repeat once'],
    reward: { xp: 60, bond: 14 },
  },
  {
    id: 'cooldown',
    name: 'Evening Wind-Down',
    intensity: 'Easy',
    minutes: 5,
    description: 'Stretch it out and rest well.',
    steps: ['Forward fold — 30 seconds', 'Quad stretch — 20 seconds each', 'Child\'s pose — 30 seconds', 'Deep breaths — 5 slow rounds'],
    reward: { xp: 25, bond: 10 },
  },
];

export function getWorkout(id) {
  return WORKOUTS.find((w) => w.id === id) || null;
}

export default WORKOUTS;
