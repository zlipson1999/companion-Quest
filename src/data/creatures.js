// Original creature roster. Two kinds of wild creature:
//  - befriendable COMPANIONS (catchable: starters + wild species), each of
//    which can join your team; some evolve.
//  - bad-habit OBSTACLES (Sludgewad, the Snooze, ...) which you can only clear.
// All names/designs are 100% original.
//
// `sprite` -> key in src/data/sprites.js (in-engine pixel art).
// `palette` -> key in SPRITE_PALETTES (emitted by tools/make_sprites.py).
//   Evolutions have their OWN drawn sprite now rather than a recolour of the
//   base silhouette — a tinted copy read as the same creature on screen.

export const CREATURES = {
  // --- Starter line: Balance ---
  sproutle: {
    id: 'sproutle', name: 'Sproutle', sprite: 'sproutle', palette: 'sprout',
    species: 'Seedling Companion', kind: 'starter', goalId: 'balance',
    baseHp: 60, catchable: true, catchRate: 0.55,
    flavor: 'A gentle sprout-spirit. It grows calmer and steadier the more balanced your days become.',
    evolvesTo: 'bloomtail', evolveLevel: 5,
  },
  bloomtail: {
    id: 'bloomtail', name: 'Bloomtail', sprite: 'bloomtail', palette: 'bloom',
    species: 'Blossom Companion', kind: 'evolution', baseHp: 100, scale: 1.18, catchable: false,
    flavor: 'Sproutle in full bloom — its petals open a little wider with every steady week.',
    evolvesTo: null,
  },

  // --- Starter line: Strength ---
  emberkit: {
    id: 'emberkit', name: 'Emberkit', sprite: 'emberkit', palette: 'ember',
    species: 'Ember Cub Companion', kind: 'starter', goalId: 'strength',
    baseHp: 64, catchable: true, catchRate: 0.5,
    flavor: 'A warm little ember cub. Its inner flame burns brighter each time you push yourself.',
    evolvesTo: 'pyrelynx', evolveLevel: 5,
  },
  pyrelynx: {
    id: 'pyrelynx', name: 'Pyrelynx', sprite: 'pyrelynx', palette: 'pyre',
    species: 'Flame Lynx Companion', kind: 'evolution', baseHp: 108, scale: 1.18, catchable: false,
    flavor: 'Emberkit, grown bold and blazing. It paces beside you, ready for the next set.',
    evolvesTo: null,
  },

  // --- Starter line: Distance ---
  dewbble: {
    id: 'dewbble', name: 'Dewbble', sprite: 'dewbble', palette: 'dew',
    species: 'Dewdrop Companion', kind: 'starter', goalId: 'distance',
    baseHp: 58, catchable: true, catchRate: 0.55,
    flavor: 'A bright dewdrop sprite. It rolls a little farther with every step you take together.',
    evolvesTo: 'tidewade', evolveLevel: 5,
  },
  tidewade: {
    id: 'tidewade', name: 'Tidewade', sprite: 'tidewade', palette: 'tide',
    species: 'Tidewalker Companion', kind: 'evolution', baseHp: 96, scale: 1.18, catchable: false,
    flavor: 'Dewbble, deepened into a rolling tide. Distance means nothing to it now.',
    evolvesTo: null,
  },

  // --- Wild catchable companions (found in tall grass) ---
  pebblepup: {
    id: 'pebblepup', name: 'Pebblepup', sprite: 'pebblepup', palette: 'rock',
    species: 'Stonehound Companion', kind: 'wild', baseHp: 66, catchable: true, catchRate: 0.45,
    flavor: 'A sturdy little stone pup. Steady and dependable — it never skips a day.',
    evolvesTo: null,
  },
  wispurr: {
    id: 'wispurr', name: 'Wispurr', sprite: 'wispurr', palette: 'air',
    species: 'Cloudkit Companion', kind: 'wild', baseHp: 54, catchable: true, catchRate: 0.6,
    flavor: 'A breezy cloud-kit. Light on its feet and always ready for a long walk.',
    evolvesTo: null,
  },
  sporelet: {
    id: 'sporelet', name: 'Sporelet', sprite: 'sporelet', palette: 'spore',
    species: 'Sporeling Companion', kind: 'wild', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'A cheerful little mushroom sprite that thrives on rest and good routines.',
    evolvesTo: null,
  },

  // --- Obstacle creatures (bad habits — cleared, not caught) ---
  sludgewad: {
    id: 'sludgewad', name: 'Sludgewad', sprite: 'sludgewad', palette: 'sludge',
    species: 'Sluggishness', kind: 'obstacle', baseHp: 40, catchable: false,
    flavor: 'A blob of that heavy, sluggish feeling. A few good reps melt it right away.',
  },
  snoozeghoul: {
    id: 'snoozeghoul', name: 'Snoozeghoul', sprite: 'snoozeghoul', palette: 'snooze',
    species: 'The Snooze', kind: 'obstacle', baseHp: 50, catchable: false,
    flavor: 'The drowsy fog that whispers "five more minutes." Movement chases it off.',
  },
  achefang: {
    id: 'achefang', name: 'Achefang', sprite: 'achefang', palette: 'ache',
    species: 'Soreness', kind: 'obstacle', baseHp: 60, catchable: false,
    flavor: 'Yesterday\'s soreness, baring its teeth. Move gently and it loses its bite.',
  },
  couchlurk: {
    id: 'couchlurk', name: 'Couchlurk', sprite: 'couchlurk', palette: 'couch',
    species: 'The Slump', kind: 'obstacle', baseHp: 75, catchable: false,
    flavor: 'The cozy pull of the couch. Tougher than it looks — but you are tougher still.',
  },
};

export const STARTER_IDS = ['sproutle', 'emberkit', 'dewbble'];
export const WILD_COMPANION_IDS = ['sproutle', 'emberkit', 'dewbble', 'pebblepup', 'wispurr', 'sporelet'];
export const OBSTACLE_IDS = ['sludgewad', 'snoozeghoul', 'achefang', 'couchlurk'];
export const ALL_CREATURE_IDS = Object.keys(CREATURES);

export function getCreature(id) {
  return CREATURES[id] || null;
}

export default CREATURES;
