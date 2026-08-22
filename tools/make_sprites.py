#!/usr/bin/env python3
"""Author + validate + preview Companion Quest pixel art.

Source of truth for every original sprite and tile in the game. Procedural art
is drawn here; approved reference cutouts in tools/reference_art are converted
to traced JSON. This script emits src/data/sprites.js for the renderer.

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
import os, struct, zlib, json, math, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

TRANSPARENT = '.'
# Palette indices, at the practical maximum: every printable ASCII character
# except '.' (transparent), plus the quote, double-quote and backslash that
# would need escaping in JSON or in the JS literal that reads it. Ninety
# colours per sprite. Base-36 capped this at 35, which was the hard ceiling on
# how finely anything could be shaded.
# src/components/PixelArt.js holds the same string and indexes it by lookup.
DIGITS = '!#$%&()*+,-/0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~'

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


def rgb_to_hsv(c):
    r, g, b = [v / 255.0 for v in c]
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d == 0:
        h = 0.0
    elif mx == r:
        h = (60 * ((g - b) / d)) % 360
    elif mx == g:
        h = 60 * ((b - r) / d) + 120
    else:
        h = 60 * ((r - g) / d) + 240
    return h, (0 if mx == 0 else d / mx), mx


def hsv_to_rgb(h, s, v):
    h = h % 360
    c = v * s
    x = c * (1 - abs((h / 60.0) % 2 - 1))
    m = v - c
    r, g, b = ((c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x))[int(h // 60)]
    return ((r + m) * 255, (g + m) * 255, (b + m) * 255)


def mix(a, b, t):
    ca, cb = hex_to_rgb(a), hex_to_rgb(b)
    return rgb_to_hex(tuple(ca[i] + (cb[i] - ca[i]) * t for i in range(3)))


# Shadows drift cool and gain saturation; highlights drift warm and lose it.
# This is the single biggest difference between a ramp that looks like pixel art
# and one that looks like a mechanical fade — straight RGB interpolation between
# a dark and a light version of the same hue reads muddy and plastic.
# Tuned down from (-30, 1.22): the swing was strong enough that a warm
# creature's shadows became saturated red, so contact shading read as red LINES
# drawn on the model rather than as shadow. A hue shift should be felt, not
# seen — the shadow still has to look like the same material in less light.
SHADOW_HUE = -16      # degrees toward blue/violet at the dark end
LIGHT_HUE = 18        # degrees toward yellow at the light end
SHADOW_SAT = 1.06
LIGHT_SAT = 0.66


def ramp(dark, light, steps=6, gamma=0.82):
    hd, sd, vd = rgb_to_hsv(hex_to_rgb(dark))
    hl, sl, vl = rgb_to_hsv(hex_to_rgb(light))
    out = []
    for i in range(steps):
        t = (i / (steps - 1.0)) ** gamma
        # value and saturation interpolate; hue swings through the base
        v = vd + (vl - vd) * t
        s_ = (sd * SHADOW_SAT) + ((sl * LIGHT_SAT) - (sd * SHADOW_SAT)) * t
        # Hue is a circle, so it has to travel the short way round. Interpolated
        # as a plain number, a ramp whose ends straddle red (hue ~350 deg to
        # ~10 deg) takes the 340-degree detour through cyan rather than the
        # 20-degree hop
        # across the wrap — which is why a red-to-coral character ramp came out
        # purple in the midtones and blue at the top. Greens and blues never
        # straddle the seam, which is why no creature ever showed it.
        h0 = hd + SHADOW_HUE
        h1 = hl + LIGHT_HUE
        delta = (h1 - h0) % 360.0
        if delta > 180.0:
            delta -= 360.0
        h = h0 + delta * t
        out.append(rgb_to_hex(hsv_to_rgb(h, max(0.0, min(1.0, s_)), max(0.0, min(1.0, v)))))
    return out


INK = '#140f22'
WHITE = '#fdfdff'
EYE_DARK = '#1b1430'

# A palette is a set of named ramps plus the shared fixed colours. Sprites name
# a ramp and a shade; the flat index list is generated, so nothing has to be
# mirrored by hand anywhere else.
PALETTE_SPECS = {
    # belly was ('#2c5624', ...) — its midtones landed on khaki, so the pale
    # front read as a dirty stain rather than lighter fur.
    'sprout':  {'body': ('#0d3320', '#b6f7c2'), 'leaf': ('#1b5426', '#dcff9e'), 'belly': ('#5a7a3e', '#f6ffe4')},
    # belly was ('#7a3c1e', ...) — hue-shifted into rose, so the chest patch and
    # the muzzle both read as bare pink skin instead of pale fur.
    'ember':   {'body': ('#331306', '#ffd89c'), 'leaf': ('#b8431c', '#ffe3a0'), 'belly': ('#6b4a24', '#fff2d4')},
    'dew':     {'body': ('#07223d', '#c8f2ff'), 'leaf': ('#0f4a72', '#eafcff'), 'belly': ('#134a68', '#f0ffff')},
    'sludge':  {'body': ('#2e3d18', '#b6d16a'), 'leaf': ('#46561f', '#d6e88a'), 'belly': ('#3d4a22', '#c6dd7c')},
    'snooze':  {'body': ('#2a2650', '#b9b6ee'), 'leaf': ('#413a72', '#d5d2ff'), 'belly': ('#38346a', '#c9c6f7')},
    'ache':    {'body': ('#6b1730', '#ffb0c4'), 'leaf': ('#93253f', '#ffd0dc'), 'belly': ('#7d2038', '#ffc2d2')},
    'couch':   {'body': ('#3f2a17', '#d4a374'), 'leaf': ('#5a3d22', '#e8c49a'), 'belly': ('#4d3520', '#dcb387')},
    'item':    {'body': ('#7a1440', '#ff9dc0'), 'leaf': ('#a8801a', '#ffe486'), 'belly': ('#1d6b3a', '#8ef0a8')},
    'rock':    {'body': ('#2f3040', '#c8ccdc'), 'leaf': ('#4a4d63', '#e2e6f2'), 'belly': ('#3a3c4f', '#d4d8e8')},
    'air':     {'body': ('#3f5f7a', '#e8f8ff'), 'leaf': ('#5c7f9c', '#ffffff'), 'belly': ('#4d6e8a', '#f4fcff')},
    'spore':   {'body': ('#6b1a2a', '#ff9c9c'), 'leaf': ('#8a2f24', '#ffd0b0'), 'belly': ('#8a5c48', '#ffe0c8')},
    'terra':   {'body': ('#2a4a1c', '#9fd96a'), 'leaf': ('#7a5a1e', '#e8c46a'), 'belly': ('#4a6b2a', '#c8e88a')},
    # Water meeting grass has to live in ONE tile, so the shore palette carries
    # both banks: body is the water, leaf is the turf, belly is the wet margin.
    'shore':   {'body': ('#0b3350', '#63c9e8'), 'leaf': ('#2a4a1c', '#9fd96a'), 'belly': ('#6b5a34', '#f2e4ba')},
    'bloom':   {'body': ('#1a5c44', '#8ce8b0'), 'leaf': ('#a8285e', '#ffb8d8'), 'belly': ('#c49a1e', '#fff0a8')},
    'pyre':    {'body': ('#6b1408', '#ff9440'), 'leaf': ('#c47a0a', '#ffe066'), 'belly': ('#8c2a0e', '#ffb870')},
    'tide':    {'body': ('#0a2f52', '#7fd4ff'), 'leaf': ('#1a7a8c', '#a8f4ff'), 'belly': ('#14507a', '#c8f0ff')},
    # Third-stage forms. Deeper and richer than the stage they grow out of —
    # a final form that is merely a brighter recolour reads as the same creature.
    'grove':   {'body': ('#14402a', '#7ad98e'), 'leaf': ('#5c3a18', '#d9a860'), 'belly': ('#a8801e', '#ffe89a')},
    # belly was ('#2a1410', ...) — so dark the muzzle read as a hole punched
    # through the face rather than a lighter patch of fur.
    'cinder':  {'body': ('#5c1005', '#ff8a3d'), 'leaf': ('#8a1f06', '#ffd45e'), 'belly': ('#7a3418', '#ffc48a')},
    'maels':   {'body': ('#04203f', '#6cc4ff'), 'leaf': ('#0d5c7a', '#9fe8ff'), 'belly': ('#123a5e', '#d0f2ff')},

    # People. One palette per character card, sampled from the committed art in
    # assets/characters/ rather than invented, so the overworld sprite and the
    # traced portrait are the same person. The roles are fixed across all four:
    #   body   = clothing (the only ramp outfitPalette() is allowed to touch)
    #   leaf   = hair
    #   belly  = skin
    #   accent = trim, shoes, and Maple's scarf
    # 'hero' is kept as the unstyled fallback for any sprite that predates the
    # per-character split.
    'hero':    {'body': ('#1b2f6b', '#8fb4ff'), 'leaf': ('#8a5a1e', '#ffd98a'), 'belly': ('#8a5636', '#ffd2ad')},
    'pc_woman': {
        'body': ('#1b2138', '#3f7fd6'), 'leaf': ('#2e1a0f', '#a56b45'),
        'belly': ('#7d4526', '#f7c79a'), 'accent': ('#4a4757', '#f2e1da'),
    },
    'pc_man': {
        'body': ('#1c2c1f', '#6f9a63'), 'leaf': ('#14120a', '#6b4526'),
        'belly': ('#6d4423', '#f7ddb6'), 'accent': ('#43401f', '#cbb488'),
    },
    'pc_nonbinary': {
        'body': ('#4a1d1e', '#f2836a'), 'leaf': ('#3d2540', '#c79cbd'),
        'belly': ('#7a3a22', '#f4bd91'), 'accent': ('#5a2728', '#f9ebdd'),
    },
    # The Training Hall. Steel for the equipment, warm wood for benches and
    # trim, rubber for the floor — one indoor material set so the room reads as
    # a place rather than as a pile of props.
    'gym': {
        'body': ('#232833', '#c2cad6'), 'leaf': ('#4a2f18', '#e0b878'),
        'belly': ('#1e2427', '#7f8d88'), 'accent': ('#123c44', '#5fbfae'),
    },
    'coach': {
        'body': ('#12301f', '#5b9a68'), 'leaf': ('#42423a', '#e2e0d2'),
        'belly': ('#6b3d20', '#e8b184'), 'accent': ('#8a3b12', '#f2a35c'),
    },
}

RAMP_STEPS = 26


def build_palette(spec, steps=RAMP_STEPS):
    """Flatten a palette spec into (index list, {(ramp, step): index}).

    `steps` is per-palette because the sprite alphabet holds 90 entries and a
    four-ramp character palette does not fit at the creature ramp length. People
    are small on screen and made of flat garment panels, so they lose nothing to
    a shorter ramp; a creature turning a lit surface needs every step it has.
    """
    colors = [None]          # 0 is always transparent
    index = {}
    # 'accent' is optional and comes last, so a spec without one keeps exactly
    # the index layout everything else was built against. body stays first
    # because outfitPalette() recolours that range and nothing else.
    ramps = ['body', 'leaf', 'belly'] + (['accent'] if 'accent' in spec else [])
    for name in ramps:
        band = ramp(*spec[name], steps=steps)
        for i, c in enumerate(band):
            index[(name, i)] = len(colors)
            colors.append(c)
        # A keyline that is merely the ramp's darkest step reads as a coloured
        # halo — a red fringe around warm hair, cyan around blue cloth. Pull it
        # most of the way to ink: enough hue survives to tie the line to the
        # surface, not enough to glow. At 0.62 a warm creature still came out
        # ringed in bright red-brown and read as a sticker; 0.80 sits down.
        index[(name, 'line')] = len(colors)
        colors.append(mix(band[0], INK, 0.80))
    for name, c in (('ink', INK), ('white', WHITE), ('eye', EYE_DARK)):
        index[(name, 0)] = len(colors)
        colors.append(c)
    return colors, index


# A palette carrying an 'accent' ramp spends four ramps inside the same 90-entry
# alphabet, so it runs at a shorter ramp length.
CHARACTER_RAMP_STEPS = 18

PALETTES = {}
RAMP_INDEX = {}
RAMP_LEN = {}
for _k, _spec in PALETTE_SPECS.items():
    RAMP_LEN[_k] = CHARACTER_RAMP_STEPS if 'accent' in _spec else RAMP_STEPS
    PALETTES[_k], RAMP_INDEX[_k] = build_palette(_spec, RAMP_LEN[_k])


# ----------------------------------------------------------------- canvas ---
# Hard value bands, not a smooth gradient. A continuous ramp reads airbrushed;
# handheld sprite work bands into a few clear steps and lets the boundaries do
# the describing. Four bands plus the specular is the classic budget.
BANDS = 5          # default; creatures raise it (see Canvas.bands)

# 4x4 ordered dither, used only in a narrow zone either side of a band edge so
# transitions break up instead of banding as a hard contour line.
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
DITHER_ZONE = 0.30

SS = 2   # supersamples per axis when rasterising, for edge coverage


class Canvas:
    """An indexed-colour drawing surface.

    Pixels hold (ramp, shade, coverage) until `resolve()` bands them through the
    sprite's palette. Coverage comes from supersampling the shape, which is what
    gives curved edges their anti-aliased step instead of a hard staircase.

    Authoring coordinates are independent of output resolution: pass `scale` and
    the same drawing code emits a bigger, smoother sprite.
    """

    def __init__(self, w, h, palette, scale=1, bands=BANDS):
        self.scale = scale
        # More bands means a richer, more modern read; fewer keeps the chunky
        # look that suits a 16x16 tile. It should be a per-sprite decision.
        self.bands = bands
        self.w, self.h = w * scale, h * scale
        self.palette = palette
        self.px = [[None] * self.w for _ in range(self.h)]
        # Which primitive drew each pixel. `occlude()` uses it to darken an
        # older surface where a newer form sits on top, which is what makes
        # overlapping parts read as separate objects rather than one fused blob.
        self.lay = [[0] * self.w for _ in range(self.h)]
        self.layer = 0

    def begin(self):
        """Start a new form. Call before each limb/body part."""
        self.layer += 1
        return self.layer

    # -- low level ----------------------------------------------------------
    def _set(self, x, y, ramp_name, shade, cov=1.0, lit=False):
        if 0 <= x < self.w and 0 <= y < self.h:
            prev = self.px[y][x]
            if prev is not None and cov < 1.0 and prev[2] >= cov:
                return
            # `lit` marks a pixel that came off a shaded surface. Only those get
            # dithered: running the dither over a FLAT fill turns a solid colour
            # into a checkerboard, which is what made the grass and the roofs
            # read as woven fabric rather than ground and shingles.
            self.px[y][x] = (ramp_name, max(0.0, min(1.0, shade)), cov, lit)
            self.lay[y][x] = self.layer

    def clear(self):
        """Empty the surface. Overlay sprites start from nothing and draw only
        the few pixels they contribute, so they can stack over a base tile."""
        self.px = [[None] * self.w for _ in range(self.h)]
        self.lay = [[0] * self.w for _ in range(self.h)]
        return self

    def put(self, x, y, ramp_name, shade):
        """Author-space pixel — fills a scale x scale block."""
        S = self.scale
        for dy in range(S):
            for dx in range(S):
                self._set(int(x) * S + dx, int(y) * S + dy, ramp_name, shade)

    def filled(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h and self.px[y][x] is not None

    # -- primitives ---------------------------------------------------------
    def sphere(self, cx, cy, rx, ry, ramp_name, light=LIGHT, ambient=0.26, squash=1.0):
        """A lit ellipsoid, supersampled so its edge anti-aliases."""
        self.begin()
        S = self.scale
        cx, cy, rx, ry = cx * S, cy * S, rx * S, ry * S
        lx, ly, lz = light
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                hits, acc = 0, 0.0
                for sy in range(SS):
                    for sx in range(SS):
                        u = (x + (sx + 0.5) / SS - cx) / rx
                        v = (y + (sy + 0.5) / SS - cy) / ry
                        d = u * u + v * v
                        if d > 1.0:
                            continue
                        hits += 1
                        nz = math.sqrt(max(0.0, 1.0 - d)) * squash
                        acc += max(0.0, u * lx + v * ly + nz * lz)
                if not hits:
                    continue
                lam = acc / hits
                self._set(x, y, ramp_name, ambient + (1 - ambient) * lam, hits / float(SS * SS), lit=True)

    def blob(self, cx, cy, rx, ry, ramp_name, shade=0.62):
        self.begin()
        S = self.scale
        cx, cy, rx, ry = cx * S, cy * S, rx * S, ry * S
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                hits = 0
                for sy in range(SS):
                    for sx in range(SS):
                        u = (x + (sx + 0.5) / SS - cx) / rx
                        v = (y + (sy + 0.5) / SS - cy) / ry
                        if u * u + v * v <= 1.0:
                            hits += 1
                if hits:
                    self._set(x, y, ramp_name, shade, hits / float(SS * SS))

    def limb(self, x0, y0, x1, y1, r0, r1, ramp_name, light=LIGHT, ambient=0.28):
        """A lit tapered capsule: the arm, leg, neck and tail primitive.

        Creatures built only from spheres come out as eggs — the silhouette test
        on the first roster showed six creatures and six variations of the same
        blob. You cannot draw a limb with an ellipsoid, and without limbs there
        is no gesture and no recognisable shape.

        Shaded as a real cylinder: the surface normal is the perpendicular
        offset from the axis, with the z component recovered from the radius.
        """
        S = self.scale
        self.begin()
        ax, ay, bx, by = x0 * S, y0 * S, x1 * S, y1 * S
        ra, rb = r0 * S, r1 * S
        lx, ly, lz = light
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        dx, dy = bx - ax, by - ay
        seg2 = dx * dx + dy * dy or 1.0
        rmax = max(ra, rb)
        for y in range(int(min(ay, by) - rmax) - 1, int(max(ay, by) + rmax) + 2):
            for x in range(int(min(ax, bx) - rmax) - 1, int(max(ax, bx) + rmax) + 2):
                hits, acc = 0, 0.0
                for sy in range(SS):
                    for sx in range(SS):
                        px_ = x + (sx + 0.5) / SS
                        py_ = y + (sy + 0.5) / SS
                        t = max(0.0, min(1.0, ((px_ - ax) * dx + (py_ - ay) * dy) / seg2))
                        cx_, cy_ = ax + dx * t, ay + dy * t
                        r = ra + (rb - ra) * t
                        if r <= 0:
                            continue
                        ox, oy = px_ - cx_, py_ - cy_
                        d = math.sqrt(ox * ox + oy * oy)
                        if d > r:
                            continue
                        hits += 1
                        u, v = ox / r, oy / r
                        nz = math.sqrt(max(0.0, 1.0 - (d / r) ** 2))
                        acc += max(0.0, u * lx + v * ly + nz * lz)
                if not hits:
                    continue
                lam = acc / hits
                self._set(x, y, ramp_name, ambient + (1 - ambient) * lam, hits / float(SS * SS), lit=True)

    def occlude(self, strength=0.42):
        """Contact shading: darken an older surface where a newer form meets it.

        Automatic, because doing it by hand for every join is how parts end up
        fused. This is the difference between a head resting ON a body and a
        head merged INTO one.
        """
        edits = []
        for y in range(self.h):
            for x in range(self.w):
                cur = self.px[y][x]
                if cur is None or cur[0] in ('ink', 'white', 'eye'):
                    continue
                mine = self.lay[y][x]
                deep = 0
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.w and 0 <= ny < self.h and self.px[ny][nx] is not None:
                        if self.lay[ny][nx] > mine:
                            deep += 1
                if deep:
                    edits.append((x, y, min(1.0, deep / 3.0)))
        for x, y, amt in edits:
            rn, sh, cov, lit = self.px[y][x]
            self.px[y][x] = (rn, max(0.0, sh - strength * amt), cov, lit)

    def rect(self, x0, y0, x1, y1, ramp_name, shade=0.6):
        S = self.scale
        for y in range(int(y0) * S, (int(y1) + 1) * S):
            for x in range(int(x0) * S, (int(x1) + 1) * S):
                self._set(x, y, ramp_name, shade)

    def poly(self, points, ramp_name, shade=0.6):
        self.begin()
        S = self.scale
        pts = [(px * S, py * S) for px, py in points]
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / float(y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1])) + 1):
                    self._set(x, y, ramp_name, shade)

    def eye(self, cx, cy, r=2, look=(0, 0)):
        """Sclera, clipped lid, pupil, specular.

        The lid is painted ONLY over pixels that are already sclera. Drawing it
        as a free ellipse let it spill above the eye and onto the face, where it
        read as a heavy black eyebrow and made every creature look furious.
        """
        S = self.scale
        self.blob(cx, cy, r, r + 0.35, 'white', 1.0)

        # lid: darken sclera pixels above the lid line, and nothing else
        cxp, cyp, rp = cx * S, cy * S, r * S
        lid_y = cyp - rp * 0.52
        for y in range(int(cyp - rp * 1.6), int(lid_y) + 1):
            for x in range(int(cxp - rp * 1.2), int(cxp + rp * 1.2) + 1):
                if 0 <= y < self.h and 0 <= x < self.w:
                    cur = self.px[y][x]
                    if cur is not None and cur[0] == 'white':
                        self.px[y][x] = ('eye', 0.0, cur[2], False)
                        self.lay[y][x] = self.layer

        self.blob(cx + look[0], cy + look[1] + r * 0.14, r * 0.58, r * 0.66, 'eye', 0.0)

        hx, hy = int((cx - r * 0.42) * S), int((cy - r * 0.20) * S)
        for dy in range(max(2, S)):
            for dx in range(max(2, S)):
                self._set(hx + dx, hy + dy, 'white', 1.0)
        self._set(int((cx + r * 0.34) * S), int((cy + r * 0.46) * S), 'white', 1.0)

    # -- finishing passes ---------------------------------------------------
    def rim(self, ramp_name='leaf', strength=1.0):
        """Legacy edge brighten. Kept for tiles; creatures use backlight()."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                cur = self.px[y][x]
                if cur is None or cur[0] in ('white', 'eye', 'ink'):
                    continue
                if not self.filled(x + 1, y) or not self.filled(x, y + 1):
                    add.append((x, y))
        for x, y in add:
            rn, sh, cov, lit = self.px[y][x]
            self.px[y][x] = (rn, min(1.0, sh + 0.34 * strength), cov, lit)

    def backlight(self, width=2, strength=0.85):
        """A bright rim along the silhouette OPPOSITE the key light.

        This is the single most recognisable feature of modern pixel art and the
        thing the old sprites were most obviously missing. The key light comes
        from the upper left, so a second, cooler light behind and to the lower
        right catches the far edge of the form and separates the creature from
        whatever it is standing on. Without it a sprite sits flat against the
        background no matter how well the interior is shaded.
        """
        lx, ly = -LIGHT[0], -LIGHT[1]          # behind, opposite the key
        n = math.sqrt(lx * lx + ly * ly) or 1.0
        lx, ly = lx / n, ly / n
        edits = []
        for y in range(self.h):
            for x in range(self.w):
                cur = self.px[y][x]
                if cur is None or cur[0] in ('white', 'eye', 'ink'):
                    continue
                # distance to the outside, measured along the backlight
                for d in range(1, width + 1):
                    nx = int(round(x + lx * d))
                    ny = int(round(y + ly * d))
                    if not self.filled(nx, ny):
                        edits.append((x, y, 1.0 - (d - 1) / float(width)))
                        break
        for x, y, amt in edits:
            rn, sh, cov, lit = self.px[y][x]
            self.px[y][x] = (rn, min(1.0, sh + strength * amt), cov, lit)

    def spec(self, cx, cy, r, ramp_name=None, strength=1.0):
        """A sharp highlight where the form turns toward the light.

        Banded shading alone tops out at the ramp's lightest step, so nothing
        ever reads as shiny. A small explicit hotspot is what makes a surface
        look wet, waxy or furred rather than matte.
        """
        S = self.scale
        cx, cy, r = cx * S, cy * S, r * S
        for y in range(int(cy - r) - 1, int(cy + r) + 2):
            for x in range(int(cx - r) - 1, int(cx + r) + 2):
                cur = self.px[y][x] if (0 <= y < self.h and 0 <= x < self.w) else None
                if cur is None or cur[0] in ('white', 'eye', 'ink'):
                    continue
                u, v = (x + 0.5 - cx) / r, (y + 0.5 - cy) / r
                d2 = u * u + v * v
                if d2 > 1.0:
                    continue
                rn, sh, cov, lit = cur
                falloff = (1.0 - d2) ** 0.7
                self.px[y][x] = (ramp_name or rn, min(1.0, sh + strength * falloff), cov, lit)

    def outline(self, ink_below=True):
        """A COLOURED outline: each edge pixel takes the keyline of whatever ramp
        it borders, with true ink kept for the underside so the sprite still has
        a contact edge. A uniform black keyline around everything is the fastest
        way to make sprites look like clip art; a keyline that is simply the
        ramp's darkest colour is the fastest way to make them glow."""
        edge = {}
        for y in range(self.h):
            for x in range(self.w):
                if self.filled(x, y):
                    continue
                best = None
                for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)):
                    if not (0 <= y + dy < self.h and 0 <= x + dx < self.w):
                        continue
                    nb = self.px[y + dy][x + dx]
                    if nb is None or nb[0] == 'ink':
                        continue
                    # dy == 1 means the neighbour is BELOW us, i.e. we are its
                    # top edge; the underside of the sprite is dy == -1.
                    if ink_below and dy < 0:
                        best = 'ink'
                        break
                    if best is None:
                        best = nb[0]
                if best:
                    edge[(x, y)] = best
        for (x, y), rn in edge.items():
            if rn == 'ink' or rn in ('white', 'eye'):
                self._set(x, y, 'ink', 0.0)
            else:
                self._set(x, y, rn + '|line', 0.0)

    def shadow(self, cx, cy, rx, ry):
        S = self.scale
        cx, cy, rx, ry = cx * S, cy * S, rx * S, ry * S
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u = (x + 0.5 - cx) / rx
                v = (y + 0.5 - cy) / ry
                if u * u + v * v <= 1.0 and not self.filled(x, y):
                    self._set(x, y, 'ink', 0)

    # -- output -------------------------------------------------------------
    def resolve(self):
        idx = RAMP_INDEX[self.palette]
        nsteps = RAMP_LEN[self.palette]
        rows = []
        for y in range(self.h):
            row = ''
            for x in range(self.w):
                p = self.px[y][x]
                if p is None:
                    row += TRANSPARENT
                    continue
                name, shade, cov, lit = p
                if name in ('ink', 'white', 'eye'):
                    row += DIGITS[idx[(name, 0)]]
                    continue
                if name.endswith('|line'):
                    row += DIGITS[idx[(name[:-5], 'line')]]
                    continue
                # Partial coverage darkens the edge pixel — that step is the
                # anti-aliasing, and it is why curves stop reading as staircases.
                sh = shade * (0.45 + 0.55 * cov)
                if not lit:
                    # A flat fill is authored intent — the shade IS the colour
                    # choice. Band it and a tile artist loses half the values
                    # they were picking between, so take the ramp step directly.
                    step = int(round(sh * (nsteps - 1)))
                else:
                    nb = self.bands
                    pos = sh * (nb - 1)
                    band = int(pos)
                    frac = pos - band
                    # dither only near a band edge, so lit flats stay clean
                    if DITHER_ZONE > 0 and band < nb - 1:
                        lo, hi = 0.5 - DITHER_ZONE / 2, 0.5 + DITHER_ZONE / 2
                        if lo < frac < hi:
                            t = (frac - lo) / (hi - lo)
                            if t > (BAYER[y % 4][x % 4] + 0.5) / 16.0:
                                band += 1
                        elif frac >= hi:
                            band += 1
                    band = max(0, min(nb - 1, band))
                    step = int(round(band * (nsteps - 1) / float(nb - 1)))
                step = max(0, min(nsteps - 1, step))
                row += DIGITS[idx[(name, step)]]
            rows.append(row)
        return rows


