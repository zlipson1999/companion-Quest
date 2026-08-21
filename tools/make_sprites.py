#!/usr/bin/env python3
"""Author + validate + preview Companion Quest pixel sprites.

Source of truth for the original creature/hero/item art. Each sprite is a list
of 16-char strings; every char is a palette index ('.' == transparent). We
validate alignment, render a scaled PNG contact sheet for review, and emit
src/data/sprites.js so the running app uses the *exact* same art.

100% original art — no copied assets.
"""
import os, struct, zlib, json

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
W = 16  # all sprites are 16x16

# Palettes mirror src/theme/colors.js spritePalettes. idx0 = transparent.
PALETTES = {
    "sprout": [None, "#3f7d50", "#5aa86b", "#8fd99a", "#2a1e3d", "#ffcf4d", "#ffffff"],
    "ember":  [None, "#c43e2f", "#ff7a3d", "#ffcf4d", "#2a1e3d", "#fff1c2", "#ffffff"],
    "dew":    [None, "#2f7fb0", "#4aa6d6", "#9fe0f5", "#1a2a40", "#ffffff", "#cfeeff"],
    "sludge": [None, "#5a6b3f", "#7d9150", "#3a4a28", "#2a1e3d", "#b8d97a", "#ffffff"],
    "snooze": [None, "#5b5b8c", "#8c8cc4", "#3a3a5e", "#2a1e3d", "#cfcfff", "#ffffff"],
    "ache":   [None, "#a83b4b", "#d65b6b", "#ff9db0", "#2a1e3d", "#ffd6de", "#ffffff"],
    "couch":  [None, "#7a5a3f", "#a8825a", "#5a3f28", "#2a1e3d", "#d9b98a", "#ffffff"],
    "hero":   [None, "#2f4fb0", "#5b8cff", "#ffcf4d", "#2a1e3d", "#f7c9a8", "#ffffff"],
    "item":   [None, "#c43e6f", "#ff6b9d", "#ffcf4d", "#2a1e3d", "#5ed46a", "#ffffff"],
    "rock":   [None, "#6b6b7a", "#9a9aad", "#c9c9d6", "#2a2438", "#ffcf4d", "#ffffff"],
    "air":    [None, "#8fb8d6", "#bcdcee", "#eaf6ff", "#2a3a4a", "#ffcf4d", "#ffffff"],
    "spore":  [None, "#a83b4b", "#d65b6b", "#ffd0b0", "#3a1e28", "#f7f0d8", "#ffffff"],
}

# 1=dark shade  2=main  3=highlight  4=outline(ink)  5=accent  6=white/shine

SPROUTLE = [
    "................",
    ".....4....4.....",
    ".....434..434...",
    "......43..34....",
    ".......4..4.....",
    "........44......",
    "....44444444....",
    "..442222222244..",
    ".42233222233224.",
    ".42222222222224.",
    ".42266222266224.",
    ".42264222264224.",
    ".42222222222224.",
    "..452222222254..",
    "...44222222244..",
    ".....44444444...",
]

EMBERKIT = [
    "...44......44...",
    "..4224....4224..",
    "..4224....4224..",
    "..4444444444444.",
    ".42222222222224.",
    ".42266222266224.",
    ".42264222264224.",
    ".42222222222224.",
    ".42222255222224.",
    ".42222555522224.",
    ".42225555552224.",
    ".42222555522224.",
    "..452225552254..",
    "...44222222244..",
    ".....44444444...",
    "................",
]

DEWBBLE = [
    ".......44.......",
    "......4334......",
    "......4334......",
    ".....433334.....",
    "....43333334....",
    "...4333333334...",
    "..433333333334..",
    ".43355333355334.",
    ".43345333345334.",
    ".43333333333334.",
    ".43333444433334.",
    ".43336666663334.",
    "..433333333334..",
    "..443333333344..",
    "...4433333344...",
    ".....44444444...",
]

SLUDGEWAD = [
    "................",
    "................",
    "....44....44....",
    "...4224..4224...",
    "..42224442224...",
    ".42222222222224.",
    ".42266222266224.",
    ".42264222264224.",
    ".42222222222224.",
    ".42233222233224.",
    ".42222222222224.",
    ".42224444442224.",
    "4222222222222224",
    ".44444444444444.",
    "..1..1..1..1....",
    "................",
]

SNOOZE = [
    "..............5.",
    ".............5..",
    ".4444444444.....",
    ".4222222224.....",
    ".4232222324.....",
    ".4222222224.....",
    ".4244224424.....",
    ".4222222224.....",
    ".4222442224.....",
    ".4222222224.....",
    ".4111111114.....",
    ".4244244244.....",
    "................",
    "................",
    "................",
    "................",
]

ACHEFANG = [
    "...4..4..4..4...",
    "...44.44.44.44..",
    "..4444444444444.",
    ".42222222222224.",
    ".42211222112224.",
    ".42266222266224.",
    ".42264222264224.",
    ".42222222222224.",
    ".42244444422224.",
    ".42222222222224.",
    "..44444444444...",
    "...6.6..6.6.....",
    "...4........4...",
    "..4..........4..",
    "................",
    "................",
]

