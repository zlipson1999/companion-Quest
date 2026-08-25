# Companion Quest — phase history

This is the changelog that used to live in `CLAUDE.md`. It is kept so a
new session can see how the systems grew. It is **not** the instruction
manual. For current rules see `CLAUDE.md`, `docs/CREATING_CHARACTERS.md`,
`docs/AGENTS.md`, and `docs/GAME_BIBLE.md`.

The thirteen phase sections below are copied verbatim from the file that
used to wear a manual's name.

## Phase 3 — DONE: pluggable life modules

The module-agnostic progression is now a real plugin system, with **Hydration**
and **Nourish (diet)** as the two example modules.

**`src/modules/`**
- `daily.js` — the calendar + reward engine, shared by every module and by the
  reducer. Pure functions, no React: `todayKey()` (LOCAL date, not UTC),
  `rollDay()`, `normalizeDay()`, `progressFor()`, `applyLog()`. A streak survives
  a day roll only if the goal was met today or yesterday.
- `index.js` — the registry. `MODULES` is the install list; helpers
  (`getModule`, `moduleStateFor`, `rollAllModules`, `modulesNeedRoll`,
  `logModuleAction`, `moduleProgress/Summary/Cheer`, `moduleSprite`) are what the
  reducer and UI call. Nothing outside `src/modules` names a specific module.
- `hydration.js`, `diet.js` — the reference modules.

**Adding a life module (sleep, meditation, reading, chores, check-ins…):** write
one object with `{ id, name, tagline, blurb, sprite, spritePalette, color, unit,
dailyGoal, actions:[{id,label,sublabel,amount,reward:{xp,bond,heal}, apply?}],
goalReward:{xp,bond}, initialState?(), screen?, replaces?, progress?(day),
summary?(day), cheer?(day) }` and add it to `MODULES`. `replaces: true` means the
actions SET the day's value rather than adding to it (see `sleep.js`) and switches
the reward cap to a top-up ledger. `actions` may instead be a function of
module state when they depend on the player's own content (see `forge`). That's it — the Habits hub, log screen, progress bars, streaks, daily
reset, save migration and Status readout all pick it up. Art is optional: a
module with no `sprite` falls back to `mod_check`.

**State:** `state.modules = { [id]: { date, count, entries, goalHit, streak,
bestStreak, lastGoalDate, goalDays, totalCount, totalLogs } }`. Save `version`
bumped to 3; v1/v2 saves get zeroed buckets for every registered module, and
HYDRATE stamps the current version. The daily reset happens in HYDRATE via
`rollAllModules`, plus a `MODULE_RESET_DAY` self-heal from the Habits screens so
a session left open past midnight starts the new day clean.

**Reducer:** `MODULE_LOG` updates `state.modules[id]` and hands the action's
reward (plus the once-a-day `goalReward` bonus) to the SAME `applyEffect` path
that workouts and battles use — a module never learns how progression works.
`MODULE_RESET_DAY` rolls one module or all of them.

**UI:** `HabitsScreen` (hub, one bordered card per installed module) and
`HabitLogScreen` (a module's actions, today's bar, streaks, today's log tape),
registered in `Router.js` as `habits` / `habit`, reached by walking into the
bedroom desk or the gym's water station (there is no Habits menu entry — see
Phase 7, the gym IS the menu).
The Status screen grew a "Daily Habits" block plus habit-log stats.

**Art:** original 24×24 module icons in `tools/make_sprites.py` — `mod_droplet`,
`mod_plate` and `mod_check` (the art-less-module fallback) shipped with Phase 3;
`mod_barbell`, `mod_moon` and `mod_still` followed with the Forge, Sleep and
Stillness, for six. No
new audio: logs reuse `item`/`milestone`/`levelup`.

## Phase 4 — DONE: Workout Forge + battle-stage fidelity

**Workout Forge** (`src/modules/forge/`) — the module where the player writes the
content. It is the reason the plugin interface grew three generic hooks:
`actions(modState)` (the Forge's actions ARE the player's saved plans),
`initialState()` (module-owned, non-daily data — the plans themselves), and
`screen` (bring your own UI). `MODULE_PATCH` persists module-owned data without
the reducer knowing about any specific module. Any future module can use all of it.

- `src/data/muscles.js` — 14 groups, each carrying the geometry of its own plate.
- `src/data/movements.js` — **140 movements / 8 patterns / 8 equipment types**
  (bodyweight, DB, BB, KB, band, cable, machine, cardio kit), each declaring the
  muscles it trains, a relative `load`, and 3-4 coaching cues. `searchMovements(q,
  {pattern, equipment})` powers the picker's search + filter chips.
  **Movement ids are permanent** — saved plans store them, so add freely but
  never rename or remove one.
- `forge/analysis.js` — the on-device analyser. **Deterministic scoring, not an
  LLM**: coverage, pattern balance, volume (load weighted superlinearly so hard
  short sets beat easy long ones), intensity, duration. Explains every number.
- `forge/perks.js` — 9 perks, each with its own test and a plain-language reason.
  Gated behind `PERK_MIN_SETS`/`PERK_MIN_VOLUME` so a token plan earns nothing.
- `components/BodyMap3D.js` — real 3D via `expo-gl` + `three`, low-poly and
  flat-shaded, built procedurally from the muscle data (still zero asset files).
  Falls back to `<BodyMapFlat>`, a 2D projection of the same data, if GL fails.
- `screens/FormCheckScreen.js` — front camera as a mirror plus cue ticker.
  **Not pose analysis** — there is no pose model in the app, and the screen says
  so. Nothing recorded or sent; works fully with the camera declined.

**Integration:** the Forge is reached by walking into any of the gym's iron; Form Check
carries the running session's progress across in `params.resume` so leaving for
a mirror does not discard it; every non-battle route is in `TOWN_BGM` (fleeing a
battle to the Route used to keep the battle music playing).

