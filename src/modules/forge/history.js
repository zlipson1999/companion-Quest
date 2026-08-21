// Per-plan session history and personal records.
//
// Without this every session is a one-off: you finish, you get XP, and the app
// forgets. Progressive overload — the actual mechanism strength comes from —
// needs the app to remember what you did last time and show it to you while you
// are deciding what to do now.
//
// Lives inside the Forge's own module state (module-owned data, persisted via
// MODULE_PATCH), so nothing outside src/modules learns about workout logs.

export const KEEP_SESSIONS = 120;

// One entry per logged session. Blocks are copied so a later edit to the plan
// does not rewrite history.
// `plan` here must be what was actually PERFORMED, not what was planned — see
// ForgeScreen, which filters to the ticked blocks before calling this. Recording
// the whole plan for a part-finished session set personal records on movements
// the player never did.
//
// `xp` is the XP actually BANKED, not the plan's theoretical value: a session
// logged after the daily goal is already met pays nothing, and the log should
// say so rather than claiming 74 XP.
export function sessionEntry(plan, analysis, date, load, bankedXp) {
  return {
    date,
    planId: plan.id,
    name: plan.name,
    sets: analysis.sets,
    volume: analysis.volume,
    minutes: analysis.minutes,
    intensity: Math.round(analysis.intensity * 100) / 100,
    xp: bankedXp == null ? analysis.reward.xp : bankedXp,
    partial: !!plan.partial,
    load: load || 0,
    blocks: (plan.blocks || []).map((b) => ({ movementId: b.movementId, sets: b.sets, amount: b.amount })),
  };
}

// Record a session and fold any new personal bests into `records`.
// Returns the module-owned fields to patch — never the daily counters.
export function recordSession(modState, entry) {
  const log = [entry, ...((modState && modState.log) || [])].slice(0, KEEP_SESSIONS);
  const records = { ...((modState && modState.records) || {}) };

  entry.blocks.forEach((b) => {
    const prev = records[b.movementId];
    // A record is the heaviest single set: most reps (or longest hold) done in
    // one set. Comparing total volume would let a long easy day beat a hard one.
    if (!prev || b.amount > prev.amount || (b.amount === prev.amount && b.sets > prev.sets)) {
      records[b.movementId] = { amount: b.amount, sets: b.sets, date: entry.date };
    }
  });

  const bests = { ...((modState && modState.bests) || {}) };
  const best = bests[entry.planId];
  if (!best || entry.volume > best.volume) {
    bests[entry.planId] = { volume: entry.volume, sets: entry.sets, date: entry.date };
  }

  return { log, records, bests };
}

export function historyFor(modState, planId) {
  return ((modState && modState.log) || []).filter((e) => e.planId === planId);
}

export function lastSession(modState, planId) {
  return historyFor(modState, planId)[0] || null;
}

// How this plan compares to the last time it was run. Null on a first run —
// there is nothing honest to say yet.
export function progressionFor(modState, planId, analysis) {
  const last = lastSession(modState, planId);
  if (!last) return null;
  const dv = Math.round((analysis.volume - last.volume) * 10) / 10;
  const ds = analysis.sets - last.sets;
  return {
    last,
    volumeDelta: dv,
    setsDelta: ds,
    improved: dv > 0 || ds > 0,
    unchanged: dv === 0 && ds === 0,
  };
}

// Which movements in this plan you would beat by doing it as written.
export function prTargets(modState, plan) {
  const records = (modState && modState.records) || {};
  return (plan.blocks || []).map((b) => {
    const pr = records[b.movementId];
    return { movementId: b.movementId, amount: b.amount, pr: pr || null, beats: !!pr && b.amount > pr.amount, isFirst: !pr };
  });
}

// New bests set by a session that has just been recorded.
export function prsSetBy(before, entry) {
  const prev = (before && before.records) || {};
  return entry.blocks.filter((b) => !prev[b.movementId] || b.amount > prev[b.movementId].amount);
}

export function daysBetweenKeys(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

export function agoLabel(dateKey, today) {
  const n = daysBetweenKeys(dateKey, today);
  if (n == null) return '';
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 7) return `${n} days ago`;
  if (n < 14) return 'last week';
  return `${Math.floor(n / 7)} weeks ago`;
}

export default { recordSession, sessionEntry, historyFor, lastSession, progressionFor, prTargets, prsSetBy, agoLabel };
