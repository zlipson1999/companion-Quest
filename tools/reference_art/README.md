# Companion-family reference art

Top-level `*.png` files are isolated **ship masters**.
`python3 tools/check_docs.py` counts those files; approval lineups live
in `lineups/` and are not in that count.

**Original six families.** All 18 forms have a master. Sproutle, Emberkit
and Dewbble are the first-bond plates (Create Your Companion): isolated
from a magenta field, not re-rendered from indexed JSON. Their stage-2/3
forms (Bloomtail/Groveheart, Pyrelynx/Cindermane, Tidewade/Maelstride)
are separate creatures — baby / adolescent / adult — not tints. The
approval plate is `lineups/firstbond.png`. Pebblepup, Wispurr and
Sporelet use `*_stage2.png` / `*_stage3.png` filenames mapped through
the evolution chain in `check_art.py`.

**Trail families.** Designed faces, not lit spheres. The approved
lineups (`lineups/maple.png`, `cairn.png`, `gale.png`, `canopy.png`) are
the species bar — look at them, do not ship them.

**Each family is three different creatures that read as one life**
(baby / adolescent / adult). A tint, scale, crop, or outline of the
same pose is not a stage. The Gale/Canopy and Lanternbud/Chockit/Dapple
lines were remade so `python3 tools/check_art.py` passes. Do not loosen
the check. The skill is `tools/CHARACTER_PROMPT.md`.

- **Maple and Cairn** sit on a flat field. Split with
  `tools/split_lineup.py`, then convert. Stage-1 masters
  (`spinseed`, `bramblet`, `lanternbud`, `rubblet`, `chockit`,
  `facetel`) are committed here. Evolutions need their own isolated
  masters that would fail a same-silhouette check against stage 1.
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
