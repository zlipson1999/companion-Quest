// The second frame of a creature's idle, derived from the first.
//
// Every one of the 194 creature sprites was a single plate. `PixelSprite`
// translated it three pixels up and down on a loop and called that an idle,
// which is a photograph bobbing: the silhouette never changes, so nothing about
// the creature moves — the whole rigid card slides. The player character got
// twelve authored frames in the cube-cast pass. The animal the game is actually
// about got none.
//
// A drawn frame is the fix, and the drawing is a SQUASH, which is what a
// two-frame creature idle has always been: the body compresses, the head rides
// down with it, and the feet stay planted. The important part is that it
// happens in the pixel grid. A `scaleY` transform moves the contact point and
// resamples the art off its own grid; deleting a row re-forms the silhouette
// and every pixel stays where a pixel goes.
//
// It is derived rather than authored because the alternative was 194 more
// 96×96 grids in a file already at 2.8MB — a 64% increase to the largest thing
// in the bundle, to encode a one-row difference. This is a few thousand
// character comparisons per creature, once, cached for the session.
//
// What it deliberately does not attempt: blinks, ear flicks, tail sway. Those
// need to know where an eye or an ear IS, and nothing here does. A wrong guess
// puts a blink on a kneecap. A squash needs no semantics and is the motion that
// reads at this size anyway.

// Which slice of the creature gives up the row. Not the middle — the face of a
// front-facing companion sits around the middle, and compressing it warps the
// expression the whole design is carrying. Below the face and above the
// contact: the torso squeezes and the head descends as a rigid unit, which is
// also what actually happens when something breathes.
const BAND_TOP = 0.55;
const BAND_BOTTOM = 0.86;

// Below this many rows of actual subject, a squash is a twitch. See squashFrame.
const MIN_HEIGHT = 32;

const cache = new Map();

function extent(grid) {
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < grid.length; y += 1) {
    let any = false;
    const row = grid[y];
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== '.') { any = true; break; }
    }
    if (any) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  return top < 0 ? null : { top, bottom };
}

// The row whose removal costs least: the one that already looks most like the
// row above it. Taking a row out of a flat expanse of flank is invisible as
// detail loss and reads purely as compression; taking one out of a hard edge
// deletes the edge.
function seamRow(grid, from, to) {
  let best = -1;
  let bestCost = Infinity;
  for (let y = Math.max(from, 1); y <= to && y < grid.length; y += 1) {
    const row = grid[y];
    const above = grid[y - 1];
    let cost = 0;
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== above[x]) cost += 1;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = y;
    }
  }
  return best;
}

// How many rows to take, for a sprite drawn at `size` points.
//
// A grid row is not a fixed amount of anything on screen. A 96-row creature at
// size 110 gives 1.15 points per row and one row is a visible breath; the same
// creature at size 44 in the status strip gives 0.46, and one row is under a
// device pixel — the drawn frame is there and simply cannot be seen. The squash
// has to be a fraction of the RENDERED height, not of the grid, which is the
// same lesson the sky veil learned about authoring at display width.
//
// The target is about a pixel and a half of travel: enough to read, small
// enough to stay a breath. Capped at three because past that a quadruped's
// legs start visibly folding rather than settling.
const TARGET_POINTS = 0.75;

export function squashRows(gridRows, size) {
  if (!size || !gridRows) return 1;
  const n = Math.round((TARGET_POINTS * gridRows) / size);
  return Math.max(1, Math.min(3, n));
}

// The squashed frame for a grid. Same dimensions, so nothing downstream has to
// know this happened; the creature simply occupies fewer rows of it.
export function squashFrame(grid, rows = 1) {
  if (!grid || grid.length < 8) return grid;
  const box = extent(grid);
  if (!box) return grid;
  const height = box.bottom - box.top + 1;
  // A row is a fixed cost and a shrinking proportion of a growing subject. On a
  // 96-row creature it is a breath; on a 24-row module icon — and `bob` is
  // passed to those too — it is a twentieth of the whole object twitching.
  // Creatures and people clear this comfortably; icons do not, and should not.
  if (height < MIN_HEIGHT) return grid;

  const blank = '.'.repeat(grid[0].length);
  let out = grid;
  for (let n = 0; n < rows; n += 1) {
    // Re-pick the seam each pass against the grid as it now stands, so two rows
    // are not taken from the same place and turned into one visible dent.
    const from = box.top + Math.floor(height * BAND_TOP) + n;
    const to = box.top + Math.floor(height * BAND_BOTTOM) + n;
    const seam = seamRow(out, from, to);
    if (seam < 0) break;
    // Drop the seam and slide everything above it DOWN one. The blank row goes
    // on top, so the grid keeps its dimensions, the creature's crown descends,
    // and the row it stands on does not move.
    const next = new Array(out.length);
    next[0] = blank;
    for (let y = 1; y <= seam; y += 1) next[y] = out[y - 1];
    for (let y = seam + 1; y < out.length; y += 1) next[y] = out[y];
    out = next;
  }
  return out;
}

// What breathes. squashFrame is geometry and will compress anything tall
// enough, so the judgement about what SHOULD breathe lives here, once, rather
// than being inferred from a size — `item_knot` is a full 96x96 painted plate,
// exactly the dimensions of a creature, and a Kinship Knot does not inhale.
// Tiles, props, items and module icons are objects; creatures and people are
// not, and everything in the registry is one or the other.
const STILL = /^(tile_|prop_|item_|mod_|art_)/;

export function breathes(key) {
  return !!key && !STILL.test(key);
}

// Cached by sprite key. Creatures are re-rendered constantly — a battle
// re-renders both combatants on every tick — and the frame never changes.
export function idleFrame(key, grid, size) {
  if (!breathes(key)) return grid;
  const rows = squashRows(grid && grid.length, size);
  // Keyed by row count as well: the same creature is drawn at 44 in the status
  // strip and 110 on the Forge, and those want different amounts.
  const id = `${key}@${rows}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const made = squashFrame(grid, rows);
  cache.set(id, made);
  return made;
}
