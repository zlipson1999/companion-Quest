# Companion Quest — project context for Claude

Read this first. It's the working memory for anyone (including a fresh Claude
session) picking up this repo.

## What this is

A DS-era **creature-companion RPG that gamifies real-life healthy behavior** —
Pokémon's structure and feel, fully rebranded, where **real fitness is the
engine**. Built with Expo (React Native), testable in Expo Go.

**Non-negotiables:**
- **100% original** creatures, names, art, and audio. ZERO third-party IP (no
  Pokémon names/sprites/music/type system/move names/trade dress). If tempted to
  reference a real Pokémon, invent an original equivalent.
- **Real life is the game.** No "walk" buttons — movement comes only from the
  real pedometer / GPS. Battles are real exercise. The companion grows from real
  behavior.
- **DS-era presentation:** dual-pane "handheld" layout, tile overworld, chunky
  low-res pixel art + limited palette + hard edges, pixel font for ALL text,
  typewriter dialogue boxes, bordered menus with a cursor, DS-style battles,
  original chiptune + 8-bit SFX, flash/wipe + level-up + evolution beats.

## How to run & verify

```bash
npm install
npx expo start          # scan QR with Expo Go
```
**Always verify a change bundles before committing** (catches import/syntax
errors across the whole graph):
```bash
EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir /tmp/cq
```
It should end with `Android Bundled ... index.js (N modules)`. The Phase 2
server is standalone (not part of the Metro graph): `node --check server/index.js`.

**Web build / GitHub Pages.** The app also runs in a browser, which is how it
gets shown to someone without installing Expo Go:
```bash
npx expo export --platform web --output-dir dist
```
`.github/workflows/web.yml` does this on every push to `main` and publishes to
Pages. Two settings make it work and are easy to break:
- `web.output` is **`single`** (an SPA). `static` is an expo-router feature and
  this app ships its own router (`src/screens/Router.js`) — setting it fails the
  export with `Unable to resolve expo-router/node/render.js`.
- `experiments.baseUrl` must equal `/<repo-name>`. A project Pages site serves
  from a subpath, so without it the page loads and then 404s fetching its bundle.

On the web there is no pedometer, so `useDistance` reports none available and the
Route falls back to its distance injector — the loop stays playable, but the real
engine is only there on a phone.

## Original assets are GENERATED, not hand-placed as image/audio files

- **Pixel art** — `tools/make_sprites.py` **draws** the art; it no longer stores
  hand-typed grids. A creature is a few lit forms: `sphere()` evaluates a real
  surface normal and dots it with a light vector, `outline()` walks the
  silhouette, `rim()` adds bounce light along the shaded edge. That is why
  things read as round now — the lighting is computed, not guessed.
  - **Sizes:** creatures 48×48, hero 24×32 (4 facings × 3 frames), items and
    module icons 24×24, tiles 16×16.
  - **Palettes** are ramp specs (`PALETTE_SPECS`): a dark→light pair per ramp
    (`body`/`leaf`/`belly`), expanded to `RAMP_STEPS` and flattened. Grids are
    **base-36** indices, so a sprite can use up to 35 colours. The script emits
    `SPRITE_PALETTES` into `src/data/sprites.js` alongside the art — **nothing is
    mirrored into `colors.js` by hand any more.**
  - To add a creature: write a function composing shaded forms, register it in
    `build_all()`, run the script, **Read `tools/sprite_preview.png`** to eyeball
    it, then point `src/data/creatures.js` at the new key + palette. Evolutions
    get their OWN drawn sprite — a tinted copy of the base read as the same
    creature on screen.
  - `<PixelArt>`/`<PixelSprite>` honour the requested `size` **exactly**
    (fractional cells). Rounding to whole pixels was harmless at 16×16 and
    snapped a 30px request up to 48px once sprites got bigger.
- **Audio** — `tools/make_audio.py`: all SFX + the town/battle chiptune loops are
  synthesized to WAVs in `assets/sfx/`. Re-run after edits.
- **Fonts/glyphs:** pixel font everywhere via `PixelText`. Don't rely on unicode
  arrows/hearts (the font lacks them) — use the `<Triangle>` component or plain
  words.

## Architecture (the important part)

Modular `/src`: `theme`, `data`, `state`, `screens`, `components`, `coach`,
`audio`. Plus `server/` (Phase 2 proxy) and `tools/` (asset generators).

**Progression is module-agnostic — this is the key design.** Everything that
should grow the companion dispatches the SAME reducer actions
(`GAIN_XP`, `GAIN_BOND`, `COMPLETE_WORKOUT`, `ADD_DISTANCE`, `WIN_BATTLE`,
`CATCH`, ...) into one reducer (`src/state/GameContext.js`). New "life modules"
plug into that same flow without touching battle/route code. The Route and
Workouts modules are the first two examples of the pattern.

**Step counting has two sources** (`src/state/useDistance.js`). The OS step
counter is preferred — it counts with the screen off — but it is not always
reachable, notably inside Expo Go, which is where the app first failed on a real
phone. When it is not, `src/state/stepDetector.js` counts steps off the
accelerometer instead: peak detection with hysteresis and a refractory gap, no
permission needed, but foreground-only. The Route states which is running rather
than pretending they are equivalent. See `docs/STEP_COUNTING.md`.