**Reward safety:** `applyLog` credits only the portion of a log that lands inside
the daily goal. Logging past the goal is tallied but pays nothing, so no log
button is ever a free progression button. Forge `dailyGoal` is 1 session.

**Challenge-stage presentation** — `components/BattleStage.js` provides the
shared environment while `components/StatusPlate.js` uses matched Resolve and
Growth instruments. Composition must be evaluated against the separation
contract above, not against another game's battle screen.

## Phase 5 — DONE: memory, recovery and a grounded Coach

The app could only ever see *today*. Five features that all needed the same
missing thing: a record of what actually happened.

**`src/state/history.js`** — the substrate. `{ [dateKey]: dayRecord }`, written
by one reducer helper (`remember()`), trimmed to `KEEP_DAYS` (60). Pure
transforms: `stamp` (numbers add, booleans OR), `lastDays`, `weekOf`,
`previousWeekOf`, `totals`, `isActive`. Save `version` bumped to **4**; older
saves start recording from the upgrade — there is no honest way to invent days
nobody logged.

**`src/state/recovery.js`** — acute (7-day) vs chronic (28-day, scaled) training
load, plus consecutive-active-days, which is the blunter signal that actually
predicts overuse. Returns a status, a plain-language `advice` string, and
`needsRest` / `deloadDue`. **It only ever advises** — nothing blocks a workout.
`REST_DAY` logs a rest day for **bond + healing, never XP**: resting is a
training decision, not a way to earn.

**`src/modules/forge/history.js`** — per-plan session log (`KEEP_SESSIONS` 120),
per-movement PRs (best single set), per-plan volume bests. The plan detail shows
last time vs as-written; the session runner shows last time's numbers per block
and flags sets that would beat a record. All module-owned data via `MODULE_PATCH`.

**`src/screens/WeekScreen.js`** — seven columns, this week against last, with the
awkward sentence when there is one ("six days on and none off").

**`src/coach/context.js`** — a compact factual brief (habits, 14-day totals,
recovery, recent sessions, neglected muscle groups, saved plans) sent to the
player's own proxy. The server **fences it as data**, length-caps it, and the
prompt states it can never change the rules.

**New modules:** `sleep.js` and `meditation.js`. Sleep introduced one interface
addition — **`replaces: true`**: its actions SET the night rather than
accumulating, so the daily reward cap must not pro-rate (that would pay *less*
for a longer night). Instead a `paid` ledger pays the difference, so correcting
an entry upward tops you up and downward pays nothing without clawing back.

## Phase 7 — DONE: the characters are the cards, and the gym has an inside

**Characters.** The committed cards in `assets/characters/` were shown as flat
`<Image>` on three screens while the world drew 2023-era placeholder sprites, so
you met a painted Coach Maple in the intro and a blue-haired stranger in the
overworld. `tools/convert_character.py` now traces the cards into portraits, and
`hero()` draws a matching 24x32 overworld set per character. `playerGender` was
stored, migrated and never read — `src/data/characters.js` is the single
resolver every screen goes through now. See `docs/ART_KIT.md` for the two-tier
split and why the overworld sprite is authored rather than downsampled.

Two bugs fell out of it, both in `tools/make_sprites.py`:
- `ramp()` interpolated hue as a plain number, so a ramp straddling red took the
  340-degree detour through cyan. That is why a red-to-coral character came out
  purple in the midtones. Fixed wrap-aware; only the wrap-crossing palettes
  changed, which also repaired `spore` (Sporelet / Mycobloom / Canopore).
- `build_all()` now **fails** if any traced art reaches no sprite. The silent
  fallback in `add()` is what let the cards go unused for a release.

**The overworld sprite IS the card.** `walk_set()` derives four facings x three
frames from one traced standing pose — stride frames, a back view made by
covering the face with the sampled hair colour, and a side view made by
narrowing the figure. Characters are sized by height now, since a traced figure
is tall and slim rather than a square 24x32 block.

**Furnished rooms.** The bedroom has a bed, TV, desk, shelf, rug and plant; the
front room has a kitchen run, fridge, table and sofa; the gym added a pull-up
bar, rower, kettlebells, lockers, reception and more racks. Props are
transparent overlays over the room's floor — see `docs/ART_KIT.md`. The bed is
solid, so `HomeRestScreen` sleeps when you walk *into* it rather than onto it.

**You can always see the whole place you are standing in.** `WorldScreen`
CONTAINS every map — room, gym and town alike. Tile size is whatever makes the
map fit across the phone, and nothing is cropped or scrolled out of view.
Covering the screen instead put a camera on a space you could not see the shape
of, which is disorienting in a room you cross in six steps and no better in a
hall.

A map is roughly square and a phone is not, so containing leaves slack. It
belongs to the WORLD band, filled with the world's own tone — a strip of dark
grass above the town reads as distance, where the same strip in interface navy
read as a gap somebody forgot to fill. The HUD sits on the bottom edge:
objective ribbon, the stick, and `CompanionStatus` — sprite, level, Resolve and
Growth meters, bond, HP and lifetime totals. That used to be a strip only Maple
Lane drew, so stepping indoors lost sight of the thing the game is about.

Route 1 stays full-bleed: it has no map to see the shape of, only a trail
scrolling past.

**Route 1 is full-bleed too.** The trail was a window in the top 42% with a
panel of step diagnostics under it. The scene is the screen now; the trail
stats overlay the top, the message and the one action sit at the bottom, and
everything that explains the step counter — which matters, but is reference
rather than scenery — lives behind the menu button. `worldTileFor` also fills
the phone's height outright instead of clamping at 68, which was letterboxing
tall phones by about a hundred pixels.

