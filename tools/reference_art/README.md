# Companion-family reference art

Top-level `*.png` files are isolated **ship masters**.
`python3 tools/check_docs.py` counts those files; approval lineups live
in `lineups/` and are not in that count.

**Original six families.** 17 of 18 forms have a master. `sproutle` and
`emberkit` plus the signed KEEP evos are traced from the pixel sheets.
**`dewbble` still has no master.** Pebblepup, Wispurr and Sporelet use
`*_stage2.png` / `*_stage3.png` filenames mapped through the evolution
chain in `check_art.py`.

**Trail families.** Designed faces, not lit spheres. The approved
lineups (`lineups/maple.png`, `cairn.png`, `gale.png`, `canopy.png`) are
the quality bar — look at them, do not ship them.

- **Maple and Cairn** sit on a flat field. Split with
  `tools/split_lineup.py`, then convert. Stage-1 masters
  (`spinseed`, `bramblet`, `lanternbud`, `rubblet`, `chockit`,
  `facetel`) are committed here. Evolutions still need their own
  isolated masters.
- **Gale and Canopy are lineup-only.** Those plates are scenic (sky,
  forest). `split_lineup.py` refuses them. Re-generate each face alone
  with the Ship master prompt in `tools/CHARACTER_PROMPT.md` (flat
  `#000000`, no ground). Do not commit a forest-matted sprite.

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
