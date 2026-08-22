# Companion-family reference art

These transparent PNGs are the visible source files for the committed part of
the companion roster: **15 of the 18**. The three first-bond BASE forms —
`sproutle`, `emberkit`, `dewbble` — have `traced_<name>.json` but no master
here, and none is in the history either, so for those three the committed chain
starts at the indexed output rather than at a source image. That is a provenance
gap to close, not a naming quirk; `docs/ART_KIT.md` states it too, and
`tools/check_docs.py` counts the files in this directory so the number cannot
drift back to "all 18". The first-bond-family evolutions were isolated from concept
images supplied by the project owner on 2026-08-22; `pyrelynx.png` was
reconstructed from the family design after its original local attachment became
unavailable. The Pebblepup, Wispurr and Sporelet families were generated as
original project artwork and then given a separate alpha-extraction pass.

Generate an indexed source with:

```bash
python tools/convert_reference.py tools/reference_art/bloomtail.png tools/traced_bloomtail.json
python tools/make_sprites.py
```

Stage filenames for the three trail families are the semantic ones —
`pebblepup.png`, `pebblepup_stage2.png`, `pebblepup_stage3.png`, and the same
for `wispurr` and `sporelet` — matching `WILD_COMPANION_IDS` in
`src/data/creatures.js`. (They were meant to stay neutral pending name
clearance; that is not what the directory does, so the sentence saying so has
been removed rather than left describing a policy nothing follows.) Their
`tools/traced_<name>.json` outputs are the runtime source. Keep provenance and commercial-use clearance for every source
image with the release records; repository presence is not a rights determination.
