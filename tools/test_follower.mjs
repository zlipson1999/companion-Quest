// The companion in the world, checked where it can actually go wrong.
//
// The walking rule needs no test: it stands on the tile the player has just
// left, which is walkable because the player was standing on it. Arrival is the
// case with a real choice in it — a new map, where the tile it was on is in
// another building — and the way that fails is by putting a creature inside a
// wall. So this runs the rule over every tile of every map at every facing.
//
//   node --import ./tools/register-esm.mjs tools/test_follower.mjs

import { restingSpot } from '../src/data/follower.js';
import { BEDROOM, DOWNSTAIRS, GYM, HUB, isWalkable } from '../src/data/maps.js';

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

// The four hand-built maps. Routes are generated per walk and their tiles come
// from the same walkability rules, so these cover the shapes.
const maps = [HUB, GYM, DOWNSTAIRS, BEDROOM];
ok('there are maps to check', maps.length > 0, `${maps.length} maps`);

const FACINGS = ['up', 'down', 'left', 'right'];
let inWall = [];
let offMap = [];
let tooFar = [];
let checked = 0;

for (const map of maps) {
  for (let y = 0; y < map.rows; y += 1) {
    for (let x = 0; x < map.cols; x += 1) {
      if (!isWalkable(map, x, y)) continue;
      for (const facing of FACINGS) {
        const spot = restingSpot(map, x, y, facing);
        checked += 1;
        if (!isWalkable(map, spot.x, spot.y)) inWall.push(`${map.id} ${x},${y} ${facing}`);
        if (spot.x < 0 || spot.y < 0 || spot.x >= map.cols || spot.y >= map.rows) {
          offMap.push(`${map.id} ${x},${y} ${facing}`);
        }
        // It appears WITH you, so it can only ever be the player's tile or the
        // one behind it. Anything further is a teleport across the room.
        const dist = Math.abs(spot.x - x) + Math.abs(spot.y - y);
        if (dist > 1) tooFar.push(`${map.id} ${x},${y} ${facing} -> ${spot.x},${spot.y}`);
      }
    }
  }
}

ok('the companion never arrives inside a wall', inWall.length === 0,
  inWall.slice(0, 4).join('; ') || `${checked} placements`);
ok('the companion never arrives off the map', offMap.length === 0, offMap.slice(0, 4).join('; '));
ok('it arrives beside you, never across the room', tooFar.length === 0, tooFar.slice(0, 4).join('; '));

// ---- it really does stand behind you where it can ------------------------

// The whole reason for the rule: on an open tile it must NOT land on the
// player, or two sprites are drawn on top of each other.
const open = [];
for (const map of maps) {
  for (let y = 1; y < map.rows - 1; y += 1) {
    for (let x = 1; x < map.cols - 1; x += 1) {
      const around = [[0, 1], [0, -1], [1, 0], [-1, 0]].every(([dx, dy]) => isWalkable(map, x + dx, y + dy));
      if (isWalkable(map, x, y) && around) open.push([map, x, y]);
    }
  }
}
ok('there are open tiles to check', open.length > 20, `${open.length} tiles with clear space all round`);

let overlapped = 0;
for (const [map, x, y] of open) {
  for (const facing of FACINGS) {
    const spot = restingSpot(map, x, y, facing);
    if (spot.x === x && spot.y === y) overlapped += 1;
  }
}
ok('on open ground it always steps back rather than overlapping', overlapped === 0,
  `${open.length * 4} open placements`);

// And the direction is BEHIND, not in front — a companion that walks ahead of
// you is leading, which is a different character entirely.
const [m0] = open[0];
const facingChecks = [
  ['up', 0, 1], ['down', 0, -1], ['left', 1, 0], ['right', -1, 0],
];
let wrongSide = [];
for (const [, x, y] of open.slice(0, 1)) {
  for (const [facing, dx, dy] of facingChecks) {
    const spot = restingSpot(m0, x, y, facing);
    if (spot.x !== x + dx || spot.y !== y + dy) wrongSide.push(facing);
  }
}
ok('it stands behind you, not ahead', wrongSide.length === 0, wrongSide.join(', ') || 'all four facings');

// ---- it does not crash on nonsense --------------------------------------

ok('an unknown facing falls back rather than throwing',
  !!restingSpot(m0, open[0][1], open[0][2], 'sideways'));
ok('a missing facing falls back rather than throwing',
  !!restingSpot(m0, open[0][1], open[0][2], undefined));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
