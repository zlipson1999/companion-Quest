# The art kit

Companions are designed as reference art, isolated, and traced. Indexed
outputs live as `tools/traced_<name>.json`. `build_all()` prefers a traced
file over anything drawn; a `traced_*.json` that reaches no sprite fails
the build. A trail face without a master fails the build. There is no
`sphere()` stand-in.

**53 transparent masters** are committed in `tools/reference_art/`
(top-level `*.png` only; approval lineups sit in `lineups/` and are not
counted). That is the original 17 of 18 plus all 36 trail-family forms.
**`dewbble` still has no master** — stage 1 stays the shipped teardrop.
`python3 tools/check_art.py` verifies that each master still REPRODUCES
the art the game ships.

The quality bar is the approved trail lineups in
`tools/reference_art/lineups/` (Maple, Cairn, Gale, Canopy). Maple and
Cairn sit on a flat field and split cleanly. Gale and Canopy are scenic
plates — their ship masters were re-generated isolated, not split out of
the forest/sky.

The authored world-material atlas lives in `assets/textures/masters/`.
`tools/convert_texture_atlas.py` turns its cells into indexed runtime tiles.
Tiles and props may still fall back to a procedural drawing.

## The first rendition type

Character creation and companion creation are the same job. A plate of
three designed faces, then one figure extracted and traced.

- **People** — `assets/characters/player-selection-lineup-v1.png` through
  `convert_character.py --figure N`. The Create Your Character screen
  shows that plate.
- **Companions** — Sproutle / Emberkit / Dewbble are the first-bond
  plate (the original traced kit). Trail families use the approved
  lineups in `tools/reference_art/lineups/`. The Create Your Companion
  screen shows the starter plate the same way.

`sphere()` + `eye()` is not this type. It copies the belly and the eyes
and loses the design. A missing master fails the build.

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
  shown large and at rest: intro, character creation, the Quest Fitness welcome.
- **Overworld** — `traced_walk_<name>.json`, the card traced at 26x48 (30x48 for
  Maple), and the rest of the set derived from that one pose by `walk_set()`:
  two stride frames per facing, a back view made by covering the face with the
  hair colour sampled from the top of the head, and a side view made by
  narrowing the figure toward its own centre line (`right` is the mirror). The
  drawn `hero()` set stays as the fallback for a build with no cards.

  This replaced an authored 24x32 set. The authored version was the right call
  while the sprite had to be square and chunky, but it only ever *matched* the
  card's colours; the traced walk set **is** the card. The cost is that the
  figure is tall and slim, so `TileMap` sizes characters by the height they
  should stand and lets width follow from the sprite's own aspect — sizing by
  width made a 26x48 figure nearly twice the height of the old one.

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

## Props

Furniture and equipment are **transparent overlays** stacked on whatever floor
their room has, never tiles with a floor baked in. That keeps one sofa usable in
any room, and it lets each prop pick the palette it actually needs — foliage
green, appliance grey, terracotta bedding — without dragging a mismatched patch
of floor in with it. A prop carrying its own floor is the same mistake that made
the ground go patchy when the autotiles were generated procedurally.

## Resolution, and why tiles are an image now

Tiles are **32px**, authored on the same 16-unit grid and resolved at twice it.
`Canvas` supersamples its shapes, so the same drawing code emits genuinely
smoother art rather than a doubled-up copy; only `put()`, which is explicit
pixel placement, fills a block. `mottle` and the field textures write straight
into the resolved buffer (`_set`, `rect_px`) so their detail stays the same size
on screen as the resolution rises instead of being doubled along with it.

That was only affordable because **tiles render from a PNG atlas** rather than
through `PixelArt`, which emits a View per colour run per row. Measured before
the change: one 16x16 grass tile was 236 Views and an 11x11 map about 28,000.
At 32px that would have been four times as many. Cropping one shared image
costs a couple of hundred nodes for a whole map however detailed the art is —
the live page went from 28,000+ to about 1,350 for the entire screen.

`emit_tile_atlas()` packs every `tile_*` and `prop_*` into
`assets/tiles/tile-atlas.png` with a frame table in `src/data/tileAtlas.js`, and
**leaves their grids out of `sprites.js`** — shipping both would be a megabyte
of dead JSON parsed on every cold start. Characters and creatures stay on
`PixelArt`: only a few are on screen at once, and they need runtime palette
swaps for outfits, which an atlas cannot do.

Raising resolution further is now a question about atlas file size rather than
frame rate: change `TILE_SCALE`, re-run the two tools.

