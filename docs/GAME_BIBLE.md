# Companion Quest — The Game Bible

> **Release gate: IP separation and title clearance.** This document is a
> design record, not legal clearance. Before commercial release, qualified
> counsel must clear the product title, source-identifier risk, copyright,
> trade dress, trademarks, and any applicable patents in launch territories.
> A separate game is already publicly using “Companion Quest”; keep the title
> provisional until a professional search is complete.

## 0. Originality and separation contract

Companion Quest may use ideas common to games—progress, teams, turns,
collecting, and exercise inputs—but may not use another franchise as its
creative specification. The selection, arrangement, wording, art, audio,
characters, screen composition, ceremonies, world fiction, and marketing must
be independently authored and recognizably ours.

- Never request or approve “the look, feel, soul, structure, fidelity, or
  equivalent” of a named game or company product.
- Maintain source files, dates, prompts, licenses, and contributor records for
  every shipped asset. “AI-generated” or “original-looking” is not provenance.
- Run similarity review on names, silhouettes, icons, encounter language,
  challenge composition, growth ceremonies, item shapes, audio motifs, and
  store imagery as a whole—not only one asset at a time.
- Keep the Trail / Circle / Bond / Resolve / Growth / Hearth / Journal design
  language consistent in code, UI, documentation, screenshots, and marketing.
- Do not market the game by comparison to Pokémon, Nintendo, a Nintendo
  handheld, or “the closest legal” version of any franchise.
- New location/sensor interaction and exercise-verification mechanics require
  a targeted patent review before commercialization. This is a review trigger,
  not a claim that any particular patent applies.
- Counsel sign-off and documented provenance are release gates; this audit
  reduces avoidable risk but cannot guarantee non-infringement.

### Onboarding canon

Coach Maple is an original trail mentor, not a laboratory professor or a
substitute for any franchise character. New players begin upstairs at home,
walk downstairs and outside, cross to the neighbouring gym, Quest Fitness, and
learn the systems from Maple, then create a companion the same way they
created their character: three first-rendition faces on one plate. The
ceremony still names the bond; it is no longer a surprise reveal.
Recovery is spatial too: the
player returns home, walks upstairs, and sleeps to restore Resolve.

The complete reference: every system, every screen, every number, every sprite.
Built by auditing the code, not from memory — where this document and the code
disagree, the code won and the document is the bug. Keep it that way: **change
a number in code, change it here in the same commit.**

CLAUDE.md is the working summary for a fresh session; this is the deep truth it
points into.

---

## 1. Vision and non-negotiables

A DS-era creature-companion RPG where **real fitness is the engine**. The
structure and feel of a classic handheld monster game, fully rebranded, where
the only way to progress is to actually move, lift, sleep, drink and rest in
the real world.

Hard rules, never traded away:

- **100% original IP.** Creatures, names, art, audio, type language — all
  invented here. No third-party names, sprites, music, movesets or trade dress.
- **Real life is the game.** No walk buttons. Distance comes from the pedometer,
  the accelerometer detector, or GPS. Battle damage is real exercise, confirmed
  on your honour. Rewards that could be minted by tapping are capped
  (see §5.3, §7.4).
- **DS-era presentation.** Dual-pane handheld layout, tile overworld, pixel font
  everywhere, typewriter dialogue, bordered/bevelled menus with a cursor,
  original chiptune and 8-bit SFX.
- **Advise, never block.** Recovery warns about overtraining; nothing ever
  refuses an adult a workout. Rest pays bond and healing, never XP.
- **Numbers shown are numbers paid.** Any reward printed on a button before it
  is granted must be exactly what the reducer grants (this killed goal
  multipliers on PR/habit XP — see §5.2).

## 2. Tech stack and repo map

Expo SDK 52 / React Native 0.76, runs in Expo Go, as a web SPA, and (pending)
as an EAS dev build. State is one reducer + AsyncStorage. There is no
navigation or state library. There are **no raster image assets**: pixel art is
stored as generated grid/palette data, including converted traced references
(§8.4). Audio is different: the 16 generated WAV files are committed under
`assets/sfx/` and loaded by the app.

```
src/
  theme/       colors (palette + shade()), typography (PressStart2P), metrics
  data/        creatures, goals, exercises(+learnset/tiers/breakdown), items,
               wild, obstacles, workouts(6), maps(4 places + zones),
               movements(140), muscles(14), recipes(74), shop, characters,
               outfits, route(pacing), routes(six trails / Wardens / Quest Pins),
               sprites.js + tileAtlas.js
               (BOTH GENERATED — never edit by hand)
  state/       GameContext (reducer, save), leveling, evolution, history,
               recovery, economy (Trail Credit), cardioMaths (console numbers),
               useDistance, stepDetector, storage
  screens/     Router + 29 screens (§4), plus useCardio (the one path real
               distance takes into the game) and placeMemory (where you were
               standing in each place)
  components/  30 building blocks (§9)
  modules/     the life-module plugin system + 5 modules + forge/ (§7)
  coach/       persona, guardrail, lines, context, local (offline brain), api
  audio/       sfx.js (expo-av wrapper, degrades silently)
server/        Express proxy for the LLM coach (optional; key stays here)
tools/         make_sprites.py (art engine), make_audio.py (SFX synth),
               traced_*.json (converted reference art)
               [sprite_preview.png is generated locally, not tracked]
assets/sfx/    21 WAVs, ALL synthesized by make_audio.py
assets/tiles/  tile-atlas.png + room-light.png (GENERATED by make_sprites.py)
docs/          ART_KIT.md, STEP_COUNTING.md, PHONE_TEST.md, this file
.github/workflows/web.yml   web export → GitHub Pages on every push to main
```

Dependencies (all pinned to SDK 52): expo-av, expo-camera, expo-font,
expo-gl + three (3D body map), expo-keep-awake, expo-location, expo-sensors,
async-storage, react-native-web + react-dom + @expo/metro-runtime (web),
@expo-google-fonts/press-start-2p.

### Build & verify

```bash
npm install
npx expo start                                   # Expo Go
EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir /tmp/cq   # bundle check
npx expo export --platform web --output-dir dist # web build
python3 -m pip install -r tools/requirements.txt # Pillow, the only Python dep
python3 tools/make_sprites.py                    # regenerate ALL art
python3 tools/make_audio.py                      # regenerate ALL audio
node --check server/index.js                     # server is outside Metro graph
python3 tools/check_docs.py                      # this file still agrees with the code
python3 tools/check_art.py                       # every master still produces its sprite
```

Web deploy: `web.output: "single"` (SPA — `static` needs expo-router and
fails), `experiments.baseUrl: "/companion-Quest"` (Pages subpath), workflow
touches `.nojekyll` (Jekyll strips `_expo/`). Live at
`https://zlipson1999.github.io/companion-Quest/`.

## 3. The player journey

Title → Intro → Outfit → the scripted walk through your house → Sunkist Lane
→ walk into Quest Fitness → walk up to Coach Maple (goal) → Pairing → walk
up to Rowan, who challenges with his companion → free roam.

**The room IS the menu, in all three places.** Sunkist Lane has walk-in triggers
(your front door, the gym door, the trail carrying on north) and a 6-entry menu;
the other eight destinations it used to list are things you now WALK to.
Quest Fitness: every piece of iron opens the Forge, Coach hands you a session
off the shelf, treadmill and rower are cardio in the room, the turf and the
mats each open the routine they are FOR, the mirror is form check, lockers are
your bag, reception is your record, the cork noticeboard (`G`) is this week
among friends, the whiteboard is your week, the bar spends credit. Your house:
the bed sleeps or logs last night, the desk is your habits,
the kitchen counters log a meal, the kitchen shelf is the cookbook, the sofa is
stillness, the wardrobe is your bag.

## 4. Screens (all 29, registered in `screens/Router.js`)

