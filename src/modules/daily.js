// Shared plumbing for life modules.
//
// Every module tracks the SAME daily shape — today's counter plus lifetime and
// streak history — so the registry, the reducer and the Habits UI can treat any
// module identically. A module only describes WHAT counts; this file owns the
// calendar: rolling the day over, preserving streaks, and turning a logged
// action into a progression reward.

// Days are LOCAL, not UTC: a glass of water logged at 9pm has to count for the
// day you actually drank it.
export function todayKey(d) {
  const dt = d || new Date();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${m}-${day}`;
}

export function dayBefore(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

// The canonical per-module state. `count`/`entries` belong to `date`;
// everything else survives the day rolling over.
export function freshDay(date) {
  return {
    date: date || todayKey(),
    count: 0,
    entries: [],
    goalHit: false,
    streak: 0,
    bestStreak: 0,
    lastGoalDate: null,
    goalDays: 0,
    totalCount: 0,
    totalLogs: 0,
  };
}

// Fill in anything a module state is missing (older save, new field) without
// touching which day it belongs to.
export function normalizeDay(modState) {
  const stored = modState || {};
  return { ...freshDay(stored.date), ...stored, entries: Array.isArray(stored.entries) ? stored.entries : [] };
}

// Normalize and, if the stored day is stale, start a new one. A streak survives
// only if the goal was met today or yesterday — otherwise the chain is broken.
export function rollDay(modState, date) {
  const day = date || todayKey();
  const base = normalizeDay(modState);
  if (base.date === day) return base;
  const chained = base.lastGoalDate === day || base.lastGoalDate === dayBefore(day);
  return { ...base, date: day, count: 0, entries: [], goalHit: false, streak: chained ? base.streak : 0 };
}

// Today's standing for a module. A module may override with its own progress().
export function progressFor(module, modState) {
  const day = normalizeDay(modState);
  const goal = module.dailyGoal || 1;
  const custom = typeof module.progress === 'function' ? module.progress(day) : null;
  if (custom) return custom;
  return {
    value: day.count,
    goal,
    ratio: goal > 0 ? Math.min(1, day.count / goal) : 0,
    done: day.count >= goal,
    remaining: Math.max(0, goal - day.count),
  };
}

// Apply one of the module's actions. Pure: returns the next module state, the
// reward to feed the shared progression, and whether this log completed the
// daily goal (which pays the module's bonus on top). The reducer and the log
// screen both call this, so the preview the player sees is the real thing.
export function applyLog(module, modState, action, date) {
  if (!module || !action) return null;
  const day = rollDay(modState, date);
  const amount = action.amount == null ? 1 : action.amount;

  const logged =
    (typeof action.apply === 'function' ? action.apply(day) : null) || {
      ...day,
      count: day.count + amount,
      entries: [...day.entries, { actionId: action.id, label: action.label, amount }],
      totalCount: day.totalCount + amount,
      totalLogs: day.totalLogs + 1,
    };

  const goal = module.dailyGoal || 1;
  const goalJustHit = !day.goalHit && logged.count >= goal;

  let next = logged;
  if (goalJustHit) {
    const streak = day.lastGoalDate === dayBefore(logged.date) ? day.streak + 1 : 1;
    next = {
      ...logged,
      goalHit: true,
      lastGoalDate: logged.date,
      streak,
      bestStreak: Math.max(day.bestStreak || 0, streak),
      goalDays: (day.goalDays || 0) + 1,
    };
  }

  const bonus = (goalJustHit && module.goalReward) || {};
  const base = action.reward || {};
  const reward = { xp: (base.xp || 0) + (bonus.xp || 0), bond: (base.bond || 0) + (bonus.bond || 0) };

  return { state: next, reward, goalJustHit, streak: next.streak, amount };
}

export default { todayKey, dayBefore, freshDay, normalizeDay, rollDay, progressFor, applyLog };
