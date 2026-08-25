// The Quest Ledger: optional healthy-habit quests bought and turned in at
// the Quest Fitness reception desk.
//
// A quest COSTS Quest Credits — 5 to 15, priced by how easy it is and how
// good its reward is (easy errand with a modest payout sits at the bottom,
// the seven-day flagship with the Kinship Knot at the top). The ledger and
// the smoothie bar are the only places credits are spent, and credits are
// still minted by real effort only. Buying is the only credit movement:
// abandoning refunds nothing and turning in mints nothing. A quest is
// completed by real recorded behavior and turned in for its Token plus a
// reward matched to its category through the same {xp,bond,evo,heal}
// contract everything else uses. Tokens are collectible proof of
// completion, never money: they cannot be spent or sold, do not convert to
// credits, and never touch trail progress. Progress reads the SAME records
// the rest of the game keeps (stats, module buckets, reception check-ins)
// against a snapshot taken at purchase — a quest never invents its own
// counters, and only effort after you buy counts.

// Requirements carry explicit activity SCOPES (data/activityScopes.js): what
// kind of real effort may progress them. Gym cardio can satisfy Stride and
// mixed wellness work, strength satisfies Forge, attendance satisfies Root —
// and nothing here can touch a trail quota, which only `trail_activity`
// (a delta carrying a real routeId) ever reaches.

import { scopesForReqKind } from './activityScopes';
import { CARDIO_MACHINE_IDS } from './cardioMachines';
import { CARDIO_MIN_ACTIVE_SEC } from '../state/economy';

export const MAX_ACTIVE_QUESTS = 3;

// One token per healthy-habit category. Sprites are the painted plates in
// assets/items/tokens (see data/tokenImages.js).
export const TOKENS = [
  { id: 'stride', name: 'Stride Token', category: 'Movement & cardio', tone: '#2e7d4f' },
  { id: 'forge', name: 'Forge Token', category: 'Strength', tone: '#b04a2a' },
  { id: 'harvest', name: 'Harvest Token', category: 'Nutrition', tone: '#7a9a3d' },
  { id: 'rill', name: 'Rill Token', category: 'Hydration', tone: '#2f7fae' },
  { id: 'hearth', name: 'Hearth Token', category: 'Sleep & recovery', tone: '#5b4a9e' },
  { id: 'stillwater', name: 'Stillwater Token', category: 'Mindfulness', tone: '#3d8f86' },
  { id: 'root', name: 'Root Token', category: 'Consistency', tone: '#6b5330' },
];

export const TOKEN_BY_ID = Object.fromEntries(TOKENS.map((t) => [t.id, t]));