Router holds the `SCREENS` map, `navigate(name, params)`, `toBattle(params)`
(which plays the `BattleTransition` flash/wipe first), a `TOWN_BGM` set — every
non-battle screen plays the town loop (missing an entry here = battle music
keeps playing; this was a real bug once) — and a **back stack**.

**Back goes where you came from.** Every screen used to hardcode its exit and
say "Back to Town", so the Forge sent you to the hub whether you had walked in
from the gym or from your kitchen. `navigate` pushes, `goBack` pops, and
`back.label` names the destination so a screen never has to know which place it
is returning to. Two rules keep the stack honest: arriving somewhere you can
WALK AROUND (`PLACES`) clears it, because a place is a fresh context rather
than a step deeper; and returning to the screen you just left is a step BACK,
not another step deeper (without that the Forge → mirror → Forge round trip
left the mirror on the stack). Screens that genuinely END somewhere — blacking
out, sleeping, Continue on the title — still name the hub.

**A place remembers where you stood** (`screens/placeMemory.js`). The router
unmounts a screen when you leave, so walking into a rack and coming back put
you at the door. The gym, the lane and the house keep your square and facing —
and the house keeps which FLOOR you were on. Deliberately in memory, not in the
save: where you were standing is a fact about the last ten seconds. Sleeping
clears it.

| route | file | what it is |
|---|---|---|
| `title` | TitleScreen | logo, Continue / Begin Again (Begin Again RESET then `intro`, so outfit/character creation runs) |
| `intro` | IntroScreen | Coach's typewriter welcome |
| `goal` | GoalSelectScreen | companion creation — the first-rendition plate (Sproutle, Emberkit, Dewbble). Same type as character creation: three faces, pick one. The goal is that companion's temperament. |
| `pairing` | PairingScreen | first-bond ceremony + Coach lines |
| `outfit` | OutfitSelectScreen | character creation — the three-face player plate, then gym outfit |
| `homeIntro` | HomeIntroScreen | the scripted walk: bedroom → downstairs → Sunkist Lane (`HUB`, not a stub) |
| `hub` | HubScreen | Sunkist Lane (13×17). Walk-around town, bump-to-use, 6-entry menu — the other destinations are places you WALK to |
| `gym` | GymScreen | Quest Fitness (17×19). Equipment IS the menu; also runs the in-room cardio session (§5.7) |
| `sparIntro` | SparIntroScreen | safety redirect; live path is bumping Rowan, who sends Pebblepup |
| `cookbook` | CookbookScreen | the kitchen shelf: 74 recipes, 18 categories, search over names/blurbs/tags/ingredients |
| `smoothiebar` | SmoothieBarScreen | the gym's bar; spends Trail Credit (§5.6) |
| `route` | RouteScreen | six trails — §5.4 |
| `battle` | BattleScreen | §6 |
| `workout` | WorkoutScreen | 6 preset routines (data/workouts.js), pay ×`workoutXpMult`; a station can pin one via `params.workoutId` |
| `rest` | HomeRestScreen | your house (13×15 downstairs, 11×13 bedroom); the bed sleeps (`HEAL_FULL`) |
| `summary` | SummaryScreen | Status: companion, stats, daily habits block, recovery |
| `index` | IndexScreen | Creature Index: owned/seen/silhouetted-unknown |
| `bag` | BagScreen | items, use effects (heal/xp/bond) |
| `party` | PartyScreen | team of ≤6, swap active |
| `habits` / `habit` | HabitsScreen / HabitLogScreen | module hub + per-module log (§7) |
| `forge` / `forgeEdit` | ForgeScreen / ForgeEditScreen | plan list/detail/session runner; builder (§7.4) |
| `formcheck` | FormCheckScreen | front camera as a MIRROR + cue ticker; explicitly NOT pose analysis; session state rides through `params.resume` |
| `week` | WeekScreen | this week vs the same elapsed days last week, honest verdict sentence |
| `coach` | CoachChatScreen | chat; local data-driven answers first (§10) |
| `friends` | FriendsScreen | who can see your training: account, add-by-code, circle, what-is-shared, leave. Off the hub menu. |
| `board` | BoardScreen | cork noticeboard (gym `G`). This week among people you chose; FieldCards, no rank/race. Same screen Friends opens. |
| `options` | OptionsScreen | SFX/BGM toggles, lb/kg units, control mode, body weight (§5.7), erase save |

`CoachTutorialScreen.js` is kept as copy only. It is not in `SCREENS`. Reaching
it used to `navigate('goal')` and skip the lane; the first-run walking beat
belongs in the rooms.

## 4b. The three places (`data/maps.js`)

Every map is a grid of single-char codes plus, since the gym replan, a list of
**zones**. A zone is a REGION the map declares (`{ field, x0, y0, x1, y1 }`),
not a tile code: as codes a zone could only ever be the floor a tile WAS, so
the moment a rack went on a square the platform under it vanished. What stands
on a zone is a separate question — which is also how a floor plan is drawn.
`tile_zone_n/e/s/w` overlays draw the joint where one stops, because a
dead-straight value step four tiles long reads as a grid line even when neither
material does.

| place | size | zones | laid out as |
|---|---|---|---|
| Sunkist Lane (`HUB`) | 13×17 | — | a lane north to the trail, the two buildings facing each other across it, a green with a pond, bench and fenced plot |
| Quest Fitness (`GYM`) | 17×19 | platform, turf, mats | the ordinary commercial convention: perimeter for what backs onto a wall, centre for what does not |
| Downstairs (`DOWNSTAIRS`) | 13×15 | kitchen, rug | counter run on the north wall, dining on the vinyl, living room around the rug |
| Bedroom (`BEDROOM`) | 11×13 | rug | narrower, because a one-person bedroom as wide as a hall reads as a hall |

The gym: **racks along the north wall** on the lifting platform (a power rack is
bolted to a wall in every gym that owns one), **free weights down the west
wall** with the whole wall mirrored behind them, **cardio down the east wall**
in one unbroken line, **selectorised machines in the middle** in two rows with
an aisle, the **functional end at the south** — turf one side, matting the
other — and **front of house at the door**.

Buildings get their form from their own SHAPE rather than from extra codes: a
roof with no roof above it takes `prop_ridge`, a wall with a roof above it takes
`prop_eave`. Roofs are two rows deep; one row of shingle has no apex, so a
building read as a coloured rectangle with a strip under it.

**A station may be a LABEL with no screen.** The signpost and the post box put
their line in the objective ribbon and go nowhere — a signpost that opened a
menu would be a menu — so every walking screen checks `station.screen` before
navigating.

## 5. Core systems and their numbers

### 5.1 Leveling (`state/leveling.js`)

- XP is a lifetime total; level is derived. `xpToNext(level) = 40 + 20·level`.
- `maxHp = creature.baseHp + 8·(level − 1)`.
- Party member shape: `{ id, baseId, xp, bond, evo, hp }` — `id` changes on
  evolution, `baseId` never does (the Index tracks the line by it).

### 5.2 Goals (`data/goals.js`, `data/route.js`)

Three goals = the three reasons people open a fitness app, named for the game
world. The `goal` screen is companion creation: the three first-rendition
starters on one plate, same type as character creation. Picking Emberkit
is picking Forge Might. Old saves migrate ids in HYDRATE (`distance→lean`,
`strength→muscle`, `balance→root`).

| id | name | starter | milestoneMi | encounter roll | workoutXpMult | mileXpMult | trail |
|---|---|---|---|---|---|---|---|
| `muscle` | Forge Might | Emberkit | 0.30 | 0.12–0.24 mi | ×1.3 | ×1.0 | Forge Road |
| `lean` | Travel Light | Dewbble | 0.20 | 0.08–0.16 mi | ×1.0 | ×1.4 | Swiftwater Run |
| `root` | Take Root | Sproutle | 0.25 | 0.10–0.20 mi | ×1.1 | ×1.15 | Grove Walk |

Goal multipliers apply ONLY to mile XP and workout XP — never to PR or habit
rewards, because those numbers are printed on buttons before being granted.

