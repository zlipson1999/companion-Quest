# Companion-family reference art

Top-level `*.png` files are isolated **ship masters**.
`python3 tools/check_docs.py` counts those files; approval lineups live
in `lineups/` and are not in that count.

**Original six families.** All 18 forms have a master. Sproutle, Emberkit
and Dewbble are the first-bond plates (Create Your Companion): isolated
from a magenta field, not re-rendered from indexed JSON. Their stage-2/3
forms (Bloomtail/Groveheart, Pyrelynx/Cindermane, Tidewade/Maelstride)
are separate creatures — baby / adolescent / adult — not tints. The
approval plate is `lineups/firstbond.png`. Pebblepup is now a
first-rendition family (magenta keyed out): sitting mosaic puppy →
standing dry-stone cairnhound → jagged dolmen-beast monolithound.
Filenames stay `pebblepup.png` / `pebblepup_stage2.png` /
`pebblepup_stage3.png` (mapped through `check_art.py`). Sporelet /
Mycobloom / Canopore now ship as named masters (magenta keyed;
stage-1 sparkles and stage-3 spore sparks stay). Wispurr still uses
the stage-filename pattern.

**Trail families.** Designed faces, not lit spheres. The approved
lineups (`lineups/maple.png`, `cairn.png`, `gale.png`, `canopy.png`) are
the species bar — look at them, do not ship them.

**Frostpine Reach.** Pinepuff → Rimecone → Frostbough. First-rendition
plates, magenta keyed; white snow and ice-blue eyes stay. Family plate:
`lineups/pinepuff_family.png`.

**Thunderstep Highlands / Static Ridge.** Zapram → Voltibex → Stormhorn.
First-rendition plates, magenta keyed; electric blue, gold, and white
cloud-fur stay. Stocky kid → slender lightning-horn ibex → navy cloud-mane
stag. Not the navy constellation horse (Glintfoal). Named masters
`zapram` / `voltibex` / `stormhorn`. Family plate:
`lineups/zapram_family.png`.

**Horizon.** Mireblink → Lunareed → Fenoracle is the Moonfen / Silver Reed
Walk line (marsh firefly-frog). Named masters, magenta keyed. Stage-1
reeds and the lime throat orb stay. Stage 2 is a four-legged leaf-stag;
stage 3 is a moon-cape walker with six orbiting lights. The approval
plate is `lineups/mireblink_family.png`.

**Each family is three different creatures that read as one life**
(baby / adolescent / adult). A tint, scale, crop, or outline of the
same pose is not a stage. The Gale/Canopy and Lanternbud/Chockit/Dapple
lines were remade so `python3 tools/check_art.py` passes. Stillcup is
the moss-kid / bowl-sleeper / walking-basin line (named masters
`stillcup` / `dewbasin` / `rainhold`; pink rim flowers stay). Dusthorn is
the first 40-family spec line: stout horned-toad / lean spiked runner /
sun-rune stone golem (named masters `dusthorn` / `mesaquill` /
`suncerast`; magenta chroma keyed, yellow runes stay). Do not
loosen the check. The skill is `tools/CHARACTER_PROMPT.md`.

**Bellbun family (Bluebell Downs / Petalwind Path).** Named masters
`bellbun` / `chimehare` / `bloomrunner`. Magenta chroma keyed; green
leaves, purple blush, and bluebell flowers stay. Stage 1 is a plump
periwinkle kit whose ears are single bells. Stage 2 is a lithe hare
with stalk-ears (three bells each) and a leaf collar — not a recolor
of the kit. Stage 3 is a fox-silhouette bloom guardian (fennec ears
packed with petals, forehead rune, leaf wrist-guards, floral tail).
Approval plate: `lineups/bellbun_family.png`.

**Nectlet family (Amber Orchard / Honeyfall Lane).** Named masters
`nectlet` / `combwing` / `apiarch`. Magenta chroma keyed; golden
honeycomb and amber stay. Stage 1 is a chibi fawn with honeycomb
inner ears and a raccoon-striped tail. Stage 2 is a slender buck
with wooden antlers and four comb wings — not a recolor of the kid.
Stage 3 is a standing deer-bee guardian (spaulders, split cape,
amber-crystal polearm). Approval plate: `lineups/nectlet_family.png`.

**Chipmagma family (Obsidian Hollow / Glassfire Descent).** Named
masters `chipmagma` / `shardscale` / `obsidrake`. Magenta chroma
keyed; lava orange stays. Stage 1 is a chubby obsidian gecko with
magma in the cracks. Stage 2 is a spiked quadruped beast (slit
pupils, throat vein) — not a smiling gecko. Stage 3 is a bipedal
volcanic guardian (red brow rune, molten chest core, heated-glass
claws). Approval plate: `lineups/chipmagma_family.png`.

**Brineling family (Tideglass Coast / Saltglass Strand).** Named masters
`brineling` / `shoregleam` / `tidecrown`. Magenta chroma keyed; pink
coral limbs and lavender growths stay. Stage 2 is a standing pearl-plate
humanoid, not a recolor of the shell hermit. Stage 3 is the tall
wave-armor guardian (white pupil-less eyes, chest pearl). Approval plate:
`lineups/brineling_family.png`.

- **Maple and Cairn** sit on a flat field. Split with
  `tools/split_lineup.py`, then convert. Stage-1 masters
  (`spinseed`, `bramblet`, `lanternbud`, `rubblet`, `chockit`,
  `facetel`) are committed here. The Spinseed line was remade from
  attached family plates (`spinseed` / `whirlkey` / `samaraile`) —
  do not split `maple.png` back over those three. Evolutions need
  their own isolated masters that would fail a same-silhouette check
  against stage 1.
- **Gale and Canopy are lineup-only.** Those plates are scenic (sky,
  forest). `split_lineup.py` refuses them. Re-generate each face alone
  with the Ship master prompt in `tools/CHARACTER_PROMPT.md` (flat
  `#000000`, no ground). Do not commit a forest-matted sprite. Do not
  regenerate one 1024×1024 prompt three times and call it a family.

Isolate one creature, then:

```bash
python3 tools/convert_reference.py \
  tools/reference_art/spinseed.png \
  tools/traced_spinseed.json
python3 tools/make_sprites.py
python3 tools/check_art.py
python3 tools/check_docs.py
```

Do not add a `sphere()` function for a new face. The first-rendition
drawing that already ships for a Gale/Canopy face or a trail evolution
is a gap to close, not a template. Keep provenance and commercial-use
clearance for every source image with the release records; repository
presence is not a rights determination.
