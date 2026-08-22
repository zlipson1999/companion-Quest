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
import { outfitPalette } from '../data/outfits';
import { playerSprite, COACH_SPRITE } from '../data/characters';
import { useGame } from '../state';

// Tile code -> sprite key. Animated tiles list their frames.
const TILE_SPRITES = {
  '.': ['tile_grass', 'tile_grass_b'],
  ',': ['tile_flowers'],
  '#': ['tile_path', 'tile_path_b'],
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
  // Training Hall interior
  W: ['tile_wall'],
  '=': ['tile_gym_wall'],
  '|': ['tile_gym_wall_side'],
  M: ['tile_gym_mirror'],
  m: ['tile_gym_mat'],
  R: ['tile_rack_barbell'],
  b: ['tile_rack_dumbbell'],
  K: ['tile_machine'],
  t: ['tile_treadmill'],
  B: ['tile_bench'],
  w: ['tile_water_station'],
  X: ['tile_gym_exit'],
};

// Interiors have their own ground tile, so a room does not fall back to grass
// where it has no explicit code.
const FLOOR_BY_MAP = {
  gym: ['tile_gym_floor', 'tile_gym_floor_b'],
  home: ['tile_home_floor', 'tile_home_floor_b'],
};

const WATER_FRAME_MS = 620;

// Grass gets a stable per-cell variant so the field looks scattered rather than
// checkerboarded — derived from the coordinates, not random, so it never
// reshuffles on re-render.
function variantFor(x, y, count) {
  if (count <= 1) return 0;
  return ((x * 7 + y * 13) >>> 0) % count === 0 ? 1 : 0;
}

export function Tile({ code, s, frame, x, y, floor }) {
  const ground = floor || TILE_SPRITES['.'];
  // '.' and ',' are "whatever this map's ground is". Everything else names a
  // specific sprite, and an unknown code falls back to ground rather than to
  // grass, so an interior never grows a lawn.
  // Inside a room, '#' is floor you walk on, not the dirt path it means
  // outdoors — but only where the map declares an interior floor, so Maple
  // Lane's actual path is untouched.
  const isFloorCode = code === '.' || code === ',' || (floor && code === '#');
  const keys = isFloorCode ? ground : TILE_SPRITES[code] || ground;
  const key = keys.length > 1 && code === '~' ? keys[frame % keys.length] : keys[variantFor(x, y, keys.length)];
  const sprite = SPRITES[key];
  if (!sprite) return <View style={{ width: s, height: s, backgroundColor: palette.grass }} />;
  // Fractional, not rounded: at a 24px tile a 16px sprite needs 1.5px cells.
  // Rounding to 2 rendered a 32px tile and clipped a quarter of it away, which
  // chopped the right-hand and bottom edges off every tile on the map.
  const px = s / sprite.grid[0].length;
  return (
    <View style={{ width: s, height: s, overflow: 'hidden' }}>
      <PixelArt grid={sprite.grid} palette={sprite.palette} pixelSize={px} />
    </View>
  );
}

// A person standing in the room is drawn over the floor, not baked into a tile:
// she has to be able to move or change sprite without the map being regenerated.
function StandingSprite({ spriteKey, s }) {
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <PixelSprite spriteKey={spriteKey} size={s * 1.15} />
    </View>
  );
}

export default function TileMap({ map, player, tileSize, style }) {
  const { state } = useGame();
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
  const floor = FLOOR_BY_MAP[map.id];
  const rows = useMemo(
    () =>
      map.grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, x) => (
            code === 'C' ? (
              <View key={x} style={{ width: s, height: s }}>
                <Tile code="." s={s} frame={frame} x={x} y={y} floor={floor} />
                <View style={{ position: 'absolute', left: 0, top: 0 }}>
                  <StandingSprite spriteKey={COACH_SPRITE} s={s} />
                </View>
              </View>
            ) : (
              <Tile key={x} code={code} s={s} frame={frame} x={x} y={y} floor={floor} />
            )
          ))}
        </View>
      )),
    [map, s, frame, floor]
  );

  const facing = player.facing || 'down';
  const spriteKey = playerSprite(state.playerGender, facing, stepFrame === 0 ? 1 : 2);

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
        <PixelSprite spriteKey={spriteKey} palette={outfitPalette(state.playerOutfit, state.playerGender)} size={s * 1.25} />
      </Animated.View>
    </View>
  );
}
