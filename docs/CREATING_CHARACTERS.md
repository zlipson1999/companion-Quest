# Creating companions and people

This is the how-to. The executable generation prompt is
`tools/CHARACTER_PROMPT.md`. `python3 tools/check_art.py` is the gate.
Read the hard reject in the prompt **before** you draw or generate.

**100% original expression.** Do not use another franchise as a design
specification. Names, silhouettes, and art must stand on their own.

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

### Worked fails

- Stillcup / Dewbasin / Rainhold — same moss bowl, mouth tweak only
- Kitefin / Ribbonsail / Skysheet — same kite, stage 2 is bigger, stage 3 is stage 1
- Whistlet / Reedgale — identical flute-bird
- Lanternbud line — closed bud never opens
- Chockit / Crackwedge / Cliffchock — same wedge plus an outline
- Dapple / Leaflight — stage 3 is stage 1 again

### Worked passes

- Spinseed (winged seed) → Whirlkey (same seed, walking legs) → Samaraile
  (stacked key-sail stalk, no longer a hovering bulb)
- Bramblet (vine knot) → Briarthicket (walking thicket, four roots) →
  Hedgeroot (rooted hedge)
- Rubblet (three stones) → … → Dolmenhold (walking doorway) — but note
  Cairnstack failed because it was still three stones

`creatures.js` requires a complete three-stage family or none at all.
`check_art.py` fails a family whose masters or traced grids are
near-identical (silhouette IoU + colour difference). If the check fails
on committed art, the art is wrong; do not loosen the gate.

## The first rendition type

Character creation and companion creation are the same job: a plate of
designed faces, then one figure extracted and traced.

- **People** — `assets/characters/player-selection-lineup-v1.png` through
  `convert_character.py --figure N`.
- **Companions** — design with `tools/CHARACTER_PROMPT.md`. A trail
  lineup is three species. A family plate is baby / adolescent / adult
  of one species. Isolate each face (`split_lineup.py` on a flat field,
  or a fresh isolated generate for scenic plates). Trace with
  `convert_reference.py`.

`sphere()` + `eye()` is not this type. A missing master fails the build.
A tinted or scaled copy of an earlier stage fails `check_art.py`.

## After the PNG exists

```bash
python3 tools/convert_reference.py \
  tools/reference_art/<id>.png \
  tools/traced_<id>.json
python3 tools/make_sprites.py
python3 tools/check_art.py
python3 tools/check_docs.py
```

See `docs/ART_KIT.md` for sizes, palettes, and why tracing exists.
