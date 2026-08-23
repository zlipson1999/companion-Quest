# Creating characters

This is the procedure. `CLAUDE.md` is not a drawing manual. Read this before
you add a companion or a person.

The first trail pass composed `sphere()` + `eye()` blobs. Those read as the
same creature in twelve palettes. They are forbidden. The quality bar is the
**first rendition type**: a plate of three designed objects, then one figure
extracted and traced. Look at `tools/reference_art/lineups/` (Maple, Cairn,
Gale, Canopy) before you start.

The executable generation prompt is `tools/CHARACTER_PROMPT.md`.
`python3 tools/check_art.py` is the gate. Read the hard reject in the prompt
**before** you draw or generate.

## Quality bar (enforced)

1. **A companion ships as a complete 3-stage family or not at all.**
   `creatures.js` throws at import if a catchable root's `familyChain` is
   shorter than 3. `tools/check_art.py` fails the same way.
2. **Each stage is its own professionally finished art.** Baby / adolescent /
   adult — three different creatures that read as one life. A tint, scale,
   crop, or outline of the same pose is not a stage. Evolutions get their
   own isolated master, their own `traced_<id>.json`, and their own entry
   in `CREATURES`.
3. **People ship a finished traced portrait plus a full 4×3 overworld set.**
   Portrait from the card. Walk set from `walk_set()` off one traced standing
   pose. Both go through `tools/convert_character.py`, not the creature tracer.
4. **Traced is the default. Procedural is the exception.** Tiles, items, and
   module icons may still be drawn. Companions and people are not.
5. **Provenance is required.** A `traced_*.json` for a companion must have a
   committed master that still reproduces it, or an explicit `provenance`
   block saying why it does not. `check_art.py` fails on a silent gap.
   **Do not close a gap by rendering a PNG out of the indexed JSON.**
6. **Eyeball `tools/sprite_preview.png` after `make_sprites.py`.** The
   checkers cannot see whether a face is good.

`sphere()` + `eye()` is not this type. It copies the belly and the eyes and
loses the design.

## The stage bar (companions)

**Each companion family is three different creatures that read as one life.**

- Stage 1 = **baby**: smaller, simpler, incomplete. A seed, a closed bud, a
  three-stone stack, a coil. Cute is allowed. A finished adult shrunk down
  is not a baby.
- Stage 2 = **adolescent**: the form is becoming. New limbs, opened petals,
  extra stones, longer reed, unfurling frond. You can name what grew. If
  you cannot, it is not stage 2.
- Stage 3 = **adult**: a new silhouette. A standing sail, a hedge, a
  path-lamp, a dolmen, a cliff hitch, a wind instrument, a sky sheet, a
  shelter-frond. Someone who never saw stage 1 should still know this is
  the grown form of that creature — and should never mistake it for
  stage 1.

**Hard rejects (any one fails the family):**

- Same pose, same silhouette, different name
- Stage 2 or 3 is a scale-up, crop, outline, or tint of an earlier stage
- Stage 3 is simpler than stage 1 or snaps back to stage 1
- All three are 1024×1024 regenerations of one GenerateImage prompt
- You need a difference map to tell them apart

**The one-line test:** show the three pictures to someone who cannot read
the filenames. They must say "that's a kid, that's a teen, that's the
grown one" without being told.

### Worked fails (historical — remade)

These used to fail the stage bar. They have been redrawn. The list
stays so nobody ships the old pose three times again.

- Stillcup / Dewbasin / Rainhold — same moss bowl, mouth tweak only;
  remade as cabbage-crown moss-kid → bowl-shouldered sleeper →
  walking basin (face in the chest, overflowing water, pink rim flowers)
- Kitefin / Ribbonsail / Skysheet — same kite, stage 2 is bigger, stage 3 is stage 1
- Whistlet / Reedgale — identical flute-bird
- Lanternbud line — closed bud never opens
- Chockit / Crackwedge / Cliffchock — same wedge plus an outline
- Dapple / Glimmoth / Leaflight — stage 3 was stage 1 again; remade as
  rotund kawaii moth → slender camo flyer → four-leaf moth
- Loftburr / Driftpuff / Cloudburr — three 1024 regenerations of one parachute

### Worked passes

- Sproutle (two-leaf baby) → Bloomtail (opened flower) → Groveheart
  (standing grove)
- Emberkit (sitting cub) → Pyrelynx (standing flame-ear lynx) →
  Cindermane (fire-mane beast)
- Dewbble (dewdrop) → Tidewade → Maelstride
- Stillcup (moss-kid, cabbage crown, rain pearl) → Dewbasin
  (bowl-shoulders, oblong sleeper head) → Rainhold (walking basin,
  face in the chest). Never a tinted bowl.
