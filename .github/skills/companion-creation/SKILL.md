---
name: companion-creation
description: >
  Design and ship Companion Quest creature companions and their three
  evolution stages. Use when adding a companion, drawing or generating
  a family plate, tracing reference art, or when an agent is about to
  regenerate the same pose three times.
---

# Companion creation

**HARD REJECT.** Each companion family is three different creatures
that read as one life.

- Stage 1 = **baby**: smaller, simpler, incomplete. A finished adult
  shrunk down is not a baby.
- Stage 2 = **adolescent**: the form is becoming. You can name what
  grew. If you cannot, it is not stage 2.
- Stage 3 = **adult**: a new silhouette. Someone who never saw stage 1
  should still know this is the grown form — and should never mistake
  it for stage 1.

Any one of these fails the family: same pose / same silhouette;
scale-up, crop, outline, or tint; stage 3 simpler than stage 1 or
snapping back; three 1024×1024 regenerations of one prompt; you need
a difference map to tell them apart.

**One-line test:** a person who cannot read the filenames must say
"that's a kid, that's a teen, that's the grown one."

Worked fails: Stillcup/Dewbasin/Rainhold (same moss bowl); Kitefin
line (same kite, stage 3 is stage 1); Whistlet/Reedgale (identical
flute-bird); Lanternbud never opens; Chockit line (same wedge);
Dapple/Leaflight (stage 3 is stage 1).

Worked passes: Spinseed → Whirlkey → Samaraile; Bramblet →
Briarthicket → Hedgeroot; Rubblet → … → Dolmenhold (Cairnstack
failed — still three stones).

The locked prompt, the family-plate template, and the ship-master
template are in `tools/CHARACTER_PROMPT.md`. The how-to is
`docs/CREATING_CHARACTERS.md`. After PNGs exist:

```bash
python3 tools/convert_reference.py tools/reference_art/<id>.png tools/traced_<id>.json
python3 tools/make_sprites.py
python3 tools/check_art.py
python3 tools/check_docs.py
```

`check_art.py` **enforces** the stage bar. Do not loosen it so a
clone family passes. Do not invent a `sphere()` stand-in. 100%
original expression — no franchise as spec.
