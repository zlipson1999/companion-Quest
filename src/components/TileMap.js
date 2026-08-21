// The top-down tile overworld, plus the walking hero.
//
// Tiles used to be flat coloured Views — a green square for grass, a brown one
// for a tree. That is the single biggest reason the overworld read as a mockup
// rather than a game. They are real 16x16 pixel tiles now, drawn by
// tools/make_sprites.py like everything else, with two-frame animation on water
// and a scattered second grass variant so large fields do not tile visibly.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import PixelArt from './PixelArt';
import PixelSprite from './PixelSprite';
import { palette } from '../theme';
import { SPRITES } from '../data/sprites';

// Tile code -> sprite key. Animated tiles list their frames.
const TILE_SPRITES = {
  '.': ['tile_grass', 'tile_grass_b'],
  ',': ['tile_flowers'],
  '#': ['tile_path'],
  G: ['tile_gate'],
  T: ['tile_tree'],
  '~': ['tile_water', 'tile_water_b'],
  h: ['tile_roof_rest'],
  y: ['tile_roof_gym'],
  H: ['tile_window'],
  Y: ['tile_window'],
  D: ['tile_door'],
  d: ['tile_door'],
  '^': ['tile_tallgrass'],
};

const WATER_FRAME_MS = 620;

// Grass gets a stable per-cell variant so the field looks scattered rather than
// checkerboarded — derived from the coordinates, not random, so it never
// reshuffles on re-render.
function variantFor(x, y, count) {
  if (count <= 1) return 0;
  return ((x * 7 + y * 13) >>> 0) % count === 0 ? 1 : 0;
}

function Tile({ code, s, frame, x, y }) {
  const keys = TILE_SPRITES[code] || TILE_SPRITES['.'];
  const key = keys.length > 1 && code === '~' ? keys[frame % keys.length] : keys[variantFor(x, y, keys.length)];
  const sprite = SPRITES[key];
  if (!sprite) return <View style={{ width: s, height: s, backgroundColor: palette.grass }} />;
  const px = Math.max(1, Math.round(s / sprite.grid[0].length));
  return (
    <View style={{ width: s, height: s, overflow: 'hidden' }}>
      <PixelArt grid={sprite.grid} palette={sprite.palette} pixelSize={px} />
    </View>
  );
}

export default function TileMap({ map, player, tileSize, style }) {
  const s = tileSize;
  const pos = useRef(new Animated.ValueXY({ x: player.x * s, y: player.y * s })).current;
  const [frame, setFrame] = useState(0);
  const [stepFrame, setStepFrame] = useState(0);
  const lastPos = useRef(`${player.x},${player.y}`);

  useEffect(() => {
    const t = setInterval(() => setFrame((f) => f + 1), WATER_FRAME_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Animated.timing(pos, { toValue: { x: player.x * s, y: player.y * s }, duration: 120, useNativeDriver: true }).start();
    // Advance the walk cycle only on an actual move, so bumping a wall does not
    // make the hero jog on the spot.
    const key = `${player.x},${player.y}`;
    if (key !== lastPos.current) {
      lastPos.current = key;
      setStepFrame((f) => (f + 1) % 2);
    }
  }, [player.x, player.y, s, pos]);

  // Rows are static once the map is set; only the player and water move.
  const rows = useMemo(
    () =>
      map.grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, x) => (
            <Tile key={x} code={code} s={s} frame={frame} x={x} y={y} />
          ))}
        </View>
      )),
    [map, s, frame]
  );

  const facing = player.facing || 'down';
  const heroKey = `hero_${facing}${stepFrame === 0 ? '_a' : '_b'}`;
  const spriteKey = SPRITES[heroKey] ? heroKey : `hero_${facing}`;

  return (
    <View style={[{ width: map.cols * s, height: map.rows * s, backgroundColor: palette.grassDark, overflow: 'hidden' }, style]}>
      {rows}
      <Animated.View
        style={{
          position: 'absolute',
          width: s,
          height: s,
          alignItems: 'center',
          justifyContent: 'flex-end',
          transform: [{ translateX: pos.x }, { translateY: pos.y }],
        }}
      >
        <PixelSprite spriteKey={spriteKey} size={s * 1.25} />
      </Animated.View>
    </View>
  );
}