- Dapple (rotund kawaii moth) → Glimmoth (slender tattered-leaf flyer) →
  Leaflight (four serrated leaf-wings, banded abdomen). Never the same round puff.
- Spinseed (winged seed) → Whirlkey (same seed, walking legs) → Samaraile
  (stacked key-sail stalk, no longer a hovering bulb)
- Bramblet (vine knot) → Briarthicket (walking thicket, four roots) →
  Hedgeroot (rooted hedge)
- Rubblet (three stones) → … → Dolmenhold (walking doorway)

`check_art.py` fails a family whose masters or traced grids are
near-identical (silhouette IoU + colour difference). If the check fails
on committed art, the art is wrong; do not loosen the gate.

## Provenance block

Every companion `traced_<id>.json` is either:

- produced by `convert_reference.py` from `tools/reference_art/<id>.png`
  (or `<root>_stageN.png` for a later stage), and still byte-equal to a
  fresh convert — `check_art.py` proves this — or
- carrying a top-level object:

```json
"provenance": {
  "status": "gap",
  "note": "No source image exists in the repo or its history. Indexed JSON is the only artefact. Do not close this with a re-render."
}
```

`make_sprites.py` ignores extra keys. `check_art.py` does not ignore a missing
master without this block. Dewbble no longer uses a gap block — it has a
committed isolated master that reproduces the traced JSON.

## Companions — worked example (Maple Trail, already shipped)

The Maple plate is three designed objects: a maple-key, a walking thorn-knot,
a closed bud that holds sap-light. Not three balls.

### 1. Write the design (before you draw)

In `src/data/creatures.js`, a family is three objects. Movement-style rule:
**ids are permanent.** Add freely; never rename.

```js
spinseed: {
  id: 'spinseed', stage: 1, name: 'Spinseed', sprite: 'spinseed', palette: 'samara',
  species: 'Samara Companion', kind: 'wild', type: 'grove',
  baseHp: 56, catchable: true, catchRate: 0.55,
  flavor: 'A maple-key spirit. It helicopters beside you for as long as you keep walking.',
  evolvesTo: 'whirlkey', evolveLevel: 5, evolvePoints: 30,
},
whirlkey: { /* stage 2, catchable: false, evolvesTo: 'samaraile' */ },
samaraile: { /* stage 3, catchable: false, evolvesTo: null */ },
```

Put the stage-1 id in `TRAIL_COMPANION_IDS` (or `STARTER_IDS` / the wild
list). `INDEX_ORDER` is derived. The import-time guards fail if the family
is short or an id reaches no Index row.

### 2. Design the approval lineup

Use the prompt in `tools/CHARACTER_PROMPT.md` (Approval lineup). Three faces,
full body, 3/4 view, shared ground. **Look at it.** If you could swap two
by changing the palette, start over.

A trail lineup is three species. A family plate is baby / adolescent / adult
of one species. Commit the plate under `tools/reference_art/lineups/<trail>.png`.

### 3. Make isolated ship masters

A lineup cannot go into `convert_reference.py`. After approval:

- Flat-backdrop plate: split it.

```bash
python3 tools/split_lineup.py \
  tools/reference_art/lineups/maple.png \
  --names spinseed,bramblet,lanternbud \
  --out tools/reference_art
```

- Scenic plate (forest, sky): regenerate each face alone on `#000000`.
  Do not matte scenery onto the creature. Pass the lineup as a reference
  image when you regenerate.

Each evolution is its own isolated master, same rules. Filename is the
creature id (`whirlkey.png`) or `<root>_stageN.png` (see `check_art.py`
`expected_traced_for`).

### 4. Trace

```bash
python3 tools/convert_reference.py \
  tools/reference_art/spinseed.png \
  tools/traced_spinseed.json
python3 tools/make_sprites.py
python3 tools/check_art.py
python3 tools/check_docs.py
```

### 5. Eyeball

Open `tools/sprite_preview.png`. Check silhouette at a glance, eyes (two
specular dots), material that belongs to THAT body, outline in the creature's
own darkest colour, no shared ink, no ball.

### 6. Wire the rest

- Palette spec in `tools/make_sprites.py` `PALETTE_SPECS` if you need a new
  ramp; otherwise reuse an existing key and point `CREATURES[id].palette` at it.
- Encounter table: `src/data/wild.js` / `src/data/routes.js` if they appear
  on a trail.
- Register nothing in `Router.js`. The Index picks them up from `INDEX_ORDER`.

### Checklist — companion family