# =========================================================================
# DRAWN — a hand-authored outline, inflated into a volume.
#
# Blending primitives fixed the lighting but not the shape: the silhouette was
# still a union of circles and capsules, and you can see that in the outline no
# matter how well the interior is lit. A creature built from geometry looks like
# geometry.
#
# So the outline stops being derived and starts being DRAWN. A closed contour is
# authored point by point — deliberately asymmetric, with the bumps and pinches
# a hand would make — smoothed through a Catmull-Rom spline, and filled. Volume
# then comes from the distance transform of that filled shape: every interior
# pixel knows how far it is from the edge, and that distance is inflated into a
# height. The middle of the form stands proud, the rim falls away, and the
# normal follows the drawn contour rather than any underlying circle.
#
# Interior structure — where a leg meets a body, the line under a jaw — is cut
# as a CREASE: a valley pressed into the height field along an authored line.
# That is how a drawing separates forms, and unlike a seam between two objects
# it is part of the same continuous surface.
# =========================================================================


def catmull(points, samples=12, closed=True, alpha=0.5):
    """Centripetal Catmull-Rom through hand-placed points.

    Uniform parameterisation overshoots badly wherever the spacing between
    control points varies, which scalloped the contour into a lumpy potato. The
    centripetal variant (alpha=0.5) is specifically the one that cannot form
    cusps or self-intersections, so an outline stays where it was drawn.
    """
    n = len(points)
    if n < 4:
        return list(points)

    def tj(ti, pi, pj):
        d = math.hypot(pj[0] - pi[0], pj[1] - pi[1])
        return ti + (d ** alpha if d > 1e-9 else 1e-9)

    out = []
    rng = range(n) if closed else range(1, n - 2)
    for i in rng:
        p0 = points[(i - 1) % n]
        p1 = points[i % n]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n]
        t0 = 0.0
        t1 = tj(t0, p0, p1)
        t2 = tj(t1, p1, p2)
        t3 = tj(t2, p2, p3)
        for sN in range(samples):
            t = t1 + (t2 - t1) * (sN / float(samples))
            def lerp(a_, b_, ta, tb):
                f = (tb - t) / ((tb - ta) or 1e-9)
                g = (t - ta) / ((tb - ta) or 1e-9)
                return (a_[0] * f + b_[0] * g, a_[1] * f + b_[1] * g)
            A1 = lerp(p0, p1, t0, t1)
            A2 = lerp(p1, p2, t1, t2)
            A3 = lerp(p2, p3, t2, t3)
            B1 = lerp(A1, A2, t0, t2)
            B2 = lerp(A2, A3, t1, t3)
            out.append(lerp(B1, B2, t1, t2))
    return out


