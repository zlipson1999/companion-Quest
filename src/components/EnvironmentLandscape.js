import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, View } from 'react-native';
import { environmentCell } from '../data/environmentArt';
import TileImage from './TileImage';
import { trailTravelPixels, TRAIL_NOTES } from '../data/trailTravel';
import useReducedMotion from '../state/useReducedMotion';
import useDaylight from '../state/useDaylight';
import { veilFor } from '../data/daylight';

const ENVIRONMENT_ATLAS = require('../../assets/worlds/trail-environments-v2.png');
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

export default function EnvironmentLandscape({ tone = 'grass', width, height, moving = false, distanceMiles = 0, onInspect, encounter = false }) {
  const reduce = useReducedMotion();
  const phase = useDaylight();
  const veil = veilFor(phase);
  const travel = useRef(new Animated.Value(0)).current;
  const sceneHeight = Math.max(height, width * 1.25);
  const blend = width * 0.14;
  const period = sceneHeight - blend;
  // The target is accumulated sensor distance. Pausing never resets scenery,
  // and enabling GPS without a new fix cannot move the landscape.
  useEffect(() => {
    const target = trailTravelPixels(distanceMiles);
    if (reduce) { travel.setValue(target); return undefined; }
    const animation = Animated.timing(travel, { toValue: target, duration: 650, easing: Easing.linear, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [distanceMiles, reduce, travel]);
  const groundTravel = Animated.modulo(travel, period);
  const nearTravel = Animated.modulo(Animated.multiply(travel, 1.28), height);
  const cell = environmentCell(tone);
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden', backgroundColor: '#274631' }}>
    {encounter ? <Panel cell={cell} width={width} height={height} source={BATTLE_ATLAS} /> : <Animated.View pointerEvents="none" style={{ transform: [{ translateY: groundTravel }] }}>
      {[-1, 0, 1].map(row => <View key={row} style={{ position: 'absolute', top: row * period }}>
        <Panel cell={cell} width={width} height={sceneHeight} blend={blend} />
      </View>)}
    </Animated.View>}
    {!encounter ? <>
      {/* Independent near-ground details pass faster than the distant scenery. */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width, height: height * 2, top: -height, transform: [{ translateY: nearTravel }] }}>
        {[0, 1].map(copy => [0.22, 0.61, 0.9].map((fraction, i) => <View key={`${copy}-${i}`} style={{ position: 'absolute', top: (copy + fraction) * height, left: i % 2 ? width * 0.83 : width * 0.04, opacity: 0.9 }}>
          {[0, 2, 3, 5, 9].includes(cell) ? <TileImage name={cell === 5 ? 'prop_tallgrass' : 'prop_flowers'} size={48 + i * 7} /> : <View style={{ width: 28 + i * 4, height: 18 + i * 3, borderRadius: 8, borderTopWidth: 4, borderTopColor: cell === 6 ? '#eef5f4' : '#a89d8a', backgroundColor: cell === 8 ? '#6e4235' : cell === 11 ? '#696081' : '#727775', transform: [{ rotate: `${i * 17 - 12}deg` }] }} />}
        </View>))}
      </Animated.View>
      {onInspect ? <Animated.View style={{ position: 'absolute', left: width * 0.7, top: height * 0.25 - height, transform: [{ translateY: nearTravel }] }}>
        {[0, 1].map(copy => <Pressable key={copy} accessibilityRole="button" accessibilityLabel="Inspect trail marker" onPress={() => onInspect(TRAIL_NOTES[cell])} style={{ position: 'absolute', top: copy * height, width: 56, height: 64, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 42, height: 26, backgroundColor: '#986b3f', borderColor: '#513c29', borderWidth: 3, transform: [{ rotate: '-4deg' }] }}>
            <View style={{ width: 22, height: 4, backgroundColor: '#eed999', margin: 6 }} />
          </View>
          <View style={{ width: 7, height: 26, backgroundColor: '#694c32' }} />
        </Pressable>)}
      </Animated.View> : null}
      {moving && !reduce ? <View pointerEvents="none" style={{ position: 'absolute', left: width * 0.44, top: height * 0.70, flexDirection: 'row', gap: 12, opacity: 0.4 }}>
        <View style={{ width: 5, height: 3, backgroundColor: '#d7c599' }} /><View style={{ width: 3, height: 3, backgroundColor: '#d7c599' }} />
      </View> : null}
    </> : null}
    {veil.opacity > 0 ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height, backgroundColor: veil.color, opacity: veil.opacity }} /> : null}
  </View>;
}
