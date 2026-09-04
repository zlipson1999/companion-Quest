// The drawn idle frame, checked across the whole roster.
//
// This runs over every sprite in the registry rather than a sample, because
// the frame is DERIVED: one algorithm meets 194 creatures that were each traced
// from their own artwork, and the way it fails is on the one shaped unlike the
// others — a floater with no feet, a sprite that fills its grid to the edge.
// Eyeballing six of them proves nothing about the other 188.
//
//   node --import ./tools/register-esm.mjs tools/test_idle.mjs

import { SPRITES } from '../src/data/sprites.js';
import { breathes, idleFrame, squashFrame, squashRows } from '../src/data/idleFrame.js';

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

const isCreature = (k) => !/^(tile_|prop_|item_|mod_|hero_|coach_|art_|portrait)/.test(k);
const creatures = Object.keys(SPRITES).filter(isCreature);
const inked = (grid) => grid.reduce((n, r) => n + [...r].filter((c) => c !== '.').length, 0);
const box = (grid) => {
  const ys = grid.map((r, y) => ([...r].some((c) => c !== '.') ? y : -1)).filter((y) => y >= 0);
  return ys.length ? { top: ys[0], bottom: ys[ys.length - 1] } : null;
};

ok('the roster is the whole roster', creatures.length > 150, `${creatures.length} creatures`);

// ---- the frame is actually a different drawing --------------------------

let unchanged = [];
let sameShape = [];
let grew = [];
let footMoved = [];
let lostTooMuch = [];

for (const key of creatures) {
  const grid = SPRITES[key].grid;
  const b = box(grid);
  if (!b || b.bottom - b.top + 1 < 32) continue;
  const sq = squashFrame(grid);
  const sb = box(sq);

  if (sq.join('\n') === grid.join('\n')) unchanged.push(key);
  if (sq.length !== grid.length || sq[0].length !== grid[0].length) sameShape.push(key);
  // The creature must get SHORTER, never taller.
  if (sb.bottom - sb.top >= b.bottom - b.top) grew.push(key);
  // The contact row is the whole point: a squash that lifts the feet is a
  // translate wearing a squash's clothes.
  if (sb.bottom !== b.bottom) footMoved.push(`${key} ${b.bottom}->${sb.bottom}`);
  // One row of a 96-row creature. Losing much more than a row's worth of ink
  // means the seam went through something that mattered.
  const lost = inked(grid) - inked(sq);
  if (lost > grid[0].length) lostTooMuch.push(`${key} lost ${lost}px`);
}

ok('every creature gets a genuinely different second frame',
  unchanged.length === 0, unchanged.slice(0, 6).join(', ') || `${creatures.length} differ`);
ok('the frame keeps the grid dimensions', sameShape.length === 0, sameShape.slice(0, 6).join(', '));
ok('the creature gets shorter, never taller', grew.length === 0, grew.slice(0, 6).join(', '));
ok('the feet stay planted', footMoved.length === 0, footMoved.slice(0, 4).join(', ') || 'contact row unmoved');
ok('the seam costs about a row and no more',
  lostTooMuch.length === 0, lostTooMuch.slice(0, 4).join(', '));

// ---- the seam lands in the body, not the face ---------------------------

// The face of a front-facing companion sits near the middle. If the seam
// wanders up there the expression warps, which is the one thing these sprites
// cannot afford to lose.
let seamTooHigh = [];
for (const key of creatures) {
  const grid = SPRITES[key].grid;
  const b = box(grid);
  if (!b || b.bottom - b.top + 1 < 32) continue;
  const sq = squashFrame(grid);
  // The seam is the first row where the two frames diverge; above it the art is
  // identical-but-shifted, below it untouched.
  let seam = -1;
  for (let y = 0; y < grid.length; y += 1) {
    if (grid[y] !== sq[y]) { seam = y; break; }
  }
  const h = b.bottom - b.top + 1;
  const frac = (seam - b.top) / h;
  // Divergence starts at the top of the shifted block, so what matters is where
  // the DELETED row was: the last row where they differ, going down.
  let last = -1;
  for (let y = grid.length - 1; y >= 0; y -= 1) {
    if (grid[y] !== sq[y]) { last = y; break; }
  }
  const lastFrac = (last - b.top) / h;
  if (lastFrac < 0.5 || lastFrac > 0.92) seamTooHigh.push(`${key} at ${(lastFrac * 100).toFixed(0)}%`);
  void frac;
}
ok('the seam lands in the body, below the face',
  seamTooHigh.length === 0, seamTooHigh.slice(0, 4).join(', ') || 'all between 50% and 92%');

