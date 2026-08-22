# Companion Quest — The Game Bible

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
as an EAS dev build. State is one reducer + AsyncStorage. No navigation
library, no state library, no image or audio asset files — **everything is
generated or drawn in code** except the traced reference sprites (§8.4).

```
src/
  theme/       colors (palette + shade()), typography (PressStart2P), metrics
  data/        creatures, goals, exercises(+learnset/tiers), items, wild,
               obstacles, workouts, maps, movements(140), muscles(14),
               route(pacing), sprites.js (GENERATED — never edit by hand)
  state/       GameContext (reducer, save), leveling, evolution, history,
               recovery, useDistance, stepDetector, storage
               [usePedometer.js is DEAD legacy — superseded by useDistance,
                still exported from state/index.js; safe to delete]
  screens/     Router + 21 screens (§4)
  components/  17 building blocks (§9)
  modules/     the life-module plugin system + 5 modules + forge/ (§7)
  coach/       persona, guardrail, lines, context, local (offline brain), api
  audio/       sfx.js (expo-av wrapper, degrades silently)
server/        Express proxy for the LLM coach (optional; key stays here)
tools/         make_sprites.py (art engine), make_audio.py (SFX synth),
               traced_*.json (converted reference art), sprite_preview.png
assets/sfx/    16 WAVs, ALL synthesized by make_audio.py
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
python3 tools/make_sprites.py                    # regenerate ALL art
python3 tools/make_audio.py                      # regenerate ALL audio
node --check server/index.js                     # server is outside Metro graph
```

Web deploy: `web.output: "single"` (SPA — `static` needs expo-router and
fails), `experiments.baseUrl: "/companion-Quest"` (Pages subpath), workflow
touches `.nojekyll` (Jekyll strips `_expo/`). Live at
`https://zlipson1999.github.io/companion-Quest/`.

## 3. The player journey

Title → Intro (Coach dialogue) → Choose Your Goal → Pairing → Town Hub, then
free roam. The hub tile map has three walk-in triggers (Rest door, Training
Yard door, Route gate) plus a 13-entry menu. The Route turns real distance
into progress and rolls tall-grass encounters into battles. Everything else
is reachable from the hub menu.

## 4. Screens (all 21, registered in `screens/Router.js`)

Router is ~100 lines: `SCREENS` map, `navigate(name, params)`,
`toBattle(params)` which plays the `BattleTransition` flash/wipe first, and a
`TOWN_BGM` set — every non-battle screen plays the town loop (missing an entry
here = battle music keeps playing; this was a real bug once).

| route | file | what it is |
|---|---|---|
| `title` | TitleScreen | logo, blinking Press Start, bobbing starters; Continue / New Adventure (+erase confirm) when a save exists |
| `intro` | IntroScreen | Coach's typewriter welcome |
| `goal` | GoalSelectScreen | the three goals (§5.2) with starter previews; rows are `Pressable` (an `onTouchEnd` bug once made mouse selection impossible on web) |
| `pairing` | PairingScreen | starter reveal + Coach lines |
| `hub` | HubScreen | tile town, D-pad grid movement, status strip, 13-entry menu (Route/Train/Forge/Rest/Team/Habits/Coach/Bag/Status/Week/Index/Options/Title) |
| `route` | RouteScreen | the engine room — §5.4 |
| `battle` | BattleScreen | §6 |
| `workout` | WorkoutScreen | 4 quick preset routines (data/workouts.js), pay ×`workoutXpMult` |
| `rest` | RestScreen | full-heal beat with nurse-style dialogue (`HEAL_FULL`) |
| `summary` | SummaryScreen | Status: companion, stats, daily habits block, recovery |
| `index` | IndexScreen | Creature Index: owned/seen/silhouetted-unknown |
| `bag` | BagScreen | items, use effects (heal/xp/bond) |
| `party` | PartyScreen | team of ≤6, swap active |
| `habits` / `habit` | HabitsScreen / HabitLogScreen | module hub + per-module log (§7) |
| `forge` / `forgeEdit` | ForgeScreen / ForgeEditScreen | plan list/detail/session runner; builder (§7.4) |
| `formcheck` | FormCheckScreen | front camera as a MIRROR + cue ticker; explicitly NOT pose analysis; session state rides through `params.resume` |
| `week` | WeekScreen | this week vs the same elapsed days last week, honest verdict sentence |
| `coach` | CoachChatScreen | chat; local data-driven answers first (§10) |
| `options` | OptionsScreen | SFX/BGM toggles, lb/kg units, erase save |

