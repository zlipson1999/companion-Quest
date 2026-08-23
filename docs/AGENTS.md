# How an agent should work in this repo

This is the verification loop. It is not optional. A change that cannot be
checked is a change you report as unchecked, not a change you call done.

## Before you edit

1. Read `CLAUDE.md` (current rules) and the bible page that owns the number
   you are about to touch.
2. If you are adding a companion or a person, stop and read
   `docs/CREATING_CHARACTERS.md`. Do not invent a `sphere()` stand-in.
3. If you are changing a map, you will walk the room after (below).
4. Do not treat another franchise as a design specification.

## Verification loop

After every iteration of changes:

```bash
git add -A && git commit && git push
python3 tools/check_docs.py
python3 tools/check_art.py
python3 tools/make_sprites.py && git diff --stat assets src/data/sprites.js
python3 tools/make_audio.py && git diff --stat assets/sfx
node --check server/index.js
npm --prefix server run test:auth
# friends test needs the proxy up; see docs/ACCOUNTS.md
EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir /tmp/cq
npx expo export --platform web --output-dir dist
```

Or `npm test` for the checkers + server syntax + auth + friends (it starts
the proxy itself).

`check_docs.py` failing means a human decides which side is wrong. Never
edit a checker to silence a number. Never delete a guard to make a check
pass.

`make_sprites.py` / `make_audio.py` writing a dirty tree means the generated
files were stale, or you changed a generator. Look at the diff. Do not
commit a silent rewrite of `hit.wav` unless you meant to.

The Android export must end with `Android Bundled ... index.js (N modules)`.
That is the whole Metro graph. The server is outside it.

## Screenshots for UI

A UI change is not verified by a bundle succeeding. Export web or run Expo,
take a screenshot of the screen you touched, and look at it. Pixel font, 44px
touch minimum (`tokens.scale.touchMin`), Trailkeeper surfaces
(`FieldCard` / `TrailAction` / `ObjectiveRibbon`) when the screen has moved
off `Window` / `PixelButton`. If you cannot run a device, say so.

## Walk the room after map changes

`maps.js` asserts grid size and that a trigger letter is not also a shared
interaction. That does not prove a door leads where you think.

After editing a grid or `interactions`:

1. List every new or moved code.
2. Confirm it has a sprite (`PROP_SPRITES` / `TILE_SPRITES` / `FIELD_CODES`)
   or is a drawn person (`C` / `A`).
3. Confirm bump-to-use does the thing the room claims (or is label-only).
4. Walk in, use the station, come back — `placeMemory` should put you on
   the same square. Stairs and doors must work in both directions.

The noticeboard was added on `G` once and Sunkist Lane's north gate became
a cork board. Both tables were well formed. The only symptom was a door
that led somewhere else.

## Import-time-assertion idiom

This repo fails at import rather than as a blank screen.

| Guard | File |
|---|---|
| Map grid matches claimed cols/rows | `src/data/maps.js` |
| Trigger letter is not also a shared interaction | `src/data/maps.js` |
| Every creature reaches an Index row | `src/data/creatures.js` |
| Every catchable family is 3 stages | `src/data/creatures.js` |
| Recipe `logAs` is a real Nourish action | `src/data/recipes.js` |
| Traced art that reaches no sprite | `tools/make_sprites.py` `build_all()` |
| Master still produces shipped art | `tools/check_art.py` |
| Traced companion art has provenance | `tools/check_art.py` |
| Doc figures match code | `tools/check_docs.py` |
| Client/server coach guardrail match | `tools/check_docs.py` |

When you add a table that can drift, add an assert next to it. A comment
that says "don't forget" is how the Character Index listed 13 of 22.

## Report honestly

In every PR body:

- What changed.
- What you verified, with **actual command output**. Do not invent a
  bundle line.
- **What I could not verify.** Apple/Google handshakes need real client
  ids. Pedometer/GPS need a phone. A release web build cannot walk.

If a change would weaken a non-negotiable (original expression, real life
is the game, no secrets in the client, numbers agree, movement ids
permanent), stop and write down the conflict.

## What not to do

- Do not lift the `__DEV__` step injector.
- Do not put the Anthropic key in the client.
- Do not change a progression number without changing the bible in the
  same commit and running `check_docs.py`.
- Do not rename a movement id.
- Do not delete a failing guard.
- Do not treat `CLAUDE.md` as a changelog. History is `docs/HISTORY.md`.
