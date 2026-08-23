// The four trails. Each is a different place: its own terrain, its own
// companions, its own Warden, and a Quest Pin for the first time you clear it.
//
// Gym cardio MUST NOT pass a routeId into ADD_DISTANCE — indoor miles are
// real, but they are not trail miles, and a treadmill must never fill a
// quota you are supposed to walk.
//
// Original terms only: trail, Warden, Quest Pin. This file may import
// creatures.js; creatures.js must never import this file.

import { familyChain, getCreature, STARTER_IDS } from './creatures';

export const ROUTES = [
  {
    id: 'maple',
    name: 'Maple Trail',
    miles: 1.5,
    reps: 30,
    companions: [...STARTER_IDS],
    warden: 'sludgewad',
    wardenHp: 55,
    wardenXp: 45,
    wardenBond: 10,
    pinId: 'maple',
    pinName: 'Maple Pin',
    stageTone: 'maple',
    horizon: 0.18,
    mapId: 'route_maple',
    // Green lane, trees, grass.
    laneFrac: 0.3,
    laneMin: 3,
    edge: 'trees',
    tallgrassChance: 14,
    flowerChance: 22,
    scatterTrees: 0,
  },
  {
    id: 'cairn',
    name: 'Cairn Cut',
    miles: 3,
    reps: 60,
    companions: ['pebblepup'],
    warden: 'snoozeghoul',
    wardenHp: 72,
    wardenXp: 60,
    wardenBond: 12,
    pinId: 'stone',
    pinName: 'Stone Pin',
    stageTone: 'cairn',
    horizon: 0.2,
    mapId: 'route_cairn',
    // Packed earth, stone, cairns — no tree line. Trees here made this the
    // same woodland strip as Maple with the floor swapped.
    laneFrac: 0.22,
    laneMin: 2,
    edge: 'stone',
    tallgrassChance: 0,
    flowerChance: 0,
    scatterTrees: 0,
    scatterStone: 16,
  },
  {
    id: 'gale',
    name: 'Gale Reach',
    miles: 5,
    reps: 100,
    companions: ['wispurr'],
    warden: 'achefang',
    wardenHp: 90,
    wardenXp: 80,
    wardenBond: 14,
    pinId: 'gale',
    pinName: 'Gale Pin',
    stageTone: 'gale',
    horizon: 0.42,
    mapId: 'route_gale',
    // Open country, sky, a thin track.
    laneFrac: 0.1,
    laneMin: 1,
    edge: 'open',
    tallgrassChance: 4,
    flowerChance: 18,
    scatterTrees: 3,
  },
  {
    id: 'canopy',
    name: 'Canopy Run',
    miles: 8,
    reps: 160,
    companions: ['sporelet'],
    warden: 'couchlurk',
    wardenHp: 115,
    wardenXp: 100,
    wardenBond: 18,
    pinId: 'canopy',
    pinName: 'Canopy Pin',
    stageTone: 'canopy',
    horizon: 0.14,
    mapId: 'route_canopy',
    // Dense shade, undergrowth.
    laneFrac: 0.18,
    laneMin: 2,
    edge: 'canopy',
    tallgrassChance: 28,
    flowerChance: 0,
    scatterTrees: 20,
  },
];

export const ROUTE_ORDER = ROUTES.map((r) => r.id);

const BY_ID = Object.fromEntries(ROUTES.map((r) => [r.id, r]));

export function getRoute(id) {
  return BY_ID[id] || ROUTES[0];
}

function blankProgress() {
  return { miles: 0, reps: 0, pin: false };
}

export function emptyTrails() {
  const progress = {};
  ROUTES.forEach((r) => { progress[r.id] = blankProgress(); });
  return { activeId: 'maple', progress };
}

export function normalizeTrails(raw) {
  const base = emptyTrails();
  if (!raw || typeof raw !== 'object') return base;
  const progress = { ...base.progress };
  ROUTES.forEach((r) => {
    const p = raw.progress && raw.progress[r.id];
    progress[r.id] = {
      miles: Math.max(0, Number(p && p.miles) || 0),
      reps: Math.max(0, Math.floor(Number(p && p.reps) || 0)),
      pin: !!(p && p.pin),
    };
  });
  const activeId = BY_ID[raw.activeId] ? raw.activeId : 'maple';
  return { activeId, progress };
}

export function isTrailUnlocked(routeId, trails) {
  const i = ROUTE_ORDER.indexOf(routeId);
  if (i <= 0) return true;
  const prev = ROUTE_ORDER[i - 1];
  const t = normalizeTrails(trails);
  return !!(t.progress[prev] && t.progress[prev].pin);
}

export function trailOf(trails) {
  const t = normalizeTrails(trails);
  const route = getRoute(t.activeId);
  return { route, progress: t.progress[route.id], trails: t };
}

export function trailReady(route, progress) {
  if (!route || !progress || progress.pin) return false;
  return progress.miles >= route.miles && progress.reps >= route.reps;
}

