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
//   p  plant          C  Coach Maple    A  Rowan (training)   X  exit -> hub
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
    '|.j...A.C.....|',
    '|.............|',
    '|.t.t.......w.|',
    '|...........p.|',
    '|LLL.N...N....|',
    '======X========',
  ],
};

const BLOCKED = new Set([
  'T', '~', 'h', 'H', 'y', 'Y',
  'W', '=', '|', 'M', 'R', 'b', 'K', 't', 'B', 'w', 'C', 'A',
  // Furniture. A rug is walkable; everything else you walk around.
  'e', 'E', 'v', 'k', 'f', 'a', 'c', 'F', 'o', 'p',
  'L', 'U', 'j', 'q', 'N',
]);

// Walking into a station is how you use it. A blocked tile that answers a bump
// gives the room its affordances: the equipment IS the menu, so the Hall does
// not need a wall of buttons explaining itself.
// The Hall's equipment IS the menu. Each piece opens the system it stands for,
// so the room teaches by being walked around rather than by listing itself.
//
// The cardio deck is the one that needed a distinction rather than a link.
// Treadmill and rower run Route's machinery in `treadmill` mode: the same
// miles, the same milestones, the same progression — and nothing that stops
// you. Encounters and trail challenges belong to Route 1, outdoors.
const INTERACTIONS = {
  // The iron is where you WRITE a session. Ask Coach if you want one handed to
  // you. That split is the whole logic of the room: equipment is the work,
  // people are the advice.
  R: { screen: 'forge', label: 'Barbell rack — build your own session' },
  b: { screen: 'forge', label: 'Dumbbell rack — build your own session' },
  K: { screen: 'forge', label: 'Cable machine — build your own session' },
  U: { screen: 'forge', label: 'Pull-up bar — build your own session' },
  j: { screen: 'forge', label: 'Kettlebells — build your own session' },
  t: { screen: 'treadmill', params: { mode: 'treadmill' }, label: 'Treadmill — cardio, no interruptions' },
  q: { screen: 'treadmill', params: { mode: 'treadmill' }, label: 'Rower — cardio, no interruptions' },
  L: { screen: 'bag', label: 'Lockers — your supplies' },
  N: { screen: 'summary', label: 'Reception — your record so far' },
  B: { screen: 'rest', label: 'Bench — rest and recover' },
  w: { screen: 'habits', label: 'Water station — daily habits' },
  M: { screen: 'formcheck', label: 'Mirror — form check' },
  // Resolved in GymScreen: before you have a companion this is where the goal
  // conversation happens; afterwards it is the coach chat. Sending an existing
  // save to the goal screen would re-run START_GAME and replace the party.
  // Coach hands you a session already written. Before you have a companion she
  // is the goal conversation instead — GymScreen resolves that, because
  // re-running the goal screen on a live save would replace the party.
  C: { screen: 'workout', label: 'Coach Maple — take a session off the shelf' },
  A: { screen: 'workout', label: 'Rowan — mid-session, and happy to spot you' },
  // Route 1 is the version WITH encounters. This is the one without.
  // (See the treadmill entry above.)
};

// A map may override what its own furniture does. The bookshelf in a kitchen is
// a cookbook and the one in a bedroom is not, so the meaning belongs to the
// room rather than to the tile code.
export function interactionForCode(code, map) {
  if (map && map.interactions && map.interactions[code]) return map.interactions[code];
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

