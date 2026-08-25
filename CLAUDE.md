# Companion Quest — project context for Claude

Read this first. It's the working memory for anyone (including a fresh Claude
session) picking up this repo.

**Deep reference: `docs/GAME_BIBLE.md`** — the full audit of every system with
the exact numbers (formulas, reward tables, timings, save schema, known gaps).
This file is the summary; the bible is the source of truth for tuning. If you
change a number in code, change it there in the same commit — and **run
`python3 tools/check_docs.py`**, which compares the bible's figures against the
source and fails on drift. That rule used to rely on memory and the bible went
thirty commits stale on it: save version 5 documented against 8 in code, 21
screens against 28. Every one of those commits was individually fine.

## What this is

An original **creature-companion wellness adventure** where **real fitness is
the engine**. Built with Expo (React Native), testable in Expo Go.

**Non-negotiables:**
- **100% original expression and documented provenance.** Do not use another
  franchise as a design specification. Names, silhouettes, art, audio, copy,
  screen composition, progression, world fiction, and marketing must stand on
  their own. Familiar abstract mechanics are not permission to copy their
  recognizable presentation or combine them into a lookalike product.
- **Real life is the game.** No "walk" buttons — movement comes only from the
  real pedometer / GPS. Battles are real exercise. The companion grows from real
  behavior. The `__DEV__` step injector stays gated.
- **Companion Quest presentation:** paired trail/log panes, tactile pixel art,
  a field-journal palette, hard-edged panels, typewriter dialogue, original
  exercise-challenge composition, original chiptune + 8-bit SFX, and accessible
  growth ceremonies. No platform or franchise trade dress is a target.
- **No secrets in the client.** The Anthropic key stays in `server/`.
- **Numbers live in two places and must agree.** Change `GAME_BIBLE.md` in the
  same commit; run `python3 tools/check_docs.py`. Never delete a guard to make
  a check pass.
- **Movement ids in `src/data/movements.js` are permanent.** Add freely; never
  rename or remove one.

## How to run & verify

