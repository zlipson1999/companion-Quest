# Approval lineups

These plates are the quality bar for companion design. They are
**for looking at**, not for `convert_reference.py`. The first-bond plate
is the three attached Create Your Companion faces, isolated from magenta.

| File | Trail | Faces | Backdrop |
|---|---|---|---|
| `firstbond.png` | First bond | Sproutle, Emberkit, Dewbble | Ground strip — lineup only |
| `originalsix.png` | Original six stage-1s | Sproutle, Emberkit, Dewbble, Pebblepup, Wispurr, Sporelet | Ground strip — lineup only |
| `dapple_family.png` | Dapple family | Dapple, Glimmoth, Leaflight | Isolated first-rendition — lineup only |
| `sporelet_family.png` | Sporelet family | Sporelet, Mycobloom, Canopore | Ground strip — lineup only |
| `maple.png` | Maple | Spinseed, Bramblet, Lanternbud | Flat field — splits |
| `cairn.png` | Cairn | Rubblet, Chockit, Facetel | Flat field — splits |
| `gale.png` | Gale | Whistlet, Kitefin, Loftburr | Scenic sky — lineup only |
| `canopy.png` | Canopy | Fernap, Dapple, Stillcup | Scenic forest — lineup only |
| `stillcup_family.png` | Stillcup family | Stillcup, Dewbasin, Rainhold | Ground strip — lineup only |
| `propfin_family.png` | Propfin family | Propfin, Mangrusk, Rootback | Magenta field — lineup only |
| `clinket_family.png` | Clinket family | Clinket, Bellstride, Canyonchime | Magenta field — lineup only |
| `glintfoal_family.png` | Glintfoal family | Glintfoal, Astramare, Cometmane | Magenta field — lineup only |

The locked prompt that produced them is `tools/CHARACTER_PROMPT.md`.
A lineup is three **species**. Each species still owes a family plate
— baby / adolescent / adult — that passes the hard reject in that
file. Three regenerations of one pose are not a family.

```bash
# Flat field only. Gale/Canopy will refuse without --force.
python3 tools/split_lineup.py \
  tools/reference_art/lineups/maple.png \
  --names spinseed,bramblet,lanternbud \
  --out tools/reference_art
```

A scenic plate that has been `--force`d is muddy. Re-generate those
faces isolated. Do not ship the result.

Family plates (`*_family.png`) are baby / adolescent / adult of one
species. They are for looking at. Each stage still ships as its own
isolated master under `tools/reference_art/<id>.png` (or
`<root>_stageN.png`). `pebblepup_family.png` is Pebblepup /
Cairnhound / Monolithound.