**The first battle is a push-up contest.** Coach Maple is mid-session with
another trailkeeper, Rowan, when you walk into the gym; once you have your
companion she puts you against him. `SparIntroScreen` frames it and hands
straight to the REAL `BattleScreen` — same moves, same Resolve, same victory
path. `resolveTarget` gained a third case for it: a sparring partner is a
person passed in whole as `params.opponent` rather than looked up in the
creature table, so a human opponent never lands in the Index and can never be
befriended. It stages on `hall` rather than in a meadow.

**Furniture is the interface, in every room.** Walking into a thing uses it,
and what a thing does belongs to the ROOM rather than to the tile code — a
bookshelf in a kitchen is a cookbook and the one in a bedroom is not. Maps carry
their own `interactions` table; `interactionForCode(code, map)` checks it before
the shared one.

- **Bedroom** — bed logs last night's sleep, desk opens your daily habits,
  the screen shows the week, the shelf is your creature index.
- **Kitchen** — counter, fridge and table log a meal to Nourish; the shelf is
  `CookbookScreen`, a real browsable cookbook: **74 original recipes across 15
  cuisines** in `src/data/recipes.js`, reached through **18 categories** (Quick
  & Easy, Meal Prep, Vegan, High Protein, Low Carb, Seafood, One Pan, No Cook,
  Budget, Around the World...) or by **searching name, blurb, tags and
  ingredients** — "what can I do with a tin of chickpeas" is the question people
  actually have. Categories are `{ id, name, color, match(recipe) }` derived
  from tags, so the counts on the shelf and the lists behind them come from the
  same predicate and cannot drift; adding a category is one line. Each recipe
  names the Nourish check-in it honestly counts as (`logAs`), so "I Made This"
  is one motion; `LOG_ACTIONS` is asserted at import so a typo fails the build
  instead of silently logging the wrong check-in. Deliberately not calorie maths
  — the module is check-in based because the game rewards showing up, and the
  cookbook has to agree with it. **All recipe text is written for this project**;
  cooking methods are common knowledge and dish styles belong to the cuisines
  that made them, but no phrasing is lifted from anyone's book or app, and that
  has to stay true of anything added. The sofa is a stillness check-in.
- **Quest Fitness** (the gym) — laid out on the ordinary commercial-gym convention rather
  than as equipment spread evenly over a rectangle, which is a warehouse.
  Perimeter for the things that back onto a wall, centre for the things that do
  not: **power racks along the north wall** on the lifting platform (a rack is
  bolted to a wall in every gym that owns one — floating them mid-floor was the
  most wrong thing about the first plan), **free weights down the west wall**
  (kettlebells, the dumbbell run against the wall with a working aisle in front
  of it, benches and the EZ-bar cradle out on the floor beside it, mirrors at
  the far end), **cardio down the east wall** in one unbroken line with the
  water station at its head, **selectorised machines in the middle** in two rows
  with an aisle between them and a cross-aisle through the middle, the
  **functional end at the south** — turf lane one side, matting the other — and
  **front of house at the door**, lockers one side and reception the other.
  Equipment is props rather than tiles so it can take its own `gymkit` palette —
  colour-coded bumper plates are most of what makes a rack read as a rack at a
  quarter of a tile. The iron is where you WRITE a session (racks, dumbbells,
  EZ bars, benches, the selectorised machines, pull-up bar and kettlebells all
  open the Forge); Coach hands you
  one off the shelf; treadmill and rower are cardio with nothing to interrupt
  you. That split is the logic of the room: equipment is the work, people are
  the advice.
- **Floors are ZONES, not tile codes.** A zone is a REGION a map declares
  (`map.zones`, resolved by `zoneAt` in `TileMap`), and what stands on it is a
  separate question — which is also how a floor plan is drawn. As codes a zone
  could only ever be the floor a tile WAS, so the moment a rack went on a square
  the platform under it vanished and the rack stood on rubber in the middle of
  the wood. `tile_zone_n/e/s/w` overlays draw the joint where a zone stops: a
  dead-straight value step four tiles long reads as a grid line even when
  neither material does, so a zone is drawn as an INLAY — dark joint all round,
  north and west inner edges in the shadow of the lip, south and east catching
  the light. The treadmill deck's running lane uses the same machinery.
- **The gym is lit by fixtures, not evenly.** `light_pool()` bakes a pool of
  light into each gym floor field. A field is already exactly four tiles across,
  so the pools land on the fixture grid for free and the floor between them
  falls away. The first pass drew lighting as its own dithered layer, but a
  single-colour layer can only fake a gradient by scattering and at this tile
  size the scatter read as television static laid over the rubber. Where a
  gradient IS unavoidable (the zone joints) it uses an **ordered Bayer
  threshold**, which reads as a ramp where hash noise reads as static.
- **The turf and the mats are the two zones you use.** Walking into the stretch
  rig at the head of the turf lane opens `Turf Lane Warm-Up` (dynamic walking
  stretches — you need the length, which is why the lane is a lane and not a
  mat); the medicine balls on the matting open `Mat Floor Circuit` (bodyweight
  and core, nothing to load and nothing to queue for). A station names the
  routine it IS via `params.workoutId`, so it opens that routine rather than the
  list of every routine with it somewhere inside — you already said which one
  you wanted by walking there — and backing out returns to the gym.

**The gym is the menu, and cardio has two forms.** The hub menu listed
fourteen destinations, which made the gym decoration — everything it
stands for was one tap away. It lists six places now; training, the Forge,
habits, bag, record and coach are reached by walking into the equipment that
does them. The one distinction that needed more than a link is cardio:

- `route` — Route 1, outdoors. Trail markers reveal encounters and challenges.
- `treadmill` — the gym's deck. Same `RouteScreen`, same miles, same
  milestones, same progression, and **nothing that stops you**: no encounters,
  no companion alongside, no GPS toggle, and an indoor scene on the gym floor.

Coach Maple resolves by state — the goal conversation before you have a
companion, the chat after. Sending a live save to the goal screen would re-run
`START_GAME` and replace the party.

