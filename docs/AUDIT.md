# Companion Quest — full-repo audit

Date: 2026-08-23. Against `main` at `40d8477` (trail companions + Sunkist Lane).
Auditor re-read the repo; earlier session summaries were not trusted.

Status column: **fixed** (this PR), **recommend** (later part or a human), **noted** (intentional / already documented).

Severity: **blocker** (wrong or unreachable content a player hits), **high** (broken loop or provenance hole), **medium** (play / docs / tooling), **low** (comments, leftovers, polish).

---

## 1. Correctness

### 1.1 Screen reachability

Every file in `src/screens/*Screen.js` is registered in `Router.js` `SCREENS` except `LoadingScreen`, which is the pre-hydrate / pre-font shell (`Router.js:148-149`, `App.js:21-22`). That is correct.

| route | way in | status |
|---|---|---|
| `title` | hydrate start (`Router.js:104`) | ok |
| `intro` | Title "Enter the World" / erase (`TitleScreen.js:53,63`) | ok |
| `outfit` | Intro when no character (`IntroScreen.js:36`) | ok |
| `homeIntro` | Outfit confirm, or Intro if character already set (`OutfitSelectScreen.js:27`, `IntroScreen.js:36`) | ok |
| `goal` | Coach Maple before a companion (`GymScreen` resolves `C`) | ok |
| `pairing` | Goal confirm (`GoalSelectScreen.js:31`) | ok |
| `hub` | HomeIntro front door, Title Continue, gym/house exits | ok |
| `gym` | Hub door `d` / menu (`maps.js:325-326`, `HubScreen.js:21`) | ok |
| `sparIntro` | Rowan tile `A` (`maps.js:278`). Live path also `toBattle` from GymScreen | ok |
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

`GAME_BIBLE.md:194` already calls `coachTutorial` an unused leftover. The file is still imported, in `SCREENS`, and in `TOWN_BGM` (`Router.js:18,51,83`).

**A1 — `coachTutorial` registered, no way in.** `src/screens/CoachTutorialScreen.js:19` / `src/screens/Router.js:51`. Severity: **medium**. Status: **recommend** (Part 4 may reuse the copy for first-run; do not delete the lessons until that decision). HomeIntro used to dump onto this lecture; it now exits onto Sunkist Lane (`HomeIntroScreen.js:11-12,59-61`).

### 1.2 Map codes

Every character that appears in `HUB`, `GYM`, `DOWNSTAIRS`, `BEDROOM` grids resolves to at least one of: `FIELD_CODES` / `TILE_SPRITES` / `PROP_SPRITES` (`TileMap.js:23-112`), `INTERACTIONS` or a per-map `interactions` table (`maps.js:239-286,41-47,157-196`), `triggerForCode` (`maps.js:321-333`), or a drawn person (`C`/`A` in `TileMap.js:459-464`). Import-time grid-size asserts (`maps.js:205-215`) and the trigger/interaction shadow check (`maps.js:348-355`) still hold. `G` is a trigger only; the noticeboard is `r`.

Walkable-but-meaningless tiles found:

**A2 — House stairs are one-way on the rest screen.** `HomeRestScreen.js:54-61,82`. Downstairs `s` at `(11,1)` goes up. Bedroom `s` at `(9,11)` is walkable (`BLOCKED` does not include `s`, `maps.js:217-227`) and does nothing. HomeIntro uses `exit` coords for both directions (`HomeIntroScreen.js:17-28`). Severity: **high**. Status: **fixed** (this PR).

**A3 — Front door inside the house does not leave.** `D` is walkable. Hub walking onto `D` triggers `rest` (`maps.js:323-324`). `HomeRestScreen` never calls `triggerForCode`, so standing on the downstairs door (`DOWNSTAIRS` last row, `x=6,y=14`) does nothing. The only exit was sleeping (`HomeRestScreen.js:111`). Severity: **high**. Status: **fixed** (this PR). Walking out places you on the doorstep (`HomeIntroScreen.js:33` / `LANE_FROM_HOUSE`).

Codes that are props with no screen (labels or scenery only) are intentional: hub `i`/`%` (`maps.js:45-46`), gym `V`/`O` (banner/clock), house `p`/`l`/`g`/`x`/`m` (plant, lamp, nightstand, coffee table, chair). Cardio `t`/`q` stay in-room (`maps.js:254-255`).

### 1.3 Reducer actions vs dispatchers

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

