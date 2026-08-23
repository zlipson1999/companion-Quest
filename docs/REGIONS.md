# Companion Quest — 11 Regions

Fifty-eight families, grouped into **11 regions**. The Grove is unchanged.
Each Horizon region has two walkable trails: an approach, then a Warden
capstone that awards the region badge (the existing Quest Pin).

No new screens. Trails reuse Grove maps, skies, and the six existing
obstacle Wardens.

## The map

| Region | Trails | Families | Opens after | Badge / Warden |
| --- | --- | --- | --- | --- |
| The Grove | Maple, Cairn, Gale, Canopy, Rill, Ember | 18 original | start | Ember Pin / Cindergrind |
| Tideglass Coast | Saltglass Strand → Blackwave Traverse | Brineling, Skiprock, Pipolyp, Siltip | Maple Pin | Tideglass Badge / Brinegnash |
| Red Mesa | Suncrack Trail → Glassfire Descent | Dusthorn, Veilisk, Chipmagma, Ammonip | Stone Pin | Mesa Badge / Cindergrind |
| Moonfen | Silver Reed Walk → Petalwater Trail | Kneebit, Mireblink, Wicklet, Lotadpole | Canopy Pin | Fen Badge / Couchlurk |
| Frostpine Reach | Needle-Snow Pass → Iceflower Circuit | Pinepuff, Prismink, Budice, Plinkbat | Gale Pin | Frost Badge / Couchlurk |
| Copper Canyon | Echo Rail → Steamstone Walk | Clinket, Knockit, Nailnut, Bloopot | Stone Pin | Copper Badge / Snoozeghoul |
| Starfall Prairie | Cometgrass Run → Grainwheel Road | Bellbun, Burrcalf, Glintfoal, Kernelit | Maple Pin | Prairie Badge / Achefang |
| Amber Orchard | Honeyfall Lane → Cindergrass Route | Nectlet, Pepkit, Glimrice, Sootfinch | Maple Pin | Orchard Badge / Sludgewad |
| Thunderstep Highlands | Static Ridge → Heartstone Walk | Zapram, Tinkid, Mistyak, Roseling | Gale Pin | Summit Badge / Achefang |
| Mangrove Maze | Rootwater Boardwalk → Giant Step Trail | Propfin, Niblet, Conecko, Figbat | Tide Pin | Rootwater Badge / Brinegnash |
| Deep Horizon | Ringwood Path → Bubble Archway | Mumblewool, Twigglypt, Pebbloom, Glyphish | Ember Pin | Horizon Badge / Cindergrind |

## How a region plays

1. A Grove pin opens the approach trail.
2. Walk the miles/reps, clear the lighter Warden, earn the approach pin.
3. The capstone opens. Full regional ecology is in that pool (commons stay, rares join).
4. Clear the capstone Warden for the **region badge**.

Maple–Ember still unlock in their original order. Horizon regions never
insert themselves into that chain (`nextRoute` stays Grove-only).

## Visual identity

Each region reuses one existing tone / map / edge:

- Grove — mixed Maple–Ember (already shipped)
- Tideglass — rill water
- Red Mesa — ember stone
- Moonfen — dusk canopy
- Frostpine — dusk trees
- Copper — cairn stone
- Starfall — gale open
- Amber — maple orchard
- Thunderstep — gale high
- Mangrove — canopy shade
- Deep Horizon — dusk stone

## Obstacles

No new obstacle creatures. Regions borrow the six existing bad-habit
Wardens. Capstone HP is higher; approach trails use a lighter fight
with the same cast.

## Data

- `src/data/regions.js` — ecology, landmarks, discoveries, badges, generated Horizon trails
- `src/data/routes.js` — Grove trails verbatim, then `...HORIZON_ROUTES`
- `src/data/horizon.js` — family → region / first trail
