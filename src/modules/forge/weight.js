// Load on a set: what you meant to lift, and what you actually lifted.
//
// A block used to be `{ movementId, sets, amount }` — sets and reps and nothing
// else. That is enough to describe a bodyweight circuit and not enough to
// describe strength training at all: three sets of five is a completely
// different session at 95 lb and at 275 lb, and personal records that only
// compare reps cannot see the difference.
//
// `weight` is optional and additive. A block without one is a bodyweight block
// and behaves exactly as it did before, so every plan and every logged session
// written before this existed still reads correctly.
//
// IMPORTANT: weight deliberately does NOT feed the XP formula. See scoreSet.

export const WEIGHT_STEP = 5;
export const MAX_WEIGHT = 1500;

export const UNITS = { lb: { id: 'lb', label: 'lb' }, kg: { id: 'kg', label: 'kg' } };

export function unitLabel(settings) {
  const u = settings && settings.units;
  return (UNITS[u] || UNITS.lb).label;
}

export function weightOf(block) {
  const w = block && block.weight;
  return typeof w === 'number' && w > 0 ? Math.min(MAX_WEIGHT, w) : 0;
}

export function isWeighted(block) {
  return weightOf(block) > 0;
}

// How good a single set was, for the purpose of beating a record.
//
// Weighted sets score as an estimated one-rep max (Epley), so 135x8 correctly
// beats 155x3 while 185x5 beats both. Bodyweight sets score on reps alone,
// which is what the Forge did before weight existed.
//
// This score is used ONLY for personal records and the "beats your best" note.
// It is deliberately kept out of analysePlan's volume, and therefore out of XP:
// weight is a number the player types in and nobody can check, so letting it
// scale the reward would turn the weight field into a free progression button —
// the same reason applyLog only ever credits the portion of a log inside the
// daily goal.
export function scoreSet(block, movement) {
  const w = weightOf(block);
  const amount = Math.max(1, (block && block.amount) || 1);
  if (!w) return amount;
  // A held position does not have reps to extrapolate from, so it earns far
  // less credit per unit of time than a rep does.
  const factor = movement && movement.unit === 'seconds' ? 1 + amount / 120 : 1 + amount / 30;
  return w * factor;
}

// Is `now` a better set than the stored record `prev`?
//
// Adding external load to a movement you used to do unloaded is unambiguous
// progress, so a weighted set always beats an unweighted record rather than
// being compared against it on a scale that means something different.
export function beatsRecord(now, prev, movement) {
  if (!prev) return true;
  const nowW = isWeighted(now);
  const prevW = isWeighted(prev);
  if (nowW !== prevW) return nowW;
  const a = scoreSet(now, movement);
  const b = scoreSet(prev, movement);
  if (a !== b) return a > b;
  // Identical best set — more of them is still more work.
  return ((now && now.sets) || 0) > ((prev && prev.sets) || 0);
}

// "3 x 8 @ 135 lb", or "3 x 8" when there is no load to report.
export function formatSet(block, movement, unit = 'lb') {
  if (!block) return '';
  const noun = movement && movement.unit === 'seconds' ? 'sec' : 'reps';
  const base = `${block.sets} x ${block.amount} ${noun}`;
  return isWeighted(block) ? `${base} @ ${weightOf(block)} ${unit}` : base;
}

// The record itself, phrased for a one-line note.
export function formatRecord(record, movement, unit = 'lb') {
  if (!record) return '';
  const suffix = movement && movement.unit === 'seconds' ? 's' : '';
  return isWeighted(record)
    ? `${weightOf(record)} ${unit} x ${record.amount}`
    : `${record.amount}${suffix}`;
}

export default { weightOf, isWeighted, scoreSet, beatsRecord, formatSet, formatRecord, unitLabel };
