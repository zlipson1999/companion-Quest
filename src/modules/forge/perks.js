// Perks a workout plan can earn.
//
// A perk is a standing property of a PLAN, not of the player: the analyser
// re-derives them every time the plan changes, so editing a plan immediately
// changes what it is worth. Each perk states its own test against the analysis
// and explains itself in plain language — the player should always be able to
// see WHY a plan earned what it earned.
//
// effect: xpMult multiplies the plan's base XP; bond/heal are flat additions
// handed to the same applyEffect() path items and battles use.

const pct = (n) => `${Math.round(n * 100)}%`;

export const PERKS = [
  {
    id: 'ironroot',
    name: 'Ironroot',
    blurb: 'Grounded, load-bearing work through the hips and legs.',
    color: 'grass',
    effect: { xpMult: 1.1, bond: 4 },
    test(a) {
      const share = a.regionShare.hinge + a.regionShare.squat;
      if (share < 0.4) return null;
      return { score: share, why: `${pct(share)} of this plan is hinge and squat work.` };
    },
  },
  {
    id: 'sunforge',
    name: 'Sunforge',
    blurb: 'Everything you press away from you gets stronger.',
    color: 'ember',
    effect: { xpMult: 1.1, bond: 4 },
    test(a) {
      const share = a.patternShare.push || 0;
      if (share < 0.4) return null;
      return { score: share, why: `${pct(share)} of this plan is pressing work.` };
    },
  },
  {
    id: 'emberwind',
    name: 'Emberwind',
    blurb: 'Breath-and-heartbeat work. Your engine, not your armour.',
    color: 'danger',
    effect: { xpMult: 1.25 },
    test(a) {
      const share = a.patternShare.condition || 0;
      if (share < 0.3) return null;
      return { score: share, why: `${pct(share)} conditioning — this one moves your heart rate.` };
    },
  },
  {
    id: 'stonegrip',
    name: 'Stonegrip',
    blurb: 'Everything you can hold onto gets stronger.',
    color: 'rock',
    effect: { bond: 5 },
    test(a) {
      const share = a.patternShare.pull || 0;
      const grip = a.muscleShare.forearms || 0;
      if (share < 0.25 || grip <= 0) return null;
      return { score: share + grip, why: `${pct(share)} pulling, with real forearm demand.` };
    },
  },
  {
    id: 'stillwater',
    name: 'Stillwater',
    blurb: 'Slow work. It counts, and your companion rests easier for it.',
    color: 'water',
    effect: { heal: 25, bond: 4 },
    test(a) {
      const share = (a.patternShare.mobility || 0) + (a.patternShare.brace || 0) * 0.5;
      if (share < 0.3) return null;
      return { score: share, why: `${pct(share)} mobility and bracing — recovery is training too.` };
    },
  },
  {
    id: 'tidebalance',
    name: 'Tidebalance',
    blurb: 'Push answered by pull, upper answered by lower. Nothing left behind.',
    color: 'primary',
    effect: { xpMult: 1.15, bond: 5 },
    test(a) {
      if (a.balance < 0.7) return null;
      return { score: a.balance, why: `Push/pull and upper/lower are within ${pct(1 - a.balance)} of even.` };
    },
  },
  {
    id: 'thunderstep',
    name: 'Thunderstep',
    blurb: 'Hard sets, honestly chosen. Short and sharp.',
    color: 'secondary',
    effect: { xpMult: 1.2 },
    test(a) {
      if (a.intensity < 2.4) return null;
      return { score: (a.intensity - 2) / 1, why: `Average set load ${a.intensity.toFixed(1)} of 3 — this is a hard plan.` };
    },
  },
  {
    id: 'longtrail',
    name: 'Longtrail',
    blurb: 'Time under tension. The slow accumulation that actually builds.',
    color: 'accent',
    effect: { xp: 25 },
    test(a) {
      if (a.minutes < 25) return null;
      return { score: Math.min(1, a.minutes / 60), why: `About ${a.minutes} minutes of real work.` };
    },
  },
  {
    id: 'fullbloom',
    name: 'Fullbloom',
    blurb: 'A whole body asked to show up at once.',
    color: 'success',
    effect: { xpMult: 1.2, bond: 6 },
    test(a) {
      if (a.coverage < 10) return null;
      return { score: a.coverage / 14, why: `${a.coverage} of 14 muscle groups trained.` };
    },
  },
];

export const MAX_PERKS = 3;

export function getPerk(id) {
  return PERKS.find((p) => p.id === id) || null;
}

export default PERKS;