// ---- small things are left alone ----------------------------------------

// Objects do not breathe, and size cannot tell you which is which: item_knot is
// a full 96x96 painted plate, the exact dimensions of a creature. The policy is
// explicit for that reason, so this checks the policy and not the geometry.
const objects = Object.keys(SPRITES).filter((k) => /^(tile_|prop_|item_|mod_|art_)/.test(k));
const objectTouched = objects.filter((k) => idleFrame(k, SPRITES[k].grid, 96) !== SPRITES[k].grid);
ok('tiles, props, items and icons are left alone', objectTouched.length === 0,
  objectTouched.slice(0, 5).join(', ') || `${objects.length} objects untouched`);
ok('a Kinship Knot does not inhale', !breathes('item_knot'));
ok('a creature does', breathes(creatures[0]), creatures[0]);

ok('an empty grid survives', squashFrame(['....', '....']).length === 2);
ok('a null grid survives', squashFrame(null) === null);

// ---- the squash is sized in POINTS, not in grid rows --------------------

// A grid row buys different amounts of screen at different render sizes. The
// same 96-row creature is drawn at 110 on the Forge and at 44 in the status
// strip, where one row is under half a point and the drawn frame is present but
// invisible. These are the sizes actually passed by the screens.
ok('a big sprite takes one row', squashRows(96, 110) === 1, `${squashRows(96, 110)}`);
ok('a battle sprite takes one row', squashRows(96, 96) === 1, `${squashRows(96, 96)}`);
ok('the status strip takes more', squashRows(96, 44) >= 2, `${squashRows(96, 44)} at size 44`);
ok('it never takes more than three', squashRows(96, 8) <= 3, `${squashRows(96, 8)}`);
ok('a missing size still yields a frame', squashRows(96, undefined) === 1);

// Taking two rows must still leave the feet planted and the face alone — the
// properties above were only checked at one row.
let twoRowBad = [];
for (const key of creatures) {
  const grid = SPRITES[key].grid;
  const b3 = box(grid);
  if (!b3 || b3.bottom - b3.top + 1 < 32) continue;
  const sq = squashFrame(grid, 2);
  const sb = box(sq);
  if (sb.bottom !== b3.bottom) twoRowBad.push(`${key} foot moved`);
  if (sb.bottom - sb.top !== b3.bottom - b3.top - 2) twoRowBad.push(`${key} lost ${b3.bottom - b3.top - (sb.bottom - sb.top)} rows`);
}
ok('two rows still plants the feet and takes exactly two',
  twoRowBad.length === 0, twoRowBad.slice(0, 4).join(', ') || 'checked every creature');

// ---- the cache is a cache -----------------------------------------------

const k0 = creatures[0];
const a = idleFrame(k0, SPRITES[k0].grid, 110);
const b2 = idleFrame(k0, SPRITES[k0].grid, 110);
ok('the frame is cached by key, not rebuilt', a === b2);
ok('a different render size gets its own frame, not the cached one',
  idleFrame(k0, SPRITES[k0].grid, 44) !== a);
// The registry is module state shared by every screen. Snapshot the rows before
// deriving anything and compare after — the earlier version of this compared
// the grid against a regex re-parse of sprites.js, which tested the parser.
const snapshot = creatures.slice(0, 40).map((k) => [k, SPRITES[k].grid.slice()]);
for (const [k] of snapshot) { idleFrame(k, SPRITES[k].grid, 110); idleFrame(k, SPRITES[k].grid, 44); }
const mutated = snapshot.filter(([k, rows]) =>
  SPRITES[k].grid.length !== rows.length || SPRITES[k].grid.some((r, i) => r !== rows[i]));
ok('deriving a frame never mutates the registry', mutated.length === 0,
  mutated.map(([k]) => k).join(', ') || `${snapshot.length} checked`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
