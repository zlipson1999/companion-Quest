// Stillness — a few minutes of doing nothing, on purpose.
//
// The plainest possible proof that the plugin interface is generic: no
// equipment, no reps, no distance, nothing to measure but time, and it still
// grows your companion through exactly the same reducer path as a battle.

import { palette } from '../theme/colors';

const MEDITATION = {
  id: 'meditation',
  name: 'Stillness',
  tagline: 'A few minutes of nothing',
  sprite: 'mod_still',
  spritePalette: 'dew',
  color: palette.water,
  unit: 'minutes',
  dailyGoal: 10,
  blurb: 'Sit, breathe, and let the day settle. Two minutes counts — the habit matters more than the length.',

  actions: [
    { id: 'two', label: 'Two Minutes', sublabel: 'just breathe', amount: 2, reward: { xp: 4, bond: 3 } },
    { id: 'five', label: 'Five Minutes', sublabel: 'settle in', amount: 5, reward: { xp: 10, bond: 6, heal: 8 } },
    { id: 'ten', label: 'Ten Minutes', sublabel: 'a proper sit', amount: 10, reward: { xp: 20, bond: 12, heal: 15 } },
    { id: 'scan', label: 'Body Scan', sublabel: 'slow, head to toe', amount: 15, reward: { xp: 26, bond: 14, heal: 20 } },
  ],

  goalReward: { xp: 28, bond: 12 },

  summary(day) {
    if (day.goalHit) return 'Ten minutes of quiet, banked. Your companion is noticeably calmer.';
    if (!day.count) return 'Nothing yet today. Two minutes is a real start.';
    return `${day.count} of ${MEDITATION.dailyGoal} minutes. The rest will keep.`;
  },

  cheer(day) {
    if (day.goalHit) return 'That quiet suits us both.';
    return 'Even a little of that helps. I can tell.';
  },
};

export default MEDITATION;
