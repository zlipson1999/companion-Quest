// The five cardio machines of Quest Fitness, as ONE configuration.
//
// Every screen, reducer, list, board, tour line and test that needs to know
// what a cardio machine is reads it from here. Five separate implementations
// is how the treadmill and the bike drifted apart once already; a machine is
// a row in this table, and adding a sixth means adding a row, not a screen.
//
// Tracking methods are honest about what a phone can actually measure:
//   steps  — the pedometer/accelerometer drives distance and animation
//            (treadmill, stair climber, elliptical: real footfalls register).
//   gps    — real outdoor location deltas drive the ride (Bike Ride only;
//            the in-game bike never leaves the building).
//   timer  — logged strokes are the rower's movement signal (a phone cannot
//            reliably feel a stroke or measure metres on a rail), so the paid
//            clock stops automatically when stroke logging goes quiet. The
//            machine's metres and final stroke total are entered afterwards.
// Nothing here fabricates a metric the device cannot measure: everything a
// machine cannot sense is optional manual entry from the physical machine's
// own display, entered AFTER the session, and tagged manual in the record.

export const CARDIO_MACHINES = [
  {
    id: 'treadmill',
    name: 'Treadmill',
    code: 't',
    tracking: 'steps',
    met: 8,
    pose: { facing: 'up', ms: 220 },
    manual: [],
    tapMetric: null,
    statLine: 'Time, steps, distance, pace and a kcal estimate — from real movement only.',
    safety: 'Stay on the deck while it moves. Step off with the button, the way you would use the bar on a real one.',
    tour: 'The treadmill tracks real walking or running: your phone counts the steps, only real movement moves the number.',
  },
  {
    id: 'bike',
    name: 'Bike Ride',
    code: 'c',
    tracking: 'gps',
    met: 7,
    pose: { facing: 'left', ms: 180 },
    manual: [
      { key: 'cadence', label: 'Cadence (RPM)', step: 5, max: 200 },
    ],
    tapMetric: null,
    statLine: 'Time, GPS distance, average speed and a kcal estimate; cadence from your bike computer.',
    safety: 'Start and end only while the real bicycle is stationary. Secure the phone before you move.',
    tour: 'The bikes connect a real bicycle to this in-game bike: GPS measures the real ride while your person pedals here.',
  },
  {
    id: 'rower',
    name: 'Rower',
    code: 'q',
    tracking: 'timer',
    met: 7,
    pose: { facing: 'left', ms: 420 },
    manual: [
      { key: 'machineMeters', label: 'Distance (m)', step: 100, max: 42000 },
      { key: 'strokes', label: 'Strokes', step: 10, max: 3000 },
    ],
    tapMetric: 'strokes',
    statLine: 'Detected active time and calories, plus the metres and split the physical rower showed, entered after.',
    safety: 'Tap the mounted phone as you pull so active time is detected. Enter the machine totals only after you finish.',
    tour: 'The rower pays only while logged strokes show active rowing; enter the physical machine distance and final stroke total after you finish.',
  },
  {
    id: 'stairclimber',
    name: 'Stair Climber',
    code: 'x',
    tracking: 'steps',
    met: 9,
    pose: { facing: 'up', ms: 260 },
    manual: [
      { key: 'floors', label: 'Floors climbed', step: 1, max: 400 },
      { key: 'level', label: 'Level / resistance', step: 1, max: 25 },
    ],
    tapMetric: null,
    statLine: 'Time, real steps and steps per minute, plus floors and level from the machine display.',
    safety: 'Hands on the rails, phone in a pocket. Pause or finish before entering totals — never type while climbing.',
    tour: 'The stair climber tracks time and your real steps, plus optional floors and level from its display, entered after.',
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    code: 'm',
    tracking: 'steps',
    met: 6,
    pose: { facing: 'up', ms: 300 },
    manual: [
      { key: 'machineMiles', label: 'Distance (mi)', step: 0.1, max: 20 },
      { key: 'level', label: 'Resistance', step: 1, max: 25 },
    ],
    tapMetric: null,
    statLine: 'Time, distance and calories, plus the resistance level from the machine display.',
    safety: 'Ride the full stride, arms and legs together. Enter the display totals after you finish.',
    tour: 'The elliptical tracks time and calories from real movement, plus the distance and resistance level from its display, entered after.',
  },
];

export const CARDIO_MACHINE_IDS = CARDIO_MACHINES.map((m) => m.id);
export const MACHINE_BY_ID = Object.fromEntries(CARDIO_MACHINES.map((m) => [m.id, m]));

export function getCardioMachine(id) {
  return MACHINE_BY_ID[id] || null;
}

// One label helper for every surface. 'Bike Ride' is the activity's only name.
export function cardioMachineName(id) {
  const m = MACHINE_BY_ID[id];
  return m ? m.name : 'Cardio';
}

// Validate one manual metric against the machine's declared bounds. Manual
// entry arrives from steppers, but the record must hold even against a bad
// caller: negatives, NaN and impossible totals are rejected, not clamped
// into fiction.
export function validManualValue(machineId, key, value) {
  const m = MACHINE_BY_ID[machineId];
  const field = m && m.manual.find((f) => f.key === key);
  if (!field) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= field.max;
}

export default {
  CARDIO_MACHINES, CARDIO_MACHINE_IDS, MACHINE_BY_ID,
  getCardioMachine, cardioMachineName, validManualValue,
};
