// The classic JRPG bordered window: a dark outer frame, a light inner rule,
// and a parchment (or dark) fill. Hard corners, no rounding — pure handheld.

import React from 'react';
import { View } from 'react-native';
import { palette } from '../theme';

export default function Window({ children, tone = 'cream', pad = 12, style, innerStyle }) {
  const fill = tone === 'dark' ? palette.bgAlt : palette.windowFill;
  const innerLine = tone === 'dark' ? palette.inkSoft : palette.windowBorderLight;
  return (
    <View style={[{ backgroundColor: palette.windowBorder, padding: 3 }, style]}>
      <View style={[{ borderWidth: 2, borderColor: innerLine, backgroundColor: fill, padding: pad }, innerStyle]}>
        {children}
      </View>
    </View>
  );
}
