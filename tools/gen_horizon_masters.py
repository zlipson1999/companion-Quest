#!/usr/bin/env python3
"""Concept-driven Horizon masters from species/flavor. Stage-distinct silhouettes."""
from __future__ import annotations
import hashlib, math, re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "tools" / "reference_art"
SIZE = 96
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
ARCHETYPES = [
    (("ammonite", "spiral", "nautilus", "fossil", "coil"), "spiral"),
    (("rabbit", "hare", "bun"), "rabbit"),
    (("tortoise", "turtle", "shell"), "tortoise"),
    (("hermit", "sea-glass", "glass"), "hermit"),
    (("penguin", "ice-flower"), "penguin"),
    (("bison", "calf", "buck", "thistle"), "ungulate"),
    (("salamander", "glassfire", "ember"), "lizard"),
    (("armadillo", "plated", "copper"), "armadillo"),
    (("gecko", "bark", "redwood"), "gecko"),
    (("lizard", "horned", "sandstone", "desert"), "lizard"),
    (("bat", "fig", "orchard"), "bat"),
    (("crane", "rice", "firefly", "chick"), "bird"),
    (("foal", "mare", "horse", "starlight"), "quad"),
    (("otter", "eelgrass"), "otter"),
    (("seal", "basalt", "skipping"), "seal"),
    (("songbird", "finch", "ash", "bird"), "bird"),
    (("antelope", "goat", "kid", "ibex"), "ungulate"),
    (("pangolin", "scale", "twig", "ring"), "pangolin"),
    (("mink", "aurora", "sleek"), "mustelid"),
    (("mudskipper", "mangrove", "fish-amphibian"), "mudskip"),
    (("sheep", "lamb", "quartz", "crystal"), "ungulate"),
    (("mole", "moonstone"), "mole"),
    (("cat", "lion", "pepper"), "feline"),
    (("pinecone", "cone", "snow"), "cone"),
    (("polyp", "octopus", "coral"), "polyp"),
    (("monkey", "cacao"), "primate"),
    (("fawn", "deer", "honey", "bee"), "ungulate"),
    (("dragonfly", "willow"), "insect"),
    (("goat", "electric", "static"), "ungulate"),
]

def parse_creatures():
    t = (ROOT / "src" / "data" / "horizonCreatures.js").read_text(encoding="utf-8")
    creatures, cur = {}, None
    for line in t.splitlines():
        m = re.match(r"  ([a-z0-9]+):\s*\{", line)
        if m:
            cur = m.group(1); creatures[cur] = {"id": cur}; continue
        if cur is None: continue
        for key in ("stage", "name", "sprite", "palette", "species", "evolvesTo", "flavor"):
            m = re.search(rf"{key}:\s*['\"]([^'\"]+)['\"]", line)
            if m: creatures[cur][key] = m.group(1)
            else:
                m = re.search(rf"{key}:\s*(\d+)", line)
                if m: creatures[cur][key] = int(m.group(1))
                elif key == "evolvesTo" and "evolvesTo: null" in line:
                    creatures[cur]["evolvesTo"] = None
    return creatures

def hseed(s): return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)
def hex_to_rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def archetype(c):
    blob = f"{c.get('species','')} {c.get('flavor','')} {c.get('id','')}".lower()
    for keys, arch in ARCHETYPES:
        if any(k in blob for k in keys): return arch
    return "blob"
def draw_eyes(d, cx, cy, size, dark, light, accent):
    r = max(2, size // 2)
    d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=light)
    d.ellipse([cx-r+1, cy-r+1, cx+r-2, cy+r-1], fill=dark)
    d.point((cx-1, cy-1), fill=accent)

