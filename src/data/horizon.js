// Horizon roster: 40 original companion families from the design spec.
// Creature ids are permanent. Do not rename. Do not re-list these in
// creatures.js — that file already spreads HORIZON_CREATURES.

export const HORIZON_FAMILIES = [
  { root: "brineling", mid: "shoregleam", adult: "tidecrown", route: "Tideglass Coast", trail: "Saltglass Strand", concept: "sea-glass hermit spirit", trait: "hydration", rarity: "common", region: "tideglass" },
  { root: "dusthorn", mid: "mesaquill", adult: "suncerast", route: "Red Mesa", trail: "Suncrack Trail", concept: "desert horned-lizard spirit", trait: "strength", rarity: "common", region: "redmesa" },
  { root: "mireblink", mid: "lunareed", adult: "fenoracle", route: "Moonfen", trail: "Silver Reed Walk", concept: "marsh firefly-frog spirit", trait: "sleep", rarity: "uncommon", region: "moonfen" },
  { root: "pinepuff", mid: "rimecone", adult: "frostbough", route: "Frostpine Reach", trail: "Needle-Snow Pass", concept: "pinecone snow spirit", trait: "sleep", rarity: "common", region: "frostpine" },
  { root: "clinket", mid: "bellstride", adult: "canyonchime", route: "Copper Canyon", trail: "Echo Rail", concept: "copper bell armadillo", trait: "consistency", rarity: "common", region: "copper" },
  { root: "glintfoal", mid: "astramare", adult: "cometmane", route: "Starfall Prairie", trail: "Cometgrass Run", concept: "starlight prairie foal", trait: "walking", rarity: "uncommon", region: "starfall" },
  { root: "propfin", mid: "mangrusk", adult: "rootback", route: "Mangrove Maze", trail: "Rootwater Boardwalk", concept: "mangrove mudskipper spirit", trait: "recovery", rarity: "common", region: "mangrove" },
  { root: "zapram", mid: "voltibex", adult: "stormhorn", route: "Thunderstep Highlands", trail: "Static Ridge", concept: "electric mountain goat spirit", trait: "cardio", rarity: "common", region: "thunderstep" },
  { root: "nectlet", mid: "combwing", adult: "apiarch", route: "Amber Orchard", trail: "Honeyfall Lane", concept: "honeybee-deer spirit", trait: "nutrition", rarity: "common", region: "amber" },
  { root: "chipmagma", mid: "shardscale", adult: "obsidrake", route: "Obsidian Hollow", trail: "Glassfire Descent", concept: "volcanic glass salamander", trait: "strength", rarity: "rare", region: "redmesa" },
  { root: "bellbun", mid: "chimehare", adult: "bloomrunner", route: "Bluebell Downs", trail: "Petalwind Path", concept: "bluebell rabbit spirit", trait: "cardio", rarity: "common", region: "starfall" },
  { root: "nailnut", mid: "ferracorn", adult: "ironstag", route: "Ironwood Wilds", trail: "Forgeleaf Trail", concept: "ironwood acorn stag spirit", trait: "strength", rarity: "uncommon", region: "copper" },
  { root: "pipolyp", mid: "reeframble", adult: "coralith", route: "Coral Stair", trail: "Anemone Steps", concept: "coral polyp octopus spirit", trait: "recovery", rarity: "uncommon", region: "tideglass" },
  { root: "veilisk", mid: "duneshade", adult: "mirajinn", route: "Saffron Dunes", trail: "Mirage Track", concept: "desert veil gecko spirit", trait: "hydration", rarity: "uncommon", region: "redmesa" },
  { root: "plinkbat", mid: "cavernwing", adult: "rainvault", route: "Rainshadow Forest", trail: "Dripstone Trail", concept: "cave bat and stalactite spirit", trait: "sleep", rarity: "rare", region: "frostpine" },
  { root: "burrcalf", mid: "thistlebuck", adult: "prairieguard", route: "Golden Steppe", trail: "Thistlehoof Way", concept: "thistle bison spirit", trait: "consistency", rarity: "common", region: "starfall" },
  { root: "prismink", mid: "aurorermine", adult: "polarveil", route: "Crystal Tundra", trail: "Aurora Shelf", concept: "aurora mink spirit", trait: "sleep", rarity: "uncommon", region: "frostpine" },
  { root: "kneebit", mid: "swampstride", adult: "cypressage", route: "Cypress Basin", trail: "Kneeroot Loop", concept: "cypress-knee turtle spirit", trait: "recovery", rarity: "common", region: "moonfen" },
  { root: "mumblewool", mid: "heatheram", adult: "moorwarden", route: "Lavender Moor", trail: "Hushheather Trail", concept: "heather sheep spirit", trait: "sleep", rarity: "common", region: "deephorizon" },
  { root: "skiprock", mid: "basalisk", adult: "breakwater", route: "Basalt Coast", trail: "Blackwave Traverse", concept: "skipping-stone seal spirit", trait: "cardio", rarity: "common", region: "tideglass" },
  { root: "glimrice", mid: "paddyglow", adult: "terracelume", route: "Firefly Terrace", trail: "Lantern Rice Path", concept: "rice-paddy firefly crane spirit", trait: "walking", rarity: "uncommon", region: "amber" },
  { root: "roseling", mid: "facetram", adult: "quartzibex", route: "Rose Quartz Vale", trail: "Heartstone Walk", concept: "rose-quartz mountain sheep spirit", trait: "consistency", rarity: "rare", region: "thunderstep" },
  { root: "wicklet", mid: "willowisp", adult: "mereweaver", route: "Willowmere", trail: "Drooping Branch Trail", concept: "willow dragonfly spirit", trait: "recovery", rarity: "uncommon", region: "moonfen" },
  { root: "sootfinch", mid: "ashlark", adult: "emberchorus", route: "Ashen Fields", trail: "Cindergrass Route", concept: "ash-and-ember songbird", trait: "cardio", rarity: "rare", region: "amber" },
  { root: "budice", mid: "petalfloe", adult: "glacibloom", route: "Glacier Garden", trail: "Iceflower Circuit", concept: "ice-flower penguin spirit", trait: "sleep", rarity: "rare", region: "frostpine" },
  { root: "niblet", mid: "cacaocrest", adult: "canopycacao", route: "Cocoa Highlands", trail: "Podshade Track", concept: "cacao pod monkey spirit", trait: "nutrition", rarity: "common", region: "mangrove" },
  { root: "siltip", mid: "marshcoil", adult: "estuaryn", route: "Saltmarsh Flats", trail: "Eelgrass Causeway", concept: "eelgrass otter spirit", trait: "hydration", rarity: "rare", region: "tideglass" },
  { root: "mistyak", mid: "cloudyak", adult: "skyburden", route: "Cloudbreak Peaks", trail: "Sunabove Trail", concept: "cloud yak spirit", trait: "walking", rarity: "uncommon", region: "thunderstep" },
  { root: "twigglypt", mid: "ringback", adult: "chronotree", route: "Petrified Grove", trail: "Ringwood Path", concept: "tree-ring pangolin spirit", trait: "consistency", rarity: "uncommon", region: "deephorizon" },
  { root: "glyphish", mid: "runefin", adult: "tideglyph", route: "Sunken Ruins", trail: "Bubble Archway", concept: "rune-marked nautilus spirit", trait: "consistency", rarity: "rare", region: "deephorizon" },
  { root: "knockit", mid: "bamboar", adult: "canebrute", route: "Bamboo Ravine", trail: "Hollowstem Way", concept: "bamboo boar spirit", trait: "strength", rarity: "common", region: "copper" },
  { root: "pepkit", mid: "capsiclaw", adult: "scovlion", route: "Peppergrass Savanna", trail: "Spicewind Track", concept: "pepper-maned lion spirit", trait: "strength", rarity: "uncommon", region: "amber" },
  { root: "pebbloom", mid: "selencore", adult: "moonvault", route: "Moonstone Caverns", trail: "Echo Gem Route", concept: "moonstone mole spirit", trait: "recovery", rarity: "uncommon", region: "deephorizon" },
  { root: "lotadpole", mid: "bloomnewt", adult: "lotosaur", route: "Lotus Delta", trail: "Petalwater Trail", concept: "lotus newt spirit", trait: "recovery", rarity: "rare", region: "moonfen" },
  { root: "kernelit", mid: "millwing", adult: "harvestail", route: "Windmill Plains", trail: "Grainwheel Road", concept: "grain moth and windmill spirit", trait: "nutrition", rarity: "rare", region: "starfall" },
  { root: "conecko", mid: "barkglide", adult: "redwoodrake", route: "Redwood Crown", trail: "Giant Step Trail", concept: "redwood flying gecko spirit", trait: "walking", rarity: "uncommon", region: "mangrove" },
  { root: "bloopot", mid: "vaportoise", adult: "geyshell", route: "Geyser Basin", trail: "Steamstone Walk", concept: "geyser tortoise spirit", trait: "hydration", rarity: "rare", region: "copper" },
  { root: "figbat", mid: "orchardusk", adult: "noctifera", route: "Night Orchard", trail: "Starlit Fig Path", concept: "fig fruit-bat spirit", trait: "nutrition", rarity: "rare", region: "mangrove" },
  { root: "ammonip", mid: "spiralisk", adult: "aeoncoil", route: "Shellwind Desert", trail: "Fossil Current", concept: "ammonite desert spirit", trait: "consistency", rarity: "rare", region: "redmesa" },
  { root: "tinkid", mid: "alpengait", adult: "summitbell", route: "Alpine Meadow", trail: "Bellflower Ascent", concept: "bellflower mountain antelope spirit", trait: "walking", rarity: "uncommon", region: "thunderstep" },
];

