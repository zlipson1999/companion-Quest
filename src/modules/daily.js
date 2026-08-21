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
    paid: null,       // `replaces` modules only: the most this day has already paid
    goalCredit: null, // what crediting the goal overwrote, so it can be undone
    bonusPaid: false, // the once-a-day goalReward, paid at most once
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
  return {
    ...base,
    date: day,
    count: 0,
    entries: [],
    goalHit: false,
    paid: null,
    goalCredit: null,
    bonusPaid: false,
    streak: chained ? base.streak : 0,
  };
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
//
// REWARDS ARE CAPPED AT THE DAILY GOAL. Only the portion of a log that lands
// inside today's goal earns XP/bond; anything past it is still tallied (it is
// true, and lifetime totals want it) but pays nothing. Without this, tapping a
// log button is a free progression button — which is exactly what this game
// does not have. One honest day is worth one day's growth, no matter how many
// times the screen is tapped.
// `capped` lets a module's own screen report that LESS of an action was
// performed than the action describes — the Forge logging three of five blocks.
// It can only ever reduce: the clamp below means a screen can never award more
// than the action is worth, so this cannot become a back door.
function clampReward(full, capped) {
  if (!capped) return full;
  return {
    xp: Math.max(0, Math.min(full.xp, capped.xp == null ? full.xp : capped.xp)),
    bond: Math.max(0, Math.min(full.bond, capped.bond == null ? full.bond : capped.bond)),
    heal: Math.max(0, Math.min(full.heal, capped.heal == null ? full.heal : capped.heal)),
  };
}

export function applyLog(module, modState, action, date, capped) {
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
  const meetsNow = logged.count >= goal;
  const goalJustHit = !day.goalHit && meetsNow;

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
      // Remember what crediting overwrote so a downward correction can undo it.
      goalCredit: { streak: day.streak, lastGoalDate: day.lastGoalDate, goalDays: day.goalDays || 0 },
    };
  } else if (module.replaces && day.goalHit && !meetsNow) {
    // A `replaces` module's value can go DOWN — you slept eight hours, then
    // corrected it to five. Latching goalHit there credited a day that did not
    // happen, and the streak chained off it tomorrow. Roll the credit back.
    const before = day.goalCredit || { streak: 0, lastGoalDate: null, goalDays: Math.max(0, (day.goalDays || 1) - 1) };
    next = {
      ...logged,
      goalHit: false,
      streak: before.streak,
      lastGoalDate: before.lastGoalDate,
      goalDays: before.goalDays,
      goalCredit: null,
    };
  }

  // The goal bonus is paid at most once per day, tracked separately from
  // goalHit. Without this, a `replaces` module could re-earn it every time the
  // entry was corrected down and back up again — 8h, 5h, 8h, forever.
  const bonus = (goalJustHit && !day.bonusPaid && module.goalReward) || {};
  const payingBonus = !!(bonus.xp || bonus.bond || bonus.heal);
  const base = action.reward || {};
  // heal rides the same path (applyEffect understands it) so a recovery-shaped
  // module can restore HP instead of only granting XP.
  const full = clampReward({ xp: base.xp || 0, bond: base.bond || 0, heal: base.heal || 0 }, capped);

  let reward;
  let credited;
  if (module.replaces) {
    // A `replaces` module records one value for the day (last night's sleep),
    // so it cannot be farmed by logging again — the entry is overwritten.
    // Pro-rating against the goal would be actively wrong here: it would pay
    // LESS for sleeping nine hours than for eight. Instead pay the difference
    // between what this log is worth and what the day has already paid, so
    // correcting an entry upward tops you up and correcting it downward simply
    // pays nothing rather than clawing back.
    const paid = day.paid || { xp: 0, bond: 0, heal: 0 };
    reward = {
      xp: Math.max(0, full.xp - (paid.xp || 0)) + (bonus.xp || 0),
      bond: Math.max(0, full.bond - (paid.bond || 0)) + (bonus.bond || 0),
      heal: Math.max(0, full.heal - (paid.heal || 0)) + (bonus.heal || 0),
    };
    credited = 1;
    next = {
      ...next,
      paid: {
        xp: Math.max(paid.xp || 0, full.xp),
        bond: Math.max(paid.bond || 0, full.bond),
        heal: Math.max(paid.heal || 0, full.heal),
      },
    };
  } else {
    // Portion of this log that still counted toward an unmet goal.
    credited = amount > 0 ? Math.max(0, Math.min(amount, goal - day.count)) / amount : 0;
    reward = {
      xp: Math.round(full.xp * credited) + (bonus.xp || 0),
      bond: Math.round(full.bond * credited) + (bonus.bond || 0),
      heal: Math.round(full.heal * credited) + (bonus.heal || 0),
    };
  }

  if (payingBonus) next = { ...next, bonusPaid: true };

  return { state: next, reward, goalJustHit, streak: next.streak, amount, credited };
}

export default { todayKey, dayBefore, freshDay, normalizeDay, rollDay, progressFor, applyLog };
