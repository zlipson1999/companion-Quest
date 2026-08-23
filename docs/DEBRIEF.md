# Companion Quest — debrief

One page. 2026-08-23. Against `main` after #30, #33, and #35.

This is not a changelog. It is what an agent (or a human) should believe
before they touch the repo.

## What this game is

Real fitness is the engine. Companions grow from miles, sessions, habits,
and rest — never from a walk button. Presentation is original. Provenance
is required. Numbers live in `docs/GAME_BIBLE.md` and must agree with
code (`python3 tools/check_docs.py`). Do not delete a guard to make a
check pass. Do not lift the `__DEV__` step injector.

## What already landed on `main`

| PR | What it closed |
|---|---|
| #30 | Slim `CLAUDE.md`, 3-stage family guard, `npm test`, instruction rewrite |
| #33 | First-morning empty states (A26–A30), Options `forgetAll` |
| #35 | Hydrate fixture (A5), `coachTutorial` unregistered (A1), unused `dusk` (A6), sourceless art fails `check_art.py` (A10/A25), grown-form copy (A32) |

House stairs and the front door (A2/A3) were already on `main` via #28.
Play-quality and Trailkeeper UI live on #31/#32 if those are still open.
#35 is already merged on this branch.

## Honest debt (still true after this PR unless named below)

- **Phone unproven.** Pedometer, GPS non-duplication, Expo Go vs standalone,
  kill/resume. The published web build cannot walk, by design.
- **Accounts unproven.** Apple/Google handshakes need real client ids and a
  device. Downstream HTTP tests exist (`npm --prefix server run test:friends`).
- **Coach proxy undeployed.** Chat is unavailable in production.
- **Obstacles are still procedural.** Six blobs. That is written down.
- **No release contract, no CI quality gate, no privacy policy.**
- **A16/A17** — Trailkeeper migration unfinished; `PixelButton` ignores
  `scale.touchMin`.
- **A18/A19** — first-run walking beat and on-scene web-trail copy live on
  the play-quality branch if it has not merged.
- **Full Circle** is a designed no-op (A33), not a bug.
- **Stage bar is closed on this branch.** `check_art.py` passes all 18
  families. Do not loosen the gate.

## What this PR closes

- **A11 Dewbble.** The player attached the missing first-rendition plate:
  stout teardrop, medium blue, pale belly/face, pointed crown, glossy
  dark-blue eyes with two highlights each, tiny smile, 3-finger arms,
  4-toe feet, upper-left specular, magenta backdrop. That IS the Dewbble
  master. Isolated from the magenta field (pink is backdrop, not body),
  committed as `tools/reference_art/dewbble.png`, traced. This PR does
  **not** re-render `traced_dewbble.json` back to a PNG.
- **A12 first-bond approval lineup.** The same three attached plates —
  Sproutle, Emberkit, Dewbble — are the Create Your Companion plate.
  Isolated, then composed as `lineups/firstbond.png`. Same type as
  Maple/Cairn and the player card. All three first-bond lines are
  complete first-rendition families: Sproutle → Bloomtail → Groveheart,
  Emberkit → Pyrelynx → Cindermane, Dewbble → Tidewade → Maelstride.
  Ids are permanent. Stage 2/3 are their own creatures, not tints.
- **Stage bar remakes** for the clone trail families (Stillcup, Kitefin,
  Whistlet, Lanternbud, Chockit, Dapple, Loftburr, and the rest of
  Gale/Canopy). Each remade stage has its own isolated master and
  `traced_<id>.json`. Ids are permanent. `check_art.py` now passes all
  18 families.

## What we searched before the plates arrived

`tools/reference_art/`, `assets/`, `tools/traced_dewbble.json`, every git
ref (`git log --all -- '*dewbble*'`), and twelve stashes. Result: JSON
only for Dewbble; tiny pixel-sheet masters for Sproutle and Emberkit.
The attached plates closed that gap. Do not invent a Dewbble PNG from
the indexed grid.

## How to verify

```
python3 tools/check_docs.py
python3 tools/check_art.py
python3 tools/make_sprites.py
node --check server/index.js
EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir /tmp/cq
```

Read `tools/sprite_preview.png` and `tools/reference_art/lineups/firstbond.png`.
The checkers cannot see whether a face is good.

## What this debrief is not

A feature list. A licence to treat another franchise as a design spec.
If a figure in the bible moves, it moved in the same commit as the
code. The stage bar passing means the silhouettes differ — it does
not mean every face is final.
