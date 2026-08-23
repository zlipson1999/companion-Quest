# Companion reference prompt

**HARD REJECT — read this before you generate anything.**

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

`python3 tools/check_art.py` **enforces** this. A family whose masters
(or traced grids) are near-identical **fails the check**. Do not loosen
the check so a clone family passes. Redraw the stages.

---

This is the same type as character creation. People start as a
three-face lineup card (`player-selection-lineup-v1.png`) and are cut
out with `convert_character.py --figure`. Companions start as a
three-face plate and are cut out the same way. Sproutle / Emberkit /
Dewbble are the first-bond plate. The approved trail lineups (Maple,
Cairn, Gale, Canopy) are that type on the trail.

A trail lineup is three **species**. A family plate is three **life
stages of one species**. Do not confuse them. The trail plate proves
the three neighbours are different objects. The family plate proves
baby / adolescent / adult. You need both.

The first rendition is the quality bar: designed objects, huge shiny
eyes with two specular dots, a belly or material patch that belongs to
THAT body, short thick limbs, hard-edged 16-bit shading, outline in the
creature's own darkest colour. That is Sproutle's kit and the Maple
plate. It is not a `sphere()` with two `eye()` calls — that copies the
checklist and loses the face.

People (Coach Maple, the player) still go through
`tools/convert_character.py` from the painted card. Companions use this
prompt, then `split_lineup.py` / `convert_reference.py`.

`make_sprites.py` will not invent a trail face. No master means the
build fails.

## Worked fails (do not ship these)

These were committed as the same pose three times. They were remade
as baby / adolescent / adult. The gate still uses the same thresholds
— do not loosen it. If the next agent ships three copies of one pose,
they have not read this file.

- **Stillcup / Dewbasin / Rainhold** — was the same moss bowl
- **Kitefin / Ribbonsail / Skysheet** — was the same kite; stage 3
  snapped back
- **Whistlet / Reedgale** — was an identical flute-bird
- **Lanternbud line** — closed bud never opened
- **Chockit / Crackwedge / Cliffchock** — was the same wedge plus an
  outline; remade as conical chock → standing plate-humanoid →
  cliff-golem (diagonal bands)
- **Dapple / Leaflight** — stage 3 snapped back to stage 1
- **Loftburr / Driftpuff / Cloudburr** — was three 1024 regenerations
  of one parachute

A tinted or scaled copy is not a stage. Three 1024×1024 regenerations
of one prompt are not a family.

## Worked passes

- **Sproutle** (two-leaf baby) → **Bloomtail** (opened flower) →
  **Groveheart** (standing grove)
- **Emberkit** (sitting cub) → **Pyrelynx** (standing flame-ear lynx)
  → **Cindermane** (fire-mane beast)
- **Dewbble** (dewdrop) → **Tidewade** → **Maelstride**
- **Chockit** (conical banded chock) → **Crackwedge** (stood up,
  cracked into plates) → **Cliffchock** (cliff given limbs, diagonal
  strata). Not an outlined wedge.
- **Pebblepup** (sitting mosaic puppy) → **Cairnhound** (standing
  dry-stone wolf) → **Monolithound** (jagged dolmen-beast). Not the
  trail Rubblet / Dolmenhold line.
- **Sporelet** (toadstool kid + sparkles) → **Mycobloom** (plated
  scout, cracked loaf-cap, shoulder fruiting) → **Canopore**
  (rooted canopy, bark legs in moss — not a bigger spotted kid)
- **Spinseed** (tan ribbed seed-kid, fan samara crest) → **Whirlkey**
  (upright veined torso, leaf-wings, three vine legs) → **Samaraile**
  (leaf-armor standing sail, eight golden key-wings — not a bigger seed)
- **Facetel** (incomplete geode, face in the largest crystal) →
  **Prismore** (shard-humanoid, face only in the pink heart-chest) →
  **Quartzspire** (standing prism, closed-eye face on the crown and
  a second in the heart — not a simpler cluster than the baby)
