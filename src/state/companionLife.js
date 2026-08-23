// Companions feel alive: encounters, passives, behaviors, personality, memories.
//
// Data for all of this already lives on horizon creatures (and is harmless
// empty on Grove ones). This file is the only place those fields become
// gameplay. Screens keep their existing look — they just read the helpers.

import { getCreature } from '../data/creatures';
import { getRoute } from '../data/routes';
import { moduleStateFor, todayKey } from '../modules';
import { dayBefore } from '../modules/daily';
import { computeRecovery } from './recovery';
import { pointsFor } from './evolution';
import { levelFromXp, maxHpFor } from './leveling';

export const BEHAVIOR_LABELS = {
  hydrations: 'Hydration',
  workouts: 'Workouts',
  sleeps: 'Sleep',
  recoveries: 'Recovery',
  miles: 'Miles',
  meals: 'Meals',
  cardio: 'Cardio',
  streak: 'Streak',
};

const MODULE_EVENT = {
  hydration: 'hydration',
  sleep: 'sleep',
  diet: 'meal',
  forge: 'workout',
  meditation: 'recovery',
};

export function blankBehaviors() {
  return {
    hydrations: 0,
    workouts: 0,
    sleeps: 0,
    recoveries: 0,
    miles: 0,
    meals: 0,
    cardio: 0,
    streak: 0,
  };
}

function behaviorsOf(member) {
  return { ...blankBehaviors(), ...(member && member.behaviors) };
}

function clampHp(member, hp) {
  const max = maxHpFor(getCreature(member.id), levelFromXp(member.xp || 0));
  return Math.max(0, Math.min(max, hp));
}

function addEffect(member, extra) {
  if (!extra) return member;
  const next = { ...member };
  if (extra.xp) next.xp = (next.xp || 0) + extra.xp;
  if (extra.bond) next.bond = (next.bond || 0) + extra.bond;
  if (extra.evo) next.evo = (next.evo || 0) + extra.evo;
  if (extra.heal) {
    const hp = next.hp == null ? clampHp(next, 999) : next.hp;
    next.hp = clampHp(next, hp + extra.heal);
  }
  return next;
}

export function hourBand(date) {
  const h = (date || new Date()).getHours();
  if (h < 11) return 'morning';
  if (h >= 17) return 'evening';
  return 'midday';
}

export function encounterContext(state, extras) {
  const extra = extras || {};
  const hyd = moduleStateFor(state.modules, 'hydration');
  const sleep = moduleStateFor(state.modules, 'sleep');
  const diet = moduleStateFor(state.modules, 'diet');
  const rec = computeRecovery(state.history, todayKey());
  const today = (state.history && state.history[todayKey()]) || {};
  const yKey = dayBefore(todayKey());
  const yesterday = (state.history && state.history[yKey]) || {};
  const route = extra.trailId ? getRoute(extra.trailId) : null;
  return {
    hour: extra.hour || hourBand(),
    miles: extra.sessionMiles || 0,
    hydration: hyd.count || 0,
    hydrationGoal: !!hyd.goalHit,
    sleep: !!(sleep.goalHit || sleep.count > 0),
    sleepYesterday: sleep.lastGoalDate === yKey || sleep.lastGoalDate === todayKey(),
    sleepStreak: sleep.streak || 0,
    meal: !!(diet.goalHit || diet.count > 0),
    mealStreak: diet.streak || 0,
    workout: (today.workouts || 0) > 0 || (today.sessions || 0) > 0,
    cardio: extra.cardio || (today.distanceMi || 0) > 0.2,
    recovery: !!today.rested || (rec && rec.verdict === 'rest'),
    yesterdayRested: !!yesterday.rested,
    streak: (state.stats && state.stats.streak) || 0,
    prToday: extra.prToday || false,
    bond: extra.bond || 0,
    unusual: extra.unusual || false,
    trailId: extra.trailId || null,
    regionId: route && route.regionId,
    highland: !!(route && (route.regionId === 'thunderstep' || route.edge === 'alpine')),
    coastal: !!(route && route.regionId === 'tideglass'),
  };
}