**A4 — `GAIN_BOND` has no dispatcher.** `GameContext.js:399-403`. Bond is applied through `applyEffect` from modules, battles, workouts, items. The case stays because life modules are offered `{xp,bond,heal}` on the shared contract (`CLAUDE.md` / `modules/index.js:23-28`). Severity: **n/a**. Status: **noted** (do not delete).

`SET_PLAYER_OUTFIT` is gone. `usePedometer.js` is gone. Both already recorded in `GAME_BIBLE.md:987`.

### 1.4 Save migrations (current `SAVE_VERSION = 9`)

Source of truth: `GameContext.js:44,53-101,202-269`. Bible: `GAME_BIBLE.md:743`.

Conceptual v1 load through `HYDRATE`:

1. Spread `FRESH` then the save (`GameContext.js:204-215`) — new keys (`credits`, `history`, `modules`, `trails`, `settings.bodyWeightLb`, `settings.control`, `meta.sparDone`, `stats.exercises`, `stats.xpCarry` / `creditCarry`) take FRESH defaults when absent.
2. `goalId` through `migrateGoalId`.
3. v1 `companion` becomes a one-member `party`; `evo` defaults to `0` (`GameContext.js:217-225`).
4. v3: `rollAllModules` zeros every registered module; local-date streak skip on a 1-day gap (`GameContext.js:230-267`).
5. v4: `history` starts empty (`trim(saved.history || {})`).
6. v6: null outfit/gender keep the player in setup.
7. v7: `credits` start at 0; no back-pay.
8. v8: `bag.token` folds into `bag.knot`.
9. v9: `normalizeTrails(saved.trails)` — Maple Trail starts at zero, not back-credited.

Nothing at the top level is left `undefined` after this merge. Party members from a v1 `companion` may lack `baseId`; runtime reads `m.id` / `getCreature`. `hp` missing is treated as max in `applyEffect` (`GameContext.js:144`).

**A5 — No save-migration fixture test.** Severity: **medium**. Status: **recommend** (root `npm test` in Part 2 should grow a JS walk of a v1 blob through `HYDRATE`; do not invent days).

### 1.5 Dead files / dead registrations

No shipped `src/` file is unimported. `data/index.js`, `screens/RestScreen.js`, `state/usePedometer.js` are already gone.

**A6 — `BattleStage` `dusk` tone unused.** `src/components/BattleStage.js:22`. Severity: **low**. Status: **noted** (bible §14 item 14).

**A7 — `expo-crypto` / `expo-asset` not imported by app code.** Declared in `package.json:17,22`. `expo-asset` is a Metro/Expo transitive; `expo-crypto` is required by `expo-auth-session`. Severity: **low**. Status: **noted** (keep declared; Pages `npm ci` needs the lockfile).

**A8 — `expo-font` is used via `@expo-google-fonts/press-start-2p` in `App.js:7`, not a direct import.** Severity: **n/a**. Status: **noted**.

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

Every current family is 3 stages. **`creatures.js` does not assert that.** A two-stage family would still pass `INDEX_ORDER` if both ids are listed.

**A9 — No import-time "family is 3 stages or absent" guard.** `creatures.js:415-439`. Severity: **medium**. Status: **recommend** (Part 2).

**A10 — `check_art.py` reports sourceless companions but exits 0.** `tools/check_art.py:97-113`. Severity: **medium**. Status: **recommend** (Part 2 must fail on traced art with no provenance **and** on families shorter than 3; do not delete the existing master-reproduces-shipped-art check).

**A25 — `check_art.py` `family_chains()` does not expand spreads.** `tools/check_art.py:38-39` reads `WILD_COMPANION_IDS = \[([^\]]+)\]` and then only the quoted ids inside that one array. The array is `[...STARTER_IDS, 'pebblepup', 'wispurr', 'sporelet', ...TRAIL_COMPANION_IDS]` (`creatures.js:390-392`), so the sourceless report only walks three families. A 2026-08-23 run printed “53 of 53 masters reproduce” and **did not mention Dewbble**. Severity: **high** (the provenance gap the script exists to show is invisible). Status: **recommend** (Part 2: parse `STARTER_IDS` + `TRAIL_COMPANION_IDS` + the three named wilds, or walk `CREATURES` for `catchable` roots).

### 2.2 Dewbble / starter masters

`tools/reference_art/dewbble.png` **does not exist**. `traced_dewbble.json` does. `docs/ART_KIT.md:9-14` already states this.

