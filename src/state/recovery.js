// Recovery: the part of training the app was silently ignoring.
//
// Companion Quest rewards showing up. Left alone, that means it will cheer
// someone through eleven hard days in a row and never once suggest they stop —
// which is how people get hurt and quit. This reads the history and says the
// unpopular thing when it needs saying.
//
// The model is the standard acute-vs-chronic workload ratio, kept deliberately
// simple and explainable: how hard was the last week, relative to how hard the
// last month has been? Plus the blunter signal that actually predicts overuse —
// consecutive days without a break.
//
// It only ever ADVISES. Nothing here blocks a workout: an app does not get to
// tell an adult they may not train today.

import { lastDays, isActive } from './history';
import { todayKey } from '../modules/daily';

export const ACUTE_DAYS = 7;
export const CHRONIC_DAYS = 28;

// Consecutive training days beyond this without a rest day is the point where
// "consistent" turns into "grinding".
export const HARD_STREAK_LIMIT = 5;

// Ratios either side of ~1 mean this week matches the month. Well above means
// you have ramped up fast; well below means you have backed off.
export const OVERREACH_RATIO = 1.5;
export const DETRAIN_RATIO = 0.6;

export function computeRecovery(history, date) {
  const day = date || todayKey();
  const acuteDays = lastDays(history, day, ACUTE_DAYS);
  const chronicDays = lastDays(history, day, CHRONIC_DAYS);

  const acute = acuteDays.reduce((n, d) => n + (d.load || 0), 0);
  const chronicTotal = chronicDays.reduce((n, d) => n + (d.load || 0), 0);
  // Chronic is scaled to the same 7-day window so the ratio is like-for-like.
  const chronic = (chronicTotal / CHRONIC_DAYS) * ACUTE_DAYS;
  const ratio = chronic > 0 ? acute / chronic : 0;

  // Walk back from today counting unbroken training days.
  let streak = 0;
  for (let i = acuteDays.length - 1; i >= 0; i -= 1) {
    const d = acuteDays[i];
    if (d.rested || !isActive(d)) break;
    streak += 1;
  }

  const restedInLast7 = acuteDays.some((d) => d.rested || !isActive(d));
  const hardSessions = acuteDays.reduce((n, d) => n + (d.sessions || 0), 0);

  let status = 'fresh';
  if (streak >= HARD_STREAK_LIMIT || (chronic > 0 && ratio >= OVERREACH_RATIO)) status = 'overreaching';
  else if (acute > 0 && chronic > 0 && ratio >= 1.05) status = 'building';
  else if (acute > 0) status = 'steady';
  else if (chronicTotal > 0 && ratio < DETRAIN_RATIO) status = 'rested';

  const needsRest = status === 'overreaching';
  // Three straight weeks of climbing load is where a deload earns its keep.
  const deloadDue = weeklyLoads(history, day, 3).every((w, i, a) => i === 0 || w > a[i - 1] * 1.1) && acute > 0;

  return {
    acute: Math.round(acute * 10) / 10,
    chronic: Math.round(chronic * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    streak,
    restedInLast7,
    hardSessions,
    status,
    needsRest,
    deloadDue: !!deloadDue && status !== 'fresh',
    headline: HEADLINE[status],
    advice: adviceFor(status, streak, restedInLast7),
  };
}

const HEADLINE = {
  fresh: 'Fresh',
  steady: 'Steady',
  building: 'Building',
  overreaching: 'Time to rest',
  rested: 'Well rested',
};

function adviceFor(status, streak, restedInLast7) {
  if (status === 'overreaching') {
    if (streak >= HARD_STREAK_LIMIT) {
      return `${streak} days straight without a break. Take today off — you will come back stronger, and I would rather have you around next week.`;
    }
    return 'You have ramped up fast this week. An easy day now protects everything you have built.';
  }
  if (status === 'building') {
    return restedInLast7
      ? 'Load is climbing and you are still taking days off. This is exactly how it should look.'
      : 'Load is climbing. Pencil in a rest day before it becomes a decision your body makes for you.';
  }
  if (status === 'rested') return 'You have backed right off. Whenever you are ready, an easy session is a good way back in.';
  if (status === 'steady') return 'Nicely balanced. Same again this week would be a good week.';
  return 'Nothing logged recently. Start light — the first session back is not the one to prove anything with.';
}

// Total load per week, oldest first, for the last `n` weeks.
export function weeklyLoads(history, date, n) {
  const days = lastDays(history, date || todayKey(), n * 7);
  const out = [];
  for (let w = 0; w < n; w += 1) {
    out.push(days.slice(w * 7, w * 7 + 7).reduce((t, d) => t + (d.load || 0), 0));
  }
  return out;
}

// What a Forge session contributes. Volume already weights load superlinearly;
// intensity nudges hard-but-short sessions up where they belong.
export function loadOf(analysis) {
  if (!analysis || !analysis.sets) return 0;
  return Math.round(analysis.volume * (0.7 + analysis.intensity * 0.15) * 10) / 10;
}

export default { computeRecovery, loadOf, weeklyLoads, ACUTE_DAYS, CHRONIC_DAYS, HARD_STREAK_LIMIT };
