// Distance engine. Real movement drives the game: your steps become miles
// (~2000 steps/mi) indoors, and a GPS "Start Run" measures real outdoor miles.
// While a run is active, steps are ignored for distance so miles aren't double
// counted. When no pedometer exists (desktop/sim), a dev injector is exposed.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { STEPS_PER_MILE } from '../data/route';

const METERS_PER_MILE = 1609.34;

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
  const [miles, setMiles] = useState(0);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const milesRef = useRef(0);
  const stepsRef = useRef(0);
  const lastStepRef = useRef(0);
  const runningRef = useRef(false);
  const pedSubRef = useRef(null);
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
      try {
        ok = await Pedometer.isAvailableAsync();
      } catch (e) {
        ok = false;
      }
      if (!mounted) return;
      setPedAvailable(ok);
      if (ok) {
        try {
          if (Pedometer.requestPermissionsAsync) await Pedometer.requestPermissionsAsync();
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
          if (mounted) setPedAvailable(false);
        }
      }
    })();
    return () => {
      mounted = false;
      if (pedSubRef.current && pedSubRef.current.remove) pedSubRef.current.remove();
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
    miles,
    steps,
    running,
    gpsError,
    startRun,
    stopRun,
    injectSteps,
    showInjector: pedAvailable === false && !running,
  };
}

export default useDistance;
