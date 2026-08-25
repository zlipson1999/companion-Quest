// The numbers a treadmill console shows, and where each one comes from.
//
// Two of them are MEASURED: distance and steps arrive from the pedometer, and
// time is a clock. Laps are arithmetic on distance. Calories are the only
// estimate on the console, so they are the only one labelled as one — a number
// presented beside three measurements gets read as a fourth measurement unless
// you say otherwise.

// A lap is a quarter mile, the way a treadmill counts one: four laps of a
// 400m track is roughly a mile and every console in a gym uses that.
export const MILES_PER_LAP = 0.25;

// Gross kilocalories per mile, per pound of body weight. The usual working
// figures: about 0.53 walking and about 0.75 running, which put a 155 lb
// person at roughly 82 kcal a mile walking and 116 running.
//
// These are approximations of an approximation. Energy cost depends on
// gradient, gait, fitness and the day, none of which a step counter can see,
// so the console rounds them and calls them approximate rather than pretending
// to a precision it has no way to earn.
const KCAL_PER_LB_MILE_WALK = 0.53;
const KCAL_PER_LB_MILE_RUN = 0.75;

// Below this pace it is a run, above it a walk. A single threshold is crude,
// but it is derived from distance over time — both measured — rather than
// asked for or guessed.
const RUN_PACE_MIN_PER_MILE = 12;

export const DEFAULT_BODY_WEIGHT_LB = 155;

export function lapsFor(miles) {
  return Math.max(0, miles) / MILES_PER_LAP;
}

// Minutes per mile, or null when there is not enough to divide by. A pace
// printed before anyone has moved is noise.
export function paceFor(miles, seconds) {
  if (miles < 0.02 || seconds < 5) return null;
  return seconds / 60 / miles;
}

export function kcalFor(miles, seconds, bodyWeightLb = DEFAULT_BODY_WEIGHT_LB) {
  if (miles <= 0) return 0;
  const pace = paceFor(miles, seconds);
  const rate = pace !== null && pace < RUN_PACE_MIN_PER_MILE
    ? KCAL_PER_LB_MILE_RUN
    : KCAL_PER_LB_MILE_WALK;
  return miles * bodyWeightLb * rate;
}

// Outdoor cycling is measured by GPS, so average speed is the honest intensity
// signal available without pretending the phone can see cadence or resistance.
export function speedFor(miles, seconds) {
  if (miles < 0.02 || seconds < 5) return null;
  return miles / (seconds / 3600);
}

// MET bands from an easy roll through a hard road ride. This stays an estimate:
// wind, grade, bike weight and drafting are invisible to the phone. Gross kcal
// per minute = MET * 3.5 * body mass kg / 200.
export function cyclingMet(speedMph) {
  if (speedMph == null || !isFinite(speedMph)) return 4;
  if (speedMph < 10) return 4;
  if (speedMph < 12) return 6.8;
  if (speedMph < 14) return 8;
  if (speedMph < 16) return 10;
  return 12;
}

export function kcalForBike(miles, seconds, bodyWeightLb = DEFAULT_BODY_WEIGHT_LB) {
  if (miles <= 0 || seconds < 5) return 0;
  const kg = Math.max(1, bodyWeightLb) / LB_PER_KG;
  return cyclingMet(speedFor(miles, seconds)) * 3.5 * kg / 200 * (seconds / 60);
}


// Time-based estimate for machines whose honest primary metric is active
// minutes (rower, stair climber, elliptical — and any machine when distance
// is unknown). Same gross formula as the bike: MET * 3.5 * kg / 200 per
// minute, with the MET drawn from the machine registry. Still an estimate;
// resistance and intensity are invisible to the phone.
export function kcalForActiveTime(met, activeSeconds, bodyWeightLb = DEFAULT_BODY_WEIGHT_LB) {
  const s = Math.max(0, Math.floor(activeSeconds || 0));
  if (s < 5) return 0;
  const kg = Math.max(1, bodyWeightLb) / LB_PER_KG;
  return (met || 6) * 3.5 * kg / 200 * (s / 60);
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function formatPace(pace) {
  if (pace === null || !isFinite(pace)) return '--:--';
  const mm = Math.floor(pace);
  const ss = Math.round((pace - mm) * 60);
  return ss === 60 ? `${mm + 1}:00` : `${mm}:${String(ss).padStart(2, '0')}`;
}

export function formatSpeed(speed) {
  return speed == null || !isFinite(speed) ? '--.-' : speed.toFixed(1);
}

export const LB_PER_KG = 2.2046226218;

export function displayWeight(lb, units) {
  return units === 'kg' ? Math.round(lb / LB_PER_KG) : Math.round(lb);
}

export default {
  MILES_PER_LAP,
  lapsFor,
  paceFor,
  speedFor,
  kcalFor,
  kcalForBike,
  kcalForActiveTime,
  cyclingMet,
  formatClock,
  formatPace,
  formatSpeed,
};