### 5.3 XP & evolve points (`state/evolution.js`)

One table prices every kind of real effort:

| source | evolve pts | XP | notes |
|---|---|---|---|
| personal best | 5 | 20 | covers weight-PRs, rep-PRs and hold-PRs alike via `beatsRecord` |
| forge session | 3 | (plan-derived) | via MODULE_LOG |
| distance milestone | 2 | — | milestone bonus only |
| daily habit goal met | 2 | — | once/day/module |
| battle won | 1 | (target xp) | |
| walking | — | 25/mile × mileXpMult | fractional carry in `stats.xpCarry` so no step is floored to zero |
| rest day | 0 | **0 — by design** | bond + heal only |

Evolve points are **per companion** — earned by whoever is active.

**Evolution gate** = level AND points, checked after battle level-ups
(`canEvolve`): stage 1→2 at Lv 5 + 30 pts; stage 2→3 at Lv 14 + 110 pts.
Nineteen full lines — the original six (Sproutle→Bloomtail→Groveheart,
Emberkit→Pyrelynx→Cindermane, Dewbble→Tidewade→Maelstride,
Pebblepup→Cairnhound→Monolithound, Wispurr→Galegait→Skywhorl,
Sporelet→Mycobloom→Canopore) plus twelve trail families with the same
gates (Spinseed→Whirlkey→Samaraile, Bramblet→Briarthicket→Hedgeroot,
Lanternbud→Gleambud→Grovelamp, Rubblet→Cairnstack→Dolmenhold,
Chockit→Crackwedge→Cliffchock, Facetel→Prismore→Quartzspire,
Whistlet→Reedgale→Stormflute, Kitefin→Ribbonsail→Skysheet,
Loftburr→Driftpuff→Cloudburr, Fernap→Fiddlefrond→Frondrest,
Dapple→Glimmoth→Leaflight, Stillcup→Dewbasin→Rainhold) and the first
spec family (Dusthorn→Mesaquill→Suncerast). Creatures carry
explicit `stage: 1|2|3`. Only the stage-1 form is catchable; later stages
are grown, never knotted.

### 5.4 The Route & distance (`screens/RouteScreen.js`, `state/useDistance.js`)

- `STEPS_PER_MILE = 2000`. `ADD_DISTANCE` accrues miles, pays walking XP with
  the fractional carry, advances `routeMi`, and fires milestones
  (item from `PICKUP_POOL`: apple×2, water×2, energybar, charm, knot×2 —
  knots recur so befriending stays possible).
- Encounters roll every `encMin–encMax` miles (per goal) while on the Route.
- **`screens/useCardio.js` is the ONE path real distance takes into the game.**
  Read the pedometer, dispatch the delta, pulse `moving`, notice a milestone and
  pay out its pickup. The trail and the gym's cardio deck each used to own a
  copy of that, and two copies of "real movement counts" is the last thing this
  game can afford to let drift. Encounters stay with the trail — indoors there
  is nothing to meet — so the hook hands back the delta and the caller decides.
  **Gym cardio must not pass `routeId`.** Indoor miles still count as real
  walking (XP, credit, lifetime stats) but they do not fill a trail quota.
- **Six trails** (`src/data/routes.js`), save `version: 9`. Maple Trail is
  unlocked from the start. Walk that trail's miles and confirm its reps in
  challenges, then Challenge the Warden. First win grants the Quest Pin, a
  Kinship Knot, and the next trail. Wild companion pick is random from that
  trail's pool. Pools grow with the walk: 3, 6, 10, 15, 20, 24. Later pools
  keep earlier faces and add new ones. Pin-path mileage is 1.5+3+5+8+12+18
  = 47.5 miles.

  | Trail | Miles | Reps | Pool | Warden | Pin |
  |---|---|---|---|---|---|
  | Maple Trail | 1.5 | 30 | 3 | Sludgewad | Maple Pin |
  | Cairn Cut | 3 | 60 | 6 | Snoozeghoul | Stone Pin |
  | Gale Reach | 5 | 100 | 10 | Achefang | Gale Pin |
  | Canopy Run | 8 | 160 | 15 | Couchlurk | Canopy Pin |
  | Rill Crossing | 12 | 220 | 20 | Brinegnash | Tide Pin |
  | Ember Grade | 18 | 320 | 24 | Cindergrind | Ember Pin |

  Each trail is a different place: Maple trees and grass; Cairn packed earth
  (`tile_gym_platform`); Gale open sky; Canopy shade on `tile_gym_turf`;
  Rill water margins; Ember warm mats (`tile_gym_mats`). BattleStage tones
  match. The Index silhouettes locked-trail creatures. Status lists Quest
  Pins. Original terms only: trail, Warden, Quest Pin. `creatures.js` does
  not import `routes.js`.
- RouteScreen used to carry a second mode for the cardio deck, rendered as
  the outdoor trail with its trees switched off; the deck lives in the gym
  now (§5.7).
- The trail visual is a deterministic scrolling tile field (`trailRow` per
  trail); it scrolls only while distance is actually arriving.
- **Step sources, in priority order** (see docs/STEP_COUNTING.md):
  1. OS pedometer (`Pedometer.watchStepCount`) — counts with the screen off;
     needs Physical activity / Motion permission; NOT always reachable inside
     Expo Go (this failed on the first real phone).
  2. Accelerometer detector (`state/stepDetector.js`) — no permission,
     works in Expo Go, FOREGROUND ONLY. Peak detection on |a| minus a running
     mean: THRESHOLD 0.13 g, RELEASE 0.05, MIN_STEP_MS 240 (shake-proof),
     BASELINE_ALPHA 0.08. Started by SUBSCRIBING and counting samples, not by
     trusting `isAvailableAsync` (which lies in Expo Go). Requests 50 Hz;
     measures the DELIVERED rate and warns below 15 Hz (Nyquist floor for a
     ~90 ms footfall — at 10 Hz it measurably lost 40% of steps).
  3. Manual injector buttons — **DEVELOPMENT ONLY**, gated on `__DEV__` AND
     `source === 'none'`. Buttons that add distance you did not walk are the
     exact thing this game is built not to have, so they never reach a phone or
     the published web build. Consequence for testing: a release build cannot
     be driven, so an end-to-end check of anything downstream of distance needs
     a throwaway build with the gate lifted, and the gate put back after.
  The Route names which source is live; `pedDiag` prints host/OS/permission/
  error in the failure box.
- GPS runs: `watchPositionAsync` High accuracy, 5 m / 2 s; haversine per fix,
  deltas outside 1–80 m discarded as jitter/jumps; step-miles suppressed while
  running (no double count). Location is used for the delta and discarded.

### 5.6 Trail Credit (`state/economy.js`, `data/shop.js`)

The only currency, and there is no way to buy it. A shop needs something to
spend, and the moment a game has a shop it has a pressure to sell the currency;
this one is minted by REAL EFFORT and nothing else.

| source | credit |
|---|---|
| a walked mile (`CREDIT_PER_MILE`) | 10 |
| a completed session (`CREDIT_PER_SESSION`) | 8 |
| a challenge won (`CREDIT_PER_WIN`) | 6 |
| a habit goal hit (`CREDIT_PER_GOAL`) | 4 |

- Minted on the same fractional carry as walking XP (`stats.creditCarry`);
  rounding each thousandth-of-a-mile dispatch alone would floor every one of
  them to zero.
- No starting balance. Saves from before v7 migrate at **zero** rather than
  being back-paid for miles the app was not counting.
- Rest days pay bond and healing but never credit, for the same reason they
  never pay XP.
- Logging past a habit's daily goal pays nothing (`applyLog` only credits the
  portion inside the goal), so a log button is never a money button.
- An item bought and then drunk does not mint credit back (`logModule(...,
  { mintCredit: false })`) — a shop that can refund part of its own price is a
  thing to not have at all.