**Movement.** `MoveControl` picks between a thumb stick (default) and the D-pad
from `settings.control`. Crossing a map one deliberate tap per square was the
most tiring thing about the overworld; the stick reports a direction and repeats
it on a timer, so movement stays grid-stepped underneath.

**Quest Fitness.** The gym door used to jump straight to the exercise list. It
is a room now (`GYM` in `src/data/maps.js`, `src/screens/GymScreen.js`) with
barbell and dumbbell racks, selectorised machines, a treadmill, benches,
mirrors, water station and training mats. Walking into a station is how you use it — the
equipment *is* the menu, so the room demonstrates the systems the tutorial used
to explain in a wall of text. Interiors also stopped being carpeted in lawn:
maps declare an `id` and `FIELD_BY_MAP` gives them floorboards or rubber matting.

**Tiles are 32px and render from a PNG atlas.** `PixelArt` emits a View per
colour run per row, which cost 236 Views for one grass tile and ~28,000 for a
map — the ceiling that made higher resolution impossible. `assets/tiles/tile-atlas.png`
plus `src/data/tileAtlas.js` replaced that; the live page is ~1,350 nodes at 4x
the art resolution, and tile grids are stripped out of `sprites.js`. Interiors
gained plank grain, plaster, rubber fleck and a room-lighting pass
(`assets/tiles/room-light.png`). Going higher is now a file-size question:
change `TILE_SCALE`. See `docs/ART_KIT.md`.

**Ground is a field, not a tile.** A 16x16 tile stamped everywhere puts an
identical patch on every square, which reads as chunks however good the tile is.
Grass, path, water, canopy, walls, roofs and both indoor floors are 64x64
textures windowed across a 4x4 block by world position, so they run continuously
and repeat four tiles apart. The atlas cells are made tileable first
(`make_seamless`), and nothing drawn per tile is allowed to land on a tile edge.
See `docs/ART_KIT.md`.

**Autotiling.** Paths and water pick a sprite from which cardinal neighbours
share their material, so edges pull back and feather only where the material
actually ends, with diagonal notch overlays and contact shading south/east of
anything solid. The blends composite the painted atlas tiles — generating them
procedurally put hand-drawn tiles beside atlas ones and the field went patchy.
Extra ground and tree variants are flips of the painted originals. See
`docs/ART_KIT.md`.

**UI system.** `src/theme/tokens.js` holds the Trailkeeper ramps (ink, paper,
grove, trail, sky, ember), a 4px spacing scale with a 44px touch minimum, and
three motion speeds. `FieldCard`, `TrailAction` and `ObjectiveRibbon` are the
shared primitives. This is **additive** — `palette` still works and still means
what it did. Hub and the gym are converted; the remaining screens still use
`Window`/`PixelButton` and are the next pass.

## Phase 8 — DONE: the smoothie bar, Quest Credits, and the Kinship Knot

**The gym is called Quest Fitness.** The building has a proper name; the room
you are standing in is "the gym". Proper noun where it is being named, common
noun where you are being pointed at it — so the hub menu says Quest Fitness and
every back button says "Back to the gym".

**Quest Credits (`src/state/economy.js`) cannot be bought.** A shop needs
something to spend, and the moment a game has a shop it has a pressure to sell
the currency. This one is minted by real effort and nothing else: **10 a mile,
8 a session, 6 a challenge won, 4 for a habit goal you hit**, on the same
fractional carry the walking XP uses (rounding each dispatch alone would floor
every thousandth-of-a-mile to zero). There is no starting balance, no daily
allowance, and older saves migrate at **zero** rather than being back-paid for
miles the app was not counting. Rest days pay bond and healing but never credit,
for the same reason they never pay XP. `mint()` is a pure helper; the four
earning cases call it and nothing else does.

**The smoothie bar** (`SmoothieBarScreen`, stock in `src/data/shop.js`) sits at
the front of the gym beside reception — counter, blender, counter — because that
is where a juice counter is in every gym that has one. Prices are written in
MILES (`MILES(2.5)`) and converted through `CREDIT_PER_MILE`, so the whole board
moves if the earn rate is ever retuned, and every price reads as "this much real
walking". Rows you cannot afford are **not disabled**: a greyed-out row that will
not answer a tap tells you nothing, so each one says how far short you are in the
unit you close the gap with. The reducer looks the price up itself — a screen
that could name its own price is one bug away from a free shop.

**A smoothie is a two-part item.** The blend does something for your companion
and `logAs` records the drink as your own Nourish check-in, through the module's
normal path, so the daily-goal cap applies and buying one can never pay more
than showing up would have. That needed `MODULE_LOG`'s body extracted into
`logModule(state, payload, { mintCredit })` — two implementations of "log a
habit" is how a cap ends up applying on only one of them.

**The Bond Token is gone; the Kinship Knot replaces it.** The old item was a
sphere with an equator band and a button in the middle, thrown at a weakened
creature until it gave in. That is somebody else's object wearing somebody
else's mechanic, and no amount of renaming fixes a silhouette — this is exactly
the originality non-negotiable at the top of this file. A **Kinship Knot** is a
braided cord with two loops: you offer one and keep the other, and it is worn
rather than thrown.

The mechanic changed with it. It used to be `catchRate * (0.4 + 0.6 * (1 -
wildHp))` — wear it down and take it. Now the chance rides on how far through
the shared challenge you are **and on YOUR OWN remaining Resolve**:
`catchRate * (0.25 + 0.45 * shared + 0.30 * standing)`. That inverts the
incentive deliberately: finishing strong earns the knot, where grinding
something into the ground at any cost earns nothing. Save `version` **8**; an
old save's Bond Tokens carry across as Knots rather than being voided.