## 5. Core systems and their numbers

### 5.1 Leveling (`state/leveling.js`)

- XP is a lifetime total; level is derived. `xpToNext(level) = 40 + 20·level`.
- `maxHp = creature.baseHp + 8·(level − 1)`.
- Party member shape: `{ id, baseId, xp, bond, evo, hp }` — `id` changes on
  evolution, `baseId` never does (the Index tracks the line by it).

### 5.2 Goals (`data/goals.js`, `data/route.js`)

Three goals = the three reasons people open a fitness app, named for the game
world. Old saves migrate ids in HYDRATE (`distance→lean`, `strength→muscle`,
`balance→root`).

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
Three full lines: Sproutle→Bloomtail→Groveheart, Emberkit→Pyrelynx→Cindermane,
Dewbble→Tidewade→Maelstride. Creatures carry explicit `stage: 1|2|3`.

### 5.4 The Route & distance (`screens/RouteScreen.js`, `state/useDistance.js`)

- `STEPS_PER_MILE = 2000`. `ADD_DISTANCE` accrues miles, pays walking XP with
  the fractional carry, advances `routeMi`, and fires milestones
  (item from `PICKUP_POOL`: apple×2, water×2, energybar, charm, token×2 —
  tokens recur so catching stays possible).
- Encounters roll every `encMin–encMax` miles (per goal) while on the Route.
- The trail visual is a deterministic scrolling tile field (`routeRow` hash);
  it scrolls only while distance is actually arriving.
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
  3. Manual injector buttons — only when `source === 'none'`.
  The Route names which source is live; `pedDiag` prints host/OS/permission/
  error in the failure box.
- GPS runs: `watchPositionAsync` High accuracy, 5 m / 2 s; haversine per fix,
  deltas outside 1–80 m discarded as jitter/jumps; step-miles suppressed while
  running (no double count). Location is used for the delta and discarded.

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
- **Catch**: costs a Bond Token.
  `chance = clamp(catchRate·(0.4 + 0.6·(1−hpRatio)) + min(0.15, bond/300), 0.05, 0.95)`.
  Full team (6) → catch still consumes token, creature goes to index.
- **Choreography** (timings in ms): attacker lunge 0 → victim flinch + white
  flash + damage pop 140 → counter lunge 650 → counter flinch/pop 790 → faint
  (KO) at 430 after its flinch. Entry: wild slides in from +90 px right,
  companion from −110 left, staggered 160. All timers cleared on unmount.
- **Stage**: real zoomed grass/path tiles (3× overworld scale) under a single
  sky colour + one haze line; horizon at 0.16 so BOTH combatants stand on
  ground. Platforms are stacked-rect discs with lit top / shaded underside.
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
| Forge (`training`) | sessions | 1 | actions = your saved plans; reward = analysed | — |

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

### 8.3 Sprite inventory (54)

- Creatures 48×48 authored @2× = 96 px: 3 starters (TRACED), 6 evolutions
  (procedural, AWAITING trace), 3 wild (pebblepup, wispurr, sporelet), 4
  obstacles (sludgewad, snoozeghoul, achefang, couchlurk) — procedural.
- Hero 24×32: 4 facings × 3 frames, distinct silhouettes per facing.
- Items/module icons 24×24: apple, water, energybar, charm, token, droplet,
  plate, check (fallback), barbell, moon, still.
- Tiles 16×16: grass×2, tallgrass, path×2, tree, water×2, flowers, roofs×2,
  wall, window, door, gate. Scattered by coordinate hash, never random.

### 8.4 The traced kit (docs/ART_KIT.md)