COUCHLURK = [
    "................",
    "................",
    "...4444444444...",
    "..422222222224..",
    ".42233222233224.",
    ".42266222266224.",
    ".42214222214224.",
    ".42222222222224.",
    ".42222444222224.",
    ".42222222222224.",
    ".41111111111114.",
    ".42222222222224.",
    "4422222222222244",
    "4112222222222114",
    ".41........14...",
    "................",
]

HERO_DOWN = [
    "................",
    ".....444444.....",
    "....43333334....",
    "...4444444444...",
    "....45555554....",
    "....45455454....",
    "....45555554....",
    "...4222222224...",
    "..422222222224..",
    "..422222222224..",
    "..411111111114..",
    "....422..224....",
    "....411..114....",
    "....44....44....",
    "................",
    "................",
]

ITEM_APPLE = [
    "................",
    "........4.......",
    "......5544......",
    "...44222244.....",
    ".4222222224.....",
    ".4226622224.....",
    ".4222222224.....",
    ".4222222224.....",
    ".4222222224.....",
    "..42222224......",
    "...422224.......",
    "....4444........",
    "................",
    "................",
    "................",
    "................",
]

ITEM_WATER = [
    ".......44.......",
    ".......44.......",
    "......4334......",
    "......4334......",
    ".....433334.....",
    ".....455554.....",
    ".....455554.....",
    ".....433334.....",
    ".....433334.....",
    ".....466664.....",
    ".....433334.....",
    ".....433334.....",
    ".....444444.....",
    "................",
    "................",
    "................",
]

ITEM_ENERGYBAR = [
    "................",
    "................",
    "..444444444444..",
    "..433333333334..",
    "..432222222234..",
    "..432266662234..",
    "..432222222234..",
    "..432266662234..",
    "..432222222234..",
    "..433333333334..",
    "..444444444444..",
    "................",
    "................",
    "................",
    "................",
    "................",
]

ITEM_CHARM = [
    "................",
    "................",
    "...44..44.......",
    "..4222442224....",
    ".422222222224...",
    ".422226622224...",
    ".422222222224...",
    "..4222222224....",
    "...42222224.....",
    "....422224......",
    ".....4224.......",
    "......44........",
    "................",
    "................",
    "................",
    "................",
]

ITEM_TOKEN = [
    "................",
    "......4444......",
    "....44222244....",
    "...4222222234...",
    "..422266222234..",
    "..422622622634..",
    "..426222262234..",
    "..426222262234..",
    "..422622622234..",
    "..422266222234..",
    "...4222222234...",
    "....44333344....",
    "......4444......",
    "................",
    "................",
    "................",
]

PEBBLEPUP = [
    "................",
    "...44.....44....",
    "..4224...4224...",
    ".44444444444444.",
    ".42222222222224.",
    ".42266222266224.",
    ".42264222264224.",
    ".42222222222224.",
    ".42233222233224.",
    ".42222222222224.",
    ".41221221221214.",
    ".42222222222224.",
    ".41111111111114.",
    "...44....44.....",
    "..441....144....",
    "................",
]

WISPURR = [
    "................",
    "...4........4...",
    "..414......414..",
    "..4444444444444.",
    ".42222222222224.",
    ".42266222266224.",
    ".42264222264224.",
    ".42222222222224.",
    ".42222222222224.",
    "..433333333334..",
    ".43443443443443.",
    "..4.44.44.44.4..",
    "................",
    "................",
    "................",
    "................",
]

SPORELET = [
    "................",
    ".....44444......",
    "...4422222244...",
    "..422552255224..",
    ".42225522552224.",
    ".42222222222224.",
    ".44444444444444.",
    "....43333334....",
    "....4313134.....",
    "....43333334....",
    "....43333334....",
    "....43333334....",
    "....44444444....",
    "................",
    "................",
    "................",
]

# --- Phase 3: life-module icons. Badge-style, readable at hub-card size. ---

MOD_DROPLET = [
    "................",
    ".......44.......",
    "......4334......",
    "......4334......",
    ".....433224.....",
    ".....433224.....",
    "....43532224....",
    "....43552224....",
    "...4335522224...",
    "...4333222224...",
    "..433222222214..",
    "..432222222214..",
    "..432222222114..",
    "...4222211114...",
    "....44444444....",
    "................",
]

MOD_PLATE = [
    "................",
    "................",
    ".......4........",
    "....4..434......",
    "...434.4334.....",
    "..43334333344...",
    "..433333333344..",
    ".44444444444444.",
    ".45555555555554.",
    ".46666666666664.",
    ".46666666666664.",
    "..466666666664..",
    "...4666666664...",
    "....44444444....",
    "................",
    "................",
]

# Fallback icon so a brand-new life module can ship with no art of its own.
MOD_CHECK = [
    "................",
    ".44444444444444.",
    ".43333333333334.",
    ".43222222222234.",
    ".43222222222234.",
    ".43222222255234.",
    ".43222222552234.",
    ".43552225522234.",
    ".43255255222234.",
    ".43225552222234.",
    ".43222552222234.",
    ".43222222222234.",
    ".43333333333334.",
    ".44444444444444.",
    "................",
    "................",
]

