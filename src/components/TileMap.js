// The top-down tile overworld, plus the walking hero.
//
// Tiles used to be flat coloured Views — a green square for grass, a brown one
// for a tree. That is the single biggest reason the overworld read as a mockup
// rather than a game. They are real 16x16 pixel tiles now, drawn by
// tools/make_sprites.py like everything else, with two-frame animation on water
// and a scattered second grass variant so large fields do not tile visibly.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, View } from 'react-native';
import TileImage, { hasTile } from './TileImage';
import { ROOM_LIGHT } from '../data/tileAtlas';
import PixelSprite from './PixelSprite';
import { palette } from '../theme';
import { SPRITES } from '../data/sprites';
import { outfitPalette } from '../data/outfits';
import { playerSprite, coachSprite, rowanSprite } from '../data/characters';
import { useGame } from '../state';

// Codes whose material is large enough to show its repeat get the same field
// treatment as the ground: a canopy or a roof reads as one mass rather than the
// same bush stamped in a row.
const FIELD_CODES = {
  T: 'tile_tree',
  W: 'tile_wall',
  h: 'tile_roof_rest',
  y: 'tile_roof_gym',
  // Packed-earth cairns on Cairn Cut. Reuses the gym block field so the
  // stone trail is not a second copy of Maple's tree line.
  '*': 'tile_gym_block',
};

// Interior walls are a different material from the outdoor stone, and a room
// says which it wants. A house using the outdoor wall read as a castle.
const WALL_FIELD_BY_MAP = { home: 'tile_home_wall', gym: 'tile_gym_block' };

// A roof needs somewhere to overhang. Any wall directly under one gets an eave
// drawn across its top: without it a building is two coloured rectangles
// stacked up rather than a thing with a front and a top.
const ROOF_CODES = new Set(['h', 'y']);
const BUILDING_WALL_CODES = new Set(['H', 'Y', 'D', 'd']);

// Tile code -> sprite key. Animated tiles list their frames.
const TILE_SPRITES = {
  '.': ['tile_grass', 'tile_grass_b'],
  ',': ['tile_flowers'],
  '#': ['tile_path', 'tile_path_b'],
  T: ['tile_tree', 'tile_tree_b'],
  '~': ['tile_water', 'tile_water_b'],
  h: ['tile_roof_rest'],
  y: ['tile_roof_gym'],
  H: ['tile_window'],
  Y: ['tile_window'],
  D: ['tile_door'],
  d: ['tile_door'],
  '^': ['tile_tallgrass'],
  // Quest Fitness interior
  W: ['tile_wall'],
  '=': ['tile_gym_wall'],
  '|': ['tile_gym_wall_side'],
  M: ['tile_gym_mirror', 'tile_gym_mirror_b'],
  X: ['tile_gym_exit'],
};

// Props are transparent overlays stacked on the room's own floor, so the same
// sofa works in any room and a prop never drags a mismatched patch of floor in
// with it.
const PROP_SPRITES = {
  e: 'prop_bed_head',
  E: 'prop_bed_foot',
  v: 'prop_tv',
  k: 'prop_desk',
  f: 'prop_sofa',
  a: 'prop_table',
  c: 'prop_counter',
  F: 'prop_fridge',
  s: 'prop_stairs',
  p: 'prop_plant',
  o: 'prop_bookshelf',
  L: 'prop_lockers',
  U: 'prop_pullup_bar',
  j: 'prop_kettlebells',
  q: 'prop_rower',
  N: 'prop_reception',
  r: 'prop_noticeboard',
  R: 'prop_rack_barbell',
  b: 'prop_rack_dumbbell',
  K: 'prop_machine',
  t: 'prop_treadmill',
  z: 'prop_ez_bars',
  S: 'prop_stretch_rig',
  Q: 'prop_ball_rack',
  J: 'prop_bar_counter',
  I: 'prop_bar_blender',
  n: 'prop_worktop',
  u: 'prop_oven',
  m: 'prop_chair',
  x: 'prop_coffee_table',
  l: 'prop_lamp',
  P: 'prop_wardrobe',
  g: 'prop_nightstand',
  i: 'prop_signpost',
  '!': 'prop_lamppost',
  '+': 'prop_park_bench',
  '%': 'prop_mailbox',
  '-': 'prop_fence',
  B: 'prop_bench',
  w: 'prop_water_station',
  V: 'prop_banner',
  O: 'prop_wall_clock',
  Z: 'prop_whiteboard',
};

