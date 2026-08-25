// The town hub: a small tile map you walk around with grid-step movement.
// Authored as rows of single-char tile codes. Doors/gates are walkable tiles
// that trigger a screen when you step onto them.
//
//   .  grass        #  path         T  tree (blocked)   ~  water (blocked)
//   ,  flowers      h  rest roof    H  rest wall (blk)   D  rest door -> rest
//   y  gym roof     Y  gym wall     d  gym door -> Quest Fitness interior
//   G  route gate -> route
//   i  signpost     !  lamppost     +  bench             %  post box
//   -  picket fence
//
// Roofs are TWO rows deep. One row of shingle has no apex, so a building read
// as a coloured rectangle with a strip under it; with two, the top row gets a
// ridge cap and the wall below gets its eave, both applied from the shape of
// the building rather than from codes somebody has to remember to place.

export const HUB = {
  id: 'hub',
  cols: 13,
  rows: 17,
  spawn: { x: 6, y: 15 },
  grid: [
    'TTTTTTGTTTTTT',
    'T....i#.....T',
    'T.....#.....T',
    'Thhhh.#.yyyyT',
    'Thhhh.#.yyyyT',
    'THDHH.#.YdYYT',
    'T%#...#..#..T',
    'T.########..T',
    'T....!#!....T',
    'T.....#.....T',
    'T.~~~.#..---T',
    'T.~~~+#..,,,T',
    'T.~~~.#..,,,T',
    'T.....#.....T',
    'T.,...#...,.T',
    'T.....#.....T',
    'TTTTTTTTTTTTT',
  ],
  interactions: {
    // A bench by the water does what the sofa indoors does.
    '+': { screen: 'habit', params: { moduleId: 'meditation' }, label: 'Bench — sit by the water' },
    // Label only, no screen. A signpost that opened a menu would be a menu.
    i: { label: 'Signpost — the trails, through the north gate' },
    '%': { label: 'Your post box. Nothing today.' },
  },
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
//   - Cardio down the EAST wall in one unbroken line: treadmills, bikes, rowers,
//     with the water station at the head of it.
//   - Selectorised machines in the MIDDLE, two rows with an aisle between them
//     and a cross-aisle through the middle, which is how a circuit is walked.
//   - The functional end at the SOUTH: turf lane on one side for dynamic
//     stretching, matting on the other for bodyweight and core work.
//   - Front of house at the door: lockers one side, then reception and the
//     smoothie bar, which is where a juice counter sits in every gym that has
//     one — you pass it on the way in and on the way out.
//
//   =  front wall     |  side wall      M  mirrored wall     .  floor
//   R  power rack     b  dumbbell run   z  EZ-bar cradle  B  bench
//   K  machine        t  treadmill      c  bike         q  rower
//   U  pull-up bar
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
    'M.R..R..R..R..U.|',
    'M...............|',
    'M...............|',
    'Mj.............w|',
    'Mb.B...........t|',
    'Mb.B...K.K.....t|',
    'Mb.....K.K.....c|',
    'Mb.z...........c|',
    'M..z...K.K.....q|',
    'M......K.K.....x|',
    'M..............m|',
    'MS.............Q|',
    'M...............|',
    'M...............|',
    'M.........CA....|',
    'M...............|',
    'MLLL.NNr..JIJ...|',
    '========X========',
  ],
  zones: [
    { field: 'tile_gym_platform', x0: 1, y0: 1, x1: 15, y1: 3 },
    { field: 'tile_gym_turf', x0: 1, y0: 12, x1: 7, y1: 15 },
    { field: 'tile_gym_mats', x0: 9, y0: 12, x1: 15, y1: 15 },
  ],
  // Map-local, the same way `c` is the bike here and a kitchen counter at
  // home: every letter is spoken for somewhere, so the two newest cardio
  // machines borrow house-furniture codes and override them for this room
  // only. TileMap carries the matching gym-local prop override, so a code
  // can never draw a sideboard on the cardio wall.
  interactions: {
    x: { cardio: 'stairclimber', label: 'Stair Climber — cardio, no interruptions' },
    m: { cardio: 'elliptical', label: 'Elliptical — cardio, no interruptions' },
  },
};

