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

import { datesBack, isTraining, lastDays, observedDays } from './history';
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

// The ratio compares this week to a usual month. Before there IS a usual month
// it is meaningless — a first-ever session divides ~all the load by ~nothing and
// reports 4.0, so a brand-new player was greeted with "Time to rest" in red.
// Below these floors the ratio is reported but never drives the verdict.
export const MIN_OBSERVED_DAYS = 14;
export const MIN_CHRONIC_LOAD = 6;

export function computeRecovery(history, date) {
  const day = date || todayKey();
  const acuteDays = lastDays(history, day, ACUTE_DAYS);
  const chronicDays = lastDays(history, day, CHRONIC_DAYS);

  const acute = acuteDays.reduce((n, d) => n + (d.load || 0), 0);
  const chronicTotal = chronicDays.reduce((n, d) => n + (d.load || 0), 0);
  // Chronic is scaled to the same 7-day window so the ratio is like-for-like.
  const chronic = (chronicTotal / CHRONIC_DAYS) * ACUTE_DAYS;
  const ratio = chronic > 0 ? acute / chronic : 0;

  // Is there enough history behind the ratio to believe it?
  const observed = observedDays(history, datesBack(day, CHRONIC_DAYS));
  const ratioReliable = observed >= MIN_OBSERVED_DAYS && chronicTotal >= MIN_CHRONIC_LOAD;

  // Walk back counting unbroken TRAINING days. Counted over the CHRONIC window,
  // not the 7-day one: the advice quotes this number out loud, and capping it at
  // the acute window reported "6 days straight" to someone on day twelve.
  //
  // Today is skipped when it holds nothing yet — at 9am you have not broken a
  // streak, you just have not trained yet, and zeroing it there hid the warning
  // until after the session it was meant to prevent.
  const ordered = chronicDays.slice().reverse();
  let streak = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    const d = ordered[i];
    if (i === 0 && !d.rested && !isTraining(d)) continue; // today, still blank
    if (d.rested || !isTraining(d)) break;
    streak += 1;
  }

  const restedInLast7 = acuteDays.some((d) => d.rested || !isTraining(d));
  const hardSessions = acuteDays.reduce((n, d) => n + (d.sessions || 0), 0);

  let status = 'fresh';
  if (streak >= HARD_STREAK_LIMIT || (ratioReliable && ratio >= OVERREACH_RATIO)) status = 'overreaching';
  else if (acute > 0 && ratioReliable && ratio >= 1.05) status = 'building';
  else if (acute > 0) status = 'steady';
  else if (ratioReliable && ratio < DETRAIN_RATIO) status = 'rested';

  const needsRest = status === 'overreaching';
  // Three straight weeks of climbing load is where a deload earns its keep.
  const deloadDue =
    ratioReliable && acute > 0 && weeklyLoads(history, day, 3).every((w, i, a) => i === 0 || w > a[i - 1] * 1.1);

  return {
    acute: Math.round(acute * 10) / 10,
    chronic: Math.round(chronic * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    ratioReliable,
    observed,
    streak,
    restedInLast7,
    hardSessions,
    status,
    needsRest,
    deloadDue: !!deloadDue && status !== 'fresh',
    headline: HEADLINE[status],
    advice: adviceFor(status, streak, restedInLast7, ratioReliable),
  };
}

const HEADLINE = {
  fresh: 'Fresh',
  steady: 'Steady',
  building: 'Building',
  overreaching: 'Time to rest',
  rested: 'Well rested',
};

function adviceFor(status, streak, restedInLast7, ratioReliable) {
  if (status === 'overreaching') {
    if (streak >= HARD_STREAK_LIMIT) {
      return `${streak} days straight without a break. Take today off — you will come back stronger, and I would rather have you around next week.`;
    }
    return 'You have ramped up fast this week. An easy day now protects everything you have built.';
  }
  if (!ratioReliable && status !== 'fresh') {
    return 'Still learning your usual week. Keep logging and I will start telling you when to back off.';
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
