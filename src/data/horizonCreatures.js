// Horizon families (40 x 3). Named trails that are not walkable yet.
// User plates still incoming — do not invent sphere() stand-ins.
// Roster source: docs/HORIZON_FAMILIES.md
//
// Same evolve gates as the shipped roster:
// stage 1 catchable → stage 2 at Lv 5 / 30 pts → stage 3 at Lv 14 / 110 pts.

export const HORIZON_COMPANION_IDS = [
  'brineling',  // Saltglass Strand
  'dusthorn',  // Suncrack Trail
  'mireblink',  // Silver Reed Walk
  'pinepuff',  // Needle-Snow Pass
  'clinket',  // Echo Rail
  'glintfoal',  // Cometgrass Run
  'propfin',  // Rootwater Boardwalk
  'zapram',  // Static Ridge
  'nectlet',  // Honeyfall Lane
  'chipmagma',  // Glassfire Descent
  'bellbun',  // Petalwind Path
  'nailnut',  // Forgeleaf Trail
  'pipolyp',  // Anemone Steps
  'veilisk',  // Mirage Track
  'plinkbat',  // Dripstone Trail
  'burrcalf',  // Thistlehoof Way
  'prismink',  // Aurora Shelf
  'kneebit',  // Kneeroot Loop
  'mumblewool',  // Hushheather Trail
  'skiprock',  // Blackwave Traverse
  'glimrice',  // Lantern Rice Path
  'roseling',  // Heartstone Walk
  'wicklet',  // Drooping Branch Trail
  'sootfinch',  // Cindergrass Route
  'budice',  // Iceflower Circuit
  'niblet',  // Podshade Track
  'siltip',  // Eelgrass Causeway
  'mistyak',  // Sunabove Trail
  'twigglypt',  // Ringwood Path
  'glyphish',  // Bubble Archway
  'knockit',  // Hollowstem Way
  'pepkit',  // Spicewind Track
  'pebbloom',  // Echo Gem Route
  'lotadpole',  // Petalwater Trail
  'kernelit',  // Grainwheel Road
  'conecko',  // Giant Step Trail
  'bloopot',  // Steamstone Walk
  'figbat',  // Starlit Fig Path
  'ammonip',  // Fossil Current
  'tinkid',  // Bellflower Ascent
];