**The smoothie bar** (front of Quest Fitness). Prices are written in MILES and
converted through `CREDIT_PER_MILE`, so every price reads as "this much real
walking" and the whole board moves if the earn rate is retuned.

| shelf | item | price |
|---|---|---|
| The Board | Field Greens Blend | 1.2 mi = 12 |
| | Bramble Blend | 1.8 mi = 18 |
| | Sunrise Blend | 2.0 mi = 20 |
| On the Counter | Spring Water | 0.4 mi = 4 |
| | Crisp Apple | 0.5 mi = 5 |
| | Energy Bar | 1.0 mi = 10 |
| Behind the Till | **Kinship Knot** | 2.5 mi = 25 |
| | Bond Charm | 1.5 mi = 15 |

Rows you cannot afford are deliberately NOT disabled: a greyed row that will
not answer a tap tells you nothing, so each says how far short you are in miles.
The reducer looks the price up itself — a screen that could name its own price
is one bug away from a free shop.

**A smoothie is a two-part item.** The blend does something for your companion
and `logAs` records the drink as your own Nourish check-in, through the module's
normal path, so the daily cap applies and buying one can never pay more than
showing up would have.

### 5.7 The cardio console (`components/CardioConsole.js`, `state/cardioMaths.js`)

Cardio is a machine you stand ON, in the room, not a screen that takes over the
phone. Walking into the treadmill moves you onto the tile — the same 120 ms
tween every other step in that room uses, so no bespoke mount animation was
needed — the stick hides, movement is disabled (the button is how you get off,
the way the bar is on a real one), and the gym stays on screen above.

The trail runs the same console: the measurement outdoors is identical, so there
was no reason the trail should report it in a smaller vocabulary. It passes a
`title` (the trail names itself), `children` (its milestone and trail-sign
meters) and no `onStop`, because outdoors there is no getting off a trail.

| readout | source |
|---|---|
| TIME | a clock |
| DISTANCE | measured (pedometer / GPS) |
| LAPS | `miles / 0.25` — a lap is a quarter mile, the way a treadmill counts |
| PACE | distance over time; prints `--:--` below 0.02 mi or 5 s |
| KCAL | **the only ESTIMATE, and the console says so** |
| STEPS / SETS / REPS | measured / counted |

- `KCAL_PER_LB_MILE_WALK = 0.53`, `KCAL_PER_LB_MILE_RUN = 0.75`, chosen between
  by measured pace at `RUN_PACE_MIN_PER_MILE = 12`. About 82 and 116 kcal a
  mile at 155 lb; a 5K at 170 lb reads 395.
- That needs a body weight, which the app did not have.
  `settings.bodyWeightLb` is stored in POUNDS whatever the display unit is, set
  in Options, and read by nothing else.
- A number printed in the same style as three measurements reads as a fourth
  measurement unless you say otherwise, so the console says otherwise.
- Readouts are three to a row. Five across a phone put four characters under a
  five-character label and the band stopped being readable.

**A session survives a challenge.** A battle unmounts the trail and
`useDistance` restarts from zero with it, so the session baseline is taken from
the LIFETIME stats (which persist) and parked in `placeMemory` across the round
trip. "Back to Sunkist Lane" ends the walk.

**THIS SESSION** breaks it down: "20 Push-ups · 20s Plank · 15 Squats".
`stats.exercises` tallies per exercise id (routines under a `workout:` prefix,
counting times done rather than repetitions of anything), and `breakdownSince`
diffs that map against the session baseline exactly the way distance is diffed.

### 5.5 History & recovery (`state/history.js`, `state/recovery.js`)

- `history[dateKey]` day records, `KEEP_DAYS = 60`, written by one reducer
  helper (`remember`); numbers add, booleans OR.
- Training load: battle 2.5, mile 1.2, workout-XP × 0.06, forge session =
  `loadOf(analysis)`.
- Recovery: acute (7d) vs chronic (28d scaled to 7) ratio + consecutive
  training days. `HARD_STREAK_LIMIT 5`, `OVERREACH_RATIO 1.5`,
  `DETRAIN_RATIO 0.6`; ratio only trusted after `MIN_OBSERVED_DAYS 14` and
  `MIN_CHRONIC_LOAD 6` (a first session otherwise divides by ~0 and shouts
  "rest"). Streak counts over the chronic window and skips a still-blank
  today. `REST_DAY` action logs rest: bond + heal, never XP.
- WeekScreen compares equal elapsed day counts, never a partial week against a
  full one.

## 6. Battle

Encounter (~55% catchable companion / 45% obstacle, obstacle pool gated by
milestone count) → `toBattle` flash → BattleScreen.

- **Moves are real exercises** (`data/exercises.js`): 8 total. Damage
  `power + 2·(level−1)`. Wild counter: `4 + floor(targetHp/15) + rand(0..3)`.
- **Learnset**: pushups/squats/jacks/plank at Lv1, lunges Lv3, situps Lv5,
  highknees Lv7, burpees Lv10. Level-ups announce new moves in dialogue.
- **Tiers follow evolution stage** (evolving is the upgrade moment):
  Tier II = ×1.5 target, +8 power; Tier III = ×2 target, +18 power. A Tier III
  Burpee Blast is 16 real burpees for 46 power. The menu shows the 3 strongest
  unlocked rep moves + the best hold (kind variety survives). BattleScreen
  reads ONLY decorated moves (`battleMovesFor`) so tiers can't desync.
- **Befriending costs a Kinship Knot** — a braided cord with two loops, one
  offered and one kept. It replaced the "Bond Token", which was a sphere with an
  equator band and a button in the middle thrown at a weakened creature: somebody
  else's object wearing somebody else's mechanic, and a direct breach of §0. No
  amount of renaming fixes a silhouette.
  The MECHANIC changed with it. It used to be
  `catchRate·(0.4 + 0.6·(1−wildHpRatio))` — wear it down and take it. Now:
  `chance = clamp(catchRate·(0.25 + 0.45·shared + 0.30·standing) + min(0.15, bond/300), 0.05, 0.95)`
  where `shared = 1 − wildHp/maxWildHp` (how far through the shared challenge
  you are) and `standing = companionHp/maxHp` (**your own** remaining Resolve).
  That inverts the incentive on purpose: finishing strong earns the knot, and
  grinding something into the ground at any cost earns nothing.
  Full Circle (6) → CATCH is a no-op: the Knot is not spent, the fight stays
  open, nothing is stamped in the Index. Make room first.
- **Every confirmed move is recorded.** `LOG_EXERCISE` banks the set into
  `stats.sets`, its repetitions into `stats.reps` (or seconds into
  `stats.holdSec`), a per-exercise tally into `stats.exercises`, and a row into
  the daily history. A challenge move is a real set of a real exercise, and it
  used to pay its damage and then vanish — so nothing in the app could say how
  many push-ups you had ever done, which is the one number a fitness game must
  not lose.
- **Rowan challenges with his companion.** Walking up to him (`A`) starts a
  trainer battle against Pebblepup (`SPAR_PARAMS` in `SparIntroScreen.js`):
  `trainerBattle`, `catchRate: 0`, no Knot, no Index stamp. Winning sets
  `meta.sparDone`, and the gym then renders `mapWithout(GYM, ['A'])` — Rowan
  has finished his session and gone home. Coach stays; she keeps the place.
  The talk is bumping Coach (`C`) in the room, not `CoachTutorialScreen`.
- **Choreography** (timings in ms): attacker lunge 0 → victim flinch + white
  flash + damage pop 140 → counter lunge 650 → counter flinch/pop 790 → faint
  (KO) at 430 after its flinch. Entry: wild slides in from +90 px right,
  companion from −110 left, staggered 160. All timers cleared on unmount.
- **Stage**: real zoomed grass/path tiles (3× overworld scale) under the
  shared `HorizonSky` painter (`src/data/sceneSky.js` — zenith/sky/haze
  scanlines + a haze feather on the join, not a flat hex and a 4px line);
  horizon at 0.16 so BOTH combatants stand on ground. Platforms are
  stacked-rect discs with lit top / shaded underside. The trail and the
  stage share one tone table so they cannot drift.
