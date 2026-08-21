// The signature transition into battle: a couple of hard white flashes, then a
// staggered set of bars wipe the screen to black. Calls onDone once the screen
// is fully covered, so the parent can swap in the Battle screen underneath.

import React, { useEffect, useRef } from 'react';
import { Animated, View, Dimensions } from 'react-native';
import { palette } from '../theme';
import { playSfx } from '../audio';

const BARS = 9;

export default function BattleTransition({ onDone }) {
  const { width, height } = Dimensions.get('window');
  const flash = useRef(new Animated.Value(0)).current;
  const bars = useRef(Array.from({ length: BARS }, () => new Animated.Value(0))).current;

  useEffect(() => {
    playSfx('encounter');
    const flashes = Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]);
    const wipe = Animated.stagger(45, bars.map((b) => Animated.timing(b, { toValue: 1, duration: 220, useNativeDriver: true })));
    Animated.sequence([flashes, wipe]).start(() => {
      onDone && onDone();
    });
  }, [flash, bars, onDone]);

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
