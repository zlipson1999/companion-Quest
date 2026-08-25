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
import { charmForTrail, CHARM_BY_ID } from '../data/charms';
import { getQuest, questSnapshot, questProgress, MAX_ACTIVE_QUESTS } from '../data/quests';
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
import { appendCardioSession } from './cardioHistory';
import { appendGymCheckIn } from './gymCheckIns';
import { distancePolicy } from './distancePolicy';
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

function updateActive(state, fn) {
  if (!state.party.length) return state;
  const party = state.party.map((m, i) => (i === state.activeIndex ? fn(m) : m));
  return { ...state, party };
}

const LOAD_PER_BATTLE = 2.5;
const LOAD_PER_MILE = 1.2;
const LOAD_PER_WORKOUT_XP = 0.06;

function remember(state, patch) {
  const today_ = today();
  return trim(stamp(state.history, today_, patch), today_);
}

function applyEffect(member, effect) {
  if (!member || !effect) return member;
  const next = { ...member };
  if (effect.xp) next.xp += effect.xp;
  if (effect.bond) next.bond += effect.bond;
  if (effect.evo) next.evo = (next.evo || 0) + effect.evo;
  if (effect.heal) {
    const maxHp = memberMaxHp(next);
    next.hp = clamp((next.hp == null ? maxHp : next.hp) + effect.heal, 0, maxHp);
  }
  return next;
}

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
      const ride = action.payload.activity === 'ride';
      const policy = distancePolicy(action.payload);
      if (mi <= 0 && steps <= 0) return state;
      const pacing = pacingForGoal(state.goalId);
      // Only a selected outdoor trail owns the encounter/milestone meter.
      // Treadmill and bicycle miles remain fitness history without becoming a
      // second route into trail rewards.
      let routeMi = state.stats.routeMi + (policy.advancesTrailMilestones ? mi : 0);
      let milestonesReached = state.stats.milestonesReached;
      let hitMilestones = 0;
      while (policy.advancesTrailMilestones && routeMi >= pacing.milestoneMi) {
        routeMi -= pacing.milestoneMi;
        milestonesReached += 1;
        hitMilestones += 1;
      }
      const carry = (state.stats.xpCarry || 0) + mi * XP_PER_MILE * (pacing.mileXpMult || 1);
      const walkXp = Math.floor(carry);
      const active = state.party[state.activeIndex];
      const activeCreature = active ? getCreature(active.id) : null;
      const lifeCtx = encounterContext(state, { trailId: action.payload.routeId, sessionMiles: mi });
      const trailMi = policy.advancesTrail
        ? trailMilesForPassive(activeCreature, mi, lifeCtx)
        : 0;
      const todayMi = ((state.history && state.history[today()] && state.history[today()].distanceMi) || 0) + mi;
      const withEvo = updateActive(state, (m) => {
        let mem = applyEffect(m, {
          xp: walkXp,
          evo: hitMilestones ? pointsFor('milestone', hitMilestones) : 0,
        });
        mem = liveOnMember(mem, 'distance', {
          miles: mi,
          routeId: action.payload.routeId,
          outdoor: !!action.payload.routeId || ride,
          activity: action.payload.activity,
          milestone: hitMilestones > 0,
          todayMiles: todayMi,
        }, state);
        return mem;
      });
      const earned = policy.earnsTrailCredit
        ? mint(state, mi * CREDIT_PER_MILE)
        : null;
      const trails = addTrailMiles(state.trails, action.payload.routeId, trailMi);
      return {
        ...withEvo,
        trails,
        credits: earned ? earned.credits : state.credits,
        history: remember(state, {
          steps,
          distanceMi: mi,
          cyclingMi: ride ? mi : 0,
          load: mi * LOAD_PER_MILE,
          xp: walkXp,
        }),
        stats: {
          ...state.stats,
          xpCarry: carry - walkXp,
          creditCarry: earned ? earned.creditCarry : state.stats.creditCarry,
          totalSteps: state.stats.totalSteps + steps,
          distanceMi: state.stats.distanceMi + mi,
          cyclingMi: (state.stats.cyclingMi || 0) + (ride ? mi : 0),
          routeMi,
          milestonesReached,
        },
      };
    }

    // One completed cardio session, from any of the five machines, built by
    // finishCardioSession(). Saving and paying happen HERE, exactly once:
    // appendCardioSession refuses an id already in the log, so a duplicate
    // finish event, a re-submitted summary, or a replayed dispatch is a
    // no-op — no second row, no second credit. The award itself was decided
    // by the one shared duration formula (economy.cardioCredits) and rides
    // in the record as creditsAwarded; it is added to the same universal
    // credits pool, and deliberately NOT routed through mint(): the trail's
    // fractional creditCarry belongs to walked miles and stays untouched.
    case 'COMPLETE_CARDIO': {
      const cardioSessions = appendCardioSession(state.cardioSessions, action.payload);
      if (cardioSessions === state.cardioSessions) return state;
      const s = cardioSessions[cardioSessions.length - 1];
      const ride = s.station === 'bike';
      const minutes = Math.round(s.activeSeconds / 60);
      return {
        ...state,
        cardioSessions,
        credits: (state.credits || 0) + (s.creditsAwarded || 0),
        history: remember(state, { cardioSessions: 1, rides: ride ? 1 : 0, cardioMin: minutes }),
        stats: {
          ...state.stats,
          ridesDone: (state.stats.ridesDone || 0) + (ride ? 1 : 0),
          cardioMinutes: (state.stats.cardioMinutes || 0) + minutes,
          cardioSessionsDone: (state.stats.cardioSessionsDone || 0) + 1,
          cardioCreditsEarned: (state.stats.cardioCreditsEarned || 0) + (s.creditsAwarded || 0),
          treadmillMi: (state.stats.treadmillMi || 0) + (s.station === 'treadmill' ? s.miles : 0),
          rowerStrokes: (state.stats.rowerStrokes || 0) + s.strokes,
          rowerMeters: (state.stats.rowerMeters || 0) + s.machineMeters,
          stairFloors: (state.stats.stairFloors || 0) + s.floors,
          ellipticalStrides: (state.stats.ellipticalStrides || 0) + s.strides,
          // Lifetime, unlike the 120-row log: the by-machine panel reads
          // these so its session counts never fall behind its distances.
          machineSessions: {
            ...state.stats.machineSessions,
            [s.station]: ((state.stats.machineSessions || {})[s.station] || 0) + 1,
          },
        },
      };
    }

    // A physical walk-up to the reception desk. Attendance only: the first
    // arrival of each local day is kept with its timestamp; later arrivals
    // the same day change nothing, and no reward of any kind is attached.
    case 'GYM_CHECK_IN': {
      const gymCheckIns = appendGymCheckIn(state.gymCheckIns, action.payload);
      if (gymCheckIns.length === (state.gymCheckIns || []).length) return state;
      return { ...state, gymCheckIns };
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
      return item.logAs ? logModule(next, item.logAs, { mintCredit: false }) : next;
    }

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

    // A companion wears at most one Trail Charm. Equipping moves the charm
    // OUT of the bag onto the member (and any worn one back in), so a single
    // charm can never be worn by two companions at once.
    case 'EQUIP_CHARM': {
      const { charmId } = action.payload;
      if (!CHARM_BY_ID[charmId] || !state.party.length) return state;
      if ((state.bag[charmId] || 0) <= 0) return state;
      const member = state.party[state.activeIndex];
      if (!member || member.charm === charmId) return state;
      const bag = { ...state.bag, [charmId]: state.bag[charmId] - 1 };
      if (member.charm) bag[member.charm] = (bag[member.charm] || 0) + 1;
      return {
        ...state,
        bag,
        party: state.party.map((m, i) => (i === state.activeIndex ? { ...m, charm: charmId } : m)),
      };
    }

    case 'UNEQUIP_CHARM': {
      const member = state.party[state.activeIndex];
      if (!member || !member.charm) return state;
      return {
        ...state,
        bag: { ...state.bag, [member.charm]: (state.bag[member.charm] || 0) + 1 },
        party: state.party.map((m, i) => (i === state.activeIndex ? { ...m, charm: null } : m)),
      };
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
      const {
        xp = 0,
        bond = 0,
        targetId,
        companionHp,
        spar,
        warden,
        regionalWarden,
        routeId,
      } = action.payload;
      const next = updateActive(state, (m) => ({
        ...applyEffect(m, { evo: pointsFor('battle') }),
        xp: m.xp + xp,
        bond: m.bond + bond,
        hp: clamp(companionHp != null ? companionHp : (m.hp == null ? memberMaxHp(m) : m.hp), 0, memberMaxHp(m)),
      }));

      // Every route-end Keeper/Warden win clears its trail, but only the final
      // Warden of a region creates a badge memory and grants the progression
      // Knot reward. This keeps Knots meaningful rather than paying one on all
      // 26 trails.
      const afterLife = regionalWarden && routeId
        ? updateActive(next, (m) => liveOnMember(m, 'pin', {
          routeId,
          pinName: (getRoute(routeId) && getRoute(routeId).pinName) || routeId,
        }, next))
        : next;
      const withHeart = applyHeartstone(afterLife, bond);
      const won = mint(state, CREDIT_PER_WIN);
      const clear = warden && routeId
        ? awardPin(state.trails, routeId)
        : { trails: state.trails, first: false };
      const bag = { ...(withHeart.bag || state.bag) };
      let discoveredCharms = { ...(state.discoveredCharms || {}) };
      if (regionalWarden && clear.first) {
        bag.knot = (bag.knot || 0) + 1;
      } else if (warden && !regionalWarden && clear.first && routeId) {
        const charm = charmForTrail(routeId);
        if (charm) {
          bag[charm.id] = (bag[charm.id] || 0) + 1;
          discoveredCharms = { ...discoveredCharms, [charm.id]: true };
        }
      }
      return {
        ...withHeart,
        trails: clear.trails,
        bag,
        discoveredCharms,
        credits: won.credits,
        history: remember(state, { xp, bond, battles: 1, load: LOAD_PER_BATTLE }),
        stats: {
          ...state.stats,
          creditCarry: won.creditCarry,
          battlesWon: state.stats.battlesWon + 1,
        },
        dex: spar ? state.dex : seenDex(state.dex, targetId),
        meta: spar ? { ...state.meta, sparDone: true } : state.meta,
      };
    }

    case 'CATCH': {
      const { creatureId, xp = 0, bond = 0, hp } = action.payload;
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

    case 'SET_TRAIL':
      return { ...state, trails: setActiveTrail(state.trails, action.payload.routeId) };

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

    case 'MODULE_LOG':
      return logModule(state, action.payload);

    case 'MODULE_PATCH': {
      const { moduleId, patch } = action.payload;
      if (!getModule(moduleId) || !patch) return state;
      const current = moduleStateFor(state.modules, moduleId, today());
      return { ...state, modules: { ...state.modules, [moduleId]: { ...current, ...patch } } };
    }

    case 'MODULE_RESET_DAY': {
      const { moduleId } = action.payload || {};
      if (moduleId) {
        if (!getModule(moduleId)) return state;
        return { ...state, modules: { ...state.modules, [moduleId]: rollDay(state.modules[moduleId], today()) } };
      }
      return { ...state, modules: rollAllModules(state.modules, today()) };
    }

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

    case 'MARK_META':
      return { ...state, meta: { ...state.meta, ...action.payload } };

    // Maple's starter package, handed over once at the end of her guided first
    // session. Flag and grant are one action so a re-dispatch (a re-render, a
    // replayed session, a hand-crafted call) can never mint a second package.
    case 'CLAIM_STARTER_PACK': {
      if (state.meta.mapleSessionDone) return state;
      return {
        ...state,
        meta: { ...state.meta, mapleSessionDone: true },
        bag: {
          ...state.bag,
          knot: (state.bag.knot || 0) + 5,
          berryblend: (state.bag.berryblend || 0) + 1,
        },
      };
    }

    // ---- The Quest Ledger (data/quests.js) ----
    // Quests are BOUGHT with Quest Credits (5-15, priced by ease and reward
    // quality) — the reducer holds the rules: a real quest, affordable, at
    // most MAX_ACTIVE at once, no duplicates. The purchase snapshots today's
    // records so only effort AFTER buying counts. This and the smoothie bar
    // are the only places credits are ever spent.
    case 'BUY_QUEST': {
      const quest = getQuest(action.payload.questId);
      if (!quest) return state;
      if ((state.credits || 0) < quest.price) return state;
      if (state.quests.active.length >= MAX_ACTIVE_QUESTS) return state;
      if (state.quests.active.some((a) => a.questId === quest.id)) return state;
      return {
        ...state,
        credits: state.credits - quest.price,
        quests: {
          ...state.quests,
          active: [...state.quests.active, { questId: quest.id, startedDay: today(), base: questSnapshot(state) }],
        },
      };
    }

    // Turning in re-checks completion here, not in the screen: the reward
    // (matched to the category through the usual {xp,bond,evo,heal} contract,
    // plus items) and the Token only exist for finished requirements.
    // Tokens are proof of completion, never currency — nothing spends or
    // sells one — and turning in mints no credits: a quest that paid back
    // more than its price would be a money printer.
    case 'TURN_IN_QUEST': {
      const active = state.quests.active.find((a) => a.questId === action.payload.questId);
      const quest = active && getQuest(active.questId);
      if (!quest) return state;
      if (!questProgress(quest, active, state, today()).done) return state;
      let next = updateActive(state, (m) => {
        let mem = applyEffect(m, quest.reward);
        if (quest.reward.healFull) mem = { ...mem, hp: memberMaxHp(mem) };
        return mem;
      });
      const bag = quest.reward.item
        ? { ...next.bag, [quest.reward.item]: (next.bag[quest.reward.item] || 0) + 1 }
        : next.bag;
      return {
        ...next,
        bag,
        quests: {
          ...state.quests,
          active: state.quests.active.filter((a) => a.questId !== quest.id),
          completed: [...state.quests.completed, { questId: quest.id, day: today() }],
          tokens: { ...state.quests.tokens, [quest.tokenId]: (state.quests.tokens[quest.tokenId] || 0) + 1 },
        },
      };
    }

    // Walking away frees the slot. The credits stay spent — the ledger
    // sells commitments, not refunds — which is also why buying is a choice.
    case 'ABANDON_QUEST': {
      if (!state.quests.active.some((a) => a.questId === action.payload.questId)) return state;
      return {
        ...state,
        quests: { ...state.quests, active: state.quests.active.filter((a) => a.questId !== action.payload.questId) },
      };
    }

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
      if (!saved || !saved.started) {
        const cloud = await pullCloudSave();
        if (mounted && cloud) dispatch({ type: 'HYDRATE', payload: cloud });
      }
      if (mounted) setHydrated(true);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return undefined;
    let cancelled = false;
    (async () => {
      const ok = await saveGame(state);
      if (!cancelled) setSaveError(ok ? null : 'Could not save your progress.');
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
