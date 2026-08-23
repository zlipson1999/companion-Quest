// Original creature roster. Two kinds of wild creature:
//  - befriendable COMPANIONS (catchable: starters + wild species), each of
//    which can join your team; some evolve.
//  - bad-habit OBSTACLES (Sludgewad, the Snooze, ...) which you can only clear.
// All names/designs are 100% original.
//
// `sprite` -> key in src/data/sprites.js (in-engine pixel art).
// `palette` -> key in SPRITE_PALETTES (emitted by tools/make_sprites.py).
//   Evolutions have their OWN drawn sprite — a new silhouette, not a
//   recolour, scale, or outline of the base. Each family is baby /
//   adolescent / adult or it is not a family. A tinted copy reads as
//   the same creature on screen and fails tools/check_art.py.

export const CREATURES = {
  // --- Starter line: Balance ---
  sproutle: {
    id: 'sproutle', stage: 1, name: 'Sproutle', sprite: 'sproutle', palette: 'sprout',
    species: 'Seedling Companion', kind: 'starter', type: 'grove', goalId: 'root',
    baseHp: 60, catchable: true, catchRate: 0.55,
    flavor: 'A gentle sprout-spirit. It grows calmer and steadier the more balanced your days become.',
    evolvesTo: 'bloomtail', evolveLevel: 5, evolvePoints: 30,
  },
  bloomtail: {
    id: 'bloomtail', stage: 2, name: 'Bloomtail', sprite: 'bloomtail', palette: 'bloom',
    species: 'Blossom Companion', kind: 'evolution', type: 'grove', baseHp: 100, scale: 1.18, catchable: false,
    flavor: 'Sproutle in full bloom — its petals open a little wider with every steady week.',
    evolvesTo: 'groveheart', evolveLevel: 14, evolvePoints: 110,
  },
  groveheart: {
    id: 'groveheart', stage: 3, name: 'Groveheart', sprite: 'groveheart', palette: 'grove',
    species: 'Grove Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 152, scale: 1.32, catchable: false,
    flavor: 'Seasons of steady days, grown into one standing thing. It keeps the pace you set.',
    evolvesTo: null,
  },

  // --- Starter line: Strength ---
  emberkit: {
    id: 'emberkit', stage: 1, name: 'Emberkit', sprite: 'emberkit', palette: 'ember',
    species: 'Ember Cub Companion', kind: 'starter', type: 'grove', goalId: 'muscle',
    baseHp: 64, catchable: true, catchRate: 0.5,
    flavor: 'A warm little ember cub. Its inner flame burns brighter each time you push yourself.',
    evolvesTo: 'pyrelynx', evolveLevel: 5, evolvePoints: 30,
  },
  pyrelynx: {
    id: 'pyrelynx', stage: 2, name: 'Pyrelynx', sprite: 'pyrelynx', palette: 'pyre',
    species: 'Flame Lynx Companion', kind: 'evolution', type: 'grove', baseHp: 108, scale: 1.18, catchable: false,
    flavor: 'Emberkit, grown bold and blazing. It paces beside you, ready for the next set.',
    evolvesTo: 'cindermane', evolveLevel: 14, evolvePoints: 110,
  },
  cindermane: {
    id: 'cindermane', stage: 3, name: 'Cindermane', sprite: 'cindermane', palette: 'cinder',
    species: 'Blazing Mane Companion', kind: 'evolution', type: 'grove', baseHp: 164, scale: 1.32, catchable: false,
    flavor: 'Every set you ever finished, burning at once. It does not flinch at heavy days.',
    evolvesTo: null,
  },

  // --- Starter line: Distance ---
  dewbble: {
    id: 'dewbble', stage: 1, name: 'Dewbble', sprite: 'dewbble', palette: 'dew',
    species: 'Dewdrop Companion', kind: 'starter', type: 'grove', goalId: 'lean',
    baseHp: 58, catchable: true, catchRate: 0.55,
    flavor: 'A bright dewdrop sprite. It rolls a little farther with every step you take together.',
    evolvesTo: 'tidewade', evolveLevel: 5, evolvePoints: 30,
  },
  tidewade: {
    id: 'tidewade', stage: 2, name: 'Tidewade', sprite: 'tidewade', palette: 'tide',
    species: 'Tidewalker Companion', kind: 'evolution', type: 'grove', baseHp: 96, scale: 1.18, catchable: false,
    flavor: 'Dewbble, deepened into a rolling tide. Distance means nothing to it now.',
    evolvesTo: 'maelstride', evolveLevel: 14, evolvePoints: 110,
  },
  maelstride: {
    id: 'maelstride', stage: 3, name: 'Maelstride', sprite: 'maelstride', palette: 'maels',
    species: 'Deep Current Companion', kind: 'evolution', type: 'grove', baseHp: 146, scale: 1.32, catchable: false,
    flavor: 'A current with somewhere to be. Every mile you have walked is still moving in it.',
    evolvesTo: null,
  },

  // --- Wild catchable companions (found in tall grass) ---
  pebblepup: {
    id: 'pebblepup', stage: 1, name: 'Pebblepup', sprite: 'pebblepup', palette: 'rock',
    species: 'Stonehound Companion', kind: 'wild', type: 'stone', baseHp: 66, catchable: true, catchRate: 0.45,
    flavor: 'A sturdy little stone pup. Steady and dependable — it never skips a day.',
    evolvesTo: 'cairnhound', evolveLevel: 5, evolvePoints: 30,
  },
  cairnhound: {
    id: 'cairnhound', stage: 2, name: 'Cairnhound', sprite: 'cairnhound', palette: 'rock',
    species: 'Cairn Hound Companion', kind: 'evolution', type: 'stone', baseHp: 112, scale: 1.18, catchable: false,
    flavor: 'Steady days have lengthened its stride and settled every stone into place.',
    evolvesTo: 'monolithound', evolveLevel: 14, evolvePoints: 110,
  },
  monolithound: {
    id: 'monolithound', stage: 3, name: 'Monolithound', sprite: 'monolithound', palette: 'rock',
    species: 'Monolith Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 170, scale: 1.32, catchable: false,
    flavor: 'A patient guardian built one dependable day at a time.',
    evolvesTo: null,
  },
  wispurr: {
    id: 'wispurr', stage: 1, name: 'Wispurr', sprite: 'wispurr', palette: 'air',
    species: 'Cloudkit Companion', kind: 'wild', type: 'wind', baseHp: 54, catchable: true, catchRate: 0.6,
    flavor: 'A breezy cloud-kit. Light on its feet and always ready for a long walk.',
    evolvesTo: 'galegait', evolveLevel: 5, evolvePoints: 30,
  },
  galegait: {
    id: 'galegait', stage: 2, name: 'Galegait', sprite: 'galegait', palette: 'air',
    species: 'Gale Cat Companion', kind: 'evolution', type: 'wind', baseHp: 94, scale: 1.18, catchable: false,
    flavor: 'Its stride carries the clean momentum of a morning breeze.',
    evolvesTo: 'skywhorl', evolveLevel: 14, evolvePoints: 110,
  },
  skywhorl: {
    id: 'skywhorl', stage: 3, name: 'Skywhorl', sprite: 'skywhorl', palette: 'air',
    species: 'Dawnwind Guardian Companion', kind: 'evolution', type: 'wind', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Every mile circles its bright heart like wind around a sunrise.',
    evolvesTo: null,
  },
  sporelet: {
    id: 'sporelet', stage: 1, name: 'Sporelet', sprite: 'sporelet', palette: 'spore',
    species: 'Sporeling Companion', kind: 'wild', type: 'rest', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'A cheerful little mushroom sprite that thrives on rest and good routines.',
    evolvesTo: 'mycobloom', evolveLevel: 5, evolvePoints: 30,
  },
  mycobloom: {
    id: 'mycobloom', stage: 2, name: 'Mycobloom', sprite: 'mycobloom', palette: 'spore',
    species: 'Restorative Scout Companion', kind: 'evolution', type: 'rest', baseHp: 104, scale: 1.18, catchable: false,
    flavor: 'Good rest gathers beneath its cap as warm, guiding spores.',
    evolvesTo: 'canopore', evolveLevel: 14, evolvePoints: 110,
  },
  canopore: {
    id: 'canopore', stage: 3, name: 'Canopore', sprite: 'canopore', palette: 'spore',
    species: 'Living Canopy Companion', kind: 'evolution', type: 'rest', baseHp: 158, scale: 1.32, catchable: false,
    flavor: 'A sheltering grove grown from recovery practiced without guilt.',
    evolvesTo: null,
  },

  // --- Trail companions: 12 families of 3, same evolve gates as the first six ---
  spinseed: {
    id: 'spinseed', stage: 1, name: 'Spinseed', sprite: 'spinseed', palette: 'samara',
    species: 'Samara Companion', kind: 'wild', type: 'grove', baseHp: 56, catchable: true, catchRate: 0.55,
    flavor: 'A maple-key spirit. It helicopters beside you for as long as you keep walking.',
    evolvesTo: 'whirlkey', evolveLevel: 5, evolvePoints: 30,
  },
  whirlkey: {
    id: 'whirlkey', stage: 2, name: 'Whirlkey', sprite: 'whirlkey', palette: 'samara',
    species: 'Twin-Wing Companion', kind: 'evolution', type: 'grove', baseHp: 96, scale: 1.18, catchable: false,
    flavor: 'The wings lengthen. A walk that used to spin it now carries it.',
    evolvesTo: 'samaraile', evolveLevel: 14, evolvePoints: 110,
  },
  samaraile: {
    id: 'samaraile', stage: 3, name: 'Samaraile', sprite: 'samaraile', palette: 'grove',
    species: 'Key-Sail Companion', kind: 'evolution', type: 'grove', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'A standing sail of maple-keys. Every mile you walked is still turning in it.',
    evolvesTo: null,
  },
  bramblet: {
    id: 'bramblet', stage: 1, name: 'Bramblet', sprite: 'bramblet', palette: 'bramble',
    species: 'Bramble Knot Companion', kind: 'wild', type: 'grove', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'A walking knot of living bramble. Thorny to look at, patient on the lane.',
    evolvesTo: 'briarthicket', evolveLevel: 5, evolvePoints: 30,
  },
  briarthicket: {
    id: 'briarthicket', stage: 2, name: 'Briarthicket', sprite: 'briarthicket', palette: 'bramble',
    species: 'Thicket Companion', kind: 'evolution', type: 'grove', baseHp: 104, scale: 1.18, catchable: false,
    flavor: 'The knot becomes a walking thicket. It still lets you through.',
    evolvesTo: 'hedgeroot', evolveLevel: 14, evolvePoints: 110,
  },
  hedgeroot: {
    id: 'hedgeroot', stage: 3, name: 'Hedgeroot', sprite: 'hedgeroot', palette: 'grove',
    species: 'Hedge Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 160, scale: 1.32, catchable: false,
    flavor: 'A rooted hedge that keeps the lane. Steady days grew it this wide.',
    evolvesTo: null,
  },
  lanternbud: {
    id: 'lanternbud', stage: 1, name: 'Lanternbud', sprite: 'lanternbud', palette: 'lantern',
    species: 'Sap-Lantern Companion', kind: 'wild', type: 'grove', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'A closed bud that holds a bead of sap-light. It brightens when you show up.',
    evolvesTo: 'gleambud', evolveLevel: 5, evolvePoints: 30,
  },
  gleambud: {
    id: 'gleambud', stage: 2, name: 'Gleambud', sprite: 'gleambud', palette: 'lantern',
    species: 'Opening Lantern Companion', kind: 'evolution', type: 'grove', baseHp: 98, scale: 1.18, catchable: false,
    flavor: 'The petals part. The sap-light is no longer a secret.',
    evolvesTo: 'grovelamp', evolveLevel: 14, evolvePoints: 110,
  },
  grovelamp: {
    id: 'grovelamp', stage: 3, name: 'Grovelamp', sprite: 'grovelamp', palette: 'grove',
    species: 'Path-Lamp Companion', kind: 'evolution', type: 'grove', baseHp: 150, scale: 1.32, catchable: false,
    flavor: 'A standing bloom that keeps the path lit. Showing up is what filled it.',
    evolvesTo: null,
  },
  rubblet: {
    id: 'rubblet', stage: 1, name: 'Rubblet', sprite: 'rubblet', palette: 'rock',
    species: 'Cairn Stack Companion', kind: 'wild', type: 'stone', baseHp: 70, catchable: true, catchRate: 0.45,
    flavor: 'Three stones that decided to travel together. The middle one does the talking.',
    evolvesTo: 'cairnstack', evolveLevel: 5, evolvePoints: 30,
  },
  cairnstack: {
    id: 'cairnstack', stage: 2, name: 'Cairnstack', sprite: 'cairnstack', palette: 'rock',
    species: 'Stone-Pile Companion', kind: 'evolution', type: 'stone', baseHp: 112, scale: 1.18, catchable: false,
    flavor: 'More stones joined. The face is still in the middle.',
    evolvesTo: 'dolmenhold', evolveLevel: 14, evolvePoints: 110,
  },
  dolmenhold: {
    id: 'dolmenhold', stage: 3, name: 'Dolmenhold', sprite: 'dolmenhold', palette: 'rock',
    species: 'Standing-Stone Companion', kind: 'evolution', type: 'stone', baseHp: 170, scale: 1.32, catchable: false,
    flavor: 'A doorway of stone that learned to walk. It marks the cut you finished.',
    evolvesTo: null,
  },
  chockit: {
    id: 'chockit', stage: 1, name: 'Chockit', sprite: 'chockit', palette: 'chock',
    species: 'Wedge-Stone Companion', kind: 'wild', type: 'stone', baseHp: 68, catchable: true, catchRate: 0.46,
    flavor: 'A climbing wedge with grip-toes. It likes a path that leans uphill.',
    evolvesTo: 'crackwedge', evolveLevel: 5, evolvePoints: 30,
  },
  crackwedge: {
    id: 'crackwedge', stage: 2, name: 'Crackwedge', sprite: 'crackwedge', palette: 'chock',
    species: 'Strata Wedge Companion', kind: 'evolution', type: 'stone', baseHp: 110, scale: 1.18, catchable: false,
    flavor: 'The bands show. It holds a crack the way you hold a habit.',
    evolvesTo: 'cliffchock', evolveLevel: 14, evolvePoints: 110,
  },
  cliffchock: {
    id: 'cliffchock', stage: 3, name: 'Cliffchock', sprite: 'cliffchock', palette: 'chock',
    species: 'Cliff-Hitch Companion', kind: 'evolution', type: 'stone', baseHp: 168, scale: 1.32, catchable: false,
    flavor: 'A hitch the size of a decision. Uphill days settled every band.',
    evolvesTo: null,
  },
  facetel: {
    id: 'facetel', stage: 1, name: 'Facetel', sprite: 'facetel', palette: 'quartz',
    species: 'Quartz Cluster Companion', kind: 'wild', type: 'stone', baseHp: 64, catchable: true, catchRate: 0.48,
    flavor: 'A shy face lives in the largest facet. Catch the light and it looks back.',
    evolvesTo: 'prismore', evolveLevel: 5, evolvePoints: 30,
  },
  prismore: {
    id: 'prismore', stage: 2, name: 'Prismore', sprite: 'prismore', palette: 'quartz',
    species: 'Crystal Cluster Companion', kind: 'evolution', type: 'stone', baseHp: 108, scale: 1.18, catchable: false,
    flavor: 'A body grew around the heart-face. The head is still only crystal.',
    evolvesTo: 'quartzspire', evolveLevel: 14, evolvePoints: 110,
  },
  quartzspire: {
    id: 'quartzspire', stage: 3, name: 'Quartzspire', sprite: 'quartzspire', palette: 'quartz',
    species: 'Heart-Facet Companion', kind: 'evolution', type: 'stone', baseHp: 164, scale: 1.32, catchable: false,
    flavor: 'A standing prism. One face on the crown, one in the heart.',
    evolvesTo: null,
  },
  whistlet: {
    id: 'whistlet', stage: 1, name: 'Whistlet', sprite: 'whistlet', palette: 'air',
    species: 'Reed-Wind Companion', kind: 'wild', type: 'wind', baseHp: 54, catchable: true, catchRate: 0.58,
    flavor: 'A reed-flute bird. It only sings when you are actually moving.',
    evolvesTo: 'reedgale', evolveLevel: 5, evolvePoints: 30,
  },
  reedgale: {
    id: 'reedgale', stage: 2, name: 'Reedgale', sprite: 'reedgale', palette: 'air',
    species: 'Gale-Reed Companion', kind: 'evolution', type: 'wind', baseHp: 94, scale: 1.18, catchable: false,
    flavor: 'The reed lengthens. A faster walk writes a clearer note.',
    evolvesTo: 'stormflute', evolveLevel: 14, evolvePoints: 110,
  },
  stormflute: {
    id: 'stormflute', stage: 3, name: 'Stormflute', sprite: 'stormflute', palette: 'air',
    species: 'Wind-Instrument Companion', kind: 'evolution', type: 'wind', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'A living instrument. Open country is the song it was waiting for.',
    evolvesTo: null,
  },
  kitefin: {
    id: 'kitefin', stage: 1, name: 'Kitefin', sprite: 'kitefin', palette: 'kite',
    species: 'Kite-Ray Companion', kind: 'wild', type: 'wind', baseHp: 52, catchable: true, catchRate: 0.6,
    flavor: 'A thin sail of a creature. The wind holds it up; your pace keeps it near.',
    evolvesTo: 'ribbonsail', evolveLevel: 5, evolvePoints: 30,
  },
  ribbonsail: {
    id: 'ribbonsail', stage: 2, name: 'Ribbonsail', sprite: 'ribbonsail', palette: 'kite',
    species: 'Ribbon-Ray Companion', kind: 'evolution', type: 'wind', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'The sail widens. The ribbons write your pace on the air.',
    evolvesTo: 'skysheet', evolveLevel: 14, evolvePoints: 110,
  },
  skysheet: {
    id: 'skysheet', stage: 3, name: 'Skysheet', sprite: 'skysheet', palette: 'kite',
    species: 'Sky-Sheet Companion', kind: 'evolution', type: 'wind', baseHp: 146, scale: 1.32, catchable: false,
    flavor: 'A sheet of sky that chose you. Gale days are what grew it.',
    evolvesTo: null,
  },
  loftburr: {
    id: 'loftburr', stage: 1, name: 'Loftburr', sprite: 'loftburr', palette: 'puff',
    species: 'Seed-Parachute Companion', kind: 'wild', type: 'wind', baseHp: 50, catchable: true, catchRate: 0.62,
    flavor: 'A puff of seed-down with thread legs. It drifts until you give it somewhere to land.',
    evolvesTo: 'driftpuff', evolveLevel: 5, evolvePoints: 30,
  },
  driftpuff: {
    id: 'driftpuff', stage: 2, name: 'Driftpuff', sprite: 'driftpuff', palette: 'puff',
    species: 'Parachute Companion', kind: 'evolution', type: 'wind', baseHp: 90, scale: 1.18, catchable: false,
    flavor: 'More down, longer threads. It lands when you do.',
    evolvesTo: 'cloudburr', evolveLevel: 14, evolvePoints: 110,
  },
  cloudburr: {
    id: 'cloudburr', stage: 3, name: 'Cloudburr', sprite: 'cloudburr', palette: 'puff',
    species: 'Cloud-Seed Companion', kind: 'evolution', type: 'wind', baseHp: 144, scale: 1.32, catchable: false,
    flavor: 'A drifting seed-cloud. It stays because you gave it a place.',
    evolvesTo: null,
  },
  fernap: {
    id: 'fernap', stage: 1, name: 'Fernap', sprite: 'fernap', palette: 'fern',
    species: 'Fiddlehead Companion', kind: 'wild', type: 'rest', baseHp: 60, catchable: true, catchRate: 0.5,
    flavor: 'A curled fern that unfurls a little more after an honest rest.',
    evolvesTo: 'fiddlefrond', evolveLevel: 5, evolvePoints: 30,
  },
  fiddlefrond: {
    id: 'fiddlefrond', stage: 2, name: 'Fiddlefrond', sprite: 'fiddlefrond', palette: 'fern',
    species: 'Unfurling Companion', kind: 'evolution', type: 'rest', baseHp: 102, scale: 1.18, catchable: false,
    flavor: 'The spiral opens. Rest is what it was waiting to do.',
    evolvesTo: 'frondrest', evolveLevel: 14, evolvePoints: 110,
  },
  frondrest: {
    id: 'frondrest', stage: 3, name: 'Frondrest', sprite: 'frondrest', palette: 'grove',
    species: 'Shelter-Frond Companion', kind: 'evolution', type: 'rest', baseHp: 156, scale: 1.32, catchable: false,
    flavor: 'A frond you can sit under. Recovery practiced without guilt grew it.',
    evolvesTo: null,
  },
  dapple: {
    id: 'dapple', stage: 1, name: 'Dapple', sprite: 'dapple', palette: 'dapple',
    species: 'Shade-Moth Companion', kind: 'wild', type: 'rest', baseHp: 56, catchable: true, catchRate: 0.54,
    flavor: 'Wings like sunlight through leaves. It settles when you stop rushing.',
    evolvesTo: 'glimmoth', evolveLevel: 5, evolvePoints: 30,
  },
  glimmoth: {
    id: 'glimmoth', stage: 2, name: 'Glimmoth', sprite: 'glimmoth', palette: 'dapple',
    species: 'Light-Spot Companion', kind: 'evolution', type: 'rest', baseHp: 96, scale: 1.18, catchable: false,
    flavor: 'Broader wings, more light. Stillness is how the spots stay.',
    evolvesTo: 'leaflight', evolveLevel: 14, evolvePoints: 110,
  },
  leaflight: {
    id: 'leaflight', stage: 3, name: 'Leaflight', sprite: 'leaflight', palette: 'grove',
    species: 'Canopy-Moth Companion', kind: 'evolution', type: 'rest', baseHp: 152, scale: 1.32, catchable: false,
    flavor: 'A canopy of wings. Shade you earned by not rushing.',
    evolvesTo: null,
  },
  stillcup: {
    id: 'stillcup', stage: 1, name: 'Stillcup', sprite: 'stillcup', palette: 'moss',
    species: 'Rain-Cup Companion', kind: 'wild', type: 'rest', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'A moss cup that holds one bead of rain. Stillness is how it stays full.',
    evolvesTo: 'dewbasin', evolveLevel: 5, evolvePoints: 30,
  },
  dewbasin: {
    id: 'dewbasin', stage: 2, name: 'Dewbasin', sprite: 'dewbasin', palette: 'moss',
    species: 'Dew-Bowl Companion', kind: 'evolution', type: 'rest', baseHp: 100, scale: 1.18, catchable: false,
    flavor: 'A wider bowl. The bead is a pool now.',
    evolvesTo: 'rainhold', evolveLevel: 14, evolvePoints: 110,
  },
  rainhold: {
    id: 'rainhold', stage: 3, name: 'Rainhold', sprite: 'rainhold', palette: 'moss',
    species: 'Still-Basin Companion', kind: 'evolution', type: 'rest', baseHp: 154, scale: 1.32, catchable: false,
    flavor: 'A basin that keeps the walk watered. You filled it by stopping.',
    evolvesTo: null,
  },

  // --- Obstacle creatures (bad habits — cleared, not caught) ---
  sludgewad: {
    id: 'sludgewad', name: 'Sludgewad', sprite: 'sludgewad', palette: 'sludge',
    species: 'Sluggishness', kind: 'obstacle', type: 'grove', baseHp: 40, catchable: false,
    flavor: 'A blob of that heavy, sluggish feeling. A few good reps melt it right away.',
  },
  snoozeghoul: {
    id: 'snoozeghoul', name: 'Snoozeghoul', sprite: 'snoozeghoul', palette: 'snooze',
    species: 'The Snooze', kind: 'obstacle', type: 'stone', baseHp: 50, catchable: false,
    flavor: 'The drowsy fog that whispers "five more minutes." Movement chases it off.',
  },
  achefang: {
    id: 'achefang', name: 'Achefang', sprite: 'achefang', palette: 'ache',
    species: 'Soreness', kind: 'obstacle', type: 'wind', baseHp: 60, catchable: false,
    flavor: 'Yesterday\'s soreness, baring its teeth. Move gently and it loses its bite.',
  },
  couchlurk: {
    id: 'couchlurk', name: 'Couchlurk', sprite: 'couchlurk', palette: 'couch',
    species: 'The Slump', kind: 'obstacle', type: 'rest', baseHp: 75, catchable: false,
    flavor: 'The cozy pull of the couch. Tougher than it looks — but you are tougher still.',
  },
  brinegnash: {
    id: 'brinegnash', name: 'Brinegnash', sprite: 'brinegnash', palette: 'brine',
    species: 'The Cramp', kind: 'obstacle', type: 'tide', baseHp: 95, catchable: false,
    flavor: 'Salt and skipped water, grinding in the calves. Drink, then move through it.',
  },
  cindergrind: {
    id: 'cindergrind', name: 'Cindergrind', sprite: 'cindergrind', palette: 'scorch',
    species: 'The Overwork', kind: 'obstacle', type: 'ember', baseHp: 120, catchable: false,
    flavor: 'The grind that will not sit down. Hard days without recovery, given teeth.',
  },
};

