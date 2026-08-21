// A crisp, font-independent triangle (selection cursor, advance arrow, D-pad).
// Built from border tricks so it stays sharp at any size — no glyph fallback.

import React from 'react';
import { View } from 'react-native';
import { palette } from '../theme';

export default function Triangle({ direction = 'right', size = 6, color = palette.accent, style }) {
  const s = size;
  const base = { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid' };
  let dirStyle;
  switch (direction) {
    case 'up':
      dirStyle = { borderLeftWidth: s, borderRightWidth: s, borderBottomWidth: s * 1.4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color };
      break;
    case 'down':
      dirStyle = { borderLeftWidth: s, borderRightWidth: s, borderTopWidth: s * 1.4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color };
      break;
    case 'left':
      dirStyle = { borderTopWidth: s, borderBottomWidth: s, borderRightWidth: s * 1.4, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color };
      break;
    case 'right':
    default:
      dirStyle = { borderTopWidth: s, borderBottomWidth: s, borderLeftWidth: s * 1.4, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color };
      break;
  }
  return <View style={[base, dirStyle, style]} />;
}