def _inside(poly, x, y):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi:
                inside = not inside
        j = i
    return inside


def _seg_dist(px, py, x0, y0, x1, y1):
    dx, dy = x1 - x0, y1 - y0
    seg2 = dx * dx + dy * dy or 1e-9
    t = max(0.0, min(1.0, ((px - x0) * dx + (py - y0) * dy) / seg2))
    cx, cy = x0 + dx * t, y0 + dy * t
    return math.hypot(px - cx, py - cy)


class Drawn:
    """A creature drawn as an outline and inflated."""

    def __init__(self, palette, size=48, scale=2, bands=14):
        self.palette = palette
        self.size = size
        self.scale = scale
        self.bands = bands
        self.w = self.h = size * scale
        self.outline_pts = None
        self._mask_cov = None
        self._mask_ramp = None
        self.regions = []     # (poly, ramp)
        self.creases = []     # (pts, depth, width)
        self.ridges = []      # (pts, height, width)

    # -- authoring -----------------------------------------------------------
    def mask(self, rows, legend=None, smooth=2):
        """Draw the creature directly, as a grid of characters.

        Placing spline control points blind is drawing with coordinates, and it
        fights back: an arm becomes a spike because two points landed too close.
        A character grid is how pixel artists actually work — the shape is
        visible in the source, so it can be read and corrected like a drawing.

        The grid is authored coarse (a 32-square is comfortable to write and to
        read) and upsampled to the sprite resolution. Stair-stepping does not
        survive: the coverage is blurred before the distance transform, and the
        inflation rounds what is left.

        '.' or ' ' is empty. Every other character is body, and any character in
        `legend` also names the ramp for that area.
        """
        legend = legend or {}
        gh = len(rows)
        gw = max(len(r) for r in rows)
        cov = [[0.0] * self.w for _ in range(self.h)]
        ramp_at = [[None] * self.w for _ in range(self.h)]
        sx = self.w / float(gw)
        sy = self.h / float(gh)
        for gy, row in enumerate(rows):
            for gx, ch in enumerate(row):
                if ch in ('.', ' '):
                    continue
                r = legend.get(ch)
                for y in range(int(gy * sy), int((gy + 1) * sy)):
                    for x in range(int(gx * sx), int((gx + 1) * sx)):
                        if 0 <= y < self.h and 0 <= x < self.w:
                            cov[y][x] = 1.0
                            if r:
                                ramp_at[y][x] = r
        # Soften the ramp map too. Only the coverage was blurred, so a legend
        # area like a pale belly kept the raw mask's blocky edge and read as a
        # rectangle pasted onto a rounded body.
        for r in set(v for v in legend.values()):
            field = [[1.0 if ramp_at[y][x] == r else 0.0 for x in range(self.w)] for y in range(self.h)]
            for _ in range(smooth + 2):
                nxt = [row[:] for row in field]
                for y in range(self.h):
                    for x in range(self.w):
                        acc = n = 0.0
                        for dy in (-1, 0, 1):
                            for dx in (-1, 0, 1):
                                yy, xx = y + dy, x + dx
                                if 0 <= yy < self.h and 0 <= xx < self.w:
                                    acc += field[yy][xx]; n += 1
                        nxt[y][x] = acc / n
                field = nxt
            for y in range(self.h):
                for x in range(self.w):
                    if field[y][x] >= 0.5:
                        ramp_at[y][x] = r
                    elif ramp_at[y][x] == r:
                        ramp_at[y][x] = None

        # soften the staircase before the shape is measured
        for _ in range(smooth):
            nxt = [row[:] for row in cov]
            for y in range(self.h):
                for x in range(self.w):
                    acc = n = 0.0
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            yy, xx = y + dy, x + dx
                            if 0 <= yy < self.h and 0 <= xx < self.w:
                                acc += cov[yy][xx]
                                n += 1
                    nxt[y][x] = acc / n
            cov = nxt
        self._mask_cov = cov
        self._mask_ramp = ramp_at

    # -- authoring -----------------------------------------------------------
    def shape(self, pts, samples=14):
        S = self.scale
        self.outline_pts = [(x * S, y * S) for x, y in catmull(pts, samples)]

    def region(self, pts, ramp, samples=12):
        S = self.scale
        self.regions.append(([(x * S, y * S) for x, y in catmull(pts, samples)], ramp))

    def crease(self, pts, depth=2.2, width=1.6):
        S = self.scale
        self.creases.append(([(x * S, y * S) for x, y in pts], depth * S, width * S))

    def ridge(self, pts, height=1.6, width=2.0):
        S = self.scale
        self.ridges.append(([(x * S, y * S) for x, y in pts], height * S, width * S))

    # -- volume --------------------------------------------------------------
    def _distance_field(self):
        """Chamfer distance to the edge, for interior pixels."""
        w, h = self.w, self.h
        INF = 1e9
        d = [[INF] * w for _ in range(h)]
        inside = [[False] * w for _ in range(h)]

        if getattr(self, '_mask_cov', None) is not None:
            for y in range(h):
                for x in range(w):
                    inside[y][x] = self._mask_cov[y][x] >= 0.5
            for y in range(h):
                for x in range(w):
                    if not inside[y][x]:
                        d[y][x] = -1.0
                        continue
                    if (x == 0 or y == 0 or x == w - 1 or y == h - 1
                            or not inside[y][x - 1] or not inside[y][x + 1]
                            or not inside[y - 1][x] or not inside[y + 1][x]):
                        d[y][x] = 0.0
            return self._chamfer(d, inside)

        # scanline fill
        ys = [p[1] for p in self.outline_pts]
        for y in range(max(0, int(min(ys))), min(h, int(max(ys)) + 1)):
            xs = []
            n = len(self.outline_pts)
            for i in range(n):
                x0, y0 = self.outline_pts[i]
                x1, y1 = self.outline_pts[(i + 1) % n]
                if (y0 <= y + 0.5 < y1) or (y1 <= y + 0.5 < y0):
                    xs.append(x0 + (y + 0.5 - y0) * (x1 - x0) / ((y1 - y0) or 1e-9))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(max(0, int(math.ceil(xs[i] - 0.5))), min(w, int(xs[i + 1] + 0.5) + 1)):
                    inside[y][x] = True

        for y in range(h):
            for x in range(w):
                if inside[y][x]:
                    # boundary if any 4-neighbour is outside
                    if (x == 0 or y == 0 or x == w - 1 or y == h - 1
                            or not inside[y][x - 1] or not inside[y][x + 1]
                            or not inside[y - 1][x] or not inside[y + 1][x]):
                        d[y][x] = 0.0
                else:
                    d[y][x] = -1.0

        return self._chamfer(d, inside)

    def _chamfer(self, d, inside):
        h = len(d); w = len(d[0])
        for y in range(h):
            for x in range(w):
                if d[y][x] < 0:
                    continue
                best = d[y][x]
                for dx, dy, c in ((-1, 0, 1.0), (0, -1, 1.0), (-1, -1, 1.414), (1, -1, 1.414)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and d[ny][nx] >= 0:
                        best = min(best, d[ny][nx] + c)
                d[y][x] = best
        for y in range(h - 1, -1, -1):
            for x in range(w - 1, -1, -1):
                if d[y][x] < 0:
                    continue
                best = d[y][x]
                for dx, dy, c in ((1, 0, 1.0), (0, 1, 1.0), (1, 1, 1.414), (-1, 1, 1.414)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and d[ny][nx] >= 0:
                        best = min(best, d[ny][nx] + c)
                d[y][x] = best
        return d, inside

    def to_canvas(self, dome=7.0, ambient=0.12, backlight=1.0, gamma=1.25, base='body'):
        w, h = self.w, self.h
        S = self.scale
        R = dome * S
        d, inside = self._distance_field()
        H = [[0.0] * w for _ in range(h)]
        for y in range(h):
            for x in range(w):
                if not inside[y][x]:
                    continue
                # Quarter-circle inflation: zero at the drawn edge, full height
                # once you are `dome` in. The rim rolls over instead of ending
                # in a cliff, which is what makes it read as a body.
                t = min(1.0, d[y][x] / R)
                H[y][x] = R * math.sqrt(max(0.0, 1.0 - (1.0 - t) ** 2))

        for pts, depth, width in self.creases:
            for y in range(h):
                for x in range(w):
                    if not inside[y][x]:
                        continue
                    best = min(_seg_dist(x + 0.5, y + 0.5, pts[i][0], pts[i][1],
                                         pts[i + 1][0], pts[i + 1][1])
                               for i in range(len(pts) - 1))
                    if best < width * 3:
                        H[y][x] -= depth * math.exp(-(best / width) ** 2)
        for pts, height, width in self.ridges:
            for y in range(h):
                for x in range(w):
                    if not inside[y][x]:
                        continue
                    best = min(_seg_dist(x + 0.5, y + 0.5, pts[i][0], pts[i][1],
                                         pts[i + 1][0], pts[i + 1][1])
                               for i in range(len(pts) - 1))
                    if best < width * 3:
                        H[y][x] += height * math.exp(-(best / width) ** 2)

        c = Canvas(self.size, self.size, self.palette, scale=S, bands=self.bands)
        lx, ly, lz = LIGHT
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        bx, by = -lx, -ly

        for y in range(h):
            for x in range(w):
                if not inside[y][x]:
                    continue
                hl = H[y][x - 1] if x > 0 and inside[y][x - 1] else 0.0
                hr = H[y][x + 1] if x < w - 1 and inside[y][x + 1] else 0.0
                hu = H[y - 1][x] if y > 0 and inside[y - 1][x] else 0.0
                hd = H[y + 1][x] if y < h - 1 and inside[y + 1][x] else 0.0
                nx, ny, nz = (hl - hr), (hu - hd), 2.2
                m = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
                nx, ny, nz = nx / m, ny / m, nz / m
                lam = max(0.0, nx * lx + ny * ly + nz * lz)
                shade = ambient + (1.0 - ambient) * (lam ** gamma)
                rim = max(0.0, nx * bx + ny * by)
                edge = 1.0 - min(1.0, d[y][x] / (R * 0.9))
                shade += backlight * (rim ** 3) * (edge ** 1.5)

                ramp = base
                if self._mask_ramp is not None and self._mask_ramp[y][x]:
                    ramp = self._mask_ramp[y][x]
                for poly, rname in self.regions:
                    if _inside(poly, x + 0.5, y + 0.5):
                        ramp = rname
                c.px[y][x] = (ramp, max(0.0, min(1.0, shade)), 1.0, True)
                c.lay[y][x] = 1
        return c


# =========================================================================
# BODY — one surface, lit once.
#
# The previous model drew a creature as a union of independently lit parts: each
# sphere and capsule computed its own normal as if it were alone in space, and a
# contact pass then drew a dark seam wherever two of them met. The result read
# exactly as what it was — connected shapes, not a creature.
#
# This builds a HEIGHT FIELD instead. Every part contributes how far it stands
# off the page, the parts are combined with a SMOOTH maximum so they fuse into
# one continuous surface, and the normal is taken from the gradient of that
# combined field. Lighting happens once, over the whole body.
#
# Two things follow for free. Limbs flow out of the torso instead of being stuck
# on, because the blend actually merges the surfaces. And the valley where two
# forms meet is shaded by the same light as everything else, which is what real
# contact shading is — no seam pass required.
# =========================================================================


def smax(a, b, k):
    """Smooth maximum. `k` is the blend radius: how far either side of a join
    the two surfaces are allowed to influence each other."""
    if k <= 0:
        return max(a, b)
    h = max(0.0, k - abs(a - b)) / k
    return max(a, b) + h * h * k * 0.25


class Body:
    """A creature as one blended surface."""

    def __init__(self, palette, size=48, scale=2, bands=14, blend=2.6):
        self.palette = palette
        self.size = size
        self.scale = scale
        self.bands = bands
        self.blend = blend * scale
        self.parts = []          # (kind, args, ramp)

    # -- parts ---------------------------------------------------------------
    def ball(self, cx, cy, rx, ry, rz, ramp='body'):
        S = self.scale
        self.parts.append(('ball', (cx * S, cy * S, rx * S, ry * S, rz * S), ramp))

    def tube(self, x0, y0, x1, y1, r0, r1, ramp='body', rz=None):
        S = self.scale
        self.parts.append(('tube', (x0 * S, y0 * S, x1 * S, y1 * S, r0 * S, r1 * S,
                                    (rz if rz is not None else (r0 + r1) * 0.5) * S), ramp))

    # -- field ---------------------------------------------------------------
    def _part_height(self, kind, a, x, y):
        if kind == 'ball':
            cx, cy, rx, ry, rz = a
            u = (x - cx) / rx
            v = (y - cy) / ry
            d = u * u + v * v
            if d >= 1.0:
                return None
            return rz * math.sqrt(1.0 - d)
        x0, y0, x1, y1, r0, r1, rz = a
        dx, dy = x1 - x0, y1 - y0
        seg2 = dx * dx + dy * dy or 1.0
        t = max(0.0, min(1.0, ((x - x0) * dx + (y - y0) * dy) / seg2))
        cx, cy = x0 + dx * t, y0 + dy * t
        r = r0 + (r1 - r0) * t
        if r <= 0:
            return None
        ox, oy = x - cx, y - cy
        d = math.sqrt(ox * ox + oy * oy) / r
        if d >= 1.0:
            return None
        return rz * math.sqrt(1.0 - d * d)

    def _field(self, w, h):
        """Combined height and the ramp that owns each pixel."""
        H = [[0.0] * w for _ in range(h)]
        R = [[None] * w for _ in range(h)]
        best = [[-1e9] * w for _ in range(h)]
        for kind, a, ramp in self.parts:
            for y in range(h):
                row_h, row_r, row_b = H[y], R[y], best[y]
                for x in range(w):
                    ph = self._part_height(kind, a, x + 0.5, y + 0.5)
                    if ph is None:
                        continue
                    row_h[x] = smax(row_h[x], ph, self.blend) if row_r[x] is not None else ph
                    # The ramp belongs to whichever part stands tallest here, so
                    # a pale belly stays pale where it bulges through the torso.
                    if ph > row_b[x]:
                        row_b[x] = ph
                        row_r[x] = ramp
        return H, R

    # -- output --------------------------------------------------------------
    def to_canvas(self, ambient=0.12, backlight=1.0, gamma=1.25):
        w = h = self.size * self.scale
        c = Canvas(self.size, self.size, self.palette, scale=self.scale, bands=self.bands)
        H, R = self._field(w, h)

        lx, ly, lz = LIGHT
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        bx, by = -lx, -ly

        for y in range(h):
            for x in range(w):
                if R[y][x] is None:
                    continue
                # Normal from the gradient of the COMBINED field — this is the
                # whole point. A limb and the torso share one surface here, so
                # the light runs across the join instead of stopping at it.
                hl = H[y][x - 1] if x > 0 and R[y][x - 1] is not None else 0.0
                hr = H[y][x + 1] if x < w - 1 and R[y][x + 1] is not None else 0.0
                hu = H[y - 1][x] if y > 0 and R[y - 1][x] is not None else 0.0
                hd = H[y + 1][x] if y < h - 1 and R[y + 1][x] is not None else 0.0
                nx, ny, nz = (hl - hr), (hu - hd), 2.0
                m = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
                nx, ny, nz = nx / m, ny / m, nz / m

                lam = max(0.0, nx * lx + ny * ly + nz * lz)
                shade = ambient + (1.0 - ambient) * (lam ** gamma)

                # rim from the same surface, on the side facing away
                rim = max(0.0, nx * bx + ny * by)
                edge = 1.0 - min(1.0, H[y][x] / (self.blend * 1.1))
                shade += backlight * (rim ** 3) * (edge ** 1.5)

                c.px[y][x] = (R[y][x], max(0.0, min(1.0, shade)), 1.0, True)
                c.lay[y][x] = 1
        return c


# =========================================================================
# CREATURES — 48x48. Each is a few lit forms plus its own distinguishing
# features. All original designs.
# =========================================================================
CREATURE_SIZE = 48


# Creatures render at 2x the authoring grid — 96x96. The detail budget at 48
# was the hard ceiling on how much character a sprite could carry: an eye was
# six pixels and a paw was three.
CREATURE_SCALE = 2


# Fourteen bands over a twenty-six-step ramp. Bands are the ARTISTIC control —
# how visibly stepped the shading reads — now that the palette is no longer the
# constraint. Tiles stay at five; a 16x16 tile wants to look chunky.
CREATURE_BANDS = 14


def new_creature(palette):
    return Canvas(CREATURE_SIZE, CREATURE_SIZE, palette, scale=CREATURE_SCALE, bands=CREATURE_BANDS)


def sproutle(pal='sprout'):
    """Seedling companion — drawn as a mask, then inflated.

    The grid below IS the drawing: '#' is body, 'b' the pale front, '.' empty.
    A 32-square is coarse enough to author and read as a picture and fine enough
    that, once the coverage is blurred and the distance transform rounds it, no
    stair-stepping survives into the sprite.

    Deliberately not symmetrical — the left arm hangs a row lower than the right.
    """
    d = Drawn(pal)
    d.mask([
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.............#######............',
        '...........###########..........',
        '.........##############.........',
        '........################........',
        '........#################.......',
        '.......##################.......',
        '.......###################......',
        '......####################......',
        '......####################......',
        '......########################..',
        '...############################.',
        '..#############################.',
        '..#########bbbbbbbbbb##########.',
        '..########bbbbbbbbbbbb########..',
        '...#######bbbbbbbbbbbb######....',
        '...#######bbbbbbbbbbbb#####.....',
        '......#####bbbbbbbbbb######.....',
        '.......#####bbbbbbbb######......',
        '........#####bbbbbb######.......',
        '.........###############........',
        '.........#####.....#####........',
        '.........#####.....#####........',
        '........######.....######.......',
        '........######.....######.......',
        '.......#######.....#######......',
        '.......########...########......',
        '................................',
    ], legend={'b': 'belly'}, smooth=6)

    # Creases separate the legs and set the brow. A drawing divides forms with a
    # line pressed into the surface, not with a gap between two objects.
    d.crease([(20.2, 36.0), (20.2, 45.5)], depth=3.2, width=1.3)
    d.crease([(27.8, 36.0), (27.8, 45.5)], depth=3.2, width=1.3)
    d.crease([(9.5, 22.0), (9.0, 29.0)], depth=2.0, width=1.2)
    d.crease([(39.0, 21.0), (39.5, 27.5)], depth=2.0, width=1.2)
    d.crease([(15.0, 14.5), (24.0, 13.2), (33.0, 14.8)], depth=1.2, width=1.7)

    c = d.to_canvas(dome=6.6, ambient=0.11, backlight=1.0, gamma=1.22)

    c.limb(24, 8.5, 24, 3.0, 1.7, 1.2, 'leaf', ambient=0.30)
    c.sphere(17.5, 1.8, 6.0, 3.0, 'leaf', ambient=0.34)
    c.sphere(30.5, 1.0, 5.4, 2.7, 'leaf', ambient=0.40)
    c.spec(15.5, 1.0, 2.4, 'leaf', strength=0.45)
    c.spec(18.0, 14.0, 4.4, strength=0.38)

    c.eye(18.6, 17.6, 3.4)
    c.eye(29.4, 17.6, 3.4)
    c.blob(23.0, 22.4, 1.3, 0.6, 'eye', 0.0)
    c.blob(25.0, 22.4, 1.3, 0.6, 'eye', 0.0)
    c.outline()
    return c


def bloomtail(pal='bloom'):
    """Sproutle grown upright and flowered: taller, leaf arms held out, a
    petalled crown. Reads as a standing figure with a wide top."""
    c = new_creature(pal)
    c.shadow(24, 45, 13, 3)
    c.limb(24, 20, 24, 11, 1.6, 1.3, 'body', ambient=0.36)
    for ang in range(0, 360, 60):
        px = 24 + math.cos(math.radians(ang)) * 7.2
        py = 9 + math.sin(math.radians(ang)) * 5.2
        c.sphere(px, py, 4.0, 3.2, 'leaf')
    c.sphere(24, 9, 3.0, 2.5, 'belly', ambient=0.62)
    c.limb(18, 38, 15, 44, 3.0, 2.6, 'body', ambient=0.22)
    c.limb(30, 38, 33, 44, 3.0, 2.6, 'body', ambient=0.22)
    c.blob(14.5, 45, 3.8, 2.1, 'body', 0.32)
    c.blob(33.5, 45, 3.8, 2.1, 'body', 0.32)
    c.sphere(24, 30, 13.0, 12.0, 'body')
    c.sphere(24, 35, 8.0, 6.0, 'belly', ambient=0.54)
    # Arms in the BODY ramp: bloom's 'leaf' ramp is the flower's pink, and
    # pink arms read as lollipops rather than as part of the plant.
    c.limb(12.5, 29, 6.5, 26, 2.6, 1.7, 'body', ambient=0.34)
    c.limb(35.5, 29, 41.5, 26, 2.6, 1.7, 'body', ambient=0.42)
    c.sphere(5.5, 24.5, 4.4, 2.8, 'body', ambient=0.48)
    c.sphere(42.5, 24.5, 4.4, 2.8, 'body', ambient=0.56)
    c.eye(19, 27, 3.3)
    c.eye(29, 27, 3.3)
    c.blob(24, 32.5, 2.4, 1.2, 'belly', 0.30)
    c.occlude()
    c.rim('leaf')
    c.outline()
    return c


def groveheart(pal='grove'):
    """The final form: a standing grove-warden. A broad canopy crown over a
    trunk body with root feet and branch arms — a FIGURE with a canopy, not a
    tree with a face stuck on it, which is what the first attempt drew."""
    c = new_creature(pal)
    c.shadow(24, 46, 16, 3)
    for lx, ly, lr in ((13, 12, 8.5), (35, 12, 8.5), (24, 7, 9.5), (24, 15, 8.0)):
        c.sphere(lx, ly, lr, lr * 0.84, 'body', ambient=0.44)
    c.sphere(15, 8, 5.0, 3.8, 'body', ambient=0.76)
    c.limb(19, 40, 16, 46, 3.4, 3.0, 'leaf', ambient=0.20)
    c.limb(29, 40, 32, 46, 3.4, 3.0, 'leaf', ambient=0.20)
    c.blob(15.5, 46.5, 4.4, 2.2, 'leaf', 0.26)
    c.blob(32.5, 46.5, 4.4, 2.2, 'leaf', 0.26)
    c.limb(24, 22, 24, 41, 8.5, 7.0, 'leaf', ambient=0.30)
    c.sphere(24, 33, 6.0, 6.5, 'belly', ambient=0.46)
    c.limb(16, 27, 8, 31, 2.9, 1.7, 'leaf', ambient=0.34)
    c.limb(32, 27, 40, 31, 2.9, 1.7, 'leaf', ambient=0.42)
    c.sphere(7, 32.5, 4.4, 3.2, 'body', ambient=0.54)
    c.sphere(41, 32.5, 4.4, 3.2, 'body', ambient=0.62)
    c.eye(20, 26, 3.2)
    c.eye(28, 26, 3.2)
    c.blob(24, 31, 2.6, 1.2, 'leaf', 0.14)
    c.occlude()
    c.rim('body')
    c.outline()
    return c


def cindermane(pal='cinder'):
    """The final fire form: a maned beast, planted and heavy. The mane is the
    silhouette — a ring of flame tongues rather than the lumpy starburst the
    first attempt produced, which read as a sun and not a creature."""
    c = new_creature(pal)
    c.shadow(24, 45, 16, 3)
    c.limb(34, 30, 44, 20, 3.0, 1.4, 'body', ambient=0.26)     # tail
    c.poly([(44, 23), (49, 12), (45, 16), (46, 8), (41, 17)], 'leaf', 0.94)
    c.limb(15, 32, 13, 45, 3.4, 2.8, 'body', ambient=0.20)     # hind legs
    c.limb(33, 32, 35, 45, 3.4, 2.8, 'body', ambient=0.20)
    c.blob(12.5, 46, 4.2, 2.1, 'body', 0.28)
    c.blob(35.5, 46, 4.2, 2.1, 'body', 0.28)
    c.limb(15, 31, 33, 31, 8.6, 7.4, 'body', ambient=0.30)     # barrel body
    c.sphere(24, 35, 8.4, 4.8, 'belly', ambient=0.50)
    c.limb(19, 33, 18, 45, 2.8, 2.4, 'body', ambient=0.34)     # forelegs
    c.limb(29, 33, 30, 45, 2.8, 2.4, 'body', ambient=0.34)
    c.blob(17.5, 46, 3.4, 1.9, 'belly', 0.58)
    c.blob(30.5, 46, 3.4, 1.9, 'belly', 0.58)
    # the mane: tongues of flame radiating from the head, drawn before it
    for ang in range(-175, 40, 18):
        a = math.radians(ang)
        reach = 18.5 if (ang // 18) % 2 == 0 else 15.0
        bx, by = 24 + math.cos(a) * 8.5, 21 + math.sin(a) * 8.0
        tx, ty = 24 + math.cos(a) * reach, 21 + math.sin(a) * (reach * 0.92)
        c.limb(bx, by, tx, ty, 3.4, 0.6, 'leaf', ambient=0.34 + ((ang + 175) % 54) / 200.0)
    c.sphere(24, 21, 11.0, 10.0, 'body')                       # head
    c.sphere(24, 26, 6.6, 4.4, 'belly', ambient=0.54)          # muzzle
    c.eye(18.8, 20, 3.3)
    c.eye(29.2, 20, 3.3)
    c.blob(24, 24.5, 2.0, 1.3, 'eye', 0.0)
    c.blob(24, 27.5, 2.8, 0.9, 'eye', 0.0)
    c.occlude()
    c.rim('leaf')
    c.outline()
    return c


def maelstride(pal='maels'):
    """The final water form: a current with legs. Deliberately HORIZONTAL where
    both earlier stages are vertical, so the line's last silhouette is the one
    that does not look like the other two."""
    c = new_creature(pal)
    c.shadow(24, 45, 17, 3)
    c.limb(30, 32, 41, 22, 3.4, 1.2, 'body', ambient=0.26)     # trailing tail
    c.poly([(41, 25), (47, 14), (43, 18), (44, 9), (38, 19)], 'leaf', 0.92)
    c.limb(15, 34, 12, 44, 2.8, 2.4, 'body', ambient=0.20)     # legs, mid-stride
    c.limb(26, 35, 30, 44, 2.8, 2.4, 'body', ambient=0.20)
    c.blob(11.5, 45, 3.8, 2.0, 'body', 0.28)
    c.blob(30.5, 45, 3.8, 2.0, 'body', 0.28)
    c.limb(13, 27, 31, 32, 9.5, 6.0, 'body', ambient=0.30)     # long body
    c.sphere(19, 32, 7.0, 4.4, 'belly', ambient=0.50)
    c.limb(14, 14, 15, 2, 3.2, 0.6, 'leaf', ambient=0.46)      # crest
    c.limb(21, 14, 23, 4, 2.8, 0.6, 'leaf', ambient=0.40)
    c.sphere(14, 22, 11.0, 10.0, 'body')                       # head, forward
    c.sphere(13, 27, 6.2, 4.0, 'belly', ambient=0.54)          # jaw
    c.eye(9.5, 20, 3.2)
    c.eye(19.5, 20, 3.2)
    c.blob(12.5, 25.5, 1.9, 1.1, 'eye', 0.0)
    for sx, sy in ((36, 20), (43, 25), (33, 38)):
        c.blob(sx, sy, 1.7, 1.5, 'leaf', 1.0)                  # spray
    c.occlude()
    c.rim('leaf')
    c.outline()
    return c


def pyrelynx(pal='pyre'):
    """Emberkit grown into a standing lynx: longer body, tall tufted ears, a
    flame crest down the neck. Stands on all fours where the cub sits."""
    c = new_creature(pal)
    c.shadow(24, 45, 15, 3)
    c.limb(32, 31, 43, 19, 3.0, 1.4, 'body', ambient=0.26)     # tail
    c.poly([(43, 22), (48, 11), (44, 15), (45, 7), (40, 16)], 'leaf', 0.94)
    c.limb(14, 32, 12, 44, 3.0, 2.6, 'body', ambient=0.20)     # legs
    c.limb(33, 32, 35, 44, 3.0, 2.6, 'body', ambient=0.20)
    c.blob(11.5, 45, 3.8, 2.0, 'body', 0.28)
    c.blob(35.5, 45, 3.8, 2.0, 'body', 0.28)
    c.limb(14, 30, 34, 30, 8.0, 7.0, 'body', ambient=0.30)     # body
    c.sphere(24, 34, 8.0, 4.6, 'belly', ambient=0.52)
    c.limb(19, 33, 18, 44, 2.5, 2.2, 'body', ambient=0.34)     # forelegs
    c.limb(28, 33, 29, 44, 2.5, 2.2, 'body', ambient=0.34)
    c.blob(17.5, 45, 3.2, 1.8, 'belly', 0.60)
    c.blob(29.5, 45, 3.2, 1.8, 'belly', 0.60)
    c.limb(16.5, 16, 14, 2, 4.6, 0.7, 'body', ambient=0.34)     # tall ears
    c.limb(31.5, 16, 34, 2, 4.6, 0.7, 'body', ambient=0.34)
    c.limb(16.5, 15, 14.9, 5, 2.4, 0.5, 'leaf', ambient=0.62)
    c.limb(31.5, 15, 33.1, 5, 2.4, 0.5, 'leaf', ambient=0.54)
    c.sphere(24, 20, 11.5, 10.0, 'body')
    c.sphere(24, 25, 6.2, 4.2, 'belly', ambient=0.56)
    # Crest on TOP of the skull. The first version drew it before the head, so
    # the head covered it completely and the creature had no crest at all.
    for i, fx in enumerate((19.5, 24, 28.5)):
        c.limb(fx, 15, fx + (i - 1) * 1.6, 5 - abs(i - 1) * 2, 2.6, 0.5, 'leaf', ambient=0.52 + i * 0.06)
    c.eye(18.5, 19, 3.3)
    c.eye(29.5, 19, 3.3)
    c.blob(24, 23.5, 1.9, 1.2, 'eye', 0.0)
    c.occlude()
    c.rim('leaf')
    c.outline()
    return c


def emberkit(pal='ember'):
    """Ember cub, sitting — drawn as a mask, then inflated.

    The ears, skull, chest, paws and tail are one connected shape in the grid,
    so there is nothing to seam: the whole animal is a single drawn outline that
    the distance transform gives volume to.
    """
    d = Drawn(pal)
    d.mask([
        '................................',
        '................................',
        '................................',
        '........###..........###........',
        '.......#####........#####.......',
        '.......######......######.......',
        '........################........',
        '.........##############.........',
        '........################........',
        '........################........',
        '........################........',
        '........#####bbbbbb#####........',
        '.........####bbbbbb####.........',
        '..........############..........',
        '............########............',
        '...........##########...........',
        '..........############..........',
        '.........##############.........',
        '........################........',
        '.......######bbbbbb######.......',
        '......######bbbbbbbb######......',
        '......######bbbbbbbb######......',
        '......######bbbbbbbb######......',
        '......#######bbbbbb#######......',
        '......####################......',
        '.......##################.......',
        '.......##################.......',
        '........################........',
        '.......######......######.......',
        '......########....########......',
        '................................',
        '................................',
    ], legend={'b': 'belly'}, smooth=6)

    d.crease([(19.0, 42.0), (19.0, 46.5)], depth=3.0, width=1.3)      # paw split
    d.crease([(29.0, 42.0), (29.0, 46.5)], depth=3.0, width=1.3)
    d.crease([(14.0, 21.5), (24.0, 20.5), (34.0, 21.5)], depth=1.6, width=1.6)  # brow
    d.crease([(15.0, 26.5), (24.0, 28.0), (33.0, 26.5)], depth=1.8, width=1.5)  # jawline
    d.crease([(12.0, 12.0), (13.5, 8.0)], depth=1.6, width=1.1)       # ear fold
    d.crease([(36.0, 12.0), (34.5, 8.0)], depth=1.6, width=1.1)

    c = d.to_canvas(dome=6.0, ambient=0.10, backlight=1.05, gamma=1.32)

    c.limb(37.0, 32.0, 44.0, 22.0, 2.4, 1.0, 'body', ambient=0.22)    # tail
    c.limb(43.5, 23.5, 46.0, 16.0, 1.4, 0.5, 'leaf', ambient=0.48)
    c.limb(13.0, 12.5, 12.0, 6.0, 1.8, 0.5, 'leaf', ambient=0.50)     # inner ear
    c.limb(35.0, 12.5, 36.0, 6.0, 1.8, 0.5, 'leaf', ambient=0.44)
    c.spec(18.0, 12.0, 4.6, strength=0.42)
    c.spec(19.0, 31.0, 3.0, strength=0.30)

    c.eye(19.0, 15.0, 3.4)
    c.eye(29.0, 15.0, 3.4)
    c.blob(24, 17.6, 1.8, 1.1, 'eye', 0.0)
    c.blob(22.8, 19.6, 1.3, 0.6, 'eye', 0.0)
    c.blob(25.2, 19.6, 1.3, 0.6, 'eye', 0.0)
    c.outline()
    return c


def dewbble(pal='dew'):
    """Dewdrop companion — drawn as a mask, then inflated.

    The point and the body are one outline, tapering the whole way, which is
    what a drop actually is. Wet comes from a hard specular over a lit core, not
    from the colour.
    """
    d = Drawn(pal)
    d.mask([
        '................................',
        '................................',
        '................................',
        '...............##...............',
        '...............##...............',
        '..............####..............',
        '..............####..............',
        '.............######.............',
        '.............######.............',
        '............########............',
        '...........##########...........',
        '..........############..........',
        '.........##############.........',
        '.........##############.........',
        '........################........',
        '........################........',
        '.......##################.......',
        '......####################......',
        '......#####bbbbbbbbbb#####......',
        '......####bbbbbbbbbbbb####......',
        '......####bbbbbbbbbbbb####......',
        '.......####bbbbbbbbbb####.......',
        '........####bbbbbbbb####........',
        '.........##############.........',
        '...........##########...........',
        '..........####....####..........',
        '..........####....####..........',
        '.........#####....#####.........',
        '.........#####....#####.........',
        '.........######..######.........',
        '.........######..######.........',
        '................................',
    ], legend={'b': 'belly'}, smooth=6)

    d.crease([(20.0, 38.0), (20.0, 46.5)], depth=3.0, width=1.3)
    d.crease([(28.0, 38.0), (28.0, 46.5)], depth=3.0, width=1.3)
    # No arms: at the drop's widest rows they fused with the body into one
    # diamond and the whole creature read as a four-pointed star. A drop is
    # better without them, and it separates this line from the other two.

    c = d.to_canvas(dome=7.2, ambient=0.13, backlight=1.15, gamma=1.20)

    c.spec(18.5, 20.0, 4.2, 'leaf', strength=0.95)                    # wet highlight
    c.spec(22.0, 9.0, 1.9, 'leaf', strength=0.75)

    c.eye(19.0, 25.5, 3.4)
    c.eye(29.0, 25.5, 3.4)
    c.blob(24, 30.5, 1.9, 1.0, 'eye', 0.0)
    c.outline()
    return c


def tidewade(pal='tide'):
    """Dewbble deepened into a wader: longer legs, a crest, and arms held ready.
    Taller and narrower than the drop it grew from."""
    c = new_creature(pal)
    c.shadow(24, 46, 13, 3)
    c.limb(19, 34, 16, 45, 3.0, 2.6, 'body', ambient=0.22)
    c.limb(29, 34, 32, 45, 3.0, 2.6, 'body', ambient=0.22)
    c.blob(15.0, 46, 4.2, 2.2, 'body', 0.30)
    c.blob(33.0, 46, 4.2, 2.2, 'body', 0.30)
    c.limb(19, 14, 20, 3, 3.4, 0.6, 'leaf', ambient=0.44)      # crest fins
    c.limb(29, 14, 28, 2, 3.4, 0.6, 'leaf', ambient=0.52)
    c.sphere(24, 26, 12.5, 12.5, 'body')
    c.sphere(24, 31, 7.4, 6.0, 'belly', ambient=0.56)
    c.limb(12.5, 24, 7, 31, 2.5, 1.9, 'body', ambient=0.34)
    c.limb(35.5, 24, 41, 31, 2.5, 1.9, 'body', ambient=0.40)
    c.blob(6.5, 32, 2.6, 2.3, 'body', 0.44)
    c.blob(41.5, 32, 2.6, 2.3, 'body', 0.50)
    c.sphere(18, 19, 3.4, 4.0, 'leaf', ambient=0.82)
    c.eye(19, 24, 3.3)
    c.eye(29, 24, 3.3)
    c.blob(24, 29, 2.2, 1.1, 'eye', 0.0)
    c.occlude()
    c.rim('leaf')
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


def hero(facing='down', step=0, pal='hero', hair='short'):
    """One overworld sprite per facing, per character.

    Two things had to be true at once. The facings must actually differ — the
    first pass drew the same front-facing figure four times with only the eyes
    moved, so turning around changed nothing on screen. And the figure has to be
    the person on the character card, which is what `pal` and `hair` carry: the
    palette supplies that character's clothing, hair and skin, the hair style
    supplies their silhouette. A faithful downscale of the card itself is not an
    option here — a realistic 1:3 standing figure lands on about fifteen pixels
    of width, which cannot hold a readable face or a walk cycle. The card is
    traced at portrait size instead; this is its overworld counterpart.
    """
    c = Canvas(HERO_W, HERO_H, pal)
    has_accent = 'accent' in PALETTE_SPECS[pal]
    trim = 'accent' if has_accent else 'belly'
    swing = (0, 2, 0, -2)[step % 4]
    side = facing in ('left', 'right')
    c.shadow(12, 30, 7, 2)

    # Legs are trousers, not bare sticks: same ramp as the shirt, several steps
    # darker. Drawn wide enough to survive being scaled down to a 16px tile.
    def leg(x0, x1, lift):
        top, sole = 23, 29 + lift
        c.rect(x0, top, x1, sole - 1, 'body', 0.24)
        c.rect(x0, top, x0, sole - 1, 'body', 0.34)          # inner highlight
        c.rect(x0 - 1, sole, x1 + 1, sole + 1, trim, 0.18)   # shoe
        c.rect(x0 - 1, sole, x1, sole, trim, 0.72)           # laces catch light

    leg(7, 10, max(0, swing))
    leg(13, 16, max(0, -swing))

    # body: narrower in profile so the turn reads on silhouette alone
    c.sphere(12, 19, 5.5 if side else 7, 6, 'body')
    c.rect(5 if not side else 7, 24, 19 if not side else 17, 24, 'body', 0.30)   # shirt hem
    # Jacket trim. Every card has a contrast placket or shoulder stripe, and it
    # is most of what tells the three characters apart at a glance in the field.
    if not side:
        c.rect(11, 15, 13, 24, trim, 0.66)
    else:
        c.rect(9 if facing == 'left' else 14, 16, 10 if facing == 'left' else 15, 23, trim, 0.58)

    if side:
        # only the near arm is visible, and it swings
        ax = 8 if facing == 'left' else 16
        c.sphere(ax, 19 + swing, 2.4, 4.2, 'body', ambient=0.38)
        c.blob(ax, 22 + swing, 1.5, 1.6, 'belly', 0.78)      # hand
    else:
        c.sphere(4.5, 18 + swing, 2.6, 4.2, 'body', ambient=0.38)
        c.sphere(19.5, 18 - swing, 2.6, 4.2, 'body', ambient=0.38)
        c.blob(4.5, 21.5 + swing, 1.6, 1.7, 'belly', 0.78)
        c.blob(19.5, 21.5 - swing, 1.6, 1.7, 'belly', 0.78)

    # neck — without it the head sits straight on the shoulders and the figure
    # reads as a snowman
    c.rect(10, 14, 14, 15, 'belly', 0.42)

    # head
    c.sphere(12, 10, 7.5 if side else 8, 8, 'belly')

    def crown(back):
        """The hair mass, shaped per character so they differ in silhouette."""
        if back:
            c.sphere(12, 10, 8.2, 8, 'leaf', ambient=0.5)
            c.sphere(12, 13, 5, 3, 'leaf', ambient=0.35)
        else:
            c.sphere(12, 5.6, 8.2, 4.8, 'leaf', ambient=0.5)
            c.rect(4, 5, 20, 6, 'leaf', 0.8)
        if hair == 'bun':
            # gathered high and tied off — reads at 24px where loose hair does not
            c.sphere(12, 2.6, 3.4, 2.6, 'leaf', ambient=0.62)
            c.rect(10, 4, 14, 4, 'leaf', 0.30)
        elif hair == 'crop':
            c.rect(5, 4, 19, 5, 'leaf', 0.42)
        elif hair == 'swept':
            c.sphere(14.5, 4.6, 5.6, 2.8, 'leaf', ambient=0.72)
            c.rect(5, 7, 8, 9, 'leaf', 0.34)                 # shaved-in side
        elif hair == 'curls':
            for cx, cy in ((6.5, 6), (10, 4.2), (14, 4.2), (17.5, 6), (8, 8.5), (16, 8.5)):
                c.sphere(cx, cy, 2.6, 2.4, 'leaf', ambient=0.66)

    if facing == 'up':
        crown(True)
    else:
        crown(False)
        if facing == 'down':
            c.eye(9.5, 11, 1.4)
            c.eye(14.5, 11, 1.4)
        elif facing == 'left':
            c.eye(8.5, 11, 1.4)
            c.blob(5.5, 12, 1.6, 2.2, 'belly', 0.9)      # nose in profile
            c.sphere(16, 8, 4, 5, 'leaf', ambient=0.4)   # hair sweeps back
        else:
            c.eye(15.5, 11, 1.4)
            c.blob(18.5, 12, 1.6, 2.2, 'belly', 0.9)
            c.sphere(8, 8, 4, 5, 'leaf', ambient=0.4)

    c.rim('leaf')
    c.outline()
    return c


def coach_maple():
    """Trail mentor: silver curls, green field jacket, orange scarf, satchel.

    The ramps used to be crossed here — hair was drawn on 'body' and the jacket
    on 'leaf', and since this ran on the player's navy 'hero' palette it put a
    blue-haired stranger on the title screen. On the 'coach' palette the roles
    are the same as every other person: body is the jacket, leaf is the hair,
    belly is skin, accent is the scarf.

    Draw order matters as much as colour. The head is laid down before the
    scarf, because a face sphere wide enough to hold two eyes also covers the
    collar, and painting it last wiped the scarf off her neck entirely.
    """
    c = Canvas(48, 64, 'coach')
    c.shadow(24, 61, 15, 3)

    # legs and shoes
    c.rect(15, 44, 22, 57, 'body', 0.10); c.rect(26, 44, 33, 57, 'body', 0.10)
    c.rect(13, 57, 22, 60, 'accent', 0.08); c.rect(26, 57, 35, 60, 'accent', 0.08)

    # jacket. Head is roughly a quarter of the figure, not a third — at the old
    # radius she read as a bobblehead next to her own portrait.
    c.sphere(24, 36, 12, 13, 'body', ambient=0.48)
    c.rect(11, 28, 15, 46, 'body', 0.26); c.rect(33, 28, 37, 46, 'body', 0.26)   # sleeves
    c.blob(12, 47, 2.6, 2.8, 'belly', 0.80); c.blob(36, 47, 2.6, 2.8, 'belly', 0.80)
    c.rect(31, 34, 41, 45, 'body', 0.44)                                          # satchel
    for i in range(12):
        c.rect(29 + i // 2, 24 + i, 31 + i // 2, 26 + i, 'body', 0.58)            # strap
    c.rect(22, 26, 26, 42, 'accent', 0.58)                                        # open placket
    c.blob(17, 33, 2.4, 3.4, 'accent', 0.86)                                      # leaf badge

    # head, then the collar that sits on top of it
    c.sphere(24, 14, 9, 9.5, 'belly')
    for cx, cy in ((15, 9), (19, 5.4), (24, 4.4), (29, 5.4), (33, 9), (14, 15), (34, 15)):
        c.sphere(cx, cy, 4.4, 3.8, 'leaf', ambient=0.62)
    c.eye(20, 14, 1.9); c.eye(28, 14, 1.9)
    c.blob(24, 18.5, 1.7, 0.7, 'eye', 0.0)                                        # smile
    c.rect(20, 22, 28, 26, 'accent', 0.80)                                        # scarf
    c.rect(17, 23, 31, 25, 'accent', 0.70)

    c.rim('leaf'); c.outline(); return c


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


def hsh(x, y, seed=0):
    """Deterministic per-cell noise in [0,1).

    Texture has to be stable: a tile regenerated with different speckles every
    run would make the whole overworld shimmer between builds. This is a cheap
    integer hash, not a random number generator.
    """
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xffffffff
    n = (n ^ (n >> 13)) * 1274126177 & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffff) / 65536.0


def mottle(c, ramp_name, base, spread, seed, cell=2):
    """Low-frequency value noise in CLUSTERS.

    Per-pixel noise at tile scale is a screen door: it reads as a woven texture
    and it shimmers when the map scrolls. Clumping the noise into 2x2 cells is
    what makes ground read as ground.
    """
    for y in range(0, TILE, cell):
        for x in range(0, TILE, cell):
            v = base + (hsh(x // cell, y // cell, seed) - 0.5) * 2 * spread
            for dy in range(cell):
                for dx in range(cell):
                    c.put(x + dx, y + dy, ramp_name, v)


def draw_grass(c, variant=0, turf='body', detail='leaf'):
    """Lay turf onto an existing canvas using the ramps it names.

    Water and grass have to share a tile to have a shoreline at all, and a tile
    carries one palette — so the turf ramp cannot be hard-coded to 'body'.
    """
    seed = 11 + variant * 7
    mottle(c, turf, 0.58, 0.042, seed)
    BLADES = (
        ((3, 5), (10, 3), (6, 11), (13, 9)),
        ((8, 4), (2, 10), (12, 12), (5, 7)),
        ((5, 2), (12, 6), (2, 8), (9, 13)),
        ((11, 4), (4, 6), (14, 11), (7, 9)),
    )
    for bx, by in BLADES[variant % len(BLADES)]:
        c.put(bx, by - 2, turf, 0.92)
        c.put(bx, by - 1, turf, 0.88)
        c.put(bx, by, turf, 0.78)
        c.put(bx + 1, by - 1, turf, 0.30)    # the blade's own shadow
        c.put(bx + 1, by, turf, 0.34)
        c.put(bx - 1, by, turf, 0.70)        # a second, shorter leaf
    if variant == 1:
        for px_, py_ in ((14, 4), (4, 13)):
            c.put(px_, py_, detail, 0.62)
            c.put(px_, py_ + 1, detail, 0.3)
    elif variant == 2:
        for px_, py_ in ((7, 6), (13, 13)):
            c.put(px_, py_, turf, 0.82)
            c.put(px_ - 1, py_, turf, 0.74)
            c.put(px_, py_ - 1, turf, 0.78)
            c.put(px_ + 1, py_ + 1, turf, 0.36)
    elif variant == 3:
        for k in range(4):
            c.put(3 + k, 12 - (k // 2), detail, 0.44)
            c.put(3 + k, 13 - (k // 2), detail, 0.22)
    return c


def tile_grass(variant=0):
    """Grass is 90% of what the player looks at, so it has to hold up flat.

    A base value, clustered mottle for depth, and a handful of blades with a
    dark pixel behind each so the tuft reads as standing up off the ground.
    """
    return draw_grass(tile('terra'), variant)


# =========================================================================
# AUTOTILING
#
# A path used to be one square of dirt butted against one square of grass, and
# a pond was a rectangle. That hard join is what made the overworld read as a
# spreadsheet: the eye follows the straight seams and sees the grid, not the
# ground.
#
# Each material is generated once per neighbour mask instead. Bits are set for
# the cardinal neighbours that are the SAME material; any side without one has
# the material pulled back from that edge along a noisy boundary, with the
# ground showing through, a contact shadow just inside it and a scatter of the
# material dithered out into the ground. Two open sides meet at a corner and
# round it for free.
#
# Diagonals are handled by four small overlay sprites rather than by widening
# the mask to eight bits, which would be 256 tiles per material.
# =========================================================================
NBR_N, NBR_E, NBR_S, NBR_W = 1, 2, 4, 8
EDGE_INSET = 2.2


def _open_distance(x, y, mask):
    """How far this pixel sits from the nearest edge that has no same-material
    neighbour. Large when the material continues in every open direction."""
    far = 99.0
    return min(
        far if mask & NBR_N else float(y),
        far if mask & NBR_S else float(15 - y),
        far if mask & NBR_W else float(x),
        far if mask & NBR_E else float(15 - x),
    )


def _edge_shape(mask, seed):
    """(inside, rim, scatter) pixel sets for one mask.

    `inside` is solid material, `rim` is the darker contact line just within the
    boundary, and `scatter` are lone material pixels thrown out into the ground
    so the transition feathers instead of stopping dead.
    """
    inside, rim, scatter = set(), set(), set()
    for y in range(16):
        for x in range(16):
            d = _open_distance(x, y, mask)
            # A wobbling threshold is what keeps the boundary from being a
            # straight inset rectangle with rounded corners.
            edge = EDGE_INSET + (hsh(x, y, seed) - 0.5) * 2.2
            if d >= edge + 1.0:
                inside.add((x, y))
            elif d >= edge:
                inside.add((x, y))
                rim.add((x, y))
            elif d >= edge - 1.1 and hsh(x, y, seed + 91) > 0.72:
                scatter.add((x, y))
    return inside, rim, scatter


# --- blending the PAINTED materials --------------------------------------
#
# The procedural grass and the atlas grass are different art. Generating the
# autotiles procedurally therefore laid hand-drawn tiles next to painted ones
# and the field went patchy — the grid problem again, in a different colour.
#
# These build each mask by compositing the committed painted tiles instead:
# ground where the material has been pulled back, material where it has not, a
# shaded or wetted rim along the boundary, and a scatter of material dithered
# out into the ground so the join feathers.
def _raw_traced(name):
    path = os.path.join(TRACED_DIR, 'traced_%s.json' % name)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def _shift(hex_color, mul):
    r, g, b = hex_to_rgb(hex_color)
    return rgb_to_hex((
        max(0, min(255, int(r * mul))),
        max(0, min(255, int(g * mul))),
        max(0, min(255, int(b * mul))),
    ))


def blended_tile(ground, over, mask, seed, rim_mul=0.72):
    """One painted material laid over another along a soft, noisy boundary."""
    g = _raw_traced(ground)
    o = _raw_traced(over)
    if not g or not o:
        return None

    colors = ['transparent'] + list(g['palette']) + list(o['palette'])
    rim_base = len(colors)
    colors += [_shift(c, rim_mul) for c in o['palette']]
    g_off, o_off = 1, 1 + len(g['palette'])

    inside, rim, scatter = _edge_shape(mask, seed)
    rows = []
    for y in range(16):
        row = ''
        for x in range(16):
            gi = TRACE_INDEX[g['rows'][y][x]] - 1
            oi = TRACE_INDEX[o['rows'][y][x]] - 1
            if (x, y) in rim:
                row += DIGITS[rim_base + oi]
            elif (x, y) in inside or (x, y) in scatter:
                row += DIGITS[o_off + oi]
            else:
                row += DIGITS[g_off + gi]
        rows.append(row)
    return colors, rows


def flipped_traced(name, horizontal=False, vertical=False):
    """A painted tile turned around.

    Extra ground variants have to be the SAME artwork as the ones beside them.
    Drawing new ones procedurally put hand-made tiles next to atlas tiles and
    the field went patchy; a flip is free, keeps the palette and the average
    value identical, and still breaks the repeat.
    """
    t = _raw_traced(name)
    if not t:
        return None
    rows = [list(r) for r in t['rows']]
    if horizontal:
        rows = [list(reversed(r)) for r in rows]
    if vertical:
        rows = list(reversed(rows))
    colors = ['transparent'] + list(t['palette'])
    out = [''.join(DIGITS[TRACE_INDEX[ch]] for ch in r) for r in rows]
    return colors, out


def blended_corner(ground, corner):
    """Ground showing through at a diagonal where a material wraps a corner."""
    g = _raw_traced(ground)
    if not g:
        return None
    colors = ['transparent'] + list(g['palette'])
    cx = 0 if corner in ('nw', 'sw') else 15
    cy = 0 if corner in ('nw', 'ne') else 15
    rows = []
    for y in range(16):
        row = ''
        for x in range(16):
            d = max(abs(x - cx), abs(y - cy))
            if d <= 2 + (hsh(x, y, 77) - 0.5) * 1.4:
                row += DIGITS[1 + TRACE_INDEX[g['rows'][y][x]] - 1]
            else:
                row += TRANSPARENT
        rows.append(row)
    return colors, rows


def path_tile(mask, variant=0):
    """Trail over grass, its edges dissolving into the turf."""
    c = tile_grass(variant)
    seed = 5 + variant * 17
    inside, rim, scatter = _edge_shape(mask, seed + 3)

    for x, y in inside:
        c.put(x, y, 'leaf', 0.62 + (hsh(x // 2, y // 2, seed) - 0.5) * 0.12)
    for x, y in scatter:
        # trodden dirt showing through the grass at the margin
        c.put(x, y, 'leaf', 0.50 + (hsh(x, y, seed + 7) - 0.5) * 0.16)
    for x, y in rim:
        # the trail sits slightly below the turf, so its lip is in shadow
        c.put(x, y, 'leaf', 0.30)

    stones = ((2, 4), (9, 2), (12, 11), (7, 14)) if variant == 0 else ((5, 3), (13, 6), (3, 12), (10, 9))
    for gx, gy in stones:
        if (gx, gy) not in inside or (gx, gy) in rim:
            continue
        c.put(gx, gy, 'leaf', 0.86)
        c.put(gx + 1, gy, 'leaf', 0.74)
        c.put(gx, gy + 1, 'leaf', 0.34)
        c.put(gx + 1, gy + 1, 'leaf', 0.40)
    # A lit lip only where the trail actually ends, not on every square.
    if not mask & NBR_N:
        for x in range(16):
            for y in range(16):
                if (x, y) in inside and (x, y - 1) not in inside:
                    c.put(x, y, 'leaf', 0.88)
                    break
    return c


def water_tile(mask, frame=0):
    """Pond over grass, with a wet shoreline rather than a cut edge."""
    c = draw_grass(tile('shore'), 2 if frame else 0, turf='leaf', detail='belly')
    seed = 31 + frame * 13
    inside, rim, scatter = _edge_shape(mask, seed)

    for x, y in inside:
        c.put(x, y, 'body', 0.42 + (hsh(x // 2, (y + frame) // 2, seed) - 0.5) * 0.14)
    for x, y in scatter:
        c.put(x, y, 'belly', 0.44)                    # damp ground at the margin
    for x, y in rim:
        c.put(x, y, 'belly', 0.88)                    # bright wet shoreline

    for y in range(3 + frame, 16, 5):                 # ripples, drifting per frame
        for x in range(2, 14):
            if (x, y) in inside and (x, y) not in rim and hsh(x, y, seed + 5) > 0.45:
                c.put(x, y, 'body', 0.70)
    return c


def inner_corner(corner, ramp, shade):
    """A notch of ground at a diagonal where the material wraps around an
    outside corner. Transparent everywhere else — this stacks over the base."""
    c = tile('terra').clear()
    cx = 0 if corner in ('nw', 'sw') else 15
    cy = 0 if corner in ('nw', 'ne') else 15
    for y in range(16):
        for x in range(16):
            d = max(abs(x - cx), abs(y - cy))
            if d <= 2 + (hsh(x, y, 77) - 0.5) * 1.4:
                c.put(x, y, ramp, shade)
    return c


def ao_overlay(sides):
    """Contact shading cast onto the ground by whatever blocks it.

    World light is upper-left, so a wall or a tree darkens the ground on its
    lower-right. Drawn opaque here and composited at low opacity by TileMap, so
    it reads as shade over any ground rather than as a painted stripe.
    """
    c = tile('terra').clear()
    for y in range(16):
        for x in range(16):
            depth = 99
            if 'n' in sides:
                depth = min(depth, y)
            if 'w' in sides:
                depth = min(depth, x)
            if depth <= 3 - (hsh(x, y, 55) * 1.2):
                c.put(x, y, 'ink', 0)
    return c


def tile_tallgrass():
    """Has to read as TALLER than the field it sits in, at a glance, because
    walking into it is what starts an encounter.

    Three clumps, not five evenly spaced columns: a picket fence of stems every
    three pixels turns a field of these into corduroy.
    """
    c = tile('terra')
    mottle(c, 'body', 0.40, 0.04, 31)              # shaded ground between clumps
    for cx, cy, n in ((3, 9, 3), (9, 6, 4), (13, 12, 2)):
        for i in range(n):
            bx = cx + i * 2 - n
            top = cy - 5 + (i % 2) * 2
            c.rect(bx, top, bx, cy, 'body', 0.90)          # stem
            c.rect(bx + 1, top + 1, bx + 1, cy, 'body', 0.28)   # its shadow
            c.put(bx, top - 1, 'body', 0.98)               # tip catches the sun
        c.rect(cx - n, cy + 1, cx + n - 1, cy + 1, 'body', 0.20)   # contact shadow
    return c


def tile_path(variant=0):
    """Two variants, scattered by coordinate. One pebble layout repeated down a
    whole trail draws visible rows of identical dashes."""
    c = tile('terra')
    mottle(c, 'leaf', 0.62, 0.06, 5 + variant * 17)
    stones = ((2, 4), (9, 2), (12, 11), (7, 14)) if variant == 0 else ((5, 3), (13, 6), (3, 12), (10, 9))
    for gx, gy in stones:
        c.put(gx, gy, 'leaf', 0.86)             # pebble top catches the light
        c.put(gx + 1, gy, 'leaf', 0.74)
        c.put(gx, gy + 1, 'leaf', 0.34)         # and casts a short shadow
        c.put(gx + 1, gy + 1, 'leaf', 0.40)
    c.rect(0, 0, 15, 0, 'leaf', 0.86)           # lit lip at the top edge
    c.rect(0, 15, 15, 15, 'leaf', 0.46)         # shadowed lip at the bottom
    return c


def tile_tree():
    """Trees are laid edge to edge to fence the map in, so this tile has to read
    as a piece of FOREST, not as one tree on a lawn.

    Two mistakes in the first pass: a single circular canopy left green ground
    showing at all four corners, so a wall of trees read as polka dots; and a
    wide trunk across the bottom read as a red brick under every one of them.
    The canopy is four overlapping lobes filling the tile, and the trunk is two
    pixels of dark bark peeking out beneath.
    """
    c = tile('terra')
    mottle(c, 'body', 0.22, 0.03, 3)             # deep shade under the branches
    # Only a hint of trunk in deep shadow. A lit bark stripe under every tile
    # drew a dotted red line along the whole tree border.
    c.rect(7, 12, 8, 15, 'leaf', 0.08)
    c.rect(6, 14, 9, 15, 'leaf', 0.06)
    for lx, ly, lr in ((4, 5, 5.6), (11, 5, 5.6), (8, 2, 5.0), (8, 9, 5.4), (13, 10, 3.6), (2, 10, 3.6)):
        c.sphere(lx, ly, lr, lr * 0.92, 'body', ambient=0.44)
    c.sphere(5, 3, 3.6, 3.0, 'body', ambient=0.74)   # the lobe the sun lands on
    for lx, ly in ((3, 2), (10, 1), (13, 6), (7, 6)):
        c.put(lx, ly, 'body', 0.98)                  # leaf speculars
    for lx, ly in ((8, 7), (5, 9), (12, 8), (2, 6)):
        c.put(lx, ly, 'body', 0.24)                  # gaps between the lobes
    return c


def tile_water(frame=0):
    """Crests with a dark trough under each, staggered across the tile. Evenly
    spaced dashes read as road markings; scattered dots read as noise."""
    c = tile('dew')
    for y in range(TILE):                        # depth gradient, top is deeper
        c.rect(0, y, 15, y, 'body', 0.34 + 0.14 * (y / 15.0))
    off = frame * 5
    for row, (wy, phase) in enumerate(((1, 0), (5, 6), (9, 3), (13, 9))):
        x0 = (phase + off) % 16
        length = 4 + (row % 2) * 2
        for k in range(length):
            x = (x0 + k) % 16
            c.put(x, wy, 'leaf', 0.94)           # crest
            c.put(x, wy + 1, 'body', 0.20)       # trough beneath it
        c.put((x0 - 1) % 16, wy, 'leaf', 0.62)   # the crest tapers off
        c.put((x0 + length) % 16, wy, 'leaf', 0.62)
    c.put((3 + off) % 16, 7, 'leaf', 1.0)        # a glint
    return c


def tile_flowers():
    c = tile_grass(0)
    for fx, fy, petal in ((4, 5, 'leaf'), (11, 9, 'belly'), (8, 13, 'leaf')):
        c.put(fx, fy - 1, petal, 0.95)
        c.put(fx - 1, fy, petal, 0.95)
        c.put(fx + 1, fy, petal, 0.78)
        c.put(fx, fy + 1, petal, 0.70)
        c.put(fx, fy, 'belly', 1.0)              # bright centre
        c.put(fx + 1, fy + 1, 'body', 0.32)      # shadow on the grass
    return c


def tile_roof(pal):
    """Shingle courses: a lit top lip, a body, a dark bottom lip, and vertical
    seams staggered course to course."""
    c = tile(pal)
    for ry in range(0, 16, 4):
        course = ry // 4
        # The course above overlaps this one, so the dark line belongs at the
        # TOP. Putting a highlight there instead is what turns shingles into
        # brickwork, which is the mistake the first pass made.
        c.rect(0, ry, 15, ry, 'body', 0.22)                  # overlap shadow
        c.rect(0, ry + 1, 15, ry + 1, 'body', 0.54)
        c.rect(0, ry + 2, 15, ry + 2, 'body', 0.66)
        c.rect(0, ry + 3, 15, ry + 3, 'body', 0.84)          # lit tab edge
        for rx in range((0 if course % 2 == 0 else 4), 16, 8):
            c.rect(rx, ry + 1, rx, ry + 3, 'body', 0.30)     # tab seam
        for tx in range(3, 16, 5):                            # weathering
            c.put((tx + course * 3) % 16, ry + 2, 'body', 0.58)
    return c


def tile_wall(pal):
    c = tile(pal)
    for by in range(0, 16, 5):
        course = by // 5
        for bx in range(16):
            # each brick gets its own value so the wall is not one flat plane
            brick = (bx + (0 if course % 2 == 0 else 4)) // 8
            c.rect(bx, by, bx, by + 4, 'belly', 0.74 + (hsh(brick, course, 9) - 0.5) * 0.14)
        c.rect(0, by, 15, by, 'belly', 0.46)                 # mortar course
        for bx in range((0 if course % 2 == 0 else 4), 16, 8):
            c.rect(bx, by, bx, by + 4, 'belly', 0.46)        # mortar joint
            c.rect(bx + 1, by + 1, bx + 1, by + 4, 'belly', 0.88)
    return c


def tile_window(pal):
    c = tile_wall(pal)
    c.rect(2, 3, 13, 12, 'leaf', 0.24)                       # frame
    c.rect(3, 4, 12, 11, 'leaf', 0.88)                       # glass
    c.rect(3, 4, 12, 5, 'leaf', 0.96)                        # sky reflected up top
    for k in range(5):                                        # diagonal glint
        c.put(5 + k, 9 - k, 'leaf', 1.0)
    c.rect(7, 4, 8, 11, 'leaf', 0.28)                        # mullions
    c.rect(3, 7, 12, 8, 'leaf', 0.28)
    c.rect(1, 13, 14, 13, 'leaf', 0.40)                      # sill
    c.rect(1, 12, 14, 12, 'leaf', 0.70)
    return c


def tile_door(pal):
    c = tile_wall(pal)
    c.rect(2, 2, 13, 15, 'body', 0.22)                       # frame
    c.rect(3, 3, 12, 15, 'body', 0.46)                       # door face
    c.rect(3, 3, 3, 15, 'body', 0.62)                        # lit edge
    for py0, py1 in ((5, 8), (10, 13)):                      # recessed panels
        c.rect(5, py0, 10, py1, 'body', 0.30)                # inset shadow
        c.rect(6, py0 + 1, 9, py1 - 1, 'body', 0.52)         # panel face
        c.rect(6, py1, 10, py1, 'body', 0.64)                # lit lower lip
    c.put(11, 9, 'leaf', 1.0)                                # handle
    c.put(11, 10, 'leaf', 0.4)
    return c


# -------------------------------------------------------------------------
# Training Hall interior. Equipment is drawn from the same lit primitives as
# everything else so the room does not read as icons pasted onto a floor: each
# piece gets a contact shadow, a lit top-left face and a darker right face.
# -------------------------------------------------------------------------
def _gym_floor(variant=0):
    """Rubber matting. Seamed into panels so the floor shows its own grid
    instead of borrowing the tile grid."""
    c = tile('gym')
    mottle(c, 'belly', 0.52, 0.05, 41 + variant, cell=2)
    c.rect(0, 0, 15, 0, 'belly', 0.40)                       # panel seam
    c.rect(0, 0, 0, 15, 'belly', 0.40)
    c.rect(1, 1, 15, 1, 'belly', 0.60)                       # light catching the lip
    if variant:
        for k in range(3, 14, 4):
            c.put(k, 8, 'belly', 0.44)
    return c


def tile_gym_floor(variant=0):
    return _gym_floor(variant)


def tile_gym_mat():
    """A bordered training mat — where Resolve work happens."""
    c = _gym_floor(0)
    c.rect(1, 1, 14, 14, 'accent', 0.26)                     # mat body
    c.rect(2, 2, 13, 13, 'accent', 0.44)
    c.rect(2, 2, 13, 2, 'accent', 0.60)                      # lit top edge
    c.rect(2, 2, 2, 13, 'accent', 0.54)
    c.rect(13, 3, 13, 13, 'accent', 0.20)                    # shaded right edge
    c.rect(3, 13, 13, 13, 'accent', 0.20)
    return c


def tile_gym_wall():
    c = tile('gym')
    mottle(c, 'body', 0.30, 0.03, 47, cell=4)
    c.rect(0, 12, 15, 13, 'leaf', 0.34)                      # dado rail
    c.rect(0, 12, 15, 12, 'leaf', 0.52)
    c.rect(0, 14, 15, 15, 'body', 0.20)                      # skirting in shadow
    return c


def tile_home_floor(variant=0):
    """Interior floorboards. Rooms used to fall back to the grass tile, so the
    bedroom and the front room were carpeted in lawn."""
    c = tile('couch')
    mottle(c, 'body', 0.56, 0.05, 61 + variant, cell=2)
    run = 5 if variant else 4
    for by in range(0, 16, run):
        c.rect(0, by, 15, by, 'body', 0.36)                  # board seam
        c.rect(0, by + 1, 15, by + 1, 'body', 0.70)          # lit lip below it
    stagger = 0 if variant == 0 else 6
    for bx in range((stagger + 7) % 16, 16, 11):             # butt joints
        c.rect(bx, 0, bx, 15, 'body', 0.40)
    return c


def tile_gym_wall_side():
    """Left/right wall. The dado rail is horizontal, so tiling the front wall
    down a column stacked it into a ladder; the side run gets a pilaster
    instead, which repeats without reading as a repeat."""
    c = tile('gym')
    mottle(c, 'body', 0.30, 0.03, 47, cell=4)
    c.rect(5, 0, 7, 15, 'body', 0.40)                        # pilaster
    c.rect(5, 0, 5, 15, 'body', 0.56)                        # lit edge
    c.rect(7, 0, 7, 15, 'body', 0.20)                        # shaded edge
    return c


def tile_gym_mirror():
    c = tile_gym_wall()
    c.rect(1, 1, 14, 11, 'body', 0.18)                       # frame
    c.rect(2, 2, 13, 10, 'body', 0.66)                       # glass
    for k in range(6):                                        # diagonal glint
        c.put(3 + k, 9 - k, 'body', 0.90)
        c.put(4 + k, 9 - k, 'body', 0.78)
    c.rect(2, 2, 13, 2, 'body', 0.80)
    return c


def tile_rack_barbell():
    """Loaded bar on an upright rack — the silhouette people recognise first."""
    c = _gym_floor(0)
    c.rect(1, 4, 3, 15, 'body', 0.26); c.rect(12, 4, 14, 15, 'body', 0.26)   # uprights
    c.rect(1, 4, 1, 15, 'body', 0.44); c.rect(12, 4, 12, 15, 'body', 0.44)   # lit faces
    c.rect(2, 6, 13, 7, 'body', 0.62)                                        # the bar
    c.rect(2, 6, 13, 6, 'body', 0.82)
    for cx in (4, 11):                                                       # plates
        c.rect(cx - 1, 3, cx + 1, 10, 'body', 0.20)
        c.rect(cx - 1, 3, cx - 1, 10, 'body', 0.38)
        c.rect(cx, 4, cx, 9, 'leaf', 0.44)
    c.rect(0, 15, 15, 15, 'ink', 0)                                          # contact shadow
    return c


def tile_rack_dumbbell():
    """Two-tier rack. Pairs get smaller left to right so it reads as a set."""
    c = _gym_floor(0)
    c.rect(0, 6, 15, 7, 'body', 0.30)                                        # shelves
    c.rect(0, 11, 15, 12, 'body', 0.30)
    c.rect(0, 6, 15, 6, 'body', 0.48); c.rect(0, 11, 15, 11, 'body', 0.48)
    c.rect(0, 13, 1, 15, 'body', 0.24); c.rect(14, 13, 15, 15, 'body', 0.24)  # legs
    for row, top in ((0, 3), (1, 8)):
        for i, cx in enumerate((3, 7, 11)):
            r = 2 - i * 0 + (1 if row == 0 else 0)
            c.rect(cx - 1, top, cx + 1, top + 2, 'body', 0.20)               # bells
            c.rect(cx, top + 1, cx, top + 1, 'body', 0.56)                   # handle
            c.put(cx - 1, top, 'body', 0.40)
    c.rect(0, 15, 15, 15, 'ink', 0)
    return c


def tile_machine():
    """Cable/selectorised stack: column, pulley, weight stack, seat pad."""
    c = _gym_floor(0)
    c.rect(2, 1, 6, 15, 'body', 0.24)                                        # stack housing
    c.rect(2, 1, 2, 15, 'body', 0.42)                                        # lit edge
    for k in range(3, 14, 2):                                                # the plates
        c.rect(3, k, 5, k, 'body', 0.56)
        c.rect(3, k + 1, 5, k + 1, 'body', 0.30)
    c.rect(8, 1, 9, 12, 'body', 0.36)                                        # upright
    c.rect(8, 1, 8, 12, 'body', 0.54)
    c.rect(6, 2, 12, 3, 'body', 0.46)                                        # top arm
    c.put(12, 4, 'body', 0.70); c.put(12, 5, 'body', 0.70)                   # cable
    c.rect(10, 9, 15, 11, 'leaf', 0.40)                                      # seat pad
    c.rect(10, 9, 15, 9, 'leaf', 0.58)
    c.rect(11, 12, 12, 15, 'body', 0.26)                                     # seat post
    c.rect(0, 15, 15, 15, 'ink', 0)
    return c


def tile_treadmill():
    """Deck, belt and console — the cardio corner."""
    c = _gym_floor(0)
    c.rect(2, 6, 13, 14, 'body', 0.26)                                       # deck
    c.rect(3, 7, 12, 13, 'belly', 0.30)                                      # belt
    for k in range(8, 13, 2):
        c.rect(3, k, 12, k, 'belly', 0.44)                                   # belt slats
    c.rect(2, 6, 13, 6, 'body', 0.48)                                        # lit deck lip
    c.rect(3, 1, 12, 2, 'body', 0.40)                                        # console
    c.rect(3, 1, 12, 1, 'body', 0.62)
    c.rect(5, 2, 10, 2, 'leaf', 0.72)                                        # readout
    c.rect(3, 3, 3, 5, 'body', 0.34); c.rect(12, 3, 12, 5, 'body', 0.34)     # uprights
    c.rect(0, 15, 15, 15, 'ink', 0)
    return c


def tile_bench():
    """Flat bench, seen from above-front: pad, gap, and two feet."""
    c = _gym_floor(0)
    c.rect(3, 4, 12, 10, 'leaf', 0.32)                                       # pad
    c.rect(3, 4, 12, 4, 'leaf', 0.54)                                        # lit top
    c.rect(3, 4, 3, 10, 'leaf', 0.46)
    c.rect(12, 5, 12, 10, 'leaf', 0.20)                                      # shaded side
    c.rect(4, 11, 11, 11, 'body', 0.22)                                      # frame
    c.rect(4, 12, 5, 14, 'body', 0.30); c.rect(10, 12, 11, 14, 'body', 0.30) # feet
    c.rect(2, 15, 13, 15, 'ink', 0)
    return c


def tile_water_station():
    """Cooler and cups. Hydration is a module, so it gets a landmark."""
    c = _gym_floor(0)
    c.rect(4, 2, 11, 6, 'body', 0.60)                                        # bottle
    c.rect(4, 2, 11, 2, 'body', 0.82)
    c.rect(5, 3, 10, 5, 'belly', 0.72)                                       # water
    c.rect(3, 7, 12, 14, 'body', 0.28)                                       # cabinet
    c.rect(3, 7, 3, 14, 'body', 0.44)
    c.rect(6, 9, 9, 10, 'body', 0.16)                                        # spout recess
    c.put(7, 11, 'leaf', 0.66); c.put(8, 11, 'leaf', 0.66)                   # taps
    c.rect(2, 15, 13, 15, 'ink', 0)
    return c


def tile_gym_exit():
    """The way back out to Maple Lane."""
    c = tile_gym_wall()
    c.rect(3, 2, 12, 15, 'leaf', 0.22)                       # frame
    c.rect(4, 3, 11, 15, 'leaf', 0.44)                       # door face
    c.rect(4, 3, 4, 15, 'leaf', 0.60)                        # lit edge
    c.rect(5, 5, 10, 9, 'leaf', 0.30)                        # window panel
    c.rect(6, 6, 9, 8, 'body', 0.72)
    c.put(10, 11, 'body', 0.86)                              # handle
    return c


def tile_gate():
    """The way out of town. Two stone posts either side of the path, so it reads
    as a gap you walk through rather than a decoration."""
    c = tile_path()
    for px_ in (0, 13):
        c.rect(px_, 2, px_ + 2, 15, 'leaf', 0.30)            # post
        c.rect(px_, 2, px_, 15, 'leaf', 0.48)                # lit face
        c.rect(px_ + 2, 2, px_ + 2, 15, 'leaf', 0.16)        # shadow face
        c.rect(px_, 1, px_ + 2, 1, 'leaf', 0.58)             # cap
        for k in range(4, 15, 5):                            # grain
            c.put(px_ + 1, k, 'leaf', 0.22)
    c.rect(2, 3, 13, 4, 'leaf', 0.42)                        # rail across the top
    c.rect(2, 5, 13, 5, 'leaf', 0.18)
    return c


# =========================================================================
# TRACED — sprites converted from reference artwork.
#
# The procedural pipeline can build a coherent lit form, but the DESIGN — the
# proportions, where the weight sits, how a face is arranged — was the limit,
# and it was mine rather than the engine's. A drawn reference solves that
# directly: the artwork is downsampled, quantised to a hand-ordered palette, and
# kept here as data.
#
# These are the kit. Everything procedural should inherit their palette ramps
# and their proportions so the roster reads as one family rather than as two
# separate art styles sharing a screen.
# =========================================================================
TRACED_DIR = HERE

# Must match TRACE_ALPHABET in tools/convert_character.py. A..Z occupy the same
# first 26 positions the creature tracer has always used, so every traced_*.json
# written before the lowercase/digit tail existed still decodes identically.
TRACE_ALPHABET = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    'abcdefghijklmnopqrstuvwxyz'
    '0123456789'
)
TRACE_INDEX = {ch: i + 1 for i, ch in enumerate(TRACE_ALPHABET)}


def load_traced(name):
    path = os.path.join(TRACED_DIR, 'traced_%s.json' % name)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        blob = json.load(f)
    pal = ['transparent'] + list(blob['palette'])
    # Re-index from the converter's alphabet into the sprite alphabet, with 0
    # reserved for transparent as everywhere else. A character card needs more
    # than the 26 colours a positional ord() could reach, hence the table.
    grid = []
    for row in blob['rows']:
        out = ''
        for ch in row:
            out += TRANSPARENT if ch == '.' else DIGITS[TRACE_INDEX[ch]]
        grid.append(out)
    return {'palette': pal, 'grid': grid}


# =========================================================================
# REGISTRY
# =========================================================================
def build_all():
    s = {}
    traced_palettes = {}

    def add(name, canvas):
        # Reference artwork, where we have it, beats anything generated.
        t = load_traced(name)
        if t:
            key = 'art_' + name
            traced_palettes[key] = t['palette']
            s[name] = {'palette': key, 'grid': t['grid']}
            return
        s[name] = {'palette': canvas.palette, 'grid': canvas.resolve()}

    # creatures
    add('sproutle', sproutle()); add('bloomtail', bloomtail())
    add('emberkit', emberkit()); add('pyrelynx', pyrelynx())
    add('dewbble', dewbble()); add('tidewade', tidewade())
    add('groveheart', groveheart()); add('cindermane', cindermane())
    add('maelstride', maelstride())
    add('pebblepup', pebblepup()); add('wispurr', wispurr()); add('sporelet', sporelet())
    add('cairnhound', pebblepup()); add('monolithound', pebblepup())
    add('galegait', wispurr()); add('skywhorl', wispurr())
    add('mycobloom', sporelet()); add('canopore', sporelet())
    add('sludgewad', sludgewad()); add('snoozeghoul', snoozeghoul())
    add('couchlurk', couchlurk()); add('achefang', achefang())

    # People. Each player character gets its own four facings x three frames on
    # its own palette, so picking a character changes who walks around rather
    # than just which colour the same body is painted. hero_* stays as the
    # unstyled fallback for any save or screen that has no character yet.
    for who, pal, hair in (
        (None, 'hero', 'short'),
        ('woman', 'pc_woman', 'bun'),
        ('man', 'pc_man', 'crop'),
        ('nonbinary', 'pc_nonbinary', 'swept'),
    ):
        prefix = 'hero' if who is None else 'hero_%s' % who
        for facing in ('down', 'up', 'left', 'right'):
            add('%s_%s' % (prefix, facing), hero(facing, 0, pal, hair))
            add('%s_%s_a' % (prefix, facing), hero(facing, 1, pal, hair))
            add('%s_%s_b' % (prefix, facing), hero(facing, 3, pal, hair))
    add('coach_maple', coach_maple())

    # Portraits traced straight off the character cards, for the screens that
    # show a face big enough to read one.
    for name in ('portrait_maple', 'portrait_woman', 'portrait_man', 'portrait_nonbinary'):
        traced = load_traced(name)
        if not traced:
            raise SystemExit('missing tools/traced_%s.json — run tools/convert_character.py' % name)
        key = 'art_' + name
        traced_palettes[key] = traced['palette']
        s[name] = {'palette': key, 'grid': traced['grid']}

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
    add('tile_path', tile_path(0)); add('tile_path_b', tile_path(1))

    # Autotiles: one per cardinal-neighbour mask, plus the diagonal notches and
    # the contact shading. See the AUTOTILING block above.
    #
    # Built by compositing the committed painted tiles wherever those exist, so
    # a blended edge is the same artwork as the tile beside it. The procedural
    # path_tile/water_tile are the fallback for a build with no atlas.
    def add_blended(key, colors_rows, fallback):
        """Register composited art, or fall back to the procedural drawing."""
        if not colors_rows:
            add(key, fallback())
            return
        colors, rows = colors_rows
        pal_key = 'art_' + key
        traced_palettes[pal_key] = colors
        s[key] = {'palette': pal_key, 'grid': rows}

    # Two more ground variants, as flips of the painted originals.
    add_blended('tile_grass_c', flipped_traced('tile_grass', horizontal=True),
                lambda: tile_grass(2))
    add_blended('tile_grass_d', flipped_traced('tile_grass_b', vertical=True),
                lambda: tile_grass(3))

    for _mask in range(16):
        add_blended(
            'tile_path_m%d' % _mask,
            blended_tile('tile_grass', 'tile_path' if _mask % 2 == 0 else 'tile_path_b', _mask, 5 + _mask, 0.80),
            lambda m=_mask: path_tile(m, m % 2),
        )
        # A wet margin is brighter than the water, not darker.
        add_blended(
            'tile_water_m%d' % _mask,
            blended_tile('tile_grass', 'tile_water', _mask, 31 + _mask, 1.18),
            lambda m=_mask: water_tile(m, 0),
        )
        add_blended(
            'tile_water_m%d_b' % _mask,
            blended_tile('tile_grass_b', 'tile_water_b', _mask, 31 + _mask, 1.18),
            lambda m=_mask: water_tile(m, 1),
        )
    for _corner in ('nw', 'ne', 'sw', 'se'):
        add_blended('tile_path_ic_%s' % _corner, blended_corner('tile_grass', _corner),
                    lambda c=_corner: inner_corner(c, 'body', 0.58))
        add_blended('tile_water_ic_%s' % _corner, blended_corner('tile_grass', _corner),
                    lambda c=_corner: inner_corner(c, 'body', 0.58))
    for _sides in ('n', 'w', 'nw'):
        add('tile_ao_%s' % _sides, ao_overlay(_sides))
    add('tile_tree', tile_tree())
    add_blended('tile_tree_b', flipped_traced('tile_tree', horizontal=True), tile_tree)
    add('tile_water', tile_water(0)); add('tile_water_b', tile_water(1))
    add('tile_flowers', tile_flowers())
    add('tile_roof_rest', tile_roof('ache')); add('tile_roof_gym', tile_roof('hero'))
    add('tile_wall', tile_wall('couch')); add('tile_window', tile_window('couch'))
    add('tile_door', tile_door('couch')); add('tile_gate', tile_gate())

    # Training Hall interior
    add('tile_gym_floor', tile_gym_floor(0)); add('tile_gym_floor_b', tile_gym_floor(1))
    add('tile_gym_mat', tile_gym_mat()); add('tile_gym_wall', tile_gym_wall())
    add('tile_gym_wall_side', tile_gym_wall_side())
    add('tile_home_floor', tile_home_floor(0)); add('tile_home_floor_b', tile_home_floor(1))
    add('tile_gym_mirror', tile_gym_mirror()); add('tile_gym_exit', tile_gym_exit())
    add('tile_rack_barbell', tile_rack_barbell()); add('tile_rack_dumbbell', tile_rack_dumbbell())
    add('tile_machine', tile_machine()); add('tile_treadmill', tile_treadmill())
    add('tile_bench', tile_bench()); add('tile_water_station', tile_water_station())
    # Every committed piece of traced art must actually reach a sprite.
    #
    # add() prefers traced_<name>.json and silently falls back to the procedural
    # drawing when there isn't one. That silence is how four character cards sat
    # in assets/characters/ for a release while the overworld kept rendering the
    # old placeholder people, and every regeneration reported success. Art that
    # nothing consumes is now a build failure rather than a surprise on a phone.
    consumed = {p for p in traced_palettes}
    orphans = sorted(
        os.path.basename(path)
        for path in glob.glob(os.path.join(TRACED_DIR, 'traced_*.json'))
        if 'art_' + os.path.basename(path)[len('traced_'):-len('.json')] not in consumed
    )
    if orphans:
        raise SystemExit(
            'traced art that no sprite uses: %s\n'
            'Register it in build_all() or delete it.' % ', '.join(orphans)
        )

    PALETTES.update(traced_palettes)
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
    # Where each ramp starts and ends inside the flat palette. The client needs
    # this to recolour one ramp and leave the rest alone — an outfit swap that
    # assumed "indices 1..26 are clothing" was only ever right for the 26-step
    # palettes, and silently repainted hair and skin on any other length.
    ramp_spans = {}
    for key, spec in PALETTE_SPECS.items():
        spans = {}
        for name in ('body', 'leaf', 'belly', 'accent'):
            if name not in spec:
                continue
            first = RAMP_INDEX[key][(name, 0)]
            spans[name] = [first, first + RAMP_LEN[key] - 1]
        ramp_spans[key] = spans
    body += 'export const SPRITE_RAMPS = ' + json.dumps(ramp_spans, indent=2) + ';\n\n'
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