// Your house. Both rooms used to be declared TWICE — once in HomeIntroScreen
// and once in HomeRestScreen — with the grids already drifted apart between
// the two copies. One definition, and each screen brings its own spawn, exit
// and hint.
//
//   W wall   H window   D front door   s stairs   . boards
//   n worktop   c sink counter   u cooker   F fridge   a table   m chair
//   f sofa   x coffee table   v screen   o shelf   l floor lamp   p plant
//   e/E bed   g nightstand   P wardrobe   k desk
//
// Floors are ZONES here as well as in the gym: kitchen vinyl under the run and
// a wool rug under the living room, each with the inlay joint that keeps a
// material change from reading as a ruled line.
export const DOWNSTAIRS = {
  id: 'home',
  cols: 13,
  rows: 15,
  grid: [
      'WWWHHWWWHHWWW',
      'WncnuF.....sW',
      'W...........W',
      'W.mam.......W',
      'W..m........W',
      'W...........W',
      'W...........W',
      'W.....v.....W',
      'W...........W',
      'W..........oW',
      'W.....x.....W',
      'W...........W',
      'Wp...ff...l.W',
      'W...........W',
      'WWWWWWDWWWWWW',
  ],
  zones: [
    { field: 'tile_home_kitchen', x0: 1, y0: 1, x1: 11, y1: 5 },
    { field: 'tile_home_rug', x0: 3, y0: 8, x1: 9, y1: 11 },
  ],
  interactions: {
    n: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Worktop — log a meal' },
    c: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Sink — log a meal' },
    u: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Cooker — log a meal' },
    F: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Fridge — log a meal' },
    a: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Table — log a meal' },
    o: { screen: 'cookbook', label: 'Shelf — the kitchen cookbook' },
    f: { screen: 'habit', params: { moduleId: 'meditation' }, label: 'Sofa — sit and be still' },
    v: { screen: 'week', label: 'Screen — this week so far' },
  },
};

export const BEDROOM = {
  id: 'home',
  cols: 11,
  rows: 13,
  grid: [
      'WWWHHWWHHWW',
      'Weg..v..PPW',
      'WE........W',
      'W.........W',
      'W.........W',
      'W........oW',
      'W.........W',
      'W.........W',
      'W........lW',
      'W.........W',
      'Wkm.......W',
      'Wp.......sW',
      'WWWWWWWWWWW',
  ],
  zones: [{ field: 'tile_home_rug', x0: 3, y0: 5, x1: 7, y1: 9 }],
  interactions: {
    e: { screen: 'habit', params: { moduleId: 'sleep' }, verb: 'Rest', label: 'Bed — log last night' },
    E: { screen: 'habit', params: { moduleId: 'sleep' }, verb: 'Rest', label: 'Bed — log last night' },
    k: { screen: 'habits', label: 'Desk — your daily habits' },
    o: { screen: 'index', label: 'Shelf — your creature index' },
    v: { screen: 'week', label: 'Screen — this week so far' },
    P: { screen: 'bag', label: 'Wardrobe — your supplies' },
  },
};

// Every map's grid must match the cols/rows it claims.
//
// Cheap to assert, and it fails at import rather than as a blank screen or a
// player standing in a wall. Added after a bulk edit spliced the whole gym out
// of this file between two anchors and nothing noticed until the door to it
// threw at runtime.
for (const [name, map] of Object.entries({ HUB, GYM, DOWNSTAIRS, BEDROOM })) {
  if (map.grid.length !== map.rows) {
    throw new Error(`maps.js: ${name} claims ${map.rows} rows and has ${map.grid.length}`);
  }
  const wrong = map.grid.findIndex((row) => row.length !== map.cols);
  if (wrong >= 0) {
    throw new Error(
      `maps.js: ${name} row ${wrong} is ${map.grid[wrong].length} wide, expected ${map.cols}`
    );
  }
}

const BLOCKED = new Set([
  'T', '~', 'h', 'H', 'y', 'Y',
  'W', '=', '|', 'M', 'R', 'b', 'K', 't', 'B', 'w', 'C', 'A', 'V', 'O', 'Z',
  // Furniture. A rug is walkable; everything else you walk around.
  'e', 'E', 'v', 'k', 'f', 'a', 'c', 'F', 'o', 'p',
  'L', 'U', 'j', 'q', 'N', 'z', 'S', 'Q', 'J', 'I', 'r',
  // House furniture.
  'n', 'u', 'm', 'x', 'l', 'P', 'g',
  // Out on the lane.
  'i', '!', '+', '%', '-',
]);

