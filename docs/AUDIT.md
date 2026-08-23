# Companion Quest — full-repo audit

Date: 2026-08-23. Against `main` at `40d8477` (trail companions + Sunkist Lane).
Statuses updated after #30 and #33 landed on `main`.

Status column: **fixed** (on `main` or this PR), **recommend** (still open),
**noted** (intentional / already documented).

Severity: **blocker** (wrong or unreachable content a player hits),
**high** (broken loop or provenance hole), **medium** (play / docs / tooling),
**low** (comments, leftovers, polish).

---

## Findings index

| id | severity | status | one line |
|---|---|---|---|
| A1 | medium | **fixed** | `coachTutorial` unregistered; file kept (would skip the lane) |
| A2 | high | **fixed** | Bedroom stairs work on the rest screen |
| A3 | high | **fixed** | Front door inside the house leaves |
| A4 | n/a | noted | `GAIN_BOND` has no dispatcher (interface, keep) |
| A5 | medium | **fixed** | v1 save fixture through `hydrateSave` |
| A6 | low | **fixed** | unused `dusk` tone deleted |
| A7 | low | noted | `expo-crypto` / `expo-asset` kept — Pages `npm ci` / auth-session |
| A8 | n/a | noted | `expo-font` used via the Press Start package, not a direct import |
| A9 | medium | **fixed** (#30) | import-time 3-stage family guard |
| A10 | medium | **fixed** | sourceless companions fail `check_art.py` (Dewbble stays reported) |
| A11 | high | recommend | Dewbble still has no master — do not re-render a PNG |
| A12 | medium | recommend | Original six families have no approval lineup |
| A13 | medium | **fixed** (#30) | Root `package.json` has `npm test` |
| A14 | n/a | noted | `check_docs.py` still compares both coach guardrail copies |
| A15 | n/a | noted | Companion count is `CREATURES` minus obstacles = 54 |
| A16 | medium | done-on-branch #31 | Trailkeeper UI migration is unfinished |
| A17 | medium | done-on-branch #31 | `PixelButton` ignores `scale.touchMin` |
| A18 | medium | done-on-branch #32 | First-run never says "walking is the input" as a dedicated beat |
| A19 | medium | done-on-branch #32 | Published web trail is a dead end with no on-scene copy |
| A20 | low | done-on-branch #32 | "Maple Lane" leftover comments |
| A21 | medium | **fixed** + #33 | a11y labels on empty first-morning / party states |
| A22 | low–medium | **fixed** + #32/#33 | empty states on crash-or-blank screens; web trail is #32 |
| A23 | high | **fixed** (#30) | `CLAUDE.md` slimmed; history is `docs/HISTORY.md` |
| A24 | high | **fixed** (#30) | Working-memory file no longer describes `sphere()`/`eye()` as the path |
| A25 | high | **fixed** | `family_chains()` expands spreads so Dewbble is reported |
| A26 | medium | **fixed** (#33) | Options Erase calls `forgetAll()` |
| A27 | blocker | **fixed** (#33) | `BagScreen` empty-state before a companion |
| A28 | blocker | **fixed** (#33) | `HomeRestScreen` empty-state before a companion |
| A29 | blocker | **fixed** (#33) | `SummaryScreen` empty-state before a companion |
| A30 | high | **fixed** (#33) | Forge / Workout finish no longer assume a companion |
| A31 | low | noted | HomeIntro downstairs stairs are a no-op (one-way first walk) |
| A32 | medium | **fixed** (copy only) | Grown-form meetings named; pool composition unchanged |
| A33 | low | noted | GAME_BIBLE §14.17 lists designed Full Circle behavior as debt |
| A34 | n/a | noted | `check_docs.py` does not watch this file |

---

## 1. Correctness

### 1.1 Screen reachability

Every file in `src/screens/*Screen.js` is registered in `Router.js` `SCREENS`
except `LoadingScreen`, which is the pre-hydrate / pre-font shell
(`Router.js:148-149`, `App.js:21-22`). That is correct. `SCREENS` is 29
after A1 (was 30 including the unused `coachTutorial`). `check_docs.py`
watches the count.

| route | way in | status |
|---|---|---|
| `title` | hydrate start (`Router.js:104`) | ok |
| `intro` | Title "Enter the World" / erase (`TitleScreen.js:53,63`) | ok |
| `outfit` | Intro when no character (`IntroScreen.js:36`) | ok |
| `homeIntro` | Outfit confirm, or Intro if character already set (`OutfitSelectScreen.js:27`, `IntroScreen.js:36`) | ok |
| `goal` | Coach Maple before a companion (`GymScreen.js:139`) | ok |
| `pairing` | Goal confirm (`GoalSelectScreen.js:31`) | ok |
| `hub` | HomeIntro front door, Title Continue, gym/house exits | ok |
| `gym` | Hub door `d` / menu (`maps.js:325-326`, `HubScreen.js:21`) | ok |
| `sparIntro` | Rowan tile `A` (`maps.js:278`). Live path is `toBattle` from GymScreen | ok |
| `cookbook` | Kitchen shelf `o` (`maps.js:163`) | ok |
| `smoothiebar` | Bar `J`/`I` (`maps.js:265-266`) | ok |
| `route` | North gate `G` / menus (`maps.js:327-328`) | ok |
| `battle` | `toBattle` from Route / Gym spar / SparIntro | ok |
| `workout` | Turf `S`, mats `Q`, gym menu (`maps.js:282-283`) | ok |
| `rest` | House door `D` / hub menu (`maps.js:323-324`) | ok |
| `summary` | Reception `N` (`maps.js:261`) | ok |
| `index` | Bedroom shelf `o` (`maps.js:193`) | ok |
| `bag` | Wardrobe `P`, lockers `L` (`maps.js:195,257`) | ok |
| `party` | Hub/gym menus (`HubScreen.js:23`, `GymScreen.js:35`) | ok |
| `habits` / `habit` | Desk, water, sofa, bench, kitchen stations | ok |
| `forge` / `forgeEdit` / `formcheck` | Iron / mirrors (`maps.js:247-272`) | ok |
| `week` | House screens, gym whiteboard (`maps.js:165,194,256`) | ok |
| `coach` | Coach Maple after a companion | ok |
| `board` | Noticeboard `r` (`maps.js:262`) | ok |
| `friends` | Board → Friends (`BoardScreen.js:99,196`) | ok |
| `options` | Hub/gym menus | ok |
| `coachTutorial` | **Nothing navigates here** | see A1 |

`GAME_BIBLE.md:194` already calls `coachTutorial` an unused leftover. The file
is still imported, in `SCREENS`, and in `TOWN_BGM` (`Router.js:18,51,83`).
If it were reached, `CoachTutorialScreen.js:25` would `navigate('goal')` and
skip the lane.

**A1 — `coachTutorial` registered, no way in.**
Unregistered from `SCREENS` and `TOWN_BGM`. The file stays: A18 on #32 owns
the first-run walking beat, and reaching this lecture called `navigate('goal')`
and skipped the lane. Severity: **medium**. Status: **fixed**.

### 1.2 Map codes

Every character that appears in `HUB`, `GYM`, `DOWNSTAIRS`, `BEDROOM` grids
resolves to at least one of: `FIELD_CODES` / `TILE_SPRITES` / `PROP_SPRITES`
(`TileMap.js:23-112`), `INTERACTIONS` or a per-map `interactions` table
(`maps.js:239-286,41-47,157-196`), `triggerForCode` (`maps.js:321-333`), or a
drawn person (`C`/`A` in `TileMap.js:459-464`). Import-time grid-size asserts
(`maps.js:205-215`) and the trigger/interaction shadow check
(`maps.js:348-355`) still hold. `G` is a trigger only; the noticeboard is `r`.

Walkable-but-meaningless tiles found:

**A2 — House stairs are one-way on the rest screen.**
`HomeRestScreen.js` (this PR). Downstairs `s` at `(11,1)` goes up. Bedroom `s`
at `(9,11)` is walkable (`BLOCKED` does not include `s`, `maps.js:217-227`)
and, on `main`, did nothing. HomeIntro uses `exit` coords for both directions
(`HomeIntroScreen.js:17-28`). Severity: **high**. Status: **fixed** (this PR).

**A3 — Front door inside the house does not leave.**
`D` is walkable. Hub walking onto `D` triggers `rest` (`maps.js:323-324`).
`HomeRestScreen` never calls `triggerForCode`, so standing on the downstairs
door (`DOWNSTAIRS` last row, `x=6,y=14`) did nothing. The only exit was
sleeping. Severity: **high**. Status: **fixed** (this PR). Walking out places
you on the doorstep (`HomeIntroScreen.js:33` / `LANE_FROM_HOUSE`).

**A31 — HomeIntro downstairs stairs are a no-op.**
`HomeIntroScreen.js:22-28,95`. Downstairs `exit` is the front door `(6,14)`.
The stairs tile `(11,1)` is walkable and does nothing during the scripted
first walk. You spawn at `(11,2)`, so you can step onto them. This is the
one-way first walk, not the rest-screen bug (A2). Severity: **low**.
Status: **noted** (intentional for the opening).

Codes that are props with no screen (labels or scenery only) are intentional:
hub `i`/`%` (`maps.js:45-46`), gym `V`/`O` (banner/clock), house
`p`/`l`/`g`/`x`/`m` (plant, lamp, nightstand, coffee table, chair).
Cardio `t`/`q` stay in-room (`maps.js:254-255`).

### 1.3 First-run null companion (written before any fix)

First walk is Title → Intro → Outfit → HomeIntro → Lane → gym → Coach → goal
→ pairing. Until pairing, `useCompanion()` is `null`. `CompanionStatus` and
`HabitLogScreen` already guard that. Several screens the player can open
*before* pairing do not.

**A27 — `BagScreen` crashes if opened before a companion.**
`src/screens/BagScreen.js:44` reads `companion.creature.sprite` with no guard.
The bedroom wardrobe is `P` → `bag` (`maps.js:195`). HomeIntro walks the
bedroom *before* the gym talk, so bumping the wardrobe on the first morning
throws. Gym lockers (`maps.js:257`) are the same crash after you reach the
floor but before pairing. Severity: **blocker**. Status: ****fixed** (#33)**.

**A28 — `HomeRestScreen` crashes if opened before a companion.**
`src/screens/HomeRestScreen.js:56-58` builds sleep lines from
`companion.creature.name` at render. Hub menu item "Go Home"
(`HubScreen.js:22`) is available the moment you step onto the lane.
Severity: **blocker**. Status: ****fixed** (#33)**.

**A29 — `SummaryScreen` crashes if opened before a companion.**
`src/screens/SummaryScreen.js:37` calls
`evolveProgress(companion, companion.creature, companion.level)` at render.
Gym reception `N` (`maps.js:261`) is reachable before pairing.
Severity: **blocker**. Status: ****fixed** (#33)**.

**A30 — Forge / Workout finish paths assume a companion.**
`ForgeScreen.js:229,241-244,272` and `WorkoutScreen.js:37-53,62` dereference
`companion` when a session is logged. Gym menu "Shelf sessions" and every
iron station are reachable before pairing. The list UIs render; finishing
throws. `WorkoutScreen.js:122` already has a ternary for the empty-state
blurb, then the complete path does not. Severity: **high**.
Status: ****fixed** (#33)**.

`PartyScreen` is safe (empty list). `RouteScreen.js:373` guards the sprite.
`IndexScreen` and `WeekScreen` do not need a companion. GymScreen already
sends Coach to `goal` and ignores Rowan when `!companion` (`GymScreen.js:127-139`).

These were written down and **not fixed in this PR**. Scope is the audit.

### 1.4 Reducer actions vs dispatchers

| action | callers | note |
|---|---|---|
| `HYDRATE` | `GameContext.js:614` | load |
| `RESET` | Title, Options | ok |
| `START_GAME` | GoalSelect | ok |
| `SET_PLAYER_CHARACTER` | OutfitSelect | ok |
| `ADD_DISTANCE` | `useCardio.js:40` | ok |
| `COLLECT_ITEM` | `useCardio.js:59` | ok |
| `USE_ITEM` | Bag | ok |
| `BUY_ITEM` | SmoothieBar | ok |
| `CONSUME_ITEM` | Battle (knot) | ok |
| `GAIN_XP` | Battle catch leftover XP | ok |
| `GAIN_BOND` | **none** | **intentional** — see below |
| `SET_HP` | Battle | ok |
| `SWAP_ACTIVE` | Battle, Party | ok |
| `WIN_BATTLE` / `LOSE_BATTLE` / `CATCH` | Battle | ok |
| `SET_TRAIL` | Route | ok |
| `SEE_CREATURE` | Route | ok |
| `MODULE_LOG` / `MODULE_PATCH` / `MODULE_RESET_DAY` | Habits, HabitLog, Cookbook, Forge, Smoothie (via `logModule`) | ok |
| `REST_DAY` | Habits | ok |
| `LOG_EXERCISE` | Battle | ok |
| `COMPLETE_WORKOUT` | WorkoutScreen | ok |
| `RECORD_PR` | Forge | ok |
| `EVOLVE` | Battle, Forge | ok |
| `HEAL_FULL` | HomeRest sleep | ok |
| `SET_SETTING` | Options | ok |

**A4 — `GAIN_BOND` has no dispatcher.**
`GameContext.js:399-403`. Bond is applied through `applyEffect` from modules,
battles, workouts, items. The case stays because life modules are offered
`{xp,bond,heal}` on the shared contract (`CLAUDE.md` / `modules/index.js:23-28`).
Severity: **n/a**. Status: **noted** (do not delete).

`SET_PLAYER_OUTFIT` is gone. `usePedometer.js` is gone. Both already recorded
in `GAME_BIBLE.md:987`.

Full Circle (party length ≥ 6): `BattleScreen.js:308-310` returns before
`CONSUME_ITEM`; `CATCH` at `GameContext.js:446-450` is a no-op. Knot stays,
fight stays, Index unchanged. That is the designed behavior
(`GAME_BIBLE.md:510`). See A33.

### 1.5 Save migrations (current `SAVE_VERSION = 9`)

Source of truth: `GameContext.js:44,53-101,202-269`. Bible: `GAME_BIBLE.md:743`.

Conceptual v1 load through `HYDRATE`:

1. Spread `FRESH` then the save (`GameContext.js:204-215`) — new keys
   (`credits`, `history`, `modules`, `trails`, `settings.bodyWeightLb`,
   `settings.control`, `meta.sparDone`, `stats.exercises`, `stats.xpCarry` /
   `creditCarry`) take FRESH defaults when absent.
2. `goalId` through `migrateGoalId`.
3. v1 `companion` becomes a one-member `party`; `evo` defaults to `0`
   (`GameContext.js:217-225`).
4. v3: `rollAllModules` zeros every registered module; local-date streak skip
   on a 1-day gap (`GameContext.js:230-267`).
5. v4: `history` starts empty (`trim(saved.history || {})`).
6. v6: null outfit/gender keep the player in setup.
7. v7: `credits` start at 0; no back-pay.
8. v8: `bag.token` folds into `bag.knot`.
9. v9: `normalizeTrails(saved.trails)` — Maple Trail starts at zero, not
   back-credited.

Nothing at the top level is left `undefined` after this merge. Party members
from a v1 `companion` may lack `baseId`; runtime reads `m.id` / `getCreature`.
`hp` missing is treated as max in `applyEffect` (`GameContext.js:144`).

**A5 — No save-migration fixture test.**
`src/state/hydrate.js` is the HYDRATE body. `tools/test_hydrate.mjs` walks a
v1 blob (single `companion`, Bond Token, no credits) and asserts required keys,
party/evo, knot fold, zero credits, empty history. Does not invent days.
Severity: **medium**. Status: **fixed**.

**A26 — Options Erase does not `forgetAll()`.**
`OptionsScreen.js:120` is `wipeSave(); RESET; navigate('title')`.
`TitleScreen.js:53` Begin Again is `wipeSave(); forgetAll(); RESET; intro`.
`placeMemory.js:34-38` exists so a new walk does not inherit last session's
square. Options erase leaves `gym`, `hub`, `route:session`, and house spots
in the process Map. OutfitSelect clears only the `intro:*` keys
(`OutfitSelectScreen.js:24-26`). After Erase → Enter the World, the first
gym visit can drop you on last journey's square.
Severity: **medium**. Status: ****fixed** (#33)**.

### 1.6 Dead files / dead registrations

No shipped `src/` file is unimported. `data/index.js`, `screens/RestScreen.js`,
`state/usePedometer.js` are already gone.

**A6 — `BattleStage` `dusk` tone unused.**
Deleted. No trail `stageTone` named it; bible §14 item 14 marked closed.
Severity: **low**. Status: **fixed**.

**A7 — `expo-crypto` / `expo-asset` not imported by app code.**
Declared in `package.json:17,22`. `expo-asset` is a Metro/Expo transitive;
`expo-crypto` is required by `expo-auth-session`. Severity: **low**.
Status: **noted** (keep declared; Pages `npm ci` needs the lockfile).

**A8 — `expo-font` is used via `@expo-google-fonts/press-start-2p` in
`App.js:7`, not a direct import.** Severity: **n/a**. Status: **noted**.

---

## 2. Data integrity

### 2.1 Companions, obstacles, Index, art

| claim | code | docs |
|---|---|---|
| Companion forms | 54 (`CREATURES` minus 6 obstacles) | `GAME_BIBLE.md:627` **54 companions** |
| Families | 18 × 3 (`STARTER_IDS` 3 + wild 3 + `TRAIL_COMPANION_IDS` 12) | 18 families |
| Obstacles | 6 (`OBSTACLE_IDS`, `creatures.js:393-395`) | plus 6 obstacles |
| `INDEX_ORDER` | `WILD_COMPANION_IDS.flatMap(familyChain)` + obstacles (`creatures.js:428-431`) | lists every id; import throws if not (`creatures.js:436-439`) |
| `evolvesTo` | every non-final companion points at a real id; finals `null` | ok |
| Sprite keys | each `sprite:` exists in generated `sprites.js` | `make_sprites.py` prefers `traced_<id>.json` |
| Palettes | 28 unique keys, all in `SPRITE_PALETTES` | ok |
| Catchable roots | 18 (`catchable: true` only on family roots) | evos and obstacles are false |

Every current family is 3 stages. **`creatures.js` does not assert that.**
A two-stage family would still pass `INDEX_ORDER` if both ids are listed.

**A9 — No import-time "family is 3 stages or absent" guard.**
`creatures.js:415-439`. Severity: **medium**. Status: **recommend**.

**A10 — `check_art.py` reports sourceless companions but exits 0.**
Sourceless now exits 1. Dewbble is still named; the gap is not papered over
with a re-rendered PNG. The master-reproduces-shipped-art check stays.
Severity: **medium**. Status: **fixed**.

**A25 — `check_art.py` `family_chains()` does not expand spreads.**
`family_chains()` now expands `...STARTER_IDS` and `...TRAIL_COMPANION_IDS`,
so Dewbble (and every other starter / trail root) is in the sourceless walk.
Severity: **high**. Status: **fixed**.

### 2.2 Dewbble / starter masters

`tools/reference_art/dewbble.png` **does not exist**. `traced_dewbble.json`
does. `docs/ART_KIT.md:9-14` already states this.

Eight starter-line masters exist but are tiny PNGs (1.1–2.0 KB): `sproutle`,
`emberkit`, `bloomtail`, `groveheart`, `pyrelynx`, `cindermane`, `tidewade`,
`maelstride`. They are real isolated sprites (Sproutle reads as the designed
teardrop, not a sphere+eyes blob). They are not the painted lineup plates the
trail families have.

**A11 — Dewbble still has no master.**
Severity: **high** (provenance non-negotiable). Status: **recommend**
(do not re-render a PNG out of the indexed JSON to close the count).

**A12 — Original six families have no approval lineup in
`tools/reference_art/lineups/`.**
Only `maple` / `cairn` / `gale` / `canopy` trail plates.
Severity: **medium**. Status: **recommend**.

Obstacles remain procedural (`GAME_BIBLE.md:983-986`). No
`traced_sludgewad.json` etc.

### 2.3 Movements / recipes / cuisines / shop

| claim | code | match |
|---|---|---|
| 140 movements | `src/data/movements.js` — 140 `{ id:` entries | `GAME_BIBLE.md:566` |
| 8 patterns | `PATTERNS` (`movements.js:30-39`) | ok |
| 8 equipment | `EQUIPMENT` (`movements.js:17-26`) | ok |
| 74 recipes | 74 `R(` in `recipes.js` | `GAME_BIBLE.md:198` |
| 18 categories | `CATEGORIES` (`recipes.js:754`) | ok |
| 15 cuisines | `CUISINES` (`recipes.js:777`) | CLAUDE / kitchen copy |
| Shop lines | 8 `itemId`s, all exist in `ITEMS` | ok |
| `logAs` | recipes assert against Nourish actions at import | ok |

Movement ids are permanent (`movements.js:14-15`). This audit does not rename any.

### 2.4 Trails

Six routes in `src/data/routes.js`. Import asserts pool sizes
(`maple: 3, cairn: 6, gale: 10, canopy: 15, rill: 20, ember: 24`) and that
every Warden / companion id exists. Gym cardio must not pass `routeId`
(`routes.js:6-8`); `GymScreen` `useCardio` does not.

**A32 — Later-trail pools pad with uncatchable evo stages.**
`RILL_MEET` adds `tidewade` and `bloomtail`; `EMBER_MEET` adds `pyrelynx`,
`cairnhound`, `galegait`, `mycobloom` (`routes.js:21-22`). Those forms are
`catchable: false`. `rollWildEncounter` (`wild.js:50-57`) then returns
`isCompanion: false` / `catchRate: 0` — a 55% "companion" roll that is
actually a fight. `WILD_COMPANIONS` has stats for them, so HP is not the
fallback. Pool sizes stay (changing them would change encounter rates).
Trail + battle copy now names a grown form via `isGrownForm`.
Severity: **medium**. Status: **fixed** (copy only).

### 2.5 Maps vs bible sizes

`HUB` 13×17, `GYM` 17×19, `DOWNSTAIRS` 13×15, `BEDROOM` 11×13.
`check_docs.py` watches these.

---

## 3. Build and test surface

**A13 — Root `package.json` has no `test` script.**
`package.json:5-9` is start / android / ios / web only. Server has
`test:auth` and `test:friends` (`server/package.json:10-12`).
Severity: **medium**. Status: **recommend**. A later root `test` should run
the Python checkers + server tests + `node --check`. This audit does not
add that script.

**A14 — `check_docs.py` still compares both coach guardrail copies.**
`tools/check_docs.py:130-161`. Status: **noted** (keep).

**A15 — `check_docs.py` counts companions as `CREATURES` keys minus
`OBSTACLE_IDS`.** That is 54. The bible regex is `\*\*(\d+) companions`
(`check_docs.py:85`). Status: **noted**.

**A34 — `check_docs.py` does not watch this file.**
Intentional. AUDIT.md is a findings log, not a figure table.
Status: **noted**.

Runtime deps used by `src/` + `App.js` are all in `package.json`: expo-*,
async-storage, react, react-dom, react-native, react-native-web, three,
press-start-2p. `expo-constants` is declared (`package.json:21`) and
imported (`useDistance.js:8`).

`__DEV__` injector remains gated (`useDistance.js:277`). This audit does
not lift it.

Coach jailbreak regex and refusal line match client ↔ server
(`check_docs.py` paired-source checks, 2026-08-23 run: ok).

---

## 4. UI system (inventory only)

`tokens.js` + `FieldCard` / `TrailAction` / `ObjectiveRibbon` exist.
`TrailAction` honours `scale.touchMin` (44) (`TrailAction.js:52,77`).
`PixelButton` does not (`PixelButton.js:29-40`: paddingVertical 10, no minHeight).

| already Trailkeeper | mixed | still Window / PixelButton |
|---|---|---|
| Board, Friends; WorldScreen rooms (Hub, Gym, HomeIntro, HomeRest) | Cookbook, SmoothieBar, Route | Title, Intro, Outfit, Goal, Pairing, SparIntro, Battle, Workout, Summary, Index, Bag, Party, Habits, HabitLog, Forge, ForgeEdit, FormCheck, Week, Coach, Options, CoachTutorial, Loading |

**A16 — Trailkeeper migration is unfinished.**
Severity: **medium**. Status: **recommend**. Not this PR.

**A17 — `PixelButton` ignores `scale.touchMin`.**
`PixelButton.js:29-40` vs `tokens.js:65-70`. Forge `+/-` uses `size="tiny"`
and `paddingVertical: 4-5` (`ForgeScreen.js:57`, `ForgeEditScreen.js:30`).
Severity: **medium**. Status: **recommend**. Not this PR.

---

## 5. Play quality (inventory only)

**A18 — First-run never says "walking is the input" as a dedicated beat.**
Title → Intro → Outfit → HomeIntro → Lane. CoachTutorial's first line
(`CoachTutorialScreen.js:9`) is the clearest statement and is unreachable (A1).
Lane objective after a companion is "Head out through the north gate…"
(`HubScreen.js:73-75`) which is better than nothing.
Severity: **medium**. Status: **recommend**.

**A19 — Published web trail is a dead end with no on-scene copy.**
`useDistance` `source` is `none` in a release web build; `showInjector` is
false (`useDistance.js:277`). The "No step counter" panel lives behind the
menu (`RouteScreen.js:305-323`) and in `__DEV__` only when the injector
shows. Release web still offers "Start Run (GPS)" (`RouteScreen.js:412-418`),
which will fail or no-op in a browser. Severity: **medium**.
Status: **recommend**. Say so on the trail; do **not** lift the injector.

**A20 — "Maple Lane" leftover comments.**
`ObjectiveRibbon.js:4`, `CompanionStatus.js:3`. User-facing copy is
"Sunkist Lane" (`navContext.js:8-9`, `HubScreen.js:82`, `TRIGGER_LABELS`
`maps.js:361`). Severity: **low**. Status: **recommend** (comment cleanup
only; CLAUDE Phase 11 title is history).

**A21 — Accessibility is sparse.**
`TrailAction`, `ObjectiveRibbon`, stick, D-pad, menu button, and a few
sprites have roles/labels. Most `PixelButton` rows do not. Pixel font has
no unicode arrows/hearts (already a project rule). Severity: **medium**.
Status: **recommend**.

**A22 — Empty / offline states.**
Friends/Board already handle "no server" (`FriendsScreen.js:144`). Cookbook
search-empty exists. Forge with no plans exists. Trail with 0.00 mi does
not explain web. Severity: **low–medium**. Status: **recommend**.

Naming now: **Quest Fitness** (building), **the gym** (room),
**Sunkist Lane** (town), **the trails** / named trail (Route).
`PLACE_LABELS` matches.

---

## 6. Instruction / agent docs (inventory only)

**A23 — `CLAUDE.md` is 956 lines.**
It is a changelog wearing a manual's name. Severity: **high** (agents follow
the changelog). Status: **recommend**. A later pass may split a short stub
from `docs/HISTORY.md`. **Not this PR.**

**A24 — Character-creation instructions still describe procedural
`sphere()`/`eye()` in the working-memory file.**
`CLAUDE.md` "Original assets are GENERATED" still tells an agent to compose
shaded forms. The live quality bar is `tools/CHARACTER_PROMPT.md` and
`docs/ART_KIT.md` (traced from designed plates; `sphere()` is not this type).
Severity: **high**. Status: **recommend**. Another agent owns companion-
creation skill / `CHARACTER_PROMPT.md`. **This audit does not edit those
files.**

**A33 — GAME_BIBLE §14.17 lists designed Full Circle behavior as debt.**
`GAME_BIBLE.md:995` item 17 is the same sentence as the designed rule at
`:510`. Severity: **low**. Status: **noted** (move it out of "gaps" when
someone next edits the bible; do not change the behavior).

---

## 7. Feature proposals (parking lot only)

Do **not** change progression numbers. Fit the existing plugin / history /
world / friends / coach paths. **Not this PR.**

| # | idea | why it fits | implement? |
|---|---|---|---|
| F1 | Coach proposes a Forge plan the player can import | `coach/context.js` already briefs neglected muscles and saved plans; Forge already `MODULE_PATCH`es plans. Deterministic template from analysis, not an LLM writing numbers. | later |
| F2 | Weekly friend challenge (shared, one metric, Monday reset) | Boards already week-scoped; `friendIdsOf` is the privacy function; server already validates days. One extra challenge row, no new currency. | later |
| F3 | Evolution / bond ceremony that is not a strobe+swap | `EVOLVE` already fires from Battle/Forge; motion tokens have `ceremony: 620`. Reduced-motion path required (bible gap 11). | later |
| F4 | Per-movement PR sparkline on plan detail | `forge/history.js` already stores PRs. Charts only. | later |
| F5 | Reading / chores / social check-in modules | Phase 6 idea; registry is the install step. | later |
| F6 | History export (local JSON) | `state/history.js` is already the substrate. | later |
| F7 | World growth on the lane (bench plaque / pin garden) as you earn Quest Pins | `mapWithout` / props already exist; visual only. | later |
| F8 | Companion follows you on the lane (overworld sprite beside the player) | `CompanionStatus` is HUD-only outdoors. Visual. | later |

Also already in `GAME_BIBLE.md` §14: no release contract, no CI quality gate,
background step counting unproven on a standalone build, save-failure banner
exists but corrupt-save recovery does not, Coach proxy undeployed, no privacy
policy.

---

## 8. Fixes in this audit PR

Written down above before the edit:

1. **A2** — Bedroom stairs return downstairs.
2. **A3** — Front door from downstairs returns to Sunkist Lane on the doorstep.

No progression numbers changed. No injector gate lifted. No movement ids
renamed. No guard deleted. A27–A30 were written down and left unfixed so
this PR stays the audit.

---

## 9. What this audit verified

Ran on 2026-08-23 against this branch (`cursor/audit-findings-e7e6` = `main`
+ the two house fixes + this file):

- `python3 tools/check_docs.py` — **25/25 figures + both coach guardrail
  pairs agree.** Save 9, 30 screens, 30 components (HorizonSky + GrowthCeremony
  both export), 416 atlas cells, 139
  runtime sprites, kcal 0.53/0.75, pace 12, 54 companions, 6 obstacles, 74
  recipes, knot 2.5 mi, credit 10/8/6/4, map sizes 13×17 / 17×19 / 13×15 /
  11×13, 53 masters, 9 perks, six hub menu entries, 5 modules.
- `python3 tools/check_art.py` — **53 of 53 masters reproduce.** Exit 0.
  Did **not** print Dewbble (A25). That is the finding, not a clean bill.
- `node --check server/index.js` — syntax ok.
- Shop `itemId`s all exist in `ITEMS`. Recipe `logAs` asserted at import.
- Route pool-size and creature-id asserts are in the source; not executed
  here (Metro ESM, no Node loader for `src/data/routes.js`).
- `__DEV__` injector still gated (`useDistance.js:277`).
- User-facing copy says Sunkist Lane / Quest Fitness / the gym / named trails.
  "Maple Lane" remains only in two comments (A20) and as history in CLAUDE.

---

## 10. What this audit did not verify (honest)

- Did not run the phone (no device). Background pedometer, GPS
  non-duplication, Expo Go vs standalone, and kill/resume are unproven here.
- Did not prove Apple/Google sign-in (needs real client ids and a device).
- Did not run `npm --prefix server run test:auth` or `test:friends` on this
  pass (no claim they are green from this session).
- Did not run `EXPO_OFFLINE=1 CI=1 npx expo export` (bundle) on this pass.
- Did not re-trace art or re-generate audio.
- Did not play the first-run path in a simulator; A27–A30 are from reading
  the call graph, not from catching the redbox.
- Did not treat other franchises as a design spec.
- Did not weaken `check_docs.py` / `check_art.py` / map or creature import
  asserts.
- Did not edit `tools/CHARACTER_PROMPT.md` or `tools/check_art.py` (another
  agent owns companion-creation skill work).
- Did not start an instruction rewrite, UI migration, play-quality pass,
  companion remake, or new feature.

---

## 11. Fixes on the follow-up branches

`cursor/first-morning-guards-e7e6` (#33):

1. **A26** — Options Erase calls `forgetAll()`.
2. **A27–A30** — Bag, Home, Status, Forge, Workout, Battle, Coach, Route
   no longer read `companion.creature` before pairing.
3. **A21 / A22** — those empty states have spoken labels.

`cursor/audit-fixes-e7e6` (this branch):

1. **A1** — `coachTutorial` unregistered; file kept as copy (would skip the lane).
2. **A5** — `hydrateSave` + `tools/test_hydrate.mjs` (v1 blob, required keys).
3. **A6** — unused `dusk` tone deleted (no caller).
4. **A10** — sourceless companions fail `check_art.py`; Dewbble stays named.
5. **A25** — `family_chains()` expands spreads so Dewbble is in the walk.
6. **A21 / A22** — Party / bag / habit-log / week / Index empty + a11y. Web trail is #32.
7. **A32** — grown-form copy; pool composition unchanged.

Skipped here: A9/A13/A23/A24 (#30 has a broader check_art rewrite), A16/A17
(#31), A18–A20 (#32), A2/A3 (#28), A26–A30 (#33), A11 (do not draw Dewbble),
A7 (keep declared), A33/A34, any progression/economy/catch-rate retune.
`check_art.py` now exits 1 on Dewbble on purpose.
