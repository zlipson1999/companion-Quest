// The current time-of-day phase, as a value the screens can render from.
//
// phaseAt() is pure and takes a Date; this is the one place that reads the
// clock, so the transform stays testable and there is a single answer on screen
// at any moment rather than each surface sampling `new Date()` in its own
// render pass.
//
// Two things move the phase and they are different problems. A session left
// open across a boundary needs the interval. A phone in a pocket for four hours
// needs the foreground event, because timers do not fire reliably in the
// background and coming back to a noon sky at 9pm is the exact failure this
// feature exists to fix.

import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { daylightTone, phaseAt } from '../data/daylight';
import { sceneTone } from '../data/sceneSky';

// The phase only changes on an hour boundary, so a minute is far more often
// than needed and still cheap — one comparison, and setState is a no-op when
// the answer has not changed.
const TICK_MS = 60 * 1000;

export default function useDaylight() {
  const [phase, setPhase] = useState(() => phaseAt(new Date()));

  useEffect(() => {
    const check = () => setPhase(phaseAt(new Date()));
    const timer = setInterval(check, TICK_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  return phase;
}

// A biome tone as it looks right now. The convenience every surface actually
// wants: HorizonSky needs the air, WorldScreen needs `ground` for the letterbox
// behind the map, BattleStage needs `disc`. Accepts an id or an already-built
// tone so a caller that composed its own does not have to round-trip the table.
export function useSceneTone(tone) {
  const phase = useDaylight();
  const base = typeof tone === 'string' ? sceneTone(tone) : tone;
  return useMemo(() => daylightTone(base, phase), [base, phase]);
}
