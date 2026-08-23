# Horizon Cleaned Masters

Transparent, background-free, corner-alpha=0, bottom-aligned centered masters produced by `process_plate.py` (edge flood-fill keying with color_dist < 32 + corner trim for paper/sky).

These 59 forms are the cleaned Horizon line ready for PixelSprite and in-game use. No scaled/recolored/stand-in/placeholder art. Distinct silhouettes preserved.

## Inventory (59)
aeoncoil, alpengait, ammonip, apiarch, ashlark, astramare, aurorermine, bamboar, barkglide, basalisk, bellbun, bellstride, bloomnewt, bloomrunner, bloopot, breakwater, brineling, budice, burrcalf, canyonchime, cavernwing, chipmagma, clinket, combwing, cometmane, coralith, duneshade, dusthorn, fenoracle, ferracorn, frostbough, glintfoal, ironstag, lunareed, mangrusk, mesaquill, mirajinn, mireblink, nailnut, nectlet, obsidrake, pinepuff, pipolyp, plinkbat, prairieguard, propfin, rainvault, and the remaining forms in the horizon plate set.

## Glintfoal line example (verified)
- Baby: glintfoal.png
- Adolescent: astramare.png
- Adult: cometmane.png

## Processing notes
- Source: AI 16-bit family plates → process_plate.py
- Key: flood-fill from edges (tight)
- Trim: is_paper / is_sky from borders
- Center: to_sprite bottom-align
- Output: full transparent masters + 96x96 sprites

See also `tools/lineups/` for contact sheets (horizon_cleaned_contact.png, glintfoal_family.png, roster_stage1.png, roster_stage3.png, etc.).

The binary PNG masters and contact sheets are available for download from the conversation artifacts (horizon_clean/, lineups/, sprites_96/). Add them here and to tools/lineups/ via local commit after download.

Generated / cleaned 2026-08-23.