- Defeat → `LOSE_BATTLE`, hub. Swap preserves per-member HP. Evolution beat:
  white strobe, sprite morph, EVOLVE action.

## 7. Life modules (the plugin system)

**Everything grows the companion through the same reducer path** — a module
never learns how progression works.

- `modules/daily.js`: pure calendar/reward engine. `todayKey()` is LOCAL date.
  Streak survives a roll only if the goal was met today or yesterday.
  `applyLog` credits ONLY the portion of a log inside the daily goal
  (no button is a free XP button); `replaces: true` modules (sleep) use a
  `paid` top-up ledger instead of pro-rating, plus `bonusPaid` so re-entering
  a night can't re-earn the goal bonus, and downward corrections roll back
  goal state without clawing back XP.
- `modules/index.js`: registry `MODULES = [HYDRATION, DIET, FORGE, SLEEP,
  MEDITATION]` + helpers. Interface: `{ id, name, tagline, blurb, sprite,
  spritePalette, color, unit, dailyGoal, actions | actions(modState),
  goalReward, initialState?(), screen?, replaces?, training?,
  progress?/summary?/cheer?(day) }`. `apply?` on an action can transform the
  day (sleep uses it to SET rather than add).
- Reducer: `MODULE_LOG` (reward + once-a-day goalReward via applyEffect),
  `MODULE_RESET_DAY` (self-heal roll), `MODULE_PATCH` (module-owned data).

| module | unit | daily goal | actions (amount → xp/bond[/heal]) | goal bonus |
|---|---|---|---|---|
| Hydration | glasses | 8 | glass 1→8/3 · bottle 3→22/7 · warm cup 1→8/4 | 50/18 |
| Nourish | check-ins | 5 | balanced 2→20/6 · produce 1→12/4 · mindful 1→10/6 · cooked 2→18/7 | 55/20 |
| Sleep (`replaces`) | hours | 8 | <6h 5→4/2 · 6-7 6.5→10/5/10 · 7-8 7.5→16/8/20 · 8+ 8.5→18/10/25 | 30/14 |
| Stillness | minutes | 10 | 2→4/3 · 5→10/6/8 · 10→20/12/15 · scan 15→26/14/20 | 28/12 |
| Forge (`training`) | sessions | 1 | actions = your saved plans; reward = analysed | 20/6 |

### 7.4 Workout Forge (`modules/forge/`)

- **Movements** (`data/movements.js`): 140 movements, 8 patterns (incl. carry),
  8 equipment kinds, each with muscles (primary/secondary), relative `load`
  1–3, 3–4 cues. **Movement ids are permanent** (saved plans store them).
  `searchMovements(q, {pattern, equipment})` matches names, muscle display
  names, and exact kit abbreviations (bb/db/kb).
- **Plans**: `{ id, name, note, blocks:[{ movementId, sets, amount, weight? }] }`,
  ≤ MAX_BLOCKS, stored in module state via MODULE_PATCH. Two seed plans ship.
- **Analysis** (`forge/analysis.js`) — deterministic, NOT an LLM: coverage,
  pattern balance, volume with `loadWeight = load^1.5` (hard short sets beat
  easy long ones), duration via SECONDS_PER_REP 3 + REST_BY_LOAD {15/30/45}s,
  intensity; explains every number. **Weight NEVER feeds analysis/XP** — it's
  unverifiable, so it drives records only.
- **Perks** (`forge/perks.js`): 9 — ironroot, sunforge, emberwind, stonegrip,
  stillwater, tidebalance, thunderstep, longtrail, fullbloom — each with a
  testable condition and plain-language reason, gated by PERK_MIN_SETS 4 /
  PERK_MIN_VOLUME 2 so token plans earn nothing.
- **Weight & PRs** (`forge/weight.js`): plan block = target; session runner
  edits reps/weight per block = transcript; what you DID is what logs
  (partial sessions log only ticked blocks — they used to mint PRs for skipped
  work). Records score by estimated 1RM (Epley-ish) for weighted sets, reps
  for bodyweight, gentler curve for holds; weighted always beats unweighted.
  20 XP + 5 evo per PR. lb/kg is a display label only.
- **History** (`forge/history.js`): per-plan sessions (KEEP_SESSIONS 120),
  per-movement records, per-plan volume bests, last-time-vs-now progression.
- **Body map**: `components/BodyMap3D.js` — procedural low-poly plates from
  muscle data via expo-gl+three; falls back to a 2D projection if GL fails.

## 8. Art — the whole pipeline

**No image files.** `tools/make_sprites.py` emits `src/data/sprites.js`
(grids of palette-index chars + `SPRITE_PALETTES`); `<PixelArt>` renders
run-length rows of Views; `<PixelSprite>` adds bob / hit shake+flash / lunge /
faint.

### 8.1 Encoding

- Index alphabet: **90 printable ASCII chars** (everything but `.` quotes and
  backslash). `.` alone is transparent — `'0'` is a REAL index (a legacy
  `'0'`-is-transparent check once punched holes in 12 sprites).
  `PixelArt.ALPHABET` must equal `make_sprites.DIGITS` exactly.
- Ramps: 26 steps, hue-shifted in HSV (shadows cool+saturated, highlights
  warm+desaturated — the single biggest anti-"mechanical fade" lever).
- Bands per canvas: creatures 14, tiles 5. Ordered 4×4 Bayer dither only in a
  0.30 zone around band edges, and ONLY on lit surfaces (dithering flat fills
  turns them into checkerboard — this once made grass read as a screen door).
- Light from upper-left `(-0.55, -0.68, 0.48)`; keylines are each ramp's dark
  mixed 62% toward ink, never pure black.

### 8.2 Procedural engines (in make_sprites.py)

1. Primitive: lit spheres/tubes — legacy, tiles/items/hero still use it.
2. `Body`: height-field of parts fused with a smooth max, normal from the
   COMBINED gradient — one surface, lit once; killed the "connected shapes"
   seams.
3. `Drawn`: a character-grid mask (drawn, blurred, distance-transform
   inflated) + creases pressed into the surface — hand-drawn silhouettes.
4. `backlight()` (rim opposite the key light) and `spec()` (hotspots) are what
   read as "modern".

### 8.3 Sprite inventory (148 runtime sprites + 416 atlas cells)

- Creatures 48×48 authored @2× = 96 px: **63 companions — 21 families of 3
  stages**. The first six families are TRACED (sproutle→bloomtail→groveheart,
  emberkit→pyrelynx→cindermane, dewbble→tidewade→maelstride,
  pebblepup→cairnhound→monolithound, wispurr→galegait→skywhorl,
  sporelet→mycobloom→canopore). Twelve trail families use the same evolve
  gates (stage 1 catchable → stage 2 at Lv 5 / 30 pts → stage 3 at Lv 14 /
  110 pts): spinseed→whirlkey→samaraile, bramblet→briarthicket→hedgeroot,
  lanternbud→gleambud→grovelamp, rubblet→cairnstack→dolmenhold,
  chockit→crackwedge→cliffchock, facetel→prismore→quartzspire,
  whistlet→reedgale→stormflute, kitefin→ribbonsail→skysheet,
  loftburr→driftpuff→cloudburr, fernap→fiddlefrond→frondrest,
  dapple→glimmoth→leaflight, stillcup→dewbasin→rainhold, plus
  dusthorn→mesaquill→suncerast (Red Mesa / Suncrack),
  brineling→shoregleam→tidecrown (Tideglass Coast / Saltglass Strand)
  and pinepuff→rimecone→frostbough (Frostpine Reach / Needle-Snow Pass)
  — plus 6 obstacles
  (sludgewad, snoozeghoul, achefang, couchlurk, brinegnash, cindergrind).
  All thirty-six trail forms plus the Dusthorn, Brineling, and Pinepuff
  lines are traced from isolated masters (approved lineups, then one
  creature per file). The two new Wardens remain
  procedural. An evolution is its OWN master and a new silhouette —
  baby / adolescent / adult, never a tinted, scaled, or outlined copy
  of the base. `check_art.py` fails a family whose stages are too
  similar. Several committed trail evos currently fail that gate;
  the art is wrong, not the check.
  The first three families are the ones offered at first bond
  (each goal names its own via `GOALS[].companionId`; `STARTER_IDS` is a
  convenience list the running game does not read); all six are met on the
  trail (`WILD_COMPANION_IDS`), always
  as their base form. `INDEX_ORDER` in `creatures.js` is the roster order the
  Creature Index reads, built by walking each family whole with
  `familyChain()`, and the module **throws at import** if any creature reaches
  no Index entry. That guard exists because the Index used to build the order
  itself and followed `evolvesTo` exactly once: it listed 13 of the 22 and not
  one final evolution among them, while `EVOLVE` was stamping
  `dex[groveheart] = 'owned'` for a row the page could never print.
