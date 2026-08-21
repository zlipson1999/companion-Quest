// The battle backdrop: a sky, a horizon, receding ground bands, and a raised
// disc under each combatant.
//
// The discs are drawn as stacked rectangles of decreasing width — which is how
// a low-res sprite draws an ellipse, and keeps the hard-edged rule intact while
// still reading as a lit platform in perspective. No rounded corners anywhere.
//
// The first version was four flat rectangles: one sky, one horizon line, one
// ground, one darker strip. Flat colour is what makes a backdrop read as a
// placeholder. Everything here is banded instead — the sky steps lighter as it
// approaches the horizon, the ground steps darker as it comes toward you, and
// the platform has a lit top, a body and a shadowed underside.

import React from 'react';
import { View } from 'react-native';
import { palette, shade } from '../theme';

// Half-widths down the disc: widest just past the middle, so it reads as a
// shallow ellipse lit from above rather than a flat stripe.
const DISC = [0.52, 0.78, 0.93, 1.0, 1.0, 0.96, 0.84, 0.62];

const TONES = {
  grass: { sky: '#4a6ea8', far: '#7fa8d8', ground: palette.grass, groundDark: palette.grassDark, disc: palette.grassTall },
  trail: { sky: '#5f7fb4', far: '#9fc0e0', ground: palette.path, groundDark: palette.pathDark, disc: palette.sand },
  dusk: { sky: '#3a2c52', far: '#8a6a9e', ground: '#4a3d5e', groundDark: '#332a45', disc: '#6b5d7a' },
};

// Sky and ground each step through a few hard bands. Four is enough to read as
// distance and few enough to stay in the handheld idiom.
const SKY_BANDS = [0, 0.06, 0.13, 0.22];
const GROUND_BANDS = [0.1, 0, -0.1, -0.2];

export function Platform({ width = 96, tone = 'grass' }) {
  const t = TONES[tone] || TONES.grass;
  const px = 3;
  const last = DISC.length - 1;
  return (
    <View style={{ alignItems: 'center' }}>
      {DISC.map((w, i) => {
        // top two rows catch the light, the middle is the body, the bottom two
        // are the shaded underside of the rock
        const amt = i === 0 ? 0.34 : i === 1 ? 0.18 : i >= last - 1 ? -0.34 : i >= last - 2 ? -0.16 : 0;
        return (
          <View
            key={i}
            style={{
              width: Math.round(width * w),
              height: px,
              backgroundColor: shade(t.disc, amt),
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: shade(t.disc, -0.55),
            }}
          />
        );
      })}
    </View>
  );
}

// A full-bleed backdrop. `horizon` is where the ground starts, 0..1 from top.
export default function BattleStage({ tone = 'grass', horizon = 0.52, children, style }) {
  const t = TONES[tone] || TONES.grass;
  const skyH = horizon * 100;
  const groundH = 100 - skyH;
  return (
    <View style={[{ flex: 1, backgroundColor: t.sky }, style]}>
      {SKY_BANDS.map((amt, i) => (
        <View
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(skyH / SKY_BANDS.length) * i}%`,
            height: `${skyH / SKY_BANDS.length}%`,
            backgroundColor: shade(t.sky, amt),
          }}
        />
      ))}
      {/* the far band along the horizon reads as haze over distant ground */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: `${skyH}%`, height: 3, backgroundColor: t.far }} />
      {GROUND_BANDS.map((amt, i) => (
        <View
          key={`g${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${skyH + (groundH / GROUND_BANDS.length) * i}%`,
            height: `${groundH / GROUND_BANDS.length}%`,
            backgroundColor: shade(i === 0 ? t.ground : i === GROUND_BANDS.length - 1 ? t.groundDark : t.ground, amt),
          }}
        />
      ))}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
