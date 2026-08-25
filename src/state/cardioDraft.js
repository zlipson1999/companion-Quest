// The live cardio console is intentionally separate from completed history,
// but it still survives a reload. Restored live sessions always reopen paused:
// no wall time, sensor delta or GPS movement that happened while the UI was
// absent can become paid activity.

import { getCardioMachine, validManualValue } from '../data/cardioMachines';

const nonnegativeInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

const point = (raw) => {
  if (!raw || !Number.isFinite(Number(raw.x)) || !Number.isFinite(Number(raw.y))) return null;
  return {
    x: Math.floor(Number(raw.x)),
    y: Math.floor(Number(raw.y)),
    facing: ['up', 'down', 'left', 'right'].includes(raw.facing) ? raw.facing : 'up',
  };
};

const manualFor = (machineId, raw) => Object.fromEntries(
  Object.entries(raw || {}).filter(([key, value]) => (
    Number(value) > 0 && validManualValue(machineId, key, value)
  )),
);

function sessionFor(raw, summary = false) {
  const machine = raw && getCardioMachine(raw.machineId);
  if (!machine || typeof raw.startedAt !== 'string' || Number.isNaN(Date.parse(raw.startedAt))) return null;
  const session = {
    ...raw,
    machineId: machine.id,
    phase: summary ? 'summary' : 'paused',
    activeSeconds: nonnegativeInt(raw.activeSeconds),
    inactiveSeconds: nonnegativeInt(raw.inactiveSeconds),
    pausedSeconds: nonnegativeInt(raw.pausedSeconds),
    taps: nonnegativeInt(raw.taps),
    gpsStarted: false,
    clockAheadSeconds: 0,
    base: {
      ...(raw.base || {}),
      miles: Math.max(0, Number((raw.base || {}).miles) || 0),
      steps: nonnegativeInt((raw.base || {}).steps),
    },
    manual: manualFor(machine.id, raw.manual),
  };
  if (summary) {
    if (typeof raw.endedAt !== 'string' || Number.isNaN(Date.parse(raw.endedAt))) return null;
    session.endedAt = raw.endedAt;
    session.metrics = {
      miles: Math.max(0, Number((raw.metrics || {}).miles) || 0),
      steps: nonnegativeInt((raw.metrics || {}).steps),
    };
  }
  return session;
}

export function normalizeCardioDraft(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const done = sessionFor(raw.done, true);
  const cardio = done ? null : sessionFor(raw.cardio, false);
  if (!done && !cardio) return null;
  return {
    version: 1,
    cardio,
    done,
    from: point(raw.from),
    player: point(raw.player),
  };
}

export function cardioDraftPayload({ cardio, done, from, player }) {
  if (!cardio && !done) return null;
  return normalizeCardioDraft({ version: 1, cardio, done, from, player });
}

export default { normalizeCardioDraft, cardioDraftPayload };
