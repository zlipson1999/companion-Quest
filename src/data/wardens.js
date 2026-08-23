// Trail Wardens. A Warden is a person who battles WITH a companion —
// same loop as Rowan in the gym, not a creature standing in as the HP bar.
//
// Grove keeps the original six obstacle partners. Horizon capstones each
// bring a new obstacle (still uncleared, never caught). Approach trails
// use the original six as junior keepers.
//
// Sprite prefixes reuse the existing walk kits. No new character pipeline.

export const WARDENS = {
  maple: {
    name: 'Keeper Ash', kit: 'hero_woman',
    line: 'Maple Trail is mine to keep. Sludgewad has been waiting.',
  },
  cairn: {
    name: 'Keeper Flint', kit: 'hero_man',
    line: 'The stones remember who came back. Snoozeghoul does not.',
  },
  gale: {
    name: 'Keeper Wren', kit: 'hero_nonbinary',
    line: 'Open country. Achefang runs it with me.',
  },
  canopy: {
    name: 'Keeper Moss', kit: 'hero_woman',
    line: 'Shade is a kind of work. Couchlurk still has to lose.',
  },
  rill: {
    name: 'Keeper Brine', kit: 'hero_man',
    line: 'Drink, then step. Brinegnash is the lesson.',
  },
  ember: {
    name: 'Keeper Cinder', kit: 'hero_nonbinary',
    line: 'The Grade does not applaud overwork. Cindergrind still stands.',
  },

  saltglass: {
    name: 'Keeper Pearl', kit: 'hero_woman',
    line: 'The strand teaches the bottle. Sludgewad first.',
  },
  tideglass: {
    name: 'Warden Shell', kit: 'hero_man',
    line: 'Blackwave is mine. Saltcramp has the tide.',
  },
  suncrack: {
    name: 'Keeper Ochre', kit: 'hero_nonbinary',
    line: 'Heat first. Achefang walks this shelf with me.',
  },
  redmesa: {
    name: 'Warden Glass', kit: 'hero_woman',
    line: 'The mesa does not rush. Heatgrind does not sit.',
  },
  reedwalk: {
    name: 'Keeper Reed', kit: 'hero_man',
    line: 'Night in the marsh. Snoozeghoul still wants five more minutes.',
  },
  moonfen: {
    name: 'Warden Lotus', kit: 'hero_woman',
    line: 'The delta is still water. Mirelurk is the slump that will not float.',
  },
  needlesnow: {
    name: 'Keeper Needle', kit: 'hero_nonbinary',
    line: 'Snow likes bedtime. Snoozeghoul does not.',
  },
  frostpine: {
    name: 'Warden Rime', kit: 'hero_man',
    line: 'The cavern keeps night. Nightsnooze has to yield.',
  },
  echorail: {
    name: 'Keeper Bell', kit: 'hero_woman',
    line: 'The rail remembers yesterday. Sludgewad is the mute day.',
  },
  copper: {
    name: 'Warden Ring', kit: 'hero_nonbinary',
    line: 'Steam and copper. Muterail is a streak that stopped ringing.',
  },
  cometgrass: {
    name: 'Keeper Dawn', kit: 'hero_woman',
    line: 'Morning is the prairie\'s hour. Sludgewad slept it.',
  },
  starfall: {
    name: 'Warden Comet', kit: 'hero_man',
    line: 'The miles are the point. Stillhoof never left the gate.',
  },
  honeyfall: {
    name: 'Keeper Comb', kit: 'hero_nonbinary',
    line: 'Eat, then walk. Sludgewad skipped lunch.',
  },
  amber: {
    name: 'Warden Wax', kit: 'hero_woman',
    line: 'The orchard feeds the work. Skipcomb is a coffee-only day.',
  },
  staticridge: {
    name: 'Keeper Spark', kit: 'hero_man',
    line: 'The ridge likes a heartbeat. Achefang is yesterday\'s climb.',
  },
  thunderstep: {
    name: 'Warden Horn', kit: 'hero_nonbinary',
    line: 'Storms are weather you trained in. Flathorn never started.',
  },
  rootwater: {
    name: 'Keeper Prop', kit: 'hero_woman',
    line: 'Rest is training. Brinegnash skipped the water and the pause.',
  },
  mangrove: {
    name: 'Warden Grove', kit: 'hero_man',
    line: 'The maze is kinder when you stop. Rootrush will not.',
  },
  ringwood: {
    name: 'Keeper Ring', kit: 'hero_nonbinary',
    line: 'A ring is a ring. Couchlurk would skip the year.',
  },
  deephorizon: {
    name: 'Warden Spiral', kit: 'hero_woman',
    line: 'Ruins are kept promises. Voidglyph is the day you erased.',
  },
};

export function getWarden(routeId) {
  return WARDENS[routeId] || null;
}

export default WARDENS;
