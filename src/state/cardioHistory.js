// A small, bounded log of completed cardio-machine sessions — the unified
// record every machine writes through finishCardioSession().
//
// Daily history keeps rollups for recovery and weekly comparisons. This list
// keeps the human detail those totals cannot answer: which machine, how long
// it was really active, what the sensors measured, what was typed in from
// the physical machine's display (tagged manual — never mixed silently into
// sensor data), and what the session paid. v12 introduced the list; v13
// upgraded the record. Old rows are carried forward, not re-invented: a
// legacy row gains safe defaults (creditsAwarded 0 — nothing is paid
// retroactively) and keeps its measurements exactly as saved.

import { CARDIO_MACHINE_IDS, MACHINE_BY_ID, validManualValue } from '../data/cardioMachines';
import { cardioCredits } from './economy';

export const KEEP_CARDIO_SESSIONS = 120;
export const CARDIO_STATIONS = CARDIO_MACHINE_IDS;

const round3 = (n) => Math.round(n * 1000) / 1000;

const num = (v, max = Infinity) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : 0;
};

export function cardioSession(raw) {
  if (!raw || !CARDIO_STATIONS.includes(raw.station)) return null;
  const endedAt = typeof raw.endedAt === 'string' && raw.endedAt ? raw.endedAt : null;
  if (!endedAt || Number.isNaN(Date.parse(endedAt))) return null;
  const seconds = Math.max(0, Math.floor(num(raw.seconds)));
  const activeSeconds = Math.max(0, Math.floor(num(raw.activeSeconds))) || seconds;
  // Anything under five active seconds is console noise, not a workout.
  if (activeSeconds < 5) return null;
  const miles = round3(num(raw.miles, 500));
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `${endedAt}:${raw.station}`,
    station: raw.station,
    startedAt: typeof raw.startedAt === 'string' && !Number.isNaN(Date.parse(raw.startedAt)) ? raw.startedAt : null,
    endedAt,
    // `seconds` stays the legacy display field; activeSeconds is canonical.
    seconds: activeSeconds,
    activeSeconds,
    pausedSeconds: Math.max(0, Math.floor(num(raw.pausedSeconds))),
    miles,
    steps: Math.floor(num(raw.steps, 200000)),
    strokes: Math.floor(num(raw.strokes, 3000)),
    floors: Math.floor(num(raw.floors, 400)),
    strides: Math.floor(num(raw.strides, 200000)),
    level: Math.floor(num(raw.level, 25)),
    cadence: Math.floor(num(raw.cadence, 200)),
    machineMiles: round3(num(raw.machineMiles, 20)),
    // A rower speaks metres, not miles; kept in its own units rather than
    // converted, so the split it reports is the split the machine showed.
    machineMeters: Math.floor(num(raw.machineMeters, 42000)),
    kcal: Math.floor(num(raw.kcal, 5000)),
    creditsAwarded: Math.max(0, Math.floor(num(raw.creditsAwarded, 15))),
    source: ['sensor', 'gps', 'manual', 'timer', 'mixed', 'legacy'].includes(raw.source) ? raw.source : 'legacy',
    completion: 'completed',
  };
}

// Build the completed record for a live session. This is the ONE place a
// machine's numbers become a saved row: it decides the credit award (through
// the shared duration formula — identical for every machine), stamps the
// metric source, and drops manual values that fail the machine's declared
// bounds rather than storing fiction. The reducer then saves it exactly
// once, refusing an id it has already recorded.
export function finishCardioSession({
  station, startedAt, endedAt, activeSeconds, pausedSeconds = 0,
  miles = 0, steps = 0, strides = 0, kcal = 0, manual = {}, usedSensor = false, usedGps = false,
}) {
  const machine = MACHINE_BY_ID[station];
  if (!machine) return null;
  const manualClean = {};
  let usedManual = false;
  Object.entries(manual || {}).forEach(([key, value]) => {
    if (Number(value) > 0 && validManualValue(station, key, value)) {
      manualClean[key] = Number(value);
      usedManual = true;
    }
  });
  const auto = usedGps ? 'gps' : usedSensor ? 'sensor' : 'timer';
  const source = usedManual ? 'mixed' : auto;
  return cardioSession({
    id: `${startedAt || endedAt}:${station}`,
    station,
    startedAt,
    endedAt,
    activeSeconds,
    pausedSeconds,
    miles,
    steps,
    strides,
    kcal,
    strokes: manualClean.strokes || 0,
    floors: manualClean.floors || 0,
    level: manualClean.level || 0,
    cadence: manualClean.cadence || 0,
    machineMiles: manualClean.machineMiles || 0,
    machineMeters: manualClean.machineMeters || 0,
    creditsAwarded: cardioCredits(activeSeconds),
    source,
  });
}

export function appendCardioSession(sessions, raw, keep = KEEP_CARDIO_SESSIONS) {
  const session = cardioSession(raw);
  const list = Array.isArray(sessions) ? sessions : [];
  if (!session) return list;
  // Saving is idempotent by id: a duplicate finish event, a re-submitted
  // summary, or a replayed dispatch changes nothing.
  if (list.some((s) => s && s.id === session.id)) return list;
  return [...list, session].slice(-keep);
}

export function normalizeCardioSessions(sessions) {
  const seen = new Set();
  return (Array.isArray(sessions) ? sessions : [])
    .map(cardioSession)
    .filter((s) => {
      if (!s || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    })
    .slice(-KEEP_CARDIO_SESSIONS);
}

export function cardioStationLabel(station) {
  const m = MACHINE_BY_ID[station];
  return m ? m.name : 'Treadmill';
}

// Rollups from the bounded log (recent detail); the unbounded lifetime
// counters live in stats and are advanced by the reducer.
export function cardioTotals(sessions) {
  const t = {
    sessions: 0,
    activeSeconds: 0,
    credits: 0,
    byMachine: Object.fromEntries(CARDIO_STATIONS.map((id) => [id, {
      sessions: 0, activeSeconds: 0, miles: 0, steps: 0, strokes: 0, floors: 0, strides: 0,
      machineMiles: 0, machineMeters: 0,
    }])),
  };
  normalizeCardioSessions(sessions).forEach((s) => {
    t.sessions += 1;
    t.activeSeconds += s.activeSeconds;
    t.credits += s.creditsAwarded;
    const m = t.byMachine[s.station];
    m.sessions += 1;
    m.activeSeconds += s.activeSeconds;
    m.miles += s.miles;
    m.steps += s.steps;
    m.strokes += s.strokes;
    m.floors += s.floors;
    m.strides += s.strides;
    m.machineMiles += s.machineMiles;
    m.machineMeters += s.machineMeters;
  });
  return t;
}

export default {
  KEEP_CARDIO_SESSIONS,
  CARDIO_STATIONS,
  cardioSession,
  finishCardioSession,
  appendCardioSession,
  normalizeCardioSessions,
  cardioStationLabel,
  cardioTotals,
};
