// A Forge plan the Coach can hand you. Deterministic: neglected muscles in,
// the same blocks out. An LLM never writes the numbers.
//
// Does not change XP, bond, credit or evolve-point rates. Importing is
// MODULE_PATCH, the same path as New Plan.

import { MOVEMENTS } from '../../data/movements';
import { MUSCLES } from '../../data/muscles';
import { todayKey } from '../daily';

const FALLBACK_IDS = ['squat', 'pushup', 'row', 'hipbridge', 'plank'];
const MAX_BLOCKS = 5;

function pickForMuscle(muscleId, used) {
  const hits = MOVEMENTS.filter(
    (m) =>
      m.equipment === 'bodyweight' &&
      !used.has(m.id) &&
      (m.primary || []).includes(muscleId)
  );
  hits.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return hits[0] || null;
}

export function coachPlanId(today) {
  return `coach-${today || todayKey()}`;
}

export function suggestPlan(neglectedIds, plans, today) {
  const date = today || todayKey();
  const id = coachPlanId(date);
  const existing = (plans || []).find((p) => p.id === id);
  if (existing) return { plan: existing, already: true };

  const used = new Set();
  const blocks = [];
  const targets = (neglectedIds || []).slice().sort();
  targets.forEach((muscleId) => {
    if (blocks.length >= MAX_BLOCKS) return;
    const mv = pickForMuscle(muscleId, used);
    if (!mv) return;
    used.add(mv.id);
    blocks.push({
      movementId: mv.id,
      sets: 3,
      amount: mv.unit === 'seconds' ? 30 : 10,
    });
  });
  if (!blocks.length) {
    FALLBACK_IDS.forEach((mid) => {
      const mv = MOVEMENTS.find((m) => m.id === mid);
      if (!mv) return;
      blocks.push({
        movementId: mid,
        sets: 3,
        amount: mv.unit === 'seconds' ? 30 : 10,
      });
    });
  }

  const names = targets
    .slice(0, 3)
    .map((mid) => (MUSCLES[mid] ? MUSCLES[mid].name : mid));
  const note = names.length
    ? `Deterministic fill for what has gone quiet: ${names.join(', ')}.`
    : 'A balanced bodyweight circuit. Nothing recently neglected, so this is the starter shape.';

  return {
    already: false,
    plan: {
      id,
      name: 'Coach Session',
      note,
      blocks,
      fromCoach: true,
    },
  };
}

export default suggestPlan;
