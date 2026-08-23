# Approval lineups

These four plates are the quality bar for companion design. They are
**for looking at**, not for `convert_reference.py`.

| File | Trail | Faces | Backdrop |
|---|---|---|---|
| `maple.png` | Maple | Spinseed, Bramblet, Lanternbud | Flat field — splits |
| `cairn.png` | Cairn | Rubblet, Chockit, Facetel | Flat field — splits |
| `gale.png` | Gale | Whistlet, Kitefin, Loftburr | Scenic sky — lineup only |
| `canopy.png` | Canopy | Fernap, Dapple, Stillcup | Scenic forest — lineup only |

The locked prompt that produced them is `tools/CHARACTER_PROMPT.md`.

```bash
# Flat field only. Gale/Canopy will refuse without --force.
python3 tools/split_lineup.py \
  tools/reference_art/lineups/maple.png \
  --names spinseed,bramblet,lanternbud \
  --out tools/reference_art
```

A scenic plate that has been `--force`d is muddy. Re-generate those
faces isolated. Do not ship the result.
