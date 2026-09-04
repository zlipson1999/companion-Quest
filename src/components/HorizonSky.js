// Sky, then haze, then the ground's own colour. One painter for the trail,
// the challenge stage, and the slack above Sunkist Lane.
//
// The first version was a flat hex plus a 4px line. That is a seam. Bands
// that are equal-height also read as a gradient tool, so the sky steps are
// weighted toward the zenith and the haze is a handful of hard-edged mixes
// that sit ON the join — half in the air, half over the first ground pixels.

import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { SKY_VEIL } from '../data/tileAtlas';
import { hazeBands, sceneTone, skyBands } from '../data/sceneSky';

const HAZE_PX = 4;

export default function HorizonSky({
  tone = 'maple',
  horizon = 0.18,
  fillBelow = false,
}) {
  const t = sceneTone(tone);
  const sky = useMemo(() => skyBands(t), [t]);
  const haze = useMemo(() => hazeBands(t), [t]);
  const skyH = `${horizon * 100}%`;
  const hazeTop = haze.length * HAZE_PX;
  const overlap = Math.floor(haze.length / 2) * HAZE_PX;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {fillBelow ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: skyH, bottom: 0, backgroundColor: t.ground }} />
      ) : null}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: skyH, overflow: 'hidden' }}>
        {sky.map((band, i) => (
          <View key={i} style={{ flex: band.weight, backgroundColor: band.color }} />
        ))}
        {/* One achromatic overlay gives all thirty skies their texture: cloud
            where it catches the light, a cool dark underneath, and an ordered
            dither that breaks the joins between the bands. Bands alone are a
            stripe, and eight stripes read as a gradient tool rather than air.
            Painting thirty skies to fix that is the wrong trade; this takes
            whatever tone it is laid over. */}
        <Image
          source={SKY_VEIL}
          resizeMode="stretch"
          fadeDuration={0}
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: skyH,
          marginTop: -overlap,
          height: hazeTop,
        }}
      >
        {haze.map((color, i) => (
          <View key={i} style={{ height: HAZE_PX, backgroundColor: color }} />
        ))}
      </View>
    </View>
  );
}