export const STARTER_IDS = ['sproutle', 'emberkit', 'dewbble'];
export const TRAIL_COMPANION_IDS = [
  'spinseed', 'bramblet', 'lanternbud',
  'rubblet', 'chockit', 'facetel',
  'whistlet', 'kitefin', 'loftburr',
  'fernap', 'dapple', 'stillcup',
];
export const WILD_COMPANION_IDS = [
  ...STARTER_IDS, 'pebblepup', 'wispurr', 'sporelet', ...TRAIL_COMPANION_IDS,
];
export const OBSTACLE_IDS = [
  'sludgewad', 'snoozeghoul', 'achefang', 'couchlurk', 'brinegnash', 'cindergrind',
];
export const ALL_CREATURE_IDS = Object.keys(CREATURES);

// Types belong on the creature, not on the trail table — creatures.js must
// not import routes.js. Maple's three starters are Grove; each later trail
// introduces one type of its own.
export const CREATURE_TYPES = {
  grove: 'Grove',
  stone: 'Stone',
  wind: 'Wind',
  rest: 'Rest',
  tide: 'Tide',
  ember: 'Ember',
};

export function getCreature(id) {
  return CREATURES[id] || null;
}

// Every stage of one family, from the form you meet first.
export function familyChain(rootId) {
  const chain = [];
  for (let id = rootId; id && !chain.includes(id); id = getCreature(id).evolvesTo) chain.push(id);
  return chain;
}

