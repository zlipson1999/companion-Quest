// The on-device plan analyser.
//
// This is a deterministic scoring engine, not a language model: it runs
// entirely offline, always returns the same answer for the same plan, and can
// explain every number it produces. That matters here — the player is being
// told what their training is worth, so the reasoning has to be inspectable
// rather than a black box. (The Phase 2 Coach is the LLM half of the app and
// stays behind the server proxy.)
//
// Everything downstream — perks, XP, bond, the body map, the gap suggestions —
// is derived from this one pass.

import { getMovement, PATTERN_IDS } from '../../data/movements';
import { MUSCLE_IDS, MUSCLES } from '../../data/muscles';
import { PERKS, MAX_PERKS } from './perks';

// A rep is ~3 seconds of work; a held second is a second. Rest scales with how
// hard the set is. Used for the duration estimate only.
const SECONDS_PER_REP = 3;
const REST_BY_LOAD = { 1: 15, 2: 30, 3: 45 };

const SECONDARY_WEIGHT = 0.4;

// Hard sets cost more than their clock time suggests: six heavy pull-ups are
// eighteen seconds of work and far more than eighteen seconds of training.
// Weighting load superlinearly stops long easy sessions out-earning short
// brutal ones. Perk tests still use the raw average load.
const loadWeight = (load) => Math.pow(load, 1.5);

function emptyTally(keys) {
  return keys.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});
}

function shareOf(tally) {
  const total = Object.keys(tally).reduce((n, k) => n + tally[k], 0);
  if (total <= 0) return { share: emptyTally(Object.keys(tally)), total: 0 };
  const share = {};
  Object.keys(tally).forEach((k) => {
    share[k] = tally[k] / total;
  });
  return { share, total };
}

// How close two competing demands are to even. 1 = perfectly balanced,
// 0 = entirely one-sided. Returns 1 when neither is present so an empty plan
// is not scored as "balanced".
function evenness(a, b) {
  const sum = a + b;
  if (sum <= 0) return 0;
  return 1 - Math.abs(a - b) / sum;
}

export function analysePlan(plan) {
  const blocks = (plan && plan.blocks) || [];

  const muscle = emptyTally(MUSCLE_IDS);
  const pattern = emptyTally(PATTERN_IDS);

  let sets = 0;
  let loadSum = 0;
  let seconds = 0;
  let volume = 0;

  blocks.forEach((b) => {
    const mv = getMovement(b.movementId);
    if (!mv) return;
    const nSets = Math.max(1, b.sets || 1);
    const amount = Math.max(1, b.amount || 1);
    const work = mv.unit === 'reps' ? amount * SECONDS_PER_REP : amount;

    sets += nSets;
    loadSum += nSets * mv.load;
    seconds += nSets * (work + (REST_BY_LOAD[mv.load] || 30));
    volume += (nSets * work * loadWeight(mv.load)) / 60;

    (mv.primary || []).forEach((m) => {
      if (muscle[m] != null) muscle[m] += nSets * mv.load;
    });
    (mv.secondary || []).forEach((m) => {
      if (muscle[m] != null) muscle[m] += nSets * mv.load * SECONDARY_WEIGHT;
    });
    pattern[mv.pattern] += nSets * mv.load;
  });

  const m = shareOf(muscle);
  const p = shareOf(pattern);

  // Region shares roll patterns up into the four things a body actually does.
  const regionShare = {
    push: p.share.push || 0,
    pull: p.share.pull || 0,
    squat: p.share.squat || 0,
    hinge: p.share.hinge || 0,
  };

  const upper = MUSCLE_IDS.filter((id) => ['push', 'pull'].includes(MUSCLES[id].region))
    .reduce((n, id) => n + muscle[id], 0);
  const lower = MUSCLE_IDS.filter((id) => ['squat', 'hinge'].includes(MUSCLES[id].region))
    .reduce((n, id) => n + muscle[id], 0);

  const balance = sets === 0
    ? 0
    : (evenness(regionShare.push, regionShare.pull) + evenness(upper, lower)) / 2;

  const trained = MUSCLE_IDS.filter((id) => muscle[id] > 0);
  const gaps = MUSCLE_IDS.filter((id) => muscle[id] <= 0);

  const analysis = {
    blocks: blocks.length,
    sets,
    minutes: Math.max(0, Math.round(seconds / 60)),
    volume: Math.round(volume * 10) / 10,
    intensity: sets > 0 ? loadSum / sets : 0,
    muscle,
    muscleShare: m.share,
    patternShare: p.share,
    regionShare,
    balance,
    coverage: trained.length,
    trained,
    gaps,
    focus: focusLabel(p.share, sets),
  };

  analysis.perks = derivePerks(analysis);
  analysis.reward = deriveReward(analysis);
  return analysis;
}

