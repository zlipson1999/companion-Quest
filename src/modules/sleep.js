// Sleep — the highest-leverage recovery behaviour there is, and the one a
// fitness app usually ignores because you cannot grind it.
//
// Logged once per night rather than accumulated: the actions SET the night's
// hours instead of adding to them, using the interface's `apply` hook. Picking a
// second band corrects the entry rather than claiming sixteen hours of sleep.
//
// Rewards lean on bond and healing rather than XP. Sleeping well is not effort;
// it is the thing that makes effort pay off, and your companion recovers with you.

import { palette } from '../theme/colors';

function night(label, hours) {
  return (day) => ({
    ...day,
    count: hours,
    entries: [{ actionId: label, label, amount: hours }],
    totalCount: day.totalCount + hours,
    totalLogs: day.totalLogs + 1,
  });
}

const SLEEP = {
  id: 'sleep',
  name: 'Sleep',
  tagline: 'The hours that make the rest work',
  sprite: 'mod_moon',
  spritePalette: 'snooze',
  color: palette.primary,
  unit: 'hours',
  dailyGoal: 8,
  // One value per night, not a running total: the actions overwrite the entry.
  // See applyLog — this changes how the daily reward cap applies.
  replaces: true,
  blurb: 'Log last night honestly — including the bad ones. A short night is information, not a failure.',

  actions: [
    { id: 'short', label: 'Under 6 hours', sublabel: 'a rough night', amount: 5, reward: { xp: 4, bond: 2 }, apply: night('Under 6 hours', 5) },
    { id: 'six', label: '6 to 7 hours', sublabel: 'not quite enough', amount: 6.5, reward: { xp: 10, bond: 5, heal: 10 }, apply: night('6 to 7 hours', 6.5) },
    { id: 'seven', label: '7 to 8 hours', sublabel: 'a good night', amount: 7.5, reward: { xp: 16, bond: 8, heal: 20 }, apply: night('7 to 8 hours', 7.5) },
    { id: 'eight', label: '8 hours or more', sublabel: 'fully rested', amount: 8.5, reward: { xp: 18, bond: 10, heal: 25 }, apply: night('8 hours or more', 8.5) },
  ],

  goalReward: { xp: 30, bond: 14 },

  summary(day) {
    if (!day.count) return 'Last night not logged yet.';
    if (day.goalHit) return `${day.count} hours. That is the good stuff — everything else works better on this.`;
    const gap = Math.round((SLEEP.dailyGoal - day.count) * 10) / 10;
    return `${day.count} hours logged, ${gap} short of a full night. No guilt — just worth knowing.`;
  },

  cheer(day) {
    if (day.goalHit) return 'I feel completely restored. Let’s make today count.';
    if (day.count && day.count < 6) return 'A rough one. Go gently today — that is not weakness, it is sense.';
    return 'Noted. Sleep is the training nobody sees.';
  },
};

export default SLEEP;
