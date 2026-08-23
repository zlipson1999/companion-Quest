// One atmosphere for every place that shows a horizon.
//
// Route 1, the challenge stage, and the slack above Sunkist Lane used to
// each invent their own sky hex and a 4px haze line. Those copies drifted,
// and a flat colour against a grass field is a hard seam — the thing the
// field work was built to remove. Every outdoor sky is this table; interiors
// stay in VOID_BY_MAP and never call HorizonSky.
//
// Colours are discrete steps, not a CSS gradient. Pixel skies are scanlines.

import { palette } from '../theme/colors';

function parse(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(a, b, t) {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// zenith → sky → haze is the air. groundFar is the first dirt/grass the air
// dissolves into, so the join is a colour the tiles already own rather than
// a third colour invented at the seam.
export const SCENE_TONES = {
  maple: {
    zenith: '#243860', sky: '#4a6ea8', haze: '#8eb6dc',
    groundFar: '#4e8a5c', ground: palette.grassDark, disc: palette.grassTall,
    mapId: 'route_maple', codes: 'grass',
  },
  grass: {
    zenith: '#243860', sky: '#4a6ea8', haze: '#8eb6dc',
    groundFar: '#4e8a5c', ground: palette.grassDark, disc: palette.grassTall,
    mapId: 'route_maple', codes: 'grass',
  },
  cairn: {
    zenith: '#3a3a36', sky: '#5c5a52', haze: '#b0a890',
    groundFar: '#8a7a58', ground: '#6a5e42', disc: '#8a7a58',
    mapId: 'route_cairn', codes: 'earth',
  },
  gale: {
    zenith: '#3a7ab0', sky: '#6aa8dc', haze: '#d0e8f8',
    groundFar: '#d4c890', ground: palette.sand, disc: palette.sand,
    mapId: 'route_gale', codes: 'open',
  },
  trail: {
    zenith: '#3a5888', sky: '#5f7fb4', haze: '#9fc0e0',
    groundFar: '#d4c890', ground: palette.sand, disc: palette.sand,
    mapId: 'route_gale', codes: 'path',
  },
  canopy: {
    zenith: '#101810', sky: '#1c2a1a', haze: '#3a5a32',
    groundFar: '#2e4a28', ground: '#243820', disc: '#2e4a28',
    mapId: 'route_canopy', codes: 'shade',
  },
  rill: {
    zenith: '#1e3e52', sky: '#3a6a88', haze: '#8ec8d8',
    groundFar: '#4a8aa0', ground: '#3a6a78', disc: '#4a8aa0',
    mapId: 'route_rill', codes: 'open',
  },
  ember: {
    zenith: '#3a140c', sky: '#6a2a14', haze: '#d87838',
    groundFar: '#8a4a20', ground: '#5a3018', disc: '#8a4a20',
    mapId: 'route_ember', codes: 'earth',
  },
  dusk: {
    zenith: '#1e1630', sky: '#3a2c52', haze: '#8a6a9e',
    groundFar: '#4a3e58', ground: '#2e2438', disc: '#6b5d7a',
    mapId: 'route_maple', codes: 'grass',
  },
  hall: {
    zenith: '#16181e', sky: '#232833', haze: '#39404d',
    groundFar: '#2a3238', ground: '#1b2126', disc: '#4f8a7e',
    mapId: 'gym', codes: 'floor',
  },
};

export function sceneTone(id) {
  return SCENE_TONES[id] || SCENE_TONES.maple;
}

const SKY_WEIGHTS = [0.2, 0.17, 0.15, 0.13, 0.12, 0.1, 0.08, 0.05];

export function skyBands(tone) {
  const t = typeof tone === 'string' ? sceneTone(tone) : tone;
  const n = SKY_WEIGHTS.length;
  return SKY_WEIGHTS.map((weight, i) => ({
    color: mixHex(t.zenith, t.haze, i / (n - 1)),
    weight,
  }));
}

const HAZE_STOPS = [0.15, 0.35, 0.55, 0.75, 0.9];

export function hazeBands(tone) {
  const t = typeof tone === 'string' ? sceneTone(tone) : tone;
  return HAZE_STOPS.map((stop) => mixHex(t.haze, t.groundFar, stop));
}

export const OUTDOOR_WORLD_TONE = 'maple';
