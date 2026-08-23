// Trail meetings revealed by movement. Two kinds: companions who may accept a
// bond invitation and bad-habit obstacles that must be cleared.

import { WILD_COMPANION_IDS, getCreature } from './creatures';
import { ENCOUNTERS, pickEncounter } from './obstacles';
import { companionRate, eligibleCompanions, pickWeighted } from '../state/companionLife';

// Encounter stats for trail companions (tuned so bonding is
// realistic). xp/bond are the rewards for befriending (or defeating).
export const WILD_COMPANIONS = {
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
  bloomtail: { hp: 70, xp: 44, bond: 10 },
  pyrelynx: { hp: 74, xp: 44, bond: 10 },
  tidewade: { hp: 68, xp: 44, bond: 10 },
  cairnhound: { hp: 78, xp: 48, bond: 12 },
  galegait: { hp: 66, xp: 48, bond: 12 },
  mycobloom: { hp: 72, xp: 48, bond: 12 },
  brineling: { hp: 42, xp: 28, bond: 6 },
  dusthorn: { hp: 45, xp: 28, bond: 6 },
  mireblink: { hp: 40, xp: 32, bond: 8 },
  pinepuff: { hp: 43, xp: 28, bond: 6 },
  clinket: { hp: 46, xp: 28, bond: 6 },
  glintfoal: { hp: 39, xp: 32, bond: 8 },
  propfin: { hp: 42, xp: 28, bond: 6 },
  zapram: { hp: 45, xp: 28, bond: 6 },
  nectlet: { hp: 40, xp: 28, bond: 6 },
  chipmagma: { hp: 46, xp: 36, bond: 8 },
  bellbun: { hp: 39, xp: 28, bond: 6 },
  nailnut: { hp: 45, xp: 32, bond: 8 },
  pipolyp: { hp: 37, xp: 32, bond: 8 },
  veilisk: { hp: 39, xp: 32, bond: 8 },
  plinkbat: { hp: 37, xp: 36, bond: 8 },
  burrcalf: { hp: 48, xp: 28, bond: 6 },
  prismink: { hp: 37, xp: 32, bond: 8 },
  kneebit: { hp: 43, xp: 28, bond: 6 },
  mumblewool: { hp: 42, xp: 28, bond: 6 },
  skiprock: { hp: 43, xp: 28, bond: 6 },
  glimrice: { hp: 39, xp: 32, bond: 8 },
  roseling: { hp: 42, xp: 36, bond: 8 },
  wicklet: { hp: 36, xp: 32, bond: 8 },
  sootfinch: { hp: 37, xp: 36, bond: 8 },
  budice: { hp: 42, xp: 36, bond: 8 },
  niblet: { hp: 40, xp: 28, bond: 6 },
  siltip: { hp: 40, xp: 36, bond: 8 },
  mistyak: { hp: 46, xp: 32, bond: 8 },
  twigglypt: { hp: 42, xp: 32, bond: 8 },
  glyphish: { hp: 39, xp: 36, bond: 8 },
  knockit: { hp: 45, xp: 28, bond: 6 },
  pepkit: { hp: 40, xp: 32, bond: 8 },
  pebbloom: { hp: 42, xp: 32, bond: 8 },
  lotadpole: { hp: 39, xp: 36, bond: 8 },
  kernelit: { hp: 40, xp: 36, bond: 8 },
  conecko: { hp: 39, xp: 32, bond: 8 },
  bloopot: { hp: 43, xp: 36, bond: 8 },
  figbat: { hp: 37, xp: 36, bond: 8 },
  ammonip: { hp: 42, xp: 36, bond: 8 },
  tinkid: { hp: 40, xp: 32, bond: 8 },
};

// Roll a wild encounter. Companions on the trail still form the pool, but
// wellness conditions on the creature decide who can actually step out —
// hydration, sleep, a streak, morning miles. If nobody qualifies, the
// trail still has its Warden-shaped obstacle rather than a random face.
export function rollWildEncounter(milestone = 1, companionIds, obstacleId, ctx, companionCreature) {
  const pool = companionIds && companionIds.length ? companionIds : null;
  const isCompanion = Math.random() < companionRate(ctx, companionCreature);
  if (isCompanion) {
    const ids = pool || WILD_COMPANION_IDS;
    const eligible = ctx ? eligibleCompanions(ids, ctx) : ids;
    const pickFrom = eligible.length ? eligible : null;
    if (pickFrom) {
      const id = pickWeighted(pickFrom);
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
        gated: eligible.length !== ids.length,
      };
    }
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