**The whole west wall is mirror.** They used to be front-wall panels standing on
the floor squares beside the wall, which made the room appear to bulge inward
and made a mirror read as a piece of equipment. They are side-wall panels in the
wall column now, and the wall runs mirrored floor to ceiling the way a real
free-weight wall does. That changed how the tile has to be DRAWN: the first
version framed the glass on all four sides, and seventeen of those stacked put a
rung across the wall every sixteen pixels — the tile grid, redrawn, in the one
room that had just had its grid taken out of the floor. The glass runs the full
height of the tile, the only frame is the vertical edge, and the `_b` variant's
reflection band is VERTICAL for the same reason (a diagonal streak would be
chopped off at every boundary), scattered by `variantFor` so a long wall is
neither seamed nor dead flat. Ten of the seventeen are reachable; the rest have
a dumbbell rack in front of them, which is also true of a real one.

## Phase 9 — DONE: the house, brought up to the gym's standard

The gym got replanned and lit; the house had not moved since it was first
furnished, and beside the gym it looked like a brown box with things in it.

**The walls and the floor were the same brown.** Both came off the furniture
ramp, so a room had no visible corners — that was most of it. Interior plaster
has its own `plaster` palette now: a cool, pale painted wall against a honey
board floor, and that difference IS the edge of the room.

**The floorboards read as brickwork.** Every course the same depth, every plank
the same tone to within a rounding error, and the butt joints coming round
twice per field. Regular short rectangles all one colour is a wall, whatever
you meant by it. What makes wood read as wood is that no two boards match: each
plank is cut at its own value now, the grain runs the length of it hard enough
to see, each board crowns slightly so its middle catches the light, and a joint
is RARE.

**The rug was six bright squares dropped in the middle of both rooms** — the
same mistake as the training mats in the gym, and just as visible from arm's
length. A rug is a SURFACE: `tile_home_rug` is woven wool with a cream motif,
and it is a zone, so it gets the same inlay joint the platform and the turf do.
The kitchen gained a floor of its own the same way. Its vinyl is deliberately
NOT tiled — a tile grid at this scale can only land on the game's own tile
boundaries, and drawing the grid back onto the ground is the one thing the
ground is not allowed to do.

**Both rooms were declared twice**, once in `HomeIntroScreen` and once in
`HomeRestScreen`, and the two copies had already drifted apart. `BEDROOM` and
`DOWNSTAIRS` live in `data/maps.js` now; each screen brings only what is its
own — where you come in, where you leave, and what you are there to do.

**Furnished and re-planned.** Downstairs is 13x15: a counter run along the
north wall (worktop, sink, worktop, cooker, fridge — it used to be four
counters side by side and every one of them had a sink in it), a dining table
and chairs on the kitchen vinyl, then a living room of sofa, coffee table,
screen, shelf, lamp and plant around the rug. The bedroom is 11x13, narrower
because a bedroom for one person that is as wide as a hall reads as a hall: bed
and nightstand, wardrobe, screen, shelf, desk and chair, lamp, plant, rug.
Seven new props — worktop, cooker, chair, coffee table, floor lamp, wardrobe,
nightstand — and the house is lit by `light_pool` like everything else.

**Furniture wider than a tile autotiles.** Drawn whole in every tile it
occupied, the two-tile sofa was two sofas with four arms and the two-tile
wardrobe was two wardrobes — the same mistake as the kitchen run where every
counter had its own sink. `RUN_PROPS` in `TileMap` picks `_l`/`_m`/`_r` from a
prop's own horizontal neighbours, exactly the way a path picks its edge, so
what runs the length of the piece is shared and only the end moves. The shadow
under it runs the whole length too, or the join has daylight beneath it. The
rug PROP was deleted in the same pass: the rug is a zone now, so the sprite
reached no map, and dead art is how the character cards sat unused for a
release.

Walked all twelve stations afterwards: sink, cooker, fridge and table log to
Nourish, the shelf is the cookbook, the sofa is Stillness, both screens are
your week, the desk is Habits, the bedroom shelf is the Index, the wardrobe is
your Bag, and the bed sleeps. The downstairs spawn had to move — it sat
directly under the sofa, so the first step into the room sat you down on it.

## Phase 10 — DONE: Back goes where you came from, and a place remembers you

**Every screen hardcoded its own exit.** The Forge, the Bag, the Index, your
Week, the Habits hub, the premade sessions and Options all said "Back to Town"
and went to the hub, whether you had walked in from the gym, from your kitchen,
or from the hub menu. The Forge had already grown its own one-off `from` param
to paper over the worst case, which is the tell that the pattern was wrong
rather than the screen.

`Router` keeps the trail now. `navigate` pushes the current route, `goBack`
pops, and `back.label` names the destination so a button can say "Back to the
gym" without the screen knowing which place that is. Two rules keep the stack
honest:
- **Arriving somewhere you can WALK AROUND clears it.** A place is a fresh
  context rather than a step deeper: what matters from inside the Forge is that
  you came from the gym, not everywhere you had been before that.
- **Returning to the screen you just left is a step BACK, not another step
  deeper.** Without that, the Forge -> mirror -> Forge round trip left the
  mirror on the stack and the Forge's own Back button returned to it.

Screens that genuinely end somewhere — blacking out in a challenge, sleeping,
Continue on the title — still name the hub, because those are not "back".

**A place remembers where you were standing** (`src/screens/placeMemory.js`).
The router unmounts a screen when you leave, so walking into a rack, writing a
session and coming back put you at the door, halfway across the room from the
thing you had just used. That was survivable while Back always went to Town;
the moment Back returned you to the right room it became the change being undone
on arrival. The gym remembers your square and facing, and the house remembers
which FLOOR you were on as well — opening your habits from the bedroom desk used
to drop you back downstairs.

Deliberately in memory rather than in the save: where you happened to be
standing is a fact about the last ten seconds, not about your training, and it
should not survive closing the app. Sleeping clears it too, since the day is
over and coming home should start at the front door.

