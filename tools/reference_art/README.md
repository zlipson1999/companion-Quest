# Companion-family reference art

These transparent PNGs are the visible source files for all six three-stage
companion families. The first-bond-family evolutions were isolated from concept
images supplied by the project owner on 2026-08-22; `pyrelynx.png` was
reconstructed from the family design after its original local attachment became
unavailable. The Pebblepup, Wispurr and Sporelet families were generated as
original project artwork and then given a separate alpha-extraction pass.

Generate an indexed source with:

```bash
python tools/convert_reference.py tools/reference_art/bloomtail.png tools/traced_bloomtail.json
python tools/make_sprites.py
```

Stage filenames for the three wild families remain neutral until names receive
formal clearance. Their semantic `tools/traced_<name>.json` outputs are the
runtime source. Keep provenance and commercial-use clearance for every source
image with the release records; repository presence is not a rights determination.