// Floor zones are REGIONS a map declares, not tile codes.
//
// As codes they could only ever be the floor a tile WAS, so the moment a rack
// went on a square the platform under it vanished and the rack stood on rubber
// in the middle of the wood. A zone is an area; what stands on it is a separate
// question, which is also how a real floor plan is drawn.
function zoneAt(map, x, y) {
  if (!map || !map.zones) return null;
  for (const z of map.zones) {
    if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return z.field;
  }
  return null;
}

// The joint where a zone stops. Wood, turf and matting used to butt straight
// against the rubber, and a dead-straight value step four tiles long reads as a
// grid line even when neither material does.
function zoneEdges(map, x, y, field) {
  const out = [];
  for (const [side, dx, dy] of [['n', 0, -1], ['e', 1, 0], ['s', 0, 1], ['w', -1, 0]]) {
    if (zoneAt(map, x + dx, y + dy) !== field) out.push({ key: `tile_zone_${side}`, opacity: 0.34 });
  }
  return out;
}

// Props that belong to a wall rather than a floor.
const WALL_DRESSING = new Set(['V', 'O', 'Z']);

// Some furniture is wider than one tile. Drawn whole in every tile it occupies,
// a two-tile sofa is two sofas with four arms, and a two-tile wardrobe is two
// wardrobes — the same mistake as the kitchen run where every counter had its
// own sink. A run prop picks an end from its own neighbours, exactly the way a
// path picks its edge, so a piece of furniture can be as wide as it needs to be.
const RUN_PROPS = new Set(['f', 'P', '-']);

function runSuffix(map, code, x, y) {
  const left = codeAt(map, x - 1, y) === code;
  const right = codeAt(map, x + 1, y) === code;
  if (left && right) return '_m';
  if (right) return '_l';
  if (left) return '_r';
  return '';
}

// Ground is a FIELD, not a tile: one texture windowed across a FIELD_SPAN block
// so it runs continuously and its repeat is four tiles apart instead of one.
// A 16x16 tile stamped everywhere puts a seam on every square, which is what
// makes a floor read as a grid of chunks however good the tile itself is.
const FIELD_SPAN = 4;

const GROUND_FIELD = 'tile_grass';
const FIELD_BY_MAP = {
  gym: 'tile_gym_floor',
  home: 'tile_home_floor',
  route_cairn: 'tile_gym_platform',
  route_canopy: 'tile_gym_turf',
  route_ember: 'tile_gym_mats',
  // Horizon trails pick a floor the biome already owns. No new tile art.
  route_saltglass: 'tile_grass',
  route_tideglass: 'tile_gym_platform',
  route_suncrack: 'tile_gym_mats',
  route_redmesa: 'tile_gym_mats',
  route_reedwalk: 'tile_gym_turf',
  route_moonfen: 'tile_gym_turf',
  route_needlesnow: 'tile_grass',
  route_frostpine: 'tile_gym_floor',
  route_echorail: 'tile_gym_platform',
  route_copper: 'tile_gym_platform',
  route_cometgrass: 'tile_grass',
  route_starfall: 'tile_grass',
  route_honeyfall: 'tile_grass',
  route_amber: 'tile_gym_mats',
  route_staticridge: 'tile_gym_platform',
  route_thunderstep: 'tile_grass',
  route_rootwater: 'tile_gym_turf',
  route_mangrove: 'tile_gym_turf',
  route_ringwood: 'tile_gym_platform',
  route_deephorizon: 'tile_gym_floor',
};

function groundKey(prefix, x, y) {
  const col = ((x % FIELD_SPAN) + FIELD_SPAN) % FIELD_SPAN;
  const row = ((y % FIELD_SPAN) + FIELD_SPAN) % FIELD_SPAN;
  return `${prefix}_f${row * FIELD_SPAN + col}`;
}

