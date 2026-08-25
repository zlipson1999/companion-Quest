// What leaves the phone, and what does not.
//
// Signing in shares your TRAINING with the friends you have chosen. It does not
// share your companion, your goal, your bag, your recipes, or where you were
// standing — none of that is anyone else's business and none of it is on a
// board, so none of it is sent.
//
// What is sent is one row per day, straight out of `state.history`, plus your
// personal bests out of the Forge. Days, not lifetime totals: a total can only
// be believed or not, while a day can be checked against what a person can
// actually do (see server/validate.js). It also means a sync is idempotent —
// sending Tuesday twice leaves Tuesday as it was — so a flaky connection cannot
// inflate anybody.

import { isActive } from '../state/history';

// A day the server has no use for is a day not worth uploading. Sending empty
// rows would tell your friends which days you opened the app and did nothing,
// which is a thing they can already infer from your absence.
function worthSending(day) {
  return !!(day && (isActive(day) || day.rested));
}

// `source` is a claim about HOW the distance was measured, and it travels with
// the number so the board can say which rows were counted by a phone and which
// were typed. The app has no manual distance entry at all, so anything that
// reached `history` came from the pedometer or GPS — but the field exists
// because that is the sort of thing a future feature quietly changes.
export function sourceFor(day) {
  return (day && day.steps) > 0 ? 'pedometer' : 'reported';
}

// history -> the server's day shape.
export function daysToSync(history, { since } = {}) {
  const out = [];
  for (const date of Object.keys(history || {}).sort()) {
    if (since && date < since) continue;
    const day = history[date];
    if (!worthSending(day)) continue;
    out.push({
      date,
      steps: Math.round(day.steps || 0),
      distanceMi: Math.round((day.distanceMi || 0) * 1000) / 1000,
      cyclingMi: Math.round((day.cyclingMi || 0) * 1000) / 1000,
      rides: Math.round(day.rides || 0),
      // A premade routine and a Forge session are both a session; the board
      // ranks "sessions this week" and does not care which kind.
      workouts: Math.round((day.workouts || 0) + (day.sessions || 0)),
      sets: Math.round(day.sets || 0),
      reps: Math.round(day.reps || 0),
      holdSec: Math.round(day.holdSec || 0),
      active: isActive(day),
      source: sourceFor(day),
    });
  }
  return out;
}

// The Forge already keeps the best single set per movement — `records` in its
// module state, written by recordSession. That IS the personal-best board; this
// only reshapes it.
//
// `kind` tells the board how to read `amount`: reps under load, reps of a
// bodyweight movement, or seconds of a hold. Without it a 60 would be printed
// as "60 reps" for a plank.
export function recordsToSync(forgeState, kindOf) {
  const records = (forgeState && forgeState.records) || {};
  return Object.keys(records).map((movementId) => {
    const r = records[movementId];
    return {
      movementId,
      kind: kindOf ? kindOf(movementId, r) : (r.weight ? 'load' : 'reps'),
      amount: r.amount,
      weight: r.weight,
      sets: r.sets || 1,
      achievedOn: r.date,
    };
  }).filter((r) => r.achievedOn && r.amount > 0);
}

// Everything the phone would upload, in one place, so a screen can show it
// before anyone agrees to send it.
export function syncPayload(state, { since, kindOf } = {}) {
  const forge = ((state.modules || {}).forge) || {};
  return {
    days: daysToSync(state.history, { since }),
    records: recordsToSync(forge, kindOf),
  };
}

export default { daysToSync, recordsToSync, syncPayload, sourceFor };
