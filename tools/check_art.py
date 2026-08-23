#!/usr/bin/env python3
"""Check that every committed reference master really is the source of its art.

ART_KIT calls the PNGs in tools/reference_art/ "the visible source files", and
docs/ACCOUNTS-era check_docs.py counts them. Counting files is a weak claim: it
cannot tell a genuine source from a PNG somebody rendered back OUT of the
shipped indexed art, and a round-trip would satisfy the counter while leaving
the actual question — what was this traced from — unanswered.

So this asserts the stronger thing. For each master it re-runs
convert_reference.py and compares the result to the committed
`traced_<id>.json`. If they match, the master genuinely produces the art the
game ships, and regenerating from source is reproducible rather than hoped for.

It also reports which companions have NO master. That number is meant to be
visible: `dewbble`'s art exists only as indexed JSON — no source image is in the
repo or anywhere in its history — and a gap that is stated stays fixable, while
a gap papered over with a re-render stops being noticed at all.

    python3 tools/check_art.py
"""

import json
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / 'tools' / 'reference_art'


def family_chains():
    """root -> [stage ids], read out of creatures.js so it cannot drift."""
    src = (ROOT / 'src' / 'data' / 'creatures.js').read_text(encoding='utf-8')
    evolves = dict(re.findall(r"^  (\w+): \{$\n(?:.*\n)*?    evolvesTo: '?(\w+)'?,", src, re.M))
    roots = re.search(r"WILD_COMPANION_IDS = \[([^\]]+)\]", src).group(1)
    roots = re.findall(r"'(\w+)'", roots)
    chains = {}
    for root in roots:
        chain, cur = [], root
        # `evolvesTo: null` is how a final form is written, and the regex reads
        # it as the word "null" — a stage nobody has.
        while cur and cur != 'null' and cur not in chain:
            chain.append(cur)
            cur = evolves.get(cur)
        chains[root] = chain
    return chains


def expected_traced_for(stem, chains):
    """Which traced_<id>.json a master with this filename is the source of.

    The trail families keep neutral stage filenames — pebblepup_stage2.png is
    the source of traced_cairnhound.json — so the mapping comes from the
    evolution chain rather than from the filename.
    """
    m = re.fullmatch(r'(\w+?)_stage(\d)', stem)
    if not m:
        return stem
    root, stage = m.group(1), int(m.group(2))
    chain = chains.get(root, [])
    return chain[stage - 1] if len(chain) >= stage else None


def main():
    chains = family_chains()
    masters = sorted(p for p in ART.glob('*.png'))
    reproduced, broken, orphaned = [], [], []

    for master in masters:
        target = expected_traced_for(master.stem, chains)
        traced = ROOT / 'tools' / f'traced_{target}.json' if target else None
        if not traced or not traced.exists():
            orphaned.append(master.stem)
            print(f'ORPHAN {master.stem:<22} produces no traced art the game uses')
            continue
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            out = tmp.name
        result = subprocess.run(
            [sys.executable, str(ROOT / 'tools' / 'convert_reference.py'), str(master), out],
            capture_output=True, text=True)
        if result.returncode != 0:
            broken.append(master.stem)
            print(f'FAIL   {master.stem:<22} converter failed: {result.stderr.strip()[:60]}')
            continue
        same = json.loads(pathlib.Path(out).read_text()) == json.loads(traced.read_text())
        pathlib.Path(out).unlink()
        if same:
            reproduced.append(master.stem)
            print(f'ok     {master.stem:<22} -> traced_{target}.json')
        else:
            broken.append(master.stem)
            print(f'DRIFT  {master.stem:<22} no longer produces traced_{target}.json')

    # Which companions ship art with no committed source at all.
    covered = {expected_traced_for(p.stem, chains) for p in masters}
    everyone = [cid for chain in chains.values() for cid in chain]
    sourceless = [c for c in everyone if c not in covered]

    print()
    print(f'{len(reproduced)} of {len(masters)} masters reproduce the art the game ships.')
    if sourceless:
        print(f'{len(sourceless)} companion(s) ship art with NO committed source: {", ".join(sourceless)}')
        print('  Their traced JSON is the only artefact. Re-rendering a PNG out of it would')
        print('  satisfy a file count without answering what the art was traced from, so the')
        print('  gap is reported instead. See docs/ART_KIT.md.')

    if broken or orphaned:
        print(f'\n{len(broken) + len(orphaned)} problem(s) above.')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