```bash
npm install
npx expo start          # scan QR with Expo Go
npm test                # docs, art, server syntax, auth + friends
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

On the web there is no pedometer, so `useDistance` reports none available. The
stand-in step buttons are `__DEV__`-gated, and `__DEV__` is false in every
release build **including the published web build** — so the web page shows the
world and the systems but cannot advance distance. The real engine is only there
on a phone, deliberately: buttons that add distance you did not walk are the one
thing this game is built not to have.

## Table of contents

| Doc | What it is |
|---|---|
| `docs/GAME_BIBLE.md` | Numbers, formulas, save schema, known gaps |
| `docs/CREATING_CHARACTERS.md` | How to add a companion or a person. Read this before drawing. |
| `docs/ART_KIT.md` | Sizes, palettes, tiles, people vs creatures |
| `docs/AGENTS.md` | Verification loop, honesty, import-time asserts |
| `docs/HISTORY.md` | The thirteen phase write-ups, verbatim |
| `docs/AUDIT.md` | Current repo findings |
| `docs/DEBRIEF.md` | One-page honest debt, what landed, what is still open |
| `docs/UI_SYSTEM.md` | Trailkeeper surfaces (`FieldCard` / `TrailAction`) |
| `docs/ACCOUNTS.md` | Friends, boards, day-sync, privacy |
| `docs/STEP_COUNTING.md` | Pedometer vs accelerometer |
| `tools/CHARACTER_PROMPT.md` | The approval-lineup and ship-master prompts |

## Characters and art

**Traced from designed reference art is the path. Procedural is the exception.**
Tiles, items, and module icons may still be drawn by `tools/make_sprites.py`.
Companions and people are not composed from `sphere()` + `eye()`. That copies
a belly and two highlights and loses the face. The quality bar is the first
rendition type: a plate of three designed objects, then one figure extracted
and traced. See `docs/CREATING_CHARACTERS.md` and `tools/CHARACTER_PROMPT.md`.

- **Companions** ship as a complete 3-stage family or not at all: baby /
  adolescent / adult — three different creatures that read as one life.
  A tint, scale, crop, or outline of the same pose is not a stage. Three
  1024×1024 regenerations of one prompt are not a family.
  `python3 tools/check_art.py` **fails** a family whose stages are too
  similar. If that check fails on committed art, the art is already wrong;
  do not loosen the gate.
- **People** ship a finished traced portrait plus a full 4×3 overworld set
  (`convert_character.py --figure N` from `assets/characters/`).
- After generating, **read `tools/sprite_preview.png`**. The checkers cannot
  see whether a face is good.
- **Audio** — `tools/make_audio.py` synthesizes SFX + town/battle loops to
  `assets/sfx/`.
- **Fonts:** pixel font everywhere via `PixelText`. No unicode arrows/hearts —
  use `<Triangle>` or words.

Rendered sizes: creatures 96×96, hero walks 26×48 (Coach 30×48) at 4 facings ×
3 frames, items and module icons 24×24, tiles 32px (`TILE_SCALE = 2`). Palettes
are ramp specs; `SPRITE_PALETTES` is emitted into `src/data/sprites.js`.
`<PixelArt>` / `<PixelSprite>` honour the requested `size` exactly.

## Architecture (the important part)

Modular `/src`: `theme`, `data`, `state`, `screens`, `components`, `coach`,
`audio`. Plus `server/` (Phase 2 proxy) and `tools/` (asset generators).

**Progression is module-agnostic — this is the key design.** Everything that
should grow the companion dispatches the SAME reducer actions
(`GAIN_XP`, `GAIN_BOND`, `COMPLETE_WORKOUT`, `ADD_DISTANCE`, `WIN_BATTLE`,
`CATCH`, ...) into one reducer (`src/state/GameContext.js`). New "life modules"
plug into that same flow without touching battle/route code. The Route and
Workouts modules are the first two examples of the pattern. `GAIN_BOND` has no
caller today; rewards reach bond through `applyEffect`. It stays because
modules are offered `{xp,bond,heal}` on that contract.

**Step counting has two sources** (`src/state/useDistance.js`). The OS step
counter is preferred — it counts with the screen off — but it is not always
reachable, notably inside Expo Go. When it is not, `src/state/stepDetector.js`
counts steps off the accelerometer: peak detection with hysteresis and a
refractory gap, foreground-only. See `docs/STEP_COUNTING.md`.

**State shape** (persisted to AsyncStorage, auto-migrated by `version`, currently
**11**): `{ started, goalId, playerOutfit, playerGender, party:[{id,baseId,xp,
bond,evo,hp,charm}], activeIndex, credits, stats, bag, discoveredCharms, dex,
modules, history, settings, meta, trails }`. Companion XP is a lifetime total; level/HP are derived
(`src/state/leveling.js`). `useCompanion()` returns the active party member;
`useParty()` returns the whole team. Distance is in miles (`stats.distanceMi`);
outdoor bicycle work is also kept separately in `stats.cyclingMi` and
`stats.ridesDone`.
**Trail quotas** (miles + challenge reps) live in `state.trails` and only
increment when `ADD_DISTANCE` / `LOG_EXERCISE` carry a `routeId` — gym cardio
must not pass one. A full Circle (6) makes `CATCH` a no-op. The only start-over
is Options → Erase Save (`RESET`); the title has no reset on purpose. Signing
in makes the save durable: the account stores the whole blob (`server` `/save`,
`src/state/cloudSave.js`) — a started device always wins, the cloud only fills
an empty one.

**Navigation:** a tiny custom router (`src/screens/Router.js` + `navContext`) —
`navigate(name)` and `toBattle(params)`. Register new screens in `Router.js`
(SCREENS map + TOWN_BGM) and give them a way IN — normally a station on a map
(`interactions` in `data/maps.js`), not a hub menu entry. It lists six places now;
training, the Forge, habits, bag, record and coach are reached by walking into
the equipment that does them.

**Data-driven:** creatures/goals/items/exercises/obstacles/wild/workouts/maps all
live in `src/data/*` as plain objects. Add content there.

**The overworld** (`components/TileMap.js`) draws real 32px tile sprites. Floors
are zones, not tile codes. Furniture is the interface.

**Life modules:** `src/modules/` — `daily.js` is the calendar + reward engine
(pure, no React). `index.js` is the registry. Nothing outside `src/modules`
names a specific module. Install list is Hydration, Nourish, Forge, Sleep,
Stillness. `forge/perks.js` — 9 perks, each with its own test and a
plain-language reason.

**Coach:** domain-locked chat. Pre-send guardrail refuses off-domain / jailbreak
in-character. The Anthropic key stays server-side. `check_docs.py` compares
both copies of the jailbreak regex and the refusal line.

**Trail Credit** cannot be bought. Minted by real effort only (`economy.js`).
The smoothie bar spends it. A Kinship Knot is offered, never thrown.

**Friends / boards** live on the same proxy. The unit of sync is a **day**,
never a lifetime total. See `docs/ACCOUNTS.md`.

## What's already built (pointer)

Phases 1–15 are done. The write-ups — how the gym became the menu, why
Back goes where you came from, why a day is what syncs — live in
`docs/HISTORY.md`. Phase 6 ideas (reading / chores / charts / Coach-proposed
Forge plans) are still ideas.

UI: `src/theme/tokens.js` plus `FieldCard` / `TrailAction` / `ObjectiveRibbon`.
This is additive — `palette` still works. Several screens still use
`Window` / `PixelButton`; see `docs/AUDIT.md`.

## Conventions & guardrails

- Match the surrounding code style; keep files modular (no single-file dumps).
- Comments explain intent, not the obvious.
- Don't ship secrets in the client — the coach key stays in `server/`.
- After a change, follow `docs/AGENTS.md`: run the checkers, bundle, report
  honestly what you could not verify.
- **Nothing published is current** until `main` is what you just built.
  `.github/workflows/web.yml` publishes Pages from `main`.