- Hero: the sprites actually rendered are the traced per-character sets at
  26×48 (Coach Maple 30×48), 4 facings × 3 frames, resolved by
  `playerSprite()` in `data/characters.js`. `hero_*` at 24×32 is the fallback
  used only when no character cards are present.
- Items/module icons 24×24: apple, water, energybar, charm, **knot**, three
  smoothie blends (green/berry/gold, one drawing and three palettes), droplet,
  plate, check (fallback), barbell, moon, still.
- **Tiles and props do not live in `sprites.js` any more.** They are packed
  into `assets/tiles/tile-atlas.png` with a frame table in `data/tileAtlas.js`
  (416 cells) and drawn by `TileImage`, which crops the atlas. `PixelArt` emits
  a View per colour run per row — 236 Views for one grass tile, ~28,000 for a
  map — and that was the ceiling that made higher resolution impossible. The
  live page is ~1,350 nodes at 4× the art resolution. `TILE_SCALE = 2`, so a
  16×16 authored tile is 32 px. Going higher is now a file-size question.
- Ground is a FIELD, not a tile: grass, path, water, canopy, walls, roofs, both
  indoor floors, the rug, the kitchen vinyl, the gym's rubber/wood/turf/matting
  are 64×64 textures windowed across a 4×4 tile block by world position, so
  they run continuously and repeat four tiles apart.
- Interiors are lit by `light_pool()`, baked into the material's own ramp. A
  field is exactly one fixture cell across, so the pools land on the fixture
  grid for free. Drawn as its own dithered layer first, it read as television
  static over the rubber.
- Multi-tile furniture autotiles (`RUN_PROPS`): a two-tile sofa was two sofas
  with four arms. `_l`/`_m`/`_r` are picked from a prop's own neighbours, the
  same way a path picks its edge.

### 8.4 The traced kit (docs/ART_KIT.md)

HQ concept (the locked prompt in `tools/CHARACTER_PROMPT.md`) → isolated
ship master → `convert_reference.py` → `tools/traced_<id>.json` →
`make_sprites.py` (traced wins). Approval lineups live in
`tools/reference_art/lineups/` and are for looking at: Maple/Cairn sit on
a flat field and split with `tools/split_lineup.py`; Gale/Canopy are
scenic plates and must be re-generated isolated, not split. The converter
keys a light checkerboard if the PNG is fully opaque, downsamples to 96²,
quantises to a compact palette. `load_traced()` beats the generated sprite
of the same name in `build_all`. Palette gotcha: tiny features (Dewbble's
pink mouth) need a hand-added palette entry or they quantise away.
**Every new creature goes through this kit.** A missing trail master
fails the build. Each family is baby / adolescent / adult — three
different creatures, not a tinted copy. `check_art.py` fails a family
whose stages are too similar. The `sphere()` + `eye()` recipe is how
the first trail pass came out as twelve interchangeable blobs and is
not used again.

## 9. UI components (30)

`src/components/index.js` exports 30. HorizonSky is its own painter so the
stage and the walk cannot drift; GrowthCeremony is the evolution hold, not a
flash. Both count.

Window (bevelled + corner studs + paper highlight), Menu (selection FILL +
cursor + sfx), DialogueBox (typewriter, blip every 2 chars, bobbing advance
arrow, tap-to-complete), PixelText (PressStart2P, sizes tiny→hero), PixelArt /
PixelSprite, BarFill (tube-shaded meters; border thins ≤8 px) → HPBar /
ProgressBar / StatusPlate (name/Lv/HP + EXP strip on YOUR plate only),
BattleStage + Platform + HorizonSky (shared zenith/haze painter; sceneSky.js),
BattleTransition (flash/wipe), TileMap (+exported
Tile; fractional cells — rounding once clipped ¼ of every tile), DualPane,
Dpad, Screen, Triangle (the font has no arrow glyphs — never rely on unicode
arrows/hearts).

Added since: **WorldScreen** (the one walk-around frame — contained map, HUD
band, hamburger menu; `worldTileFor` sizes the map so the WHOLE place is
visible), **TileImage** (atlas crop), **CompanionStatus** (the companion's
condition, on every walkable screen rather than only the one that remembered to
draw it), **CardioConsole** (§5.7), **Joystick** / **MoveControl** (thumb stick
by default; crossing a map one deliberate tap per square was the most tiring
thing about the overworld), **FieldCard** / **TrailAction** / **ObjectiveRibbon**
(the Trailkeeper primitives), **BodyMap3D**, **GrowthCeremony** (evolution
held at `motion.ceremony`, with a reduced-motion text path — not a strobe).

## 10. Coach

1. **Local brain** (`coach/local.js`) — answers factual questions from the
   save (rest/PRs/what-to-train/progress/water/sleep/food/streaks/plans/
   weight-to-add/steps). Runs FIRST even when a server exists: the save knows
   your bench PR, an LLM would guess. Says "no data" when there's no data.
2. **Pre-send guardrail** (`coach/guardrail.js`) — domain keyword allowlist,
   greeting/short-message pass, jailbreak regex → in-character refusals.
3. **Server proxy** (`server/`, optional) — Express + @anthropic-ai/sdk,
   default model `claude-opus-5` (COACH_MODEL to override), key in env, 1024
   max tokens. Domain-locked jailbreak-resistant system prompt; the player's
   activity brief (`coach/context.js`, incl. `neglectedMuscles` over 14 days)
   is fenced as DATA, capped at 2000 chars, `<` stripped. Client reads
   `EXPO_PUBLIC_COACH_API_URL`; unset = local-only, and the UI says answers
   come from your log (never shows an env-var error to players).

## 11. Audio

`tools/make_audio.py` synthesizes all 21 WAVs (square/triangle/noise, ~8-bit
idiom): blip, cursor, confirm, cancel, encounter, hit, lowhp, victory,
levelup, evolve, item, heal, milestone, catch, noticeboard, board_tab,
board_update, friend_request, friend_accept + bgm_town / bgm_battle loops.
`audio/sfx.js` wraps expo-av; every call degrades silently (web autoplay,
early calls). BGM switching lives in Router via TOWN_BGM.

## 12. Save format — `companionquest:save:v1` key, `version: 9`

