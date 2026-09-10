// Continuous encounter clearings and a shared contact-shadow treatment.

import React, { useState } from 'react';
import { View } from 'react-native';
import { screen } from '../theme';
import EnvironmentLandscape from './EnvironmentLandscape';
import { Image } from 'react-native';
import { WORLD_BACKGROUNDS } from '../data/worldArt';

// A contact shadow keeps combatants planted in the painted landscape.
export function Platform({ width = 96 }) {
  return <View style={{ width, height: 12, borderRadius: width, backgroundColor: '#132820', opacity: 0.32, marginTop: -5 }} />;
}

// Encounters use spacious clearings from the same biome family as the route.
export default function BattleStage({ tone = 'grass', children, style }) {
  const [bounds, setBounds] = useState({ width: screen.width, height: screen.height * 0.52 });
  return <View onLayout={e => setBounds({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })} style={[{ flex: 1, backgroundColor: '#203e47', overflow: 'hidden' }, style]}>
    {tone === 'hall' ? <Image source={WORLD_BACKGROUNDS.gym} resizeMode="cover" style={{ position: 'absolute', width: bounds.width, height: bounds.height }} /> : <EnvironmentLandscape encounter tone={tone} width={bounds.width} height={bounds.height} />}
    <View style={{ flex: 1 }}>{children}</View>
  </View>;
}
