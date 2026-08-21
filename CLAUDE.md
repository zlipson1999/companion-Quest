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

## Original assets are GENERATED, not hand-placed as image/audio files

- **Pixel art** — `tools/make_sprites.py`: each creature/hero/item is a 16×16
  grid of palette indices. It validates alignment, renders a preview to
  `tools/sprite_preview.png` (Read it to eyeball the art), and emits
  `src/data/sprites.js`. The app renders these grids directly via `<PixelArt>` /
  `<PixelSprite>` — there are **no external image files**. To add a creature: add
  its grid + a palette (mirror the palette into `src/theme/colors.js`
  `spritePalettes`), run the script, view the preview, then wire up data.
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

**State shape** (persisted to AsyncStorage, auto-migrated by `version`):
`{ started, goalId, party:[{id,baseId,xp,bond,hp}], activeIndex, stats, bag,
dex, settings, meta }`. Companion XP is a lifetime total; level/HP are derived
(`src/state/leveling.js`). `useCompanion()` returns the active party member;
`useParty()` returns the whole team. Distance is in miles (`stats.distanceMi`);
the Route auto-advances and rolls grass encounters off real distance.

**Navigation:** a tiny custom router (`src/screens/Router.js` + `navContext`) —
`navigate(name)` and `toBattle(params)` (which plays the flash/wipe). Register
new screens in `Router.js` (SCREENS map + TOWN_BGM) and add a hub menu entry in
`HubScreen.js`.

**Data-driven:** creatures/goals/items/exercises/obstacles/wild/workouts/maps all
live in `src/data/*` as plain objects. Add content there.

## What's already built

- **Phase 1** — intro (title → coach dialogue → pick goal → paired with starter)
  → tile hub → Route (pedometer) → DS battles = real exercise → Workouts, Rest
  Stop, Status, Creature Index, Bag, Options → persistence + evolution.
- **Phase 1.5** — real distance moves you (steps→miles + GPS "Start Run" via
  `expo-location`, `src/state/useDistance.js`); tall-grass wild encounters
  (`src/data/wild.js`); **catch wild companions with a Bond Token + build a team
  of 6** (Catch/Swap in `BattleScreen`, Team screen); goal-tuned pacing.
- **Phase 2** — domain-locked AI Companion Coach chat (`src/screens/CoachChatScreen.js`,
  `src/coach/{persona,guardrail,api}.js`). Pre-send guardrail refuses off-domain /
  jailbreak in-character; the Anthropic key stays server-side in `server/` (uses
  the official `@anthropic-ai/sdk`, default model `claude-opus-5`, override via
  `COACH_MODEL`). Client reads the proxy URL from `EXPO_PUBLIC_COACH_API_URL`.

## Phase 3 — BUILD THIS NEXT: pluggable life modules

Goal: formalize the module-agnostic progression into a real **life-module plugin
system**, then ship **diet/hydration as the first example** module(s).

Design intent:
1. `src/modules/` with a registry (`src/modules/index.js`). Each module is an
   object implementing a common interface, e.g.
   `{ id, name, sprite, blurb, dailyGoal, initialState(), progress(modState),
   actions:[{label, apply(modState)->modState, reward:{xp,bond}}], summary() }`.
   Keep it generic so sleep / meditation / reading / chores / social check-ins can
   be added later by dropping in a new module object — no core changes.
2. State: add `state.modules = { [id]: moduleState }` with **daily reset** logic
   (reset the day's counts on a new date in HYDRATE, preserve streaks). Add
   reducer actions `MODULE_LOG` / `MODULE_RESET_DAY` that update
   `state.modules[id]` AND feed the shared progression (dispatch the module
   action's `reward` through the same GAIN_XP/GAIN_BOND path). Bump the save
   `version` and migrate old saves (default `modules: {}`).
3. First modules (the example): **Hydration** (log glasses of water toward a
   daily goal → small XP/bond per log, bonus on hitting goal) and **Diet** (log
   meals / healthy-eating check-ins, or simple calorie targets → rewards). The
   brief says "diet/hydration module first as the example."
4. UI: a **"Habits" / "Life" hub** screen listing installed modules as bordered
   cards (reuse `Window`, `ProgressBar`, `PixelButton`, `PixelText`, `PixelSprite`)
   showing today's progress; tapping opens the module's log screen. Add a hub
   menu entry + Router registration. Keep the DS aesthetic.
5. Original art for any new module icons via `tools/make_sprites.py`
   (water drop / apple already exist as items — reuse or add module icons).
6. Verify it bundles; keep everything original; give a short "how to test" note.

## Conventions & guardrails

- Match the surrounding code style; keep files modular (no single-file dumps).
- Comments explain intent, not the obvious.
- Don't ship secrets in the client — the coach key stays in `server/`.
- After a phase, add a short "how to test" note and ask what to tune.
- Branch is `claude/wizardly-allen-j0413v` (or whatever the session assigns); the
  history so far is 3 commits (Phase 1, 1.5, fixes+Phase 2).
