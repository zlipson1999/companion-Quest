# Companion-family reference art

These transparent PNGs are the visible source files for the committed part of
the companion roster: **17 of the 18**. `sproutle` and `emberkit` plus the
signed KEEP evos (Bloomtail, Groveheart, Pyrelynx, Cindermane, Tidewade,
Maelstride) are traced from the pixel sheets. **`dewbble` still has no master**
— stage 1 stays the shipped teardrop. `docs/ART_KIT.md` states the gap, and
`tools/check_docs.py` counts the files in this directory so the number cannot
drift back to "all 18". The Pebblepup, Wispurr and Sporelet families were
generated as original project artwork and then given a separate alpha-extraction
pass.

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
