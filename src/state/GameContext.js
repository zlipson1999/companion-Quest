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
const SAVE_VERSION = 3;

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
  settings: { muted: false, bgmMuted: false },
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

function applyEffect(member, effect) {
  if (!member || !effect) return member;
  const next = { ...member };
  if (effect.xp) next.xp += effect.xp;
  if (effect.bond) next.bond += effect.bond;
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
      merged.party = party || [];
      merged.activeIndex = clamp(saved.activeIndex || 0, 0, Math.max(0, merged.party.length - 1));
      delete merged.companion;

      // v3: life modules. Old saves have none — every registered module starts
      // at zero, and any module already stored gets its day rolled over (which
      // is where the daily reset actually happens for a returning player).
      merged.modules = rollAllModules(saved.modules, today());
      merged.version = SAVE_VERSION;

      const gap = daysBetween(merged.meta.lastPlayedDate, today());
      if (gap === 1) {
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
        party: [{ id: starterId, baseId: starterId, xp: 0, bond: 0, hp: maxHp }],
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
      while (routeMi >= pacing.milestoneMi) {
        routeMi -= pacing.milestoneMi;
        milestonesReached += 1;
      }
      return {
        ...state,
        stats: {
          ...state.stats,
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
        ...m,
        xp: m.xp + xp,
        bond: m.bond + bond,
        hp: clamp(companionHp != null ? companionHp : (m.hp == null ? memberMaxHp(m) : m.hp), 0, memberMaxHp(m)),
      }));
      return {
        ...next,
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
      const member = { id: creatureId, baseId: creatureId, xp, bond, hp: hp != null ? hp : maxHp };
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
      const { moduleId, actionId } = action.payload;
      const module = getModule(moduleId);
      if (!module) return state;
      const result = logModuleAction(module, moduleStateFor(state.modules, moduleId), actionId, today());
      if (!result) return state;
      const next = updateActive(state, (m) => applyEffect(m, result.reward));
      return {
        ...next,
        modules: { ...state.modules, [moduleId]: result.state },
        stats: {
          ...state.stats,
          habitLogs: state.stats.habitLogs + 1,
          habitGoalsHit: state.stats.habitGoalsHit + (result.goalJustHit ? 1 : 0),
        },
      };
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

    case 'COMPLETE_WORKOUT': {
      const { xp = 0, bond = 0 } = action.payload.reward || {};
      const mult = pacingForGoal(state.goalId).workoutXpMult || 1;
      const next = updateActive(state, (m) => ({ ...m, xp: m.xp + Math.round(xp * mult), bond: m.bond + bond }));
      return { ...next, stats: { ...state.stats, workoutsDone: state.stats.workoutsDone + 1 } };
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
