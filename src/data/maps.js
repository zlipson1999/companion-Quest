// The town hub: a small tile map you walk around with grid-step movement.
// Authored as rows of single-char tile codes. Doors/gates are walkable tiles
// that trigger a screen when you step onto them.
//
//   .  grass        #  path         T  tree (blocked)   ~  water (blocked)
//   ,  flowers      h  rest roof    H  rest wall (blk)   D  rest door -> rest
//   y  gym roof     Y  gym wall     d  gym door -> Training Hall interior
//   G  route gate -> route

export const HUB = {
  id: 'hub',
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

// The Training Hall interior. Stepping through the gym door used to jump
// straight to the exercise list, so the building the whole onboarding walks you
// toward had no inside. It is a real room now: equipment you can walk up to,
// each piece standing for the system it teaches.
//
//   =  front wall     |  side wall      M  mirror       .  floor / , variant
//   m  training mat   R  barbell rack   b  dumbbell rack   U  pull-up bar
//   K  cable machine  t  treadmill      q  rower           j  kettlebells
//   B  bench          w  water station  L  lockers         N  reception
//   p  plant          C  Coach Maple    X  exit -> hub
export const GYM = {
  id: 'gym',
  cols: 15,
  rows: 13,
  spawn: { x: 7, y: 11 },
  grid: [
    '===============',
    '|MMMM....RRRRU|',
    '|.............|',
    '|.B.b.......b.|',
    '|.............|',
    '|.q..mmm..KK..|',
    '|....mmm..KK..|',
    '|.j.....C.....|',
    '|.............|',
    '|.t.t.......w.|',
    '|...........p.|',
    '|LLL.N...N....|',
    '======X========',
  ],
};

const BLOCKED = new Set([
  'T', '~', 'h', 'H', 'y', 'Y',
  'W', '=', '|', 'M', 'R', 'b', 'K', 't', 'B', 'w', 'C',
  // Furniture. A rug is walkable; everything else you walk around.
  'e', 'E', 'v', 'k', 'f', 'a', 'c', 'F', 'o', 'p',
  'L', 'U', 'j', 'q', 'N',
]);

// Walking into a station is how you use it. A blocked tile that answers a bump
// gives the room its affordances: the equipment IS the menu, so the Hall does
// not need a wall of buttons explaining itself.
const INTERACTIONS = {
  R: { screen: 'workout', label: 'Barbell rack — train Resolve' },
  U: { screen: 'workout', label: 'Pull-up bar — train Resolve' },
  j: { screen: 'workout', label: 'Kettlebells — train Resolve' },
  q: { screen: 'route', label: 'Rower — log real distance' },
  L: { screen: 'bag', label: 'Lockers — your supplies' },
  N: { screen: 'summary', label: 'Reception — your record so far' },
  b: { screen: 'forge', label: 'Dumbbell rack — Workout Forge' },
  K: { screen: 'forge', label: 'Cable machine — build a plan' },
  t: { screen: 'route', label: 'Treadmill — head out on the trail' },
  B: { screen: 'rest', label: 'Bench — rest and recover' },
  w: { screen: 'habits', label: 'Water station — daily habits' },
  M: { screen: 'formcheck', label: 'Mirror — form check' },
  C: { screen: 'coach', label: 'Coach Maple' },
};

export function interactionForCode(code) {
  return INTERACTIONS[code] || null;
}

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
      return 'gym';
    case 'G':
      return 'route';
    case 'X':
      return 'hub';
    default:
      return null;
  }
}

export const TRIGGER_LABELS = {
  rest: 'Home',
  gym: 'Maple Training Hall',
  route: 'Route 1',
  hub: 'Maple Lane',
};

export default HUB;

