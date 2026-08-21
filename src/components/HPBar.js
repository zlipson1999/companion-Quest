// A bordered HP bar that animates as health changes and shifts color from
// green -> gold -> red as it drops. Used in battle and on status screens.

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import PixelText from './PixelText';
import BarFill from './BarFill';
import { palette } from '../theme';

export default function HPBar({ hp, maxHp, width = 120, showNumbers = true, label = 'HP' }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const anim = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: ratio, duration: 350, useNativeDriver: false }).start();
  }, [ratio, anim]);

  const color = ratio > 0.5 ? palette.hpHigh : ratio > 0.2 ? palette.hpMid : palette.hpLow;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PixelText size="tiny" color={palette.secondary} style={{ marginRight: 6 }}>
          {label}
        </PixelText>
        <BarFill ratioAnim={anim} color={color} height={12} style={{ width }} />
      </View>
      {showNumbers ? (
        <PixelText size="tiny" color={palette.windowFill} align="right" style={{ marginTop: 4 }}>
          {Math.max(0, Math.round(hp))}/{maxHp}
        </PixelText>
      ) : null}
    </View>
  );
}