export function meetsEncounter(creature, ctx) {
  if (!creature) return false;
  const enc = creature.encounter;
  if (!enc) return true;
  const c = ctx || {};
  if (enc.miles && (c.miles || 0) < enc.miles) return false;
  if (enc.time && enc.time !== 'any') {
    if (enc.time === 'morning' && c.hour !== 'morning') return false;
    if (enc.time === 'evening' && c.hour !== 'evening') return false;
  }
  if (enc.streak && (c.streak || 0) < enc.streak) return false;
  switch (enc.when) {
    case 'hydration': return (c.hydration || 0) >= 1;
    case 'workout': return !!c.workout;
    case 'sleep': return !!c.sleep;
    case 'streak': return (c.streak || 0) >= (enc.streak || 3);
    case 'morning-walk': return c.hour === 'morning' && (c.miles || 0) >= (enc.miles || 0.2);
    case 'evening-walk': return c.hour === 'evening' && (c.miles || 0) >= (enc.miles || 0.2);
    case 'recovery': return !!c.recovery;
    case 'cardio': return !!c.cardio || (c.miles || 0) >= 0.3;
    case 'meal': return !!c.meal;
    case 'pr': return !!c.prToday;
    case 'distance': return (c.miles || 0) >= (enc.miles || 0.5);
    case 'bond': return (c.bond || 0) >= 10;
    case 'cardio-after-rest': return (!!c.cardio || (c.miles || 0) >= 0.3) && !!c.yesterdayRested;
    case 'unusual': return !!c.unusual || (c.streak || 0) >= 7 || !!c.prToday;
    default: return true;
  }
}

export function eligibleCompanions(ids, ctx) {
  const list = (ids || []).map(getCreature).filter(Boolean);
  return list.filter((c) => meetsEncounter(c, ctx)).map((c) => c.id);
}

function rarityWeight(id) {
  const c = getCreature(id);
  if (c && c.rarity === 'rare') return 1;
  if (c && c.rarity === 'uncommon') return 3;
  return 6;
}

