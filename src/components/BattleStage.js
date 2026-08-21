// The battle backdrop: a horizon, and a raised disc under each combatant.
//
// The discs are drawn as stacked rectangles of decreasing width — which is how
// a low-res sprite draws an ellipse, and keeps the hard-edged rule intact while
// still reading as a lit platform in perspective. No rounded corners anywhere.

import React from 'react';
import { View } from 'react-native';
import { palette } from '../theme';

// Half-widths down the disc: widest just past the middle, so it reads as a
// shallow ellipse lit from above rather than a flat stripe.
const DISC = [0.58, 0.82, 0.96, 1.0, 0.94, 0.78, 0.54];

const TONES = {
  grass: { sky: '#4a6ea8', far: '#5f8ec4', ground: palette.grass, groundDark: palette.grassDark, discTop: palette.grassTall, discSide: palette.grassDark },
  trail: { sky: '#5f7fb4', far: '#7fa3cc', ground: palette.path, groundDark: palette.pathDark, discTop: palette.sand, discSide: palette.pathDark },
  dusk: { sky: '#3a2c52', far: '#5b4a7a', ground: '#4a3d5e', groundDark: '#332a45', discTop: '#6b5d7a', discSide: '#3a2c52' },
};

export function Platform({ width = 96, tone = 'grass' }) {
  const t = TONES[tone] || TONES.grass;
  const px = 3;
  return (
    <View style={{ alignItems: 'center' }}>
      {DISC.map((w, i) => (
        <View
          key={i}
          style={{
            width: Math.round(width * w),
            height: px,
            backgroundColor: i < 3 ? t.discTop : t.discSide,
          }}
        />
      ))}
    </View>
  );
}

// A full-bleed backdrop. `horizon` is where the ground starts, 0..1 from top.
export default function BattleStage({ tone = 'grass', horizon = 0.52, children, style }) {
  const t = TONES[tone] || TONES.grass;
  return (
    <View style={[{ flex: 1, backgroundColor: t.sky }, style]}>
      {/* distant band above the horizon line */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: `${horizon * 100}%`, backgroundColor: t.sky }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: `${horizon * 100}%`, height: 4, backgroundColor: t.far }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: `${horizon * 100}%`, bottom: 0, backgroundColor: t.ground }} />
      {/* a darker near-ground band so the lower half has depth */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%', backgroundColor: t.groundDark }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