const WATER_FRAME_MS = 620;
// Same duration as the step tween. After it the figure is parked and must
// return to stand frame 0 — leaving them on a stride is what froze people
// mid-step once they stopped walking.
const STEP_MS = 120;

// --- autotiling ----------------------------------------------------------
//
// A path drawn as one sprite per square butts a hard edge against the grass,
// and the eye follows those straight seams and sees the grid rather than the
// ground. Each material now picks a sprite from which of its cardinal
// neighbours are the same material, so its edges pull back and feather only
// where the material actually ends. Diagonals are four small overlay sprites
// rather than a 256-entry mask.
const N = 1;
const E = 2;
const S = 4;
const W_ = 8;

// A gate stands in the middle of the trail, so the trail runs through it.
const PATH_CODES = new Set(['#', 'G']);
const WATER_CODES = new Set(['~']);

// Anything solid enough to drop shade onto the ground beside it. World light is
// upper-left, so a caster darkens the ground to its south and east.
const SHADOW_CASTERS = new Set([
  'T', '*', 'W', 'H', 'Y', 'h', 'y', 'D', 'd', 'G',
  '=', '|', 'M', 'R', 'b', 'K', 't', 'B', 'w',
  'e', 'E', 'v', 'k', 'f', 'a', 'c', 'F', 'o',
  'L', 'U', 'j', 'q', 'N', 'z', 'S', 'Q', 'J', 'I',
  'n', 'u', 'm', 'x', 'l', 'P', 'g',
  'i', '!', '+', '%', '-',
]);

function codeAt(map, x, y) {
  if (y < 0 || y >= map.grid.length) return null;
  const row = map.grid[y];
  if (x < 0 || x >= row.length) return null;
  return row[x];
}

// Off-map counts as more of the same material, so a trail runs off the edge of
// the screen instead of stopping in a rounded cap at the border.
function isMember(map, x, y, members) {
  const code = codeAt(map, x, y);
  if (code === null) return true;
  return members.has(code);
}

function maskAt(map, x, y, members) {
  return (
    (isMember(map, x, y - 1, members) ? N : 0) |
    (isMember(map, x + 1, y, members) ? E : 0) |
    (isMember(map, x, y + 1, members) ? S : 0) |
    (isMember(map, x - 1, y, members) ? W_ : 0)
  );
}

// A notch of ground belongs at a diagonal where the material wraps an outside
// corner: both neighbours along that corner are material, the corner itself is
// not.
const DIAGONALS = [
  { name: 'nw', a: [0, -1], b: [-1, 0], d: [-1, -1] },
  { name: 'ne', a: [0, -1], b: [1, 0], d: [1, -1] },
  { name: 'sw', a: [0, 1], b: [-1, 0], d: [-1, 1] },
  { name: 'se', a: [0, 1], b: [1, 0], d: [1, 1] },
];

function innerCorners(map, x, y, members, prefix) {
  const out = [];
  for (const { name, a, b, d } of DIAGONALS) {
    if (
      isMember(map, x + a[0], y + a[1], members) &&
      isMember(map, x + b[0], y + b[1], members) &&
      !isMember(map, x + d[0], y + d[1], members)
    ) {
      out.push({ key: `${prefix}_ic_${name}` });
    }
  }
  return out;
}

// Grass gets a stable per-cell variant so the field looks scattered rather than
// checkerboarded — derived from the coordinates, not random, so it never
// reshuffles on re-render.
function variantFor(x, y, count) {
  if (count <= 1) return 0;
  const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
  // Detail variants are accents, not an even shuffle. Spreading four tiles
  // evenly over a field just replaces the old grid with a patchwork of lighter
  // and darker squares — the same problem wearing a different colour. Most
  // cells stay on the plain tile and the rest are scattered thinly through it.
  if (h % 100 < 64) return 0;
  return 1 + ((h >>> 8) % (count - 1));
}

