#!/usr/bin/env python3
"""Author + validate + preview Companion Quest pixel art.

Source of truth for every original sprite and tile in the game. There are no
image files anywhere in the app: this script draws the art and emits
src/data/sprites.js, which the renderer reads directly.

WHY IT DRAWS RATHER THAN STORES GRIDS
-------------------------------------
The first version stored each sprite as 16 hand-typed rows of palette digits.
That caps you at 16x16 and ten colours, which is why everything looked flat.
Hand-placing a 48x48 sprite with a sixteen-step shading ramp is 2300 pixels of
typing per creature, and it would still be flat because a person typing digits
cannot hold a lighting model in their head.

So sprites are COMPOSED instead: a creature is a handful of shaded ellipsoids,
and the lighting is computed. `sphere()` evaluates a real surface normal and
dots it with a light vector, so forms read as round; `outline()` walks the
silhouette; `rim()` adds the bounce light along the shaded edge. The result is
still hard-edged indexed pixel art on a fixed ramp — it is just lit properly
instead of guessed at.

100% original art. Nothing here is traced, copied or derived from anyone else's
work; the shapes are all built from primitives in this file.
"""
import os, struct, zlib, json, math

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

TRANSPARENT = '.'
# Palette indices are base-36 chars, so a sprite can use up to 35 colours.
DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

# Light comes from the upper left and slightly toward the viewer — the
# convention almost all handheld sprite art uses, and the reason these read as
# solid objects rather than silhouettes.
LIGHT = (-0.55, -0.68, 0.48)


# ----------------------------------------------------------------- colour ---
def hex_to_rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def rgb_to_hex(c):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in c)


def mix(a, b, t):
    ca, cb = hex_to_rgb(a), hex_to_rgb(b)
    return rgb_to_hex(tuple(ca[i] + (cb[i] - ca[i]) * t for i in range(3)))


def ramp(dark, light, steps=6, gamma=0.85):
    """A shading ramp from shadow to highlight.

    Gamma below 1 spends more steps in the lights, where the eye actually reads
    form; an even split wastes half the ramp on shadow nobody can see.
    """
    return [mix(dark, light, (i / (steps - 1.0)) ** gamma) for i in range(steps)]


INK = '#140f22'      # every outline in the game
WHITE = '#fdfdff'
EYE_DARK = '#1b1430'

# A palette is a set of named ramps plus the shared fixed colours. Sprites name
# a ramp and a shade; the flat index list is generated, so nothing has to be
# mirrored by hand anywhere else.
PALETTE_SPECS = {
    'sprout':  {'body': ('#1f5c39', '#a6f0b4'), 'leaf': ('#2f7d3f', '#d4ff9e'), 'belly': ('#4a7a3a', '#e2ffc9')},
    'ember':   {'body': ('#8c2a12', '#ffd08a'), 'leaf': ('#c4441a', '#ffe9a8'), 'belly': ('#a8481f', '#ffe0b0')},
    'dew':     {'body': ('#123f6b', '#b8ecff'), 'leaf': ('#1d6ea8', '#dcf7ff'), 'belly': ('#2a6f96', '#e6fbff')},
    'sludge':  {'body': ('#2e3d18', '#b6d16a'), 'leaf': ('#46561f', '#d6e88a'), 'belly': ('#3d4a22', '#c6dd7c')},
    'snooze':  {'body': ('#2a2650', '#b9b6ee'), 'leaf': ('#413a72', '#d5d2ff'), 'belly': ('#38346a', '#c9c6f7')},
    'ache':    {'body': ('#6b1730', '#ffb0c4'), 'leaf': ('#93253f', '#ffd0dc'), 'belly': ('#7d2038', '#ffc2d2')},
    'couch':   {'body': ('#3f2a17', '#d4a374'), 'leaf': ('#5a3d22', '#e8c49a'), 'belly': ('#4d3520', '#dcb387')},
    'hero':    {'body': ('#1b2f6b', '#8fb4ff'), 'leaf': ('#8a5a1e', '#ffd98a'), 'belly': ('#8a5636', '#ffd2ad')},
    'item':    {'body': ('#7a1440', '#ff9dc0'), 'leaf': ('#a8801a', '#ffe486'), 'belly': ('#1d6b3a', '#8ef0a8')},
    'rock':    {'body': ('#2f3040', '#c8ccdc'), 'leaf': ('#4a4d63', '#e2e6f2'), 'belly': ('#3a3c4f', '#d4d8e8')},
    'air':     {'body': ('#3f5f7a', '#e8f8ff'), 'leaf': ('#5c7f9c', '#ffffff'), 'belly': ('#4d6e8a', '#f4fcff')},
    'spore':   {'body': ('#6b1a2a', '#ff9c9c'), 'leaf': ('#8a2f24', '#ffd0b0'), 'belly': ('#8a5c48', '#ffe0c8')},
    'terra':   {'body': ('#2a4a1c', '#9fd96a'), 'leaf': ('#7a5a1e', '#e8c46a'), 'belly': ('#4a6b2a', '#c8e88a')},
    'bloom':   {'body': ('#1a5c44', '#8ce8b0'), 'leaf': ('#a8285e', '#ffb8d8'), 'belly': ('#c49a1e', '#fff0a8')},
    'pyre':    {'body': ('#6b1408', '#ff9440'), 'leaf': ('#c47a0a', '#ffe066'), 'belly': ('#8c2a0e', '#ffb870')},
    'tide':    {'body': ('#0a2f52', '#7fd4ff'), 'leaf': ('#1a7a8c', '#a8f4ff'), 'belly': ('#14507a', '#c8f0ff')},
}