Eight starter-line masters exist but are tiny PNGs (1.1–2.0 KB): `sproutle`, `emberkit`, `bloomtail`, `groveheart`, `pyrelynx`, `cindermane`, `tidewade`, `maelstride`. They are real isolated sprites (Sproutle reads as the designed teardrop, not a sphere+eyes blob). They are not the painted lineup plates the trail families have.

**A11 — Dewbble still has no master.** Severity: **high** (provenance non-negotiable). Status: **recommend** (do not re-render a PNG out of the indexed JSON to close the count).

**A12 — Original six families have no approval lineup in `tools/reference_art/lineups/`.** Only `maple` / `cairn` / `gale` / `canopy` trail plates. Severity: **medium**. Status: **recommend**.

Obstacles remain procedural (`GAME_BIBLE.md:983-986`). No `traced_sludgewad.json` etc.

### 2.3 Movements / recipes / cuisines

| claim | code | match |
|---|---|---|
| 140 movements | `src/data/movements.js` — 140 `{ id:` entries | `GAME_BIBLE.md:566` |
| 8 patterns | `PATTERNS` (`movements.js:30-39`) | ok |
| 8 equipment | `EQUIPMENT` (`movements.js:17-26`) | ok |
| 74 recipes | 74 `R(` in `recipes.js` | `GAME_BIBLE.md:198` |
| 18 categories | `CATEGORIES` (`recipes.js:754`) | ok |
| 15 cuisines | `CUISINES` (`recipes.js:777`) | CLAUDE / kitchen copy |

Movement ids are permanent (`movements.js:14-15`). This audit does not rename any.

### 2.4 Maps vs bible sizes

`HUB` 13×17, `GYM` 17×19, `DOWNSTAIRS` 13×15, `BEDROOM` 11×13. `check_docs.py` watches these.

---

## 3. Build and test surface

**A13 — Root `package.json` has no `test` script.** `package.json:5-9` is start / android / ios / web only. Server has `test:auth` and `test:friends` (`server/package.json:10-12`); root `test` is auth only. Severity: **medium**. Status: **recommend** (Part 2: `npm test` runs Python checkers + server tests + `node --check`).

**A14 — `check_docs.py` still compares both coach guardrail copies.** `tools/check_docs.py:130-161`. Status: **noted** (keep).

**A15 — `check_docs.py` counts companions as `CREATURES` keys minus `OBSTACLE_IDS`.** That is 54. The bible regex is `\*\*(\d+) companions` (`check_docs.py:85`). Status: **noted**.

Runtime deps used by `src/` + `App.js` are all in `package.json`: expo-*, async-storage, react, react-dom, react-native, react-native-web, three, press-start-2p. `expo-constants` is declared (`package.json:21`) and imported (`useDistance.js:8`).

`__DEV__` injector remains gated (`useDistance.js:277`). This audit does not lift it.

---

## 4. UI system (inventory for Part 3)

`tokens.js` + `FieldCard` / `TrailAction` / `ObjectiveRibbon` exist. `TrailAction` honours `scale.touchMin` (44) (`TrailAction.js:52,77`). `PixelButton` does not (`PixelButton.js:29-40`: paddingVertical 10, no minHeight).

| already Trailkeeper | mixed | still Window / PixelButton |
|---|---|---|
| Board, Friends; WorldScreen rooms (Hub, Gym, HomeIntro, HomeRest) | Cookbook, SmoothieBar, Route | Title, Intro, Outfit, Goal, Pairing, SparIntro, Battle, Workout, Summary, Index, Bag, Party, Habits, HabitLog, Forge, ForgeEdit, FormCheck, Week, Coach, Options, CoachTutorial, Loading |

**A16 — Trailkeeper migration is unfinished.** Severity: **medium**. Status: **recommend** (Part 3: finish or write down which screens stay legacy and why).

**A17 — `PixelButton` ignores `scale.touchMin`.** `PixelButton.js:29-40` vs `tokens.js:65-70`. Forge `+/-` uses `size="tiny"` and `paddingVertical: 4-5` (`ForgeScreen.js:57`, `ForgeEditScreen.js:30`). Severity: **medium**. Status: **recommend** (Part 4).

---

## 5. Play quality (inventory for Part 4)

**A18 — First-run never says "walking is the input" as a dedicated beat.** Title → Intro → Outfit → HomeIntro → Lane. CoachTutorial's first line (`CoachTutorialScreen.js:9`) is the clearest statement and is unreachable (A1). Lane objective after a companion is "Head out through the north gate…" (`HubScreen.js:73-75`) which is better than nothing. Severity: **medium**. Status: **recommend**.

