// The cardio session lifecycle, as pure functions.
//
// One pipeline for all five machines: walk on -> start -> track -> pause /
// resume -> finish or discard -> summary -> saved exactly once. The screen
// owns the pixels; everything that decides what a session IS lives here, so
// a treadmill and a stair climber cannot drift into two different ideas of
// what "five active minutes" means.
//
// The clock separates ACTIVE from PAUSED deliberately. Credits are paid on
// active seconds alone (economy.cardioCredits), so a paused console is worth
// exactly nothing — the same reason there are no walk buttons.

import { MACHINE_BY_ID } from '../data/cardioMachines';
import { finishCardioSession } from './cardioHistory';
import { kcalFor, kcalForBike, kcalForActiveTime } from './cardioMaths';

export const PHASES = ['ready', 'running', 'paused', 'summary'];

// A machine whose primary metric is the clock still needs a movement signal
// for the character: the rower gets it from stroke taps rather than a sensor
// the phone does not have.
export function tracksWithSensor(machineId) {
  const m = MACHINE_BY_ID[machineId];
  return !!m && m.tracking === 'steps';
}

export function tracksWithGps(machineId) {
  const m = MACHINE_BY_ID[machineId];
  return !!m && m.tracking === 'gps';
}

export function newSession(machineId, base, startedAt) {
  const machine = MACHINE_BY_ID[machineId];
  if (!machine) return null;
  return {
    machineId,
    phase: tracksWithGps(machineId) ? 'ready' : 'running',
    startedAt: startedAt || new Date().toISOString(),
    activeSeconds: 0,
    pausedSeconds: 0,
    // Sensor baselines, so walking to the machine is never the first metre
    // of the workout. The caller may park extra baselines here (the gym
    // passes its exercise tallies so a challenge mid-session reads right);
    // only miles and steps are load-bearing.
    base: { miles: 0, steps: 0, ...(base || {}) },
    manual: {},
    taps: 0,
    gpsStarted: false,
  };
}

// One second of wall clock. Which counter it lands in is the whole point:
// a 'ready' bike (GPS not started yet) and a paused machine bank paused
// seconds, and paused seconds never become credits.
export function tickSession(session) {
  if (!session) return session;
  if (session.phase === 'running') {
    return { ...session, activeSeconds: session.activeSeconds + 1 };
  }
  if (session.phase === 'paused' || session.phase === 'ready') {
    return { ...session, pausedSeconds: session.pausedSeconds + 1 };
  }
  return session;
}

export function pauseSession(session) {
  if (!session || session.phase !== 'running') return session;
  return { ...session, phase: 'paused' };
}

export function resumeSession(session) {
  if (!session || session.phase !== 'paused') return session;
  return { ...session, phase: 'running' };
}

// Backgrounding the app is a pause, not a workout. The phone can keep
// counting steps with the screen off, but it cannot tell whether you are
// still on the machine, so the honest move is to stop banking active time
// until somebody says otherwise.
export function backgroundSession(session) {
  return pauseSession(session);
}

export function tapSession(session) {
  if (!session || session.phase !== 'running') return session;
  return { ...session, taps: session.taps + 1 };
}

export function setManual(session, key, value) {
  if (!session) return session;
  const next = { ...session.manual };
  if (value == null || Number(value) <= 0) delete next[key];
  else next[key] = Number(value);
  return { ...session, manual: next };
}

// What the session measured, from the live stats it started against.
export function sessionMetrics(session, stats) {
  if (!session) return { miles: 0, steps: 0 };
  return {
    miles: Math.max(0, (stats.distanceMi || 0) - (session.base.miles || 0)),
    steps: Math.max(0, (stats.totalSteps || 0) - (session.base.steps || 0)),
  };
}

export function sessionKcal(session, metrics, bodyWeightLb) {
  if (!session) return 0;
  const machine = MACHINE_BY_ID[session.machineId];
  if (!machine) return 0;
  if (machine.tracking === 'gps') return kcalForBike(metrics.miles, session.activeSeconds, bodyWeightLb);
  if (machine.id === 'treadmill') return kcalFor(metrics.miles, session.activeSeconds, bodyWeightLb);
  // Rower, stair climber and elliptical: active time against the machine's
  // MET band, because their distance is either absent or manually entered.
  return kcalForActiveTime(machine.met, session.activeSeconds, bodyWeightLb);
}

// The completed record, ready for COMPLETE_CARDIO. Returns null for a
// session too short to qualify — a discarded session and a thirty-second
// session are the same thing here: nothing saved, nothing paid.
export function completeSession(session, { stats, bodyWeightLb, endedAt } = {}) {
  if (!session) return null;
  const machine = MACHINE_BY_ID[session.machineId];
  if (!machine) return null;
  const metrics = sessionMetrics(session, stats || {});
  const manual = { ...session.manual };
  // A tap-per-stroke machine folds its taps into the metric it counts, and
  // says so: taps are the player's own count, which is manual entry with a
  // friendlier button.
  if (machine.tapMetric && session.taps > 0) {
    manual[machine.tapMetric] = (manual[machine.tapMetric] || 0) + session.taps;
  }
  return finishCardioSession({
    station: session.machineId,
    startedAt: session.startedAt,
    endedAt: endedAt || new Date().toISOString(),
    activeSeconds: session.activeSeconds,
    pausedSeconds: session.pausedSeconds,
    miles: machine.tracking === 'timer' ? 0 : metrics.miles,
    steps: machine.tracking === 'steps' ? metrics.steps : 0,
    strides: machine.id === 'elliptical' ? metrics.steps : 0,
    kcal: sessionKcal(session, metrics, bodyWeightLb),
    manual,
    usedSensor: machine.tracking === 'steps' && metrics.steps > 0,
    usedGps: machine.tracking === 'gps' && metrics.miles > 0,
  });
}

export default {
  PHASES, newSession, tickSession, pauseSession, resumeSession, backgroundSession,
  tapSession, setManual, sessionMetrics, sessionKcal, completeSession,
  tracksWithSensor, tracksWithGps,
};
