// Continuous encounter clearings and a shared contact-shadow treatment.

import React, { useState } from 'react';
import { View, Platform as NativePlatform } from 'react-native';
import { PLATFORM_ATLAS, PLATFORM_RECTS } from '../data/platformArt';
import { environmentCell } from '../data/environmentArt';
import { screen } from '../theme';
import EnvironmentLandscape from './EnvironmentLandscape';
import { Image } from 'react-native';
import { WORLD_BACKGROUNDS } from '../data/worldArt';

// The feet overlap the centre of a region-specific surface, not its rear rim.
export function Platform({ width = 160, tone = 'grass' }) {
  const height = width * 0.38;
  const [x, y, w, h] = PLATFORM_RECTS[environmentCell(tone)];
  if (tone === 'hall') return <View style={{ width, height, marginTop: -height * 0.6, zIndex: -1, borderRadius: 8, backgroundColor: '#344c56', borderWidth: 3, borderColor: '#768b8b', transform: [{ scaleY: 0.7 }] }} />;
  return <View pointerEvents="none" style={{ width, height, marginTop: -height * 0.6, zIndex: -1, overflow: 'hidden' }}>
    <Image source={PLATFORM_ATLAS} fadeDuration={0} style={{ position: 'absolute', width: 1536 * width / w, height: 1024 * height / h, left: -x * width / w, top: -y * height / h, ...(NativePlatform.OS === 'web' ? { imageRendering: 'pixelated' } : {}) }} />
  </View>;
}

// Encounters use spacious clearings from the same biome family as the route.
export default function BattleStage({ tone = 'grass', children, style }) {
  const [bounds, setBounds] = useState({ width: screen.width, height: screen.height * 0.52 });
  return <View onLayout={e => setBounds({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })} style={[{ flex: 1, backgroundColor: '#203e47', overflow: 'hidden' }, style]}>
    {tone === 'hall' ? <Image source={WORLD_BACKGROUNDS.gym} resizeMode="cover" style={{ position: 'absolute', width: bounds.width, height: bounds.height }} /> : <EnvironmentLandscape encounter tone={tone} width={bounds.width} height={bounds.height} />}
    <View style={{ flex: 1 }}>{children}</View>
  </View>;
}
