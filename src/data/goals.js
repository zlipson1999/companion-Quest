// The life goal the player picks at the start. Each goal pairs them with an
// original starter companion and sets the tone for their journey. Phase 3 will
// let goals weight which "life modules" feed progression most.

export const GOALS = [
  {
    id: 'distance',
    name: 'Go the Distance',
    tagline: 'Move more, every day.',
    description: 'Build a daily walking habit. Your steps are your strength.',
    starterId: 'dewbble',
    focus: 'steps',
  },
  {
    id: 'strength',
    name: 'Build Strength',
    tagline: 'Get a little stronger each day.',
    description: 'Take on workouts and challenges. Push, lift, and rise.',
    starterId: 'emberkit',
    focus: 'workouts',
  },
  {
    id: 'balance',
    name: 'Find Balance',
    tagline: 'Healthy, steady, sustainable.',
    description: 'A calm mix of movement and consistency. Progress without burnout.',
    starterId: 'sproutle',
    focus: 'consistency',
  },
];

export function getGoal(id) {
  return GOALS.find((g) => g.id === id) || null;
}

export default GOALS;
