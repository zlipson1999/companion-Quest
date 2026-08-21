// Real-steps integration. Movement comes ONLY from the phone's real pedometer
// (expo-sensors) — there are no "walk" buttons. When no pedometer is available
// (desktop / simulator / web), `available` is false and the Route screen shows
// a dev-only step injector so the loop can still be tested. On a real phone the
// pedometer is detected and that injector auto-hides.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';

export function usePedometer() {
  const [available, setAvailable] = useState(null);
  const [real, setReal] = useState(0);
  const [dev, setDev] = useState(0);
  const subRef = useRef(null);

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
      setAvailable(ok);
      if (ok) {
        try {
          if (Pedometer.requestPermissionsAsync) {
            await Pedometer.requestPermissionsAsync();
          }
          subRef.current = Pedometer.watchStepCount((result) => {
            setReal(result.steps || 0);
          });
        } catch (e) {
          if (mounted) setAvailable(false);
        }
      }
    })();
    return () => {
      mounted = false;
      if (subRef.current && subRef.current.remove) subRef.current.remove();
    };
  }, []);

  const injectSteps = useCallback((n) => setDev((d) => d + n), []);

  return {
    available,
    count: real + dev,
    injectSteps,
    showInjector: available === false,
  };
}

export default usePedometer;