// The full stack for one cell: ground, material, diagonal notches, shading.
function layersFor(map, code, x, y, frame, floor, wallField) {
  const zoneField = zoneAt(map, x, y);
  const ground = groundKey(zoneField || floor || GROUND_FIELD, x, y);
  const edges = zoneField ? zoneEdges(map, x, y, zoneField) : [];
  // What the CODE is, not where it is. Folding `zoneField` in here meant every
  // square inside a zone counted as bare floor, so the whole rack row drew as
  // empty platform: the props never reached their own branch.
  const isFloorCode = code === '.' || code === ',';

  let layers;
  // The gate takes the path's own autotiling. It used to render a wooden door
  // standing in the tree line, which is a door to nowhere — the way out of town
  // is the trail carrying on north, so the trail carries on north.
  // Path is always a path, even when the map has a field floor. Treating '#' as
  // the field when `floor` was set made Cairn Cut and Canopy Run one continuous
  // slab with the lane painted out — the same grass-strip mistake wearing a
  // different texture. Indoor cardio no longer uses this screen, so the gym
  // does not need '#' to mean rubber.
  if (PATH_CODES.has(code)) {
    const mask = maskAt(map, x, y, PATH_CODES);
    layers = [{ key: `tile_path_m${mask}` }, ...innerCorners(map, x, y, PATH_CODES, 'tile_path')];
  } else if (!floor && WATER_CODES.has(code)) {
    const mask = maskAt(map, x, y, WATER_CODES);
    const suffix = frame % 2 ? '_b' : '';
    layers = [
      { key: `tile_water_m${mask}${suffix}` },
      ...innerCorners(map, x, y, WATER_CODES, 'tile_water'),
    ];
  } else if (isFloorCode) {
    // Flowers are an overlay now, so the ground runs on underneath them.
    layers = code === ',' && !floor
      ? [{ key: ground }, ...edges, { key: 'prop_flowers' }]
      : [{ key: ground }, ...edges];
  } else if (PROP_SPRITES[code]) {
    // Wall dressing hangs on the wall, not on the floor.
    const onWall = WALL_DRESSING.has(code);
    const under = onWall ? groundKey(wallField || GROUND_FIELD, x, y) : ground;
    const prop = PROP_SPRITES[code] + (RUN_PROPS.has(code) ? runSuffix(map, code, x, y) : '');
    layers = [{ key: under }, ...(onWall ? [] : edges), { key: prop }];
  } else if (FIELD_CODES[code]) {
    const wall = code === 'W' && wallField ? wallField : FIELD_CODES[code];
    layers = [{ key: groundKey(wall, x, y) }];
  } else {
    const keys = TILE_SPRITES[code];
    // No tile of its own means somebody is standing here — TileMap draws the
    // person over the floor, so the floor still owes its zone and its edges.
    layers = keys
      ? [{ key: keys[variantFor(x, y, keys.length)] }]
      : [{ key: ground }, ...edges];
  }

  if (BUILDING_WALL_CODES.has(code) && ROOF_CODES.has(codeAt(map, x, y - 1))) {
    layers.push({ key: 'prop_eave' });
  }
  // ...and the top of a roof gets its ridge, from the same kind of test. A
  // building's form comes out of its own shape rather than out of extra codes
  // somebody has to remember to place.
  if (ROOF_CODES.has(code) && !ROOF_CODES.has(codeAt(map, x, y - 1))) {
    layers.push({ key: 'prop_ridge' });
  }

  // Contact shading, only onto ground the player can see past — a wall does not
  // need shade painted over its own face.
  const shadable =
    isFloorCode || PATH_CODES.has(code) || WATER_CODES.has(code) || code === '^' || !!PROP_SPRITES[code];
  if (shadable) {
    const north = SHADOW_CASTERS.has(codeAt(map, x, y - 1));
    const west = SHADOW_CASTERS.has(codeAt(map, x - 1, y));
    const sides = `${north ? 'n' : ''}${west ? 'w' : ''}`;
    if (sides) layers.push({ key: `tile_ao_${sides}`, opacity: 0.34 });
  }
  return layers;
}

