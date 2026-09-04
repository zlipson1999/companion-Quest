// The downsampled drawing, checked across the roster.
//
// `PixelArt` lays one View per run of pixels at `size / cols` points each. That
// is exact while a sprite pixel is worth at least a device pixel and falls
// apart when it is not: the layout has to snap sub-pixel boxes, so neighbouring
// runs merge and colours drop. Creature grids are 96 rows and the screens drew
// them at 44 — 0.92 device pixels per sprite pixel.
//
//   node --import ./tools/register-esm.mjs tools/test_lod.mjs

import { SPRITES, SPRITE_PALETTES } from '../src/data/sprites.js';
import { halveGrid, lodGrid, lodSteps } from '../src/data/spriteLod.js';

let pass = 0;
let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`ok   ${name}${detail ? '  ' + detail : ''}`);
  } else {
    fail += 1;
    console.log(`FAIL ${name}${detail ? '  ' + detail : ''}`);
  }
}

const creatures = Object.keys(SPRITES).filter(
  (k) => !/^(tile_|prop_|item_|mod_|hero_|coach_|art_|portrait)/.test(k)
);
ok('the roster is the whole roster', creatures.length > 150, `${creatures.length} sprites`);

// ---- when to drop resolution --------------------------------------------

// The sizes the screens actually ask for, at a 2x screen.
ok('battle keeps the full grid', lodSteps(96, 96, 2) === 0);
ok('the Forge keeps the full grid', lodSteps(96, 110, 2) === 0);
ok('a 72pt companion keeps the full grid', lodSteps(96, 72, 2) === 0, 'exactly 1.5 device px');
ok('the old 44pt strip would have dropped a level', lodSteps(96, 44, 2) >= 1);
ok('a tiny follower drops further', lodSteps(96, 24, 2) >= 2);
ok('it never grinds a creature below 24 rows',
  lodSteps(96, 1, 2) <= 2, `${lodSteps(96, 1, 2)} steps from 96`);
ok('a 1x screen needs the drop sooner than a 2x one',
  lodSteps(96, 60, 1) > lodSteps(96, 60, 2));

// ---- the halved drawing is a real drawing -------------------------------

let wrongSize = [];
let newColours = [];
let vanished = [];
let allInk = [];
for (const key of creatures) {
  const s = SPRITES[key];
  const half = halveGrid(s.grid, s.palette);
  if (half.length !== Math.floor(s.grid.length / 2)
    || half[0].length !== Math.floor(s.grid[0].length / 2)) {
    wrongSize.push(key);
  }
  const table = SPRITE_PALETTES[s.palette] || [];
  const ALPHABET = '!#$%&()*+,-/0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  // Re-quantising must land on the sprite's OWN palette — inventing a colour
  // would break the indexed encoding the whole pipeline rests on.
  for (const row of half) {
    for (const ch of row) {
      if (ch === '.') continue;
      const i = ALPHABET.indexOf(ch);
      if (i < 0 || i >= table.length || typeof table[i] !== 'string') {
        newColours.push(`${key}: '${ch}'`);
      }
    }
  }
  const inkFull = s.grid.reduce((n, r) => n + [...r].filter((c) => c !== '.').length, 0);
  const inkHalf = half.reduce((n, r) => n + [...r].filter((c) => c !== '.').length, 0);
  if (inkHalf === 0 && inkFull > 0) vanished.push(key);
  // A silhouette must neither erode nor fatten wholesale: a quarter of the area
  // means the ink should land near a quarter of the pixels.
  const ratio = inkHalf / (inkFull / 4);
  if (ratio < 0.7 || ratio > 1.3) allInk.push(`${key} ${ratio.toFixed(2)}x`);
}

ok('halving gives exactly half the grid', wrongSize.length === 0, wrongSize.slice(0, 5).join(', '));
ok('no colour is invented outside the sprite\'s palette',
  newColours.length === 0, newColours.slice(0, 5).join(', ') || `${creatures.length} sprites`);
ok('nothing disappears entirely', vanished.length === 0, vanished.slice(0, 5).join(', '));
ok('the silhouette neither erodes nor fattens',
  allInk.length === 0, allInk.slice(0, 5).join(', ') || 'all within 30% of a quarter');

// ---- lodGrid ------------------------------------------------------------

const k0 = creatures[0];
const s0 = SPRITES[k0];
ok('a comfortable size is returned untouched',
  lodGrid(k0, s0.grid, s0.palette, 110, 2) === s0.grid);
const small = lodGrid(k0, s0.grid, s0.palette, 30, 2);
ok('a cramped size gets a smaller drawing', small.length < s0.grid.length,
  `${s0.grid.length} -> ${small.length}`);
ok('the result is cached', lodGrid(k0, s0.grid, s0.palette, 30, 2) === small);
ok('no size returns the original', lodGrid(k0, s0.grid, s0.palette, 0, 2) === s0.grid);

const before = s0.grid.slice();
lodGrid(k0, s0.grid, s0.palette, 30, 2);
ok('the registry is never mutated',
  s0.grid.length === before.length && s0.grid.every((r, i) => r === before[i]));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
