// What real-world effort is worth: XP and evolve points, in one table.
//
// Levels alone used to decide this: hit level 5 and your companion evolved,
// once, and that was the end of the line. Two problems with that. It made XP the
// only thing that mattered, and XP mostly comes from battles — so the player who
// lifted five days a week and the player who fought a lot of obstacles were
// indistinguishable. And a single evolution meant the companion stopped changing
// about a week in.
//
// Evolve points fix both. Everything that is real effort in the real world
// contributes, and the four things the player actually does all feed the same
// pool: lifting, hitting a new max, covering distance, and keeping daily habits.
// A new personal best is worth the most, because it is the hardest to fake and
// the clearest evidence that something changed.
//
// Points are PER COMPANION. They are earned by the companion that was with you,
// so swapping in a fresh team member does not inherit the work.

export const EVO_SOURCES = {
  // Setting a personal best is the strongest signal in the app that you are
  // actually getting stronger, so it pays the most of any single event. It
  // covers all three kinds: more weight on a lift, more reps on a bodyweight
  // movement, and a longer hold on a plank — beatsRecord scores each on its
  // own terms, so they all arrive here the same way.
  pr: { points: 5, xp: 20, label: 'a new personal best' },
  session: { points: 3, xp: 0, label: 'a workout session' },
  milestone: { points: 2, xp: 0, label: 'a distance milestone' },
  habit: { points: 2, xp: 0, label: 'a daily goal met' },
  battle: { points: 1, xp: 0, label: 'a battle won' },
};

// Walking. Paid per mile rather than per milestone so no distance is lost, with
// the fraction carried in stats — steps arrive a thousandth of a mile at a time
// and rounding each one would floor every single step to zero XP.
export const XP_PER_MILE = 25;

export function pointsFor(source, n = 1) {
  const s = EVO_SOURCES[source];
  return s ? s.points * n : 0;
}

export function xpFor(source, n = 1) {
  const s = EVO_SOURCES[source];
  return s ? (s.xp || 0) * n : 0;
}

// What the next stage costs. Lives on the creature so different lines can
// diverge later; null when a creature is fully evolved.
export function requirementFor(creature) {
  if (!creature || !creature.evolvesTo) return null;
  const need = creature.evolveNeed || {};
  return {
    level: need.level || creature.evolveLevel || 5,
    points: need.points || creature.evolvePoints || 0,
    behavior: need.behavior || null,
  };
}

// Progress toward the next stage, for both the gate and the UI. Returns null
// when there is nothing left to evolve into, so callers can render "final form"
// rather than a bar stuck at 100%.
export function evolveProgress(member, creature, level) {
  const need = requirementFor(creature);
  if (!need) return null;
  const points = (member && member.evo) || 0;
  const levelOk = level >= need.level;
  const pointsOk = points >= need.points;
  const behave = need.behavior || null;
  const behaviorHave = behave
    ? ((member && member.behaviors && member.behaviors[behave.kind]) || 0)
    : 0;
  const behaviorNeed = behave ? behave.amount : 0;
  const behaviorOk = !behave || behaviorHave >= behaviorNeed;
  return {
    points,
    level,
    need,
    needPoints: need.points,
    needLevel: need.level,
    levelOk,
    pointsOk,
    behaviorHave,
    behaviorNeed,
    behaviorOk,
    behavior: behave,
    ready: levelOk && pointsOk && behaviorOk,
    // Fraction of the way there on the slower of the two axes, so the bar
    // reflects whatever is actually holding you back.
    pct: Math.min(
      need.points ? points / need.points : 1,
      need.level ? Math.min(1, level / need.level) : 1
    ),
  };
}

export function canEvolve(member, creature, level) {
  const p = evolveProgress(member, creature, level);
  return !!p && p.ready;
}

// One plain sentence about what is still missing. Says the specific thing
// rather than "keep going" — the player can act on "3 more points".
export function evolveHint(member, creature, level) {
  const p = evolveProgress(member, creature, level);
  if (!p) return 'Fully evolved.';
  if (p.ready) return 'Ready to evolve!';
  const bits = [];
  if (!p.levelOk) bits.push(`${p.needLevel - p.level} more level${p.needLevel - p.level === 1 ? '' : 's'}`);
  if (!p.pointsOk) bits.push(`${p.needPoints - p.points} more evolve points`);
  const behave = p.behavior || (p.need && p.need.behavior);
  if (behave) {
    const have = p.behaviorHave || 0;
    const amount = p.behaviorNeed || behave.amount;
    if (have < amount) {
      bits.push(behave.hint || `${have} / ${amount} ${behave.kind}`);
    }
  }
  return `Needs ${bits.join(' and ')}.`;
}

export default { EVO_SOURCES, XP_PER_MILE, pointsFor, xpFor, requirementFor, evolveProgress, canEvolve, evolveHint };
