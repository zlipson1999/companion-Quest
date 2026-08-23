# Horizon families

Forty original companion families from the uploaded design spec.
Each is a complete baby / adolescent / adult chain. More families
and first-rendition plates are still incoming.

These are **not** on a walkable trail yet. Each family is reserved
for the route/trail named in `src/data/horizon.js`. Maple through
Ember pools stay `{ maple: 3, cairn: 6, gale: 10, canopy: 15, rill: 20, ember: 24 }`.
A companion with no trail is not silhouetted (`isCreatureLocked` is false).

## Art

Masters live in `tools/reference_art/<id>.png`. First-rendition plates
are landed where they already existed (Brineling, Dusthorn, Mireblink,
Pinepuff, Clinket, Glintfoal, Propfin, Zapram, Nectlet, Chipmagma,
Bellbun, Mumblewool — magenta keyed out, never matted into the body).
Bellbun's green leaves, purple blush, and bluebell flowers stay.
Families still waiting on a plate use an interim isolated drawing from
`tools/horizon_kit.py`. When a new plate arrives: replace the master,
re-run `convert_reference.py`, then `make_sprites.py`. Do not invent a
master by exporting indexed JSON to PNG.

## Originality

The spec's **Lotadpole** is registered as `lotuslet` / Lotuslet so the
id does not sit next to another franchise. The rest of that chain is
Bloomnewt → Lotosaur as specified.

Ids are permanent. Do not rename.