export function Tile({ code, s, frame, x, y, floor, map, wallField }) {
  // Derive from the map when the caller has not said. RouteScreen renders Tile
  // directly rather than through TileMap, so without this its indoor cardio
  // scene came out standing on grass.
  const ground = floor || (map && FIELD_BY_MAP[map.id]);
  const walls = wallField || (map && WALL_FIELD_BY_MAP[map.id]);
  const layers = map
    ? layersFor(map, code, x, y, frame, ground, walls)
    : [{ key: groundKey(ground || GROUND_FIELD, x, y) }];
  if (!hasTile(layers[0] && layers[0].key)) {
    return <View style={{ width: s, height: s, backgroundColor: palette.grass }} />;
  }
  return (
    <View style={{ width: s, height: s }}>
      {layers.map((layer, i) => (
        <TileImage key={layer.key + i} name={layer.key} size={s} opacity={layer.opacity} layered={i > 0} />
      ))}
    </View>
  );
}

// Characters are traced from the cards, so their sprites are tall and slim
// rather than a square block. Sizing by width would make a 26x48 figure nearly
// twice the height of the old one; every character is placed by the height it
// should stand, and its width follows from its own aspect.
function widthForHeight(spriteKey, targetHeight) {
  const sprite = SPRITES[spriteKey];
  if (!sprite) return targetHeight;
  return targetHeight * (sprite.grid[0].length / sprite.grid.length);
}

// A person standing in the room is drawn over the floor, not baked into a tile:
// she has to be able to move or change sprite without the map being regenerated.
function StandingSprite({ spriteKey, s }) {
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <PixelSprite spriteKey={spriteKey} size={widthForHeight(spriteKey, s * 1.85)} />
    </View>
  );
}

// A guided NPC — Coach Maple leading the gym tour. Moves and animates exactly
// like the player so a step reads as a step, not a teleport.
function Walker({ walker, s }) {
  const pos = useRef(new Animated.ValueXY({ x: walker.x * s, y: walker.y * s })).current;
  const [wf, setWf] = useState(0);
  const last = useRef(`${walker.x},${walker.y}`);
  const park = useRef(null);
  useEffect(() => {
    Animated.timing(pos, { toValue: { x: walker.x * s, y: walker.y * s }, duration: STEP_MS, useNativeDriver: true }).start();
    const key = `${walker.x},${walker.y}`;
    if (key !== last.current) {
      last.current = key;
      setWf((f) => (f === 1 ? 2 : 1));
      if (park.current) clearTimeout(park.current);
      park.current = setTimeout(() => setWf(0), STEP_MS);
    }
  }, [walker.x, walker.y, s, pos]);
  useEffect(() => () => { if (park.current) clearTimeout(park.current); }, []);
  const key = (walker.kind === 'rowan' ? rowanSprite : coachSprite)(walker.facing || 'down', wf);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: s,
        height: s,
        alignItems: 'center',
        justifyContent: 'flex-end',
        transform: [{ translateX: pos.x }, { translateY: pos.y }],
      }}
    >
      <PixelSprite spriteKey={key} size={widthForHeight(key, s * 1.85)} />
    </Animated.View>
  );
}