export function addTrailMiles(trails, routeId, mi) {
  const t = normalizeTrails(trails);
  if (!BY_ID[routeId] || !(mi > 0)) return t;
  const p = t.progress[routeId];
  return {
    ...t,
    progress: { ...t.progress, [routeId]: { ...p, miles: p.miles + mi } },
  };
}

export function addTrailReps(trails, routeId, n) {
  const t = normalizeTrails(trails);
  const add = Math.max(0, Math.floor(n || 0));
  if (!BY_ID[routeId] || !add) return t;
  const p = t.progress[routeId];
  return {
    ...t,
    progress: { ...t.progress, [routeId]: { ...p, reps: p.reps + add } },
  };
}

// First win only. Caller grants the Kinship Knot when `first` is true.
export function awardPin(trails, routeId) {
  const t = normalizeTrails(trails);
  const p = t.progress[routeId];
  if (!p || p.pin) return { trails: t, first: false };
  return {
    trails: {
      ...t,
      progress: { ...t.progress, [routeId]: { ...p, pin: true } },
    },
    first: true,
  };
}

export function setActiveTrail(trails, routeId) {
  const t = normalizeTrails(trails);
  if (!BY_ID[routeId] || !isTrailUnlocked(routeId, t)) return t;
  return { ...t, activeId: routeId };
}

export function earnedPins(trails) {
  const t = normalizeTrails(trails);
  return ROUTES.filter((r) => t.progress[r.id].pin);
}

// Which trail a creature belongs to — Index uses this to silhouette anyone
// whose trail is still locked. Built here so creatures.js never imports us.
const CREATURE_TRAIL = {};
ROUTES.forEach((route) => {
  route.companions.forEach((root) => {
    familyChain(root).forEach((id) => { CREATURE_TRAIL[id] = route.id; });
  });
  CREATURE_TRAIL[route.warden] = route.id;
});

export function creatureTrailId(creatureId) {
  return CREATURE_TRAIL[creatureId] || null;
}

export function isCreatureLocked(creatureId, trails) {
  const routeId = CREATURE_TRAIL[creatureId];
  if (!routeId) return false;
  return !isTrailUnlocked(routeId, trails);
}

export function nextRoute(routeId) {
  const i = ROUTE_ORDER.indexOf(routeId);
  if (i < 0 || i >= ROUTE_ORDER.length - 1) return null;
  return getRoute(ROUTE_ORDER[i + 1]);
}

export function wardenBattle(route) {
  const next = nextRoute(route.id);
  return {
    creatureId: route.warden,
    isCompanion: false,
    hp: route.wardenHp,
    xp: route.wardenXp,
    bond: route.wardenBond,
    catchRate: 0,
    from: 'route',
    routeId: route.id,
    warden: true,
    stageTone: route.stageTone,
    horizon: route.horizon,
    pinName: route.pinName,
    nextTrail: next ? next.name : null,
  };
}

// A deterministic strip per trail, so each one is a different place rather
// than one shared grass field with the sign swapped.
export function trailRow(routeId, r, cols) {
  const route = getRoute(routeId);
  const laneW = Math.max(route.laneMin, Math.round(cols * route.laneFrac));
  const lane0 = Math.floor((cols - laneW) / 2);
  const h = (r * 2654435761) >>> 0;
  let row = '';
  for (let x = 0; x < cols; x += 1) {
    const n = ((h ^ (x * 2246822519)) >>> 0) % 100;
    if (x >= lane0 && x < lane0 + laneW) {
      row += '#';
      continue;
    }
    if (route.edge === 'trees') {
      if (x < 1 || x > cols - 2) { row += 'T'; continue; }
      if (x < 2 || x > cols - 3) { row += n < 62 ? 'T' : '^'; continue; }
    } else if (route.edge === 'stone') {
      if (x < 1 || x > cols - 2) { row += n < 55 ? '*' : '.'; continue; }
    } else if (route.edge === 'open') {
      if (x < 1 || x > cols - 2) { row += n < 6 ? ',' : '.'; continue; }
    } else if (route.edge === 'canopy') {
      if (x < 2 || x > cols - 3) { row += n < 80 ? 'T' : '^'; continue; }
    }
    if (route.tallgrassChance && n < route.tallgrassChance) row += '^';
    else if (route.flowerChance && n < route.flowerChance) row += ',';
    else if (route.scatterStone && n < route.scatterStone) row += '*';
    else if (route.scatterTrees && n < route.scatterTrees) row += 'T';
    else row += '.';
  }
  return row;
}

ROUTES.forEach((route) => {
  if (!getCreature(route.warden)) {
    throw new Error(`routes: Warden ${route.warden} is not a creature`);
  }
  route.companions.forEach((id) => {
    if (!getCreature(id)) throw new Error(`routes: companion ${id} is not a creature`);
  });
});

export default ROUTES;
