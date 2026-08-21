// The town hub: a small tile map you walk around with grid-step movement.
// Authored as rows of single-char tile codes. Doors/gates are walkable tiles
// that trigger a screen when you step onto them.
//
//   .  grass        #  path         T  tree (blocked)   ~  water (blocked)
//   ,  flowers      h  rest roof    H  rest wall (blk)   D  rest door -> rest
//   y  gym roof     Y  gym wall     d  gym door -> workout
//   G  route gate -> route

export const HUB = {
  cols: 11,
  rows: 11,
  spawn: { x: 5, y: 9 },
  grid: [
    'TTTTTGTTTTT',
    'T....#....T',
    'Thhh.#.yyyT',
    'THDH.#.YdYT',
    'T.,..#..,.T',
    'T.#######.T',
    'T....#....T',
    'T.~~.#....T',
    'T..,.#.,..T',
    'T....#....T',
    'TTTTTTTTTTT',
  ],
};

const BLOCKED = new Set(['T', '~', 'h', 'H', 'y', 'Y']);

export function tileAt(map, x, y) {
  if (y < 0 || y >= map.rows || x < 0 || x >= map.cols) return 'T';
  return map.grid[y][x];
}

export function isWalkable(map, x, y) {
  return !BLOCKED.has(tileAt(map, x, y));
}

export function triggerForCode(code) {
  switch (code) {
    case 'D':
      return 'rest';
    case 'd':
      return 'workout';
    case 'G':
      return 'route';
    default:
      return null;
  }
}

export const TRIGGER_LABELS = {
  rest: 'Rest Stop',
  workout: 'Training Yard',
  route: 'Route 1',
};

export default HUB;
