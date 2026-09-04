// Which palette a sprite is actually drawn with.
//
// This has now been the same bug three times, so it is one rule in one place
// instead of a judgement made at every call site.
//
// A sprite may be handed a `palette` prop. That exists for PROCEDURAL art,
// where one grid is genuinely recoloured — module icons, stand-ins, an outfit
// swap on a hero kit. It was never meant for art traced from a reference
// drawing, which arrives with the colours it was drawn in.
//
// The prop used to win unconditionally, and the results were:
//
//   - the overworld player as a flat blue ghost, because TileMap passed
//     outfitPalette() and it returned pc_woman for everybody;
//   - every trail keeper in BattleScreen, the same way;
//   - and 179 of the 190 creatures, which is what this module was written for.
//     Groveheart is drawn on `art_groveheart` — bark brown, olive, a tan heart,
//     black eyes — and every screen passed `grove`, a single-hue green ramp
//     left over from before the roster was traced. Consecutive indices in the
//     traced art then land on consecutive greens, so the creature rendered flat
//     green with horizontal banding. Outlines and colour, no creature.
//
// The first two were fixed at the call sites that caused them, which is exactly
// why the third survived: nothing stopped the next call site making the same
// mistake. Deciding it here means there is no next call site.

// Traced palettes are emitted under an `art_` prefix by make_sprites.py. That
// prefix is the marker for "these colours came off a drawing", and it is what
// separates art that owns its palette from art that is meant to be recoloured.
const TRACED = 'art_';

export function isTraced(spritePalette) {
  return typeof spritePalette === 'string' && spritePalette.startsWith(TRACED);
}

// The palette to decode a sprite's grid with. `passed` is whatever the caller
// handed down; it is honoured for procedural art and ignored for traced art.
export function paletteFor(sprite, passed) {
  if (!sprite) return passed;
  if (isTraced(sprite.palette)) return sprite.palette;
  return passed || sprite.palette;
}