```js
{ version: 9, started, goalId,                    // 'muscle'|'lean'|'root'
  playerOutfit, playerGender,                     // one-time, v6
  party: [{ id, baseId, xp, bond, evo, hp }],     // ≤6
  activeIndex,
  credits,                                        // Trail Credit, v7
  stats: { totalSteps, distanceMi, routeMi, xpCarry, creditCarry,
           milestonesReached, battlesWon, battlesLost, caught, workoutsDone,
           itemsCollected, habitLogs, habitGoalsHit, daysActive, streak,
           sets, reps, holdSec,                   // real exercise done
           exercises: { [exerciseId|'workout:<id>']: amount } },
  bag: { itemId: count }, dex: { creatureId: 'owned'|'seen' },
  modules: { [id]: { date, count, entries, goalHit, streak, bestStreak,
                     lastGoalDate, goalDays, totalCount, totalLogs,
                     paid?, goalCredit?, bonusPaid?,        // replaces-modules
                     plans?, log?, records?, bests? } },    // forge-owned
  history: { 'YYYY-MM-DD': { xp, bond, distanceMi, battles, workouts,
             sessions, habitLogs, goalsMet, restDays→rested, load } },
  settings: { muted, bgmMuted, units, control, bodyWeightLb },
                                                  // units 'lb'|'kg' (a LABEL
                                                  // for the Forge); control
                                                  // 'stick'|'dpad';
                                                  // bodyWeightLb always POUNDS
  meta: { createdAt, lastPlayedDate, sparDone },
  trails: { activeId, progress: { [routeId]: { miles, reps, pin } } } }  // v9
```

Migrations, all in HYDRATE — and every one of them refuses to invent history:

| to | what changes |
|---|---|
| v1→2 | single `companion` → `party` |
| v2→3 | zeroed module buckets for every registered module; UTC day-keys → local |
| v3→4 | `history` starts recording from the upgrade; there is no honest way to reconstruct days nobody logged |
| v4→5 | `evo: 0` on members — starting at zero is the honest choice, since the app was not recording the work that would have earned them |
| v5→6 | `playerOutfit` / `playerGender`; null defaults keep older saves in setup |
| v6→7 | `credits: 0` — NOT back-paid for miles the app was not minting on |
| v7→8 | `bag.token` → `bag.knot`, carried across rather than voided: somebody's count is somebody's earned work |
| v8→9 | `trails` — Maple Trail at zero miles/reps, no pins. Older miles are not back-credited: they were not trail-tagged, and gym miles must never fill a trail quota |

Plus, every load: goal ids translated, `rollAllModules` day roll, and a
`MODULE_RESET_DAY` self-heal from the Habits screens so a session left open past
midnight starts the new day clean.

`maps.js` also asserts its own grids at import — every map's grid must match the
cols and rows it claims. Added after a bulk edit spliced an entire map out of
the file between two anchors and nothing noticed until a door threw at runtime.

## 13. Developer handoff: decisions, questions and missing specifications

The sections above describe what the current code does. They do **not** by
themselves define a shippable product. A developer taking over the project
would still need the questions below answered. Never infer an answer from an
empty field or from a platform happening to work in Expo Go.

Status labels:

- **CURRENT** — observable in the repository now.
- **DECIDED** — a product rule that implementation must preserve.
- **OPEN** — the owner must choose; this document must be updated when they do.
- **GATE** — must be proven before the affected release can be called ready.

### 13.1 Product and release contract

| developer question | status / present answer |
|---|---|
| Who is the intended player and minimum age? | **OPEN.** The copy speaks to adults, but no age floor, child-safety position or account policy is defined. |
| What is the primary product: Android app, iOS app or web demo? | **OPEN.** Web deploys automatically; Android/iOS are configured but no native production build has been accepted. Sensor-dependent claims must not be based on web. |
| What exactly is the MVP? | **OPEN.** The repository contains a broad playable vertical slice, but there is no signed-off feature boundary or release acceptance checklist. |
| What devices and OS versions are supported? | **OPEN.** Portrait is forced and tablets are allowed; minimum Android/iOS versions, screen sizes, low-end device floor and tablet UX are unspecified. |
| Is the game free, paid, ad-supported or subscription-based? | **OPEN.** No monetization or entitlement code exists. |
| Is an account required? Is there cloud sync or multi-device play? | **CURRENT: no.** One local save, no auth, no cloud backup, no export/import. Whether this is permanent is **OPEN**. |
| What is the content target at launch? | **OPEN.** Current roster is 63 companion forms across 21 families plus 6 obstacles; roadmap expansion is aspiration, not a launch commitment. |
| What is the expected play cadence and session length? | **OPEN.** Daily modules and route pacing imply daily play, but retention, encounter-rate and time-to-evolution targets are not specified or validated. |
| Are notifications/reminders part of the product? | **CURRENT: no.** Desired reminders, quiet hours, consent and notification copy are **OPEN**. |
| What does “done” mean for a feature? | **DECIDED below in §13.7.** Code that merely renders in web is not sufficient for sensor, persistence, camera, GL or audio work. |

Until those choices are made, describe the project as a **development build
with a public web demo**, not as a production fitness app.

### 13.2 Platform, lifecycle and failure behavior

| developer question | status / present answer |
|---|---|
| Must steps count while the screen is locked and the app is backgrounded? | **DECIDED by the vision: yes for the production mobile experience. GATE:** prove it in an EAS build on physical Android and iOS devices. The accelerometer fallback is foreground-only and is not a release substitute. |
| What happens after permission denial? | **CURRENT:** GPS returns an inline error; pedometer diagnostics expose status; camera behavior is screen-owned. **OPEN:** retry/settings affordance and standardized denial copy. |
| What happens if a GPS run is interrupted, the app backgrounds or the OS kills it? | **OPEN.** No resume/reconciliation contract or partial-run record is specified. |
| What happens if the app closes during a battle or Forge session? | **OPEN.** Navigation/session state is in memory; only reducer state persists. Define checkpoint, abandon or resume behavior. |
| What happens when storage is full or a save is corrupt? | **CURRENT:** storage errors are swallowed; corrupt JSON loads as no save. **GATE:** preserve the bad payload for diagnosis, show recovery choices and never silently look like a new game. |
| Can time-zone or device-clock changes mint rewards or break streaks? | **PARTIAL.** Local date keys and migrations exist. Clock rollback, large timezone jumps and deliberate clock changes need tests and an explicit policy. |
| Does core play work offline? | **CURRENT: mostly yes.** Game systems and factual coach answers are local; live coach replies require the proxy. **OPEN:** offline status UI and reconnect/retry behavior. |
| What is the battery/data budget? | **OPEN.** Accelerometer requests 50 Hz and GPS high accuracy. No measured drain, thermal or network budget exists. |
| What are acceptable load time, frame rate and memory targets? | **OPEN.** Define budgets for low-end mobile, 3D fallback, large saves and generated sprite rendering. |

### 13.3 Data, privacy, safety and service operations

The app handles activity, workouts, sleep, diet, hydration, location during
runs, camera access for a local mirror, and optional coach messages. Even
without accounts, that is sensitive wellness data.

| developer question | status / present answer |
|---|---|
| What leaves the device? | **CURRENT:** GPS coordinates are used transiently and not saved; camera frames are not recorded or uploaded; the configured coach proxy receives chat history plus a capped activity brief. |
| Where is data stored and for how long? | **CURRENT:** one AsyncStorage JSON blob; history keeps 60 days; Forge keeps 120 sessions. **OPEN:** coach-server logs/retention and hosting-provider retention. |
| How does a player delete or export data? | **CURRENT:** Options can erase the local save. **MISSING:** export, backup, server-side deletion path, privacy notice and confirmation of what erase does not delete. |
| Is analytics or crash reporting collected? | **CURRENT: none.** If added, define events, consent, retention, redaction and a “never collect raw wellness/chat/location data” rule first. |
| What fitness and medical safety language is required? | **OPEN.** The coach refers injuries out and recovery only advises, but onboarding has no documented readiness warning, emergency disclaimer or age-specific policy. |
| Is exercise completion verified? | **DECIDED:** honour system; Form Check is a mirror, not pose analysis. **OPEN:** abuse/anti-cheat expectations for leaderboards or monetized rewards if either is ever added. |
| How is the coach service protected? | **MISSING:** production deployment, authentication/app attestation, rate limits, request-size limits, abuse controls, cost ceiling, observability, incident response and model deprecation policy. |
| What is the AI fallback contract? | **CURRENT:** local factual brain runs first; remote failure returns friendly copy. **OPEN:** whether generative chat is launch-critical and which responses must remain fully local. |
| Can external/generated art be shipped commercially? | **OPEN/GATE:** keep source and rights/provenance records for every reference image. “Original-looking” is not a licensing record. |

