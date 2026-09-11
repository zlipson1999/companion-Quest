// Equipment is independent of the room painting: every usable object remains
// anchored to the same collision code, including stations used by Maple's tour.
import React from 'react';
import { Image, Platform, View } from 'react-native';
import TileImage from './TileImage';
import { GYM_RECTS, HOME_RECTS } from '../data/propBounds';

const GYM_ATLAS = require('../../assets/props/gym-equipment-v2.png');
const HOME_ATLAS = require('../../assets/props/home-furniture-v2.png');
const ATLAS_WIDTH = 1122;
const ATLAS_HEIGHT = 1402;
const CELLS = {
  R: 0, b: 1, z: 2, B: 3, K: 4, t: 5, c: 6, q: 7,
  U: 8, j: 9, S: 10, Q: 11, w: 12, L: 13, N: 14,
  J: 15, I: 15, x: 16, m: 17, Z: 18, r: 19,
};

function Equipment({ cell, width, height, home = false, stretch = false }) {
  const [x, y, w, h] = (home ? HOME_RECTS : GYM_RECTS)[cell];
  const scale = Math.min(width / w, height / h);
  const sx = stretch ? width / w : scale;
  const sy = stretch ? height / h : scale;
  // Preserve the authored silhouette; the layout box is a footprint limit,
  // not permission to squeeze round tables or stretch machine frames.
  return <View pointerEvents="none" style={{ width, height, alignItems: 'center', justifyContent: 'flex-end' }}>
    <View style={{ width: w * sx, height: h * sy, overflow: 'hidden' }}>
      <Image source={home ? HOME_ATLAS : GYM_ATLAS} fadeDuration={0} resizeMode="stretch" style={{
        position: 'absolute', left: -x * sx, top: -y * sy,
        width: ATLAS_WIDTH * sx, height: ATLAS_HEIGHT * sy,
        ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' } : {}),
      }} />
    </View>
  </View>;
}

export default function SceneProps({ map, s }) {
  if (map.id === 'home') return <HomeProps map={map} s={s} />;
  if (map.id !== 'gym') return null;
  const objects = [];
  map.grid.forEach((row, y) => [...row].forEach((code, x) => {
    const cell = CELLS[code];
    if (cell === undefined) {
      const trim = code === 'V' ? 'prop_banner' : code === 'O' ? 'prop_wall_clock' : null;
      if (trim) objects.push(<View key={`${x},${y}`} style={{ position: 'absolute', left: x * s, top: y * s }}><TileImage name={trim} size={s} /></View>);
      return;
    }
    let span = 1, depth = 1;
    // A counter/locker run is one object, not one miniature per letter.
    if (code === 'L' || code === 'N') {
      if (row[x - 1] === code) return;
      while (row[x + span] === code) span++;
    }
    if (code === 'J' || code === 'I') {
      if (row[x - 1] === 'J' || row[x - 1] === 'I') return;
      while (row[x + span] === 'J' || row[x + span] === 'I') span++;
    }
    // Tall machines occupy the existing two-cell footprint as a single unit.
    if (code === 'K' || code === 'z') {
      if (map.grid[y - 1]?.[x] === code) return;
      while (map.grid[y + depth]?.[x] === code) depth++;
    }
    const wide = code === 'R' || code === 'U' ? 1.8 : code === 'K' ? 1.25 : 1.12;
    const width = s * Math.max(span, wide);
    const height = s * (span > 1 ? 1.45 : depth > 1 ? depth : code === 'R' || code === 'U' ? 1.8 : 1.2);
    objects.push(<View key={`${x},${y}`} style={{ position: 'absolute', zIndex: (y + depth) * 10, left: (x + span / 2) * s - width / 2, top: (y + depth) * s - height }}>
      <Equipment cell={cell} width={width} height={height} stretch={span > 1} />
    </View>);
  }));
  return <>{objects}</>;
}

const HOME_CELLS = { n: 0, c: 1, u: 2, F: 3, a: 4, m: 5, f: 6, x: 7, v: 8, o: 9, l: 10, p: 11, e: 12, g: 13, P: 14, k: 15, s: 16, D: 17 };

function HomeProps({ map, s }) {
  const objects = [];
  (map.zones || []).filter(zone => zone.field === 'tile_home_rug').forEach((zone, i) => {
    objects.push(<View key={`rug-${i}`} style={{ position: 'absolute', left: zone.x0 * s, top: zone.y0 * s }}>
      <Equipment home stretch cell={18} width={(zone.x1 - zone.x0 + 1) * s} height={(zone.y1 - zone.y0 + 1) * s} />
    </View>);
  });
  map.grid.forEach((row, y) => [...row].forEach((code, x) => {
    const cell = HOME_CELLS[code];
    if (cell === undefined) return;
    let span = 1;
    if (code === 'f' || code === 'P') {
      if (row[x - 1] === code) return;
      while (row[x + span] === code) span++;
    }
    const depth = code === 'e' && map.grid[y + 1]?.[x] === 'E' ? 2 : 1;
    const width = s * (span > 1 ? span * 1.08 : code === 'a' || code === 'v' ? 1.35 : 1.12);
    const height = s * (depth > 1 ? 2.3 : code === 'o' || code === 'P' ? 1.8 : code === 'm' ? 0.9 : 1.4);
    objects.push(<View key={`${x},${y}`} style={{ position: 'absolute', zIndex: (y + depth) * 10, left: (x + span / 2) * s - width / 2, top: (y + depth) * s - height }}>
      <Equipment home cell={cell} width={width} height={height} />
    </View>);
  }));
  return <>{objects}</>;
}
