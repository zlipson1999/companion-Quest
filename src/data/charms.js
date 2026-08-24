// Trail Charms. One unique held item per Guardian (intermediate Keeper).
// Regional Wardens do not drop charms — they award the regional badge + Knot.
//
// First clear of that Keeper trail grants ×1 and permanently unlocks the
// smoothie bar listing. Undiscovered charms do not appear in the shop at all.

export const TRAIL_CHARMS = [
  { id: 'second-wind-band', name: 'Second Wind Band', theme: 'Fatigue', trailId: 'maple',
    effect: 'Once per battle, survive a Resolve-dropping hit with 1 Resolve.', miles: 2.0 },
  { id: 'morning-dew', name: 'Morning Dew', theme: 'Poor Sleep', trailId: 'cairn',
    effect: 'The first hit you take each battle is reduced.', miles: 2.0 },
  { id: 'pace-token', name: 'Pace Token', theme: 'Overexertion', trailId: 'gale',
    effect: 'Reduces incoming Resolve damage slightly.', miles: 2.2 },
  { id: 'momentum-feather', name: 'Momentum Feather', theme: 'Inactivity', trailId: 'canopy',
    effect: 'Consecutive successful movements gradually increase your power.', miles: 2.4 },
  { id: 'hydration-bead', name: 'Hydration Bead', theme: 'Dehydration', trailId: 'rill',
    effect: 'Restore a little Resolve after completing a movement.', miles: 2.0 },
  { id: 'recovery-shell', name: 'Recovery Shell', theme: 'Burnout', trailId: 'saltglass',
    effect: 'Recover a little Resolve after defeating an opponent.', miles: 2.4 },
  { id: 'steady-cord', name: 'Steady Cord', theme: 'Inconsistency', trailId: 'suncrack',
    effect: 'The first exercise you complete each battle gets a small power bonus.', miles: 2.2 },
  { id: 'trail-spark', name: 'Trail Spark', theme: 'Procrastination', trailId: 'reedwalk',
    effect: 'Your first move of battle gets a substantial one-time boost.', miles: 2.6 },
  { id: 'balance-root', name: 'Balance Root', theme: 'Stress', trailId: 'needlesnow',
    effect: 'Prevents one negative battle effect during the encounter.', miles: 2.6 },
  { id: 'form-ribbon', name: 'Form Ribbon', theme: 'Rushing / Form', trailId: 'echorail',
    effect: 'Completing the full requested effort grants bonus power.', miles: 2.4 },
  { id: 'focus-stone', name: 'Focus Stone', theme: 'Distraction', trailId: 'cometgrass',
    effect: 'Slightly improves exercise attack consistency and power.', miles: 2.2 },
  { id: 'fuelseed', name: 'Fuelseed', theme: 'Under-fueling', trailId: 'honeyfall',
    effect: 'Begin battle with a small Resolve boost.', miles: 2.2 },
  { id: 'breath-bell', name: 'Breath Bell', theme: 'Poor Cardio', trailId: 'staticridge',
    effect: 'Hold/timed work generates slightly more battle power.', miles: 2.4 },
  { id: 'restleaf-charm', name: 'Restleaf Charm', theme: 'Poor Recovery', trailId: 'rootwater',
    effect: 'Recover some Resolve between encounters.', miles: 2.4 },
  { id: 'kinship-thread', name: 'Kinship Thread', theme: 'Isolation', trailId: 'ringwood',
    effect: 'Companions with higher Bond gain a modest battle bonus.', miles: 2.8 },
];

export const CHARM_BY_ID = Object.fromEntries(TRAIL_CHARMS.map((c) => [c.id, c]));
export const CHARM_BY_TRAIL = Object.fromEntries(TRAIL_CHARMS.map((c) => [c.trailId, c]));

export function charmForTrail(trailId) {
  return CHARM_BY_TRAIL[trailId] || null;
}

export default TRAIL_CHARMS;
