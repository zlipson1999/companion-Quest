// Who the player is, and which art speaks for them.
//
// Every screen that draws the player goes through here. Before this, screens
// hard-coded `hero_down` and passed an outfit palette, so the gender the player
// picked on the creation screen was stored, migrated, and then never read by
// anything — all three choices rendered the same body. A single resolver means
// adding a character is a table entry rather than a search for every literal.
//
// Two art tiers, on purpose. `portrait` is traced straight off the committed
// card in assets/characters/ and carries the face; use it wherever the player
// is shown at rest and large. `sprite` is the authored 24x32 overworld set,
// which exists because a faithful downscale of a standing figure lands on about
// fifteen pixels of width — too thin to hold a face or a walk cycle.

import { SPRITES } from './sprites';

export const CHARACTERS = [
  { id: 'woman', name: 'Woman', prefix: 'hero_woman', portrait: 'portrait_woman' },
  { id: 'man', name: 'Man', prefix: 'hero_man', portrait: 'portrait_man' },
  { id: 'nonbinary', name: 'Nonbinary', prefix: 'hero_nonbinary', portrait: 'portrait_nonbinary' },
];

const FALLBACK = { id: null, name: 'Trailkeeper', prefix: 'hero', portrait: 'portrait_woman' };

export function getCharacter(id) {
  return CHARACTERS.find((entry) => entry.id === id) || FALLBACK;
}

// facing is 'down' | 'up' | 'left' | 'right'; frame is 0 (idle) or 1/2 (steps).
// Falls back a step at a time rather than to a literal, so a character that has
// no art for a frame still draws that character rather than the placeholder.
// Parked figures pass frame 0 — that is the stand pose from the kit walk_set.
function kitWalk(prefix, facing, frame, fallbacks) {
  const suffix = frame === 1 ? '_a' : frame === 2 ? '_b' : '';
  const candidates = [
    `${prefix}_${facing}${suffix}`,
    `${prefix}_${facing}`,
    ...fallbacks,
  ];
  return candidates.find((key) => SPRITES[key]) || fallbacks[fallbacks.length - 1];
}

export function playerSprite(id, facing = 'down', frame = 0) {
  const { prefix } = getCharacter(id);
  return kitWalk(prefix, facing, frame, [`${prefix}_down`, 'hero_down']);
}

// Coach Maple's overworld set is walk_set('maple') off her kit card. Same
// resolver as the player so a parked Maple is stand frame 0, not a one-off key.
export function coachSprite(facing = 'down', frame = 0) {
  return kitWalk('coach_maple', facing, frame, ['coach_maple']);
}

// Rowan uses the existing man kit walk (walk_set('man')), not a frozen
// hero_man_down literal. There is no second Rowan card and no new walk pipeline.
export function rowanSprite(facing = 'down', frame = 0) {
  return kitWalk('hero_man', facing, frame, ['hero_man_down', 'hero_down']);
}

export function wardenSprite(kit = 'hero_man', facing = 'down', frame = 0) {
  const prefix = kit || 'hero_man';
  return kitWalk(prefix, facing, frame, [`${prefix}_down`, 'hero_man_down', 'hero_down']);
}

export function playerPortrait(id) {
  const { portrait } = getCharacter(id);
  return SPRITES[portrait] ? portrait : 'portrait_woman';
}

export const COACH_PORTRAIT = 'portrait_maple';
export const COACH_SPRITE = 'coach_maple';
