// Load a save through every version gate. Isolated from the React provider
// so a Node fixture can walk a v1 blob without Metro.

import { migrateGoalId } from '../data/goals';
import { emptyTrails, normalizeTrails } from '../data/routes';
import { rollAllModules, todayKey } from '../modules';
import { DEFAULT_BODY_WEIGHT_LB } from './cardioMaths';
import { trim } from './history';

export const SAVE_VERSION = 9;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

export const FRESH = {
  version: SAVE_VERSION,
  started: false,
  playerOutfit: null,
  playerGender: null,
  goalId: null,
  party: [],
  activeIndex: 0,
  // Trail Credit. Starts at zero and is only ever minted by real effort — see
  // economy.js for why there is no other way in.
  credits: 0,
  stats: {
    totalSteps: 0,
    distanceMi: 0,
    routeMi: 0,
    xpCarry: 0,       // fractional walking XP not yet paid out
    creditCarry: 0,   // ...and the same for credit
    milestonesReached: 0,
    battlesWon: 0,
    battlesLost: 0,
    caught: 0,
    workoutsDone: 0,
    itemsCollected: 0,
    habitLogs: 0,
    habitGoalsHit: 0,
    // Real exercise done: sets completed, repetitions, and seconds held.
    sets: 0,
    reps: 0,
    holdSec: 0,
    // Per exercise, so a session can say what it consisted of rather than
    // only how much of it there was. Routines tally under 'workout:<id>'.
    exercises: {},
    daysActive: 1,
    streak: 1,
  },
  bag: {},
  dex: {},
  modules: {},
  history: {},
  // 'stick' by default: crossing a map one deliberate tap per square is the
  // single most tiring thing about the overworld.
  // bodyWeightLb is stored in pounds whatever the display unit is, so the
  // number never has to be reinterpreted when someone switches units.
  settings: { muted: false, bgmMuted: false, units: 'lb', control: 'stick', bodyWeightLb: DEFAULT_BODY_WEIGHT_LB },
  // Rowan is only in the gym until the push-up contest is done.
  meta: { createdAt: todayKey(), lastPlayedDate: todayKey(), sparDone: false },
  // Per-trail miles, challenge reps, and Quest Pins. Gym miles never land here.
  trails: emptyTrails(),
};

// Keys a migrated save must have. The fixture asserts these exist; it does
// not invent days of history nobody logged.
export const HYDRATE_KEYS = [
  'version', 'started', 'playerOutfit', 'playerGender', 'goalId',
  'party', 'activeIndex', 'credits', 'stats', 'bag', 'dex',
  'modules', 'history', 'settings', 'meta', 'trails',
];

export function hydrateSave(saved) {
  const merged = {
    ...FRESH,
    ...saved,
    // Saves written before the Forge Might / Travel Light / Take Root goal
    // set carry the old ids; translate once so nothing downstream has to.
    goalId: migrateGoalId(saved.goalId) || null,
    stats: { ...FRESH.stats, ...(saved.stats || {}), exercises: { ...((saved.stats || {}).exercises || {}) } },
    bag: { ...(saved.bag || {}) },
    dex: { ...(saved.dex || {}) },
    settings: { ...FRESH.settings, ...(saved.settings || {}) },
    meta: { ...FRESH.meta, ...(saved.meta || {}) },
  };
  // Migrate a v1 single-companion save into a party.
  let party = Array.isArray(saved.party) ? saved.party : null;
  if ((!party || !party.length) && saved.companion) party = [saved.companion];
  // v5: evolve points. Older saves have companions with no `evo`, and
  // starting them at zero is the honest choice — the app was not recording
  // the work that would have earned them, and inventing a balance would
  // hand out an evolution nobody trained for.
  merged.party = (party || []).map((m) => ({
    ...m,
    evo: m.evo || 0,
    behaviors: {
      hydrations: 0, workouts: 0, sleeps: 0, recoveries: 0,
      miles: 0, meals: 0, cardio: 0, streak: 0,
      ...(m.behaviors || {}),
    },
    memories: Array.isArray(m.memories) ? m.memories : [],
  }));
  merged.activeIndex = clamp(saved.activeIndex || 0, 0, Math.max(0, merged.party.length - 1));
  delete merged.companion;

  // v3: life modules. Old saves have none — every registered module starts
  // at zero, and any module already stored gets its day rolled over (which
  // is where the daily reset actually happens for a returning player).
  const migratingDates = (saved.version || 1) < 3;
  merged.modules = rollAllModules(saved.modules, todayKey());
  // v4: the daily history. Older saves simply start recording from now —
  // there is no honest way to reconstruct days nobody logged.
  merged.history = trim(saved.history || {}, todayKey());
  // v6 adds one-time outfit and gender choices. Their null defaults keep
  // older saves in setup until both choices have been recorded.
  // v7 adds Trail Credit. Older saves start at zero rather than being
  // back-paid for the miles they walked: the app was not minting then, and
  // handing someone a balance for work it never counted is exactly the kind
  // of free currency this economy exists to not have.
  merged.credits = saved.credits || 0;
  // v8: the Bond Token became the Kinship Knot. Not a rename — a different
  // object with a different mechanic — but somebody's count is somebody's
  // earned work, so it carries across rather than being voided.
  if (merged.bag.token) {
    merged.bag.knot = (merged.bag.knot || 0) + merged.bag.token;
    delete merged.bag.token;
  }
  // v9: trails with per-trail miles/reps and Quest Pins. Older saves
  // start Maple Trail at zero rather than being back-credited for miles
  // walked before trails existed — those miles were not trail-tagged.
  merged.trails = normalizeTrails(saved.trails);
  merged.version = SAVE_VERSION;

  // v3 also moved "today" from a UTC date to a LOCAL one. A pre-v3
  // lastPlayedDate was written in the other convention, so on the upgrade
  // load alone a 1-day gap may be a timezone artefact rather than a real
  // return: skip the streak increment that once. A genuine multi-day
  // absence still resets, since no timezone shift spans more than a day.
  const gap = daysBetween(merged.meta.lastPlayedDate, todayKey());
  if (gap === 1 && !migratingDates) {
    merged.stats.streak += 1;
    merged.stats.daysActive += 1;
  } else if (gap > 1) {
    merged.stats.streak = 1;
    merged.stats.daysActive += 1;
  }
  merged.meta.lastPlayedDate = todayKey();
  return merged;
}
