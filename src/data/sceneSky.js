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

  // Horizon trails — one atmosphere each. Grove tones above stay put.
  saltglass: {
    zenith: '#1a4a5c', sky: '#3a88a0', haze: '#b8e0dc',
    groundFar: '#c8b890', ground: '#b8a878', disc: '#d4c8a0',
    mapId: 'route_saltglass', codes: 'sand',
  },
  tideglass: {
    zenith: '#0c2438', sky: '#1e4a68', haze: '#4a8898',
    groundFar: '#3a4a52', ground: '#2a3840', disc: '#4a6870',
    mapId: 'route_tideglass', codes: 'reef',
  },
  suncrack: {
    zenith: '#5a280c', sky: '#c46828', haze: '#f0c070',
    groundFar: '#c88848', ground: '#a86830', disc: '#d49450',
    mapId: 'route_suncrack', codes: 'earth',
  },
  redmesa: {
    zenith: '#241008', sky: '#5a1c10', haze: '#c05028',
    groundFar: '#6a3020', ground: '#3a1810', disc: '#8a4030',
    mapId: 'route_redmesa', codes: 'earth',
  },
  reedwalk: {
    zenith: '#14201c', sky: '#243c34', haze: '#6a8870',
    groundFar: '#3a5a40', ground: '#243828', disc: '#4a6850',
    mapId: 'route_reedwalk', codes: 'marsh',
  },
  moonfen: {
    zenith: '#141428', sky: '#28244a', haze: '#7a6a98',
    groundFar: '#3a4850', ground: '#243038', disc: '#5a6a78',
    mapId: 'route_moonfen', codes: 'marsh',
  },
  needlesnow: {
    zenith: '#1c3048', sky: '#6a88a8', haze: '#d8e8f0',
    groundFar: '#b8c8c4', ground: '#8aa098', disc: '#d0dcd8',
    mapId: 'route_needlesnow', codes: 'snow',
  },
  frostpine: {
    zenith: '#101828', sky: '#203848', haze: '#88c0d0',
    groundFar: '#4a6070', ground: '#2a3848', disc: '#6a8898',
    mapId: 'route_frostpine', codes: 'cave',
  },
  echorail: {
    zenith: '#3a2818', sky: '#8a5a30', haze: '#d4a060',
    groundFar: '#8a6a48', ground: '#5a4630', disc: '#b88850',
    mapId: 'route_echorail', codes: 'earth',
  },
  copper: {
    zenith: '#2a2a28', sky: '#5a5850', haze: '#c8c0a8',
    groundFar: '#7a7468', ground: '#4a4840', disc: '#9a9488',
    mapId: 'route_copper', codes: 'earth',
  },
  cometgrass: {
    zenith: '#243868', sky: '#5a88c8', haze: '#e8d888',
    groundFar: '#c8c070', ground: '#8aaa58', disc: '#d4d080',
    mapId: 'route_cometgrass', codes: 'open',
  },
  starfall: {
    zenith: '#1c2048', sky: '#3a5088', haze: '#e8c878',
    groundFar: '#c8a848', ground: '#8a7a38', disc: '#d4b858',
    mapId: 'route_starfall', codes: 'open',
  },
  honeyfall: {
    zenith: '#304018', sky: '#6a8840', haze: '#e8d070',
    groundFar: '#7aaa48', ground: '#5a7830', disc: '#c8b050',
    mapId: 'route_honeyfall', codes: 'grass',
  },
  amber: {
    zenith: '#3a2010', sky: '#8a4820', haze: '#e8a050',
    groundFar: '#8a6030', ground: '#5a3818', disc: '#c87838',
    mapId: 'route_amber', codes: 'grass',
  },
  staticridge: {
    zenith: '#203040', sky: '#4a6888', haze: '#c0d8e8',
    groundFar: '#8a8a78', ground: '#5a5a50', disc: '#a8a898',
    mapId: 'route_staticridge', codes: 'earth',
  },
  thunderstep: {
    zenith: '#4868a0', sky: '#88b0d8', haze: '#f0f4f8',
    groundFar: '#c8d0c0', ground: '#889890', disc: '#d8e0d8',
    mapId: 'route_thunderstep', codes: 'open',
  },
  rootwater: {
    zenith: '#0c1814', sky: '#1a3028', haze: '#3a6858',
    groundFar: '#2a4a3c', ground: '#1a3028', disc: '#3a5a48',
    mapId: 'route_rootwater', codes: 'marsh',
  },
  mangrove: {
    zenith: '#08100c', sky: '#142018', haze: '#2a4a28',
    groundFar: '#243820', ground: '#182818', disc: '#3a5230',
    mapId: 'route_mangrove', codes: 'shade',
  },
  ringwood: {
    zenith: '#201828', sky: '#483850', haze: '#b898a8',
    groundFar: '#6a5a58', ground: '#4a3e40', disc: '#8a6a70',
    mapId: 'route_ringwood', codes: 'earth',
  },
  deephorizon: {
    zenith: '#101018', sky: '#1c1c30', haze: '#6a7098',
    groundFar: '#3a4058', ground: '#1c2030', disc: '#5a6280',
    mapId: 'route_deephorizon', codes: 'cave',
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
