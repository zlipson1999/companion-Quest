// Trail meetings revealed by movement. Two kinds: companions who may accept a
// bond invitation and bad-habit obstacles that must be cleared.

import { WILD_COMPANION_IDS, getCreature } from './creatures';
import { ENCOUNTERS, pickEncounter } from './obstacles';

// Encounter stats for trail companions (tuned so bonding is
// realistic). xp/bond are the rewards for befriending (or defeating).
export const WILD_COMPANIONS = {
  mireblink: { hp: 40, xp: 32, bond: 8 },
  sproutle: { hp: 42, xp: 26, bond: 6 },
  emberkit: { hp: 44, xp: 26, bond: 6 },
  dewbble: { hp: 40, xp: 26, bond: 6 },
  pebblepup: { hp: 48, xp: 34, bond: 8 },
  wispurr: { hp: 38, xp: 32, bond: 8 },
  sporelet: { hp: 44, xp: 32, bond: 8 },
  spinseed: { hp: 40, xp: 24, bond: 6 },
  bramblet: { hp: 46, xp: 26, bond: 6 },
  lanternbud: { hp: 42, xp: 26, bond: 6 },
  rubblet: { hp: 52, xp: 34, bond: 8 },
  chockit: { hp: 50, xp: 34, bond: 8 },
  facetel: { hp: 48, xp: 34, bond: 8 },
  whistlet: { hp: 40, xp: 36, bond: 8 },
  kitefin: { hp: 38, xp: 36, bond: 8 },
  loftburr: { hp: 36, xp: 36, bond: 8 },
  fernap: { hp: 46, xp: 40, bond: 10 },
  dapple: { hp: 42, xp: 40, bond: 10 },
  stillcup: { hp: 44, xp: 40, bond: 10 },
  dusthorn: { hp: 46, xp: 36, bond: 8 },
  brineling: { hp: 42, xp: 36, bond: 8 },
  pinepuff: { hp: 44, xp: 36, bond: 8 },
  bloomtail: { hp: 70, xp: 44, bond: 10 },
  pyrelynx: { hp: 74, xp: 44, bond: 10 },
  tidewade: { hp: 68, xp: 44, bond: 10 },
  cairnhound: { hp: 78, xp: 48, bond: 12 },
  galegait: { hp: 66, xp: 48, bond: 12 },
  mycobloom: { hp: 72, xp: 48, bond: 12 },
};

// Roll a wild encounter. ~55% a befriendable companion, ~45% a bad-habit
// obstacle whose pool grows as you get farther along (milestone index).
export function rollWildEncounter(milestone = 1, companionIds, obstacleId) {
  const pool = companionIds && companionIds.length ? companionIds : null;
  // A trail names its own companions. Mixing the whole roster in would make
  // four trails one shared pool with the sign swapped. The local Warden is
  // the only obstacle that belongs here — the milestone pool would put
  // Couchlurk on Maple Trail and leak a locked Index row.
  const isCompanion = Math.random() < 0.55;
  if (isCompanion) {
    const ids = pool || WILD_COMPANION_IDS;
    const id = ids[Math.floor(Math.random() * ids.length)];
    const c = getCreature(id);
    const stats = WILD_COMPANIONS[id] || { hp: Math.floor((c.baseHp || 50) * 0.7), xp: 28, bond: 6 };
    const canBond = !!c.catchable;
    return {
      creatureId: id,
      isCompanion: canBond,
      hp: stats.hp,
      xp: stats.xp,
      bond: stats.bond,
      catchRate: canBond ? (c.catchRate || 0.5) : 0,
    };
  }
  const e = (obstacleId && ENCOUNTERS[obstacleId]) || pickEncounter(milestone);
  return { creatureId: e.creatureId, isCompanion: false, hp: e.hp, xp: e.xp, bond: e.bond, catchRate: 0 };
}

// Later trails list evolved forms. catchable is false, so the roll is a
// fight, not an invitation. Pool composition is content — this only names it.
export function isGrownForm(id) {
  const c = getCreature(id);
  return !!(c && !c.catchable && WILD_COMPANIONS[id]);
}

export default rollWildEncounter;

