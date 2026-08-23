#!/usr/bin/env python3
"""Check companion art: families, provenance, and that masters still reproduce.

ART_KIT calls the PNGs in tools/reference_art/ "the visible source files".
Counting files is a weak claim: it cannot tell a genuine source from a PNG
somebody rendered back OUT of the shipped indexed art.

This asserts the stronger things:

- Every catchable family is exactly 3 stages (same rule as creatures.js).
- Every companion traced_<id>.json has provenance: a master that still
  produces it, or an explicit provenance.gap block. Silent gaps fail.
- Sourceless companions (no master) are still printed so the Dewbble gap
  stays visible.
- Each committed master is re-run through convert_reference.py and compared
  to the committed traced_<id>.json (palette + rows only, so a provenance
  block on a gap file is not a false drift).

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


def ids_in(src, name):
    block = re.search(rf"{name} = \[([^\]]+)\]", src)
    if not block:
        raise SystemExit(f'check_art: could not find {name}')
    return re.findall(r"'(\w+)'", block.group(1))


def family_chains():
    """root -> [stage ids], read out of creatures.js so it cannot drift.

    WILD_COMPANION_IDS spreads STARTER_IDS and TRAIL_COMPANION_IDS. Reading
    only the one array used to see three families and hide Dewbble.
    """
    src = (ROOT / 'src' / 'data' / 'creatures.js').read_text(encoding='utf-8')
    evolves = dict(re.findall(r"^  (\w+): \{$\n(?:.*\n)*?    evolvesTo: '?(\w+)'?,", src, re.M))
    roots = ids_in(src, 'STARTER_IDS') + ids_in(src, 'TRAIL_COMPANION_IDS')
    for extra in ('pebblepup', 'wispurr', 'sporelet'):
        if extra not in roots:
            roots.append(extra)
    chains = {}
    for root in roots:
        chain, cur = [], root
        while cur and cur != 'null' and cur not in chain:
            chain.append(cur)
            cur = evolves.get(cur)
        chains[root] = chain
    return chains


def expected_traced_for(stem, chains):
    m = re.fullmatch(r'(\w+?)_stage(\d)', stem)
    if not m:
        return stem
    root, stage = m.group(1), int(m.group(2))
    chain = chains.get(root, [])
    return chain[stage - 1] if len(chain) >= stage else None


def traced_payload(path):
    blob = json.loads(pathlib.Path(path).read_text())
    return {'palette': blob.get('palette'), 'rows': blob.get('rows')}


def main():
    chains = family_chains()
    bad = []

    short = [root for root, chain in chains.items() if len(chain) != 3]
    if short:
        print(f'FAIL   families shorter than 3 stages: {", ".join(short)}')
        for root in short:
            print(f'       {root}: {chains[root]}')
        bad.append('short-family')
    else:
        print(f'ok     {len(chains)} companion families are 3 stages')

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
        same = traced_payload(out) == traced_payload(traced)
        pathlib.Path(out).unlink()
        if same:
            reproduced.append(master.stem)
            print(f'ok     {master.stem:<22} -> traced_{target}.json')
        else:
            broken.append(master.stem)
            print(f'DRIFT  {master.stem:<22} no longer produces traced_{target}.json')

    covered = {expected_traced_for(p.stem, chains) for p in masters}
    everyone = [cid for chain in chains.values() for cid in chain]
    sourceless = [c for c in everyone if c not in covered]

    missing_prov = []
    for cid in everyone:
        traced = ROOT / 'tools' / f'traced_{cid}.json'
        if not traced.exists():
            missing_prov.append(cid)
            print(f'FAIL   {cid:<22} has no traced_{cid}.json')
            continue
        blob = json.loads(traced.read_text())
        if cid in covered:
            continue
        prov = blob.get('provenance') or {}
        if prov.get('status') == 'gap' and prov.get('note'):
            continue
        missing_prov.append(cid)
        print(f'FAIL   {cid:<22} traced art has no master and no provenance.gap')

    print()
    print(f'{len(reproduced)} of {len(masters)} masters reproduce the art the game ships.')
    if sourceless:
        print(f'{len(sourceless)} companion(s) ship art with NO committed source: {", ".join(sourceless)}')
        print('  Their traced JSON is the only artefact. Re-rendering a PNG out of it would')
        print('  satisfy a file count without answering what the art was traced from, so the')
        print('  gap is reported instead. See docs/ART_KIT.md and docs/CREATING_CHARACTERS.md.')

    if broken or orphaned:
        print(f'\n{len(broken) + len(orphaned)} master problem(s) above.')
        bad.append('master')
    if missing_prov:
        print(f'\n{len(missing_prov)} companion(s) lack provenance: {", ".join(missing_prov)}')
        bad.append('provenance')
    if bad:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
