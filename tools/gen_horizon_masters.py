#!/usr/bin/env python3
"""Generate distinct transparent PNG masters for all Horizon companion forms.

Pipeline masters so check_art / make_sprites can ship unique faces instead of
spriteStandins. Intentional first-pass plates: each family has three different
silhouettes (baby / adolescent / adult). Hand-traced first-rendition art can
replace any file later without changing ids.
"""
from __future__ import annotations

import hashlib
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "tools" / "reference_art"
SIZE = 96

# Palette name → base / mid / light / dark / accent
PAL = {
    "dew": ("#2f7fb0", "#4aa6d6", "#9fe0f5", "#1a2a40", "#ffffff"),
    "rock": ("#6b6b7a", "#9a9aad", "#c9c9d6", "#2a2438", "#ffcf4d"),
    "moss": ("#3f7d50", "#5aa86b", "#8fd99a", "#2a1e3d", "#cfeeff"),
    "sprout": ("#3f7d50", "#5aa86b", "#8fd99a", "#2a1e3d", "#ffcf4d"),
    "ember": ("#c43e2f", "#ff7a3d", "#ffcf4d", "#2a1e3d", "#fff1c2"),
    "air": ("#8fb8d6", "#bcdcee", "#eaf6ff", "#2a3a4a", "#ffcf4d"),
    "tide": ("#2f7fb0", "#4aa6d6", "#9fe0f5", "#1a2a40", "#cfeeff"),
    "cinder": ("#c43e2f", "#ff7a3d", "#ffcf4d", "#2a1e3d", "#ffffff"),
    "bloom": ("#3f7d50", "#5aa86b", "#8fd99a", "#2a1e3d", "#ffcf4d"),
    "quartz": ("#8c8cc4", "#cfcfff", "#e8e8ff", "#3a3a5e", "#ffffff"),
    "bramble": ("#5a6b3f", "#7d9150", "#b8d97a", "#3a4a28", "#ffffff"),
    "kite": ("#8fb8d6", "#bcdcee", "#eaf6ff", "#2a3a4a", "#ff6b9d"),
    "fern": ("#2f6b43", "#5aa86b", "#8fd99a", "#1f4a2e", "#ffcf4d"),
    "puff": ("#8fb8d6", "#eaf6ff", "#ffffff", "#2a3a4a", "#ffcf4d"),
    "grove": ("#3f7d50", "#5aa86b", "#8fd99a", "#2a1e3d", "#ffcf4d"),
    "samara": ("#a8825a", "#d9b98a", "#f0dcb0", "#5a3f28", "#5aa86b"),
    "scorch": ("#c43e2f", "#ff7a3d", "#ffcf4d", "#2a1e3d", "#ffffff"),
    "spore": ("#a83b4b", "#d65b6b", "#ffd0b0", "#3a1e28", "#f7f0d8"),
    "dapple": ("#7a5a3f", "#a8825a", "#d9b98a", "#2a1e3d", "#ffcf4d"),
    "brine": ("#2f7fb0", "#4aa6d6", "#9fe0f5", "#1a2a40", "#ffffff"),
    "shore": ("#2f7fb0", "#4aa6d6", "#9fe0f5", "#1a2a40", "#ffcf4d"),
    "pyre": ("#c43e2f", "#ff7a3d", "#ffcf4d", "#2a1e3d", "#ffffff"),
    "lantern": ("#c43e6f", "#ff6b9d", "#ffcf4d", "#2a1e3d", "#ffffff"),
    "chock": ("#6b6b7a", "#9a9aad", "#c9c9d6", "#2a2438", "#c43e2f"),
}


def parse_creatures():
    t = (ROOT / "src" / "data" / "horizonCreatures.js").read_text(encoding="utf-8")
    creatures = {}
    cur = None
    for line in t.splitlines():
        m = re.match(r"  ([a-z0-9]+):\s*\{", line)
        if m:
            cur = m.group(1)
            creatures[cur] = {"id": cur}
            continue
        if cur is None:
            continue
        for key in ("stage", "name", "sprite", "palette", "species", "evolvesTo", "flavor"):
            m = re.search(rf"{key}:\s*['\"]([^'\"]+)['\"]", line)
            if m:
                creatures[cur][key] = m.group(1)
            else:
                m = re.search(rf"{key}:\s*(\d+)", line)
                if m:
                    creatures[cur][key] = int(m.group(1))
                elif key == "evolvesTo" and "evolvesTo: null" in line:
                    creatures[cur]["evolvesTo"] = None
    return creatures


