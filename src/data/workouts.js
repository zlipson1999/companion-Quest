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
  // The gym's turf lane opens straight into this one. Walking stretches are
  // what a turf lane is FOR — you need the length to do them, which is why the
  // lane is a lane and not a mat.
  {
    id: 'warmup',
    name: 'Turf Lane Warm-Up',
    intensity: 'Easy',
    minutes: 6,
    description: 'Dynamic stretches, walked the length of the turf and back.',
    steps: [
      'Walking knee hug — up the lane, 10 each side',
      'Walking quad pull — back down, 10 each side',
      'Toy soldiers, straight leg — up the lane, 12 each side',
      'Walking lunge with a twist — back down, 8 each side',
      'Lateral shuffle — one length each way',
      'Skip through, easy — one length, and you are warm',
    ],
    reward: { xp: 22, bond: 8 },
  },
  // And the matting opens this one. Bodyweight and core is exactly the work
  // the mats exist for; everything here happens inside one mat's worth of
  // floor, with nothing to load and nothing to queue for.
  {
    id: 'core',
    name: 'Mat Floor Circuit',
    intensity: 'Medium',
    minutes: 12,
    description: 'Bodyweight and core, on the mats. Two rounds, no equipment.',
    steps: [
      'Dead bug — 10 each side, slowly',
      'Push-ups — as many as stay clean',
      'Hollow hold — 20 seconds',
      'Glute bridge — 15, pausing at the top',
      'Side plank — 20 seconds each side',
      'Rest 60 seconds, then run the whole thing again',
    ],
    reward: { xp: 48, bond: 12 },
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