def draw_creature(c):
    cid, stage = c["id"], int(c.get("stage") or 1)
    cols = PAL.get(c.get("palette") or "sprout", PAL["sprout"])
    base, mid, light, dark, accent = [hex_to_rgb(x) for x in cols]
    arch = archetype(c)
    seed = hseed(cid + arch)
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s, y0 = {1: 0.72, 2: 0.88, 3: 1.0}[stage], {1: 12, 2: 6, 3: 2}[stage]
    def oval(x, y, w, h, col): d.ellipse([x, y, x+w, y+h], fill=col, outline=dark)
    def rect(x, y, w, h, col): d.rectangle([x, y, x+w, y+h], fill=col, outline=dark)
    def poly(pts, col): d.polygon(pts, fill=col, outline=dark)

    if arch == "spiral":
        r, cx, cy = int(22*s), 48, 55+y0
        for i in range(3+stage):
            rr = r - i*4
            if rr > 4: oval(cx-rr, cy-rr+i*2, rr*2, rr*2, mid if i%2==0 else base)
        oval(cx-14, cy+r-4, 10, 8, base); oval(cx+4, cy+r-4, 10, 8, base)
        draw_eyes(d, cx-6, cy-4, 5+stage, dark, light, accent)
        if stage >= 2: poly([(cx+r-4, cy-10), (cx+r+18, cy-20-stage*4), (cx+r, cy+6)], accent)
        if stage >= 3: poly([(cx-r, cy-8), (cx-r-16, cy-28), (cx-r+4, cy+4)], light)
    elif arch == "rabbit":
        body_w, body_h = int(28*s), int(32*s)
        bx, by = 48-body_w//2, 50+y0-body_h//2
        oval(bx, by, body_w, body_h, mid)
        hw = int(18*s); oval(48-hw//2, by-int(12*s), hw, int(16*s), light)
        ear_h, ear_w = int(14*s)+stage*10, 6+stage*2
        for side in (-1, 1):
            ex = 48+side*(6+stage)
            poly([(ex, by-4), (ex-ear_w//2, by-ear_h), (ex+ear_w//2, by-ear_h+4)], base if stage<3 else accent)
        if stage >= 2:
            rect(bx+4, by+body_h-4, 6, 10+stage*4, base); rect(bx+body_w-10, by+body_h-4, 6, 10+stage*4, base)
        draw_eyes(d, 44, by-4, 4, dark, light, accent); draw_eyes(d, 52, by-4, 4, dark, light, accent)
        if stage >= 3: poly([(bx+body_w-2, by+body_h//2), (bx+body_w+20, by), (bx+body_w+16, by+body_h//2)], accent)
    elif arch == "tortoise":
        sw, sh = int(36*s), int(24*s); sx, sy = 48-sw//2, 48+y0
        oval(sx, sy, sw, sh, base); oval(sx+4, sy+3, sw-8, sh-8, mid)
        oval(sx-8, sy+6, 14, 12, light)
        for lx in (sx+4, sx+sw//2, sx+sw-12): rect(lx, sy+sh-4, 8, 8+stage*2, dark)
        draw_eyes(d, sx-2, sy+10, 3+stage, dark, light, accent)
        if stage >= 2:
            for i in range(stage): oval(sx+8+i*6, sy+2+i*2, 12, 6, accent)
        if stage >= 3: oval(48-8, sy-18, 16, 20, light); oval(48-5, sy-28, 10, 14, accent)
    elif arch == "hermit":
        r = int(20*s)+stage*4; cx, cy = 50, 52+y0
        oval(cx-r, cy-r, r*2, r*2, mid); oval(cx-r+4, cy-r+4, r*2-8, r*2-8, light)
        d.line([(cx-r+6, cy), (cx+r-6, cy)], fill=dark, width=1)
        d.line([(cx, cy-r+6), (cx, cy+r-6)], fill=dark, width=1)
        for side in (-1, 1):
            fx = cx+side*(r-6)
            poly([(fx, cy+r-4), (fx-4, cy+r+8+stage*2), (fx+4, cy+r+6)], accent)
        draw_eyes(d, cx-6, cy-2, 4, dark, light, (255,255,255))
        if stage >= 3:
            for side in (-1, 1):
                poly([(cx+side*4, cy-r), (cx+side*(18+stage*2), cy-r-16), (cx+side*8, cy-r+6)], accent)
    elif arch in ("lizard", "gecko"):
        bw, bh = int(40*s), int(16*s); bx, by = 48-bw//2, 55+y0
        oval(bx, by, bw, bh, mid); oval(bx-6, by-2, 14, 12, light)
        tw = int(16*s)+stage*6
        poly([(bx+bw-2, by+4), (bx+bw+tw, by-4-stage*2), (bx+bw+tw-4, by+10)], base)
        draw_eyes(d, bx, by+2, 3, dark, light, accent)
        if stage >= 2:
            for lx in (bx+8, bx+bw-16): rect(lx, by+bh-2, 5, 10, dark)
        if stage >= 3 and arch == "gecko":
            poly([(bx+10, by), (bx-4, by-22), (bx+20, by-4)], accent)
            poly([(bx+bw-16, by), (bx+bw+8, by-22), (bx+bw-8, by-4)], accent)
        if stage >= 3 and arch == "lizard":
            poly([(bx, by-2), (bx-4, by-18), (bx+6, by-4)], dark)
            poly([(bx+8, by-2), (bx+12, by-16), (bx+14, by-2)], dark)
    elif arch == "bird":
        body_w, body_h = int(24*s), int(20*s); bx, by = 48-body_w//2, 52+y0
        oval(bx, by, body_w, body_h, mid); oval(bx+body_w-4, by-6, 14, 12, light)
        poly([(bx+body_w+8, by), (bx+body_w+18, by+2), (bx+body_w+8, by+6)], accent)
        rect(48-4, by+body_h-2, 3, 10+stage*3, dark); rect(48+2, by+body_h-2, 3, 10+stage*3, dark)
        draw_eyes(d, bx+body_w+2, by-2, 3, dark, light, accent)
        if stage >= 2: poly([(bx+4, by+4), (bx-10-stage*4, by-8), (bx+12, by+8)], base)
        if stage >= 3: poly([(bx+8, by+2), (bx-4, by-20), (bx+16, by)], accent)
    elif arch == "bat":
        r = int(16*s); cx, cy = 48, 55+y0
        oval(cx-r, cy-r, r*2, r*2, mid)
        draw_eyes(d, cx-5, cy-2, 4, dark, light, accent); draw_eyes(d, cx+5, cy-2, 4, dark, light, accent)
        poly([(cx-8, cy-r), (cx-14, cy-r-10-stage*3), (cx-2, cy-r+2)], dark)
        poly([(cx+8, cy-r), (cx+14, cy-r-10-stage*3), (cx+2, cy-r+2)], dark)
        span = 20+stage*14
        poly([(cx-r, cy), (cx-span, cy-8-stage*4), (cx-span+6, cy+12), (cx-r+4, cy+6)], base)
        poly([(cx+r, cy), (cx+span, cy-8-stage*4), (cx+span-6, cy+12), (cx+r-4, cy+6)], base)
    elif arch in ("quad", "ungulate"):
        bw, bh = int(32*s), int(18*s); bx, by = 48-bw//2, 50+y0
        oval(bx, by, bw, bh, mid); oval(bx-10, by-4, 16, 14, light)
        for lx in (bx+4, bx+12, bx+bw-16, bx+bw-8): rect(lx, by+bh-2, 4, 12+stage*3, dark)
        draw_eyes(d, bx-4, by+2, 3, dark, light, accent)
        if stage >= 2:
            poly([(bx-4, by-4), (bx-8, by-16-stage*3), (bx+2, by-4)], dark)
            poly([(bx+4, by-4), (bx+8, by-14-stage*2), (bx+10, by-2)], dark)
        if stage >= 3:
            oval(bx-6, by-12, 20, 10, accent)
            poly([(bx+bw-2, by+4), (bx+bw+14, by-8), (bx+bw+10, by+8)], base)
    elif arch == "penguin":
        bw, bh = int(22*s), int(30*s); bx, by = 48-bw//2, 45+y0
        oval(bx, by, bw, bh, mid); oval(bx+4, by+8, bw-8, bh-12, light)
        oval(bx+2, by-8, bw-4, 14, dark)
        draw_eyes(d, 44, by-2, 3, dark, light, accent); draw_eyes(d, 52, by-2, 3, dark, light, accent)
        poly([(48, by+2), (48-4, by+6), (48+4, by+6)], accent)
        if stage >= 2:
            poly([(bx, by+10), (bx-12-stage*2, by+16), (bx+2, by+20)], base)
            poly([(bx+bw, by+10), (bx+bw+12+stage*2, by+16), (bx+bw-2, by+20)], base)
        if stage >= 3:
            for a in range(-2, 3): poly([(48+a*4, by-8), (48+a*6, by-22), (48+a*2, by-8)], accent)
    elif arch == "polyp":
        r = int(18*s); cx, cy = 48, 48+y0
        oval(cx-r, cy-r, r*2, r*2, mid)
        n = 4+stage*2
        for i in range(n):
            ang = math.pi*0.15 + i*(math.pi*0.7/max(n-1,1))
            x2 = cx+int(math.cos(ang+math.pi)*(r+10+stage*6))
            y2 = cy+int(math.sin(ang)*(r+12+stage*5))
            d.line([(cx, cy+r//2), (x2, y2)], fill=base, width=3+stage)
            oval(x2-3, y2-3, 6, 6, accent)
        draw_eyes(d, cx-5, cy-2, 4, dark, light, accent); draw_eyes(d, cx+5, cy-2, 4, dark, light, accent)
    elif arch == "insect":
        r = int(12*s); cx, cy = 48, 55+y0
        oval(cx-r, cy-r//2, r*2, r, mid)
        for i in range(2+stage): oval(cx+r-4+i*8, cy-4, 10, 8, base if i%2==0 else mid)
        draw_eyes(d, cx-6, cy-2, 5, dark, light, accent)
        span = 16+stage*12
        poly([(cx, cy-4), (cx-span, cy-18-stage*4), (cx-4, cy+2)], light)
        poly([(cx, cy-4), (cx+span, cy-18-stage*4), (cx+4, cy+2)], light)
        if stage >= 2:
            poly([(cx, cy), (cx-span+6, cy-10), (cx-2, cy+4)], accent)
            poly([(cx, cy), (cx+span-6, cy-10), (cx+2, cy+4)], accent)
    elif arch == "seal":
        bw, bh = int(36*s), int(20*s); bx, by = 48-bw//2, 52+y0
        oval(bx, by, bw, bh, mid); oval(bx-4, by+2, 14, 12, light)
        draw_eyes(d, bx+2, by+6, 3, dark, light, accent)
        poly([(bx+8, by+bh-2), (bx, by+bh+10+stage*2), (bx+14, by+bh)], base)
        poly([(bx+bw-12, by+bh-2), (bx+bw, by+bh+10+stage*2), (bx+bw-18, by+bh)], base)
        if stage >= 2:
            for i in range(stage+1): rect(bx+12+i*8, by+4, 7, 6, dark)
        if stage >= 3: poly([(bx+bw-4, by+4), (bx+bw+16, by-6), (bx+bw+12, by+12)], accent)
    elif arch == "otter":
        bw, bh = int(34*s), int(16*s); bx, by = 48-bw//2, 54+y0
        oval(bx, by, bw, bh, mid); oval(bx-8, by-2, 14, 12, light)
        draw_eyes(d, bx-2, by+2, 3, dark, light, accent)
        d.line([(bx-8, by+4), (bx-16, by+2)], fill=dark, width=1)
        d.line([(bx-8, by+6), (bx-16, by+8)], fill=dark, width=1)
        poly([(bx+bw-2, by+4), (bx+bw+12+stage*4, by+8), (bx+bw, by+bh-2)], base)
        if stage >= 2: rect(bx+6, by+bh-2, 5, 8, dark); rect(bx+14, by+bh-2, 5, 8, dark)
        if stage >= 3:
            for a in range(-2, 3): d.line([(bx+2+a*3, by-2), (bx+a*4, by-14-abs(a))], fill=accent, width=2)
    elif arch in ("armadillo", "pangolin"):
        bw, bh = int(30*s), int(18*s); bx, by = 48-bw//2, 52+y0
        for i in range(3+stage): oval(bx+i*7, by+(i%2)*2, 14, bh-2, mid if i%2==0 else base)
        oval(bx-8, by+2, 12, 12, light); draw_eyes(d, bx-4, by+6, 3, dark, light, accent)
        if stage >= 2: rect(bx+4, by+bh-2, 5, 10, dark); rect(bx+bw-10, by+bh-2, 5, 10, dark)
        if stage >= 3: poly([(bx+bw-4, by), (bx+bw+18, by-12), (bx+bw+10, by+10)], accent)
    elif arch == "mustelid":
        bw, bh = int(38*s), int(14*s); bx, by = 48-bw//2, 54+y0
        oval(bx, by, bw, bh, mid); oval(bx-6, by-2, 12, 12, light)
        draw_eyes(d, bx-2, by+2, 3, dark, light, accent)
        tw = 14+stage*10
        poly([(bx+bw-2, by+2), (bx+bw+tw, by-10-stage*4), (bx+bw+tw-4, by+8)], accent)
        if stage >= 2: rect(bx+8, by+bh-2, 4, 8, dark); rect(bx+18, by+bh-2, 4, 8, dark)
    elif arch == "mudskip":
        bw, bh = int(28*s), int(16*s); bx, by = 48-bw//2, 55+y0
        oval(bx, by, bw, bh, mid); oval(bx-4, by-4, 14, 12, light)
        draw_eyes(d, bx+2, by, 4, dark, light, accent)
        for side in (-1, 1):
            poly([(48+side*8, by+bh), (48+side*(14+stage*4), by+bh+12), (48+side*4, by+bh-2)], base)
        if stage >= 3: poly([(bx+bw-2, by+4), (bx+bw+16, by-6), (bx+bw+8, by+10)], accent)
    elif arch == "mole":
        r = int(18*s); cx, cy = 48, 56+y0
        oval(cx-r, cy-r, r*2, r*2, mid); oval(cx-4, cy+4, 8, 6, accent)
        draw_eyes(d, cx-6, cy-4, 3, dark, light, accent); draw_eyes(d, cx+6, cy-4, 3, dark, light, accent)
        for side in (-1, 1):
            poly([(cx+side*r, cy+4), (cx+side*(r+8+stage*3), cy+12), (cx+side*(r-2), cy+10)], dark)
        if stage >= 3: oval(cx-10, cy-r-8, 20, 12, light)
    elif arch == "primate":
        bw, bh = int(22*s), int(26*s); bx, by = 48-bw//2, 48+y0
        oval(bx, by, bw, bh, mid); oval(bx+2, by-10, bw-4, 14, light)
        draw_eyes(d, 44, by-4, 3, dark, light, accent); draw_eyes(d, 52, by-4, 3, dark, light, accent)
        if stage >= 2:
            poly([(bx, by+8), (bx-12-stage*3, by+18), (bx+4, by+14)], base)
            poly([(bx+bw, by+8), (bx+bw+12+stage*3, by+18), (bx+bw-4, by+14)], base)
        if stage >= 3: oval(bx+4, by+6, bw-8, 12, accent)
    elif arch == "cone":
        bw, bh = int(20*s), int(28*s); bx, by = 48-bw//2, 48+y0
        poly([(48, by), (bx+bw, by+bh//2), (48, by+bh), (bx, by+bh//2)], mid)
        for i in range(3+stage): d.line([(bx+4, by+6+i*6), (bx+bw-4, by+6+i*6)], fill=dark, width=1)
        oval(bx+2, by-4, bw-4, 10, light)
        draw_eyes(d, 44, by+8, 3, dark, light, accent); draw_eyes(d, 52, by+8, 3, dark, light, accent)
        if stage >= 2: rect(bx+4, by+bh-2, 5, 8, dark); rect(bx+bw-9, by+bh-2, 5, 8, dark)
        if stage >= 3: poly([(48, by-4), (40, by-18), (56, by-18)], accent)
    elif arch == "feline":
        bw, bh = int(28*s), int(18*s); bx, by = 48-bw//2, 52+y0
        oval(bx, by, bw, bh, mid); oval(bx-8, by-4, 14, 12, light)
        draw_eyes(d, bx-2, by, 4, dark, light, accent)
        poly([(bx-6, by-4), (bx-10, by-14), (bx-2, by-4)], dark)
        poly([(bx+2, by-4), (bx+6, by-14), (bx+8, by-2)], dark)
        for lx in (bx+4, bx+12, bx+bw-14, bx+bw-8): rect(lx, by+bh-2, 4, 10+stage*2, dark)
        if stage >= 2: poly([(bx+bw-2, by+4), (bx+bw+10+stage*4, by-6), (bx+bw+8, by+10)], accent)
        if stage >= 3: oval(bx-4, by-12, 18, 8, accent)
    else:
        r = int(18*s)+(seed%6); cx, cy = 48, 52+y0
        oval(cx-r, cy-r, r*2, r*2, mid); oval(cx-r//2, cy-r//3, r, r//2, light)
        draw_eyes(d, cx-6, cy-4, 4, dark, light, accent); draw_eyes(d, cx+6, cy-4, 4, dark, light, accent)
        n = 3+(seed%4)+stage
        for i in range(n):
            ang = i*(2*math.pi/n)+(seed%10)*0.1
            x2 = cx+int(math.cos(ang)*(r+6+stage*4)); y2 = cy+int(math.sin(ang)*(r+6+stage*4))
            oval(x2-3, y2-3, 6, 6, accent if i%2==0 else base)
        if stage >= 2: rect(cx-10, cy+r-2, 6, 10, dark); rect(cx+4, cy+r-2, 6, 10, dark)
        if stage >= 3: poly([(cx, cy-r), (cx-12, cy-r-16), (cx+12, cy-r-16)], accent)
    return img

def main():
    ART.mkdir(parents=True, exist_ok=True)
    creatures = parse_creatures()
    arches = {}
    for cid, c in sorted(creatures.items()):
        draw_creature(c).save(ART / f"{cid}.png")
        a = archetype(c); arches[a] = arches.get(a, 0)+1
        print(f"ok  {cid:20s} stage={c.get('stage')} arch={a}")
    print(f"Wrote {len(creatures)} masters", dict(sorted(arches.items(), key=lambda x: -x[1])))

if __name__ == "__main__":
    main()