def hseed(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def draw_creature(c: dict) -> Image.Image:
    """Distinct silhouette per id+stage. Seeded shapes so stages differ."""
    cid = c["id"]
    stage = int(c.get("stage") or 1)
    pal_name = c.get("palette") or "sprout"
    cols = PAL.get(pal_name, PAL["sprout"])
    base, mid, light, dark, accent = [hex_to_rgb(x) for x in cols]

    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    seed = hseed(cid)
    rng = (seed * 1103515245 + 12345) & 0x7FFFFFFF

    def rnd():
        nonlocal rng
        rng = (rng * 1103515245 + 12345) & 0x7FFFFFFF
        return rng / 0x7FFFFFFF

    scale = 0.55 + 0.18 * (stage - 1)
    cy = int(58 + (3 - stage) * 6)
    cx = 48
    shape = seed % 8
    bw = int(22 * scale + 6 + rnd() * 8)
    bh = int(18 * scale + 8 + rnd() * 10 + stage * 3)

    def ellipse(xy, fill, outline=None):
        d.ellipse(xy, fill=fill, outline=outline)

    def poly(pts, fill):
        d.polygon(pts, fill=fill)

    ellipse(
        [cx - bw // 2 - 2, cy + bh // 2 - 2, cx + bw // 2 + 2, cy + bh // 2 + 6],
        fill=(dark[0], dark[1], dark[2], 90),
    )

    leg_n = 2 if stage == 1 else (3 if stage == 2 else 4)
    for i in range(min(leg_n, 4)):
        lx = cx - bw // 3 + i * (bw // max(leg_n - 1, 1))
        ly = cy + bh // 2 - 2
        ellipse([lx - 3, ly, lx + 3, ly + 8 + stage * 2], fill=dark)
        if stage >= 2:
            ellipse([lx - 4, ly + 6 + stage, lx + 4, ly + 10 + stage * 2], fill=mid)

    if shape in (0, 1):
        ellipse([cx - bw, cy - bh, cx + bw, cy + bh], fill=base, outline=dark)
        if shape == 1:
            ellipse(
                [cx - bw + 4, cy - bh + 6, cx + bw - 4, cy + bh // 3],
                fill=mid,
                outline=dark,
            )
            if stage >= 2:
                for k in range(stage):
                    ang = -40 + k * 30
                    rx = cx + int(math.cos(math.radians(ang)) * (bw - 4))
                    ry = cy - bh // 2 + int(math.sin(math.radians(ang)) * 6)
                    ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=light)
    elif shape in (2, 3):
        ellipse([cx - bw // 2, cy - bh, cx + bw // 2, cy + bh // 3], fill=base, outline=dark)
        hw = int(bw * 0.7)
        ellipse(
            [cx - hw // 2, cy - bh - hw // 2 - 4, cx + hw // 2, cy - bh + hw // 4],
            fill=mid,
            outline=dark,
        )
        if stage >= 2:
            for side in (-1, 1):
                ax = cx + side * (bw // 2 + 2)
                poly(
                    [
                        (ax, cy - bh // 3),
                        (ax + side * (6 + stage * 2), cy + 4),
                        (ax + side * 2, cy + 6),
                    ],
                    fill=base,
                )
        if stage == 3:
            for side in (-1, 1):
                poly(
                    [
                        (cx + side * 4, cy - bh - hw // 2 - 2),
                        (cx + side * (10 + int(rnd() * 6)), cy - bh - hw - 8),
                        (cx + side * 6, cy - bh - hw // 2),
                    ],
                    fill=accent,
                )
    elif shape in (4, 5):
        ellipse(
            [cx - bw - 6, cy - bh // 2, cx + bw + 8, cy + bh // 2],
            fill=base,
            outline=dark,
        )
        ellipse(
            [cx + bw - 4, cy - bh // 2 - 4, cx + bw + 14, cy + 4],
            fill=mid,
            outline=dark,
        )
        if stage >= 2:
            for k in range(2 + stage):
                px = cx - bw + 8 + k * (2 * bw // (2 + stage))
                poly(
                    [(px, cy - bh // 2), (px + 3, cy - bh // 2 - 6 - stage * 2), (px + 6, cy - bh // 2)],
                    fill=accent if k % 2 else light,
                )
        if stage == 3:
            poly(
                [
                    (cx - bw - 4, cy),
                    (cx - bw - 16 - int(rnd() * 8), cy - 8),
                    (cx - bw - 14, cy + 6),
                ],
                fill=mid,
            )
    else:
        ellipse([cx - bw // 3, cy - bh // 2, cx + bw // 3, cy + bh], fill=base, outline=dark)
        hw = int(bw * 0.9 + stage * 2)
        ellipse(
            [cx - hw // 2, cy - bh - 2, cx + hw // 2, cy - bh // 3],
            fill=mid,
            outline=dark,
        )
        petals = 3 + stage * 2
        for k in range(petals):
            ang = k * (360 / petals) + seed % 20
            rad = 8 + stage * 3 + int(rnd() * 4)
            px = cx + int(math.cos(math.radians(ang)) * rad)
            py = cy - bh // 2 + int(math.sin(math.radians(ang)) * rad * 0.7) - 6
            ellipse([px - 4, py - 4, px + 4, py + 4], fill=accent if k % 2 else light)

    eye_y = cy - bh // 3 if shape not in (4, 5) else cy - 4
    eye_x_off = 6 if shape not in (4, 5) else bw // 2 + 2
    for side in (-1, 1):
        ex = cx + side * eye_x_off
        ellipse([ex - 3, eye_y - 3, ex + 3, eye_y + 3], fill=(255, 255, 255, 255))
        ellipse([ex - 1, eye_y - 1, ex + 2, eye_y + 2], fill=dark)

    hx = cx - bw // 3
    hy = cy - bh // 2
    ellipse([hx - 3, hy - 3, hx + 5, hy + 4], fill=(*light, 180))

    if stage == 3 and shape in (0, 2, 6, 7):
        for side in (-1, 1):
            poly(
                [
                    (cx + side * (bw // 2 - 2), cy - 4),
                    (cx + side * (bw // 2 + 10 + int(rnd() * 6)), cy + bh // 2 + 4),
                    (cx + side * (bw // 2 - 4), cy + bh // 3),
                ],
                fill=(*mid, 200),
            )

    return img


def main():
    ART.mkdir(parents=True, exist_ok=True)
    creatures = parse_creatures()
    written = 0
    for cid, c in sorted(creatures.items()):
        if "stage" not in c:
            continue
        c.setdefault("id", cid)
        img = draw_creature(c)
        out = ART / f"{cid}.png"
        img.save(out, "PNG")
        written += 1
        print(f"  wrote {out.name}")
    print(f"done: {written} masters in {ART}")


if __name__ == "__main__":
    main()