export const HORIZON_CREATURES = {
  // Brineling → Shoregleam → Tidecrown  (Tideglass Coast / Saltglass Strand)
  brineling: {
    id: 'brineling', stage: 1, name: 'Brineling', sprite: 'brineling', palette: 'dew',
    species: 'Sea-Glass Hermit Companion', kind: 'horizon', type: 'tide', baseHp: 58, catchable: true, catchRate: 0.55,
    flavor: 'Sea-glass hermit spirit. translucent sea-glass shell, tiny coral feet, pearl eyes.',
    evolvesTo: 'shoregleam', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Tideglass Coast', trail: 'Saltglass Strand', core: 'sea-glass hermit spirit',
  },
  shoregleam: {
    id: 'shoregleam', stage: 2, name: 'Shoregleam', sprite: 'shoregleam', palette: 'dew',
    species: 'Faceted Tidal Hermit Companion', kind: 'evolution', type: 'tide', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Larger faceted shell with tidal ribbons and coral limbs.',
    evolvesTo: 'tidecrown', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Tideglass Coast', trail: 'Saltglass Strand', core: 'sea-glass hermit spirit',
  },
  tidecrown: {
    id: 'tidecrown', stage: 3, name: 'Tidecrown', sprite: 'tidecrown', palette: 'dew',
    species: 'Sea-Glass Surf Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Towering sea-glass guardian with a crown of surf and luminous coral.',
    evolvesTo: null,
    horizon: true, routeName: 'Tideglass Coast', trail: 'Saltglass Strand', core: 'sea-glass hermit spirit',
  },

  // Dusthorn → Mesaquill → Suncerast  (Red Mesa / Suncrack Trail)
  dusthorn: {
    id: 'dusthorn', stage: 1, name: 'Dusthorn', sprite: 'dusthorn', palette: 'rock',
    species: 'Sandstone Lizard Companion', kind: 'horizon', type: 'stone', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'Desert horned-lizard spirit. round sandstone body, tiny hornlets, fan tail.',
    evolvesTo: 'mesaquill', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Red Mesa', trail: 'Suncrack Trail', core: 'desert horned-lizard spirit',
  },
  mesaquill: {
    id: 'mesaquill', stage: 2, name: 'Mesaquill', sprite: 'mesaquill', palette: 'rock',
    species: 'Layered Stone Runner Companion', kind: 'evolution', type: 'stone', baseHp: 105, scale: 1.18, catchable: false,
    flavor: 'Lean runner with layered stone scales and sunlit quills.',
    evolvesTo: 'suncerast', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Red Mesa', trail: 'Suncrack Trail', core: 'desert horned-lizard spirit',
  },
  suncerast: {
    id: 'suncerast', stage: 3, name: 'Suncerast', sprite: 'suncerast', palette: 'rock',
    species: 'Radiant Mesa Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 158, scale: 1.32, catchable: false,
    flavor: 'Broad desert guardian with radiant horn-crown and mesa-like armor.',
    evolvesTo: null,
    horizon: true, routeName: 'Red Mesa', trail: 'Suncrack Trail', core: 'desert horned-lizard spirit',
  },

  // Mireblink → Lunareed → Fenoracle  (Moonfen / Silver Reed Walk)
  mireblink: {
    id: 'mireblink', stage: 1, name: 'Mireblink', sprite: 'mireblink', palette: 'moss',
    species: 'Marsh Firefly Frog Companion', kind: 'horizon', type: 'rest', baseHp: 56, catchable: true, catchRate: 0.55,
    flavor: 'Marsh firefly-frog spirit. soft frog body, glowing throat bead, reed toes.',
    evolvesTo: 'lunareed', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Moonfen', trail: 'Silver Reed Walk', core: 'marsh firefly-frog spirit',
  },
  lunareed: {
    id: 'lunareed', stage: 2, name: 'Lunareed', sprite: 'lunareed', palette: 'moss',
    species: 'Luminous Reed Jumper Companion', kind: 'evolution', type: 'rest', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Long-legged marsh jumper with luminous reed frills.',
    evolvesTo: 'fenoracle', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Moonfen', trail: 'Silver Reed Walk', core: 'marsh firefly-frog spirit',
  },
  fenoracle: {
    id: 'fenoracle', stage: 3, name: 'Fenoracle', sprite: 'fenoracle', palette: 'moss',
    species: 'Moonlit Reed Guardian Companion', kind: 'evolution', type: 'rest', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Serene amphibian guardian with moonlit reed mantle and floating lights.',
    evolvesTo: null,
    horizon: true, routeName: 'Moonfen', trail: 'Silver Reed Walk', core: 'marsh firefly-frog spirit',
  },

  // Pinepuff → Rimecone → Frostbough  (Frostpine Reach / Needle-Snow Pass)
  pinepuff: {
    id: 'pinepuff', stage: 1, name: 'Pinepuff', sprite: 'pinepuff', palette: 'sprout',
    species: 'Pinecone Snow Spirit Companion', kind: 'horizon', type: 'grove', baseHp: 60, catchable: true, catchRate: 0.52,
    flavor: 'Pinecone snow spirit. fuzzy cone body, snowcap, twig feet.',
    evolvesTo: 'rimecone', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Frostpine Reach', trail: 'Needle-Snow Pass', core: 'pinecone snow spirit',
  },
  rimecone: {
    id: 'rimecone', stage: 2, name: 'Rimecone', sprite: 'rimecone', palette: 'sprout',
    species: 'Frosted Cone Walker Companion', kind: 'evolution', type: 'grove', baseHp: 102, scale: 1.18, catchable: false,
    flavor: 'Upright cone creature with frosted branch arms.',
    evolvesTo: 'frostbough', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Frostpine Reach', trail: 'Needle-Snow Pass', core: 'pinecone snow spirit',
  },
  frostbough: {
    id: 'frostbough', stage: 3, name: 'Frostbough', sprite: 'frostbough', palette: 'sprout',
    species: 'Evergreen Snow Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 153, scale: 1.32, catchable: false,
    flavor: 'Massive evergreen guardian with cone-plated chest and snow-laden bough antlers.',
    evolvesTo: null,
    horizon: true, routeName: 'Frostpine Reach', trail: 'Needle-Snow Pass', core: 'pinecone snow spirit',
  },

  // Clinket → Bellstride → Canyonchime  (Copper Canyon / Echo Rail)
  clinket: {
    id: 'clinket', stage: 1, name: 'Clinket', sprite: 'clinket', palette: 'chock',
    species: 'Copper Bell Armadillo Companion', kind: 'horizon', type: 'stone', baseHp: 64, catchable: true, catchRate: 0.48,
    flavor: 'Copper bell armadillo. small plated body with bell-shaped ears.',
    evolvesTo: 'bellstride', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Copper Canyon', trail: 'Echo Rail', core: 'copper bell armadillo',
  },
  bellstride: {
    id: 'bellstride', stage: 2, name: 'Bellstride', sprite: 'bellstride', palette: 'chock',
    species: 'Copper-Plate Strider Companion', kind: 'evolution', type: 'stone', baseHp: 109, scale: 1.18, catchable: false,
    flavor: 'Longer copper plates and resonant tail rings.',
    evolvesTo: 'canyonchime', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Copper Canyon', trail: 'Echo Rail', core: 'copper bell armadillo',
  },
  canyonchime: {
    id: 'canyonchime', stage: 3, name: 'Canyonchime', sprite: 'canyonchime', palette: 'chock',
    species: 'Canyon Bell Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 163, scale: 1.32, catchable: false,
    flavor: 'Powerful plated guardian whose overlapping copper armor rings like canyon bells.',
    evolvesTo: null,
    horizon: true, routeName: 'Copper Canyon', trail: 'Echo Rail', core: 'copper bell armadillo',
  },

  // Glintfoal → Astramare → Cometmane  (Starfall Prairie / Cometgrass Run)
  glintfoal: {
    id: 'glintfoal', stage: 1, name: 'Glintfoal', sprite: 'glintfoal', palette: 'air',
    species: 'Starlight Foal Companion', kind: 'horizon', type: 'wind', baseHp: 54, catchable: true, catchRate: 0.58,
    flavor: 'Starlight prairie foal. tiny foal with speckled luminous coat and comet tuft.',
    evolvesTo: 'astramare', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Starfall Prairie', trail: 'Cometgrass Run', core: 'starlight prairie foal',
  },
  astramare: {
    id: 'astramare', stage: 2, name: 'Astramare', sprite: 'astramare', palette: 'air',
    species: 'Constellation Horse Companion', kind: 'evolution', type: 'wind', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Sleek young horse with constellation markings.',
    evolvesTo: 'cometmane', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Starfall Prairie', trail: 'Cometgrass Run', core: 'starlight prairie foal',
  },
  cometmane: {
    id: 'cometmane', stage: 3, name: 'Cometmane', sprite: 'cometmane', palette: 'air',
    species: 'Comet Mane Guardian Companion', kind: 'evolution', type: 'wind', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Majestic celestial horse with flowing comet mane and star-dust hooves.',
    evolvesTo: null,
    horizon: true, routeName: 'Starfall Prairie', trail: 'Cometgrass Run', core: 'starlight prairie foal',
  },

  // Propfin → Mangrusk → Rootback  (Mangrove Maze / Rootwater Boardwalk)
  propfin: {
    id: 'propfin', stage: 1, name: 'Propfin', sprite: 'propfin', palette: 'tide',
    species: 'Mangrove Mudskipper Companion', kind: 'horizon', type: 'tide', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'Mangrove mudskipper spirit. round fish-amphibian with prop-root fins.',
    evolvesTo: 'mangrusk', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Mangrove Maze', trail: 'Rootwater Boardwalk', core: 'mangrove mudskipper spirit',
  },
  mangrusk: {
    id: 'mangrusk', stage: 2, name: 'Mangrusk', sprite: 'mangrusk', palette: 'tide',
    species: 'Root-Fin Climber Companion', kind: 'evolution', type: 'tide', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Long-bodied climber with branching root fins.',
    evolvesTo: 'rootback', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Mangrove Maze', trail: 'Rootwater Boardwalk', core: 'mangrove mudskipper spirit',
  },
  rootback: {
    id: 'rootback', stage: 3, name: 'Rootback', sprite: 'rootback', palette: 'tide',
    species: 'Mangrove Grove Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Broad amphibious guardian carrying a miniature mangrove grove across its back.',
    evolvesTo: null,
    horizon: true, routeName: 'Mangrove Maze', trail: 'Rootwater Boardwalk', core: 'mangrove mudskipper spirit',
  },

  // Zapram → Voltibex → Stormhorn  (Thunderstep Highlands / Static Ridge)
  zapram: {
    id: 'zapram', stage: 1, name: 'Zapram', sprite: 'zapram', palette: 'ember',
    species: 'Static Goat Kid Companion', kind: 'horizon', type: 'ember', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'Electric mountain goat spirit. woolly kid with tiny glowing horns.',
    evolvesTo: 'voltibex', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Thunderstep Highlands', trail: 'Static Ridge', core: 'electric mountain goat spirit',
  },
  voltibex: {
    id: 'voltibex', stage: 2, name: 'Voltibex', sprite: 'voltibex', palette: 'ember',
    species: 'Zigzag Ibex Companion', kind: 'evolution', type: 'ember', baseHp: 105, scale: 1.18, catchable: false,
    flavor: 'Nimble ibex with zigzag horn growth.',
    evolvesTo: 'stormhorn', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Thunderstep Highlands', trail: 'Static Ridge', core: 'electric mountain goat spirit',
  },
  stormhorn: {
    id: 'stormhorn', stage: 3, name: 'Stormhorn', sprite: 'stormhorn', palette: 'ember',
    species: 'Lightning Horn Guardian Companion', kind: 'evolution', type: 'ember', baseHp: 158, scale: 1.32, catchable: false,
    flavor: 'Massive highland guardian with branching lightning horns and storm-cloud wool.',
    evolvesTo: null,
    horizon: true, routeName: 'Thunderstep Highlands', trail: 'Static Ridge', core: 'electric mountain goat spirit',
  },

  // Nectlet → Combwing → Apiarch  (Amber Orchard / Honeyfall Lane)
  nectlet: {
    id: 'nectlet', stage: 1, name: 'Nectlet', sprite: 'nectlet', palette: 'lantern',
    species: 'Honeycomb Fawn Companion', kind: 'horizon', type: 'grove', baseHp: 56, catchable: true, catchRate: 0.55,
    flavor: 'Honeybee-deer spirit. tiny fawn with honeycomb ear patches and bee-like tail.',
    evolvesTo: 'combwing', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Amber Orchard', trail: 'Honeyfall Lane', core: 'honeybee-deer spirit',
  },
  combwing: {
    id: 'combwing', stage: 2, name: 'Combwing', sprite: 'combwing', palette: 'lantern',
    species: 'Comb-Wing Deer Companion', kind: 'evolution', type: 'grove', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Slender deer with translucent comb-patterned shoulder wings.',
    evolvesTo: 'apiarch', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Amber Orchard', trail: 'Honeyfall Lane', core: 'honeybee-deer spirit',
  },
  apiarch: {
    id: 'apiarch', stage: 3, name: 'Apiarch', sprite: 'apiarch', palette: 'lantern',
    species: 'Orchard Pollinator Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Regal orchard guardian with branching wax antlers, amber comb mantle and pollinator wings.',
    evolvesTo: null,
    horizon: true, routeName: 'Amber Orchard', trail: 'Honeyfall Lane', core: 'honeybee-deer spirit',
  },

  // Chipmagma → Shardscale → Obsidrake  (Obsidian Hollow / Glassfire Descent)
  chipmagma: {
    id: 'chipmagma', stage: 1, name: 'Chipmagma', sprite: 'chipmagma', palette: 'cinder',
    species: 'Glassfire Salamander Companion', kind: 'horizon', type: 'ember', baseHp: 64, catchable: true, catchRate: 0.48,
    flavor: 'Volcanic glass salamander. small black-glass salamander with ember seams.',
    evolvesTo: 'shardscale', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Obsidian Hollow', trail: 'Glassfire Descent', core: 'volcanic glass salamander',
  },
  shardscale: {
    id: 'shardscale', stage: 2, name: 'Shardscale', sprite: 'shardscale', palette: 'cinder',
    species: 'Obsidian Fin Salamander Companion', kind: 'evolution', type: 'ember', baseHp: 109, scale: 1.18, catchable: false,
    flavor: 'Longer reptile with blade-like obsidian fins.',
    evolvesTo: 'obsidrake', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Obsidian Hollow', trail: 'Glassfire Descent', core: 'volcanic glass salamander',
  },
  obsidrake: {
    id: 'obsidrake', stage: 3, name: 'Obsidrake', sprite: 'obsidrake', palette: 'cinder',
    species: 'Volcanic Glass Guardian Companion', kind: 'evolution', type: 'ember', baseHp: 163, scale: 1.32, catchable: false,
    flavor: 'Powerful low-slung guardian of volcanic glass with molten light beneath fractured armor.',
    evolvesTo: null,
    horizon: true, routeName: 'Obsidian Hollow', trail: 'Glassfire Descent', core: 'volcanic glass salamander',
  },

  // Bellbun → Chimehare → Bloomrunner  (Bluebell Downs / Petalwind Path)
  bellbun: {
    id: 'bellbun', stage: 1, name: 'Bellbun', sprite: 'bellbun', palette: 'bloom',
    species: 'Bluebell Rabbit Companion', kind: 'horizon', type: 'grove', baseHp: 54, catchable: true, catchRate: 0.58,
    flavor: 'Bluebell rabbit spirit. round rabbit with bell-flower ears.',
    evolvesTo: 'chimehare', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Bluebell Downs', trail: 'Petalwind Path', core: 'bluebell rabbit spirit',
  },
  chimehare: {
    id: 'chimehare', stage: 2, name: 'Chimehare', sprite: 'chimehare', palette: 'bloom',
    species: 'Flowering Hare Companion', kind: 'evolution', type: 'grove', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Long-legged hare with flowering ear stalks.',
    evolvesTo: 'bloomrunner', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Bluebell Downs', trail: 'Petalwind Path', core: 'bluebell rabbit spirit',
  },
  bloomrunner: {
    id: 'bloomrunner', stage: 3, name: 'Bloomrunner', sprite: 'bloomrunner', palette: 'bloom',
    species: 'Petalwind Hare Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Graceful guardian hare with sweeping floral ears and petal-stream tail.',
    evolvesTo: null,
    horizon: true, routeName: 'Bluebell Downs', trail: 'Petalwind Path', core: 'bluebell rabbit spirit',
  },

  // Nailnut → Ferracorn → Ironstag  (Ironwood Wilds / Forgeleaf Trail)
  nailnut: {
    id: 'nailnut', stage: 1, name: 'Nailnut', sprite: 'nailnut', palette: 'rock',
    species: 'Ironwood Acorn Calf Companion', kind: 'horizon', type: 'stone', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'Ironwood acorn stag spirit. acorn-bodied calf with metallic cap.',
    evolvesTo: 'ferracorn', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Ironwood Wilds', trail: 'Forgeleaf Trail', core: 'ironwood acorn stag spirit',
  },
  ferracorn: {
    id: 'ferracorn', stage: 2, name: 'Ferracorn', sprite: 'ferracorn', palette: 'rock',
    species: 'Ironwood Stag Companion', kind: 'evolution', type: 'stone', baseHp: 105, scale: 1.18, catchable: false,
    flavor: 'Young stag with ironwood bark and budding metal antlers.',
    evolvesTo: 'ironstag', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Ironwood Wilds', trail: 'Forgeleaf Trail', core: 'ironwood acorn stag spirit',
  },
  ironstag: {
    id: 'ironstag', stage: 3, name: 'Ironstag', sprite: 'ironstag', palette: 'rock',
    species: 'Ironwood Stag Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 158, scale: 1.32, catchable: false,
    flavor: 'Towering stag with forged-looking ironwood antlers and deep bark armor.',
    evolvesTo: null,
    horizon: true, routeName: 'Ironwood Wilds', trail: 'Forgeleaf Trail', core: 'ironwood acorn stag spirit',
  },

  // Pipolyp → Reeframble → Coralith  (Coral Stair / Anemone Steps)
  pipolyp: {
    id: 'pipolyp', stage: 1, name: 'Pipolyp', sprite: 'pipolyp', palette: 'dew',
    species: 'Coral Polyp Companion', kind: 'horizon', type: 'tide', baseHp: 52, catchable: true, catchRate: 0.58,
    flavor: 'Coral polyp octopus spirit. tiny round polyp with eight soft nubs.',
    evolvesTo: 'reeframble', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Coral Stair', trail: 'Anemone Steps', core: 'coral polyp octopus spirit',
  },
  reeframble: {
    id: 'reeframble', stage: 2, name: 'Reeframble', sprite: 'reeframble', palette: 'dew',
    species: 'Branching Reef Walker Companion', kind: 'evolution', type: 'tide', baseHp: 88, scale: 1.18, catchable: false,
    flavor: 'Mobile reef creature with branching coral arms.',
    evolvesTo: 'coralith', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Coral Stair', trail: 'Anemone Steps', core: 'coral polyp octopus spirit',
  },
  coralith: {
    id: 'coralith', stage: 3, name: 'Coralith', sprite: 'coralith', palette: 'dew',
    species: 'Cathedral Reef Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 133, scale: 1.32, catchable: false,
    flavor: 'Grand reef guardian with cathedral-like coral crown and gentle octopus core.',
    evolvesTo: null,
    horizon: true, routeName: 'Coral Stair', trail: 'Anemone Steps', core: 'coral polyp octopus spirit',
  },

  // Veilisk → Duneshade → Mirajinn  (Saffron Dunes / Mirage Track)
  veilisk: {
    id: 'veilisk', stage: 1, name: 'Veilisk', sprite: 'veilisk', palette: 'quartz',
    species: 'Veil Gecko Companion', kind: 'horizon', type: 'stone', baseHp: 54, catchable: true, catchRate: 0.56,
    flavor: 'Desert veil gecko spirit. tiny gecko with translucent sail crest.',
    evolvesTo: 'duneshade', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Saffron Dunes', trail: 'Mirage Track', core: 'desert veil gecko spirit',
  },
  duneshade: {
    id: 'duneshade', stage: 2, name: 'Duneshade', sprite: 'duneshade', palette: 'quartz',
    species: 'Heat-Haze Gecko Companion', kind: 'evolution', type: 'stone', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Lean gecko with broad heat-haze membranes.',
    evolvesTo: 'mirajinn', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Saffron Dunes', trail: 'Mirage Track', core: 'desert veil gecko spirit',
  },
  mirajinn: {
    id: 'mirajinn', stage: 3, name: 'Mirajinn', sprite: 'mirajinn', palette: 'quartz',
    species: 'Mirage Sail Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Elegant desert guardian whose translucent sails bend light into mirage patterns.',
    evolvesTo: null,
    horizon: true, routeName: 'Saffron Dunes', trail: 'Mirage Track', core: 'desert veil gecko spirit',
  },

  // Plinkbat → Cavernwing → Rainvault  (Rainshadow Forest / Dripstone Trail)
  plinkbat: {
    id: 'plinkbat', stage: 1, name: 'Plinkbat', sprite: 'plinkbat', palette: 'air',
    species: 'Dripstone Bat Companion', kind: 'horizon', type: 'wind', baseHp: 52, catchable: true, catchRate: 0.58,
    flavor: 'Cave bat and stalactite spirit. round bat with droplet ears and stone claws.',
    evolvesTo: 'cavernwing', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Rainshadow Forest', trail: 'Dripstone Trail', core: 'cave bat and stalactite spirit',
  },
  cavernwing: {
    id: 'cavernwing', stage: 2, name: 'Cavernwing', sprite: 'cavernwing', palette: 'air',
    species: 'Mineral-Wing Bat Companion', kind: 'evolution', type: 'wind', baseHp: 88, scale: 1.18, catchable: false,
    flavor: 'Larger bat with mineral-veined wings.',
    evolvesTo: 'rainvault', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Rainshadow Forest', trail: 'Dripstone Trail', core: 'cave bat and stalactite spirit',
  },
  rainvault: {
    id: 'rainvault', stage: 3, name: 'Rainvault', sprite: 'rainvault', palette: 'air',
    species: 'Cavern Ceiling Guardian Companion', kind: 'evolution', type: 'wind', baseHp: 133, scale: 1.32, catchable: false,
    flavor: 'Huge gentle bat guardian whose wings resemble a dripping cavern ceiling.',
    evolvesTo: null,
    horizon: true, routeName: 'Rainshadow Forest', trail: 'Dripstone Trail', core: 'cave bat and stalactite spirit',
  },

  // Burrcalf → Thistlebuck → Prairieguard  (Golden Steppe / Thistlehoof Way)
  burrcalf: {
    id: 'burrcalf', stage: 1, name: 'Burrcalf', sprite: 'burrcalf', palette: 'bramble',
    species: 'Thistle Calf Companion', kind: 'horizon', type: 'grove', baseHp: 66, catchable: true, catchRate: 0.48,
    flavor: 'Thistle bison spirit. fuzzy calf with soft thistle tufts.',
    evolvesTo: 'thistlebuck', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Golden Steppe', trail: 'Thistlehoof Way', core: 'thistle bison spirit',
  },
  thistlebuck: {
    id: 'thistlebuck', stage: 2, name: 'Thistlebuck', sprite: 'thistlebuck', palette: 'bramble',
    species: 'Flowering Bison Companion', kind: 'evolution', type: 'grove', baseHp: 112, scale: 1.18, catchable: false,
    flavor: 'Stocky young bison with flowering shoulder burrs.',
    evolvesTo: 'prairieguard', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Golden Steppe', trail: 'Thistlehoof Way', core: 'thistle bison spirit',
  },
  prairieguard: {
    id: 'prairieguard', stage: 3, name: 'Prairieguard', sprite: 'prairieguard', palette: 'bramble',
    species: 'Prairie Thistle Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 168, scale: 1.32, catchable: false,
    flavor: 'Enormous bison guardian with wind-swept thistle mane and seed-down beard.',
    evolvesTo: null,
    horizon: true, routeName: 'Golden Steppe', trail: 'Thistlehoof Way', core: 'thistle bison spirit',
  },

  // Prismink → Aurorermine → Polarveil  (Crystal Tundra / Aurora Shelf)
  prismink: {
    id: 'prismink', stage: 1, name: 'Prismink', sprite: 'prismink', palette: 'kite',
    species: 'Aurora Mink Companion', kind: 'horizon', type: 'wind', baseHp: 52, catchable: true, catchRate: 0.58,
    flavor: 'Aurora mink spirit. small sleek mink with glowing ribbon tail.',
    evolvesTo: 'aurorermine', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Crystal Tundra', trail: 'Aurora Shelf', core: 'aurora mink spirit',
  },
  aurorermine: {
    id: 'aurorermine', stage: 2, name: 'Aurorermine', sprite: 'aurorermine', palette: 'kite',
    species: 'Aurora Mustelid Companion', kind: 'evolution', type: 'wind', baseHp: 88, scale: 1.18, catchable: false,
    flavor: 'Longer mustelid with shifting aurora stripe.',
    evolvesTo: 'polarveil', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Crystal Tundra', trail: 'Aurora Shelf', core: 'aurora mink spirit',
  },
  polarveil: {
    id: 'polarveil', stage: 3, name: 'Polarveil', sprite: 'polarveil', palette: 'kite',
    species: 'Polar Light Guardian Companion', kind: 'evolution', type: 'wind', baseHp: 133, scale: 1.32, catchable: false,
    flavor: 'Large polar guardian with flowing light-ribbon mantle and glassy ice claws.',
    evolvesTo: null,
    horizon: true, routeName: 'Crystal Tundra', trail: 'Aurora Shelf', core: 'aurora mink spirit',
  },

  // Kneebit → Swampstride → Cypressage  (Cypress Basin / Kneeroot Loop)
  kneebit: {
    id: 'kneebit', stage: 1, name: 'Kneebit', sprite: 'kneebit', palette: 'moss',
    species: 'Cypress-Knee Turtle Companion', kind: 'horizon', type: 'rest', baseHp: 60, catchable: true, catchRate: 0.5,
    flavor: 'Cypress-knee turtle spirit. tiny turtle with cypress-knee shell spikes.',
    evolvesTo: 'swampstride', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Cypress Basin', trail: 'Kneeroot Loop', core: 'cypress-knee turtle spirit',
  },
  swampstride: {
    id: 'swampstride', stage: 2, name: 'Swampstride', sprite: 'swampstride', palette: 'moss',
    species: 'Woody Marsh Turtle Companion', kind: 'evolution', type: 'rest', baseHp: 102, scale: 1.18, catchable: false,
    flavor: 'Long-legged marsh turtle with woody shell.',
    evolvesTo: 'cypressage', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Cypress Basin', trail: 'Kneeroot Loop', core: 'cypress-knee turtle spirit',
  },
  cypressage: {
    id: 'cypressage', stage: 3, name: 'Cypressage', sprite: 'cypressage', palette: 'moss',
    species: 'Cypress Basin Guardian Companion', kind: 'evolution', type: 'rest', baseHp: 153, scale: 1.32, catchable: false,
    flavor: 'Ancient guardian tortoise carrying cypress knees, moss and shallow water on its shell.',
    evolvesTo: null,
    horizon: true, routeName: 'Cypress Basin', trail: 'Kneeroot Loop', core: 'cypress-knee turtle spirit',
  },

  // Mumblewool → Heatheram → Moorwarden  (Lavender Moor / Hushheather Trail)
  mumblewool: {
    id: 'mumblewool', stage: 1, name: 'Mumblewool', sprite: 'mumblewool', palette: 'moss',
    species: 'Heather Lamb Companion', kind: 'horizon', type: 'rest', baseHp: 58, catchable: true, catchRate: 0.54,
    flavor: 'Heather sheep spirit. round lamb with lavender wool curls.',
    evolvesTo: 'heatheram', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Lavender Moor', trail: 'Hushheather Trail', core: 'heather sheep spirit',
  },
  heatheram: {
    id: 'heatheram', stage: 2, name: 'Heatheram', sprite: 'heatheram', palette: 'moss',
    species: 'Heather Ram Companion', kind: 'evolution', type: 'rest', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Young ram with heather sprigs and curled horns.',
    evolvesTo: 'moorwarden', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Lavender Moor', trail: 'Hushheather Trail', core: 'heather sheep spirit',
  },
  moorwarden: {
    id: 'moorwarden', stage: 3, name: 'Moorwarden', sprite: 'moorwarden', palette: 'moss',
    species: 'Moorland Fleece Guardian Companion', kind: 'evolution', type: 'rest', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Broad gentle guardian ram with flowering moorland fleece and sweeping horns.',
    evolvesTo: null,
    horizon: true, routeName: 'Lavender Moor', trail: 'Hushheather Trail', core: 'heather sheep spirit',
  },

  // Skiprock → Basalisk → Breakwater  (Basalt Coast / Blackwave Traverse)
  skiprock: {
    id: 'skiprock', stage: 1, name: 'Skiprock', sprite: 'skiprock', palette: 'tide',
    species: 'Skipping-Stone Seal Companion', kind: 'horizon', type: 'tide', baseHp: 60, catchable: true, catchRate: 0.52,
    flavor: 'Skipping-stone seal spirit. round seal pup with flat basalt plates.',
    evolvesTo: 'basalisk', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Basalt Coast', trail: 'Blackwave Traverse', core: 'skipping-stone seal spirit',
  },
  basalisk: {
    id: 'basalisk', stage: 2, name: 'Basalisk', sprite: 'basalisk', palette: 'tide',
    species: 'Basalt-Back Seal Companion', kind: 'evolution', type: 'tide', baseHp: 102, scale: 1.18, catchable: false,
    flavor: 'Sleek seal with layered volcanic-stone back.',
    evolvesTo: 'breakwater', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Basalt Coast', trail: 'Blackwave Traverse', core: 'skipping-stone seal spirit',
  },
  breakwater: {
    id: 'breakwater', stage: 3, name: 'Breakwater', sprite: 'breakwater', palette: 'tide',
    species: 'Breakwater Seal Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 153, scale: 1.32, catchable: false,
    flavor: 'Massive coastal guardian seal with breakwater-like basalt armor and foam mane.',
    evolvesTo: null,
    horizon: true, routeName: 'Basalt Coast', trail: 'Blackwave Traverse', core: 'skipping-stone seal spirit',
  },

  // Glimrice → Paddyglow → Terracelume  (Firefly Terrace / Lantern Rice Path)
  glimrice: {
    id: 'glimrice', stage: 1, name: 'Glimrice', sprite: 'glimrice', palette: 'lantern',
    species: 'Rice-Paddy Crane Companion', kind: 'horizon', type: 'grove', baseHp: 54, catchable: true, catchRate: 0.56,
    flavor: 'Rice-paddy firefly crane spirit. tiny chick with glowing grain crest.',
    evolvesTo: 'paddyglow', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Firefly Terrace', trail: 'Lantern Rice Path', core: 'rice-paddy firefly crane spirit',
  },
  paddyglow: {
    id: 'paddyglow', stage: 2, name: 'Paddyglow', sprite: 'paddyglow', palette: 'lantern',
    species: 'Firefly Crane Companion', kind: 'evolution', type: 'grove', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Slender crane with rice-stalk feathers and firefly lights.',
    evolvesTo: 'terracelume', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Firefly Terrace', trail: 'Lantern Rice Path', core: 'rice-paddy firefly crane spirit',
  },
  terracelume: {
    id: 'terracelume', stage: 3, name: 'Terracelume', sprite: 'terracelume', palette: 'lantern',
    species: 'Terrace Crane Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Elegant guardian crane with terraced wing patterns and a halo of golden insects.',
    evolvesTo: null,
    horizon: true, routeName: 'Firefly Terrace', trail: 'Lantern Rice Path', core: 'rice-paddy firefly crane spirit',
  },

  // Roseling → Facetram → Quartzibex  (Rose Quartz Vale / Heartstone Walk)
  roseling: {
    id: 'roseling', stage: 1, name: 'Roseling', sprite: 'roseling', palette: 'quartz',
    species: 'Rose-Quartz Lamb Companion', kind: 'horizon', type: 'stone', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'Rose-quartz mountain sheep spirit. small lamb with crystal curls.',
    evolvesTo: 'facetram', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Rose Quartz Vale', trail: 'Heartstone Walk', core: 'rose-quartz mountain sheep spirit',
  },
  facetram: {
    id: 'facetram', stage: 2, name: 'Facetram', sprite: 'facetram', palette: 'quartz',
    species: 'Faceted Quartz Ram Companion', kind: 'evolution', type: 'stone', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Agile ram with faceted translucent horns.',
    evolvesTo: 'quartzibex', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Rose Quartz Vale', trail: 'Heartstone Walk', core: 'rose-quartz mountain sheep spirit',
  },
  quartzibex: {
    id: 'quartzibex', stage: 3, name: 'Quartzibex', sprite: 'quartzibex', palette: 'quartz',
    species: 'Rose-Quartz Ibex Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Majestic guardian ibex with enormous rose-quartz horn spirals and crystalline shoulder plates.',
    evolvesTo: null,
    horizon: true, routeName: 'Rose Quartz Vale', trail: 'Heartstone Walk', core: 'rose-quartz mountain sheep spirit',
  },

  // Wicklet → Willowisp → Mereweaver  (Willowmere / Drooping Branch Trail)
  wicklet: {
    id: 'wicklet', stage: 1, name: 'Wicklet', sprite: 'wicklet', palette: 'fern',
    species: 'Willow Dragonfly Companion', kind: 'horizon', type: 'grove', baseHp: 50, catchable: true, catchRate: 0.6,
    flavor: 'Willow dragonfly spirit. tiny dragonfly with leaf-shaped wings.',
    evolvesTo: 'willowisp', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Willowmere', trail: 'Drooping Branch Trail', core: 'willow dragonfly spirit',
  },
  willowisp: {
    id: 'willowisp', stage: 2, name: 'Willowisp', sprite: 'willowisp', palette: 'fern',
    species: 'Willow-Frond Flyer Companion', kind: 'evolution', type: 'grove', baseHp: 85, scale: 1.18, catchable: false,
    flavor: 'Long-bodied flyer with trailing willow-frond wings.',
    evolvesTo: 'mereweaver', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Willowmere', trail: 'Drooping Branch Trail', core: 'willow dragonfly spirit',
  },
  mereweaver: {
    id: 'mereweaver', stage: 3, name: 'Mereweaver', sprite: 'mereweaver', palette: 'fern',
    species: 'Willowmere Skimmer Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 127, scale: 1.32, catchable: false,
    flavor: 'Large serene guardian insect with sweeping willow wings that skim the water.',
    evolvesTo: null,
    horizon: true, routeName: 'Willowmere', trail: 'Drooping Branch Trail', core: 'willow dragonfly spirit',
  },

  // Sootfinch → Ashlark → Emberchorus  (Ashen Fields / Cindergrass Route)
  sootfinch: {
    id: 'sootfinch', stage: 1, name: 'Sootfinch', sprite: 'sootfinch', palette: 'ember',
    species: 'Ash Songbird Companion', kind: 'horizon', type: 'ember', baseHp: 52, catchable: true, catchRate: 0.56,
    flavor: 'Ash-and-ember songbird. round soot bird with one ember feather.',
    evolvesTo: 'ashlark', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Ashen Fields', trail: 'Cindergrass Route', core: 'ash-and-ember songbird',
  },
  ashlark: {
    id: 'ashlark', stage: 2, name: 'Ashlark', sprite: 'ashlark', palette: 'ember',
    species: 'Ash-Edged Lark Companion', kind: 'evolution', type: 'ember', baseHp: 88, scale: 1.18, catchable: false,
    flavor: 'Lean lark with glowing ash-edged wings.',
    evolvesTo: 'emberchorus', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Ashen Fields', trail: 'Cindergrass Route', core: 'ash-and-ember songbird',
  },
  emberchorus: {
    id: 'emberchorus', stage: 3, name: 'Emberchorus', sprite: 'emberchorus', palette: 'ember',
    species: 'Ember Chorus Guardian Companion', kind: 'evolution', type: 'ember', baseHp: 133, scale: 1.32, catchable: false,
    flavor: 'Noble songbird guardian with broad ash plume and ember-lit flight feathers.',
    evolvesTo: null,
    horizon: true, routeName: 'Ashen Fields', trail: 'Cindergrass Route', core: 'ash-and-ember songbird',
  },

  // Budice → Petalfloe → Glacibloom  (Glacier Garden / Iceflower Circuit)
  budice: {
    id: 'budice', stage: 1, name: 'Budice', sprite: 'budice', palette: 'dew',
    species: 'Ice-Flower Penguin Companion', kind: 'horizon', type: 'tide', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'Ice-flower penguin spirit. small penguin with frozen bud crest.',
    evolvesTo: 'petalfloe', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Glacier Garden', trail: 'Iceflower Circuit', core: 'ice-flower penguin spirit',
  },
  petalfloe: {
    id: 'petalfloe', stage: 2, name: 'Petalfloe', sprite: 'petalfloe', palette: 'dew',
    species: 'Petal-Ice Penguin Companion', kind: 'evolution', type: 'tide', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Sleek penguin with petal-like ice flippers.',
    evolvesTo: 'glacibloom', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Glacier Garden', trail: 'Iceflower Circuit', core: 'ice-flower penguin spirit',
  },
  glacibloom: {
    id: 'glacibloom', stage: 3, name: 'Glacibloom', sprite: 'glacibloom', palette: 'dew',
    species: 'Ice-Blossom Penguin Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Powerful guardian penguin crowned with a crystalline ice blossom and drifting snow petals.',
    evolvesTo: null,
    horizon: true, routeName: 'Glacier Garden', trail: 'Iceflower Circuit', core: 'ice-flower penguin spirit',
  },

  // Niblet → Cacaocrest → Canopycacao  (Cocoa Highlands / Podshade Track)
  niblet: {
    id: 'niblet', stage: 1, name: 'Niblet', sprite: 'niblet', palette: 'bramble',
    species: 'Cacao Pod Monkey Companion', kind: 'horizon', type: 'grove', baseHp: 56, catchable: true, catchRate: 0.54,
    flavor: 'Cacao pod monkey spirit. tiny monkey with cacao-pod torso marking and leaf cap.',
    evolvesTo: 'cacaocrest', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Cocoa Highlands', trail: 'Podshade Track', core: 'cacao pod monkey spirit',
  },
  cacaocrest: {
    id: 'cacaocrest', stage: 2, name: 'Cacaocrest', sprite: 'cacaocrest', palette: 'bramble',
    species: 'Cacao Climber Companion', kind: 'evolution', type: 'grove', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Nimble climber with pod-shaped forearm guards.',
    evolvesTo: 'canopycacao', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Cocoa Highlands', trail: 'Podshade Track', core: 'cacao pod monkey spirit',
  },
  canopycacao: {
    id: 'canopycacao', stage: 3, name: 'Canopycacao', sprite: 'canopycacao', palette: 'bramble',
    species: 'Cacao Canopy Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Broad canopy guardian primate with cacao bark mantle, pod ornaments and leafy crown.',
    evolvesTo: null,
    horizon: true, routeName: 'Cocoa Highlands', trail: 'Podshade Track', core: 'cacao pod monkey spirit',
  },

  // Siltip → Marshcoil → Estuaryn  (Saltmarsh Flats / Eelgrass Causeway)
  siltip: {
    id: 'siltip', stage: 1, name: 'Siltip', sprite: 'siltip', palette: 'tide',
    species: 'Eelgrass Otter Companion', kind: 'horizon', type: 'tide', baseHp: 56, catchable: true, catchRate: 0.55,
    flavor: 'Eelgrass otter spirit. small otter with eelgrass whiskers.',
    evolvesTo: 'marshcoil', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Saltmarsh Flats', trail: 'Eelgrass Causeway', core: 'eelgrass otter spirit',
  },
  marshcoil: {
    id: 'marshcoil', stage: 2, name: 'Marshcoil', sprite: 'marshcoil', palette: 'tide',
    species: 'Ribbon-Grass Otter Companion', kind: 'evolution', type: 'tide', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Long swimmer with ribbon-grass mane.',
    evolvesTo: 'estuaryn', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Saltmarsh Flats', trail: 'Eelgrass Causeway', core: 'eelgrass otter spirit',
  },
  estuaryn: {
    id: 'estuaryn', stage: 3, name: 'Estuaryn', sprite: 'estuaryn', palette: 'tide',
    species: 'Estuary Otter Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Sleek estuary guardian with flowing eelgrass cloak and tidal-patterned fur.',
    evolvesTo: null,
    horizon: true, routeName: 'Saltmarsh Flats', trail: 'Eelgrass Causeway', core: 'eelgrass otter spirit',
  },

  // Mistyak → Cloudyak → Skyburden  (Cloudbreak Peaks / Sunabove Trail)
  mistyak: {
    id: 'mistyak', stage: 1, name: 'Mistyak', sprite: 'mistyak', palette: 'puff',
    species: 'Cloud Yak Calf Companion', kind: 'horizon', type: 'wind', baseHp: 64, catchable: true, catchRate: 0.5,
    flavor: 'Cloud yak spirit. small shaggy yak calf with misty bangs.',
    evolvesTo: 'cloudyak', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Cloudbreak Peaks', trail: 'Sunabove Trail', core: 'cloud yak spirit',
  },
  cloudyak: {
    id: 'cloudyak', stage: 2, name: 'Cloudyak', sprite: 'cloudyak', palette: 'puff',
    species: 'Cloud-Fleece Yak Companion', kind: 'evolution', type: 'wind', baseHp: 109, scale: 1.18, catchable: false,
    flavor: 'Larger yak with cloud fleece and blue horn tips.',
    evolvesTo: 'skyburden', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Cloudbreak Peaks', trail: 'Sunabove Trail', core: 'cloud yak spirit',
  },
  skyburden: {
    id: 'skyburden', stage: 3, name: 'Skyburden', sprite: 'skyburden', palette: 'puff',
    species: 'Cloudbank Yak Guardian Companion', kind: 'evolution', type: 'wind', baseHp: 163, scale: 1.32, catchable: false,
    flavor: 'Colossal gentle guardian yak carrying a rolling cloudbank across its shoulders.',
    evolvesTo: null,
    horizon: true, routeName: 'Cloudbreak Peaks', trail: 'Sunabove Trail', core: 'cloud yak spirit',
  },

  // Twigglypt → Ringback → Chronotree  (Petrified Grove / Ringwood Path)
  twigglypt: {
    id: 'twigglypt', stage: 1, name: 'Twigglypt', sprite: 'twigglypt', palette: 'grove',
    species: 'Ringed Twig Spirit Companion', kind: 'horizon', type: 'grove', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'Tree-ring pangolin spirit. tiny pangolin with wooden overlapping scales.',
    evolvesTo: 'ringback', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Petrified Grove', trail: 'Ringwood Path', core: 'tree-ring pangolin spirit',
  },
  ringback: {
    id: 'ringback', stage: 2, name: 'Ringback', sprite: 'ringback', palette: 'grove',
    species: 'Ringed-Bark Walker Companion', kind: 'evolution', type: 'grove', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Longer armored creature with visible growth rings.',
    evolvesTo: 'chronotree', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Petrified Grove', trail: 'Ringwood Path', core: 'tree-ring pangolin spirit',
  },
  chronotree: {
    id: 'chronotree', stage: 3, name: 'Chronotree', sprite: 'chronotree', palette: 'grove',
    species: 'Chronotree Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Ancient guardian pangolin with massive petrified-wood scales recording seasons in rings.',
    evolvesTo: null,
    horizon: true, routeName: 'Petrified Grove', trail: 'Ringwood Path', core: 'tree-ring pangolin spirit',
  },

  // Glyphish → Runefin → Tideglyph  (Sunken Ruins / Bubble Archway)
  glyphish: {
    id: 'glyphish', stage: 1, name: 'Glyphish', sprite: 'glyphish', palette: 'dew',
    species: 'Rune Fish Companion', kind: 'horizon', type: 'tide', baseHp: 54, catchable: true, catchRate: 0.56,
    flavor: 'Rune-marked nautilus spirit. small nautilus with softly glowing shell symbols.',
    evolvesTo: 'runefin', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Sunken Ruins', trail: 'Bubble Archway', core: 'rune-marked nautilus spirit',
  },
  runefin: {
    id: 'runefin', stage: 2, name: 'Runefin', sprite: 'runefin', palette: 'dew',
    species: 'Rune-Fin Swimmer Companion', kind: 'evolution', type: 'tide', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Larger swimmer with articulated fins and rotating rune shell.',
    evolvesTo: 'tideglyph', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Sunken Ruins', trail: 'Bubble Archway', core: 'rune-marked nautilus spirit',
  },
  tideglyph: {
    id: 'tideglyph', stage: 3, name: 'Tideglyph', sprite: 'tideglyph', palette: 'dew',
    species: 'Tideglyph Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Regal ocean guardian with monumental spiral shell covered in luminous tidal glyphs.',
    evolvesTo: null,
    horizon: true, routeName: 'Sunken Ruins', trail: 'Bubble Archway', core: 'rune-marked nautilus spirit',
  },

  // Knockit → Bamboar → Canebrute  (Bamboo Ravine / Hollowstem Way)
  knockit: {
    id: 'knockit', stage: 1, name: 'Knockit', sprite: 'knockit', palette: 'samara',
    species: 'Bamboo Boar Piglet Companion', kind: 'horizon', type: 'grove', baseHp: 62, catchable: true, catchRate: 0.5,
    flavor: 'Bamboo boar spirit. small piglet with hollow bamboo tusk buds.',
    evolvesTo: 'bamboar', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Bamboo Ravine', trail: 'Hollowstem Way', core: 'bamboo boar spirit',
  },
  bamboar: {
    id: 'bamboar', stage: 2, name: 'Bamboar', sprite: 'bamboar', palette: 'samara',
    species: 'Bamboo Boar Companion', kind: 'evolution', type: 'grove', baseHp: 105, scale: 1.18, catchable: false,
    flavor: 'Lean boar with segmented cane armor.',
    evolvesTo: 'canebrute', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Bamboo Ravine', trail: 'Hollowstem Way', core: 'bamboo boar spirit',
  },
  canebrute: {
    id: 'canebrute', stage: 3, name: 'Canebrute', sprite: 'canebrute', palette: 'samara',
    species: 'Bamboo Brute Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 158, scale: 1.32, catchable: false,
    flavor: 'Massive guardian boar with towering bamboo tusks and rustling stalks along its spine.',
    evolvesTo: null,
    horizon: true, routeName: 'Bamboo Ravine', trail: 'Hollowstem Way', core: 'bamboo boar spirit',
  },

  // Pepkit → Capsiclaw → Scovlion  (Peppergrass Savanna / Spicewind Track)
  pepkit: {
    id: 'pepkit', stage: 1, name: 'Pepkit', sprite: 'pepkit', palette: 'scorch',
    species: 'Pepper Cat Companion', kind: 'horizon', type: 'ember', baseHp: 56, catchable: true, catchRate: 0.54,
    flavor: 'Pepper-maned lion spirit. tiny cat with red pepper tuft tail.',
    evolvesTo: 'capsiclaw', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Peppergrass Savanna', trail: 'Spicewind Track', core: 'pepper-maned lion spirit',
  },
  capsiclaw: {
    id: 'capsiclaw', stage: 2, name: 'Capsiclaw', sprite: 'capsiclaw', palette: 'scorch',
    species: 'Pepper Lynx Companion', kind: 'evolution', type: 'ember', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Young lion with layered pepper-petal ruff.',
    evolvesTo: 'scovlion', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Peppergrass Savanna', trail: 'Spicewind Track', core: 'pepper-maned lion spirit',
  },
  scovlion: {
    id: 'scovlion', stage: 3, name: 'Scovlion', sprite: 'scovlion', palette: 'scorch',
    species: 'Scorch Lion Guardian Companion', kind: 'evolution', type: 'ember', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Powerful guardian lion with blazing red-and-gold botanical mane made of pepper forms, energetic rather than fiery.',
    evolvesTo: null,
    horizon: true, routeName: 'Peppergrass Savanna', trail: 'Spicewind Track', core: 'pepper-maned lion spirit',
  },

  // Pebbloom → Selencore → Moonvault  (Moonstone Caverns / Echo Gem Route)
  pebbloom: {
    id: 'pebbloom', stage: 1, name: 'Pebbloom', sprite: 'pebbloom', palette: 'rock',
    species: 'Moon-Pebble Bloom Companion', kind: 'horizon', type: 'stone', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'Moonstone mole spirit. tiny mole with luminous gem nose.',
    evolvesTo: 'selencore', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Moonstone Caverns', trail: 'Echo Gem Route', core: 'moonstone mole spirit',
  },
  selencore: {
    id: 'selencore', stage: 2, name: 'Selencore', sprite: 'selencore', palette: 'rock',
    species: 'Moon-Stone Bloom Companion', kind: 'evolution', type: 'stone', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Burrowing adolescent with moonstone claws and shoulder crystals.',
    evolvesTo: 'moonvault', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Moonstone Caverns', trail: 'Echo Gem Route', core: 'moonstone mole spirit',
  },
  moonvault: {
    id: 'moonvault', stage: 3, name: 'Moonvault', sprite: 'moonvault', palette: 'rock',
    species: 'Moonvault Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Broad subterranean guardian with arched moonstone armor and glowing tunnel-map markings.',
    evolvesTo: null,
    horizon: true, routeName: 'Moonstone Caverns', trail: 'Echo Gem Route', core: 'moonstone mole spirit',
  },

  // Lotadpole → Bloomnewt → Lotusaur  (Lotus Delta / Petalwater Trail)
  lotadpole: {
    id: 'lotadpole', stage: 1, name: 'Lotadpole', sprite: 'lotadpole', palette: 'dew',
    species: 'Lotus Tadpole Companion', kind: 'horizon', type: 'tide', baseHp: 54, catchable: true, catchRate: 0.56,
    flavor: 'Lotus newt spirit. tiny newt with lotus bud on head.',
    evolvesTo: 'bloomnewt', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Lotus Delta', trail: 'Petalwater Trail', core: 'lotus newt spirit',
  },
  bloomnewt: {
    id: 'bloomnewt', stage: 2, name: 'Bloomnewt', sprite: 'bloomnewt', palette: 'dew',
    species: 'Lotus Newt Companion', kind: 'evolution', type: 'tide', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Longer amphibian with open lotus crest and petal gills.',
    evolvesTo: 'lotusaur', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Lotus Delta', trail: 'Petalwater Trail', core: 'lotus newt spirit',
  },
  lotusaur: {
    id: 'lotusaur', stage: 3, name: 'Lotusaur', sprite: 'lotusaur', palette: 'dew',
    species: 'Lotusaur Guardian Companion', kind: 'evolution', type: 'tide', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Large peaceful guardian newt carrying a blooming lotus pond along its back.',
    evolvesTo: null,
    horizon: true, routeName: 'Lotus Delta', trail: 'Petalwater Trail', core: 'lotus newt spirit',
  },

  // Kernelit → Millwing → Harvestail  (Windmill Plains / Grainwheel Road)
  kernelit: {
    id: 'kernelit', stage: 1, name: 'Kernelit', sprite: 'kernelit', palette: 'samara',
    species: 'Grain Kernel Spirit Companion', kind: 'horizon', type: 'grove', baseHp: 56, catchable: true, catchRate: 0.54,
    flavor: 'Grain moth and windmill spirit. tiny grain-kernel moth with pinwheel wings.',
    evolvesTo: 'millwing', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Windmill Plains', trail: 'Grainwheel Road', core: 'grain moth and windmill spirit',
  },
  millwing: {
    id: 'millwing', stage: 2, name: 'Millwing', sprite: 'millwing', palette: 'samara',
    species: 'Mill-Wing Grain Spirit Companion', kind: 'evolution', type: 'grove', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Larger moth with four broad grain-veined wings.',
    evolvesTo: 'harvestail', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Windmill Plains', trail: 'Grainwheel Road', core: 'grain moth and windmill spirit',
  },
  harvestail: {
    id: 'harvestail', stage: 3, name: 'Harvestail', sprite: 'harvestail', palette: 'samara',
    species: 'Harvestail Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Grand harvest guardian with windmill-like wings and long wheat-tail streamers.',
    evolvesTo: null,
    horizon: true, routeName: 'Windmill Plains', trail: 'Grainwheel Road', core: 'grain moth and windmill spirit',
  },

  // Conecko → Barkglide → Redwoodrake  (Redwood Crown / Giant Step Trail)
  conecko: {
    id: 'conecko', stage: 1, name: 'Conecko', sprite: 'conecko', palette: 'grove',
    species: 'Bark Gecko Companion', kind: 'horizon', type: 'grove', baseHp: 54, catchable: true, catchRate: 0.56,
    flavor: 'Redwood flying gecko spirit. tiny gecko with bark-pattern skin and cone toes.',
    evolvesTo: 'barkglide', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Redwood Crown', trail: 'Giant Step Trail', core: 'redwood flying gecko spirit',
  },
  barkglide: {
    id: 'barkglide', stage: 2, name: 'Barkglide', sprite: 'barkglide', palette: 'grove',
    species: 'Bark Glider Companion', kind: 'evolution', type: 'grove', baseHp: 92, scale: 1.18, catchable: false,
    flavor: 'Adolescent glider with redwood-bark membranes.',
    evolvesTo: 'redwoodrake', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Redwood Crown', trail: 'Giant Step Trail', core: 'redwood flying gecko spirit',
  },
  redwoodrake: {
    id: 'redwoodrake', stage: 3, name: 'Redwoodrake', sprite: 'redwoodrake', palette: 'grove',
    species: 'Redwood Drake Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 138, scale: 1.32, catchable: false,
    flavor: 'Large arboreal guardian with immense bark-red gliding sails and fern-fringed tail.',
    evolvesTo: null,
    horizon: true, routeName: 'Redwood Crown', trail: 'Giant Step Trail', core: 'redwood flying gecko spirit',
  },

  // Bloopot → Vaportoise → Geyshell  (Geyser Basin / Steamstone Walk)
  bloopot: {
    id: 'bloopot', stage: 1, name: 'Bloopot', sprite: 'bloopot', palette: 'cinder',
    species: 'Geyser Tortoise Companion', kind: 'horizon', type: 'ember', baseHp: 60, catchable: true, catchRate: 0.5,
    flavor: 'Geyser tortoise spirit. small round tortoise with warm-water bubble vents.',
    evolvesTo: 'vaportoise', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Geyser Basin', trail: 'Steamstone Walk', core: 'geyser tortoise spirit',
  },
  vaportoise: {
    id: 'vaportoise', stage: 2, name: 'Vaportoise', sprite: 'vaportoise', palette: 'cinder',
    species: 'Vapor Tortoise Companion', kind: 'evolution', type: 'ember', baseHp: 102, scale: 1.18, catchable: false,
    flavor: 'Sturdy adolescent with mineral terraces on shell.',
    evolvesTo: 'geyshell', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Geyser Basin', trail: 'Steamstone Walk', core: 'geyser tortoise spirit',
  },
  geyshell: {
    id: 'geyshell', stage: 3, name: 'Geyshell', sprite: 'geyshell', palette: 'cinder',
    species: 'Geyser Shell Guardian Companion', kind: 'evolution', type: 'ember', baseHp: 153, scale: 1.32, catchable: false,
    flavor: 'Massive guardian tortoise whose shell is a miniature geyser basin with steam plumes.',
    evolvesTo: null,
    horizon: true, routeName: 'Geyser Basin', trail: 'Steamstone Walk', core: 'geyser tortoise spirit',
  },

  // Figbat → Orchardusk → Noctifera  (Night Orchard / Starlit Fig Path)
  figbat: {
    id: 'figbat', stage: 1, name: 'Figbat', sprite: 'figbat', palette: 'air',
    species: 'Orchard Fig Bat Companion', kind: 'horizon', type: 'wind', baseHp: 52, catchable: true, catchRate: 0.58,
    flavor: 'Fig fruit-bat spirit. tiny bat with fig-shaped body and leaf ears.',
    evolvesTo: 'orchardusk', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Night Orchard', trail: 'Starlit Fig Path', core: 'fig fruit-bat spirit',
  },
  orchardusk: {
    id: 'orchardusk', stage: 2, name: 'Orchardusk', sprite: 'orchardusk', palette: 'air',
    species: 'Orchard Dusk Bat Companion', kind: 'evolution', type: 'wind', baseHp: 88, scale: 1.18, catchable: false,
    flavor: 'Sleek fruit bat with purple wing membranes and seed-speckled chest.',
    evolvesTo: 'noctifera', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Night Orchard', trail: 'Starlit Fig Path', core: 'fig fruit-bat spirit',
  },
  noctifera: {
    id: 'noctifera', stage: 3, name: 'Noctifera', sprite: 'noctifera', palette: 'air',
    species: 'Noctifera Guardian Companion', kind: 'evolution', type: 'wind', baseHp: 133, scale: 1.32, catchable: false,
    flavor: 'Majestic nocturnal guardian bat with fig-leaf mantle and star-speckled wings.',
    evolvesTo: null,
    horizon: true, routeName: 'Night Orchard', trail: 'Starlit Fig Path', core: 'fig fruit-bat spirit',
  },

  // Ammonip → Spiralisk → Aeoncoil  (Shellwind Desert / Fossil Current)
  ammonip: {
    id: 'ammonip', stage: 1, name: 'Ammonip', sprite: 'ammonip', palette: 'quartz',
    species: 'Spiral Shell Spirit Companion', kind: 'horizon', type: 'stone', baseHp: 58, catchable: true, catchRate: 0.52,
    flavor: 'Ammonite desert spirit. small fossil spiral creature with tiny feet.',
    evolvesTo: 'spiralisk', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Shellwind Desert', trail: 'Fossil Current', core: 'ammonite desert spirit',
  },
  spiralisk: {
    id: 'spiralisk', stage: 2, name: 'Spiralisk', sprite: 'spiralisk', palette: 'quartz',
    species: 'Spiral Fossil Walker Companion', kind: 'evolution', type: 'stone', baseHp: 99, scale: 1.18, catchable: false,
    flavor: 'Upright adolescent with segmented spiral armor.',
    evolvesTo: 'aeoncoil', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Shellwind Desert', trail: 'Fossil Current', core: 'ammonite desert spirit',
  },
  aeoncoil: {
    id: 'aeoncoil', stage: 3, name: 'Aeoncoil', sprite: 'aeoncoil', palette: 'quartz',
    species: 'Aeoncoil Guardian Companion', kind: 'evolution', type: 'stone', baseHp: 148, scale: 1.32, catchable: false,
    flavor: 'Towering ancient guardian with enormous ammonite coil, sand-sail fins and fossil ridges.',
    evolvesTo: null,
    horizon: true, routeName: 'Shellwind Desert', trail: 'Fossil Current', core: 'ammonite desert spirit',
  },

  // Tinkid → Alpengait → Summitbell  (Alpine Meadow / Bellflower Ascent)
  tinkid: {
    id: 'tinkid', stage: 1, name: 'Tinkid', sprite: 'tinkid', palette: 'lantern',
    species: 'Alpine Bell Kid Companion', kind: 'horizon', type: 'grove', baseHp: 56, catchable: true, catchRate: 0.54,
    flavor: 'Bellflower mountain antelope spirit. tiny antelope kid with flower-bell ear tips.',
    evolvesTo: 'alpengait', evolveLevel: 5, evolvePoints: 30,
    horizon: true, routeName: 'Alpine Meadow', trail: 'Bellflower Ascent', core: 'bellflower mountain antelope spirit',
  },
  alpengait: {
    id: 'alpengait', stage: 2, name: 'Alpengait', sprite: 'alpengait', palette: 'lantern',
    species: 'Floral-Bell Antelope Companion', kind: 'evolution', type: 'grove', baseHp: 95, scale: 1.18, catchable: false,
    flavor: 'Nimble adolescent with floral ankle bells and curved horns.',
    evolvesTo: 'summitbell', evolveLevel: 14, evolvePoints: 110,
    horizon: true, routeName: 'Alpine Meadow', trail: 'Bellflower Ascent', core: 'bellflower mountain antelope spirit',
  },
  summitbell: {
    id: 'summitbell', stage: 3, name: 'Summitbell', sprite: 'summitbell', palette: 'lantern',
    species: 'Summit Bell Guardian Companion', kind: 'evolution', type: 'grove', baseHp: 143, scale: 1.32, catchable: false,
    flavor: 'Elegant guardian antelope with sweeping horn arcs draped in alpine bellflowers.',
    evolvesTo: null,
    horizon: true, routeName: 'Alpine Meadow', trail: 'Bellflower Ascent', core: 'bellflower mountain antelope spirit',
  },

};

if (HORIZON_COMPANION_IDS.length !== 40) {
  throw new Error(`horizonCreatures: expected 40 roots, got ${HORIZON_COMPANION_IDS.length}`);
}
const horizonCount = Object.keys(HORIZON_CREATURES).length;
if (horizonCount !== 120) {
  throw new Error(`horizonCreatures: expected 120 forms, got ${horizonCount}`);
}

export default HORIZON_CREATURES;