# The Workout Forge's icon: a plate-loaded bar, steel on the rock palette.
MOD_BARBELL = [
    "................",
    "................",
    "................",
    "................",
    ".44444....44444.",
    ".43324....42334.",
    ".43324444442334.",
    ".43324222242334.",
    ".43324333342334.",
    ".43324444442334.",
    ".43324....42334.",
    ".44444....44444.",
    "................",
    "................",
    "................",
    "................",
]

SPRITES = {
    "sproutle":      {"palette": "sprout", "grid": SPROUTLE},
    "emberkit":      {"palette": "ember",  "grid": EMBERKIT},
    "dewbble":       {"palette": "dew",    "grid": DEWBBLE},
    "sludgewad":     {"palette": "sludge", "grid": SLUDGEWAD},
    "snoozeghoul":   {"palette": "snooze", "grid": SNOOZE},
    "achefang":      {"palette": "ache",   "grid": ACHEFANG},
    "couchlurk":     {"palette": "couch",  "grid": COUCHLURK},
    "hero_down":     {"palette": "hero",   "grid": HERO_DOWN},
    "item_apple":    {"palette": "item",   "grid": ITEM_APPLE},
    "item_water":    {"palette": "dew",    "grid": ITEM_WATER},
    "item_energybar":{"palette": "ember",  "grid": ITEM_ENERGYBAR},
    "item_charm":    {"palette": "item",   "grid": ITEM_CHARM},
    "item_token":    {"palette": "item",   "grid": ITEM_TOKEN},
    "pebblepup":     {"palette": "rock",   "grid": PEBBLEPUP},
    "wispurr":       {"palette": "air",    "grid": WISPURR},
    "sporelet":      {"palette": "spore",  "grid": SPORELET},
    "mod_droplet":   {"palette": "dew",    "grid": MOD_DROPLET},
    "mod_plate":     {"palette": "sprout", "grid": MOD_PLATE},
    "mod_check":     {"palette": "item",   "grid": MOD_CHECK},
    "mod_barbell":   {"palette": "rock",   "grid": MOD_BARBELL},
}


def hex_to_rgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def normalize(grid):
    out = []
    for r in grid:
        r = r.replace(" ", ".")
        out.append((r + "." * W)[:W])
    while len(out) < W:
        out.append("." * W)
    return out[:W]


def validate():
    ok = True
    for name, spr in SPRITES.items():
        for i, r in enumerate(spr["grid"]):
            if len(r) != W:
                print(f"  ! {name} row {i}: len {len(r)} (expected {W}) -> '{r}'")
                ok = False
        if len(spr["grid"]) != W:
            print(f"  ! {name}: {len(spr['grid'])} rows (expected {W})")
            ok = False
        pal = PALETTES[spr["palette"]]
        for r in normalize(spr["grid"]):
            for ch in r:
                if ch == ".":
                    continue
                if not ch.isdigit() or int(ch) >= len(pal):
                    print(f"  ! {name}: bad index '{ch}'")
                    ok = False
    print("  OK" if ok else "  FAILED")
    return ok


def write_png(path, rows_rgba, w, h):
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw += bytes(rows_rgba[y * w + x])
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def render_contact_sheet(scale=9, pad=2, cols=4):
    names = list(SPRITES.keys())
    cw = W + pad * 2
    rows = (len(names) + cols - 1) // cols
    IW = cols * cw * scale
    IH = rows * cw * scale
    bg = (24, 24, 40, 255)
    px = [list(bg) for _ in range(IW * IH)]
    for i, name in enumerate(names):
        spr = SPRITES[name]
        grid = normalize(spr["grid"])
        pal = PALETTES[spr["palette"]]
        gx = (i % cols) * cw + pad
        gy = (i // cols) * cw + pad
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch == ".":
                    color = (40, 40, 64, 255) if (x + y) % 2 == 0 else (30, 30, 48, 255)
                else:
                    color = (*hex_to_rgb(pal[int(ch)]), 255)
                for sy in range(scale):
                    for sx in range(scale):
                        X = (gx + x) * scale + sx
                        Y = (gy + y) * scale + sy
                        px[Y * IW + X] = list(color)
    out = os.path.join(HERE, "sprite_preview.png")
    write_png(out, px, IW, IH)
    print(f"  wrote {out} ({IW}x{IH})")


def emit_js():
    norm = {k: {"palette": v["palette"], "grid": normalize(v["grid"])} for k, v in SPRITES.items()}
    body = "// AUTO-GENERATED by tools/make_sprites.py — original pixel art.\n"
    body += "// Each sprite: 16 rows of 16 chars; '.' = transparent, else palette index.\n\n"
    body += "export const SPRITES = " + json.dumps(norm, indent=2) + ";\n\nexport default SPRITES;\n"
    out = os.path.join(ROOT, "src", "data", "sprites.js")
    with open(out, "w") as f:
        f.write(body)
    print(f"  wrote {out}")


if __name__ == "__main__":
    print("Validating sprites...")
    validate()
    print("Rendering preview...")
    render_contact_sheet()
    emit_js()
    print("Done.")
