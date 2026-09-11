// Where the companion stands.
//
// The rule while walking is trivial and lives in the component: it occupies the
// tile the player has just left. No pathfinding, so it can never get stuck and
// can never be somewhere it could not have walked, and a creature exactly one
// step behind is what reads as following.
//
// The case that needs a rule is ARRIVAL — a new map, where the footprint it was
// standing in is in another building. It cannot walk there, so it appears; and
// appearing on the player's own tile renders as one sprite drawn on top of
// another, which reads as a bug rather than as company.

import { isWalkable } from './maps';

// One tile back along the way you are facing.
const BEHIND = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };

// At a doorway, try either side and then the front if the space behind is
// blocked. Only overlap when there is no free adjacent tile at all.
export function restingSpot(map, px, py, facing) {
  const [dx, dy] = BEHIND[facing || 'down'] || BEHIND.down;
  for (const [ox, oy] of [[dx, dy], [-dy, dx], [dy, -dx], [-dx, -dy]]) {
    const x = px + ox, y = py + oy;
    if (isWalkable(map, x, y)) return { x, y };
  }
  return { x: px, y: py };
}