// Walking into a station is how you use it. A blocked tile that answers a bump
// gives the room its affordances: the equipment IS the menu, so the gym does
// not need a wall of buttons explaining itself.
// The gym's equipment IS the menu. Each piece opens the system it stands for,
// so the room teaches by being walked around rather than by listing itself.
//
// The cardio deck is the one that needed a distinction rather than a link.
// Treadmill, bike and rower share the room's cardio console. Treadmill/rower
// listen for movement on the phone; the bike explicitly starts outdoor GPS.
// None passes a route id, so gym effort never fills an outdoor trail quota.
const INTERACTIONS = {
  // The iron is where you WRITE a session. Ask Coach if you want one handed to
  // you. That split is the whole logic of the room: equipment is the work,
  // people are the advice.
  // EVERY piece of equipment in the room opens the Forge. There is one place
  // you write a session, and which lump of iron you happened to walk up to
  // does not change that — the label says what you are standing at, the
  // destination is always the same.
  R: { screen: 'forge', label: 'Power rack — build your own session' },
  b: { screen: 'forge', label: 'Dumbbell run — build your own session' },
  K: { screen: 'forge', label: 'Machine — build your own session' },
  U: { screen: 'forge', label: 'Pull-up bar — build your own session' },
  z: { screen: 'forge', label: 'EZ-bar cradle — build your own session' },
  j: { screen: 'forge', label: 'Kettlebells — build your own session' },
  // Not a screen: you step ONTO these and the room stays around you.
  t: { cardio: 'treadmill', label: 'Treadmill — cardio, no interruptions' },
  // `c` is a kitchen counter at home, whose map-local interaction overrides
  // this one. In the gym it is the cycle station; TileMap has the matching
  // map-local prop override so the code cannot draw a counter on the cardio wall.
  c: { cardio: 'bike', label: 'Bike — start a Bike Ride, measured by GPS' },
  q: { cardio: 'rower', label: 'Rower — cardio, no interruptions' },
  Z: { screen: 'week', label: "Whiteboard — this week's work" },
  L: { screen: 'bag', label: 'Lockers — your supplies' },
  // Reception is attendance and the Quest Ledger. Walking into the desk
  // records today's first arrival time; the Phone owns the broader record.
  // The cork noticeboard is the friends board — the same BoardScreen Friends
  // opens. Do not move the boards onto N.
  N: { screen: 'reception', label: 'Reception — check in and the Quest Ledger' },
  r: { screen: 'board', label: 'Noticeboard — how your friends are doing' },
  // Front of house. The bar and the reception Quest Ledger are the only
  // places credit is spent, and credit is only ever minted by real effort —
  // see src/state/economy.js.
  J: { screen: 'smoothiebar', label: 'Smoothie bar — blends, and Kinship Knots' },
  I: { screen: 'smoothiebar', label: 'Smoothie bar — blends, and Kinship Knots' },
  // A flat bench is iron, not furniture. It used to open 'rest', which is the
  // HOUSE — so walking into a bench in the middle of the gym put you in your
  // own kitchen. It belongs with the racks: something you write a session on.
  B: { screen: 'forge', label: 'Flat bench — build your own session' },
  w: { screen: 'habits', label: 'Water station — daily habits' },
  M: { screen: 'formcheck', label: 'Mirror — form check' },
  // Coach Maple is chat once you have a companion; before that she is the
  // goal conversation. GymScreen resolves it, because sending a live save
  // to the goal screen would re-run START_GAME and replace the party.
  // Bumping her is how you talk. Shelf sessions live on the gym menu.
  C: { screen: 'coach', verb: 'Talk', label: 'Coach Maple — she will talk with you' },
  A: { screen: 'sparIntro', verb: 'Talk', label: 'Rowan — he wants a challenge with his companion' },
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
// A map with some of its people taken out of it.
//
// Rowan is mid-session with Coach when you first walk in, and the push-up
// contest is that scene. Afterwards he has finished and gone home — leaving him
// standing on the mats forever made the one staged moment in the room read as
// furniture. Returns the SAME object when there is nothing to remove, so the
// common case allocates nothing and TileMap's memo does not churn.
export function mapWithout(map, codes) {
  const drop = new Set(codes);
  if (!map.grid.some((row) => [...row].some((c) => drop.has(c)))) return map;
  return {
    ...map,
    grid: map.grid.map((row) => [...row].map((c) => (drop.has(c) ? '.' : c)).join('')),
  };
}

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

// A code that leads somewhere and a code that opens something must never be the
// same letter.
//
// Every walking screen asks `interactionForCode` FIRST and falls through to
// `triggerForCode`, so a shared interaction silently shadows a door. The
// noticeboard was added on 'G' — which is the north gate — and Sunkist Lane's way
// out to Route 1 became a noticeboard. Nothing complained: both codes were
// valid, both tables were well formed, and the only symptom was a door that led
// somewhere else.
//
// Picking the letter by checking the sprite tables is not enough; it has to be
// free in the GRIDS and in every table that claims a code.
const TRIGGER_CODES = ['D', 'd', 'G', 'X'];
const shadowed = TRIGGER_CODES.filter((c) => INTERACTIONS[c]);
if (shadowed.length) {
  throw new Error(
    `maps: ${shadowed.join(', ')} is both a trigger and a shared interaction — `
    + 'the interaction wins and the door stops working.'
  );
}

export const TRIGGER_LABELS = {
  rest: 'Home',
  gym: 'Quest Fitness',
  route: 'the trails',
  hub: 'Sunkist Lane',
};

export default HUB;