- **Bramblet** (vine knot: berries, pink buds, leaf-hands) →
  **Briarthicket** (walking thicket: humanoid, grapes, four roots) →
  **Hedgeroot** (rooted hedge golem: orange-dot eyes, antlers, bark arms)
- **Rubblet** (three stones) → … → **Dolmenhold** (walking doorway) —
  but note **Cairnstack** failed because it was still three stones

## Approval lineup (look at it)

Scenery is allowed here because the image is for eyes, not the converter.
This plate is three **different species** on one trail. It does not
replace the family plate. After you approve the species, you still owe
three life-stage masters that pass the hard reject above.

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

## Family stage plate (mandatory)

Three life stages of **one** family, left to right: baby, adolescent,
adult. If a viewer cannot rank them by age from the silhouettes
alone, start over. Do not regenerate the same prompt three times.

```
Original pixel-art creature family for a wellness adventure game.
NOT a Pokémon, not a franchise lookalike, not three tints of one pose.

Three life stages of ONE companion family in a horizontal lineup,
full body, 3/4 view, facing slightly left of camera. Shared ground
strip. Soft contact shadow on the ground only. No UI, no names, no
captions, no watermark.

They must read as baby / adolescent / adult without filenames.

1. BABY — smaller, simpler, incomplete. [the OBJECT it is as a seed /
   closed bud / coil / three-stone stack]. NOT a shrunk adult.
2. ADOLESCENT — the form is becoming. Name what grew: [new limbs /
   opened petals / extra stones / longer reed / unfurling frond].
3. ADULT — a new silhouette. [standing sail / hedge / path-lamp /
   dolmen / cliff hitch / wind instrument / sky sheet / shelter-frond].
   Someone who never saw the baby still knows this is the grown form,
   and never mistakes it for the baby.

Hard reject: same pose; scale-up / crop / outline / tint; stage 3
simpler than stage 1 or snapping back; three 1024×1024 regenerations
of one prompt; you need a difference map to tell them apart.

Style: high-craft 16-bit pixel art. Hard-edged flat shadows. Outline
is the darkest colour of THAT stage's own ramp. Key light upper-left.
```

## Ship master (trace it)

A lineup cannot go into `convert_reference.py`. After a lineup is
approved, regenerate each face alone — or split a flat-backdrop
lineup with `tools/split_lineup.py`. Scenic plates (sky, forest)
must be re-generated isolated; do not matte a forest onto a moth.

Each stage gets its **own** isolated master. Do not trace stage 2
from a scaled stage 1.

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

This is [NAME], stage [1 baby / 2 adolescent / 3 adult] of the
[FAMILY] line — [the OBJECT this stage is]. Same face and
silhouette as the approved family plate, isolated. Do not round it
into a ball. Do not redraw an earlier stage larger or tinted.
```

Pass the approved family plate as a reference image when regenerating
an isolated master.

## What "good" looks like

| Trail | Faces | The object, not the ball |
|---|---|---|
| Maple | Spinseed, Bramblet, Lanternbud | Seed between paper samara wings; walking thorn-knot; closed bud that holds sap-light. |
| Cairn | Rubblet, Chockit, Facetel | Three stacked cairn stones; sedimentary climbing wedge; quartz cluster with a face in the heart facet. |
| Gale | Whistlet, Kitefin, Loftburr | Reed-flute bird; diamond kite-ray with ribbon tails; seed-down parachute on thread legs. |
| Canopy | Fernap, Dapple, Stillcup | Coiled fiddlehead; shade-moth with dappled wings; moss bowl holding still water. |

Those are **stage-1 objects**. Their evolutions must become something
else (see Worked passes). Several of the committed stage-2/3 masters
currently fail that — `check_art.py` will say so until they are redrawn.

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

Evolutions get their own isolated master that would fail a
same-silhouette check against the earlier stages. A tinted copy of
the base is the blob pass in a different shirt.
