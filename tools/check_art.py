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

And it fails a family whose stages are too similar. A tinted, scaled, cropped,
or outlined copy of the same pose is not a stage. The thresholds were tuned so
Spinseed / Bramblet still pass and Stillcup / Kitefin / Whistlet fail. If this
check fails on committed Gale/Canopy (or Lanternbud / Chockit / Dapple) art,
the art is already wrong — do not loosen the gate.

    python3 tools/check_art.py
"""

import json
import pathlib
import re
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / 'tools' / 'reference_art'


def roster_src():
    """creatures.js + horizonCreatures.js. Horizon roots live in the latter.

    Horizon is concatenated FIRST. Obstacle entries at the end of creatures.js
    have no evolvesTo; if they came first the regex would swallow the next
    family's evolvesTo (Brineling).
    """
    creatures = (ROOT / 'src' / 'data' / 'creatures.js').read_text(encoding='utf-8')
    horizon = ROOT / 'src' / 'data' / 'horizonCreatures.js'
    extra = horizon.read_text(encoding='utf-8') if horizon.exists() else ''
    return extra + '\n' + creatures


def horizon_ids():
    src = roster_src()
    try:
        return set(_expand_id_array(src, 'HORIZON_COMPANION_IDS'))
    except SystemExit:
        return set()

# Letterboxed crop compare. Tuned 2026-08-23 on the committed kit:
#   PASS  spinseed max IoU ~0.66, bramblet ~0.75, sproutle ~0.73
#   FAIL  stillcup/rainhold 0.96, kitefin/skysheet 0.94, lanternbud/gleambud
#         0.92, dapple/leaflight 0.96, crackwedge/cliffchock 0.97
IOU_SAME_SILHOUETTE = 0.90
IOU_NEAR = 0.85
MSE_NEAR = 2500.0
# Full-frame 64² MSE catches same-prompt 1024 regenerations whose ribbons
# jitter enough to drop crop-IoU (whistlet/reedgale ~720, fernap/frondrest ~733).
# sproutle/bloomtail is ~1265; spinseed/whirlkey ~1609.
FULLFRAME_MSE_SAME = 800.0
IOU_SNAPBACK = 0.85
COMPARE_SIZE = 64


def _listed_ids(src, name):
    m = re.search(rf'{name} = \[([^\]]+)\]', src)
    return re.findall(r"'(\w+)'", m.group(1)) if m else []


def traced_payload(path):
    blob = json.loads(pathlib.Path(path).read_text())
    return {'palette': blob.get('palette'), 'rows': blob.get('rows')}


def _array_block(src, name):
    m = re.search(rf"{name} = \[([^\]]+)\]", src)
    if not m:
        raise SystemExit(f'check_art: could not find {name} — has creatures.js moved?')
    return m.group(1)


def _expand_id_array(src, name, seen=None):
    """Read a JS id array, expanding `...OTHER_IDS` spreads.

    WILD_COMPANION_IDS is `[...STARTER_IDS, 'pebblepup', ..., ...TRAIL_COMPANION_IDS]`.
    Walking only the quoted ids inside that one literal missed Dewbble (and
    every other starter and trail root).
    """
    seen = seen if seen is not None else set()
    if name in seen:
        return []
    seen.add(name)
    ids = []
    for spread, lit in re.findall(r"\.\.\.(\w+)|'(\w+)'", _array_block(src, name)):
        if spread:
            ids.extend(_expand_id_array(src, spread, seen))
        else:
            ids.append(lit)
    return ids


def family_chains():
    """root -> [stage ids], read out of creatures.js so it cannot drift.

    WILD_COMPANION_IDS spreads STARTER_IDS, TRAIL_COMPANION_IDS, and
    HORIZON_COMPANION_IDS (the last lives in horizonCreatures.js).
    """
    src = roster_src()
    evolves = dict(re.findall(r"^  (\w+): \{$\n(?:.*\n)*?    evolvesTo: '?(\w+)'?,", src, re.M))
    roots = _expand_id_array(src, 'WILD_COMPANION_IDS')
    seen, uniq = set(), []
    for root in roots:
        if root not in seen:
            seen.add(root)
            uniq.append(root)
    chains = {}
    for root in uniq:
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


def master_for(cid, root, stage_index):
    named = ART / f'{cid}.png'
    if named.exists():
        return named
    staged = ART / f'{root}_stage{stage_index}.png'
    if staged.exists():
        return staged
    return None


def _hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _pixels(img):
    px = img.load()
    w, h = img.size
    return [px[x, y] for y in range(h) for x in range(w)]


def load_master_rgba(path):
    img = Image.open(path).convert('RGBA')
    # Opaque black-backed masters: treat near-black as empty so the
    # silhouette is the creature, not the canvas.
    extrema = img.getchannel('A').getextrema()
    if extrema == (255, 255):
        px = img.load()
        w, h = img.size
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if max(r, g, b) < 12:
                    px[x, y] = (r, g, b, 0)
    return img


def load_traced_rgba(cid):
    p = ROOT / 'tools' / f'traced_{cid}.json'
    if not p.exists():
        return None
    data = json.loads(p.read_text(encoding='utf-8'))
    pal = [_hex_rgb(c) for c in data['palette']]
    rows = data['rows']
    h, w = len(rows), len(rows[0])
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '.' or not ('A' <= ch <= 'Z'):
                continue
            idx = ord(ch) - ord('A')
            if idx >= len(pal):
                continue
            r, g, b = pal[idx]
            if max(r, g, b) < 18:
                continue
            px[x, y] = (r, g, b, 255)
    return img


def _content_bbox(img, thresh=24):
    a = img.getchannel('A')
    return a.point(lambda v: 255 if v >= thresh else 0).getbbox()


def letterbox(img, size=COMPARE_SIZE):
    bbox = _content_bbox(img)
    if not bbox:
        return None
    cropped = img.crop(bbox)
    w, h = cropped.size
    side = max(w, h)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - w) // 2, (side - h) // 2))
    return canvas.resize((size, size), Image.Resampling.BILINEAR)


def iou(a, b):
    ma = [p[3] >= 24 for p in _pixels(a)]
    mb = [p[3] >= 24 for p in _pixels(b)]
    inter = sum(x and y for x, y in zip(ma, mb))
    union = sum(x or y for x, y in zip(ma, mb))
    return inter / union if union else 0.0


def color_mse(a, b):
    acc = n = 0.0
    for pa, pb in zip(_pixels(a), _pixels(b)):
        if pa[3] < 24 and pb[3] < 24:
            continue
        n += 1
        acc += sum((pa[i] - pb[i]) ** 2 for i in range(3)) / 3.0
    return acc / n if n else 0.0


def fullframe_mse(path_a, path_b):
    ia = Image.open(path_a).convert('RGB').resize((COMPARE_SIZE, COMPARE_SIZE),
                                                 Image.Resampling.BILINEAR)
    ib = Image.open(path_b).convert('RGB').resize((COMPARE_SIZE, COMPARE_SIZE),
                                                 Image.Resampling.BILINEAR)
    acc = n = 0.0
    for pa, pb in zip(_pixels(ia), _pixels(ib)):
        n += 1
        acc += sum((pa[i] - pb[i]) ** 2 for i in range(3)) / 3.0
    return acc / n if n else 0.0


def load_stage(cid, master):
    if master is not None:
        return load_master_rgba(master), 'png'
    traced = load_traced_rgba(cid)
    if traced is not None:
        return traced, 'json'
    return None, None


def compare_pair(img_a, img_b):
    ca, cb = letterbox(img_a), letterbox(img_b)
    if ca is None or cb is None:
        return None
    return iou(ca, cb), color_mse(ca, cb)


def clone_reason(score_iou, score_mse, full_mse, stage_a, stage_b, n_stages):
    """Return a fail string, or None if the pair is different enough."""
    if score_iou >= IOU_SAME_SILHOUETTE:
        return (f'same silhouette IoU={score_iou:.3f} mse={score_mse:.0f} '
                f'(>= {IOU_SAME_SILHOUETTE})')
    if score_iou >= IOU_NEAR and score_mse < MSE_NEAR:
        return (f'same pose IoU={score_iou:.3f} mse={score_mse:.0f} '
                f'(IoU>= {IOU_NEAR} and mse< {MSE_NEAR:.0f})')
    if full_mse is not None and full_mse < FULLFRAME_MSE_SAME:
        return (f'same regeneration full-frame mse={full_mse:.0f} '
                f'(< {FULLFRAME_MSE_SAME:.0f})')
    # Stage 3 snapped back to stage 1: closer to the baby than a grown form
    # is allowed to be.
    if n_stages >= 3 and {stage_a, stage_b} == {1, 3} and score_iou >= IOU_SNAPBACK:
        return (f'stage 3 snapped back to stage 1 IoU={score_iou:.3f} '
                f'(>= {IOU_SNAPBACK})')
    return None


def check_family_stages(chains):
    """Fail families whose stages are the same creature in a different shirt."""
    clones = []
    print()
    print('Family stage bar (baby / adolescent / adult must look different):')
    for root, chain in chains.items():
        if len(chain) < 2:
            print(f'SHORT  {root:<22} family has {len(chain)} stage(s); '
                  'companions are a complete 3-stage family or nothing')
            clones.append(root)
            continue
        if len(chain) != 3:
            print(f'SHORT  {root:<22} family has {len(chain)} stages '
                  f'({", ".join(chain)}); need baby / adolescent / adult')
            clones.append(root)
        pair_fail = False
        max_iou = 0.0
        for i in range(len(chain)):
            for j in range(i + 1, len(chain)):
                a, b = chain[i], chain[j]
                ma, mb = master_for(a, root, i + 1), master_for(b, root, j + 1)
                img_a, src_a = load_stage(a, ma)
                img_b, src_b = load_stage(b, mb)
                if img_a is None or img_b is None:
                    continue
                scores = compare_pair(img_a, img_b)
                if scores is None:
                    continue
                score_iou, score_mse = scores
                max_iou = max(max_iou, score_iou)
                full = None
                if ma is not None and mb is not None:
                    full = fullframe_mse(ma, mb)
                why = clone_reason(score_iou, score_mse, full, i + 1, j + 1,
                                   len(chain))
                if why:
                    pair_fail = True
                    print(f'CLONE  {root:<22} {a}/{b}  {why}  [{src_a}+{src_b}]')
        if pair_fail:
            clones.append(root)
        elif max_iou:
            print(f'ok     {root:<22} stages differ (max pair IoU {max_iou:.3f})')
        else:
            print(f'skip   {root:<22} no comparable stage art')
    return clones


def main():
    chains = family_chains()

    short = [root for root, chain in chains.items() if len(chain) != 3]
    if short:
        print(f'FAIL   families shorter than 3 stages: {", ".join(short)}')
        for root in short:
            print(f'       {root}: {chains[root]}')
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

    # Which companions ship art with no committed source at all.
    covered = {expected_traced_for(p.stem, chains) for p in masters}
    horizon = set()
    for root in horizon_ids():
        horizon.update(chains.get(root, [root]))
    everyone = [cid for chain in chains.values() for cid in chain]
    # Horizon plates are still incoming. Do not fail the shipped 18 families
    # because 40 reserved lines have no master yet.
    pending = [c for c in everyone if c in horizon and c not in covered]
    everyone_shipped = [c for c in everyone if c not in horizon]
    sourceless = [c for c in everyone_shipped if c not in covered]
    if pending:
        print(f'skip   {len(pending)} horizon form(s) waiting on user plates')

    missing_prov = []
    for cid in everyone_shipped:
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

    clones = check_family_stages(chains)

    bad = []
    if broken or orphaned:
        print(f'\n{len(broken) + len(orphaned)} master problem(s) above.')
        bad.append('master')
    if missing_prov:
        print(f'\n{len(missing_prov)} companion(s) lack provenance: {", ".join(missing_prov)}')
        bad.append('provenance')
    if clones:
        print(f'\n{len(clones)} family(ies) fail the baby/adolescent/adult bar.')
        print('  The art is wrong; do not loosen tools/check_art.py so these pass.')
        bad.append('clone')
    if bad:
        return 1
    # Sourceless is a fail, not a footnote. Re-rendering a PNG out of the
    # indexed JSON would satisfy a file count and hide the provenance gap
    # this script exists to keep visible (Dewbble).
    if sourceless:
        print('\nSourceless companions fail this check. Do not invent a master from the JSON.')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
