// The signature dual-pane "handheld" layout: a main scene up top and a
// menu/action panel below, split by a chunky hinge — evoking the two-screen
// DS feel.

import React from 'react';
import { View } from 'react-native';
import { palette } from '../theme';

export default function DualPane({ top, bottom, topFlex = 1, bottomFlex = 1, topStyle, bottomStyle, style }) {
  return (
    <View style={[{ flex: 1, backgroundColor: palette.bg }, style]}>
      <View style={[{ flex: topFlex, overflow: 'hidden' }, topStyle]}>{top}</View>
      <View style={{ height: 6, backgroundColor: palette.ink }}>
        <View style={{ height: 2, backgroundColor: palette.inkSoft, marginTop: 2, marginHorizontal: 24 }} />
      </View>
      <View style={[{ flex: bottomFlex, backgroundColor: palette.bgAlt }, bottomStyle]}>{bottom}</View>
    </View>
  );
}
