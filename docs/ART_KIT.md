# The art kit

All 18 members of the six companion families are traced from reference
artwork. Their transparent masters are committed in `tools/reference_art/`;
their indexed outputs live as
`tools/traced_<name>.json`. This keeps the roster reproducible and prevents the
evolutions from silently falling back to procedural stand-ins.

The authored world-material atlas lives in `assets/textures/masters/`.
`tools/convert_texture_atlas.py` turns its cells into indexed runtime tiles;
`make_sprites.py` still provides procedural fallbacks if a traced asset is absent.

## People

Characters go through `tools/convert_character.py`, not the creature tracer. The
creature tool targets a 96x96 box at 24 colours, which is right for a compact
animal and wrong for a person: a standing figure wastes most of a square canvas
on air, and 24 colours cannot hold a face, hair and layered clothing at once.
The character tool takes an explicit `--box WxH`, a wider palette, `--figure N`
to cut one person out of a lineup card, and closes interior holes left by
downsampling soft-edged paint.

Two tiers, because one card cannot be both:

- **Portraits** — `traced_portrait_{maple,woman,man,nonbinary}.json`, traced
  straight off the committed cards at 64x128 (88x128 for Maple, whose gesturing
  arm widens her crop). These carry the face and are used anywhere the player is
  shown large and at rest: intro, character creation, the Hall welcome.
- **Overworld** — authored in `hero()` at 24x32, four facings x three frames,
  per character. These are *not* downscaled portraits. A realistic 1:3 standing
  figure downsamples to roughly fifteen pixels of width, which cannot hold a
  readable face or a walk cycle; what makes the overworld sprite the same person
  is the palette and the hair silhouette, not a resample.

Each character has a palette spec whose ramps carry fixed roles — `body` is
clothing, `leaf` is hair, `belly` is skin, `accent` is trim and shoes. Only
`body` is ever recoloured, by `outfitPalette()`, using the spans exported as
`SPRITE_RAMPS`. Coach Maple had these crossed (hair drawn on `body`, jacket on
`leaf`, all on the player's navy palette), which is why she rendered as a
blue-haired stranger.

Palettes carrying an `accent` ramp run at `CHARACTER_RAMP_STEPS` rather than
`RAMP_STEPS`, because four ramps do not fit inside the 90-entry sprite alphabet
at the creature ramp length.

### The guard

`build_all()` fails the build if any `tools/traced_*.json` reaches no sprite.
`add()` prefers traced art and falls back to the procedural drawing in silence,
which is how four character cards sat in `assets/characters/` for a release
while the overworld kept drawing the old placeholder people — and every
regeneration reported success. Art nothing consumes is now an error.

## Why tracing at all

The procedural pipeline (`Body`, `Drawn` in `tools/make_sprites.py`) can build a
coherent lit form: one blended surface, one light, creases instead of seams. It
got as far as it could. What it could not supply was **design** — proportion,
where the weight sits, how a face is arranged — and that limit was never the
engine's, it was whoever was driving it.

A drawn reference solves that directly. The artwork is downsampled, quantised to
a hand-ordered palette, and stored as data in `tools/traced_*.json`.
`load_traced()` picks it up and it wins over anything generated for that name.

## The palette

Three ramps, taken from the reference rather than invented. Note that the
outline is **not black** — it is the darkest green, which is what stops a sprite
reading as clip art.

| role | dark → light |
|---|---|
| body green | `#1d3a24` `#25462b` `#2f5531` `#3b6535` `#487337` `#5c8a3a` `#79a435` `#96bd3e` |
| accent / rim | `#b7cc4a` `#d4e35c` `#f2f56e` |
| belly cream | `#a08a5e` `#c7ab7e` `#dbbd94` `#eddcb0` `#fbedc3` `#fefae0` |
| contact ink | `#101a12` |

Eleven steps across the greens is the useful number: enough to turn a form
smoothly, few enough that the steps stay visible and it still reads as pixel art.

## The proportions

Measured off the traced sprite, in a 96-square:

- **Creature occupies 64w × 96h** — noticeably taller than wide. Squat and wide
  reads as a blob; this does not.
- **Head is roughly 40% of total height** and is *wider than the torso*. That
  ratio is most of what makes it read as young rather than as a small adult.
- **Eyes are enormous** — each about a third of the head's width, set low on the
  face, with two specular dots (a large one upper-left, a small one lower-right).
- **Limbs are short and thick**, with visible toes. Thin limbs read as insectile.
- **The belly patch runs most of the body's height**, not a small circular badge.

## The style rules

- Outline is the darkest ramp colour, never black, and varies in weight —
  heavier where forms overlap, lighter along top edges.
- Shadows are **hard-edged flat shapes**, not gradients. Two shadow tones and one
  highlight per colour is the whole budget.
- A bright rim light (`#d4e35c`–`#f2f56e`) runs along the lower-right silhouette.
  The key light is upper-left, which is what the whole renderer assumes.
- Small scattered accent marks (leaf freckles here) break up large flat areas.

## Adding another companion

Best result, and what the kit is for: generate reference artwork with the same
prompt (see the session notes), then run the converter — it keys the background,
quantises to this palette, drops stray components, and writes
`tools/traced_<name>.json`.

Failing that, build it procedurally with `Drawn`, but take the palette and the
proportions above rather than inventing new ones.
