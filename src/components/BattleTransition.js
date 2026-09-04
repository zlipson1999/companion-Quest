// The signature transition into battle: a couple of hard white flashes, then a
// staggered set of bars wipe the screen to black. Calls onDone once the screen
// is fully covered, so the parent can swap in the Battle screen underneath.
//
// Under reduced motion the flashes do not happen at all. Four full-SCREEN white
// flashes at 70ms each is about seven a second, against a published
// photosensitivity threshold of three — so this is not shortened or softened
// under the flag, it is removed, and the wipe alone carries the transition. The
// wipe also stops being staggered, because nine bars arriving in sequence is
// the vestibular half of the same setting.

import React, { useEffect, useRef } from 'react';
import { Animated, View, Dimensions } from 'react-native';
import { palette } from '../theme';
import { playSfx } from '../audio';
import useReducedMotion from '../state/useReducedMotion';

const BARS = 9;

export default function BattleTransition({ onDone }) {
  const { width, height } = Dimensions.get('window');
  const flash = useRef(new Animated.Value(0)).current;
  const bars = useRef(Array.from({ length: BARS }, () => new Animated.Value(0))).current;
  const reduce = useReducedMotion();

  useEffect(() => {
    playSfx('encounter');
    const wipe = reduce
      ? Animated.parallel(bars.map((b) => Animated.timing(b, { toValue: 1, duration: 260, useNativeDriver: true })))
      : Animated.stagger(45, bars.map((b) => Animated.timing(b, { toValue: 1, duration: 220, useNativeDriver: true })));
    if (reduce) {
      wipe.start(() => { onDone && onDone(); });
      return;
    }
    const flashes = Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]);
    Animated.sequence([flashes, wipe]).start(() => {
      onDone && onDone();
    });
  }, [flash, bars, onDone, reduce]);

  const barH = Math.ceil(height / BARS) + 1;

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: i * barH,
            left: 0,
            width,
            height: barH,
            backgroundColor: palette.ink,
            transform: [{ translateX: b.interpolate({ inputRange: [0, 1], outputRange: [i % 2 === 0 ? -width : width, 0] }) }],
          }}
        />
      ))}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: palette.flash, opacity: flash }} />
    </View>
  );
}
