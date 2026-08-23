// Central game state: a reducer + context with automatic persistence.
// Phase 1.5: you build a TEAM. state.party holds your companions and
// state.activeIndex is the one currently at your side / fighting. Distance
// (miles) drives the Route. Old single-companion saves migrate automatically.
// Phase 3: state.modules holds one bucket per installed life module. Modules
// pay out through the same XP/bond path as everything else — that is the whole
// point of the plugin system.

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { getCreature } from '../data/creatures';
import { getItem } from '../data/items';
import { priceOf } from '../data/shop';
import { pacingForGoal } from '../data/route';
import {
  addTrailMiles,
  addTrailReps,
  awardPin,
  emptyTrails,
  normalizeTrails,
  setActiveTrail,
} from '../data/routes';
import { migrateGoalId } from '../data/goals';
import { xpProgress, levelFromXp, maxHpFor } from './leveling';
import { loadGame, saveGame, clearGame } from './storage';
import { stamp, trim } from './history';
import { computeRecovery } from './recovery';
import { XP_PER_MILE, pointsFor, xpFor } from './evolution';
import { CREDIT_PER_GOAL, CREDIT_PER_MILE, CREDIT_PER_SESSION, CREDIT_PER_WIN, mint } from './economy';
import { DEFAULT_BODY_WEIGHT_LB } from './cardioMaths';
import {
  MODULES,
  getModule,
  logModuleAction,
  moduleProgress,
  moduleStateFor,
  rollAllModules,
  rollDay,
  todayKey,
} from '../modules';

const today = todayKey;
const STARTING_KNOTS = 3;
const MAX_PARTY = 6;
const SAVE_VERSION = 9;

