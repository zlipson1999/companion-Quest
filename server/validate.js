// What the server is willing to believe.
//
// Companion Quest's founding rule is that real life is the game: there are no
// walk buttons, and distance comes only from a pedometer or GPS. That rule
// survived this long because nothing rewarded breaking it — `stats.distanceMi`
// sits in AsyncStorage and has always been trivially editable, and the only
// person you could fool was yourself.
//
// A leaderboard is the first thing in this game that gives anyone a REASON to
// edit it. So the server has to have an opinion about what it is sent, or the
// board quietly turns the app's central promise into a claim it cannot back.
//
// It cannot prove a number is real. What it can do is refuse the ones that are
// not possible, and be honest on the board about which is which:
//
//   * A day is capped at what a person can actually do. The world record for
//     24h running is a little over 200 miles; ~120 km (75 mi) is beyond what
//     any player of a wellness game is doing on a Tuesday, so anything past it
//     is stored FLAGGED and left off the boards rather than silently accepted.
//   * Steps and distance have to agree with each other. 40,000 steps and half a
//     mile is not a walk, it is two numbers that were not produced by the same
//     legs.
//   * Days cannot be invented in the future, or edited long after the fact.
//   * `source` travels with the number. A day measured by the OS step counter
//     and a day someone typed in are both allowed, and the board says which is
//     which instead of averaging them into one indistinguishable column.
//
// None of this is cryptographic proof and it is not meant to be. It is the
// difference between a board that can be topped by editing a JSON file and one
// that has to be topped by walking.

// A very fast marathoner covers ~26 miles in a bit over two hours; 24h ultra
// records sit around 200. 75 is far above any real player and far below the
// numbers you get from a fabricated total.
const MAX_MILES_PER_DAY = 75;
const MAX_CYCLING_MILES_PER_DAY = 300;
const MAX_TOTAL_MILES_PER_DAY = MAX_MILES_PER_DAY + MAX_CYCLING_MILES_PER_DAY;
const MAX_STEPS_PER_DAY = 150000;
const MAX_RIDES_PER_DAY = 12;

// Stride bounds, in miles per step. A short stride is ~1.5 ft, a running stride
// ~5 ft. Outside this the two numbers did not come from the same activity.
const MIN_MI_PER_STEP = 1.2 / 5280;
const MAX_MI_PER_STEP = 6.0 / 5280;

// A day can be corrected for a while — a phone syncs late, a watch backfills —
// but not rewritten months later when a board is close.
const MAX_BACKFILL_DAYS = 14;
// One day's grace for time zones: a player ahead of the server is not cheating.
const MAX_FUTURE_DAYS = 1;

const MAX_WORKOUTS_PER_DAY = 40;
const MAX_SETS_PER_DAY = 200;
const MAX_REPS_PER_DAY = 5000;
const MAX_HOLD_SEC_PER_DAY = 4 * 60 * 60;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a, b) {
  return Math.round((Date.parse(a) - Date.parse(b)) / DAY_MS);
}

function isDateKey(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

const num = (v, max) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
};

