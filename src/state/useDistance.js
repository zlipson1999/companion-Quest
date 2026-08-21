// Distance engine. Real movement drives the game: your steps become miles
// (~2000 steps/mi) indoors, and a GPS "Start Run" measures real outdoor miles.
// While a run is active, steps are ignored for distance so miles aren't double
// counted. When no pedometer exists (desktop/sim), a dev injector is exposed.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Accelerometer, Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { STEPS_PER_MILE } from '../data/route';
import { createStepDetector } from './stepDetector';

const METERS_PER_MILE = 1609.34;

// 50 Hz requested. A footfall impulse lasts about 90ms, so sampling any slower
// than ~15 Hz starts missing peaks between samples and silently under-counts —
// measured at 10 Hz it lost 40% of steps. Asking for 50 leaves headroom for
// platforms that clamp the rate or throttle under battery saver.
const MOTION_INTERVAL_MS = 20;

// Below this the detector cannot see footfalls reliably. We report it rather
// than quietly reporting a low step count as if it were the truth.
const MOTION_MIN_HZ = 15;

// How long to wait for the first samples before declaring the sensor dead.
const MOTION_PROBE_MS = 1200;

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useDistance() {
  const [pedAvailable, setPedAvailable] = useState(null);
  // Why the pedometer is unavailable, when it is. The first version threw the
  // exception away and set a boolean, so a dead sensor on a real phone was
  // indistinguishable from a simulator and there was nothing to debug with.
  const [pedDiag, setPedDiag] = useState(null);
  // Which sensor is actually feeding steps: the OS step counter, our own
  // accelerometer detector, or nothing.
  const [source, setSource] = useState('none');
  // Live count from our own detector, so the Route can prove it is working
  // rather than just asserting it.
  const [motionSteps, setMotionSteps] = useState(0);
  // Measured delivery rate. Below MOTION_MIN_HZ the count is known to be low.
  const [motionHz, setMotionHz] = useState(null);
  const [miles, setMiles] = useState(0);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const milesRef = useRef(0);
  const stepsRef = useRef(0);
  const lastStepRef = useRef(0);
  const runningRef = useRef(false);
  const pedSubRef = useRef(null);
  const motionSubRef = useRef(null);
  const detectorRef = useRef(null);
  const gpsSubRef = useRef(null);
  const lastCoordRef = useRef(null);

  const addMiles = (dm) => {
    if (dm <= 0) return;
    milesRef.current += dm;
    setMiles(milesRef.current);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      let ok = false;
      let error = null;
      let permission = null;
      try {
        ok = await Pedometer.isAvailableAsync();
      } catch (e) {
        ok = false;
        error = String((e && (e.message || e.code)) || e);
      }
      // Ask what the permission actually is, separately from availability —
      // "sensor missing" and "you said no" both surface as false, and they need
      // completely different fixes.
      try {
        if (Pedometer.getPermissionsAsync) {
          const p = await Pedometer.getPermissionsAsync();
          permission = p && p.status ? p.status : null;
        }
      } catch (e) {
        if (!permission) permission = `check failed: ${String((e && e.message) || e)}`;
      }
      if (!mounted) return;
      setPedAvailable(ok);
      setPedDiag({
        available: ok,
        permission,
        error,
        platform: `${Platform.OS} ${Platform.Version}`,
        // Expo Go sandboxes native modules; a standalone build often succeeds
        // where Expo Go cannot, so which one this is matters for the diagnosis.
        host: Constants.appOwnership === 'expo' ? 'Expo Go' : 'standalone',
      });
      if (ok) {
        try {
          if (Pedometer.requestPermissionsAsync) await Pedometer.requestPermissionsAsync();
          setSource('pedometer');
          pedSubRef.current = Pedometer.watchStepCount((res) => {
            const total = res.steps || 0;
            const delta = total - lastStepRef.current;
            lastStepRef.current = total;
            if (delta > 0) {
              stepsRef.current += delta;
              setSteps(stepsRef.current);
              if (!runningRef.current) addMiles(delta / STEPS_PER_MILE);
            }
          });
        } catch (e) {
          if (mounted) {
            setPedAvailable(false);
            setPedDiag((d) => ({ ...(d || {}), available: false, error: `watch failed: ${String((e && e.message) || e)}` }));
            await startMotionFallback();
          }
        }
      } else {
        // No OS step counter. Count them ourselves off the accelerometer, which
        // needs no permission and works even inside Expo Go. Foreground only —
        // see the note in stepDetector.js.
        await startMotionFallback();
      }
    })();
    async function startMotionFallback() {
      try {
        // 'probing' keeps the failure box off screen for the second or so it
        // takes to find out — flashing "no step counter" and then replacing it
        // reads as a bug even when it resolves correctly.
        if (mounted) setSource('probing');
        detectorRef.current = createStepDetector();
        let samples = 0;

        // Subscribe FIRST and judge by whether data actually arrives.
        // isAvailableAsync() used to gate this, and it is exactly the call that
        // already lied about the pedometer inside Expo Go — gating the fallback
        // on the same kind of check meant the fallback could be disabled by the
        // very problem it exists to work around. A sensor that delivers samples
        // works, whatever it claims about itself.
        motionSubRef.current = Accelerometer.addListener(({ x, y, z }) => {
          samples += 1;
          // Real elapsed time, not a counter advanced by the interval we asked
          // for: platforms deliver at their own rate, and a synthetic clock
          // running fast or slow silently rescales the refractory gap.
          if (!detectorRef.current.push(x, y, z, Date.now())) return;
          stepsRef.current += 1;
          setSteps(stepsRef.current);
          setMotionSteps(stepsRef.current);
          if (!runningRef.current) addMiles(1 / STEPS_PER_MILE);
        });
        try {
          Accelerometer.setUpdateInterval(MOTION_INTERVAL_MS);
        } catch (e) {
          // Non-fatal: we still get samples at the platform default.
        }

        // Give it a moment, then decide from evidence.
        setTimeout(() => {
          if (!mounted) return;
          if (samples > 0) {
            const hz = Math.round((samples / MOTION_PROBE_MS) * 1000);
            setSource('motion');
            setMotionHz(hz);
            setPedDiag((d) => ({
              ...(d || {}),
              fallback:
                hz < MOTION_MIN_HZ
                  ? `accelerometer live but slow (${hz} Hz) — steps will under-count`
                  : `accelerometer live (${hz} Hz)`,
            }));
          } else {
            if (motionSubRef.current && motionSubRef.current.remove) motionSubRef.current.remove();
            motionSubRef.current = null;
            setSource('none');
            setPedDiag((d) => ({ ...(d || {}), fallback: 'accelerometer delivered no data either' }));
          }
        }, MOTION_PROBE_MS);
      } catch (e) {
        if (mounted) {
          setSource('none');
          setPedDiag((d) => ({ ...(d || {}), fallback: `accelerometer failed: ${String((e && e.message) || e)}` }));
        }
      }
    }

    return () => {
      mounted = false;
      if (pedSubRef.current && pedSubRef.current.remove) pedSubRef.current.remove();
      if (motionSubRef.current && motionSubRef.current.remove) motionSubRef.current.remove();
    };
  }, []);

  const startRun = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Location permission is needed for GPS runs.');
        return false;
      }
      lastCoordRef.current = null;
      gpsSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (lastCoordRef.current) {
            const d = haversineMeters(lastCoordRef.current, { latitude, longitude });
            if (d > 1 && d < 80) addMiles(d / METERS_PER_MILE); // ignore jitter and GPS jumps
          }
          lastCoordRef.current = { latitude, longitude };
        }
      );
      runningRef.current = true;
      setRunning(true);
      setGpsError(null);
      return true;
    } catch (e) {
      setGpsError('GPS is unavailable on this device.');
      return false;
    }
  }, []);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (gpsSubRef.current && gpsSubRef.current.remove) gpsSubRef.current.remove();
    gpsSubRef.current = null;
    lastCoordRef.current = null;
  }, []);

  useEffect(
    () => () => {
      if (gpsSubRef.current && gpsSubRef.current.remove) gpsSubRef.current.remove();
    },
    []
  );

  const injectSteps = useCallback((n) => {
    stepsRef.current += n;
    setSteps(stepsRef.current);
    addMiles(n / STEPS_PER_MILE);
  }, []);

  return {
    pedAvailable,
    pedDiag,
    source,
    motionSteps,
    motionHz,
    motionSlow: motionHz != null && motionHz < MOTION_MIN_HZ,
    miles,
    steps,
    running,
    gpsError,
    startRun,
    stopRun,
    injectSteps,
    // Only when nothing at all can count steps. The accelerometer fallback is
    // a real step source, not a stand-in, so it must not put the manual
    // buttons on screen beside it.
    showInjector: source === 'none' && !running,
  };
}

export default useDistance;
