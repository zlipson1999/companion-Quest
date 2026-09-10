import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, View } from 'react-native';
import { ENVIRONMENT_ATLAS, environmentCell } from '../data/environmentArt';
import useReducedMotion from '../state/useReducedMotion';
import useDaylight from '../state/useDaylight';
import { veilFor } from '../data/daylight';

const BATTLE_ATLAS = require('../../assets/worlds/battle-environments-v2.png');

// The atlas is sampled inside a clipped panel, never as visible ground cells.
function Panel({ cell, width, height, blend = 0, source = ENVIRONMENT_ATLAS }) {
  const imageStyle = {
    position: 'absolute', width: width * 3, height: height * 4,
    left: -(cell % 3) * width, top: -Math.floor(cell / 3) * height,
    ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' } : {}),
  };
  if (!blend) return <View style={{ width, height, overflow: 'hidden' }}><Image source={source} fadeDuration={0} resizeMode="stretch" style={imageStyle} /></View>;
  // A short overlap dissolves the boundary between repeated landscape panels.
  // It has no collision role and never changes sensor-driven travel credit.
  const strips = Array.from({ length: 8 }, (_, i) => ({ y: i * blend / 8, h: blend / 8, opacity: (i + 0.5) / 8 }));
  strips.push({ y: blend, h: height - blend, opacity: 1 });
  return <View style={{ width, height }}>{strips.map((strip, i) => <View key={i} style={{ position: 'absolute', top: strip.y, width, height: strip.h, overflow: 'hidden', opacity: strip.opacity }}>
    <Image source={source} fadeDuration={0} resizeMode="stretch" style={[imageStyle, { top: imageStyle.top - strip.y }]} />
  </View>)}</View>;
}

export default function EnvironmentLandscape({ tone = 'grass', width, height, moving = false, encounter = false }) {
  const reduce = useReducedMotion();
  const phase = useDaylight();
  const veil = veilFor(phase);
  const travel = useRef(new Animated.Value(0)).current;
  const sceneHeight = Math.max(height, width * 1.25);
  const blend = width * 0.14;
  const period = sceneHeight - blend;
  useEffect(() => {
    if (!moving || reduce) return undefined;
    travel.setValue(0);
    const loop = Animated.loop(Animated.timing(travel, { toValue: period, duration: period * 28, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [moving, reduce, period, travel]);
  const cell = environmentCell(tone);
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden', backgroundColor: '#274631' }}>
    {encounter ? <Panel cell={cell} width={width} height={height} source={BATTLE_ATLAS} /> : <Animated.View style={{ transform: [{ translateY: travel }] }}>
      {[-1, 0, 1].map(row => <View key={row} style={{ position: 'absolute', top: row * period }}>
        <Panel cell={cell} width={width} height={sceneHeight} blend={blend} />
      </View>)}
    </Animated.View>}
    {veil.opacity > 0 ? <View style={{ position: 'absolute', left: 0, top: 0, width, height, backgroundColor: veil.color, opacity: veil.opacity }} /> : null}
  </View>;
}
