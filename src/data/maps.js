// The town hub: a small tile map you walk around with grid-step movement.
// Authored as rows of single-char tile codes. Doors/gates are walkable tiles
// that trigger a screen when you step onto them.
//
//   .  grass        #  path         T  tree (blocked)   ~  water (blocked)
//   ,  flowers      h  rest roof    H  rest wall (blk)   D  rest door -> rest
//   y  gym roof     Y  gym wall     d  gym door -> Quest Fitness interior
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

// Quest Fitness — the gym interior.
//
// Laid out the way a real fitness floor is laid out, because the first pass was
// equipment scattered evenly over a rectangle and that reads as a warehouse.
// The zoning below is the ordinary commercial convention — perimeter for the
// things that back onto a wall, centre for the things that do not:
//
//   - Racks along the NORTH wall on the lifting platform. A power rack is
//     bolted to a wall in every gym that owns one; floating them in the middle
//     of the room was the single most wrong thing about the old plan.
//   - Free weights down the WEST wall: kettlebells, then the dumbbell run
//     against the wall with a working aisle in front of it, benches and the
//     EZ-bar cradle out on the floor beside it, mirrors at the far end.
//   - Cardio down the EAST wall in one unbroken line, treadmills then rowers,
//     with the water station at the head of it.
//   - Selectorised machines in the MIDDLE, two rows with an aisle between them
//     and a cross-aisle through the middle, which is how a circuit is walked.
//   - The functional end at the SOUTH: turf lane on one side for dynamic
//     stretching, matting on the other for bodyweight and core work.
//   - Front of house at the door: lockers one side, then reception and the
//     smoothie bar, which is where a juice counter sits in every gym that has
//     one — you pass it on the way in and on the way out.
//
//   =  front wall     |  side wall      M  mirrored wall panel   .  floor
//   R  power rack     b  dumbbell run   z  EZ-bar cradle  B  bench
//   K  machine        t  treadmill      q  rower        U  pull-up bar
//   j  kettlebells    S  stretch rig    Q  medicine balls
//   w  water station  L  lockers        N  reception
//   J  bar counter     I  blender station
//   V  banner         O  clock          Z  whiteboard
//   C  Coach Maple    A  Rowan          X  exit -> hub
//
// Floors are ZONES rather than tile codes (see TileMap.zoneAt): an area of the
// plan is wood or turf or matting, and what stands on it is a separate
// question. As codes, a rack could only ever replace the platform it was
// supposed to be standing on.
export const GYM = {
  id: 'gym',
  cols: 17,
  rows: 19,
  spawn: { x: 8, y: 17 },
  grid: [
    '====V=====O==Z===',
    '|.R..R..R..R..U.|',
    '|...............|',
    '|...............|',
    '|j.............w|',
    '|b.B...........t|',
    '|b.B...K.K.....t|',
    '|b.....K.K.....t|',
    '|b.z...........t|',
    'M..z...K.K.....q|',
    'M......K.K.....q|',
    'M..............q|',
    '|S.............Q|',
    '|...............|',
    '|...............|',
    '|.........CA....|',
    '|...............|',
    '|LLL.NN...JIJ...|',
    '========X========',
  ],
  zones: [
    { field: 'tile_gym_platform', x0: 1, y0: 1, x1: 15, y1: 3 },
    { field: 'tile_gym_turf', x0: 1, y0: 12, x1: 7, y1: 15 },
    { field: 'tile_gym_mats', x0: 9, y0: 12, x1: 15, y1: 15 },
  ],
};

const BLOCKED = new Set([
  'T', '~', 'h', 'H', 'y', 'Y',
  'W', '=', '|', 'M', 'R', 'b', 'K', 't', 'B', 'w', 'C', 'A', 'V', 'O', 'Z',
  // Furniture. A rug is walkable; everything else you walk around.
  'e', 'E', 'v', 'k', 'f', 'a', 'c', 'F', 'o', 'p',
  'L', 'U', 'j', 'q', 'N', 'z', 'S', 'Q', 'J', 'I',
]);

// Walking into a station is how you use it. A blocked tile that answers a bump
// gives the room its affordances: the equipment IS the menu, so the gym does
// not need a wall of buttons explaining itself.
// The gym's equipment IS the menu. Each piece opens the system it stands for,
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
  z: { screen: 'forge', label: 'EZ-bar cradle — build your own session' },
  j: { screen: 'forge', label: 'Kettlebells — build your own session' },
  t: { screen: 'treadmill', params: { mode: 'treadmill' }, label: 'Treadmill — cardio, no interruptions' },
  q: { screen: 'treadmill', params: { mode: 'treadmill' }, label: 'Rower — cardio, no interruptions' },
  Z: { screen: 'week', label: "Whiteboard — this week's work" },
  L: { screen: 'bag', label: 'Lockers — your supplies' },
  N: { screen: 'summary', label: 'Reception — your record so far' },
  // Front of house. The bar is the one place credit is spent, and credit is
  // only ever minted by real effort — see src/state/economy.js.
  J: { screen: 'smoothiebar', label: 'Smoothie bar — blends, and Kinship Knots' },
  I: { screen: 'smoothiebar', label: 'Smoothie bar — blends, and Kinship Knots' },
  // A flat bench is iron, not furniture. It used to open 'rest', which is the
  // HOUSE — so walking into a bench in the middle of the gym put you in your
  // own kitchen. It belongs with the racks: something you write a session on.
  B: { screen: 'forge', label: 'Flat bench — build your own session' },
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
  // The two zones at the south end. Each opens the routine it is FOR rather
  // than the list of all of them: you walked to the turf, so you already
  // said which one you wanted.
  S: { screen: 'workout', params: { workoutId: 'warmup' }, label: 'Turf lane — dynamic walking stretches' },
  Q: { screen: 'workout', params: { workoutId: 'core' }, label: 'Mat floor — bodyweight and core' },
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
  gym: 'Quest Fitness',
  route: 'Route 1',
  hub: 'Maple Lane',
};

export default HUB;