// Rewards are matched to what each category already pays elsewhere in the
// game: movement is the XP engine, training earns Evolve Points, food and
// water restore, sleep is the full heal, stillness pays bond, and showing up
// again and again earns a Kinship Knot — companionship, the way it always is.
export const QUESTS = [
  {
    id: 'tenminutetrek', name: 'Ten-Minute Trek', tokenId: 'stride',
    price: 6, days: 7,
    blurb: 'A real half mile, on the trail or the deck. Where every journey starts.',
    reqs: [{ kind: 'miles', amount: 0.5, label: 'Walk half a real mile' }],
    reward: { xp: 40 }, rewardLine: '+40 XP',
  },
  {
    id: 'wheelsinmotion', name: 'Wheels in Motion', tokenId: 'stride',
    price: 5, days: 7,
    blurb: 'One Bike Ride, about ten minutes of real pedalling. Gym-only — rides never touch a trail.',
    reqs: [{ kind: 'rides', amount: 1, label: 'Complete one Bike Ride' }],
    reward: { xp: 30 }, rewardLine: '+30 XP',
  },
  {
    id: 'foundationset', name: 'Foundation Set', tokenId: 'forge',
    price: 10, days: 7,
    blurb: 'Two honest strength sessions, off the shelf or from your own Forge plan.',
    reqs: [{ kind: 'workouts', amount: 2, label: 'Complete two strength sessions' }],
    reward: { evo: 6 }, rewardLine: '+6 Evolve Points',
  },
  {
    id: 'balancedbowl', name: 'Balanced Bowl', tokenId: 'harvest',
    price: 8, days: 7,
    blurb: 'Three real meals logged at the kitchen or the bar. Honesty is the recipe.',
    reqs: [{ kind: 'moduleLogs', moduleId: 'diet', amount: 3, label: 'Log three real meals' }],
    reward: { heal: 30, bond: 6 }, rewardLine: '+30 Resolve, +6 bond',
  },
  {
    id: 'filltheflask', name: 'Fill the Flask', tokenId: 'rill',
    price: 8, days: 7,
    blurb: 'Hit your water goal two days this week. The flask fills one glass at a time.',
    reqs: [{ kind: 'moduleGoalDays', moduleId: 'hydration', amount: 2, label: 'Hit your water goal on two days' }],
    reward: { heal: 35 }, rewardLine: '+35 Resolve',
  },
  {
    id: 'resttorise', name: 'Rest to Rise', tokenId: 'hearth',
    price: 9, days: 7,
    blurb: 'Log your sleep two nights. Night already did the work — write it down.',
    reqs: [{ kind: 'moduleLogs', moduleId: 'sleep', amount: 2, label: 'Log sleep on two nights' }],
    reward: { healFull: true }, rewardLine: 'Resolve fully restored',
  },
  {
    id: 'fivecalmbreaths', name: 'Five Calm Breaths', tokenId: 'stillwater',
    price: 7, days: 7,
    blurb: 'Two stillness sessions. The quietest quest on the board, and not the easiest.',
    reqs: [{ kind: 'moduleLogs', moduleId: 'meditation', amount: 2, label: 'Sit for two stillness sessions' }],
    reward: { bond: 12 }, rewardLine: '+12 bond',
  },
  // The machine quests: one honest qualifying session (five active minutes
  // or more) on the named machine. Movement quests pay the XP engine.
  {
    id: 'pullwithpurpose', name: 'Pull With Purpose', tokenId: 'stride',
    price: 6, days: 7,
    blurb: 'One qualifying rower session — five real active minutes or more. Row first, log after.',
    reqs: [{ kind: 'machineSessions', machineId: 'rower', amount: 1, label: 'Complete one qualifying Rower session' }],
    reward: { xp: 30 }, rewardLine: '+30 XP',
  },
  {
    id: 'stepbystep', name: 'Step by Step', tokenId: 'stride',
    price: 6, days: 7,
    blurb: 'One qualifying Stair Climber session. The floors are optional; the minutes are real.',
    reqs: [{ kind: 'machineSessions', machineId: 'stairclimber', amount: 1, label: 'Complete one qualifying Stair Climber session' }],
    reward: { xp: 30 }, rewardLine: '+30 XP',
  },
  {
    id: 'smoothstrides', name: 'Smooth Strides', tokenId: 'stride',
    price: 6, days: 7,
    blurb: 'One qualifying elliptical session, arms and legs together.',
    reqs: [{ kind: 'machineSessions', machineId: 'elliptical', amount: 1, label: 'Complete one qualifying Elliptical session' }],
    reward: { xp: 30 }, rewardLine: '+30 XP',
  },
  {
    id: 'cardiocircuit', name: 'Cardio Circuit', tokenId: 'stride',
    price: 9, days: 7,
    blurb: 'Qualifying sessions on three different cardio machines in one week.',
    reqs: [{ kind: 'distinctMachines', amount: 3, label: 'Qualifying sessions on three different machines' }],
    reward: { xp: 45 }, rewardLine: '+45 XP',
  },
  {
    id: 'fivemachinecircuit', name: 'Five-Machine Circuit', tokenId: 'stride',
    price: 12, days: 7,
    blurb: 'Every cardio machine in the room, once each, inside the window. The full tour, done for real.',
    reqs: [{ kind: 'distinctMachines', amount: 5, label: 'A qualifying session on every cardio machine' }],
    reward: { xp: 60, bond: 6 }, rewardLine: '+60 XP, +6 bond',
  },
  // The flagship: every system, none of them demanding perfection.
  {
    id: 'sevendayfoundation', name: 'Seven-Day Foundation', tokenId: 'root',
    price: 15, days: 7, flagship: true,
    blurb: 'One week, every habit touched once. The whole game, in seven days.',
    reqs: [
      { kind: 'checkins', amount: 3, label: 'Check in at reception on three days' },
      { kind: 'workouts', amount: 2, label: 'Two strength sessions' },
      { kind: 'cardio', amount: 1, label: 'One cardio session (deck, ride or rower)' },
      { kind: 'moduleGoalDays', moduleId: 'hydration', amount: 4, label: 'Water goal on four days' },
      { kind: 'moduleLogs', moduleId: 'diet', amount: 3, label: 'Three real meals logged' },
      { kind: 'moduleLogs', moduleId: 'sleep', amount: 2, label: 'Sleep logged on two nights' },
      { kind: 'moduleLogs', moduleId: 'meditation', amount: 1, label: 'One stillness session' },
    ],
    reward: { bond: 10, item: 'knot' }, rewardLine: '+10 bond and a Kinship Knot',
  },
];

