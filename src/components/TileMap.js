// Renders the top-down tile overworld + an animated walking player sprite.

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import PixelSprite from './PixelSprite';
import Triangle from './Triangle';
import { palette } from '../theme';

function Tile({ code, s }) {
  const base = { width: s, height: s };
  switch (code) {
    case '#':
      return <View style={[base, { backgroundColor: palette.path }]} />;
    case 'G':
      return (
        <View style={[base, { backgroundColor: palette.pathDark, alignItems: 'center', justifyContent: 'center' }]}>
          <Triangle direction="up" size={Math.max(4, s * 0.18)} color={palette.windowFill} />
        </View>
      );
    case 'T':
      return (
        <View style={[base, { backgroundColor: palette.grassDark, alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: s * 0.7, height: s * 0.7, backgroundColor: palette.tree, borderWidth: 2, borderColor: palette.treeDark }} />
        </View>
      );
    case '~':
      return (
        <View style={[base, { backgroundColor: palette.water, justifyContent: 'center' }]}>
          <View style={{ height: 2, backgroundColor: palette.waterDark, marginHorizontal: 4 }} />
        </View>
      );
    case ',':
      return (
        <View style={[base, { backgroundColor: palette.grass, alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 3, height: 3, backgroundColor: palette.accent, margin: 1 }} />
            <View style={{ width: 3, height: 3, backgroundColor: palette.secondary, margin: 1 }} />
          </View>
        </View>
      );
    case 'h':
      return <View style={[base, { backgroundColor: palette.roof, borderBottomWidth: 3, borderBottomColor: palette.roofDark }]} />;
    case 'y':
      return <View style={[base, { backgroundColor: palette.primary, borderBottomWidth: 3, borderBottomColor: palette.primaryDark }]} />;
    case 'H':
    case 'Y':
      return (
        <View style={[base, { backgroundColor: palette.wall, alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: s * 0.4, height: s * 0.4, backgroundColor: palette.primary, borderWidth: 2, borderColor: palette.wallDark }} />
        </View>
      );
    case 'D':
    case 'd':
      return (
        <View style={[base, { backgroundColor: palette.wall, alignItems: 'center', justifyContent: 'flex-end' }]}>
          <View style={{ width: s * 0.5, height: s * 0.7, backgroundColor: palette.ink }} />
        </View>
      );
    default:
      return (
        <View style={[base, { backgroundColor: palette.grass }]}>
          <View style={{ width: 3, height: 3, backgroundColor: palette.grassDark, opacity: 0.6, marginLeft: s * 0.55, marginTop: s * 0.5 }} />
        </View>
      );
  }
}

export default function TileMap({ map, player, tileSize, style }) {
  const s = tileSize;
  const pos = useRef(new Animated.ValueXY({ x: player.x * s, y: player.y * s })).current;

  useEffect(() => {
    Animated.timing(pos, { toValue: { x: player.x * s, y: player.y * s }, duration: 120, useNativeDriver: true }).start();
  }, [player.x, player.y, s, pos]);

  return (
    <View style={[{ width: map.cols * s, height: map.rows * s, backgroundColor: palette.grassDark, overflow: 'hidden' }, style]}>
      {map.grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, x) => (
            <Tile key={x} code={code} s={s} />
          ))}
        </View>
      ))}
      <Animated.View
        style={{ position: 'absolute', width: s, height: s, alignItems: 'center', justifyContent: 'flex-end', transform: [{ translateX: pos.x }, { translateY: pos.y }] }}
      >
        <PixelSprite spriteKey="hero_down" size={s * 0.92} flip={player.facing === 'left'} />
      </Animated.View>
    </View>
  );
}
