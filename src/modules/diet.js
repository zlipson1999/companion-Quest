// Nourish — the second reference life module. Same interface as Hydration, a
// completely different subject: proof the plugin shape is generic.
//
// Deliberately check-in based rather than calorie based. The game rewards
// showing up and eating well, never restriction or guilt.

import { palette } from '../theme';

const DIET = {
  id: 'diet',
  name: 'Nourish',
  tagline: 'Food that fuels you',
  sprite: 'mod_plate',
  spritePalette: 'sprout',
  color: palette.grass,
  unit: 'check-ins',
  dailyGoal: 5,
  blurb: 'Five honest check-ins a day. No calorie math, no guilt — just noticing what you fed yourself.',

  actions: [
    {
      id: 'balanced',
      label: 'Balanced Meal',
      sublabel: 'protein, veg, carbs',
      amount: 2,
      reward: { xp: 20, bond: 6 },
    },
    {
      id: 'produce',
      label: 'Fruit or Veg',
      sublabel: 'a whole serving',
      amount: 1,
      reward: { xp: 12, bond: 4 },
    },
    {
      id: 'mindful',
      label: 'Ate Mindfully',
      sublabel: 'slow, no screen',
      amount: 1,
      reward: { xp: 10, bond: 6 },
    },
    {
      id: 'prepped',
      label: 'Cooked It Myself',
      sublabel: 'home-made counts double',
      amount: 2,
      reward: { xp: 18, bond: 7 },
    },
  ],

  goalReward: { xp: 55, bond: 20 },

  summary(day) {
    const left = Math.max(0, DIET.dailyGoal - day.count);
    if (day.goalHit) return 'A well-fed day. Your companion ate well too.';
    if (day.count === 0) return 'No check-ins yet. Whatever you ate last — log it honestly.';
    return `${left} more check-${left === 1 ? 'in' : 'ins'} to go.`;
  },

  cheer(day) {
    if (day.goalHit) return 'That is real fuel. I can feel it!';
    if (day.count >= DIET.dailyGoal / 2) return 'Good choices stacking up. Keep going!';
    return 'One good choice at a time. That is how it works.';
  },
};

export default DIET;