RAMP_STEPS = 7


def build_palette(spec):
    """Flatten a palette spec into (index list, {(ramp, step): index})."""
    colors = [None]          # 0 is always transparent
    index = {}
    for name in ('body', 'leaf', 'belly'):
        for i, c in enumerate(ramp(*spec[name], steps=RAMP_STEPS)):
            index[(name, i)] = len(colors)
            colors.append(c)
    for name, c in (('ink', INK), ('white', WHITE), ('eye', EYE_DARK)):
        index[(name, 0)] = len(colors)
        colors.append(c)
    return colors, index


PALETTES = {}
RAMP_INDEX = {}
for _k, _spec in PALETTE_SPECS.items():
    PALETTES[_k], RAMP_INDEX[_k] = build_palette(_spec)


# ----------------------------------------------------------------- canvas ---
class Canvas:
    """An indexed-colour drawing surface.

    Pixels hold (ramp_name, shade) until `resolve()` maps them through the
    sprite's palette. Keeping them symbolic until the end is what lets the same
    silhouette be recoloured for an evolution without redrawing it.
    """

    def __init__(self, w, h, palette):
        self.w, self.h = w, h
        self.palette = palette
        self.px = [[None] * w for _ in range(h)]

    def put(self, x, y, ramp_name, shade):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = (ramp_name, max(0.0, min(1.0, shade)))

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return None

    def filled(self, x, y):
        return self.get(x, y) is not None

    # -- primitives ---------------------------------------------------------
    def sphere(self, cx, cy, rx, ry, ramp_name, light=LIGHT, ambient=0.30, squash=1.0):
        """A lit ellipsoid — the workhorse. Shade comes from a real normal."""
        lx, ly, lz = light
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u = (x + 0.5 - cx) / rx
                v = (y + 0.5 - cy) / ry
                d = u * u + v * v
                if d > 1.0:
                    continue
                nz = math.sqrt(max(0.0, 1.0 - d)) * squash
                lam = u * lx + v * ly + nz * lz
                self.put(x, y, ramp_name, ambient + (1 - ambient) * max(0.0, lam))

    def blob(self, cx, cy, rx, ry, ramp_name, shade=0.62):
        """Flat fill — for shapes that should not read as round."""
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u = (x + 0.5 - cx) / rx
                v = (y + 0.5 - cy) / ry
                if u * u + v * v <= 1.0:
                    self.put(x, y, ramp_name, shade)

    def rect(self, x0, y0, x1, y1, ramp_name, shade=0.6):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.put(x, y, ramp_name, shade)

    def poly(self, points, ramp_name, shade=0.6):
        ys = [p[1] for p in points]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(points)):
                (x0, y0), (x1, y1) = points[i], points[(i + 1) % len(points)]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / float(y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1])) + 1):
                    self.put(x, y, ramp_name, shade)

    def eye(self, cx, cy, r=2, look=(0, 0)):
        """Sclera, pupil, and the specular dot that makes a creature alive."""
        self.blob(cx, cy, r, r + 0.3, 'white', 1.0)
        self.blob(cx + look[0], cy + look[1], r * 0.62, r * 0.72, 'eye', 0.0)
        self.put(int(cx - r * 0.45), int(cy - r * 0.45), 'white', 1.0)

    # -- finishing passes ---------------------------------------------------
    def rim(self, ramp_name='leaf', strength=1.0):
        """Bounce light along the lower-right silhouette edge."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if not self.filled(x, y):
                    continue
                cur = self.px[y][x]
                if cur[0] in ('white', 'eye', 'ink'):
                    continue
                if not self.filled(x + 1, y) or not self.filled(x, y + 1):
                    add.append((x, y, cur[0]))
        for x, y, rn in add:
            old = self.px[y][x][1]
            self.px[y][x] = (rn, min(1.0, old + 0.30 * strength))

    def outline(self):
        """One-pixel ink border around the silhouette, drawn outside it."""
        edge = []
        for y in range(self.h):
            for x in range(self.w):
                if self.filled(x, y):
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if self.filled(x + dx, y + dy):
                        edge.append((x, y))
                        break
        for x, y in edge:
            self.put(x, y, 'ink', 0)

    def shadow(self, cx, cy, rx, ry):
        """A contact shadow so the sprite sits on the ground rather than floats."""
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u = (x + 0.5 - cx) / rx
                v = (y + 0.5 - cy) / ry
                if u * u + v * v <= 1.0 and not self.filled(x, y):
                    self.put(x, y, 'ink', 0)

    # -- output -------------------------------------------------------------
    def resolve(self):
        idx = RAMP_INDEX[self.palette]
        rows = []
        for y in range(self.h):
            row = ''
            for x in range(self.w):
                p = self.px[y][x]
                if p is None:
                    row += TRANSPARENT
                    continue
                name, shade = p
                if name in ('ink', 'white', 'eye'):
                    row += DIGITS[idx[(name, 0)]]
                else:
                    step = int(round(shade * (RAMP_STEPS - 1)))
                    row += DIGITS[idx[(name, max(0, min(RAMP_STEPS - 1, step)))]]
            rows.append(row)
        return rows


# =========================================================================
# CREATURES — 48x48. Each is a few lit forms plus its own distinguishing
# features. All original designs.
# =========================================================================
CREATURE_SIZE = 48


def new_creature(palette):
    return Canvas(CREATURE_SIZE, CREATURE_SIZE, palette)


def sproutle(pal='sprout'):
    """A round seedling spirit with a two-leaf sprout and a pale belly."""
    c = new_creature(pal)
    # sprout stem + leaves, drawn first so the head overlaps them
    c.rect(23, 4, 24, 13, 'leaf', 0.45)
    c.sphere(18, 7, 6, 3.5, 'leaf')
    c.sphere(30, 6, 5, 3, 'leaf')
    c.shadow(24, 43, 14, 3)
    c.sphere(24, 27, 16, 15, 'body')          # body
    c.sphere(24, 34, 10, 8, 'belly')          # belly patch
    c.sphere(12, 34, 5, 6, 'body')            # feet
    c.sphere(36, 34, 5, 6, 'body')
    c.eye(18, 24, 3, (0, 0))
    c.eye(31, 24, 3, (0, 0))
    c.blob(24.5, 30, 2.4, 1.4, 'leaf', 0.25)  # mouth
    c.rim('leaf')
    c.outline()
    return c


def bloomtail(pal='bloom'):
    """Sproutle in flower: an open bloom instead of a sprout, and taller."""
    c = new_creature(pal)
    c.shadow(24, 44, 15, 3)
    c.rect(23, 6, 24, 14, 'body', 0.4)
    for ang in range(0, 360, 60):                       # petals
        px = 24 + math.cos(math.radians(ang)) * 7.5
        py = 8 + math.sin(math.radians(ang)) * 5.5
        c.sphere(px, py, 4.2, 3.4, 'leaf')
    c.sphere(24, 8, 3.2, 2.6, 'belly')                  # flower centre
    c.sphere(24, 29, 16, 14, 'body')
    c.sphere(24, 35, 10, 7, 'belly')
    c.sphere(11, 36, 5, 6, 'body')
    c.sphere(37, 36, 5, 6, 'body')
    c.eye(18, 26, 3.1)
    c.eye(31, 26, 3.1)
    c.blob(24.5, 32, 2.6, 1.5, 'leaf', 0.3)
    c.rim('leaf')
    c.outline()
    return c


def pyrelynx(pal='pyre'):
    """Emberkit grown: long flame ears, a mane, a burning crest."""
    c = new_creature(pal)
    c.shadow(24, 44, 14, 3)
    c.poly([(9, 18), (12, 1), (19, 16)], 'leaf', 0.8)   # tall flame ears
    c.poly([(39, 18), (36, 1), (29, 16)], 'leaf', 0.8)
    for ang in range(0, 360, 45):                        # mane
        px = 24 + math.cos(math.radians(ang)) * 15
        py = 27 + math.sin(math.radians(ang)) * 14
        c.sphere(px, py, 5, 4.5, 'leaf', ambient=0.5)
    c.sphere(24, 27, 15, 14, 'body')
    c.sphere(24, 34, 9, 6, 'belly')
    c.poly([(24, 11), (29, 22), (24, 19), (19, 22)], 'leaf', 1.0)
    c.eye(18, 25, 3.2)
    c.eye(31, 25, 3.2)
    c.blob(24.5, 32, 1.9, 1.2, 'eye', 0.0)
    c.rim('leaf')
    c.outline()
    return c


def emberkit(pal='ember'):
    """An ember cub: tufted ears, a flame mark, a bright muzzle."""
    c = new_creature(pal)
    c.shadow(24, 43, 13, 3)
    c.poly([(11, 16), (14, 3), (20, 15)], 'body', 0.5)   # ears
    c.poly([(37, 16), (34, 3), (28, 15)], 'body', 0.5)
    c.sphere(24, 26, 16, 15, 'body')
    c.sphere(24, 33, 9, 6.5, 'belly')                    # muzzle
    c.sphere(11, 35, 5, 5, 'body')
    c.sphere(37, 35, 5, 5, 'body')
    c.poly([(24, 12), (28, 20), (24, 18), (20, 20)], 'leaf', 1.0)  # flame mark
    c.eye(18, 24, 3.2)
    c.eye(31, 24, 3.2)
    c.blob(24.5, 31, 1.8, 1.2, 'eye', 0.0)               # nose
    c.rim('leaf')
    c.outline()
    return c


def dewbble(pal='dew'):
    """A droplet companion — pointed crown, wide translucent body."""
    c = new_creature(pal)
    c.shadow(24, 43, 12, 3)
    c.poly([(24, 4), (33, 26), (15, 26)], 'body', 0.75)  # crown taper
    c.sphere(24, 29, 15, 13, 'body')
    c.sphere(20, 24, 6, 7, 'leaf', ambient=0.55)         # inner shine
    c.sphere(24, 36, 8, 5, 'belly')
    c.eye(18, 27, 3.2)
    c.eye(31, 27, 3.2)
    c.blob(24.5, 33, 2.2, 1.3, 'eye', 0.0)
    c.rim('leaf', 1.2)
    c.outline()
    return c


def tidewade(pal='tide'):
    """Dewbble grown into a cresting wave, with a foam crown."""
    c = new_creature(pal)
    c.shadow(24, 44, 14, 3)
    c.poly([(24, 2), (36, 24), (12, 24)], 'body', 0.8)
    for fx, fy, fr in ((16, 8, 4), (24, 4, 4.5), (32, 9, 3.6), (12, 14, 3)):
        c.sphere(fx, fy, fr, fr * 0.85, 'leaf', ambient=0.68)   # foam crown
    c.sphere(24, 30, 16, 14, 'body')
    c.sphere(19, 25, 6, 7, 'leaf', ambient=0.55)
    c.sphere(24, 37, 9, 5, 'belly')
    c.eye(18, 28, 3.3)
    c.eye(31, 28, 3.3)
    c.blob(24.5, 34, 2.2, 1.3, 'eye', 0.0)
    c.rim('leaf', 1.2)
    c.outline()
    return c


def pebblepup(pal='rock'):
    """Stone pup — blocky muzzle, chipped ears, banded flank."""
    c = new_creature(pal)
    c.shadow(24, 43, 13, 3)
    c.poly([(10, 17), (13, 5), (19, 16)], 'body', 0.45)
    c.poly([(38, 17), (35, 5), (29, 16)], 'body', 0.45)
    c.sphere(24, 27, 16, 14, 'body')
    c.rect(9, 30, 39, 31, 'leaf', 0.75)                  # strata band
    c.sphere(24, 34, 9, 6, 'belly')
    c.sphere(12, 37, 5, 4, 'body')
    c.sphere(36, 37, 5, 4, 'body')
    c.eye(18, 24, 3)
    c.eye(31, 24, 3)
    c.blob(24.5, 32, 2, 1.2, 'eye', 0.0)
    c.rim('leaf')
    c.outline()
    return c


def wispurr(pal='air'):
    """A breeze spirit: pointed ears, no feet, and a tail that dissipates."""
    c = new_creature(pal)
    # tail curls away to the lower right and thins as it goes
    for i, (x, y, r) in enumerate(((30, 36, 6), (36, 40, 4.4), (41, 43, 2.8), (45, 45, 1.6))):
        c.sphere(x, y, r, r * 0.85, 'leaf', ambient=0.62 - i * 0.06)
    c.poly([(9, 16), (12, 2), (20, 14)], 'body', 0.55)   # ears
    c.poly([(37, 16), (34, 2), (26, 14)], 'body', 0.55)
    c.sphere(23, 23, 15, 14, 'body')
    c.sphere(23, 29, 8, 5, 'belly')
    c.eye(17, 21, 3.3)
    c.eye(30, 21, 3.3)
    for wx in (15, 20, 26, 31):                          # whisker marks
        c.put(wx, 27, 'leaf', 0.2)
    c.blob(23.5, 27, 2, 1.2, 'eye', 0.0)
    c.rim('leaf', 1.3)
    c.outline()
    return c


def sporelet(pal='spore'):
    """Cap-and-stem, spotted, with a small solemn face on the stem."""
    c = new_creature(pal)
    c.shadow(24, 43, 11, 3)
    c.rect(18, 26, 30, 41, 'belly', 0.7)                 # stem
    c.sphere(24, 40, 7, 4, 'belly')
    c.sphere(24, 22, 18, 12, 'body')                     # cap
    for sx, sy, sr in ((15, 18, 3), (30, 17, 2.6), (23, 14, 2.2), (35, 23, 2)):
        c.blob(sx, sy, sr, sr * 0.85, 'leaf', 1.0)       # spots
    c.eye(20, 33, 2.6)
    c.eye(29, 33, 2.6)
    c.blob(24.5, 38, 1.6, 1, 'eye', 0.0)
    c.rim('leaf')
    c.outline()
    return c


def sludgewad(pal='sludge'):
    """Junk-food obstacle: a slumped, dripping mass."""
    c = new_creature(pal)
    c.shadow(24, 43, 16, 3)
    c.sphere(24, 30, 19, 13, 'body', squash=0.7)
    c.sphere(15, 22, 7, 6, 'body')                       # lumps
    c.sphere(33, 24, 6, 5, 'body')
    for dx, dy, r in ((10, 41, 2.4), (19, 43, 2), (30, 43, 2.2), (39, 41, 1.8)):
        c.sphere(dx, dy, r, r * 1.3, 'leaf', ambient=0.45)   # drips
    c.eye(18, 27, 3.4)
    c.eye(31, 27, 3.4)
    c.rect(19, 34, 30, 35, 'eye', 0.0)                   # flat grim mouth
    c.rim('leaf')
    c.outline()
    return c


def snoozeghoul(pal='snooze'):
    """Late-night obstacle: heavy-lidded, drifting, with Zs."""
    c = new_creature(pal)
    c.sphere(22, 27, 16, 14, 'body')
    c.sphere(22, 34, 9, 6, 'belly')
    for zx, zy, zr in ((38, 8, 3), (43, 15, 2.2)):       # drifting Zs
        c.rect(zx - zr, zy - zr, zx + zr, zy - zr, 'leaf', 1.0)
        c.rect(zx - zr, zy + zr, zx + zr, zy + zr, 'leaf', 1.0)
        c.poly([(zx + zr, zy - zr), (zx - zr, zy + zr), (zx - zr + 1, zy + zr)], 'leaf', 1.0)
    c.blob(16, 25, 3.4, 1.2, 'eye', 0.0)                 # closed eyes
    c.blob(28, 25, 3.4, 1.2, 'eye', 0.0)
    c.blob(22, 32, 2.6, 2, 'eye', 0.0)                   # yawning mouth
    c.rim('leaf')
    c.outline()
    return c


def couchlurk(pal='couch'):
    """Sedentary obstacle — an armchair that has swallowed someone whole."""
    c = new_creature(pal)
    c.shadow(24, 45, 17, 2.5)
    c.sphere(24, 20, 17, 9, 'body')                      # backrest
    c.rect(7, 20, 41, 36, 'body', 0.52)
    c.sphere(8, 29, 5.5, 8, 'body', ambient=0.42)        # arms, clearly proud
    c.sphere(40, 29, 5.5, 8, 'body', ambient=0.42)
    c.sphere(24, 32, 13, 5.5, 'belly')                   # seat cushion
    c.rect(14, 33, 34, 34, 'leaf', 0.3)                  # cushion seam
    c.rect(10, 37, 14, 44, 'leaf', 0.22)                 # stubby legs
    c.rect(34, 37, 38, 44, 'leaf', 0.22)
    c.eye(17, 19, 3.2)
    c.eye(31, 19, 3.2)
    c.rect(20, 25, 28, 26, 'eye', 0.0)
    c.rim('leaf')
    c.outline()
    return c


def achefang(pal='ache'):
    """Soreness obstacle: gritted fangs, tense angular body."""
    c = new_creature(pal)
    c.shadow(24, 43, 14, 3)
    c.poly([(7, 22), (13, 8), (19, 20)], 'body', 0.45)   # jagged crest
    c.poly([(41, 22), (35, 8), (29, 20)], 'body', 0.45)
    c.poly([(24, 4), (29, 18), (19, 18)], 'body', 0.5)
    c.sphere(24, 27, 16, 14, 'body')
    c.sphere(24, 34, 11, 7, 'belly')                     # snarling muzzle
    c.rect(14, 32, 34, 33, 'eye', 0.0)                   # mouth line
    for tx in range(15, 34, 5):                          # fangs, upper and lower
        c.poly([(tx, 33), (tx + 4, 33), (tx + 2, 38)], 'white', 1.0)
        c.poly([(tx + 2, 32), (tx + 6, 32), (tx + 4, 28)], 'white', 1.0)
    c.eye(17, 23, 3.2)
    c.eye(31, 23, 3.2)
    for bx in (13, 35):                                  # furrowed brows
        c.rect(bx - 4, 18, bx + 4, 19, 'eye', 0.0)
    c.rim('leaf')
    c.outline()
    return c


# =========================================================================
# HERO — 24x32, four facings x two step frames. The overworld had one static
# forward-facing sprite; a walk cycle is most of what makes a tile map feel
# alive.
# =========================================================================
HERO_W, HERO_H = 24, 32


def hero(facing='down', step=0):
    """One sprite per facing, and the facings must actually differ.

    The first pass drew the same front-facing figure four times with only the
    eyes moved, so turning around changed nothing on screen. Up shows the back
    of the head and no face at all; the profiles narrow the body, show one eye,
    and put the near arm in front.
    """
    c = Canvas(HERO_W, HERO_H, 'hero')
    swing = (0, 2, 0, -2)[step % 4]
    side = facing in ('left', 'right')
    c.shadow(12, 30, 7, 2)

    # legs — the swing is big enough to see at 24px
    c.rect(8, 23, 10, 29 + max(0, swing), 'leaf', 0.22)
    c.rect(13, 23, 15, 29 + max(0, -swing), 'leaf', 0.22)
    c.rect(7, 29 + max(0, swing), 10, 30 + max(0, swing), 'ink', 0)     # shoes
    c.rect(13, 29 + max(0, -swing), 16, 30 + max(0, -swing), 'ink', 0)

    # body: narrower in profile so the turn reads on silhouette alone
    c.sphere(12, 19, 5.5 if side else 7, 6, 'body')
    if side:
        # only the near arm is visible, and it swings
        ax = 8 if facing == 'left' else 16
        c.sphere(ax, 19 + swing, 2.4, 4.2, 'body', ambient=0.38)
    else:
        c.sphere(4.5, 18 + swing, 2.6, 4.2, 'body', ambient=0.38)
        c.sphere(19.5, 18 - swing, 2.6, 4.2, 'body', ambient=0.38)

    # head
    c.sphere(12, 10, 7.5 if side else 8, 8, 'belly')

    if facing == 'up':
        # back of the head: hair covers everything, no face
        c.sphere(12, 10, 8.2, 8, 'leaf', ambient=0.5)
        c.sphere(12, 13, 5, 3, 'leaf', ambient=0.35)
    else:
        c.sphere(12, 6.5, 8.2, 5.5, 'leaf', ambient=0.5)
        c.rect(4, 6, 20, 7, 'leaf', 0.8)
        if facing == 'down':
            c.eye(9, 11, 2)
            c.eye(15, 11, 2)
            c.blob(12, 14.5, 1.4, 0.8, 'eye', 0.0)
        elif facing == 'left':
            c.eye(8, 11, 2)
            c.blob(5.5, 12, 1.6, 2.2, 'belly', 0.9)      # nose in profile
            c.sphere(16, 8, 4, 5, 'leaf', ambient=0.4)   # hair sweeps back
        else:
            c.eye(16, 11, 2)
            c.blob(18.5, 12, 1.6, 2.2, 'belly', 0.9)
            c.sphere(8, 8, 4, 5, 'leaf', ambient=0.4)

    c.rim('leaf')
    c.outline()
    return c


# =========================================================================
# ITEMS — 24x24, lit like little objects rather than flat icons.
# =========================================================================
ITEM = 24


def item_apple():
    c = Canvas(ITEM, ITEM, 'item')
    c.rect(11, 3, 12, 7, 'leaf', 0.2)
    c.sphere(16, 5, 4, 2.2, 'belly')
    c.sphere(11, 14, 8, 7.5, 'body')
    c.rim('leaf'); c.outline(); return c


def item_water():
    c = Canvas(ITEM, ITEM, 'dew')
    c.rect(9, 2, 14, 5, 'leaf', 0.5)
    c.rect(7, 6, 16, 21, 'body', 0.55)
    c.sphere(11, 14, 5, 7, 'leaf', ambient=0.55)
    c.rect(7, 11, 16, 12, 'belly', 0.9)
    c.rim('leaf'); c.outline(); return c


def item_energybar():
    c = Canvas(ITEM, ITEM, 'ember')
    c.rect(3, 8, 20, 16, 'body', 0.55)
    c.rect(3, 8, 20, 9, 'leaf', 0.95)
    for x in range(6, 19, 4):
        c.rect(x, 11, x + 1, 14, 'belly', 0.85)
    c.rim('leaf'); c.outline(); return c


def item_charm():
    c = Canvas(ITEM, ITEM, 'item')
    c.sphere(8, 9, 5.5, 5, 'body')
    c.sphere(16, 9, 5.5, 5, 'body')
    c.poly([(2, 11), (22, 11), (12, 21)], 'body', 0.62)
    c.blob(8, 7, 2, 1.4, 'white', 1.0)
    c.rim('leaf'); c.outline(); return c


def item_token():
    c = Canvas(ITEM, ITEM, 'item')
    c.sphere(12, 12, 10, 10, 'body')
    c.rect(2, 11, 22, 12, 'leaf', 0.25)
    c.sphere(12, 12, 4, 4, 'belly')
    c.blob(12, 12, 2, 2, 'white', 1.0)
    c.rim('leaf'); c.outline(); return c


def mod_droplet():
    c = Canvas(ITEM, ITEM, 'dew')
    c.poly([(12, 2), (19, 14), (5, 14)], 'body', 0.7)
    c.sphere(12, 15, 7.5, 7, 'body')
    c.sphere(9, 13, 2.6, 3.4, 'leaf', ambient=0.6)
    c.rim('leaf', 1.2); c.outline(); return c


def mod_plate():
    c = Canvas(ITEM, ITEM, 'sprout')
    c.sphere(8, 9, 4.5, 3.4, 'leaf')
    c.sphere(15, 8, 4, 3, 'leaf')
    c.sphere(12, 11, 5, 3, 'body')
    c.poly([(2, 13), (22, 13), (18, 20), (6, 20)], 'belly', 0.95)
    c.rect(2, 13, 22, 14, 'leaf', 1.0)
    c.outline(); return c


def mod_check():
    c = Canvas(ITEM, ITEM, 'item')
    c.rect(2, 3, 21, 20, 'body', 0.5)
    c.rect(2, 3, 21, 4, 'leaf', 0.9)
    for i in range(4):                       # the tick — thick enough to see
        c.rect(5 + i, 11 + i, 7 + i, 13 + i, 'belly', 1.0)
    for i in range(8):
        c.rect(8 + i, 15 - i, 10 + i, 17 - i, 'belly', 1.0)
    c.outline(); return c


def mod_barbell():
    c = Canvas(ITEM, ITEM, 'rock')
    c.rect(2, 7, 6, 17, 'body', 0.6)
    c.rect(17, 7, 21, 17, 'body', 0.6)
    c.rect(6, 10, 17, 14, 'leaf', 0.85)
    c.rect(6, 10, 17, 11, 'belly', 1.0)
    c.rim('leaf'); c.outline(); return c


def mod_moon():
    c = Canvas(ITEM, ITEM, 'snooze')
    c.sphere(10, 12, 9, 9, 'body')
    for y in range(ITEM):                    # bite the crescent out
        for x in range(ITEM):
            if (x - 16) ** 2 + (y - 9) ** 2 <= 8 ** 2:
                c.px[y][x] = None
    c.blob(18, 18, 1.6, 1.6, 'leaf', 1.0)
    c.blob(21, 6, 1.2, 1.2, 'leaf', 1.0)
    c.rim('leaf'); c.outline(); return c


def mod_still():
    c = Canvas(ITEM, ITEM, 'dew')
    c.sphere(12, 6, 4, 4, 'body')            # head
    c.poly([(4, 19), (20, 19), (16, 11), (8, 11)], 'body', 0.6)   # torso
    c.rect(2, 19, 21, 21, 'leaf', 0.4)       # mat
    c.rim('leaf'); c.outline(); return c


# =========================================================================
# TILES — 16x16, textured. The overworld used flat coloured rectangles, which
# is the single biggest reason it read as a mockup rather than a game.
# =========================================================================
TILE = 16


def tile(palette):
    return Canvas(TILE, TILE, palette)


def tile_grass(variant=0):
    c = tile('terra')
    c.rect(0, 0, 15, 15, 'body', 0.62)
    tufts = ((3, 4), (11, 7), (6, 12), (13, 13)) if variant == 0 else ((8, 3), (2, 9), (12, 10))
    for tx, ty in tufts:
        c.put(tx, ty, 'body', 0.85)
        c.put(tx, ty - 1, 'body', 0.85)
        c.put(tx + 1, ty, 'body', 0.42)
    return c


def tile_tallgrass():
    c = tile('terra')
    c.rect(0, 0, 15, 15, 'body', 0.5)
    for bx in range(1, 15, 4):
        for by in (3, 10):
            c.rect(bx, by, bx, by + 4, 'body', 0.88)
            c.rect(bx + 1, by + 1, bx + 1, by + 4, 'body', 0.34)
            c.put(bx - 1, by + 2, 'body', 0.72)
    return c


def tile_path():
    c = tile('terra')
    c.rect(0, 0, 15, 15, 'leaf', 0.72)
    for gx, gy in ((2, 3), (9, 2), (5, 8), (12, 10), (7, 13)):
        c.put(gx, gy, 'leaf', 0.52)
        c.put(gx + 1, gy, 'leaf', 0.9)
    c.rect(0, 0, 15, 0, 'leaf', 0.88)
    c.rect(0, 15, 15, 15, 'leaf', 0.5)
    return c


def tile_tree():
    """Trunk and canopy have to be different VALUES, not just different shapes —
    a dark-green ball on a mid-green field is a green square from two feet away."""
    c = tile('terra')
    c.rect(0, 0, 15, 15, 'body', 0.34)           # shaded ground under the tree
    c.rect(6, 9, 9, 15, 'leaf', 0.22)            # trunk, warm and dark
    c.rect(6, 9, 6, 15, 'leaf', 0.34)
    c.sphere(8, 6, 8, 7, 'body', ambient=0.5)    # canopy, clearly lighter
    c.sphere(5, 4, 3.5, 3, 'body', ambient=0.72)
    for lx, ly in ((11, 3), (13, 8), (2, 7), (9, 1)):
        c.put(lx, ly, 'body', 1.0)
    return c


def tile_water(frame=0):
    """Horizontal crests with a dark trough under each — scattered dots read as
    noise, not as water."""
    c = tile('dew')
    c.rect(0, 0, 15, 15, 'body', 0.42)
    off = frame * 4
    for wy in (2, 7, 12):
        for wx in range(0, 16, 8):
            x = (wx + off) % 16
            for k in range(5):
                c.put((x + k) % 16, wy, 'leaf', 1.0)
                c.put((x + k) % 16, wy + 1, 'body', 0.22)
    return c


def tile_flowers():
    c = tile_grass(0)
    for fx, fy, rampn in ((4, 5, 'leaf'), (11, 9, 'belly'), (7, 12, 'leaf')):
        c.put(fx, fy - 1, rampn, 1.0)
        c.put(fx - 1, fy, rampn, 1.0)
        c.put(fx + 1, fy, rampn, 1.0)
        c.put(fx, fy + 1, rampn, 1.0)
        c.put(fx, fy, 'belly', 1.0)
    return c


def tile_roof(pal):
    c = tile(pal)
    c.rect(0, 0, 15, 15, 'body', 0.6)
    for ry in range(0, 16, 4):                   # shingle courses
        c.rect(0, ry, 15, ry, 'body', 0.85)
        c.rect(0, ry + 3, 15, ry + 3, 'body', 0.34)
        for rx in range((0 if (ry // 4) % 2 == 0 else 4), 16, 8):
            c.rect(rx, ry + 1, rx, ry + 2, 'body', 0.42)
    return c


def tile_wall(pal):
    c = tile(pal)
    c.rect(0, 0, 15, 15, 'belly', 0.78)
    for by in range(0, 16, 5):                   # brick courses
        c.rect(0, by, 15, by, 'belly', 0.55)
        for bx in range((0 if (by // 5) % 2 == 0 else 4), 16, 8):
            c.rect(bx, by, bx, by + 4, 'belly', 0.55)
    return c


def tile_window(pal):
    c = tile_wall(pal)
    c.rect(3, 4, 12, 11, 'leaf', 0.3)
    c.rect(4, 5, 11, 10, 'leaf', 0.92)
    c.rect(7, 5, 8, 10, 'leaf', 0.3)
    c.rect(4, 7, 11, 8, 'leaf', 0.3)
    return c


def tile_door(pal):
    c = tile_wall(pal)
    c.rect(3, 3, 12, 15, 'body', 0.25)
    c.rect(4, 4, 11, 15, 'body', 0.45)
    c.put(10, 9, 'leaf', 1.0)                    # handle
    return c


def tile_gate():
    c = tile_path()
    c.poly([(8, 3), (13, 10), (3, 10)], 'belly', 1.0)
    c.poly([(8, 5), (11, 9), (5, 9)], 'leaf', 0.35)
    return c


# =========================================================================
# REGISTRY
# =========================================================================
def build_all():
    s = {}

    def add(name, canvas):
        s[name] = {'palette': canvas.palette, 'grid': canvas.resolve()}

    # creatures
    add('sproutle', sproutle()); add('bloomtail', bloomtail())
    add('emberkit', emberkit()); add('pyrelynx', pyrelynx())
    add('dewbble', dewbble()); add('tidewade', tidewade())
    add('pebblepup', pebblepup()); add('wispurr', wispurr()); add('sporelet', sporelet())
    add('sludgewad', sludgewad()); add('snoozeghoul', snoozeghoul())
    add('couchlurk', couchlurk()); add('achefang', achefang())

    # hero: four facings, idle + two step frames
    for facing in ('down', 'up', 'left', 'right'):
        add('hero_%s' % facing, hero(facing, 0))
        add('hero_%s_a' % facing, hero(facing, 1))
        add('hero_%s_b' % facing, hero(facing, 3))

    # items + module icons
    add('item_apple', item_apple()); add('item_water', item_water())
    add('item_energybar', item_energybar()); add('item_charm', item_charm())
    add('item_token', item_token())
    add('mod_droplet', mod_droplet()); add('mod_plate', mod_plate())
    add('mod_check', mod_check()); add('mod_barbell', mod_barbell())
    add('mod_moon', mod_moon()); add('mod_still', mod_still())

    # tiles
    add('tile_grass', tile_grass(0)); add('tile_grass_b', tile_grass(1))
    add('tile_tallgrass', tile_tallgrass())
    add('tile_path', tile_path()); add('tile_tree', tile_tree())
    add('tile_water', tile_water(0)); add('tile_water_b', tile_water(1))
    add('tile_flowers', tile_flowers())
    add('tile_roof_rest', tile_roof('ache')); add('tile_roof_gym', tile_roof('hero'))
    add('tile_wall', tile_wall('couch')); add('tile_window', tile_window('couch'))
    add('tile_door', tile_door('couch')); add('tile_gate', tile_gate())
    return s


SPRITES = build_all()


# =========================================================================
# VALIDATE / PREVIEW / EMIT
# =========================================================================
def validate():
    ok = True
    for name, spr in SPRITES.items():
        grid = spr['grid']
        pal = PALETTES[spr['palette']]
        w = len(grid[0])
        if any(len(r) != w for r in grid):
            print('  ! %s: ragged rows' % name); ok = False
        if not grid or w == 0:
            print('  ! %s: empty' % name); ok = False
        painted = sum(1 for r in grid for ch in r if ch != TRANSPARENT)
        if painted == 0:
            print('  ! %s: nothing drawn' % name); ok = False
        for r in grid:
            for ch in r:
                if ch == TRANSPARENT:
                    continue
                i = DIGITS.find(ch)
                if i < 0 or i >= len(pal) or pal[i] is None:
                    print('  ! %s: bad index %r' % (name, ch)); ok = False
    print('  OK (%d sprites)' % len(SPRITES) if ok else '  FAILED')
    return ok


def write_png(path, rows_rgba, w, h):
    def chunk(typ, data):
        c = typ + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw += bytes(rows_rgba[y * w + x])
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n'
                + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
                + chunk(b'IEND', b''))


def render_contact_sheet(cols=8, cell=56, scale=2):
    names = list(SPRITES.keys())
    rows = (len(names) + cols - 1) // cols
    IW, IH = cols * cell * scale, rows * cell * scale
    px = [[18, 16, 30, 255] for _ in range(IW * IH)]
    for i, name in enumerate(names):
        spr = SPRITES[name]
        grid, pal = spr['grid'], PALETTES[spr['palette']]
        gw, gh = len(grid[0]), len(grid)
        ox = (i % cols) * cell + (cell - gw) // 2
        oy = (i // cols) * cell + (cell - gh) // 2
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch == TRANSPARENT:
                    continue
                col = (*hex_to_rgb(pal[DIGITS.find(ch)]), 255)
                for sy in range(scale):
                    for sx in range(scale):
                        X, Y = (ox + x) * scale + sx, (oy + y) * scale + sy
                        if 0 <= X < IW and 0 <= Y < IH:
                            px[Y * IW + X] = list(col)
    out = os.path.join(HERE, 'sprite_preview.png')
    write_png(out, px, IW, IH)
    print('  wrote %s (%dx%d)' % (out, IW, IH))


def emit_js():
    body = ('// AUTO-GENERATED by tools/make_sprites.py — original pixel art.\n'
            '// Grids are rows of base-36 palette indices; "." is transparent.\n'
            '// Palettes live here too, so nothing has to be mirrored by hand.\n\n')
    body += 'export const SPRITE_PALETTES = ' + json.dumps(
        {k: ['transparent' if c is None else c for c in v] for k, v in PALETTES.items()}, indent=2) + ';\n\n'
    body += 'export const SPRITES = ' + json.dumps(SPRITES, indent=2) + ';\n\nexport default SPRITES;\n'
    out = os.path.join(ROOT, 'src', 'data', 'sprites.js')
    with open(out, 'w') as f:
        f.write(body)
    print('  wrote %s (%.0f KB)' % (out, len(body) / 1024.0))


if __name__ == '__main__':
    print('Validating sprites...')
    validate()
    print('Rendering preview...')
    render_contact_sheet()
    emit_js()
    print('Done.')
