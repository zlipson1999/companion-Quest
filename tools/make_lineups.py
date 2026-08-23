#!/usr/bin/env python3
"""Build evolution contact sheets under tools/lineups/ from tools/reference_art/."""
from __future__ import annotations
import re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "tools" / "reference_art"
OUT = ROOT / "tools" / "lineups"
BG = (26, 18, 40, 255)
GOLD = (255, 207, 77, 255)
CREAM = (247, 243, 232, 255)
CELL, PAD, LABEL_W, HDR = 96, 8, 140, 28


def parse(path: Path, skip_obs: bool = False):
    text = path.read_text()
    obs = set()
    if skip_obs:
        m = re.search(r"OBSTACLE_IDS\s*=\s*\[([^\]]+)\]", text)
        if m:
            obs = set(re.findall(r"'(\w+)'", m.group(1)))
    forms = {}
    for m in re.finditer(r"^  ([a-z0-9]+): \{", text, re.M):
        name = m.group(1)
        if name in obs:
            continue
        start = m.end()
        nxt = re.search(r"^  [a-z0-9]+: \{", text[start:], re.M)
        block = text[start : start + (nxt.start() if nxt else 800)]
        evo = re.search(r"evolvesTo:\s*['\"]([^'\"]+)", block)
        forms[name] = evo.group(1) if evo else None
    return forms


def chains(forms):
    targets = {v for v in forms.values() if v}
    roots = sorted(k for k in forms if k not in targets)
    out = []
    for r in roots:
        ch = [r]
        cur = r
        while forms.get(cur) in forms:
            cur = forms[cur]
            ch.append(cur)
        out.append(ch)
    return out


def make_sheet(chs, title, path: Path, per_page=10):
    OUT.mkdir(parents=True, exist_ok=True)
    total = max(1, (len(chs) + per_page - 1) // per_page)
    pages = []
    for bi in range(0, len(chs), per_page):
        batch = chs[bi : bi + per_page]
        cols = 3
        rows = len(batch)
        w = LABEL_W + cols * (CELL + PAD) + PAD
        h = HDR + rows * (CELL + PAD + 4) + PAD
        img = Image.new("RGBA", (w, h), BG)
        dr = ImageDraw.Draw(img)
        page = bi // per_page + 1
        dr.text((PAD, 8), f"{title}  ({page}/{total})", fill=GOLD)
        for ri, ch in enumerate(batch):
            y = HDR + ri * (CELL + PAD + 4)
            dr.text((PAD, y + CELL // 2 - 6), ch[0][:18], fill=CREAM)
            for ci, cid in enumerate(ch[:3]):
                x = LABEL_W + ci * (CELL + PAD)
                p = ART / f"{cid}.png"
                if p.exists():
                    im = Image.open(p).convert("RGBA")
                    im.thumbnail((CELL, CELL), Image.NEAREST)
                    ox = x + (CELL - im.width) // 2
                    oy = y + (CELL - im.height) // 2
                    img.paste(im, (ox, oy), im)
                else:
                    dr.rectangle([x, y, x + CELL, y + CELL], outline=(255, 80, 80, 255))
        out = path if total == 1 else path.with_name(f"{path.stem}_{page:02d}{path.suffix}")
        img.save(out, optimize=True)
        pages.append(out)
        print("wrote", out)
    return pages


def babies_sheet(chs, title, path: Path):
    ids = [ch[0] for ch in chs]
    cols = 10
    rows = (len(ids) + cols - 1) // cols
    w = PAD + cols * (CELL + PAD)
    h = HDR + rows * (CELL + 16 + PAD)
    img = Image.new("RGBA", (w, h), BG)
    dr = ImageDraw.Draw(img)
    dr.text((PAD, 8), title, fill=GOLD)
    for i, cid in enumerate(ids):
        r, c = divmod(i, cols)
        x = PAD + c * (CELL + PAD)
        y = HDR + r * (CELL + 16 + PAD)
        p = ART / f"{cid}.png"
        if p.exists():
            im = Image.open(p).convert("RGBA")
            im.thumbnail((CELL, CELL), Image.NEAREST)
            img.paste(im, (x + (CELL - im.width) // 2, y + (CELL - im.height) // 2), im)
        dr.text((x, y + CELL), cid[:12], fill=CREAM)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print("wrote", path)


def main():
    g = chains(parse(ROOT / "src/data/creatures.js", skip_obs=True))
    h = chains(parse(ROOT / "src/data/horizonCreatures.js"))
    make_sheet(g, "Grove evolutions  Baby -> Adolescent -> Adult", OUT / "grove_contact.png", 9)
    make_sheet(h, "Horizon evolutions  Baby -> Adolescent -> Adult", OUT / "horizon_contact.png", 10)
    babies_sheet(g, "Grove stage-1 babies", OUT / "grove_babies.png")
    babies_sheet(h, "Horizon stage-1 babies", OUT / "horizon_babies.png")


if __name__ == "__main__":
    main()
