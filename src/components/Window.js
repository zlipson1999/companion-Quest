// The classic JRPG bordered window.
//
// The first version was three flat rectangles. A menu frame on a handheld reads
// as a physical object because it is BEVELLED: a lit edge along the top-left, a
// shadowed one along the bottom-right, a hard keyline around the outside, and a
// bright rule separating the frame from the paper. Studs in the corners finish
// it. Every layer here is a plain View — no image assets, same as the sprites.

import React from 'react';
import { View } from 'react-native';
import { palette } from '../theme';

const TONES = {
  cream: {
    fill: palette.windowFill,
    fillHi: palette.windowFillHi,
    inner: palette.windowBorderLight,
    frame: palette.windowFrame,
    frameLight: palette.windowFrameLight,
    frameDark: palette.windowFrameDark,
  },
  dark: {
    fill: palette.bgAlt,
    fillHi: palette.inkSoft,
    inner: palette.inkSoft,
    frame: palette.inkSoft,
    frameLight: '#5b4784',
    frameDark: palette.ink,
  },
};

const FRAME = 4;
const STUD = 3;

function Stud({ corner, color }) {
  const [v, h] = corner;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: STUD,
        height: STUD,
        backgroundColor: color,
        [v]: 1,
        [h]: 1,
      }}
    />
  );
}

export default function Window({ children, tone = 'cream', pad = 12, studs = true, style, innerStyle }) {
  const t = TONES[tone] || TONES.cream;
  return (
    <View style={[{ backgroundColor: palette.ink, padding: 1 }, style]}>
      <View style={{ backgroundColor: t.frame, padding: FRAME }}>
        {/* bevel: light where the light falls, dark on the opposite edges */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: t.frameLight }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, backgroundColor: t.frameLight }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: t.frameDark }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, backgroundColor: t.frameDark }} />
        {studs ? (
          <>
            <Stud corner={['top', 'left']} color={palette.windowStud} />
            <Stud corner={['top', 'right']} color={palette.windowStud} />
            <Stud corner={['bottom', 'left']} color={palette.windowStud} />
            <Stud corner={['bottom', 'right']} color={palette.windowStud} />
          </>
        ) : null}
        <View style={[{ borderWidth: 1, borderColor: t.inner, backgroundColor: t.fill, padding: pad }, innerStyle]}>
          {/* a one-pixel highlight along the top of the paper */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: t.fillHi }} />
          {children}
        </View>
      </View>
    </View>
  );
}