## Interiors

Rooms get the same treatment the outdoors got. `home_floor_field` lays boards
half a tile deep with per-plank tone, grain streaking along the length, staggered
butt joints and the odd knot; `home_wall_field` is soft-blotched plaster rather
than the outdoor stone, which made a house read as a castle; `gym_floor_field`
is flecked rubber, which is what makes it read as rubber and not as flat paint
at this size.

Three tuning notes worth keeping, all the same mistake in different clothes.
Boards at 11px deep with a hard seam per course read as **brickwork**; a
vertical drift of 0.05 on plaster reads as **corrugated iron**; and the second
attempt at floorboards read as brickwork AGAIN for a different reason — every
course the same depth, every plank within a rounding error of the same tone, and
the butt joints coming round twice per field. Regular short rectangles all one
colour is a wall, whatever you meant by it. What makes wood read as wood is that
no two boards match: wide per-plank tone spread, grain hard enough to see, each
board crowning slightly so its middle catches light, and joints that are RARE.

The house's wall and floor were also both warm browns off the same furniture
ramp, so a room had no visible corners. Interior plaster has its own `plaster`
palette now — cool and pale against a honey board floor — and that difference IS
the edge of the room.

`light_pool()` bakes a ceiling fixture's pool into a floor field. A field is
exactly one fixture cell across, so the pools land on a regular grid for free
and the floor between them falls away instead of being one flat sheet. Drawn as
its OWN dithered layer first, which is what a single-colour overlay has to do to
fake a gradient, and at this tile size the scatter read as television static laid
over the rubber. It belongs in the material's own ramp. Where a dither IS
unavoidable — the zone joints — use an **ordered Bayer threshold**, which reads
as a ramp where hash noise reads as static. Note it is deliberately NOT applied
to walls: a wall is vertical, and running the pool across it put a visible 2x2
grid of soft blobs on the plaster.

**Zone joints.** Wood, turf, matting, rug and kitchen vinyl all butt against
another material somewhere, and a dead-straight value step four tiles long reads
as a grid line even when neither material does. `zone_edge(side)` draws the
joint from inside the zone: a zone is an INLAY, so it gets a dark joint all
round, its north and west inner edges in the shadow of the lip above them, and
its south and east edges catching the light that gets in. Composited at 0.34.

**Multi-tile furniture autotiles.** Drawn whole in every tile it occupied, a
two-tile sofa was two sofas with four arms and a two-tile wardrobe was two
wardrobes — the same mistake as the kitchen run where every counter had its own
sink. `RUN_PROPS` picks `_l`/`_m`/`_r` from a prop's own horizontal neighbours,
exactly the way a path picks its edge, so what runs the length of the piece is
shared and only the end moves. The shadow underneath has to run the length too,
or the join has daylight beneath it.

**Buildings get their form from their own shape**, not from extra codes
somebody has to remember to place: a roof with no roof above it takes
`prop_ridge` (capping tiles, sky on the top edge, the shadow it throws down the
pitch), a wall with a roof above it takes `prop_eave`. Roofs are two rows deep —
one row of shingle has no apex, so a building read as a coloured rectangle with
a strip under it.

**A mirrored wall has to stack.** The first mirror framed its glass on all four
sides, which is fine for three panels and wrong for seventeen: stacked, it puts
a rung across the wall every sixteen pixels, which is the tile grid redrawn by
hand in the one room that had just had its grid taken out of the floor. The
glass runs the full height of the tile, the only frame is the vertical edge, and
the variant that breaks up a long wall is a VERTICAL reflection band — a
diagonal streak would be chopped off at every boundary.

`emit_room_light()` writes `assets/tiles/room-light.png`, a soft elliptical
falloff stretched across the whole map under the player. Every other shading cue
is baked per tile and therefore repeats with the field; this is the only one
that can describe the room as a whole, and it carries real alpha, which the
atlas does not.

## Fields — why the grid stopped showing

Autotiling fixed the joins *between* materials. It did nothing about the repeat
*within* one: a 16x16 grass tile stamped across a field puts an identical
16-pixel patch on every square, and the eye reads that as chunks however good
the tile is.

Large materials are **fields** instead. `convert_texture_atlas.py` resolves the
same atlas cell at 64x64, and `field_slices()` cuts it into a 4x4 block of
tiles that line up edge to edge. `TileMap` picks the window by world position
(`groundKey`), so the texture runs continuously across four tiles and its repeat
is four times further apart, with no seam inside the block at all. Grass, path,
water, canopy, walls and roofs all work this way; the indoor floors are the same
idea drawn procedurally (`home_floor_field`, `gym_floor_field`).

