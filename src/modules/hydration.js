// Hydration — the reference life module.
//
// Nothing here knows about battles, the Route or the reducer. It declares what
// counts (glasses of water), what a good day looks like (dailyGoal) and what
// each log is worth; the registry and GameContext do the rest.

import { palette } from '../theme';

const HYDRATION = {
  id: 'hydration',
  name: 'Hydration',
  tagline: 'Water in, energy out',
  sprite: 'mod_droplet',
  spritePalette: 'dew',
  color: palette.water,
  unit: 'glasses',
  dailyGoal: 8,
  blurb: 'Eight glasses across the day keeps your companion bright-eyed. Log each one as you actually drink it.',

  actions: [
    {
      id: 'glass',
      label: 'Glass of Water',
      sublabel: 'about 8 oz',
      amount: 1,
      reward: { xp: 8, bond: 3 },
    },
    {
      id: 'bottle',
      label: 'Full Bottle',
      sublabel: 'about 24 oz',
      amount: 3,
      reward: { xp: 22, bond: 7 },
    },
    {
      id: 'tea',
      label: 'Warm Cup',
      sublabel: 'tea or broth',
      amount: 1,
      reward: { xp: 8, bond: 4 },
    },
  ],

  // Paid once, the moment the day's goal is reached.
  goalReward: { xp: 50, bond: 18 },

  summary(day) {
    const left = Math.max(0, HYDRATION.dailyGoal - day.count);
    if (day.goalHit) return 'Fully topped up for today. Nicely done.';
    if (day.count === 0) return 'Nothing logged yet today. A glass is a fine place to start.';
    return `${left} more ${left === 1 ? 'glass' : 'glasses'} to go.`;
  },

  cheer(day) {
    if (day.goalHit) return 'I feel clear and quick — that was all you!';
    if (day.count >= HYDRATION.dailyGoal / 2) return 'Halfway there. I can feel the difference already!';
    return 'Every sip counts. Keep it coming!';
  },
};

export default HYDRATION;
