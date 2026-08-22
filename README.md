# Companion Quest

A wellness adventure that turns **real-life healthy behavior** into the
game. Walk in real life and your companion moves with you; do real push-ups, squats,
and planks to overcome obstacles; grow and evolve a friend who believes in you.

Its identity comes from an original trail-and-care world, tactile pixel art,
typewriter dialogue, bordered field-kit menus, exercise encounters, and original
chiptune audio — using **100% original** creatures, art, and audio.

> **Core rule:** there are no "walk" buttons. Movement comes only from your phone's real
> pedometer. Battles are real exercise. The companion grows from real behavior.

## Quick start (Expo Go)

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android).

- **On a real phone:** the pedometer is detected and your real steps drive the Route.
- **On desktop/simulator/web:** a **DEV-ONLY step injector** appears on the Route screen
  (`+10 / +50 / +100`) so you can test the loop. It **auto-hides** on a real phone.

Android needs the *Physical activity* permission (declared in `app.json`; Expo Go prompts).

## Project structure

```
src/
  theme/       palette + Trailkeeper tokens, pixel typography, metrics
  data/        original creatures, goals, items, exercises, obstacles, workouts,
               the four maps (+ floor zones), 140 movements, 74 recipes, the
               shop, route tuning, and the GENERATED sprites.js / tileAtlas.js
  state/       game reducer + context (auto-persist), leveling, evolution,
               history, recovery, economy (Trail Credit), cardio maths,
               distance (pedometer / accelerometer / GPS)
  components/  28 blocks — WorldScreen, TileMap/TileImage, CardioConsole,
                CompanionStatus, Joystick, the Trailkeeper primitives, ...
  modules/     the life-module plugin system + 5 modules + the Workout Forge
  coach/       the companion/Coach's warm, in-character dialogue
  audio/       expo-av sound manager for the original SFX + chiptune loops
  screens/     28 screens + the Router (with a real back stack)
assets/sfx/    generated 8-bit WAV SFX + looping chiptune tracks
assets/tiles/  generated tile atlas + room lighting
tools/         asset generators (make_sprites.py, make_audio.py)
```

### Original assets are generated, not copied

- **Pixel art** (`tools/make_sprites.py`): each creature/hero/item is a 16x16 grid of
  palette indices, validated, previewed to `tools/sprite_preview.png`, and emitted to
  `src/data/sprites.js`. The app renders these grids directly — no external image files.
- **Audio** (`tools/make_audio.py`): all SFX and the town/battle loops are synthesized
  from square/triangle/noise waves into WAVs in `assets/sfx/`.

Regenerate any time:

```bash
python3 tools/make_sprites.py
python3 tools/make_audio.py
```

## What's in this build

- **Real movement = in-game movement.** Your steps become miles (~2000/mi), or tap
  **Start Run** for GPS-tracked outdoor miles (`expo-location`). Distance auto-advances
  you along the trail. No pedometer (desktop/sim)? Stand-in buttons appear — but only
  in a **development** build, because a button that adds distance you did not walk is
  the one thing this game must not ship.
- **Trail discoveries.** As you move, the route reveals encounters — either a
  **befriendable companion** or a **bad-habit obstacle** (Sludgewad, the Snooze, ...).
- **Challenge = real exercise.** Your active companion helps; your real push-ups,
  squats, and planks build resolve, and every set you confirm is counted. Offer a
  **Kinship Knot** to a companion that has seen you do the work and is still standing;
  **Rotate** your Circle; clear obstacles for growth + bond.
- **Build a Circle.** Keep your first bonded companion and befriend companions
  encountered on the trail. Set your active buddy from the **Circle** screen.
- **Goal-tuned pacing.** Your chosen goal tunes milestone spacing, encounter cadence,
  and workout XP over the same shared mechanics.
- **Three places you walk around, where the room is the menu.** Maple Lane, the gym
  (Quest Fitness) and your own house. Walk into a rack to write a session, the treadmill
  to run it in the room with a real console (time, distance, laps, pace, kcal, sets,
  reps), Coach for a session off the shelf, the turf for walking stretches, the mats for
  bodyweight work, the kitchen shelf for 74 recipes, your bed to log last night.
- **Trail Credit**, earned only by moving — never bought — and spent at the gym's
  smoothie bar.
- **Life modules** (hydration, nourish, sleep, stillness) and the **Workout Forge**:
  build your own plans, with a 3D muscle map and on-device analysis.
- Plus: Status, Creature Index, Bag, your Week, recovery advice, a domain-locked AI
  Coach, level-ups + evolutions, full persistence, original art + chiptune audio.

## Phase 2 — AI Companion Coach (domain-locked chat)

Chat with your companion from the town **Coach** menu. It answers **only**
fitness, exercise, nutrition, hydration, and recovery questions:

- **Pre-send guardrail** (`src/coach/guardrail.js`) classifies each message and
  refuses off-domain / jailbreak attempts locally, in-character.
- **Domain-locked, jailbreak-resistant system prompt** enforced server-side; user
  text is treated as untrusted. No medical advice — injuries are referred out.
- **The Anthropic API key never ships in the app.** The client talks to a minimal
  proxy in `server/` that holds the key. Uses the official `@anthropic-ai/sdk`
  (default model `claude-opus-5`, override with `COACH_MODEL`).

Setup is in **`server/README.md`** — run the proxy, then start Expo with
`EXPO_PUBLIC_COACH_API_URL` pointing at it. Without it, the Coach screen still
runs (guardrail + persona) but won't produce live replies.

## Roadmap

See `CLAUDE.md` for the phase-by-phase history and `docs/GAME_BIBLE.md` for every
system with its exact numbers. Next up: reading the recorded reps and sets back out
in the Week view and the Coach's brief, and a design pass on Route 1.

## Tech

Expo (React Native) · expo-sensors (Pedometer + accelerometer fallback) ·
expo-location (GPS) · expo-camera (the form-check mirror) · expo-gl + three (the
3D muscle map) · AsyncStorage · expo-av · @expo-google-fonts/press-start-2p ·
expo-keep-awake. No navigation or state library — one reducer and a small router.