Two details matter:

- **The field has to actually tile.** The atlas cells are inset a few pixels to
  keep the separator lines out of the game, and that inset breaks whatever
  tiling the painted swatch had — invisible over 16px, a clear seam every four
  tiles at 64px. `make_seamless()` cross-fades the cell with its own half-roll
  so every border pixel comes from the middle of the original.
- **Nothing drawn per tile may land on a tile edge.** The indoor floors drew
  their board and panel seams at fixed positions, which drew the grid for us.
  Across a field the boards run for four tiles and the butt joints stagger
  course by course, and the gym's panel joints sit two tiles apart at low
  contrast.

Decoration follows the same rule: flowers are a transparent overlay
(`prop_flowers`), not a tile, because a solid 16x16 square of different texture
in the middle of continuous grass is exactly the chunk being removed.

## Autotiling

A path drawn as one sprite per square butts a hard edge against the grass, and
a pond is a rectangle. That straight seam is what made the overworld read as a
spreadsheet — the eye follows the joins and sees the grid rather than the ground.

Each material is generated once per **cardinal-neighbour mask** instead
(`tile_path_m0`..`m15`, `tile_water_m0`..`m15`). Any side without a same-material
neighbour has the material pulled back along a noisy boundary, with the ground
showing through, a rim just inside it, and a thin scatter of material dithered
out into the ground. Two open sides meet at a corner and round it for free.
Diagonals are four small overlay sprites (`tile_path_ic_ne` and friends) rather
than widening the mask to eight bits, which would be 256 tiles per material.

`TileMap` computes the mask, stacks the layers, and adds contact shading
(`tile_ao_n` / `_w` / `_nw`, composited at 34% opacity) onto ground that sits
south or east of anything solid, since world light is upper-left.

**Blends are built from the painted tiles, not drawn again.** `blended_tile()`
composites the committed atlas art per mask. The first attempt generated the
masks procedurally, which laid hand-drawn tiles next to atlas tiles and turned
the field patchy — the same grid problem in a different colour. For the same
reason the extra ground variants are **flips** of the painted originals
(`flipped_traced`): identical palette, identical average value, different
pattern. Four evenly-shuffled ground variants also read as a patchwork, so
`variantFor` keeps roughly two thirds of cells on the plain tile and scatters
the rest.

## Why tracing at all

`sphere()` + `eye()` can light a ball. It cannot design a face. The first
trail pass used that path and shipped twelve blobs that could be swapped
by palette name. That recipe is not how a new companion is made.

A drawn reference is the art. The converter downsamples it, quantises it,
and writes `tools/traced_*.json`. `load_traced()` wins over anything
generated for that name.

## The first six families (Sproutle kit)

The original six families were traced from their own masters. Their
shared look — tall-in-a-96, wide head, low eyes, belly patch — is a
description of **those** sprites, not a template for the next one.
Copying it is how a maple-key and a crystal cluster both come out as
green balls.

## The style rules (lighting, not a body plan)

- Outline is the darkest colour of **that** creature's own ramp, never a
  shared black ink, and varies in weight.
- Shadows are **hard-edged flat shapes**, not gradients. Two shadow tones
  and one highlight per colour is the whole budget.
- Key light is upper-left. A thin rim sits on the lower-right silhouette.
- Small scattered accent marks (veins, moss, flecks) break up large flats.

## Adding another companion

The quality bar is the approved trail lineups in
`tools/reference_art/lineups/` (Maple, Cairn, Gale, Canopy). Each face is
a designed object, not a lit primitive. The prompt that produced them —
and the only prompt to use — is `tools/CHARACTER_PROMPT.md`.

1. Approval: a three-face lineup so the silhouettes can be compared.
2. Ship: one isolated master per id, flat `#000000` or transparent, no
   ground. Split a flat-backdrop lineup with `tools/split_lineup.py`;
   scenic plates (sky, forest) must be re-generated alone.
3. `python3 tools/convert_reference.py tools/reference_art/<id>.png tools/traced_<id>.json`
4. `python3 tools/make_sprites.py` and read `tools/sprite_preview.png`.

People (Coach Maple, the player) stay on `tools/convert_character.py`.
This section is companion creatures only.

If the ship master is missing, stop and make the master. There is no
`sphere()` fallback. Evolutions get their own isolated master; a tinted
copy of the base is the same mistake as the blob pass.
