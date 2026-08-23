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
  setActiveTrail,
  getRoute,
} from '../data/routes';
import { xpProgress, levelFromXp, maxHpFor } from './leveling';
import { loadGame, saveGame, clearGame } from './storage';
import { pullCloudSave, pushCloudSaveSoon } from './cloudSave';
import { stamp, trim } from './history';
import { computeRecovery } from './recovery';
import { XP_PER_MILE, pointsFor, xpFor } from './evolution';
import { CREDIT_PER_GOAL, CREDIT_PER_MILE, CREDIT_PER_SESSION, CREDIT_PER_WIN, mint } from './economy';
import { FRESH, hydrateSave } from './hydrate';
import {
  liveOnMember,
  applyHeartstone,
  moduleEvent,
  trailMilesForPassive,
  encounterContext,
  blankBehaviors,
} from './companionLife';
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
  const ev = moduleEvent(moduleId);
  const next = updateActive(state, (m) => {
    let mem = applyEffect(m, { ...result.reward, evo });
    if (ev) {
      mem = liveOnMember(mem, ev, {
        goalJustHit: result.goalJustHit,
        amount: 1,
        routeId: state.trails && state.trails.activeId,
      }, state);
    }
    return mem;
  });
  const earned = mintCredit && result.goalJustHit ? mint(state, CREDIT_PER_GOAL) : null;
  const withHeart = applyHeartstone(next, (result.reward && result.reward.bond) || 0);
  return {
    ...withHeart,
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
    case 'HYDRATE':
      return hydrateSave(action.payload);

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
        party: [{ id: starterId, baseId: starterId, xp: 0, bond: 0, evo: 0, hp: maxHp, behaviors: blankBehaviors(), memories: [] }],
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
      const active = state.party[state.activeIndex];
      const activeCreature = active ? getCreature(active.id) : null;
      const lifeCtx = encounterContext(state, { trailId: action.payload.routeId, sessionMiles: mi });
      const trailMi = trailMilesForPassive(activeCreature, mi, lifeCtx);
      const todayMi = ((state.history && state.history[today()] && state.history[today()].distanceMi) || 0) + mi;
      const withEvo = updateActive(state, (m) => {
        let mem = applyEffect(m, {
          xp: walkXp,
          evo: hitMilestones ? pointsFor('milestone', hitMilestones) : 0,
        });
        mem = liveOnMember(mem, 'distance', {
          miles: mi,
          routeId: action.payload.routeId,
          outdoor: !!action.payload.routeId,
          milestone: hitMilestones > 0,
          todayMiles: todayMi,
        }, state);
        return mem;
      });
      // Walking is where credit comes from. Minted on the same fractional carry
      // as the XP above, for the same reason.
      const earned = mint(state, mi * CREDIT_PER_MILE);
      // Only outdoor trail distance fills a trail quota. The gym's deck
      // dispatches the same action without a routeId on purpose.
      const trails = addTrailMiles(state.trails, action.payload.routeId, trailMi);
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
      const afterLife = warden && routeId
        ? updateActive(next, (m) => liveOnMember(m, 'pin', {
          routeId,
          pinName: (getRoute(routeId) && getRoute(routeId).pinName) || routeId,
        }, next))
        : next;
      const withHeart = applyHeartstone(afterLife, bond);
      const won = mint(state, CREDIT_PER_WIN);
      const pin = warden && routeId ? awardPin(state.trails, routeId) : { trails: state.trails, first: false };
      return {
        ...withHeart,
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
      const member = {
        id: creatureId,
        baseId: creatureId,
        xp,
        bond,
        evo: 0,
        hp: hp != null ? hp : maxHp,
        behaviors: blankBehaviors(),
        memories: [{ id: 'met', at: today(), title: 'Met', detail: `You met ${getCreature(creatureId).name}.` }],
      };
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
      const next = updateActive(state, (m) => {
        let mem = applyEffect(m, { bond: 6, heal: 40 });
        mem = liveOnMember(mem, 'recovery', { amount: 1 }, state);
        return mem;
      });
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
      const next = updateActive(state, (m) => {
        let mem = applyEffect(
          { ...m, xp: m.xp + Math.round(xp * mult), bond: m.bond + bond },
          { evo: pointsFor('session') }
        );
        mem = liveOnMember(mem, 'workout', { amount: 1 }, state);
        return mem;
      });
      const withHeart = applyHeartstone(next, bond);
      const paid = mint(state, CREDIT_PER_SESSION);
      return {
        ...withHeart,
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
      const next = updateActive(state, (m) => {
        let mem = applyEffect(m, { xp: xpFor('pr', n), evo: pointsFor('pr', n) });
        mem = liveOnMember(mem, 'pr', { count: n }, state);
        return mem;
      });
      return { ...next, history: remember(state, { xp: xpFor('pr', n) }) };
    }

    case 'EVOLVE': {
      const { newId } = action.payload;
      const next = updateActive(state, (m) => {
        const from = getCreature(m.id);
        const to = getCreature(newId);
        let mem = { ...m, id: newId, hp: maxHpFor(to, levelFromXp(m.xp)) };
        mem = liveOnMember(mem, 'evolve', {
          fromName: from && from.name,
          toName: to && to.name,
          toId: newId,
        }, state);
        return mem;
      });
      return { ...next, dex: { ...state.dex, [newId]: 'owned' } };
    }

    case 'HEAL_FULL':
      return { ...state, party: state.party.map((m) => ({ ...m, hp: memberMaxHp(m) })) };

    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.payload.key]: action.payload.value } };

    // One-way story flags (coachIntroDone, ...). Settings are choices a person
    // can change back; meta records that a moment has happened.
    case 'MARK_META':
      return { ...state, meta: { ...state.meta, ...action.payload } };

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
      // A phone with no journey but a remembered sign-in is a reinstall or a
      // new device: the account carries the save, so bring it home. A started
      // local save always wins — the cloud only ever fills an empty device.
      if (!saved || !saved.started) {
        const cloud = await pullCloudSave();
        if (mounted && cloud) dispatch({ type: 'HYDRATE', payload: cloud });
      }
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
      // Signed in? The same save rides up to the account, debounced.
      if (ok) pushCloudSaveSoon(state);
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
