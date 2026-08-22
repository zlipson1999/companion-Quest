# The art kit

Sproutle is traced from reference artwork. It is the reference every other
companion is built against, so the roster reads as one family instead of two
art styles sharing a screen.

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