**A19 — Published web trail is a dead end with no on-scene copy.** `useDistance` `source` is `none` in a release web build; `showInjector` is false (`useDistance.js:277`). The "No step counter" panel lives behind the menu (`RouteScreen.js:305-323`) and in `__DEV__` only when the injector shows. Release web still offers "Start Run (GPS)" (`RouteScreen.js:412-418`), which will fail or no-op in a browser. Severity: **medium**. Status: **recommend** (Part 4: say so on the trail; do **not** lift the injector).

**A20 — "Maple Lane" leftover comments.** `ObjectiveRibbon.js:4`, `CompanionStatus.js:3`. User-facing copy is "Sunkist Lane" (`navContext.js:8-9`, `HubScreen.js:82`, `TRIGGER_LABELS` `maps.js:361`). Severity: **low**. Status: **recommend** (comment cleanup only; CLAUDE Phase 11 title is history).

**A21 — Accessibility is sparse.** `TrailAction`, `ObjectiveRibbon`, stick, D-pad, menu button, and a few sprites have roles/labels. Most `PixelButton` rows do not. Pixel font has no unicode arrows/hearts (already a project rule). Severity: **medium**. Status: **recommend** (Part 4, low-risk labels only).

**A22 — Empty / offline states.** Friends/Board already handle "no server" (`FriendsScreen.js:144`). Cookbook search-empty exists. Forge with no plans exists. Trail with 0.00 mi does not explain web. Severity: **low–medium**. Status: **recommend**.

Naming now: **Quest Fitness** (building), **the gym** (room), **Sunkist Lane** (town), **the trails** / named trail (Route). `PLACE_LABELS` matches.

---

## 6. Instruction / agent docs (inventory for Part 2)

**A23 — `CLAUDE.md` is 956 lines.** It is a changelog wearing a manual's name. Severity: **high** (agents follow the changelog). Status: **recommend** (Part 2: ~250-line stub + `docs/HISTORY.md` verbatim phase dump).

**A24 — Character-creation instructions still describe procedural `sphere()`/`eye()` in the working-memory file.** `CLAUDE.md` "Original assets are GENERATED" still tells an agent to compose shaded forms. The live quality bar is `tools/CHARACTER_PROMPT.md` and `docs/ART_KIT.md` (traced from designed plates; `sphere()` is not this type). Severity: **high**. Status: **recommend** (Part 2: `docs/CREATING_CHARACTERS.md`).

---

## 7. Feature proposals (for Part 5)

Do **not** change progression numbers. Fit the existing plugin / history / world / friends / coach paths.

| # | idea | why it fits | implement? |
|---|---|---|---|
| F1 | Coach proposes a Forge plan the player can import | `coach/context.js` already briefs neglected muscles and saved plans; Forge already `MODULE_PATCH`es plans. Deterministic template from analysis, not an LLM writing numbers. | **yes** (Part 5) |
| F2 | Weekly friend challenge (shared, one metric, Monday reset) | Boards already week-scoped; `friendIdsOf` is the privacy function; server already validates days. One extra challenge row, no new currency. | **yes** (Part 5) |
| F3 | Evolution / bond ceremony that is not a strobe+swap | `EVOLVE` already fires from Battle/Forge; motion tokens have `ceremony: 620`. Reduced-motion path required (bible gap 11). | **yes** (Part 5) |
| F4 | Per-movement PR sparkline on plan detail | `forge/history.js` already stores PRs. Charts only. | later |
| F5 | Reading / chores / social check-in modules | Phase 6 idea; registry is the install step. | later |
| F6 | History export (local JSON) | `state/history.js` is already the substrate. | later |
| F7 | World growth on the lane (bench plaque / pin garden) as you earn Quest Pins | `mapWithout` / props already exist; visual only. | later |
| F8 | Companion follows you on the lane (overworld sprite beside the player) | `CompanionStatus` is HUD-only outdoors. Visual. | later |

Part 5 implements F1–F3 only. This table stays here so proposals are not lost in chat.

---

## 8. Fixes in this audit PR

Written down above before the edit:

1. **A2** — Bedroom stairs return downstairs.
2. **A3** — Front door from downstairs returns to Sunkist Lane on the doorstep.

No progression numbers changed. No injector gate lifted. No movement ids renamed. No guard deleted.

---

## 9. What this audit did not do

- Did not run the phone (no device).
- Did not prove Apple/Google sign-in (needs real client ids).
- Did not re-trace art or re-generate audio.
- Did not treat other franchises as a design spec.
- Did not weaken `check_docs.py` / `check_art.py` / map or creature import asserts.
