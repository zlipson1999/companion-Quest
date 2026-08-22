// Battle "moves" are REAL exercises. You pick one, do it in real life, confirm,
// and that's how you deal damage. No fake attacks — your effort is the attack.
//
// kind: 'reps'  -> do `target` repetitions
//       'hold'  -> hold for `target` seconds (battle shows a live timer)
// power: base damage dealt on confirm (scaled a little by companion level)

export const EXERCISES = {
  pushups: { id: 'pushups', name: 'Push-Up Press', exercise: 'Push-ups', kind: 'reps', target: 10, power: 18, blurb: 'Drop and give your obstacle ten!' },
  squats: { id: 'squats', name: 'Squat Quake', exercise: 'Squats', kind: 'reps', target: 15, power: 20, blurb: 'Sink low and rise strong — 15 squats.' },
  jacks: { id: 'jacks', name: 'Jumping Jolt', exercise: 'Jumping jacks', kind: 'reps', target: 20, power: 16, blurb: 'Get the heart pumping — 20 jumping jacks.' },
  plank: { id: 'plank', name: 'Plank Guard', exercise: 'Plank', kind: 'hold', target: 20, power: 24, blurb: 'Hold a steady plank and brace.' },
  lunges: { id: 'lunges', name: 'Lunge Lash', exercise: 'Lunges', kind: 'reps', target: 12, power: 19, blurb: 'Step through 12 alternating lunges.' },
  highknees: { id: 'highknees', name: 'High-Knee Rush', exercise: 'High knees', kind: 'reps', target: 30, power: 17, blurb: 'Drive those knees — 30 high knees.' },
  burpees: { id: 'burpees', name: 'Burpee Blast', exercise: 'Burpees', kind: 'reps', target: 8, power: 28, blurb: 'The big one — 8 full burpees.' },
  situps: { id: 'situps', name: 'Core Crunch', exercise: 'Sit-ups', kind: 'reps', target: 15, power: 18, blurb: 'Engage the core — 15 sit-ups.' },
};

// The 4 moves shown in the battle's 2x2 action menu (legacy fallback — the
// menu is built by battleMovesFor now, which knows about levels and stages).
export const BATTLE_MOVES = ['pushups', 'squats', 'jacks', 'plank'];

export function getExercise(id) {
  return EXERCISES[id] || null;
}

// ---------------------------------------------------------------- learnset
// Moves unlock as the companion levels, and UPGRADE as it evolves. Both halves
// stay honest to the premise: a higher-level team has earned harder exercises,
// and an evolved companion asks more of you because you have already proven
// you can give more.

export const LEARNSET = [
  { id: 'pushups', atLevel: 1 },
  { id: 'squats', atLevel: 1 },
  { id: 'jacks', atLevel: 1 },
  { id: 'plank', atLevel: 1 },
  { id: 'lunges', atLevel: 3 },
  { id: 'situps', atLevel: 5 },
  { id: 'highknees', atLevel: 7 },
  { id: 'burpees', atLevel: 10 },
];

// Tier comes from the companion's evolution STAGE, not raw level — evolving is
// the upgrade moment, so that is when the moves visibly change with it.
// Tier II: +50% target, +8 power. Tier III: double target, +18 power.
const TIER_SUFFIX = ['', ' II', ' III'];
const TIER_TARGET = [1, 1.5, 2];
const TIER_POWER = [0, 8, 18];

export function decorateMove(base, stage) {
  const t = Math.max(0, Math.min(2, (stage || 1) - 1));
  if (!base) return null;
  const target = Math.round(base.target * TIER_TARGET[t]);
  return {
    ...base,
    name: base.name + TIER_SUFFIX[t],
    target,
    power: base.power + TIER_POWER[t],
    tier: t + 1,
    blurb: base.kind === 'hold'
      ? `Hold a steady ${base.exercise.toLowerCase()} for ${target} seconds.`
      : `${base.blurb.replace(/\d+/, String(target))}`,
  };
}

// The 2x2 battle menu: the three strongest unlocked rep moves plus the best
// hold, so variety of KIND survives even when burpees out-damage everything.
export function battleMovesFor(level, stage) {
  const unlocked = LEARNSET.filter((m) => level >= m.atLevel).map((m) => EXERCISES[m.id]);
  const reps = unlocked.filter((m) => m.kind === 'reps').sort((a, b) => b.power - a.power).slice(0, 3);
  const hold = unlocked.filter((m) => m.kind === 'hold').sort((a, b) => b.power - a.power)[0];
  return [...reps, hold].filter(Boolean).slice(0, 4).map((m) => decorateMove(m, stage));
}

// Which moves a level-up just unlocked, for the "learned X!" beat.
export function movesLearnedBetween(beforeLevel, afterLevel) {
  return LEARNSET.filter((m) => m.atLevel > beforeLevel && m.atLevel <= afterLevel).map((m) => EXERCISES[m.id]);
}

export default EXERCISES;


// ------------------------------------------------------------- breakdown
// What the session actually consisted of, rather than one total.
//
// "42 reps" is a number; "10 push-ups, 15 squats, 20s plank" is what you did.
// Tallies are kept per exercise id in `stats.exercises` and read here as a
// difference against a baseline, the same way distance and reps are, so a
// session breakdown costs no extra bookkeeping while you play.
//
// Routines are tallied under a `workout:` prefix in the same map. They count
// how many TIMES you did the routine, not repetitions of anything, so they
// format differently and the formatter has to know which is which.
export const WORKOUT_TALLY_PREFIX = 'workout:';

export function breakdownSince(now = {}, base = {}, workoutName) {
  return Object.keys(now)
    .map((id) => ({ id, amount: (now[id] || 0) - (base[id] || 0) }))
    .filter((e) => e.amount > 0)
    .map((e) => {
      if (e.id.startsWith(WORKOUT_TALLY_PREFIX)) {
        const wid = e.id.slice(WORKOUT_TALLY_PREFIX.length);
        return { ...e, kind: 'workout', name: (workoutName && workoutName(wid)) || wid };
      }
      const ex = EXERCISES[e.id];
      return { ...e, kind: ex ? ex.kind : 'reps', name: ex ? ex.exercise : e.id };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function formatBreakdown(list) {
  return list
    .map((e) => {
      if (e.kind === 'workout') return e.amount > 1 ? `${e.name} x${e.amount}` : e.name;
      return e.kind === 'hold' ? `${e.amount}s ${e.name}` : `${e.amount} ${e.name}`;
    })
    .join(' · ');
}
