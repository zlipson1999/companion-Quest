// The inside of a meter.
//
// A flat rectangle of colour is a progress bar; a meter in a handheld RPG is a
// little tube — a lit line along the top, the body, a darker line along the
// bottom — sitting in a track with its own inner shadow. Three extra Views, and
// it is the difference between "a div with a width" and a game meter.

import React from 'react';
import { Animated, View } from 'react-native';
import { palette, shade } from '../theme';

export default function BarFill({ ratioAnim, color, height, trackColor = palette.barTrack, style }) {
  // A thin meter (the EXP strip) cannot afford a 2px keyline on both sides —
  // it would leave one pixel of actual bar.
  const bw = height <= 8 ? 1 : 2;
  const inner = Math.max(2, height - bw * 2);
  const lit = Math.max(1, Math.round(inner * 0.3));
  const dim = Math.max(1, Math.round(inner * 0.22));
  return (
    <View style={[{ height, backgroundColor: trackColor, borderWidth: bw, borderColor: palette.ink }, style]}>
      {/* inner shadow along the top of the empty track */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: shade(trackColor, -0.35) }} />
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: color,
          width: ratioAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      >
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: lit, backgroundColor: shade(color, 0.38) }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: dim, backgroundColor: shade(color, -0.3) }} />
      </Animated.View>
    </View>
  );
}