**State shape** (persisted to AsyncStorage, auto-migrated by `version`, currently
3): `{ started, goalId, party:[{id,baseId,xp,bond,hp}], activeIndex, stats, bag,
dex, modules, settings, meta }`. Companion XP is a lifetime total; level/HP are derived
(`src/state/leveling.js`). `useCompanion()` returns the active party member;
`useParty()` returns the whole team. Distance is in miles (`stats.distanceMi`);
the Route auto-advances and rolls grass encounters off real distance.

**Navigation:** a tiny custom router (`src/screens/Router.js` + `navContext`) —
`navigate(name)` and `toBattle(params)` (which plays the flash/wipe). Register
new screens in `Router.js` (SCREENS map + TOWN_BGM) and add a hub menu entry in
`HubScreen.js`.

**Data-driven:** creatures/goals/items/exercises/obstacles/wild/workouts/maps all
live in `src/data/*` as plain objects. Add content there.

**The overworld** (`components/TileMap.js`) draws real 16×16 tile sprites, not
coloured rectangles: two grass variants scattered by coordinate so fields do not
visibly tile, two-frame water, and a hero walk cycle that advances only on an
actual move.

**Life modules:** `src/modules/*` — see "Phase 3" below. `src/modules/daily.js`
owns the calendar (day roll, streaks, reward math) and is pure/testable;
`src/modules/index.js` is the registry.

## What's already built

- **Phase 1** — intro (title → coach dialogue → pick goal → paired with starter)
  → tile hub → Route (pedometer) → DS battles = real exercise → Workouts, Rest
  Stop, Status, Creature Index, Bag, Options → persistence + evolution.
- **Phase 1.5** — real distance moves you (steps→miles + GPS "Start Run" via
  `expo-location`, `src/state/useDistance.js`); tall-grass wild encounters
  (`src/data/wild.js`); **catch wild companions with a Bond Token + build a team
  of 6** (Catch/Swap in `BattleScreen`, Team screen); goal-tuned pacing.
- **Phase 5** — **memory**: a 60-day activity history, acute/chronic **recovery**
  with rest-day advice and a loggable rest day, **per-plan history + PRs**, a
  **weekly rollup**, a **Coach grounded in your real logged activity**, and
  **Sleep + Stillness** modules.
- **Phase 4** — **Workout Forge**: build/log/store your own workout plans, a real
  3D muscle body map, on-device analysis that derives perks and rewards from what
  a plan actually trains, and a camera form-check mirror. Plus the battle stage
  rebuilt to genre-standard framing (horizon, platforms, EXP bar).
- **Phase 3** — **pluggable life modules** (`src/modules/`): a registry + shared
  daily/streak engine feeding the same XP/bond reducer path, with **Hydration**
  and **Nourish** shipped as the example modules, a **Habits** hub + per-module
  log screen, daily reset, and a save migration to `version: 3`.
- **Phase 2** — domain-locked AI Companion Coach chat (`src/screens/CoachChatScreen.js`,
  `src/coach/{persona,guardrail,api}.js`). Pre-send guardrail refuses off-domain /
  jailbreak in-character; the Anthropic key stays server-side in `server/` (uses
  the official `@anthropic-ai/sdk`, default model `claude-opus-5`, override via
  `COACH_MODEL`). Client reads the proxy URL from `EXPO_PUBLIC_COACH_API_URL`.

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
registered in `Router.js` as `habits` / `habit` with a "Habits" hub menu entry.
The Status screen grew a "Daily Habits" block plus habit-log stats.

**Art:** three new original 16×16 icons in `tools/make_sprites.py` —
`mod_droplet`, `mod_plate`, and `mod_check` (the art-less-module fallback). No
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
- `forge/perks.js` — 8 perks, each with its own test and a plain-language reason.
  Gated behind `PERK_MIN_SETS`/`PERK_MIN_VOLUME` so a token plan earns nothing.
- `components/BodyMap3D.js` — real 3D via `expo-gl` + `three`, low-poly and
  flat-shaded, built procedurally from the muscle data (still zero asset files).
  Falls back to `<BodyMapFlat>`, a 2D projection of the same data, if GL fails.
- `screens/FormCheckScreen.js` — front camera as a mirror plus cue ticker.
  **Not pose analysis** — there is no pose model in the app, and the screen says
  so. Nothing recorded or sent; works fully with the camera declined.

**Integration:** the Forge has its own hub-menu entry beside Train; Form Check
carries the running session's progress across in `params.resume` so leaving for
a mirror does not discard it; every non-battle route is in `TOWN_BGM` (fleeing a
battle to the Route used to keep the battle music playing).

**Reward safety:** `applyLog` credits only the portion of a log that lands inside
the daily goal. Logging past the goal is tallied but pays nothing, so no log
button is ever a free progression button. Forge `dailyGoal` is 1 session.

**Battle-stage fidelity** — `components/BattleStage.js` (horizon + stacked-rect
"pixel ellipse" platforms, hard edges preserved) and `components/StatusPlate.js`
(name/Lv, tagged HP bar, and the EXP strip under YOUR plate only). This is the
genre's most recognisable furniture and it was the main visual gap.

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

## Phase 6 — ideas, not committed

Reading / chores / social check-in modules; per-movement progression charts off
the PR data; exporting history; letting the Coach propose a plan the Forge can
import.

## Conventions & guardrails

- Match the surrounding code style; keep files modular (no single-file dumps).
- Comments explain intent, not the obvious.
- Don't ship secrets in the client — the coach key stays in `server/`.
- After a phase, add a short "how to test" note and ask what to tune.
- Branch is whatever the session assigns (Phase 3 landed on
  `claude/phase-3-life-modules-584f0k`).
