# Agent notes

Read `CLAUDE.md` first. This file is the short list of things an
automated session gets wrong.

## Companions

**Each companion family is three different creatures that read as one life.**
Baby / adolescent / adult. A tint, scale, crop, or outline of the same
pose is not a stage. Three 1024×1024 regenerations of one prompt are
not a family.

The executable skill is `tools/CHARACTER_PROMPT.md`. The how-to is
`docs/CREATING_CHARACTERS.md`. The gate is `python3 tools/check_art.py`
— it **fails** a family whose stages are too similar. If that check
fails on art already in the repo, the art is already wrong; do not
loosen the thresholds.

Hard rejects and worked fail/pass examples live at the top of the
prompt. Read them before you generate.

Do not use another franchise as a spec. Do not add walk buttons. Do
not put secrets in the client.

## Docs and numbers

If you change a figure in code, change `docs/GAME_BIBLE.md` in the
same commit and run `python3 tools/check_docs.py`. Never delete a
guard to make a check pass.