## Phase 11 — DONE: Maple Lane, and the door nobody could see

The gym and the house had both been replanned; the lane between them had not.

**The front door of your own house was rendering as blank brick.** `add()`
prefers `traced_<name>.json` over the procedural drawing, and the traced art
for `tile_door` and `tile_wall` was **the wrong way round** — the file feeding
`tile_door` held plain brickwork, and the one feeding `tile_wall` held the door.
It went unnoticed because `tile_wall` (singular) is dead at runtime: `W`
resolves through `FIELD_CODES` to the wall FIELD, so the only thing that ever
drew the door art was nothing at all. Swapping the two files fixed both
buildings at once.

**Buildings have a form now.** A roof was ONE row of shingle, which has no apex,
so a building read as a coloured rectangle with a strip under it. Roofs are two
rows, the top one gets `prop_ridge` (capping tiles, sky on the top edge, the
shadow it throws down the pitch), and the wall below still gets its eave. Both
are applied from the building's own SHAPE — a roof with no roof above it, a wall
with a roof above it — so nothing has to be remembered and placed.

**The way out of town is a path, not a door.** `G` used to render a wooden gate
standing in the tree line — a door to nowhere, in the middle of a hedge. It
takes the path's own autotiling now, so the trail simply carries on north and
off the map, with the signpost beside it saying where it goes. `tile_gate` and
its traced art are deleted; they reach no map.