export const HORIZON_COMPANION_IDS = HORIZON_FAMILIES.map((f) => f.root);

const SPEC_CHAINS = [
  ["brineling", "shoregleam", "tidecrown"],
  ["dusthorn", "mesaquill", "suncerast"],
  ["mireblink", "lunareed", "fenoracle"],
  ["pinepuff", "rimecone", "frostbough"],
  ["clinket", "bellstride", "canyonchime"],
  ["glintfoal", "astramare", "cometmane"],
  ["propfin", "mangrusk", "rootback"],
  ["zapram", "voltibex", "stormhorn"],
  ["nectlet", "combwing", "apiarch"],
  ["chipmagma", "shardscale", "obsidrake"],
  ["bellbun", "chimehare", "bloomrunner"],
  ["nailnut", "ferracorn", "ironstag"],
  ["pipolyp", "reeframble", "coralith"],
  ["veilisk", "duneshade", "mirajinn"],
  ["plinkbat", "cavernwing", "rainvault"],
  ["burrcalf", "thistlebuck", "prairieguard"],
  ["prismink", "aurorermine", "polarveil"],
  ["kneebit", "swampstride", "cypressage"],
  ["mumblewool", "heatheram", "moorwarden"],
  ["skiprock", "basalisk", "breakwater"],
  ["glimrice", "paddyglow", "terracelume"],
  ["roseling", "facetram", "quartzibex"],
  ["wicklet", "willowisp", "mereweaver"],
  ["sootfinch", "ashlark", "emberchorus"],
  ["budice", "petalfloe", "glacibloom"],
  ["niblet", "cacaocrest", "canopycacao"],
  ["siltip", "marshcoil", "estuaryn"],
  ["mistyak", "cloudyak", "skyburden"],
  ["twigglypt", "ringback", "chronotree"],
  ["glyphish", "runefin", "tideglyph"],
  ["knockit", "bamboar", "canebrute"],
  ["pepkit", "capsiclaw", "scovlion"],
  ["pebbloom", "selencore", "moonvault"],
  ["lotadpole", "bloomnewt", "lotosaur"],
  ["kernelit", "millwing", "harvestail"],
  ["conecko", "barkglide", "redwoodrake"],
  ["bloopot", "vaportoise", "geyshell"],
  ["figbat", "orchardusk", "noctifera"],
  ["ammonip", "spiralisk", "aeoncoil"],
  ["tinkid", "alpengait", "summitbell"],
];
if (HORIZON_FAMILIES.length !== 40) {
  throw new Error(`horizon: expected 40 families, got ${HORIZON_FAMILIES.length}`);
}
HORIZON_FAMILIES.forEach((family, index) => {
  const [root, mid, adult] = SPEC_CHAINS[index];
  if (family.root !== root || family.mid !== mid || family.adult !== adult) {
    throw new Error(
      `horizon: family ${String(index + 1).padStart(2, '0')} must be `
      + `${root} → ${mid} → ${adult}`,
    );
  }
});

export default HORIZON_FAMILIES;
