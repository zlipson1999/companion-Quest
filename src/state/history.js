// A rolling record of what you actually did, day by day.
//
// The modules each know today. Nothing knew last Tuesday — which made three
// things impossible: recovery (is this the fourth hard day in a row?), personal
// records (was that a better session than last time?), and any weekly view.
// This is the shared substrate for all of them.
//
// Pure and dependency-light on purpose: every function here is a plain
// transform over `{ [dateKey]: dayRecord }`, so it can be tested without React,
// AsyncStorage or a running app.

import { dayBefore, todayKey } from '../modules/daily';

// Two months is enough for a 28-day chronic load window plus room to look back
// a few weeks, and small enough that the save stays trivial.
export const KEEP_DAYS = 60;

export function blankDay(date) {
  return {
    date: date || todayKey(),
    xp: 0,
    bond: 0,
    distanceMi: 0,
    battles: 0,
    workouts: 0,
    habitLogs: 0,
    goalsMet: 0,
    load: 0,        // training strain, from the Forge analyser
    sessions: 0,    // Forge sessions logged
    rested: false,  // an explicitly logged rest day
  };
}

export function dayIn(history, date) {
  return { ...blankDay(date), ...((history || {})[date] || {}) };
}

// Merge a patch into a day. Numbers ADD (two logs on the same day accumulate);
// booleans are OR'd. This is the only writer.
export function stamp(history, date, patch) {
  const day = dayIn(history, date);
  const next = { ...day };
  Object.keys(patch || {}).forEach((k) => {
    const v = patch[k];
    if (typeof v === 'number') next[k] = (next[k] || 0) + v;
    else if (typeof v === 'boolean') next[k] = next[k] || v;
    else next[k] = v;
  });
  next.date = date;
  return { ...(history || {}), [date]: next };
}

// Drop anything older than the window so the save cannot grow without bound.
export function trim(history, date, keep) {
  const days = new Set(datesBack(date || todayKey(), keep || KEEP_DAYS));
  const out = {};
  Object.keys(history || {}).forEach((d) => {
    if (days.has(d)) out[d] = history[d];
  });
  return out;
}

// n date keys ending at `date`, oldest first.
export function datesBack(date, n) {
  const out = [];
  let d = date || todayKey();
  for (let i = 0; i < n; i += 1) {
    out.unshift(d);
    d = dayBefore(d);
  }
  return out;
}

export function lastDays(history, date, n) {
  return datesBack(date || todayKey(), n).map((d) => dayIn(history, d));
}

// Monday-start week containing `date`.
export function weekStart(date) {
  const d = new Date((date || todayKey()) + 'T00:00:00');
  const shift = (d.getDay() + 6) % 7; // Sun=0 -> 6, Mon=1 -> 0
  d.setDate(d.getDate() - shift);
  return todayKey(d);
}

export function weekOf(history, date) {
  const start = weekStart(date);
  const d = new Date(start + 'T00:00:00');
  const out = [];
  for (let i = 0; i < 7; i += 1) {
    out.push(dayIn(history, todayKey(d)));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function previousWeekOf(history, date) {
  const start = weekStart(date);
  const d = new Date(start + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return weekOf(history, todayKey(d));
}

export function totals(days) {
  return (days || []).reduce(
    (t, d) => ({
      xp: t.xp + (d.xp || 0),
      bond: t.bond + (d.bond || 0),
      distanceMi: t.distanceMi + (d.distanceMi || 0),
      battles: t.battles + (d.battles || 0),
      workouts: t.workouts + (d.workouts || 0),
      habitLogs: t.habitLogs + (d.habitLogs || 0),
      goalsMet: t.goalsMet + (d.goalsMet || 0),
      load: t.load + (d.load || 0),
      sessions: t.sessions + (d.sessions || 0),
      activeDays: t.activeDays + (isActive(d) ? 1 : 0),
      restDays: t.restDays + (d.rested ? 1 : 0),
    }),
    { xp: 0, bond: 0, distanceMi: 0, battles: 0, workouts: 0, habitLogs: 0, goalsMet: 0, load: 0, sessions: 0, activeDays: 0, restDays: 0 }
  );
}

// "Active" means you did something real, not that the app was opened.
export function isActive(day) {
  if (!day) return false;
  return !!(day.sessions || day.workouts || day.battles || day.habitLogs || (day.distanceMi || 0) >= 0.25);
}

export default { blankDay, dayIn, stamp, trim, lastDays, weekOf, previousWeekOf, totals, isActive, weekStart, datesBack, KEEP_DAYS };