// Stamp every requirement with the scopes its kind accepts (per-req
// overrides would win, but none exists — the policy is central on purpose).
QUESTS.forEach((q) => {
  q.reqs = q.reqs.map((r) => ({ scopes: scopesForReqKind(r.kind), ...r }));
});

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export function getQuest(id) {
  return QUEST_BY_ID[id] || null;
}

const moduleBucket = (state, id) => (state.modules && state.modules[id]) || {};

// A session QUALIFIES for quest work when it met the same active-time
// minimum the credit formula uses — one definition, shared.
const qualifies = (s) => s && (s.activeSeconds || s.seconds || 0) >= CARDIO_MIN_ACTIVE_SEC;

export function qualifyingMachineCounts(state) {
  const counts = Object.fromEntries(CARDIO_MACHINE_IDS.map((id) => [id, 0]));
  (state.cardioSessions || []).forEach((s) => {
    if (qualifies(s) && counts[s.station] != null) counts[s.station] += 1;
  });
  return counts;
}

// Everything a requirement might be measured against, captured at purchase.
export function questSnapshot(state) {
  return {
    miles: state.stats.distanceMi || 0,
    rides: state.stats.ridesDone || 0,
    workouts: state.stats.workoutsDone || 0,
    cardio: (state.cardioSessions || []).filter(qualifies).length,
    machines: qualifyingMachineCounts(state),
    moduleLogs: {
      diet: moduleBucket(state, 'diet').totalLogs || 0,
      sleep: moduleBucket(state, 'sleep').totalLogs || 0,
      meditation: moduleBucket(state, 'meditation').totalLogs || 0,
    },
    moduleGoalDays: {
      hydration: moduleBucket(state, 'hydration').goalDays || 0,
    },
  };
}

function reqHave(req, active, state) {
  const base = active.base || {};
  switch (req.kind) {
    case 'miles':
      return Math.max(0, (state.stats.distanceMi || 0) - (base.miles || 0));
    case 'rides':
      return Math.max(0, (state.stats.ridesDone || 0) - (base.rides || 0));
    case 'workouts':
      return Math.max(0, (state.stats.workoutsDone || 0) - (base.workouts || 0));
    case 'cardio':
      // Every ended gym cardio session lands in cardioSessions; only
      // qualifying ones (five active minutes) count for quests.
      return Math.max(0, (state.cardioSessions || []).filter(qualifies).length - (base.cardio || 0));
    case 'machineSessions': {
      const now = qualifyingMachineCounts(state)[req.machineId] || 0;
      return Math.max(0, now - ((base.machines || {})[req.machineId] || 0));
    }
    case 'distinctMachines': {
      const now = qualifyingMachineCounts(state);
      return CARDIO_MACHINE_IDS.filter((id) => (now[id] || 0) > ((base.machines || {})[id] || 0)).length;
    }
    case 'moduleLogs': {
      const now = moduleBucket(state, req.moduleId).totalLogs || 0;
      return Math.max(0, now - ((base.moduleLogs || {})[req.moduleId] || 0));
    }
    case 'moduleGoalDays': {
      const now = moduleBucket(state, req.moduleId).goalDays || 0;
      return Math.max(0, now - ((base.moduleGoalDays || {})[req.moduleId] || 0));
    }
    case 'checkins': {
      // Reception attendance: one timestamped entry per local day, kept in
      // state.gymCheckIns by the GYM_CHECK_IN reducer.
      const visits = state.gymCheckIns || [];
      return visits.filter((v) => v && v.day >= active.startedDay).length;
    }
    default:
      return 0;
  }
}

// Day keys are 'YYYY-MM-DD', so string compare is date compare.
export function questEndDay(active, quest) {
  const d = new Date(`${active.startedDay}T12:00:00`);
  d.setDate(d.getDate() + (quest.days || 7));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function questProgress(quest, active, state, today) {
  const reqs = quest.reqs.map((req) => {
    const have = reqHave(req, active, state);
    return { label: req.label, have: Math.min(have, req.amount), need: req.amount, done: have >= req.amount };
  });
  const done = reqs.every((r) => r.done);
  const endDay = questEndDay(active, quest);
  return { reqs, done, endDay, expired: !done && !!today && today > endDay };
}
