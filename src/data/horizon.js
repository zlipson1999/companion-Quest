// Horizon roster: 40 original companion families from the design spec.
// Each family is reserved for its own named trail. Those trails are not
// walkable yet — user plates and more families are still incoming — so
// the roots are listed here and in creatures.js, not in ROUTES pools.
//
// Creature ids are permanent. Do not rename.
//
// LOTADPOLE from the spec is registered as `lotuslet` / Lotuslet: the
// original name sat too close to another franchise's creature.

export const HORIZON_FAMILIES = [
  { root: 'brineling', mid: 'shoregleam', adult: 'tidecrown', route: 'Tideglass Coast', trail: 'Saltglass Strand', concept: 'sea-glass hermit spirit' },
  { root: 'dusthorn', mid: 'mesaquill', adult: 'suncerast', route: 'Red Mesa', trail: 'Suncrack Trail', concept: 'desert horned-lizard spirit' },
  { root: 'mireblink', mid: 'lunareed', adult: 'fenoracle', route: 'Moonfen', trail: 'Silver Reed Walk', concept: 'marsh firefly-frog spirit' },
  { root: 'pinepuff', mid: 'rimecone', adult: 'frostbough', route: 'Frostpine Reach', trail: 'Needle-Snow Pass', concept: 'pinecone snow spirit' },
  { root: 'clinket', mid: 'bellstride', adult: 'canyonchime', route: 'Copper Canyon', trail: 'Echo Rail', concept: 'copper bell armadillo' },
  { root: 'glintfoal', mid: 'astramare', adult: 'cometmane', route: 'Starfall Prairie', trail: 'Cometgrass Run', concept: 'starlight prairie foal' },
  { root: 'propfin', mid: 'mangrusk', adult: 'rootback', route: 'Mangrove Maze', trail: 'Rootwater Boardwalk', concept: 'mangrove mudskipper spirit' },
  { root: 'zapram', mid: 'voltibex', adult: 'stormhorn', route: 'Thunderstep Highlands', trail: 'Static Ridge', concept: 'electric mountain goat spirit' },
  { root: 'nectlet', mid: 'combwing', adult: 'apiarch', route: 'Amber Orchard', trail: 'Honeyfall Lane', concept: 'honeybee-deer spirit' },
  { root: 'chipmagma', mid: 'shardscale', adult: 'obsidrake', route: 'Obsidian Hollow', trail: 'Glassfire Descent', concept: 'volcanic glass salamander' },
  { root: 'bellbun', mid: 'chimehare', adult: 'bloomrunner', route: 'Bluebell Downs', trail: 'Petalwind Path', concept: 'bluebell rabbit spirit' },
  { root: 'nailnut', mid: 'ferracorn', adult: 'ironstag', route: 'Ironwood Wilds', trail: 'Forgeleaf Trail', concept: 'ironwood acorn stag spirit' },
  { root: 'pipolyp', mid: 'reeframble', adult: 'coralith', route: 'Coral Stair', trail: 'Anemone Steps', concept: 'coral polyp octopus spirit' },
  { root: 'veilisk', mid: 'duneshade', adult: 'mirajinn', route: 'Saffron Dunes', trail: 'Mirage Track', concept: 'desert veil gecko spirit' },
  { root: 'plinkbat', mid: 'cavernwing', adult: 'rainvault', route: 'Rainshadow Forest', trail: 'Dripstone Trail', concept: 'cave bat and stalactite spirit' },
  { root: 'burrcalf', mid: 'thistlebuck', adult: 'prairieguard', route: 'Golden Steppe', trail: 'Thistlehoof Way', concept: 'thistle bison spirit' },
  { root: 'prismink', mid: 'aurorermine', adult: 'polarveil', route: 'Crystal Tundra', trail: 'Aurora Shelf', concept: 'aurora mink spirit' },
  { root: 'kneebit', mid: 'swampstride', adult: 'cypressage', route: 'Cypress Basin', trail: 'Kneeroot Loop', concept: 'cypress-knee turtle spirit' },
  { root: 'mumblewool', mid: 'heatheram', adult: 'moorwarden', route: 'Lavender Moor', trail: 'Hushheather Trail', concept: 'heather sheep spirit' },
  { root: 'skiprock', mid: 'basalisk', adult: 'breakwater', route: 'Basalt Coast', trail: 'Blackwave Traverse', concept: 'skipping-stone seal spirit' },
  { root: 'glimrice', mid: 'paddyglow', adult: 'terracelume', route: 'Firefly Terrace', trail: 'Lantern Rice Path', concept: 'rice-paddy firefly crane spirit' },
  { root: 'roseling', mid: 'facetram', adult: 'quartzibex', route: 'Rose Quartz Vale', trail: 'Heartstone Walk', concept: 'rose-quartz mountain sheep spirit' },
  { root: 'wicklet', mid: 'willowisp', adult: 'mereweaver', route: 'Willowmere', trail: 'Drooping Branch Trail', concept: 'willow dragonfly spirit' },
  { root: 'sootfinch', mid: 'ashlark', adult: 'emberchorus', route: 'Ashen Fields', trail: 'Cindergrass Route', concept: 'ash-and-ember songbird' },
  { root: 'budice', mid: 'petalfloe', adult: 'glacibloom', route: 'Glacier Garden', trail: 'Iceflower Circuit', concept: 'ice-flower penguin spirit' },
  { root: 'niblet', mid: 'cacaocrest', adult: 'canopycacao', route: 'Cocoa Highlands', trail: 'Podshade Track', concept: 'cacao pod monkey spirit' },
  { root: 'siltip', mid: 'marshcoil', adult: 'estuaryn', route: 'Saltmarsh Flats', trail: 'Eelgrass Causeway', concept: 'eelgrass otter spirit' },
  { root: 'mistyak', mid: 'cloudyak', adult: 'skyburden', route: 'Cloudbreak Peaks', trail: 'Sunabove Trail', concept: 'cloud yak spirit' },
  { root: 'twigglypt', mid: 'ringback', adult: 'chronotree', route: 'Petrified Grove', trail: 'Ringwood Path', concept: 'tree-ring pangolin spirit' },
  { root: 'glyphish', mid: 'runefin', adult: 'tideglyph', route: 'Sunken Ruins', trail: 'Bubble Archway', concept: 'rune-marked nautilus spirit' },
  { root: 'knockit', mid: 'bamboar', adult: 'canebrute', route: 'Bamboo Ravine', trail: 'Hollowstem Way', concept: 'bamboo boar spirit' },
  { root: 'pepkit', mid: 'capsiclaw', adult: 'scovlion', route: 'Peppergrass Savanna', trail: 'Spicewind Track', concept: 'pepper-maned lion spirit' },
  { root: 'pebbloom', mid: 'selencore', adult: 'moonvault', route: 'Moonstone Caverns', trail: 'Echo Gem Route', concept: 'moonstone mole spirit' },
  { root: 'lotuslet', mid: 'bloomnewt', adult: 'lotosaur', route: 'Lotus Delta', trail: 'Petalwater Trail', concept: 'lotus newt spirit' },
  { root: 'kernelit', mid: 'millwing', adult: 'harvestail', route: 'Windmill Plains', trail: 'Grainwheel Road', concept: 'grain moth and windmill spirit' },
  { root: 'conecko', mid: 'barkglide', adult: 'redwoodrake', route: 'Redwood Crown', trail: 'Giant Step Trail', concept: 'redwood flying gecko spirit' },
  { root: 'bloopot', mid: 'vaportoise', adult: 'geyshell', route: 'Geyser Basin', trail: 'Steamstone Walk', concept: 'geyser tortoise spirit' },
  { root: 'figbat', mid: 'orchardusk', adult: 'noctifera', route: 'Night Orchard', trail: 'Starlit Fig Path', concept: 'fig fruit-bat spirit' },
  { root: 'ammonip', mid: 'spiralisk', adult: 'aeoncoil', route: 'Shellwind Desert', trail: 'Fossil Current', concept: 'ammonite desert spirit' },
  { root: 'tinkid', mid: 'alpengait', adult: 'summitbell', route: 'Alpine Meadow', trail: 'Bellflower Ascent', concept: 'bellflower mountain antelope spirit' },
];

export const HORIZON_COMPANION_IDS = HORIZON_FAMILIES.map((f) => f.root);

export default HORIZON_FAMILIES;