export default function TileMap({ map, player, tileSize, style, viewport, walker }) {
  const { state } = useGame();
  const s = tileSize;
  const pos = useRef(new Animated.ValueXY({ x: player.x * s, y: player.y * s })).current;
  const worldW = map.cols * s;
  const worldH = map.rows * s;

  // Camera. Without one the map has to shrink until it fits, which is what put
  // the world in a box at the top of the phone. With one the tiles can be as
  // big as they like and the world scrolls under the player instead.
  //
  // A map smaller than the viewport in an axis is centred rather than pinned,
  // so a small room sits in the middle of the screen instead of in a corner.
  const cameraFor = (px, py) => {
    if (!viewport) return { x: 0, y: 0 };
    const cx = worldW <= viewport.width
      ? (viewport.width - worldW) / 2
      : Math.max(viewport.width - worldW, Math.min(0, viewport.width / 2 - (px + 0.5) * s));
    const cy = worldH <= viewport.height
      ? (viewport.height - worldH) / 2
      : Math.max(viewport.height - worldH, Math.min(0, viewport.height / 2 - (py + 0.5) * s));
    return { x: cx, y: cy };
  };
  const cam = useRef(new Animated.ValueXY(cameraFor(player.x, player.y))).current;
  const [frame, setFrame] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const lastPos = useRef(`${player.x},${player.y}`);
  const parkTimer = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setFrame((f) => f + 1), WATER_FRAME_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => {
    if (parkTimer.current) clearTimeout(parkTimer.current);
  }, []);

  useEffect(() => {
    Animated.timing(pos, { toValue: { x: player.x * s, y: player.y * s }, duration: STEP_MS, useNativeDriver: true }).start();
    // Advance the walk cycle only on an actual move, so bumping a wall does not
    // make the hero jog on the spot. Once the tween finishes they are parked
    // and the stand pose (frame 0) comes back.
    const key = `${player.x},${player.y}`;
    if (key !== lastPos.current) {
      lastPos.current = key;
      setWalkFrame((f) => (f === 1 ? 2 : 1));
      if (parkTimer.current) clearTimeout(parkTimer.current);
      parkTimer.current = setTimeout(() => setWalkFrame(0), STEP_MS);
    }
  }, [player.x, player.y, s, pos]);

  useEffect(() => {
    if (!viewport) return;
    // Same duration as the step, so the world slides with the character rather
    // than chasing them.
    Animated.timing(cam, { toValue: cameraFor(player.x, player.y), duration: STEP_MS, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.x, player.y, s, viewport && viewport.width, viewport && viewport.height]);

  // Rows are static once the map is set; only the player and water move.
  const floor = FIELD_BY_MAP[map.id];
  const wallField = WALL_FIELD_BY_MAP[map.id];
  const rows = useMemo(
    () =>
      map.grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, x) => (
            code === 'C' || code === 'A' ? (
              <View key={x} style={{ width: s, height: s }}>
                <Tile code="." s={s} frame={frame} x={x} y={y} floor={floor} map={map} wallField={wallField} />
                <View style={{ position: 'absolute', left: 0, top: 0 }}>
                  <StandingSprite
                    spriteKey={code === 'A' ? rowanSprite('down', 0) : coachSprite('down', 0)}
                    s={s}
                  />
                </View>
              </View>
            ) : (
              <Tile key={x} code={code} s={s} frame={frame} x={x} y={y} floor={floor} map={map} wallField={wallField} />
            )
          ))}
        </View>
      )),
    [map, s, frame, floor, wallField]
  );

  const facing = player.facing || 'down';
  const spriteKey = playerSprite(state.playerGender, facing, walkFrame);

  const world = (
    <Animated.View
      style={[
        { width: worldW, height: worldH, backgroundColor: palette.grassDark, overflow: 'hidden' },
        viewport ? { position: 'absolute', transform: [{ translateX: cam.x }, { translateY: cam.y }] } : null,
        viewport ? null : style,
      ]}
    >
      {rows}
      {/* Room lighting. Every other shading cue is baked per tile and so
          repeats with the field; this one image describes the whole space —
          open in the middle, sitting back at the edges. Drawn under the player
          so the character stays legible wherever they stand. */}
      <Image
        source={ROOM_LIGHT}
        resizeMode="stretch"
        pointerEvents="none"
        fadeDuration={0}
        style={{ position: 'absolute', left: 0, top: 0, width: map.cols * s, height: map.rows * s }}
      />
      {walker ? <Walker walker={walker} s={s} /> : null}
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
        <PixelSprite
          spriteKey={spriteKey}
          palette={outfitPalette(state.playerOutfit, state.playerGender)}
          size={widthForHeight(spriteKey, s * 1.85)}
        />
      </Animated.View>
    </Animated.View>
  );

  if (!viewport) return world;
  return (
    <View style={[{ width: viewport.width, height: viewport.height, overflow: 'hidden' }, style]}>
      {world}
    </View>
  );
}
