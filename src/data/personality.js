// Personality playback for companions that carry a personality blob
// (Horizon families). Original Grove faces have none — callers must
// tolerate a missing blob. Nothing here changes XP, bond, or combat.

export function personalityOf(creature) {
  return (creature && creature.personality) || null;
}

export function idleLine(creature, at = Date.now()) {
  const p = personalityOf(creature);
  if (!p || !p.idle || !p.idle.length) return null;
  const i = Math.floor(at / 18000) % p.idle.length;
  return p.idle[i];
}

export function encourageLine(creature, at = Date.now()) {
  const p = personalityOf(creature);
  if (!p || !p.encourage || !p.encourage.length) return null;
  const i = Math.floor(at / 40000) % p.encourage.length;
  return p.encourage[i];
}

export function bondMilestone(creature, bond) {
  const p = personalityOf(creature);
  if (!p || !p.milestones) return null;
  const keys = Object.keys(p.milestones)
    .map(Number)
    .filter((n) => bond >= n)
    .sort((a, b) => a - b);
  if (!keys.length) return null;
  return p.milestones[String(keys[keys.length - 1])];
}

export default { personalityOf, idleLine, encourageLine, bondMilestone };
