// Where you were standing when you last left a place.
//
// The router unmounts a screen when you navigate away, so walking into a rack,
// writing a session and coming back put you at the door again — halfway across
// the room from the thing you had just used. That was tolerable while Back
// always went to Town; now that Back returns you to the room you came from, it
// is the whole point of the change being undone on arrival.
//
// Deliberately in memory rather than in the save. Where you happened to be
// standing is not a fact about your training, it is a fact about the last ten
// seconds, and it should not survive closing the app — you would come back
// tomorrow to find yourself facing a locker for no reason you could remember.

const spots = new Map();

export function rememberSpot(id, spot) {
  if (id && spot) spots.set(id, spot);
}

// `valid` lets the caller reject a remembered square that is no longer
// standable — a map can be re-planned between one run and the next, and
// dropping the player inside a new wall is worse than sending them to the door.
export function recallSpot(id, fallback, valid) {
  const spot = spots.get(id);
  if (!spot) return fallback;
  if (valid && !valid(spot)) return fallback;
  return spot;
}

export function forgetSpot(id) {
  spots.delete(id);
}

// Begin Again and a new walk through the house must not inherit last
// session's square — otherwise the intro starts in the kitchen and the
// cookbook's Back button looks like it teleported you.
export function forgetAll() {
  spots.clear();
}

export default { rememberSpot, recallSpot, forgetSpot, forgetAll };