**The lane is a place.** 13x17, so it fills the phone: a lane north to the gate
with a signpost at it, your house and Quest Fitness facing each other across it
with doorstep paths onto a cross lane, lamps at the crossroads, a post box by
your door, and a green at the south end with a pond, a bench and a fenced
flower plot. Five new props — signpost, lamppost, park bench (NOT `prop_bench`,
which is the gym's flat bench), post box, and a picket fence that runs with
`RUN_PROPS` like the sofa.

**Outdoors uses bump-to-use too**, and a station may be a LABEL with no screen:
the signpost and the post box put their line in the objective ribbon and go
nowhere, because a signpost that opened a menu would be a menu. Every walking
screen now checks `station.screen` before navigating. The bench is a real
station — it logs Stillness, the same as the sofa indoors. The lane also
remembers where you were standing, like the other two places.

**`maps.js` asserts its own grids at import.** A bulk edit spliced the entire
gym out of the file between two anchors, and nothing noticed until the door to
it threw `undefined.spawn` at runtime. Every map's grid now has to match the
cols and rows it claims.

## Phase 12 — DONE: the cardio deck is a machine in the room, with a console

Cardio was a whole separate screen that took over the phone — and it was
rendered as the outdoor trail with its trees switched off, which is an odd way
to draw a thing you use standing on one spot.

**You step onto the machine and stay in the room.** `t` and `q` are no longer
destinations: they carry `{ cardio: 'treadmill' | 'rower' }`, and `GymScreen`
moves you onto the tile. Walking onto it IS the animation — the same 120ms tween
every other step in that room uses — so no bespoke mount was needed in the end.
The stick hides, movement is disabled (the button is how you get off, the way
the bar is on a real one), and the gym stays on screen above.

**The console** (`components/CardioConsole.js`) is modelled on the real thing:
a dark fascia, TIME and DISTANCE big across the top, then LAPS, PACE, KCAL and
STEPS in a row under hard little labels, with a READY/RUNNING lamp.
- **Laps** are quarter miles, the way a treadmill counts them.
- **Pace** is distance over time, and prints `--:--` rather than dividing by
  almost nothing before you have moved.
- **Kcal is the only estimated number on the console, and it says so.** Roughly
  0.53 kcal per pound per mile walking and 0.75 running, picked between by your
  measured pace — about 82 and 116 a mile at 155 lb. A number printed in the
  same style as three measurements reads as a fourth measurement unless you say
  otherwise, so the console says otherwise.
- That needed a body weight, which the app did not have. `settings.bodyWeightLb`
  is stored in pounds whatever the display unit is, set in Options, and read by
  nothing else.

**`useCardio` is the one path real distance takes into the game.** The trail and
the deck each had their own copy of "read the pedometer, dispatch the delta,
notice a milestone", and two copies of *that* is the last thing this game can
afford to let drift. Encounters stay with the trail — indoors there is nothing
to meet — so the hook hands back the delta and the caller decides.

`RouteScreen` is Route 1 and nothing else now; the `treadmill` route is gone
from the router. The runner's legs move on the trail either way: `playerSprite`
has always had walk frames per facing and the trail was drawing the standing
one, so a scrolling scene carried a motionless figure across it.

## Phase 13 — DONE: Rowan goes home, and the console counts what you did

**Rowan only stays for his scene.** He is mid-session with Coach when you first
walk in, and the push-up contest IS that scene — leaving him standing on the
mats forever afterwards turned the one staged moment in the room into
furniture. Winning the spar sets `meta.sparDone`, and `mapWithout(GYM, ['A'])`
takes him out. Coach stays; she keeps the place. `mapWithout` returns the SAME
object when there is nothing to remove, so the ordinary case allocates nothing.

**The trail runs the same console the deck does.** The measurement outdoors is
identical — real distance, real time — so there was no reason for Route 1 to
report it in a smaller, different vocabulary. `CardioConsole` takes a `title`
(the trail names itself) and `children` (the trail hangs its milestone and
trail-sign meters underneath), and the stop button is optional because outdoors
there is no getting off a trail.

**The stand-in step buttons are DEVELOPMENT ONLY.** `showInjector` is gated on
`__DEV__`. Buttons that add distance you did not walk are the exact thing this
game is built not to have — real life is the game, there are no walk buttons —
so they exist to test on a desktop and never reach anybody's phone or the
published web build. Note the consequence for testing: a release build cannot
be driven, so an end-to-end check of anything downstream of distance needs a
throwaway build with the gate lifted, and the gate put back afterwards.

**Exercises are counted.** A challenge move is a real set of a real exercise —
ten push-ups, a twenty-second plank — and it used to pay its damage and then
vanish, so nothing in the app could tell you how many push-ups you had ever
done. That is the one number a fitness game should not lose. `LOG_EXERCISE`
banks reps, held seconds and SETS into `stats` and into the daily history, and
tallies each exercise by id in `stats.exercises` (routines under a
`workout:` prefix, counting times done rather than repetitions of anything).

**The console breaks the session down.** "42 reps" is a number; "20 Push-ups ·
20s Plank · 15 Squats" is what you did. `breakdownSince` diffs the tally map
against the session baseline exactly the way distance and reps are diffed, so
the breakdown costs no extra bookkeeping while you play, and `formatBreakdown`
knows that a hold is seconds and a routine is a count. Readouts are three to a
row: five across a phone put four characters under a five-character label and
the band stopped being readable.

**A session survives a challenge**, which is what made the above worth doing. A
battle unmounts the trail and `useDistance` restarts from zero with it, so the
session baseline is taken from the LIFETIME stats (which persist) and parked in
`placeMemory` across the round trip. Walk a fifth of a mile, get stopped by a
Sludgewad, do ten push-ups, come back — the console still reads 0.20 mi, and
now reads the reps too. "Back to Sunkist Lane" is what ends the walk.

## Phase 14 — DONE: the audit, and making drift catchable everywhere

An audit of every file against the code, prompted by one question: are all 18
companions really in there? They are — 6 families of 3 stages, every one
traced, plus 4 procedural obstacles. But asking found a bug and a pile of
stale prose behind it.

**The Creature Index could never show a final evolution.** `buildOrder()`
followed `evolvesTo` exactly ONCE, so it listed 13 of the 22 — three starters
plus one evolution each, three base forms with none, four obstacles. Worse
than a short list, because `EVOLVE` stamps `dex[groveheart] = 'owned'`: the
save recorded a companion the page could never print. `familyChain()` and
`INDEX_ORDER` live in `creatures.js` now (order belongs to the roster, not to
the screen showing it) and the module **throws at import** if a creature
reaches no entry — the same guard `build_all()` uses on unused art and
`maps.js` uses on its grids.

**Four user-visible copy bugs.** The spar screen still said "MAPLE TRAINING
HALL"; the Coach told anyone with no plans to go to "Town -> Forge -> New
Plan", a menu entry deleted when the gym BECAME the menu; Route 1's exit said
"Back to Town" long after the town became Sunkist Lane. `PLACE_LABELS` moved to
`navContext` so a place has one name (Router imports every screen, so a screen
importing Router back would close a cycle).

**The Status screen now shows the exercise.** Reps, sets and held seconds were
banked by `LOG_EXERCISE` and only ever surfaced on the session console, which
resets when you go home — so "how many push-ups have I ever done" had no
answer. Four cells plus a full breakdown, running the console's own diff
against a zero baseline.

**Dead code, deleted.** `state/usePedometer.js` mattered most: superseded by
`useDistance`, and it carried `showInjector: available === false` with **no
`__DEV__` gate** — a live copy of exactly the rule this project forbids, one
import away from a release build. Also `screens/RestScreen.js` (never
registered), `data/index.js` (a barrel nothing imported), `SET_PLAYER_OUTFIT`,
and one of the two definitions of encounter gating — the tunable copy was the
unreachable one. `GAIN_BOND` has no caller either but STAYS: it is offered to
life modules as part of the progression contract above, so it is an interface,
not a leftover.

**`tools/check_docs.py` reads four files now, not one.** It only ever checked
GAME_BIBLE.md, so every figure in this file, README.md and ART_KIT.md was on
the honour system — which is where the stale ones had collected. 25 figures.
The worst of them: the sprite generator was **stamping a false claim about its
own output format on top of `sprites.js` every single build** ("base-36
indices" against a 90-character alphabet). A doc nobody re-reads goes stale
quietly; a doc a script rewrites goes stale loudly and still nobody notices.

**`tools/make_audio.py` is seeded.** The hit is a noise burst off an unseeded
`random`, so every run rewrote `hit.wav` with a file that sounded identical
and differed in every sample — meaning "run the generator and diff" could
prove the art was current but never the audio.

**The Dewbble gap is closed.** ART_KIT claimed all 18 companion masters;
only 17 were committed. The player attached the missing first-rendition
Dewbble plate (plus Sproutle and Emberkit) on a magenta field. Those
three are now isolated masters and the first-bond approval lineup.
`check_docs.py` still counts the masters.

### Phase 14b — the second pass: config, server, tooling

The first pass covered `src/` and the docs. Everything else turned out to have
its own drift, and two of them were in the coach proxy:

- **The server's jailbreak regex had drifted one character from the client's.**
  `guardrail.js` ends an alternative `act as\b`; the server's ended `act as`, so
  it refused "exact assessment" where the client did not. The refusal line had
  drifted too. Both copies exist for a real reason — the server is CommonJS and
  outside the Metro graph, so it cannot import from `src/` — but nothing noticed
  divergence. `check_docs.py` compares both pairs now and prints both sides.
- **`MAX_TOKENS` was 1024 with a model that thinks by default.** Thinking comes
  out of the same cap, so a long think returned no completed text, which the
  server handed back as its generic fallback with a 200 — the coach appearing to
  answer everything with one sentence, silently. Raised, and an empty reply now
  branches on `stop_reason`.
- **`python3 tools/make_sprites.py` failed on a clean machine.** Pillow was named
  in no manifest and no doc. `tools/requirements.txt`.
- **`expo-constants` was imported by `useDistance` and declared nowhere.** It
  resolved transitively via `expo` and `expo-asset`, so it worked — until one of
  them moved, at which point the step counter is what breaks. Declared, with the
  lockfile, because the Pages workflow runs `npm ci` and that refuses to install
  at all when the two disagree.
- **app.json** over-declared `HIGH_SAMPLING_RATE_SENSORS` (needed above 200 Hz;
  the app samples at 50) and had no `android.package` / `ios.bundleIdentifier`,
  without which the `eas build` STEP_COUNTING.md tells you to run fails in CI.
- **`convert_character.py`'s real arguments existed only in the committed JSON.**
  Its CLI defaults match none of the outputs. Now in the docstring, verified to
  reproduce `traced_walk_woman` exactly.

`check_docs.py` covers four docs and both sides of the coach guardrail: 25
figures plus 2 paired-source checks.

## Phase 15 — DONE: friends, boards, and the first reason to cheat

Accounts (Sign in with Apple/Google), per-day sync, friendships and four weekly
boards, on the proxy that already existed for the Coach. Full design in
**`docs/ACCOUNTS.md`**; the short version:

- **A leaderboard is the first thing here that gives anyone a REASON to fake
  their numbers.** `stats.distanceMi` has always been editable and it never
  mattered, because the only person you could fool was yourself. So the unit of
  sync is a **DAY, never a lifetime total** — a total can only be believed, a
  day can be checked — and `server/validate.js` refuses what is not possible
  (75 mi/day, steps and distance required to agree with each other, no future
  days, no rewriting a fortnight later). A flagged day is KEPT and left off the
  boards; the server does not get to edit someone's log.
- **Privacy is one function.** `friendIdsOf` is the only place that decides who
  can see you, and every board is built from it. Friendship is one row per pair
  with `CHECK (a_id < b_id)`, so it cannot be accepted one-way.
- **Accounts are optional and additive.** The game still works with no account,
  no server and no network. The session lives under its OWN AsyncStorage key —
  starting a new journey must not sign you out, and signing out must not delete
  your companion.
- **Three of the four boards reset Monday.** An all-time board ranks seniority;
  a week gives everyone the same empty column. Bests are the exception.
- The noticeboard hangs by reception (`G`). One cork `BoardScreen` (paper
  FieldCards, 44px TrailAction tabs, name + this week's amount; bests are
  one-set cards, not a ladder). Reception `N` is a local check-in desk. Friends "See the
  boards" opens the same screen. Friends stays off the six-item hub menu.

Two bugs found by driving it in a browser rather than reading it: `BarFill`
wants an `Animated.Value` and took the board white when handed a number, and
Google's auth hook THROWS when no client id is set for the platform — so the
button that needs it is now its own component, mounted only when configured.

**Not proven:** the Apple and Google handshakes themselves need real client ids
and a device. Everything downstream of the token is tested —
`npm --prefix server run test:friends`, 23 checks over HTTP.

## Phase 16 — DONE: gym cardio is recorded without becoming a trail

The stationary bikes remain only on the Quest Fitness floor. Starting one
measures a real Bike Ride with GPS, but the game character never
leaves the in-gym machine. Treadmills continue to use real phone movement.

The reducer now owns a single hard boundary for both (`distancePolicy.js`):
bike and treadmill miles may pay general companion distance XP and remain part
of lifetime fitness/load, but they cannot carry a trail id, fill a trail
quota, advance the trail milestone meter, roll an encounter, or mint Quest
Credits. The console and Maple's full-floor tour say the same thing.

Cycling data reaches every current cardio surface: daily history, lifetime
stats, Phone, Week, Coach context, a local noticeboard card, and a
fifth signed-in Bike board. The day-sync/database path now stores checked
`cyclingMi` and ride count, with an additive database migration. A bounded
120-row cardio-session log records machine, date, duration and mileage for the
Phone; the save migration preserves old totals but invents no old sessions.
The cardio fascia became a compact lower-left overlay instead of a status
panel that squeezed the room out of sight: the player stays visible on the
east-wall machine, real treadmill steps alternate the run frames, real Bike
Ride GPS deltas alternate the pedal frames, and the character idles when real
movement stops. A regression check locks the overlay, sensor-to-animation
wiring, and stopped states together.

## Phase 17 — DONE: reception means showing up

Reception no longer mirrors the player's fitness record. Walking into the desk
automatically records that local date and the first arrival time, once per day.
The desk shows only a check-in confirmation. Current and longest attendance
streaks, total check-in days and recent dated times live in Phone → Personal
Tracker with the player's workout data. Check-ins award nothing, and the
migration does not invent reception visits for older saves.

Maple's floor tour now carries explicit coverage metadata for every usable gym
code, including reception, Coach, Rowan and the exit. Each stop explains how to
activate the object and what opens/starts/saves rather than merely naming the
equipment. The coverage test fails on a missing interaction or a description
without an action and result. Player-facing cycling labels say **Bike Ride**;
GPS remains the measurement source without branding the activity "outdoor."

## Phase 18 — DONE: the Quest Ledger is free

The reception desk's Quest Ledger shipped for one release selling quests for
Quest Credits. That was wrong twice over: a wellness quest is a commitment,
not a purchase, and a paid quest whose reward mattered would be a credit
converter. Quests are now optional goals a player picks up free at the desk —
at most three at once, progress measured against a snapshot taken at
acceptance so only new effort counts, turned in at the same desk for the
category Token and a reward on the normal `{xp,bond,evo,heal}` contract.
Accepting, abandoning and turning in never move credits; Tokens are proof of
completion and are not currency. The v12 migration refunds priced-era
purchases at their exact historical prices exactly once, and `check_docs.py`
fails the build if a `price:` ever returns to `data/quests.js`.

## Phase 6 — ideas, not committed

Reading / chores / social check-in modules; per-movement progression charts off
the PR data; exporting history; letting the Coach propose a plan the Forge can
import.

