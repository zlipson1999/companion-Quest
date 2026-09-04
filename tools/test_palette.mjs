// Every sprite decoded against the colours it was drawn in.
//
// This has been the same bug three times — the player as a blue ghost, every
// trail keeper in battle, then 179 of the 190 creatures — and the first two
// were fixed at the call site rather than at the rule, which is why the third
// survived. This checks the rule, over the whole roster, so there is no fourth.
//
// It would not have needed a clever test. Groveheart is drawn on
// `art_groveheart` and every screen passed `grove`; comparing those two strings
// for all 190 creatures is the entire check, and nothing was doing it.
//
//   node --import ./tools/register-esm.mjs tools/test_palette.mjs

import { CREATURES } from '../src/data/creatures.js';
import { SPRITES, SPRITE_PALETTES } from '../src/data/sprites.js';
import { isTraced, paletteFor } from '../src/data/spritePalette.js';

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

const ids = Object.keys(CREATURES);
ok('the roster is the whole roster', ids.length > 150, `${ids.length} creatures`);

// ---- the rule ------------------------------------------------------------

let overridden = [];
let unresolved = [];
let tracedCount = 0;
for (const id of ids) {
  const c = CREATURES[id];
  const sprite = SPRITES[c.sprite];
  if (!sprite) continue;
  const chosen = paletteFor(sprite, c.palette);
  if (isTraced(sprite.palette)) {
    tracedCount += 1;
    // The whole point: what the screens pass must not be able to win.
    if (chosen !== sprite.palette) overridden.push(`${id}: got ${chosen}, art is ${sprite.palette}`);
  }
  const table = SPRITE_PALETTES[chosen];
  if (!table) unresolved.push(`${id}: palette "${chosen}" is not in SPRITE_PALETTES`);
}

ok('most of the roster is traced art', tracedCount > 150, `${tracedCount} traced`);
ok('a passed palette can never override traced art',
  overridden.length === 0, overridden.slice(0, 5).join('; ') || `${tracedCount} checked`);
ok('every chosen palette exists', unresolved.length === 0, unresolved.slice(0, 5).join('; '));

// This is the assertion that would have caught the shipped bug on its own: the
// screens were passing something DIFFERENT from the art's own palette for 179
// creatures, and that mismatch is fine only because the rule now ignores it.
const mismatched = ids.filter((id) => {
  const c = CREATURES[id];
  const s = SPRITES[c.sprite];
  return s && c.palette && c.palette !== s.palette;
});
ok('creature.palette still disagrees with the art, and no longer matters',
  mismatched.every((id) => paletteFor(SPRITES[CREATURES[id].sprite], CREATURES[id].palette)
    === SPRITES[CREATURES[id].sprite].palette),
  `${mismatched.length} disagree, all resolved to the art`);

// ---- the prop still does its job for procedural art ---------------------

// Recolouring is real and must keep working — this is what `palette` is for.
const procedural = { palette: 'hero', grid: ['..'] };
ok('a passed palette still wins for procedural art',
  paletteFor(procedural, 'pc_woman') === 'pc_woman');
ok('procedural art falls back to its own palette when none is passed',
  paletteFor(procedural, undefined) === 'hero');
ok('traced art ignores a passed palette',
  paletteFor({ palette: 'art_groveheart', grid: ['..'] }, 'grove') === 'art_groveheart');
ok('a missing sprite does not throw', paletteFor(null, 'grove') === 'grove');

// ---- the colours are actually different ---------------------------------

// Proof the bug was visible rather than theoretical: the ramp the screens
// passed and the one the art was drawn in are not the same colours.
const own = SPRITE_PALETTES[SPRITES.groveheart.palette] || [];
const passedRamp = SPRITE_PALETTES[CREATURES.groveheart.palette] || [];
const shared = own.filter((c) => passedRamp.includes(c)).length;
ok('the wrong ramp really was a different set of colours',
  shared <= 1, `${shared} colours in common out of ${own.length}`);

// WHY the mis-decode read as horizontal banding, measured rather than asserted.
//
// A procedural palette is a RAMP: its entries climb in luminance, because that
// is what a ramp is for. Traced art is not ordered that way at all — its
// entries are whatever colours the drawing used. So when traced indices are
// decoded against a ramp, neighbouring indices become neighbouring
// brightnesses, and a creature turns into smooth horizontal stripes.
//
// A first version of this check compared "hue spread" and failed, because hue
// is circular and max-minus-min on a circle is meaningless — the near-grey
// entries in a ramp report hues all over the wheel. Luminance ordering is the
// property that actually differs.
const lum = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const ascendingFraction = (name) => {
  const list = (SPRITE_PALETTES[name] || []).filter((c) => typeof c === 'string' && c.startsWith('#'));
  if (list.length < 3) return 0;
  let asc = 0;
  for (let i = 1; i < list.length; i += 1) if (lum(list[i]) > lum(list[i - 1])) asc += 1;
  return asc / (list.length - 1);
};
const rampOrder = ascendingFraction(CREATURES.groveheart.palette);
const artOrder = ascendingFraction(SPRITES.groveheart.palette);
ok('the palette the screens passed is a luminance ramp', rampOrder > 0.85,
  `${(rampOrder * 100).toFixed(0)}% of steps climb`);
ok('the art\'s own palette is not ordered by luminance', artOrder < 0.8,
  `${(artOrder * 100).toFixed(0)}% climb — so decoding art against a ramp turns it into stripes`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
