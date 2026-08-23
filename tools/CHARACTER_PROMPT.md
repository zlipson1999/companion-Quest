# Companion reference prompt

This is the prompt that produced the approved trail lineups
(Spinseed / Bramblet / Lanternbud, Rubblet / Chockit / Facetel,
Whistlet / Kitefin / Loftburr, Fernap / Dapple / Stillcup). Use it
for every new companion and every evolution.

Do **not** describe a chibi mascot, a lit sphere, a belly patch, or
"enormous low-set eyes on a round body". That is the first-rendition
recipe and it is how twelve different names came out as the same blob.
The approved lineups are designed objects: a maple-key with paper wings,
a thorn-knot, a glowing bud, a cairn, a climbing wedge, a crystal
cluster, a reed-flute bird, a kite-ray, a seed-parachute, a fern coil,
a shade-moth, a rain-bowl.

People (Coach Maple, the player) do **not** use this prompt. They go
through `tools/convert_character.py` from a painted character card.

`make_sprites.py` will not invent a trail face. No master means the
build fails.

## Approval lineup (look at it)

Scenery is allowed here because the image is for eyes, not the converter.

```
Original pixel-art creature companions for a wellness adventure game.
NOT a Pokémon, not a franchise lookalike, not a chibi mascot sheet,
not a sphere with eyes, not a shared body recoloured three times.

Three original creatures in a horizontal lineup, full body, standing,
3/4 view, facing slightly left of camera. Shared ground strip under
their feet matching the trail. Soft contact shadow on the ground only.
No UI, no names, no captions, no watermark.

Style: high-craft 16-bit pixel art. Hard-edged flat shadows, not
painterly blends. Two shadow tones and one highlight per colour.
Outline is the darkest colour of THAT creature's own ramp — never
pure black, never a shared ink. Key light upper-left. Thin rim light
along the lower-right silhouette. Texture and material do the work
(ribs, thorns, facets, ribbons, fronds) so each silhouette is
readable at a glance.

Each creature is a distinct designed object. If you could swap two
by changing the palette, start over.

[TRAIL / THEME]. Left to right:
1. [NAME] — [one-sentence original design: the OBJECT it is]
2. [NAME] — [one-sentence original design: the OBJECT it is]
3. [NAME] — [one-sentence original design: the OBJECT it is]
```

## Ship master (trace it)

A lineup cannot go into `convert_reference.py`. After a lineup is
approved, regenerate each face alone — or split a flat-backdrop
lineup with `tools/split_lineup.py`. Scenic plates (sky, forest)
must be re-generated isolated; do not matte a forest onto a moth.

```
Single original pixel-art creature companion for a wellness adventure
game. NOT a Pokémon, not a franchise lookalike, not a chibi mascot,
not a lit sphere with a face.

One creature only, full body, standing, 3/4 view, facing slightly
left of camera, centred. SOLID FLAT BACKGROUND of #000000 with NO
ground, NO grass, NO shadow, NO scenery, NO UI, NO text. The
silhouette must lift cleanly off the field.

Style: high-craft 16-bit pixel art. Hard-edged flat shadows.
Outline is the darkest colour of this creature's own ramp — never
pure black. Key light upper-left. Thin rim light on the lower-right.
Material and silhouette carry the design.

This is [NAME], [the OBJECT it is]. Same face and silhouette as the
approved [TRAIL] lineup, isolated. Do not round it into a ball.
```

Pass the approved lineup as a reference image when regenerating an
isolated master.

## What "good" looks like

| Trail | Faces | The object, not the ball |
|---|---|---|
| Maple | Spinseed, Bramblet, Lanternbud | Seed between paper samara wings; walking thorn-knot; closed bud that holds sap-light. |
| Cairn | Rubblet, Chockit, Facetel | Three stacked cairn stones; sedimentary climbing wedge; quartz cluster with a face in the heart facet. |
| Gale | Whistlet, Kitefin, Loftburr | Reed-flute bird; diamond kite-ray with ribbon tails; seed-down parachute on thread legs. |
| Canopy | Fernap, Dapple, Stillcup | Coiled fiddlehead; shade-moth with dappled wings; moss bowl holding still water. |

## After the PNG exists

```bash
python3 tools/convert_reference.py \
  tools/reference_art/spinseed.png \
  tools/traced_spinseed.json

python3 tools/split_lineup.py \
  tools/reference_art/lineups/maple.png \
  --names spinseed,bramblet,lanternbud \
  --out tools/reference_art

python3 tools/make_sprites.py
python3 tools/check_art.py
python3 tools/check_docs.py
```

Evolutions get their own isolated master. A tinted copy of the base
is the blob pass in a different shirt.