// The single pattern that dominates, if any does.
function focusLabel(patternShare, sets) {
  if (!sets) return 'Empty';
  const ranked = PATTERN_IDS.map((id) => ({ id, v: patternShare[id] || 0 })).sort((a, b) => b.v - a.v);
  const top = ranked[0];
  if (!top || top.v <= 0) return 'Empty';
  if (top.v >= 0.5) {
    return {
      push: 'Push', pull: 'Pull', squat: 'Legs', hinge: 'Posterior',
      brace: 'Core', carry: 'Carry', condition: 'Conditioning', mobility: 'Mobility',
    }[top.id];
  }
  if (ranked[1] && ranked[1].v > 0.2) return 'Full Body';
  return 'Mixed';
}

// A plan has to have real substance before it characterises anything. Without
// this floor a single set of calf raises earns a perk and its multiplier.
export const PERK_MIN_SETS = 4;
export const PERK_MIN_VOLUME = 2;

// Run every perk's own test, keep the ones that fire, best score first.
export function derivePerks(analysis) {
  if (analysis.sets < PERK_MIN_SETS || analysis.volume < PERK_MIN_VOLUME) return [];
  return PERKS.map((perk) => {
    const hit = perk.test(analysis);
    return hit ? { id: perk.id, name: perk.name, blurb: perk.blurb, color: perk.color, effect: perk.effect, why: hit.why, score: hit.score } : null;
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PERKS);
}

// Base reward from real work done, then the plan's perks applied on top.
// Bounded at both ends: a token plan cannot be farmed, a monster plan cannot
// trivialise progression.
export function deriveReward(analysis) {
  if (!analysis.sets) return { xp: 0, bond: 0, heal: 0, baseXp: 0, mult: 1 };

  // The floor only applies once there is something to floor: a token plan
  // scales down with its own volume instead of collecting the minimum.
  const floor = Math.min(15, Math.round(analysis.volume * 6));
  const baseXp = Math.min(90, Math.max(floor, Math.round(analysis.volume * 1.6)));
  const baseBond = Math.max(3, Math.min(14, Math.round(analysis.sets * 0.5)));

  let mult = 1;
  let bonusXp = 0;
  let bond = baseBond;
  let heal = 0;

  analysis.perks.forEach((p) => {
    const e = p.effect || {};
    if (e.xpMult) mult *= e.xpMult;
    if (e.xp) bonusXp += e.xp;
    if (e.bond) bond += e.bond;
    if (e.heal) heal += e.heal;
  });

  return {
    xp: Math.min(220, Math.round(baseXp * mult) + bonusXp),
    bond: Math.min(30, bond),
    heal,
    baseXp,
    mult: Math.round(mult * 100) / 100,
  };
}

// What this plan neglects, phrased as an invitation rather than a scolding.
export function suggestionsFor(analysis) {
  const out = [];
  if (!analysis.sets) return ['Add a movement to see what this plan trains.'];
  if (analysis.regionShare.push > 0.55) out.push('Heavy on pushing — a row or pull-up would even it out.');
  if (analysis.regionShare.pull > 0.55) out.push('Heavy on pulling — add a push to balance the shoulders.');
  if (analysis.coverage < 6) out.push('Narrow focus. That is fine for a targeted day, but not a whole week.');
  if (analysis.gaps.includes('core') && analysis.gaps.includes('lowerBack')) out.push('Nothing braces the middle — a plank ties the rest together.');
  if (analysis.minutes > 75) out.push('That is a long session. Consider splitting it across two days.');
  if (!out.length) out.push('Well put together. Nothing obvious missing.');
  return out;
}

export default analysePlan;
