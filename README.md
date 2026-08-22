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
  theme/       palette, pixel typography, metrics
  data/        original creatures, goals, items, exercises, obstacles, workouts,
               hub map, route tuning, generated sprite grids (sprites.js)
  state/       game reducer + context (auto-persist), leveling, storage, pedometer
  components/  PixelArt/PixelSprite, Window, DialogueBox, Menu, HPBar, ProgressBar,
               DualPane, TileMap, Dpad, PixelButton, BattleTransition, Triangle, Screen
  coach/       the companion/Coach's warm, in-character dialogue
  audio/       expo-av sound manager for the original SFX + chiptune loops
  screens/     Title, Intro, GoalSelect, Pairing, Hub, Route, Battle, Workout,
               Rest, Summary, Index, Bag, Options + the Router
assets/sfx/    generated 8-bit WAV SFX + looping chiptune tracks
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

## What's in this build (Phase 1 + 1.5)

- **Real movement = in-game movement.** Your steps become miles (~2000/mi), or tap
  **Start Run** for GPS-tracked outdoor miles (`expo-location`). Distance auto-advances
  you along the trail. No pedometer (desktop/sim)? A dev injector simulates distance.
- **Trail discoveries.** As you move, the route reveals encounters — either a
  **befriendable companion** or a **bad-habit obstacle** (Sludgewad, the Snooze, ...).
- **Challenge = real exercise.** Your active companion helps; your real push-ups,
  squats, and planks build resolve. **Offer Bond** to a receptive companion;
  **Rotate** your Circle; clear obstacles for growth + bond.
- **Build a Circle.** Keep your first bonded companion and befriend companions
  encountered on the trail. Set your active buddy from the **Circle** screen.
- **Goal-tuned pacing.** Your chosen goal tunes milestone spacing, encounter cadence,
  and workout XP over the same shared mechanics.
- Plus: Rest Stop (heals the whole team), Workouts, Status readout, Creature Index,
  Bag, Options, level-ups + evolutions, full persistence, original art + chiptune audio.

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

- **Phase 3 (next):** pluggable life modules, starting with diet/hydration.

## Tech

Expo (React Native) · expo-sensors (Pedometer) · expo-location (GPS, Phase 1.5) ·
AsyncStorage · expo-av · @expo-google-fonts/press-start-2p · expo-keep-awake.

