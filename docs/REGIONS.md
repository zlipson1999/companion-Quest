# Companion Quest — 11 Regions / 26 Biomes

Fifty-eight families. Eleven regions. **Each trail is its own biome** with
its own sky, ground, edge, and exclusive wild pool.

The Grove is unchanged: six trails, original 18 families, cumulative pools.
Horizon trails do **not** share faces — walk Saltglass Strand for Brineling,
Blackwave Traverse for Pipolyp. Different ground, different companions.

## The Grove (unchanged)

| Trail | Biome | Terrain | Companions |
| --- | --- | --- | --- |
| Maple Trail | Maple Woods | trees, grass, flowers | Spinseed, Bramblet, Lanternbud |
| Cairn Cut | Packed Earth | stone, cairns | + Rubblet, Chockit, Facetel |
| Gale Reach | Open Country | sky, thin track | + Whistlet, Kitefin, Loftburr, Wispurr |
| Canopy Run | Deep Shade | undergrowth | + Fernap, Dapple, Stillcup, Sporelet, Pebblepup |
| Rill Crossing | Stream Crossing | water | + starters grown |
| Ember Grade | Cinder Grade | ember stone | + grown stone/wind/rest |

## Horizon — one biome, one pool

| Region | Trail | Biome | Terrain | Wild there |
| --- | --- | --- | --- | --- |
| Tideglass Coast | Saltglass Strand | Glass Strand | wet sand, tide pools | Brineling, Skiprock |
| Tideglass Coast | Blackwave Traverse | Basalt Reef | coral, eelgrass | Pipolyp, Siltip |
| Red Mesa | Suncrack Trail | Suncrack Shelf | hot ochre | Dusthorn, Veilisk |
| Red Mesa | Glassfire Descent | Glassfire Cut | obsidian, fossil sand | Chipmagma, Ammonip |
| Moonfen | Silver Reed Walk | Silver Reed Marsh | cypress, night-lights | Kneebit, Mireblink |
| Moonfen | Petalwater Trail | Lotus Delta | still pools, willow | Wicklet, Lotadpole |
| Frostpine Reach | Needle-Snow Pass | Needle-Snow | pine, quiet snow | Pinepuff, Prismink |
| Frostpine Reach | Iceflower Circuit | Iceflower Cavern | ice bloom, dripstone | Budice, Plinkbat |
| Copper Canyon | Echo Rail | Echo Rail | copper plates | Clinket, Knockit |
| Copper Canyon | Steamstone Walk | Steamstone Basin | geyser, ironwood | Nailnut, Bloopot |
| Starfall Prairie | Cometgrass Run | Cometgrass Prairie | dawn dew, bluebells | Bellbun, Burrcalf |
| Starfall Prairie | Grainwheel Road | Grainwheel Plains | wheat, mill-sails | Glintfoal, Kernelit |
| Amber Orchard | Honeyfall Lane | Honey Rows | orchard, comb drip | Nectlet, Pepkit |
| Amber Orchard | Cindergrass Route | Cindergrass Fields | dusk rice, ash grass | Glimrice, Sootfinch |
| Thunderstep Highlands | Static Ridge | Static Ridge | bare rock, thin air | Zapram, Tinkid |
| Thunderstep Highlands | Heartstone Walk | Heartstone Heights | cloud pasture, quartz | Mistyak, Roseling |
| Mangrove Maze | Rootwater Boardwalk | Rootwater Swamp | prop-roots, brackish | Propfin, Niblet |
| Mangrove Maze | Giant Step Trail | Redwood Crown | giant trunks, fig dark | Conecko, Figbat |
| Deep Horizon | Ringwood Path | Petrified Ringwood | heather, stone rings | Mumblewool, Twigglypt |
| Deep Horizon | Bubble Archway | Moonstone Ruin | cave pearl, glyph water | Pebbloom, Glyphish |

## How it plays

A Grove pin opens the approach biome. Clear that Warden, then the capstone
biome — a different field, a different two companions, a harder Warden, the
region badge.

Visuals reuse existing tile art (grass / earth / turf / mats / cave floor)
under a unique sky per trail. No new pixel art plates required for biomes.

## Data

- `src/data/regions.js` — `TRAIL_BIOMES` + exclusive pools
- `src/data/sceneSky.js` — one tone per trail
- `src/components/TileMap.js` — floor by `mapId`
- `src/data/routes.js` — Grove biomes named; extra `trailRow` edges

## World Map screen

`src/screens/WorldMapScreen.js` is the journal entry point for the 11 regions.

- Hub → **Trails** opens the World Map (not the raw Route sheet).
- World lists every region with locked / open / complete state, pin counts,
  and a biome colour strip from `sceneSky`.
- Region view shows Quest Pins earned, companion silhouettes (unknown until
  seen), landmarks, and the trails of that region.
- Picking an unlocked trail sets it active and opens the existing Route screen.
- Route's on-trail menu also links back to the World Map.

No new art plates. Stand-in faces and sky bands are intentional until Horizon
masters are traced.
