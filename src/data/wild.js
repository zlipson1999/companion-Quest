// Wild encounters found in the Route's tall grass. Two kinds: befriendable
// companions (catchable) and bad-habit obstacles (cleared only).

import { WILD_COMPANION_IDS, getCreature } from './creatures';
import { ENCOUNTERS } from './obstacles';

// Encounter stats for wild companions (weaker than your team so catching is
// realistic). xp/bond are the rewards for befriending (or defeating).
export const WILD_COMPANIONS = {
  sproutle: { hp: 42, xp: 26, bond: 6 },
  emberkit: { hp: 44, xp: 26, bond: 6 },
  dewbble: { hp: 40, xp: 26, bond: 6 },
  pebblepup: { hp: 48, xp: 34, bond: 8 },
  wispurr: { hp: 38, xp: 32, bond: 8 },
  sporelet: { hp: 44, xp: 32, bond: 8 },
};

// Roll a wild encounter. ~55% a befriendable companion, ~45% a bad-habit
// obstacle whose pool grows as you get farther along (milestone index).
export function rollWildEncounter(milestone = 1) {
  const isCompanion = Math.random() < 0.55;
  if (isCompanion) {
    const id = WILD_COMPANION_IDS[Math.floor(Math.random() * WILD_COMPANION_IDS.length)];
    const c = getCreature(id);
    const stats = WILD_COMPANIONS[id] || { hp: Math.floor((c.baseHp || 50) * 0.7), xp: 28, bond: 6 };
    return { creatureId: id, isCompanion: true, hp: stats.hp, xp: stats.xp, bond: stats.bond, catchRate: c.catchRate || 0.5 };
  }
  const pool = Object.values(ENCOUNTERS).filter((e) => e.minMilestone <= milestone);
  const list = pool.length ? pool : [ENCOUNTERS.sludgewad];
  const e = list[Math.floor(Math.random() * list.length)];
  return { creatureId: e.creatureId, isCompanion: false, hp: e.hp, xp: e.xp, bond: e.bond, catchRate: 0 };
}

export default rollWildEncounter;
