// Counting steps from raw accelerometer data.
//
// The hardware step counter (expo-sensors Pedometer) is the right source: it
// runs in the OS, counts with the screen off, and costs no battery. But it is
// not always reachable — it needs a permission the user can deny, a sensor not
// every device has, and a native build (Expo Go sandboxes it, which is where
// this app first failed on a real phone).
//
// The accelerometer has none of those problems. It needs no permission, exists
// on every phone, and works inside Expo Go. What it cannot do is count while
// the app is closed, so this is a fallback and never the preferred source.
//
// The algorithm is standard peak detection on acceleration magnitude:
//
//   1. magnitude = |(x, y, z)|, which sits near 1g at rest
//   2. subtract a slow running mean, which removes gravity and any drift from
//      how the phone happens to be held
//   3. a step is a peak crossing THRESHOLD, with hysteresis so one bounce is
//      not counted twice, and a refractory gap so shaking cannot mint steps
//
// Kept pure and free of React so it can be tested against synthetic walking
// data rather than by walking around with a phone.

// Deviation from the running mean, in g, that counts as a footfall. Walking
// peaks around 0.2-0.4g; typing or a pocket shuffle stays well under this.
export const THRESHOLD = 0.13;

// Must fall back below this before another peak can register. Without the gap
// between the two, a single noisy peak oscillating across one line is counted
// several times.
export const RELEASE = 0.05;

// Fastest credible cadence. Sprinting tops out near 5 steps/sec; 240ms allows
// ~4.1/sec and rejects the 10-20/sec that shaking the phone produces.
export const MIN_STEP_MS = 240;

// How fast the running mean tracks. Low enough to follow posture changes,
// slow enough that it does not absorb the footfalls themselves.
export const BASELINE_ALPHA = 0.08;

export function magnitude(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function createStepDetector(opts = {}) {
  const threshold = opts.threshold != null ? opts.threshold : THRESHOLD;
  const release = opts.release != null ? opts.release : RELEASE;
  const minGapMs = opts.minGapMs != null ? opts.minGapMs : MIN_STEP_MS;
  const alpha = opts.alpha != null ? opts.alpha : BASELINE_ALPHA;

  let baseline = null;
  let armed = true;       // false once a peak fires, until we fall back below `release`
  let lastStepAt = -Infinity;
  let steps = 0;

  return {
    /**
     * Feed one sample. Returns true when this sample completed a step.
     * `t` is a millisecond timestamp; the caller owns the clock.
     */
    push(x, y, z, t) {
      const mag = magnitude(x, y, z);
      if (baseline == null) {
        // Seed on the first sample so the detector does not fire a phantom
        // step while the running mean climbs from zero to 1g.
        baseline = mag;
        return false;
      }
      baseline = baseline * (1 - alpha) + mag * alpha;
      const dev = mag - baseline;

      if (armed && dev > threshold && t - lastStepAt >= minGapMs) {
        armed = false;
        lastStepAt = t;
        steps += 1;
        return true;
      }
      if (!armed && dev < release) armed = true;
      return false;
    },
    get count() {
      return steps;
    },
    reset() {
      baseline = null;
      armed = true;
      lastStepAt = -Infinity;
      steps = 0;
    },
  };
}

export default createStepDetector;
