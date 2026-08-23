// Encounter configuration for obstacle creatures. As you hit bigger step
// milestones, tougher obstacles can appear. Rewards feed XP and bond.

export const ENCOUNTERS = {
  sludgewad: { creatureId: 'sludgewad', hp: 40, xp: 30, bond: 8, minMilestone: 1 },
  snoozeghoul: { creatureId: 'snoozeghoul', hp: 50, xp: 40, bond: 10, minMilestone: 2 },
  achefang: { creatureId: 'achefang', hp: 60, xp: 55, bond: 12, minMilestone: 3 },
  couchlurk: { creatureId: 'couchlurk', hp: 75, xp: 70, bond: 16, minMilestone: 4 },
  brinegnash: { creatureId: 'brinegnash', hp: 95, xp: 90, bond: 18, minMilestone: 5 },
  cindergrind: { creatureId: 'cindergrind', hp: 120, xp: 110, bond: 22, minMilestone: 6 },
};

// Which obstacles a walk this far along can turn up, and one of them.
//
// This lived here AND inline in wild.js, and only the inline copy was reachable
// — so the gating rule had two definitions and the tunable one was the copy.
// It belongs with the encounter table it gates.
export function encounterPoolForMilestone(milestone) {
  const pool = Object.values(ENCOUNTERS).filter((e) => e.minMilestone <= milestone);
  return pool.length ? pool : [ENCOUNTERS.sludgewad];
}

export function pickEncounter(milestone) {
  const pool = encounterPoolForMilestone(milestone);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default ENCOUNTERS;