export function pickWeighted(ids) {
  if (!ids || !ids.length) return null;
  let total = 0;
  const weights = ids.map((id) => {
    const w = rarityWeight(id);
    total += w;
    return w;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < ids.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

export function companionRate(ctx, creature) {
  let rate = 0.55;
  const id = creature && creature.passive && creature.passive.id;
  if (id === 'heather-hush' && ctx && ctx.sleepYesterday) rate = 0.78;
  if (id === 'estuary-drink' && ctx && ctx.hydrationGoal && ctx.coastal) rate = 0.7;
  if (id === 'moonvault-quiet' && ctx && ctx.yesterdayRested && ctx.hour === 'morning') rate = 0.7;
  return rate;
}

export function encounterMeterScale(creature, ctx) {
  let scale = 1;
  const id = creature && creature.passive && creature.passive.id;
  if (id === 'static-charge' && ctx && ctx.highland) scale *= 0.7;
  if (id === 'petalwind') scale *= 0.85;
  if (id === 'lantern-path' && ctx && ctx.hour === 'evening') scale *= 0.8;
  if (id === 'moonvault-quiet' && ctx && ctx.yesterdayRested) scale *= 0.75;
  if (id === 'snowcap-rest' && ctx && ctx.sleep && ctx.yesterdayRested) scale *= 0.65;
  return scale;
}

const PASSIVE_FX = {
  'tidal-sip': (e) => (e === 'hydration' ? { bond: 4, heal: 8 } : null),
  'sunplate': (e) => (e === 'workout' ? { evo: pointsFor('session') } : null),
  'moonbead': (e) => (e === 'sleep' ? { heal: 22, bond: 3 } : null),
  'static-charge': () => null,
  'petalwind': () => null,
  'honey-store': (e) => (e === 'meal' ? { bond: 5 } : null),
  'root-stillness': (e) => (e === 'recovery' ? { evo: 2, bond: 2 } : null),
  'echo-rhythm': (e, _p, ctx) => ((e === 'hydration' || e === 'sleep' || e === 'meal') && ctx && ctx.streak >= 2 ? { evo: 2 } : null),
  'giant-steps': (e, p) => (e === 'distance' && p && p.milestone ? { bond: 3 } : null),
  'glassfire': (e) => (e === 'pr' ? { evo: pointsFor('pr') } : null),
  'skip-miles': () => null,
  'comet-pace': () => null,
  'anemone-stretch': (e) => (e === 'recovery' ? { evo: 1, xp: 6 } : null),
  'aurora-drift': (e, _p, ctx) => (e === 'sleep' && ctx && !ctx.workout ? { bond: 6 } : null),
  'bellflower-ascent': (e, _p, ctx) => (e === 'distance' && ctx && ctx.hour === 'morning' ? { evo: 1 } : null),
  'cinder-song': (e, _p, ctx) => (e === 'cardio' && ctx && ctx.yesterdayRested ? { evo: 3 } : null),
  'cloud-burden': (e, p) => (e === 'distance' && p && (p.todayMiles || 0) >= 2 ? { evo: 4 } : null),
  'dripstone-dream': (e, _p, ctx) => (e === 'sleep' && ctx && ctx.sleepStreak >= 3 ? { heal: 12 } : null),
  'estuary-drink': (e, p) => (e === 'hydration' && p && p.goalJustHit ? { evo: 2 } : null),
  'fossil-current': (e, _p, ctx) => (ctx && ctx.streak >= 14 ? { evo: 1 } : null),
  'grainwheel': (e, _p, ctx) => (e === 'meal' && ctx && ctx.mealStreak >= 3 ? { evo: 2 } : null),
  'heartstone': () => null,
  'heather-hush': () => null,
  'hollowstem-charge': (e) => (e === 'workout' ? { evo: 1 } : null),
  'icebloom-rest': (e, _p, ctx) => ((e === 'sleep' || e === 'recovery') && ctx && ctx.recovery && ctx.sleep ? { evo: 3 } : null),
  'ironwood': (e) => (e === 'workout' ? { heal: 10 } : null),
  'kneeroot-pause': (e) => (e === 'recovery' ? { heal: 16 } : null),
  'lantern-path': (e, _p, ctx) => (e === 'distance' && ctx && ctx.hour === 'evening' ? { bond: 4 } : null),
  'lotus-float': (e) => (e === 'recovery' ? { bond: 4 } : null),
  'mirage-cool': (e, _p, ctx) => (e === 'hydration' && ctx && ctx.hour === 'midday' ? { evo: 1 } : null),
  'moonvault-quiet': () => null,
  'night-orchard': (e, _p, ctx) => (e === 'distance' && ctx && ctx.hour === 'evening' && ctx.meal ? { bond: 3 } : null),
  'pod-fuel': (e, _p, ctx) => (e === 'workout' && ctx && ctx.meal ? { evo: 2 } : null),
  'prairie-pace': (e) => (e === 'hydration' || e === 'meal' || e === 'sleep' || e === 'distance' ? { evo: 0 } : null),
  'ring-count': (e, _p, ctx) => (ctx && ctx.streak > 0 && (e === 'sleep' || e === 'hydration' || e === 'workout') ? { evo: 1 } : null),
  'snowcap-rest': (e, _p, ctx) => (e === 'sleep' && ctx && ctx.recovery ? { heal: 18, bond: 4 } : null),
  'spice-heat': (e) => (e === 'workout' ? { bond: 5 } : null),
  'steam-sip': (e, _p, ctx) => (e === 'hydration' && ctx && ctx.workout ? { evo: 3 } : null),
  'tide-glyph': (e) => (e === 'pin' ? { evo: 6, bond: 8 } : null),
  'willow-still': (e) => (e === 'distance' || e === 'recovery' ? { evo: 1 } : null),
};

export const PASSIVE_IDS = Object.keys(PASSIVE_FX);

export function resolvePassive(creature, event, payload, ctx) {
  if (!creature || !creature.passive) return null;
  const fn = PASSIVE_FX[creature.passive.id];
  if (!fn) return null;
  return fn(event, payload || {}, ctx || {}) || null;
}

export function trailMilesForPassive(creature, miles, ctx) {
  if (!(miles > 0)) return miles;
  let next = miles;
  const id = creature && creature.passive && creature.passive.id;
  if (id === 'comet-pace' && ctx && ctx.hour === 'morning') next *= 1.5;
  if (id === 'skip-miles' && ctx && ctx.coastal) next *= 1.15;
  if (id === 'mirage-cool' && ctx && ctx.hour === 'midday') next *= 1.1;
  if (id === 'bellflower-ascent' && ctx && ctx.hour === 'morning') next *= 1.1;
  return next;
}

const EVENT_BEHAVIOR = {
  hydration: 'hydrations',
  workout: 'workouts',
  sleep: 'sleeps',
  recovery: 'recoveries',
  distance: 'miles',
  meal: 'meals',
  cardio: 'cardio',
};

function bumpBehavior(member, event, payload, state) {
  const next = { ...behaviorsOf(member) };
  const key = EVENT_BEHAVIOR[event];
  if (key === 'miles') next.miles = Math.round((next.miles + (payload.miles || 0)) * 1000) / 1000;
  else if (key === 'cardio') next.cardio = Math.round((next.cardio + (payload.miles || 0)) * 1000) / 1000;
  else if (key) next[key] += payload.amount || 1;
  if (event === 'distance' && payload.outdoor) {
    next.cardio = Math.round((next.cardio + (payload.miles || 0)) * 1000) / 1000;
  }
  const streak = (state && state.stats && state.stats.streak) || 0;
  if (streak > next.streak) next.streak = streak;
  return next;
}

const BOND_MARKS = [10, 25, 50, 100];

function pushMemory(member, mem) {
  const list = Array.isArray(member.memories) ? member.memories.slice() : [];
  if (list.some((m) => m.id === mem.id)) return member;
  list.push({ ...mem, at: mem.at || todayKey() });
  return { ...member, memories: list.slice(-24) };
}

function memoriesFor(member, creature, event, payload, prevBond) {
  let next = member;
  const name = creature && creature.name;
  if (event === 'distance' && (member.behaviors.miles || 0) > 0 && !(member.memories || []).some((m) => m.id === 'first-walk')) {
    next = pushMemory(next, {
      id: 'first-walk',
      title: 'First Walk Together',
      detail: `${name} took its first steps with you — ${(payload.miles || 0).toFixed(2)} mi.`,
    });
  }
  if (event === 'workout' && !(member.memories || []).some((m) => m.id === 'first-workout')) {
    next = pushMemory(next, {
      id: 'first-workout',
      title: 'First Workout',
      detail: `${name} stayed for the whole session.`,
    });
  }
  if (event === 'hydration' && !(member.memories || []).some((m) => m.id === 'first-drink')) {
    next = pushMemory(next, {
      id: 'first-drink',
      title: 'First Drink Together',
      detail: `${name} watched you actually drink the water.`,
    });
  }
  if (event === 'evolve') {
    next = pushMemory(next, {
      id: `evolved-${payload.toId || payload.toName}`,
      title: `Became ${payload.toName}`,
      detail: `${payload.fromName} grew into ${payload.toName}.`,
    });
  }
  if (event === 'pin') {
    next = pushMemory(next, {
      id: `pin-${payload.routeId}`,
      title: `Cleared ${payload.pinName || payload.routeId}`,
      detail: `${name} stood with you at the Warden.`,
    });
  }
  const bond = next.bond || 0;
  const marks = (creature && creature.personality && creature.personality.milestones) || {};
  BOND_MARKS.forEach((n) => {
    if (prevBond < n && bond >= n) {
      next = pushMemory(next, {
        id: `bond-${n}`,
        title: `Bond ${n}`,
        detail: marks[String(n)] || `${name} reached Bond ${n} with you.`,
      });
    }
  });
  const todayMi = (payload.todayMiles != null ? payload.todayMiles : member.behaviors.miles) || 0;
  const longest = member.longestMi || 0;
  if (todayMi > longest + 0.05) {
    next = { ...next, longestMi: Math.round(todayMi * 100) / 100 };
    if (todayMi >= 1) {
      next = pushMemory(next, {
        id: `long-${Math.floor(todayMi)}`,
        title: 'Longest Adventure',
        detail: `${todayMi.toFixed(1)} miles in a day with ${name}.`,
      });
    }
  }
  return next;
}

const ONCE_PER_DAY = new Set([
  'cloud-burden', 'fossil-current', 'lotus-float', 'icebloom-rest',
  'grainwheel', 'echo-rhythm', 'ring-count', 'aurora-drift',
  'cinder-song', 'snowcap-rest', 'tide-glyph', 'estuary-drink',
]);

export function liveOnMember(member, event, payload, state) {
  if (!member) return member;
  const creature = getCreature(member.id);
  const prevBond = member.bond || 0;
  const ctx = encounterContext(state, {
    trailId: payload && payload.routeId,
    sessionMiles: payload && payload.miles,
    bond: prevBond,
    cardio: event === 'cardio' || event === 'distance',
  });
  let next = { ...member, behaviors: bumpBehavior(member, event, payload || {}, state) };
  let extra = resolvePassive(creature, event, payload, ctx);
  if (extra && creature && creature.passive && ONCE_PER_DAY.has(creature.passive.id)) {
    const flags = next.flags || {};
    const key = `${creature.passive.id}-${event}`;
    if (flags[key] === todayKey()) extra = null;
    else next = { ...next, flags: { ...flags, [key]: todayKey() } };
  }
  next = addEffect(next, extra);
  next = memoriesFor(next, creature, event, payload || {}, prevBond);
  return next;
}

export function applyHeartstone(state, bondGained) {
  if (!(bondGained > 0) || !state.party || state.party.length < 2) return state;
  let changed = false;
  const party = state.party.map((m, i) => {
    if (i === state.activeIndex) return m;
    const c = getCreature(m.id);
    if (c && c.passive && c.passive.id === 'heartstone') {
      changed = true;
      return { ...m, bond: (m.bond || 0) + Math.max(1, Math.floor(bondGained * 0.2)) };
    }
    return m;
  });
  return changed ? { ...state, party } : state;
}

export function moduleEvent(moduleId) {
  return MODULE_EVENT[moduleId] || null;
}

function hashPick(list, salt) {
  if (!list || !list.length) return null;
  const s = String(salt || '');
  let n = 0;
  for (let i = 0; i < s.length; i += 1) n = (n + s.charCodeAt(i) * (i + 1)) % 997;
  return list[n % list.length];
}

export function personalityLine(creature, kind, salt) {
  const p = creature && creature.personality;
  if (!p) return null;
  if (kind === 'encourage' && p.encourage && p.encourage.length) {
    return hashPick(p.encourage, salt || todayKey());
  }
  if (kind === 'idle' && p.idle && p.idle.length) {
    const act = hashPick(p.idle, salt || `${todayKey()}-idle`);
    return act ? `${creature.name} ${act}.` : null;
  }
  if (kind === 'like' && p.likes && p.likes.length) return p.likes[0];
  if (kind === 'dislike' && p.dislikes && p.dislikes.length) return p.dislikes[0];
  return null;
}

export function bondMilestoneText(creature, bond) {
  const marks = creature && creature.personality && creature.personality.milestones;
  if (!marks) return null;
  let found = null;
  BOND_MARKS.forEach((n) => {
    if (bond >= n && marks[String(n)]) found = marks[String(n)];
  });
  return found;
}

export function evolveChecklist(member, creature, level) {
  const need = creature && (creature.evolveNeed || {});
  if (!creature || !creature.evolvesTo) return null;
  const needLevel = need.level || creature.evolveLevel || 5;
  const needPoints = need.points || creature.evolvePoints || 0;
  const points = (member && member.evo) || 0;
  const items = [
    { key: 'level', label: 'Level', have: level, need: needLevel, ok: level >= needLevel },
    { key: 'points', label: 'Bond Points', have: points, need: needPoints, ok: points >= needPoints },
  ];
  if (need.behavior) {
    const have = (member && member.behaviors && member.behaviors[need.behavior.kind]) || 0;
    items.push({
      key: need.behavior.kind,
      label: BEHAVIOR_LABELS[need.behavior.kind] || need.behavior.kind,
      have,
      need: need.behavior.amount,
      ok: have >= need.behavior.amount,
      hint: need.behavior.hint,
    });
  }
  return items;
}

export function behaviorHave(member, kind) {
  if (!kind) return 0;
  const b = behaviorsOf(member);
  return b[kind] || 0;
}

export default {
  encounterContext,
  meetsEncounter,
  eligibleCompanions,
  pickWeighted,
  companionRate,
  encounterMeterScale,
  liveOnMember,
  applyHeartstone,
  moduleEvent,
  personalityLine,
  evolveChecklist,
  trailMilesForPassive,
  PASSIVE_IDS,
};