function daysBetween(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

const FRESH = {
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
  meta: { createdAt: today(), lastPlayedDate: today(), sparDone: false },
  // Per-trail miles, challenge reps, and Quest Pins. Gym miles never land here.
  trails: emptyTrails(),
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function memberMaxHp(member) {
  return maxHpFor(getCreature(member.id), levelFromXp(member.xp));
}

// Map a change over the active party member.
function updateActive(state, fn) {
  if (!state.party.length) return state;
  const party = state.party.map((m, i) => (i === state.activeIndex ? fn(m) : m));
  return { ...state, party };
}

// Training load from the non-Forge sources. Recovery reads one number, so a
// battle or a walked mile has to contribute to it — otherwise three days of real
// exercise reported "Nothing logged recently" beside a 3-day streak.
const LOAD_PER_BATTLE = 2.5;
const LOAD_PER_MILE = 1.2;
const LOAD_PER_WORKOUT_XP = 0.06;

// Everything worth remembering lands in state.history through here: recovery,
// personal records and the weekly rollup all read from it, and none of them can
// see anything an action did not record.
function remember(state, patch) {
  const today_ = today();
  return trim(stamp(state.history, today_, patch), today_);
}

function applyEffect(member, effect) {
  if (!member || !effect) return member;
  const next = { ...member };
  if (effect.xp) next.xp += effect.xp;
  if (effect.bond) next.bond += effect.bond;
  // Evolve points ride the same path as XP and bond, so a new source only has
  // to name a reward — it never learns how progression works. Points are per
  // companion: the one that did the work is the one that grows.
  if (effect.evo) next.evo = (next.evo || 0) + effect.evo;
  if (effect.heal) {
    const maxHp = memberMaxHp(next);
    next.hp = clamp((next.hp == null ? maxHp : next.hp) + effect.heal, 0, maxHp);
  }
  return next;
}

// A module log, as a function rather than only a reducer case: a smoothie
// bought at the bar records a Nourish check-in when you drink it, and it has to
// go down the SAME path a tap on the log screen does. Two implementations of
// "log a habit" is how a daily cap ends up applying on one of them.
//
// `mintCredit` is false when something you already paid for triggered the log.
// The goal bonus is small and the drink costs more than it pays, so it was
// never a real loop, but a shop that can refund part of its own price is a
// thing to not have at all.
function logModule(state, payload, { mintCredit = true } = {}) {
  const { moduleId, actionId, capped } = payload || {};
  const module = getModule(moduleId);
  if (!module) return state;
  const result = logModuleAction(module, moduleStateFor(state.modules, moduleId), actionId, today(), capped);
  if (!result) return state;
  const evo =
    pointsFor(module.training ? 'session' : 'habit') +
    (result.goalJustHit ? pointsFor('habit') : 0);
  const next = updateActive(state, (m) => applyEffect(m, { ...result.reward, evo }));
  const earned = mintCredit && result.goalJustHit ? mint(state, CREDIT_PER_GOAL) : null;
  return {
    ...next,
    ...(earned ? { credits: earned.credits } : {}),
    modules: { ...state.modules, [moduleId]: result.state },
    history: remember(state, {
      xp: result.reward.xp || 0,
      bond: result.reward.bond || 0,
      habitLogs: 1,
      goalsMet: result.goalJustHit ? 1 : 0,
      // `training` is a module flag, not a hardcoded id — the reducer still
      // knows nothing about any specific module. Counted whether or not it
      // paid: a second session on the same day still happened.
      sessions: module.training ? 1 : 0,
      load: payload.load || 0,
    }),
    stats: {
      ...state.stats,
      ...(earned ? { creditCarry: earned.creditCarry } : {}),
      habitLogs: state.stats.habitLogs + 1,
      habitGoalsHit: state.stats.habitGoalsHit + (result.goalJustHit ? 1 : 0),
    },
  };
}

// Record a battle target as seen, but only if it IS one of the roster. A
// sparring partner is a person handed in whole by the scene, not a creature id.
function seenDex(dex, targetId) {
  if (!getCreature(targetId)) return dex;
  return { ...dex, [targetId]: dex[targetId] || 'seen' };
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const saved = action.payload;
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
      merged.party = (party || []).map((m) => ({ ...m, evo: m.evo || 0 }));
      merged.activeIndex = clamp(saved.activeIndex || 0, 0, Math.max(0, merged.party.length - 1));
      delete merged.companion;

      // v3: life modules. Old saves have none — every registered module starts
      // at zero, and any module already stored gets its day rolled over (which
      // is where the daily reset actually happens for a returning player).
      const migratingDates = (saved.version || 1) < 3;
      merged.modules = rollAllModules(saved.modules, today());
      // v4: the daily history. Older saves simply start recording from now —
      // there is no honest way to reconstruct days nobody logged.
      merged.history = trim(saved.history || {}, today());
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
      const gap = daysBetween(merged.meta.lastPlayedDate, today());
      if (gap === 1 && !migratingDates) {
        merged.stats.streak += 1;
        merged.stats.daysActive += 1;
      } else if (gap > 1) {
        merged.stats.streak = 1;
        merged.stats.daysActive += 1;
      }
      merged.meta.lastPlayedDate = today();
      return merged;
    }

    case 'RESET':
      return {
        ...FRESH,
        meta: { createdAt: today(), lastPlayedDate: today(), sparDone: false },
        trails: emptyTrails(),
      };

    case 'START_GAME': {
      const { goalId, starterId } = action.payload;
      const maxHp = maxHpFor(getCreature(starterId), 1);
      return {
        ...state,
        started: true,
        goalId,
        party: [{ id: starterId, baseId: starterId, xp: 0, bond: 0, evo: 0, hp: maxHp }],
        activeIndex: 0,
        dex: { ...state.dex, [starterId]: 'owned' },
        bag: { ...state.bag, knot: (state.bag.knot || 0) + STARTING_KNOTS },
        modules: rollAllModules(state.modules, today()),
      };
    }

    case 'SET_PLAYER_CHARACTER':
      if (state.playerOutfit && state.playerGender) return state;
      return {
        ...state,
        playerOutfit: state.playerOutfit || action.payload.outfitId,
        playerGender: state.playerGender || action.payload.gender,
      };

    case 'ADD_DISTANCE': {
      const mi = Math.max(0, action.payload.miles || 0);
      const steps = Math.max(0, Math.floor(action.payload.steps || 0));
      if (mi <= 0 && steps <= 0) return state;
      const pacing = pacingForGoal(state.goalId);
      let routeMi = state.stats.routeMi + mi;
      let milestonesReached = state.stats.milestonesReached;
      let hitMilestones = 0;
      while (routeMi >= pacing.milestoneMi) {
        routeMi -= pacing.milestoneMi;
        milestonesReached += 1;
        hitMilestones += 1;
      }
      // Walking pays XP now. Distance arrives a thousandth of a mile at a
      // time, so the fraction is carried between dispatches — rounding each
      // step's worth on its own would floor every one of them to zero.
      const carry = (state.stats.xpCarry || 0) + mi * XP_PER_MILE * (pacing.mileXpMult || 1);
      const walkXp = Math.floor(carry);
      const withEvo = updateActive(state, (m) =>
        applyEffect(m, {
          xp: walkXp,
          evo: hitMilestones ? pointsFor('milestone', hitMilestones) : 0,
        })
      );
      // Walking is where credit comes from. Minted on the same fractional carry
      // as the XP above, for the same reason.
      const earned = mint(state, mi * CREDIT_PER_MILE);
      // Only outdoor trail distance fills a trail quota. The gym's deck
      // dispatches the same action without a routeId on purpose.
      const trails = addTrailMiles(state.trails, action.payload.routeId, mi);
      return {
        ...withEvo,
        trails,
        credits: earned.credits,
        // Steps are recorded per day as well as lifetime: a friends board can
        // only check that a day's distance and its step count agree with each
        // other if it has both. See server/validate.js.
        history: remember(state, { steps, distanceMi: mi, load: mi * LOAD_PER_MILE, xp: walkXp }),
        stats: {
          ...state.stats,
          xpCarry: carry - walkXp,
          creditCarry: earned.creditCarry,
          totalSteps: state.stats.totalSteps + steps,
          distanceMi: state.stats.distanceMi + mi,
          routeMi,
          milestonesReached,
        },
      };
    }

    case 'COLLECT_ITEM': {
      const { itemId } = action.payload;
      return {
        ...state,
        bag: { ...state.bag, [itemId]: (state.bag[itemId] || 0) + 1 },
        stats: { ...state.stats, itemsCollected: state.stats.itemsCollected + 1 },
      };
    }

    case 'USE_ITEM': {
      const { itemId } = action.payload;
      if (!state.bag[itemId] || state.bag[itemId] <= 0) return state;
      const item = getItem(itemId);
      if (!item.effect) return state;
      let next = updateActive(state, (m) => applyEffect(m, item.effect));
      next = { ...next, bag: { ...state.bag, [itemId]: state.bag[itemId] - 1 } };
      // A smoothie is a two-part item: the blend does something for your
      // companion, and drinking it is your own check-in. The log goes down the
      // module's normal path, so the daily cap applies exactly as it would if
      // you had tapped it on the habit screen.
      return item.logAs ? logModule(next, item.logAs, { mintCredit: false }) : next;
    }

    // Buying is the ONLY way credit leaves the wallet, and the price is looked
    // up here rather than passed in: a screen that could name its own price is
    // one bug away from a free shop.
    case 'BUY_ITEM': {
      const { itemId } = action.payload;
      const price = priceOf(itemId);
      if (price == null || !getItem(itemId)) return state;
      if ((state.credits || 0) < price) return state;
      return {
        ...state,
        credits: state.credits - price,
        bag: { ...state.bag, [itemId]: (state.bag[itemId] || 0) + 1 },
      };
    }

    case 'CONSUME_ITEM': {
      const { itemId } = action.payload;
      if (!state.bag[itemId] || state.bag[itemId] <= 0) return state;
      return { ...state, bag: { ...state.bag, [itemId]: state.bag[itemId] - 1 } };
    }

    case 'GAIN_XP':
      return updateActive(state, (m) => ({ ...m, xp: m.xp + (action.payload.amount || 0) }));

    // No caller today: rewards reach bond through applyEffect. It stays
    // because CLAUDE.md offers it to life modules as part of the
    // module-agnostic progression contract.
    case 'GAIN_BOND':
      return updateActive(state, (m) => ({ ...m, bond: m.bond + (action.payload.amount || 0) }));

    case 'SET_HP':
      return updateActive(state, (m) => ({ ...m, hp: clamp(action.payload.hp, 0, memberMaxHp(m)) }));

    case 'SWAP_ACTIVE':
      return { ...state, activeIndex: clamp(action.payload.index, 0, state.party.length - 1) };

    case 'WIN_BATTLE': {
      const { xp = 0, bond = 0, targetId, companionHp, spar, warden, routeId } = action.payload;
      const next = updateActive(state, (m) => ({
        ...applyEffect(m, { evo: pointsFor('battle') }),
        xp: m.xp + xp,
        bond: m.bond + bond,
        hp: clamp(companionHp != null ? companionHp : (m.hp == null ? memberMaxHp(m) : m.hp), 0, memberMaxHp(m)),
      }));
      const won = mint(state, CREDIT_PER_WIN);
      const pin = warden && routeId ? awardPin(state.trails, routeId) : { trails: state.trails, first: false };
      return {
        ...next,
        trails: pin.trails,
        // First Warden win: the pin is on the trail record; a Knot is the
        // invitation that trail just opened.
        bag: pin.first
          ? { ...state.bag, knot: (state.bag.knot || 0) + 1 }
          : state.bag,
        credits: won.credits,
        history: remember(state, { xp, bond, battles: 1, load: LOAD_PER_BATTLE }),
        stats: {
          ...state.stats,
          creditCarry: won.creditCarry,
          battlesWon: state.stats.battlesWon + 1,
        },
        // A trainer's companion is on the roster, but this fight is not how
        // you meet it. Stamping seen here leaked Pebblepup into the Index
        // before Cairn Cut was open.
        dex: spar ? state.dex : seenDex(state.dex, targetId),
        // Winning the spar is the end of that scene: Rowan has finished his
        // session and gone.
        meta: spar ? { ...state.meta, sparDone: true } : state.meta,
      };
    }

    case 'CATCH': {
      const { creatureId, xp = 0, bond = 0, hp } = action.payload;
      // Full Circle: a no-op. Do not spend a Knot (the screen must not
      // CONSUME either), do not stamp the Index, do not leave the fight.
      if (state.party.length >= MAX_PARTY) return state;
      const dex = { ...state.dex, [creatureId]: 'owned' };
      const maxHp = maxHpFor(getCreature(creatureId), levelFromXp(xp));
      const member = { id: creatureId, baseId: creatureId, xp, bond, evo: 0, hp: hp != null ? hp : maxHp };
      return { ...state, party: [...state.party, member], dex, stats: { ...state.stats, caught: state.stats.caught + 1 } };
    }

    case 'SET_TRAIL': {
      return { ...state, trails: setActiveTrail(state.trails, action.payload.routeId) };
    }

    case 'LOSE_BATTLE': {
      const { targetId } = action.payload;
      const next = updateActive(state, (m) => ({ ...m, hp: memberMaxHp(m) }));
      return {
        ...next,
        stats: { ...state.stats, battlesLost: state.stats.battlesLost + 1 },
        dex: seenDex(state.dex, targetId),
      };
    }

    case 'SEE_CREATURE': {
      const { id } = action.payload;
      if (state.dex[id] === 'owned') return state;
      return { ...state, dex: { ...state.dex, [id]: 'seen' } };
    }

    // --- Phase 3: life modules ---------------------------------------------
    // A module log is just another way to earn. It updates state.modules[id]
    // and then hands its reward to the SAME xp/bond path a workout uses, so no
    // module ever needs to know how progression works.
    case 'MODULE_LOG':
      return logModule(state, action.payload);

    // Merge a module's OWN data (not the daily counters) — the Forge storing
    // the player's saved plans, for example. Generic on purpose: a module can
    // persist whatever it needs without the reducer learning about it.
    case 'MODULE_PATCH': {
      const { moduleId, patch } = action.payload;
      if (!getModule(moduleId) || !patch) return state;
      const current = moduleStateFor(state.modules, moduleId, today());
      return { ...state, modules: { ...state.modules, [moduleId]: { ...current, ...patch } } };
    }

    // Roll stale module days over to today. Fired on HYDRATE via rollAllModules
    // and again by the Habits screens, so a session left open past midnight
    // still starts the new day clean (streaks intact).
    case 'MODULE_RESET_DAY': {
      const { moduleId } = action.payload || {};
      if (moduleId) {
        if (!getModule(moduleId)) return state;
        return { ...state, modules: { ...state.modules, [moduleId]: rollDay(state.modules[moduleId], today()) } };
      }
      return { ...state, modules: rollAllModules(state.modules, today()) };
    }

    // Taking a rest day is a real training decision, so it is a real action.
    // It pays bond and healing and NEVER xp: resting is not effort, and paying
    // xp for it would make "rest" a button you press for progress.
    case 'REST_DAY': {
      const day = (state.history || {})[today()];
      if (day && day.rested) return state;
      const next = updateActive(state, (m) => applyEffect(m, { bond: 6, heal: 40 }));
      return { ...next, history: remember(state, { rested: true, bond: 6 }) };
    }

    // A challenge move IS an exercise you actually did. It paid damage and XP
    // and then vanished, so nothing in the app could ever tell you how many
    // push-ups you had done — the one number a fitness game should never lose.
    case 'LOG_EXERCISE': {
      const { id, kind, target = 0, routeId } = action.payload || {};
      if (target <= 0) return state;
      const reps = kind === 'hold' ? 0 : target;
      const holdSec = kind === 'hold' ? target : 0;
      return {
        ...state,
        trails: addTrailReps(state.trails, routeId, reps),
        history: remember(state, { sets: 1, reps, holdSec }),
        stats: {
          ...state.stats,
          // One confirmed move is one set, whether it was counted in reps or
          // held for time.
          sets: state.stats.sets + 1,
          reps: state.stats.reps + reps,
          holdSec: state.stats.holdSec + holdSec,
          exercises: id
            ? { ...state.stats.exercises, [id]: (state.stats.exercises[id] || 0) + target }
            : state.stats.exercises,
        },
      };
    }

    case 'COMPLETE_WORKOUT': {
      const { xp = 0, bond = 0 } = action.payload.reward || {};
      const mult = pacingForGoal(state.goalId).workoutXpMult || 1;
      const next = updateActive(state, (m) =>
        applyEffect({ ...m, xp: m.xp + Math.round(xp * mult), bond: m.bond + bond }, { evo: pointsFor('session') })
      );
      const paid = mint(state, CREDIT_PER_SESSION);
      return {
        ...next,
        credits: paid.credits,
        history: remember(state, {
          xp: Math.round(xp * mult),
          bond,
          workouts: 1,
          load: Math.round(xp * mult * LOAD_PER_WORKOUT_XP * 10) / 10,
        }),
        stats: {
          ...state.stats,
          creditCarry: paid.creditCarry,
          sets: state.stats.sets + (action.payload.sets || 1),
          workoutsDone: state.stats.workoutsDone + 1,
          exercises: action.payload.workoutId
            ? {
              ...state.stats.exercises,
              [`workout:${action.payload.workoutId}`]:
                (state.stats.exercises[`workout:${action.payload.workoutId}`] || 0) + 1,
            }
            : state.stats.exercises,
        },
      };
    }

    // Hitting a new max is the clearest evidence in the app that something
    // actually changed, so it is worth the most and gets its own action rather
    // than being folded into the session that contained it.
    case 'RECORD_PR': {
      const n = Math.max(0, action.payload.count || 0);
      if (!n) return state;
      const next = updateActive(state, (m) =>
        applyEffect(m, { xp: xpFor('pr', n), evo: pointsFor('pr', n) })
      );
      return { ...next, history: remember(state, { xp: xpFor('pr', n) }) };
    }

    case 'EVOLVE': {
      const { newId } = action.payload;
      const next = updateActive(state, (m) => ({ ...m, id: newId, hp: maxHpFor(getCreature(newId), levelFromXp(m.xp)) }));
      return { ...next, dex: { ...state.dex, [newId]: 'owned' } };
    }

    case 'HEAL_FULL':
      return { ...state, party: state.party.map((m) => ({ ...m, hp: memberMaxHp(m) })) };

    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.payload.key]: action.payload.value } };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, FRESH);
  const [hydrated, setHydrated] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadGame();
      if (mounted && saved) dispatch({ type: 'HYDRATE', payload: saved });
      if (mounted) setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return undefined;
    let cancelled = false;
    (async () => {
      const ok = await saveGame(state);
      if (!cancelled) setSaveError(ok ? null : 'Could not save your progress.');
    })();
    return () => { cancelled = true; };
  }, [state, hydrated]);

  return <GameContext.Provider value={{ state, dispatch, hydrated, saveError }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}

