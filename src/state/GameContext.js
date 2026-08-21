// Central game state: a reducer + context with automatic persistence.
// Phase 1.5: you build a TEAM. state.party holds your companions and
// state.activeIndex is the one currently at your side / fighting. Distance
// (miles) drives the Route. Old single-companion saves migrate automatically.
// Phase 3: state.modules holds one bucket per installed life module. Modules
// pay out through the same XP/bond path as everything else — that is the whole
// point of the plugin system.

import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { getCreature } from '../data/creatures';
import { getItem } from '../data/items';
import { pacingForGoal } from '../data/route';
import { xpProgress, levelFromXp, maxHpFor } from './leveling';
import { loadGame, saveGame, clearGame } from './storage';
import { stamp, trim } from './history';
import { computeRecovery } from './recovery';
import { XP_PER_MILE, pointsFor, xpFor } from './evolution';
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
const STARTING_TOKENS = 3;
const MAX_PARTY = 6;
const SAVE_VERSION = 5;

function daysBetween(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

const FRESH = {
  version: SAVE_VERSION,
  started: false,
  goalId: null,
  party: [],
  activeIndex: 0,
  stats: {
    totalSteps: 0,
    distanceMi: 0,
    routeMi: 0,
    xpCarry: 0,   // fractional walking XP not yet paid out
    milestonesReached: 0,
    battlesWon: 0,
    battlesLost: 0,
    caught: 0,
    workoutsDone: 0,
    itemsCollected: 0,
    habitLogs: 0,
    habitGoalsHit: 0,
    daysActive: 1,
    streak: 1,
  },
  bag: {},
  dex: {},
  modules: {},
  history: {},
  settings: { muted: false, bgmMuted: false, units: 'lb' },
  meta: { createdAt: today(), lastPlayedDate: today() },
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

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const saved = action.payload;
      const merged = {
        ...FRESH,
        ...saved,
        stats: { ...FRESH.stats, ...(saved.stats || {}) },
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
      return { ...FRESH, meta: { createdAt: today(), lastPlayedDate: today() } };

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
        bag: { ...state.bag, token: (state.bag.token || 0) + STARTING_TOKENS },
        modules: rollAllModules(state.modules, today()),
      };
    }

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
      const carry = (state.stats.xpCarry || 0) + mi * XP_PER_MILE;
      const walkXp = Math.floor(carry);
      const withEvo = updateActive(state, (m) =>
        applyEffect(m, {
          xp: walkXp,
          evo: hitMilestones ? pointsFor('milestone', hitMilestones) : 0,
        })
      );
      return {
        ...withEvo,
        history: remember(state, { distanceMi: mi, load: mi * LOAD_PER_MILE, xp: walkXp }),
        stats: {
          ...state.stats,
          xpCarry: carry - walkXp,
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
      const next = updateActive(state, (m) => applyEffect(m, item.effect));
      return { ...next, bag: { ...state.bag, [itemId]: state.bag[itemId] - 1 } };
    }

    case 'CONSUME_ITEM': {
      const { itemId } = action.payload;
      if (!state.bag[itemId] || state.bag[itemId] <= 0) return state;
      return { ...state, bag: { ...state.bag, [itemId]: state.bag[itemId] - 1 } };
    }

    case 'GAIN_XP':
      return updateActive(state, (m) => ({ ...m, xp: m.xp + (action.payload.amount || 0) }));

    case 'GAIN_BOND':
      return updateActive(state, (m) => ({ ...m, bond: m.bond + (action.payload.amount || 0) }));

    case 'SET_HP':
      return updateActive(state, (m) => ({ ...m, hp: clamp(action.payload.hp, 0, memberMaxHp(m)) }));

    case 'SWAP_ACTIVE':
      return { ...state, activeIndex: clamp(action.payload.index, 0, state.party.length - 1) };

    case 'WIN_BATTLE': {
      const { xp = 0, bond = 0, targetId, companionHp } = action.payload;
      const next = updateActive(state, (m) => ({
        ...applyEffect(m, { evo: pointsFor('battle') }),
        xp: m.xp + xp,
        bond: m.bond + bond,
        hp: clamp(companionHp != null ? companionHp : (m.hp == null ? memberMaxHp(m) : m.hp), 0, memberMaxHp(m)),
      }));
      return {
        ...next,
        history: remember(state, { xp, bond, battles: 1, load: LOAD_PER_BATTLE }),
        stats: { ...state.stats, battlesWon: state.stats.battlesWon + 1 },
        dex: { ...state.dex, [targetId]: state.dex[targetId] || 'seen' },
      };
    }

    case 'CATCH': {
      const { creatureId, xp = 0, bond = 0, hp } = action.payload;
      const dex = { ...state.dex, [creatureId]: 'owned' };
      if (state.party.length >= MAX_PARTY) {
        // team full — record it in the index, but it does NOT join or count.
        return { ...state, dex };
      }
      const maxHp = maxHpFor(getCreature(creatureId), levelFromXp(xp));
      const member = { id: creatureId, baseId: creatureId, xp, bond, evo: 0, hp: hp != null ? hp : maxHp };
      return { ...state, party: [...state.party, member], dex, stats: { ...state.stats, caught: state.stats.caught + 1 } };
    }

    case 'LOSE_BATTLE': {
      const { targetId } = action.payload;
      const next = updateActive(state, (m) => ({ ...m, hp: memberMaxHp(m) }));
      return {
        ...next,
        stats: { ...state.stats, battlesLost: state.stats.battlesLost + 1 },
        dex: { ...state.dex, [targetId]: state.dex[targetId] || 'seen' },
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
    case 'MODULE_LOG': {
      const { moduleId, actionId, capped } = action.payload;
      const module = getModule(moduleId);
      if (!module) return state;
      const result = logModuleAction(module, moduleStateFor(state.modules, moduleId), actionId, today(), capped);
      if (!result) return state;
      const evo =
        pointsFor(module.training ? 'session' : 'habit') +
        (result.goalJustHit ? pointsFor('habit') : 0);
      const next = updateActive(state, (m) => applyEffect(m, { ...result.reward, evo }));
      return {
        ...next,
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
          load: action.payload.load || 0,
        }),
        stats: {
          ...state.stats,
          habitLogs: state.stats.habitLogs + 1,
          habitGoalsHit: state.stats.habitGoalsHit + (result.goalJustHit ? 1 : 0),
        },
      };
    }

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

    case 'COMPLETE_WORKOUT': {
      const { xp = 0, bond = 0 } = action.payload.reward || {};
      const mult = pacingForGoal(state.goalId).workoutXpMult || 1;
      const next = updateActive(state, (m) =>
        applyEffect({ ...m, xp: m.xp + Math.round(xp * mult), bond: m.bond + bond }, { evo: pointsFor('session') })
      );
      return {
        ...next,
        history: remember(state, {
          xp: Math.round(xp * mult),
          bond,
          workouts: 1,
          load: Math.round(xp * mult * LOAD_PER_WORKOUT_XP * 10) / 10,
        }),
        stats: { ...state.stats, workoutsDone: state.stats.workoutsDone + 1 },
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
  const firstSave = useRef(true);

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
    if (!hydrated) return;
    if (firstSave.current) firstSave.current = false;
    saveGame(state);
  }, [state, hydrated]);

  return <GameContext.Provider value={{ state, dispatch, hydrated }}>{children}</GameContext.Provider>;
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
