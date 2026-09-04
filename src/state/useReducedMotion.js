// Does this person want less motion?
//
// One copy of the question. `GrowthCeremony` asked it correctly and privately,
// and nothing else asked it at all — thirteen components animate and one
// checked. So the answer lived in the component least likely to hurt anyone and
// was missing from the two that could.
//
// What "less motion" has to cover here is two different needs that happen to
// share a switch:
//
//   - VESTIBULAR: large or sudden movement. Screen wipes, lunges, a whole
//     sprite sliding. Uncomfortable, not dangerous.
//   - PHOTOSENSITIVE: flashing. This one can trigger seizures, and the app
//     shipped two of them — a white full-sprite flash on every battle hit, and
//     four full-SCREEN white flashes at 70ms each entering a battle, which is
//     about seven per second against a published safety threshold of three.
//
// The second is why this is not a polish setting. A flash is removed under this
// flag, never merely shortened.

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export default function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;
    // Guarded because not every platform implements it — react-native-web maps
    // it to prefers-reduced-motion where the browser supports the query, and
    // simply does not define it where it does not.
    if (AccessibilityInfo.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled().then((v) => {
        if (alive) setReduce(!!v);
      });
    }
    const sub =
      AccessibilityInfo.addEventListener &&
      AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => {
      alive = false;
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  return reduce;
}
