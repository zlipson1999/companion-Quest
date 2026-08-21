// A generic animated progress bar (Route steps, XP, etc.).

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import PixelText from './PixelText';
import BarFill from './BarFill';
import { palette } from '../theme';

export default function ProgressBar({
  value,
  max,
  color = palette.xp,
  trackColor = palette.barTrack,
  height = 16,
  label,
  showText = true,
  style,
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const anim = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: ratio, duration: 400, useNativeDriver: false }).start();
  }, [ratio, anim]);

  return (
    <View style={style}>
      {label ? (
        <PixelText size="tiny" color={palette.windowFill} style={{ marginBottom: 4 }}>
          {label}
        </PixelText>
      ) : null}
      <BarFill ratioAnim={anim} color={color} trackColor={trackColor} height={height} />
      {showText ? (
        <PixelText size="tiny" color={palette.windowFill} align="right" style={{ marginTop: 4 }}>
          {Math.floor(value)} / {max}
        </PixelText>
      ) : null}
    </View>
  );
}