// The roster in the order a Creature Index should read: each companion family
// whole, first-bond families first, then the obstacles.
//
// The Index used to build this itself and followed evolvesTo exactly ONCE, so
// it listed thirteen of the twenty-two and not one final evolution among them.
// Evolving stamped `dex[groveheart] = 'owned'` for a page that could never
// print the row. Order belongs to the roster, not to the screen that shows it.
export const INDEX_ORDER = [
  ...WILD_COMPANION_IDS.flatMap(familyChain),
  ...OBSTACLE_IDS,
];

// Same guard as the sprite generator's: a creature nothing lists is a creature
// nobody can ever see, and that is precisely how the character cards sat unused
// for a release.
const unlisted = ALL_CREATURE_IDS.filter((id) => !INDEX_ORDER.includes(id));
if (unlisted.length) {
  throw new Error(`creatures: ${unlisted.join(', ')} reach no Index entry`);
}

// A companion ships as a complete 3-stage family or not at all. A two-stage
// line used to pass INDEX_ORDER (both ids listed) and still ship unfinished.
// Obstacles do not evolve. Baby / adolescent / adult — not a tint of one pose.
const shortFamily = WILD_COMPANION_IDS.filter((id) => familyChain(id).length !== 3);
if (shortFamily.length) {
  throw new Error(
    `creatures: ${shortFamily.join(', ')} must be a complete 3-stage family `
    + '(baby / adolescent / adult). Incomplete families are not allowed.',
  );
}

export default CREATURES;