Reference art (generated externally to a strict style prompt: cel shading,
upper-left light, dark self-coloured outline, 2:3 proportions, transparent
background) → converter keys alpha/magenta, downsamples to 96², quantises to a
hand-ordered palette (`tools/traced_<id>.json`), drops <12-px specks (bigger
detached blobs are art — Dewbble's droplets). `load_traced()` beats the
generated sprite of the same name in `build_all`. Palette gotcha: tiny features
(Dewbble's pink mouth) need a hand-added palette entry or they quantise away.
**Every new creature should go through this kit**; procedural is the fallback.

## 9. UI components (17)

Window (bevelled + corner studs + paper highlight), Menu (selection FILL +
cursor + sfx), DialogueBox (typewriter, blip every 2 chars, bobbing advance
arrow, tap-to-complete), PixelText (PressStart2P, sizes tiny→hero), PixelArt /
PixelSprite, BarFill (tube-shaded meters; border thins ≤8 px) → HPBar /
ProgressBar / StatusPlate (name/Lv/HP + EXP strip on YOUR plate only),
BattleStage + Platform, BattleTransition (flash/wipe), TileMap (+exported
Tile; fractional cells — rounding once clipped ¼ of every tile), DualPane,
Dpad, Screen, Triangle (the font has no arrow glyphs — never rely on unicode
arrows/hearts).

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

`tools/make_audio.py` synthesizes all 16 WAVs (square/triangle/noise, ~8-bit
idiom): blip, cursor, confirm, cancel, encounter, hit, lowhp, victory,
levelup, evolve, item, heal, milestone, catch + bgm_town / bgm_battle loops.
`audio/sfx.js` wraps expo-av; every call degrades silently (web autoplay,
early calls). BGM switching lives in Router via TOWN_BGM.

## 12. Save format — `companionquest:save:v1` key, `version: 5`

```js
{ version: 5, started, goalId,                    // 'muscle'|'lean'|'root'
  party: [{ id, baseId, xp, bond, evo, hp }],     // ≤6
  activeIndex,
  stats: { totalSteps, distanceMi, routeMi, xpCarry, milestonesReached,
           battlesWon, workoutsDone, itemsFound, restDays, ... },
  bag: { itemId: count }, dex: { creatureId: 'owned'|'seen' },
  modules: { [id]: { date, count, entries, goalHit, streak, bestStreak,
                     lastGoalDate, goalDays, totalCount, totalLogs,
                     paid?, goalCredit?, bonusPaid?,        // replaces-modules
                     plans?, log?, records?, bests? } },    // forge-owned
  history: { 'YYYY-MM-DD': { xp, bond, distanceMi, battles, workouts,
             sessions, habitLogs, goalsMet, restDays→rested, load } },
  settings: { muted, bgmMuted, units },           // units 'lb'|'kg'
  meta }
```

Migrations, all in HYDRATE: v1 single `companion` → party; v2→3 zeroed module
buckets; v3→4 history starts recording (never invents past days); v4→5 `evo: 0`
on members; goal ids translated; UTC day-keys → local; `rollAllModules` day
roll on load + `MODULE_RESET_DAY` self-heal from the Habits screens.

## 13. Known gaps & debt (the honest list)

1. **Six evolutions + 7 wild/obstacle creatures are procedural** — visibly a
   different art tier next to the traced starters. Blocked on reference images.
2. **Expo Go can't reach the OS pedometer** — accelerometer fallback works but
   is foreground-only. Real fix: EAS dev build (eas.json ready, ~15 min).
3. `state/usePedometer.js` is dead code (still exported).
4. Evolution ceremony is a strobe + swap; deserves a real scene.
5. No per-movement progression charts yet, despite weight-aware PR data.
6. Train (presets) vs Forge (builder) naming still confuses (user-reported).
7. `dusk` battle tone defined, never used.
8. Scratchpad walkthrough artifact drifts from the app (preview-only).
9. server/ never deployed; Coach is local-brain-only in production (fine).
10. `catch still consumes a token when the team is full` — feels bad; revisit.

## 14. Roadmap (agreed order)

1. Trace the 6 evolutions as images arrive; evolution ceremony polish.
2. Trace wild + obstacle creatures.
3. EAS dev build → pocket step counting proven on-device (PHONE_TEST.md).
4. Progression charts from PR/weight history.
5. 20 new companion families × 3 stages through the trace kit.
6. Then: battle move animations per-exercise, richer obstacle roster, town
   growth.

---
*Audited against the codebase at the commit that introduced this file.*
