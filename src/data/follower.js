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

// Falls back to the player's own tile when the space behind is a wall — which
// happens the moment you walk into a room and turn to face back out of it.
// Overlapping for a step is worse-looking than it is wrong; standing inside a
// wall is both.
export function restingSpot(map, px, py, facing) {
  const d = BEHIND[facing || 'down'] || BEHIND.down;
  const x = px + d[0];
  const y = py + d[1];
  return isWalkable(map, x, y) ? { x, y } : { x: px, y: py };
}
