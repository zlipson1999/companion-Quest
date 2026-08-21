// Encounter configuration for obstacle creatures. As you hit bigger step
// milestones, tougher obstacles can appear. Rewards feed XP and bond.

export const ENCOUNTERS = {
  sludgewad: { creatureId: 'sludgewad', hp: 40, xp: 30, bond: 8, minMilestone: 1 },
  snoozeghoul: { creatureId: 'snoozeghoul', hp: 50, xp: 40, bond: 10, minMilestone: 2 },
  achefang: { creatureId: 'achefang', hp: 60, xp: 55, bond: 12, minMilestone: 3 },
  couchlurk: { creatureId: 'couchlurk', hp: 75, xp: 70, bond: 16, minMilestone: 4 },
};

export function encounterPoolForMilestone(milestone) {
  return Object.values(ENCOUNTERS).filter((e) => e.minMilestone <= milestone);
}

export function pickEncounter(milestone) {
  const pool = encounterPoolForMilestone(milestone);
  if (pool.length === 0) return ENCOUNTERS.sludgewad;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default ENCOUNTERS;