// Returns the row to store plus `flagged`: null when believed, otherwise the
// reason. A flagged day is KEPT — the player's own history stays whole — but
// every board filters it out.
function checkDay(raw, today) {
  if (!raw || !isDateKey(raw.date)) return { error: 'bad date' };

  const ahead = daysBetween(raw.date, today);
  if (ahead > MAX_FUTURE_DAYS) return { error: 'date is in the future' };
  if (ahead < -MAX_BACKFILL_DAYS) return { error: 'date is too old to change' };

  const source = ['health', 'pedometer', 'reported'].includes(raw.source) ? raw.source : 'reported';
  const day = {
    date: raw.date,
    steps: Math.round(num(raw.steps, MAX_STEPS_PER_DAY * 10)),
    distance_mi: Math.round(num(raw.distanceMi, MAX_TOTAL_MILES_PER_DAY * 10) * 1000) / 1000,
    cycling_mi: Math.round(num(raw.cyclingMi, MAX_CYCLING_MILES_PER_DAY * 10) * 1000) / 1000,
    rides: Math.round(num(raw.rides, MAX_RIDES_PER_DAY * 10)),
    workouts: Math.round(num(raw.workouts, MAX_WORKOUTS_PER_DAY * 10)),
    sets: Math.round(num(raw.sets, MAX_SETS_PER_DAY * 10)),
    reps: Math.round(num(raw.reps, MAX_REPS_PER_DAY * 10)),
    hold_sec: Math.round(num(raw.holdSec, MAX_HOLD_SEC_PER_DAY * 10)),
    active: raw.active ? 1 : 0,
    source,
  };

  let flagged = null;
  const footMi = Math.max(0, day.distance_mi - day.cycling_mi);
  if (day.distance_mi > MAX_TOTAL_MILES_PER_DAY) flagged = 'distance beyond a human day';
  else if (day.cycling_mi > day.distance_mi) flagged = 'cycling exceeds total distance';
  else if (day.cycling_mi > MAX_CYCLING_MILES_PER_DAY) flagged = 'cycling beyond a human day';
  else if (footMi > MAX_MILES_PER_DAY) flagged = 'foot distance beyond a human day';
  else if (day.rides > MAX_RIDES_PER_DAY) flagged = 'more rides than a day holds';
  else if (day.steps > MAX_STEPS_PER_DAY) flagged = 'step count beyond a human day';
  else if (day.workouts > MAX_WORKOUTS_PER_DAY) flagged = 'more sessions than a day holds';
  else if (day.sets > MAX_SETS_PER_DAY || day.reps > MAX_REPS_PER_DAY) flagged = 'more work than a day holds';
  else if (day.hold_sec > MAX_HOLD_SEC_PER_DAY) flagged = 'more time held than a day holds';
  else if (day.steps > 500 && footMi > 0.1) {
    // Bicycle GPS miles have no steps. Compare the pedometer only with the
    // non-cycling portion or a legitimate mixed walk/ride day looks fake.
    const perStep = footMi / day.steps;
    if (perStep < MIN_MI_PER_STEP) flagged = 'too many steps for that distance';
    else if (perStep > MAX_MI_PER_STEP) flagged = 'too much distance for those steps';
  }

  return { day, flagged };
}

// A record has to be a plausible single set, not a total.
const MAX_WEIGHT_LB = 1200;   // above every drug-tested world record
const MAX_SET_REPS = 500;
const MAX_HOLD_SET_SEC = 2 * 60 * 60;

function checkRecord(raw, today) {
  if (!raw || typeof raw.movementId !== 'string' || !raw.movementId) return { error: 'bad movement' };
  if (!['load', 'reps', 'hold'].includes(raw.kind)) return { error: 'bad kind' };
  if (!isDateKey(raw.achievedOn)) return { error: 'bad date' };
  if (daysBetween(raw.achievedOn, today) > MAX_FUTURE_DAYS) return { error: 'date is in the future' };

  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'bad amount' };
  const weight = raw.weight == null ? null : Number(raw.weight);
  if (weight != null && (!Number.isFinite(weight) || weight < 0)) return { error: 'bad weight' };

  const cap = raw.kind === 'hold' ? MAX_HOLD_SET_SEC : MAX_SET_REPS;
  let flagged = null;
  if (amount > cap) flagged = 'beyond a single set';
  else if (weight != null && weight > MAX_WEIGHT_LB) flagged = 'beyond a human lift';

  return {
    record: {
      movement_id: raw.movementId.slice(0, 64),
      kind: raw.kind,
      amount,
      weight: weight == null ? null : weight,
      sets: Math.max(1, Math.min(50, Math.round(Number(raw.sets) || 1))),
      achieved_on: raw.achievedOn,
    },
    flagged,
  };
}

module.exports = {
  checkDay,
  checkRecord,
  isDateKey,
  MAX_MILES_PER_DAY,
  MAX_CYCLING_MILES_PER_DAY,
  MAX_STEPS_PER_DAY,
  MAX_BACKFILL_DAYS,
};
