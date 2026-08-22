// Trail meetings revealed by movement. Two kinds: companions who may accept a
// bond invitation and bad-habit obstacles that must be cleared.

import { WILD_COMPANION_IDS, getCreature } from './creatures';
import { pickEncounter } from './obstacles';

// Encounter stats for trail companions (tuned so bonding is
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
  const e = pickEncounter(milestone);
  return { creatureId: e.creatureId, isCompanion: false, hp: e.hp, xp: e.xp, bond: e.bond, catchRate: 0 };
}

export default rollWildEncounter;

