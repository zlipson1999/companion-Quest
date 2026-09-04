// A smaller drawing of a sprite, for when the screen cannot fit the big one.
//
// `PixelArt` renders one View per run of pixels at `size / cols` points each.
// That is exact when a sprite pixel is worth at least a device pixel, and it
// falls apart when it is not: the layout engine has to snap sub-pixel boxes
// somewhere, so neighbouring runs merge and colours drop. Detail does not get
// smaller, it gets destroyed.
//
// Creature grids are 96x96. The player's is 32x52. Drawn at the same physical
// size the creature is asking for nearly four times the density, and the call
// sites make it worse by drawing creatures SMALLER than people:
//
//     player in the world      52 rows at  48pt  ->  1.85 device px per pixel
//     companion, status strip  96 rows at  44pt  ->  0.92
//     companion, follower      96 rows at  35pt  ->  0.73
//     companion, battle        96 rows at  96pt  ->  2.00
//
// Which is exactly where they looked right and where they looked like a blob.
//
// So this is a mipmap. Each output pixel is the average of the 2x2 block under
// it, re-quantised to the sprite's OWN palette so nothing new is invented and
// the indexed encoding still holds. Averaging is the part that matters: it is
// what makes a downsample carry the detail it is dropping, rather than picking
// one of four pixels and discarding the rest, which is what the layout rounding
// was already doing badly.

import { SPRITE_PALETTES } from './sprites';

// Below this many device pixels per sprite pixel, runs start merging. Two is
// the comfortable figure — the player sits at 1.85 and reads perfectly — so
// halve until we are at least here, or until halving would cost more than the
// blur it prevents.
const MIN_DENSITY = 1.5;

// Never go below this many rows. A creature at 12x12 is a smudge whatever the
// resampling; at that point the call site is asking for something too small to
// be a creature and should be asking for an icon.
const MIN_ROWS = 24;

const ALPHABET = '!#$%&()*+,-/0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const INDEX = {};
for (let i = 0; i < ALPHABET.length; i += 1) INDEX[ALPHABET[i]] = i;

const cache = new Map();
const rgbCache = new Map();

function parse(hex) {
  const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// The palette as RGB triples, with a null wherever an entry is not a colour
// ('transparent' sits at index 0 of every sprite palette).
function paletteRgb(palette) {
  const hit = rgbCache.get(palette);
  if (hit) return hit;
  const list = Array.isArray(palette) ? palette : SPRITE_PALETTES[palette];
  const out = (list || []).map((c) => (typeof c === 'string' && c.startsWith('#') ? parse(c) : null));
  rgbCache.set(palette, out);
  return out;
}

// The character whose colour is closest to an RGB value. Squared distance is
// enough — these palettes are short ramps of one hue, not a photographic gamut,
// so a perceptual metric would pick the same entry and cost more.
function nearestChar(rgb, pal) {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < pal.length; i += 1) {
    const c = pal[i];
    if (!c) continue;
    const dr = c[0] - rgb[0];
    const dg = c[1] - rgb[1];
    const db = c[2] - rgb[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best < 0 ? '.' : ALPHABET[best];
}

// Halve a grid. Each output pixel averages the up-to-four source pixels beneath
// it; it is transparent when fewer than half of them carried ink, so a
// silhouette neither erodes nor fattens by a whole pixel.
export function halveGrid(grid, palette) {
  const pal = paletteRgb(palette);
  const h = grid.length;
  const w = grid[0].length;
  const oh = Math.floor(h / 2);
  const ow = Math.floor(w / 2);
  const out = new Array(oh);
  for (let y = 0; y < oh; y += 1) {
    let row = '';
    for (let x = 0; x < ow; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = 0; dy < 2; dy += 1) {
        const src = grid[y * 2 + dy];
        if (!src) continue;
        for (let dx = 0; dx < 2; dx += 1) {
          const ch = src[x * 2 + dx];
          if (ch === undefined || ch === '.') continue;
          const c = pal[INDEX[ch]];
          if (!c) continue;
          r += c[0]; g += c[1]; b += c[2]; n += 1;
        }
      }
      row += n < 2 ? '.' : nearestChar([r / n, g / n, b / n], pal);
    }
    out[y] = row;
  }
  return out;
}

// How many times to halve a grid of `rows` shown at `size` points.
export function lodSteps(rows, size, ratio) {
  if (!rows || !size) return 0;
  const dpr = ratio || 1;
  let steps = 0;
  let r = rows;
  while ((size * dpr) / r < MIN_DENSITY && Math.floor(r / 2) >= MIN_ROWS) {
    r = Math.floor(r / 2);
    steps += 1;
  }
  return steps;
}

// The grid to actually draw. Returns the original when it already fits, so
// battle and the Forge — the places creatures were always crisp — are untouched.
//
// `ratio` is the device pixel ratio, passed in rather than read here: this
// module stays free of react-native so the resampling can be checked over the
// whole roster in node, which is the only way to catch the one sprite the
// averaging ruins.
export function lodGrid(key, grid, palette, size, ratio) {
  if (!grid || !grid.length || !size) return grid;
  const steps = lodSteps(grid.length, size, ratio);
  if (steps <= 0) return grid;
  const id = `${key || 'anon'}@${palette}@${steps}`;
  const hit = cache.get(id);
  if (hit) return hit;
  let out = grid;
  for (let i = 0; i < steps; i += 1) out = halveGrid(out, palette);
  cache.set(id, out);
  return out;
}