Before any public native release, add a plain-language privacy policy that
matches the code and app-store privacy disclosures. A developer must not add
telemetry, uploads or new permissions without updating this section.

### 13.4 Accessibility and presentation requirements

The DS-era look is a style goal, not permission to exclude players.

**Missing acceptance criteria:**

- Screen-reader labels, reading order and focus behavior for every actionable
  control.
- Minimum touch targets and non-D-pad alternatives for all navigation.
- Contrast checks for text, status bars and silhouettes; never encode state by
  color alone.
- A readable-text option: the pixel font at tiny sizes is not an accessibility
  strategy.
- Reduced-motion behavior for bobbing, wipes, screen shake, flashes and the
  evolution strobe. Photosensitive users need a non-flashing path.
- Captions/text equivalents for audio cues and independent SFX/BGM control
  (the two mute toggles already exist).
- Dynamic layout checks for small phones, tall phones, tablets and browser
  zoom. Portrait-only is current policy, not proof that every portrait viewport
  works.
- Localization policy. All copy is currently English and many layouts assume
  short strings.

**GATE:** keyboard/web, touch/mobile and screen-reader smoke passes must join
the release checklist before “accessible” appears in product copy.

### 13.5 Engineering quality, CI and observability

**CURRENT:** `package.json` has start scripts only. There is no test runner,
lint script, type checker, unit/integration/E2E suite, coverage target or PR
build. The only GitHub Action exports and deploys web after a push to `main`.
Storage and audio intentionally swallow errors, so field failures can be
invisible.

A production handoff needs:

1. A required CI workflow that runs a clean install, static checks, tests,
   Android export and web export before merge. Deployment must depend on those
   checks rather than being the first place a broken build is discovered.
2. Unit tests for leveling, evolution, rewards, daily rollover, streaks,
   recovery, catch probability, Forge analysis/records and every save
   migration. These are deterministic and should be the first test layer.
3. Reducer integration tests proving displayed rewards equal granted rewards,
   caps cannot be replayed, active-companion attribution is correct and old
   saves hydrate without data loss.
4. Device tests for permissions, pedometer/accelerometer priority, background
   counting, GPS double-count prevention, camera, audio interruption, GL
   fallback, app kill/resume and low-storage failures.
5. A deterministic content validator: permanent IDs unique, references resolve,
   every creature has a sprite/palette, every movement has valid muscles, every
   route/item/module key exists and generated outputs are up to date.
6. Error reporting that distinguishes expected capability fallback from actual
   failure. Never include chat text, coordinates, exercise transcripts or
   wellness values in logs by default.
7. A supported Node/npm/Python toolchain file and reproducible generator
   dependencies. “It ran on one machine” is not an asset pipeline contract.

### 13.6 Balance and content-authoring questions

The formulas are documented, but the intended player experience is not yet
measured. Before large content expansion, define and simulate:

- Time/effort to first encounter, first catch, level 5 evolution and level 14
  evolution for each goal and for low/median/high-activity players.
- Expected Kinship Knot income (milestone pickups + the bar at 25 credit)
  versus befriending attempts, including full-party behaviour.
- Whether the Trail Credit rates in §5.6 are right: 10/mile is the anchor and
  everything else is priced against it, but nobody has played a week on them.
- Battle length and exercise volume by level, fitness ability and move type;
  accessible substitutions for players who cannot perform a prescribed move.
- Recovery warning frequency and whether battle/workout load values map to
  plausible real sessions.
- Daily reward ceilings across walking, presets, Forge, PRs and habits, plus
  clock-change/replay abuse cases.
- Content authoring rules: permanent IDs, migration requirements for renamed or
  removed content, text limits, palette/sprite validation and rights metadata.
- A save-safe deprecation policy. Once an ID ships in a save, deleting or
  reusing it without a migration is forbidden.

### 13.7 Definition of done

A change is done only when all applicable items are true:

1. Behavior, visible reward numbers and this bible agree in the same commit.
2. Deterministic logic has tests; a bug fix includes a regression test when the
   test harness can express it.
3. Save-shape or permanent-ID changes include a versioned migration tested from
   every supported prior version.
4. Sensor/camera/audio/GL/lifecycle changes are verified on an affected physical
   device, not only web or a simulator.
5. Generated assets are regenerated from their source; generated files are
   never hand-edited and the validator passes.
6. Permission, offline, denial, timeout and recovery states have player-facing
   behavior.
7. Accessibility is checked for changed controls and motion.
8. The handoff states what was tested, on which platform/device, and any
   remaining risk. No silent “works on my machine” release.

## 14. Known gaps & debt (the honest list)

### Release blockers / decisions

1. **No agreed product/release contract** — audience, primary platform, MVP
   boundary, supported devices, business model and launch content are open
   (§13.1).
2. **No automated quality gate** — no tests, lint/typecheck, PR CI, content
   validation or migration suite (§13.5).
3. **Background step counting is unproven in a standalone app** — accelerometer
   fallback works only in the foreground. EAS physical-device proof is a gate.
4. **Save failure shows a red banner** (`saveError` on GameProvider / Router).
   Corrupt-save recovery, backup/export and cloud remain open.
5. **Accessibility is unspecified** — especially tiny pixel text, focus/labels,
   touch targets and reduced-motion alternatives for flashes/strobes.
6. **Privacy/safety/service operations are undocumented** — no privacy policy,
   coach retention/deletion contract, production rate limits or release safety
   language.
7. **Lifecycle behavior is undefined** for interrupted GPS runs, battles and
   Forge sessions.
8. **No performance/battery/device budgets or compatibility matrix.**

### Product/content debt

9. **The six obstacle creatures remain procedural.** All thirty-six
   trail forms are designed reference art. The original 18 companion
   forms (18 masters, including Dewbble) and 14 world materials
   also derive from authored art.
10. `state/usePedometer.js` is gone (deleted in Phase 14).
11. Evolution ceremony is a strobe + swap; it needs both a stronger scene and a
    reduced-motion alternative.
12. No per-movement progression charts despite weight-aware PR data.
13. Train (presets) vs Forge (builder) naming still confuses (user-reported).
14. (closed) `dusk` battle tone deleted — no caller, no trail used it.
15. Scratchpad walkthrough artifact drifts from the app (preview-only).
16. The Coach proxy is undeployed; generative chat is unavailable in production.
17. Full Circle (6) is a CATCH no-op: Knot stays, fight stays, Index unchanged.
18. Balance targets and simulations in §13.6 do not exist.
19. Art-reference provenance is not tracked as release metadata.

## 15. Roadmap (risk-first recommendation; owner approval pending)

1. Lock §13.1: audience, primary platform, MVP boundary, supported devices and
   launch content. Turn the answers into a release checklist.
2. Add deterministic tests, save-migration fixtures, content validation and
   required CI before expanding systems.
3. Produce EAS development builds and prove permissions, pocket/background step
   counting, GPS non-duplication, kill/resume and save survival on physical
   Android and iOS devices (PHONE_TEST.md).
4. Define corrupt-save recovery, interruption behavior and the local-only versus
   cloud-sync decision.
5. Complete accessibility, privacy/safety and performance gates; deploy and
   harden the Coach only if generative chat is in the MVP.
6. Run balance simulations and a small real-player test; tune time-to-encounter,
   catch economy, exercise volume and evolution pacing.
7. Trace the wild/obstacle creatures; add a reduced-motion evolution ceremony.
8. Add progression charts from PR/weight history.
9. Expand past 19 companion families only after the content validator,
   rights/provenance record and balance targets exist.
10. Then consider per-exercise battle animation, a richer obstacle roster and
    town growth.

---
*Audited against the current codebase. Sections marked OPEN are deliberately
unresolved; update them when the owner decides rather than letting code make the
decision accidentally.*