function decorate(member) {
  if (!member) return null;
  const creature = getCreature(member.id);
  const prog = xpProgress(member.xp);
  const maxHp = maxHpFor(creature, prog.level);
  return {
    ...member,
    creature,
    level: prog.level,
    xpInto: prog.into,
    xpNeeded: prog.needed,
    maxHp,
    hp: member.hp == null ? maxHp : member.hp,
  };
}

// The active companion (backwards-compatible selector).
export function useCompanion() {
  const { state } = useGame();
  if (!state.party.length) return null;
  return decorate(state.party[state.activeIndex]);
}

export function useParty() {
  const { state } = useGame();
  return {
    members: state.party.map(decorate),
    activeIndex: state.activeIndex,
  };
}

export function decorateMember(member) {
  return decorate(member);
}

// --- Life-module selectors -------------------------------------------------
// The Habits UI never reads state.modules directly: these hand back the module
// definition, its (normalized) state and today's standing together, so a screen
// can render any module — including ones added after this file was written —
// without special-casing.

export function useModuleState(moduleId) {
  const { state } = useGame();
  return moduleStateFor(state.modules, moduleId);
}

export function useRecovery() {
  const { state } = useGame();
  return computeRecovery(state.history, todayKey());
}

export function useModules() {
  const { state } = useGame();
  return MODULES.map((module) => {
    const modState = moduleStateFor(state.modules, module.id);
    return { module, state: modState, progress: moduleProgress(module, modState) };
  });
}

export async function wipeSave() {
  await clearGame();
}

export { GameContext };
