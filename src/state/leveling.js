// Progression math. Companion XP is stored as a lifetime total; level and the
// "XP into current level" bar are derived from it.

export function xpToNext(level) {
  return 40 + level * 20;
}

export function xpProgress(totalXp) {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level += 1;
  }
  return { level, into: remaining, needed: xpToNext(level) };
}

export function levelFromXp(totalXp) {
  return xpProgress(totalXp).level;
}

export function maxHpFor(creature, level) {
  const base = creature && creature.baseHp ? creature.baseHp : 60;
  return base + (level - 1) * 8;
}

export default { xpToNext, xpProgress, levelFromXp, maxHpFor };