- [ ] Three stages, three names, three silhouettes (baby / adolescent / adult)
- [ ] Approval lineup committed under `lineups/`
- [ ] Isolated master per stage (or a documented `provenance` gap)
- [ ] `traced_<id>.json` per stage
- [ ] `CREATURES` entries; root listed; `evolvesTo` chain ends at `null`
- [ ] `python3 tools/check_art.py` exits 0
- [ ] `python3 tools/check_docs.py` exits 0 (roster counts)
- [ ] `tools/sprite_preview.png` looked at
- [ ] No `sphere()`, no tinted copy, no franchise silhouette

## People — worked example (the player plate, already shipped)

People go through `tools/convert_character.py`. The creature tracer targets a
96×96 box at 24 colours, which is right for a compact animal and wrong for a
person.

### 1. The plate

`assets/characters/player-selection-lineup-v1.png` is three faces. The Create
Your Character screen shows that plate. Coach Maple has her own card.

### 2. Trace the portrait

```bash
python3 tools/convert_character.py \
  assets/characters/player-selection-lineup-v1.png \
  tools/traced_portrait_woman.json \
  --box 64x128 --colors 44 --figure 0

python3 tools/convert_character.py \
  assets/characters/coach-maple.png \
  tools/traced_portrait_maple.json \
  --box 88x128 --colors 44
```

`--figure N` is 0-based on the lineup. Defaults in the CLI match none of the
outputs; the docstring is the source of truth.

### 3. Trace the standing pose, derive the walk set

```bash
python3 tools/convert_character.py \
  assets/characters/player-selection-lineup-v1.png \
  tools/traced_walk_woman.json \
  --box 26x48 --colors 26 --figure 0
```

`walk_set()` in `make_sprites.py` derives 4 facings × 3 frames from that one
pose. You do not hand-draw twelve grids.

### 4. Register

`src/data/characters.js` is the single resolver:

```js
{ id: 'woman', name: 'Woman', prefix: 'hero_woman', portrait: 'portrait_woman' }
```

`playerSprite` / `playerPortrait` / `coachSprite` / `rowanSprite` all go
through here. A new person is a table row plus the traced files, not a
search for every `hero_down` literal.

### 5. Eyeball

Same preview. A person must read as the card at rest (portrait) and as the
card walking (overworld). If the overworld is a different stranger, the walk
trace is wrong.

### Checklist — person

- [ ] Finished lineup or solo card committed
- [ ] `traced_portrait_<id>.json` at the documented `--box` / `--colors`
- [ ] `traced_walk_<id>.json` at the documented walk box
- [ ] Row in `CHARACTERS` (or Coach/Rowan resolver)
- [ ] Palette ramps: `body` clothing, `leaf` hair, `belly` skin, `accent` trim
- [ ] `make_sprites.py` + `check_art.py` + eyeball of `sprite_preview.png`

## Commands (copy these)

```bash
python3 tools/split_lineup.py tools/reference_art/lineups/maple.png \
  --names spinseed,bramblet,lanternbud --out tools/reference_art
python3 tools/convert_reference.py tools/reference_art/spinseed.png tools/traced_spinseed.json
python3 tools/make_sprites.py
python3 tools/check_art.py
python3 tools/check_docs.py

python3 tools/convert_character.py CARD.png tools/traced_portrait_NAME.json --box 64x128 --colors 44 --figure N
python3 tools/convert_character.py CARD.png tools/traced_walk_NAME.json --box 26x48 --colors 26 --figure N
python3 tools/make_sprites.py

# Read tools/sprite_preview.png
EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir /tmp/cq
```

## What not to do

- Do not compose a companion from `sphere()`, `eye()`, `outline()`, `rim()`.
- Do not ship a family of one or two and "add the rest later".
- Do not tint stage 1 to make stage 2.
- Do not downsample a portrait to make the overworld sprite.
- Do not invent a master by exporting the indexed sprite back to PNG.
- Do not use another franchise as a design specification.
- Do not add a companion without pointing `CREATURES` at the new sprite key
  and palette, and without running the checkers.

## Where the art lives

| What | Where |
|---|---|
| Approval lineups | `tools/reference_art/lineups/` |
| Isolated masters | `tools/reference_art/<id>.png` |
| Traced companions | `tools/traced_<id>.json` |
| Traced people | `tools/traced_portrait_*.json`, `tools/traced_walk_*.json` |
| Runtime sprites | `src/data/sprites.js` (generated) |
| Preview | `tools/sprite_preview.png` |
| Character cards | `assets/characters/` |
| Prompts | `tools/CHARACTER_PROMPT.md` |

See `docs/ART_KIT.md` for sizes, palettes, and why tracing exists.
