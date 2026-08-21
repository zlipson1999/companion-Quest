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
        h = (hd + SHADOW_HUE) + (((hl + LIGHT_HUE) - (hd + SHADOW_HUE)) * t)
        out.append(rgb_to_hex(hsv_to_rgb(h, max(0.0, min(1.0, s_)), max(0.0, min(1.0, v)))))
    return out


INK = '#140f22'
WHITE = '#fdfdff'
EYE_DARK = '#1b1430'

# A palette is a set of named ramps plus the shared fixed colours. Sprites name
# a ramp and a shade; the flat index list is generated, so nothing has to be
# mirrored by hand anywhere else.
PALETTE_SPECS = {
    'sprout':  {'body': ('#1f5c39', '#a6f0b4'), 'leaf': ('#2f7d3f', '#d4ff9e'), 'belly': ('#4a7a3a', '#e2ffc9')},
    'ember':   {'body': ('#5e2a14', '#ffcf8e'), 'leaf': ('#b8431c', '#ffe3a0'), 'belly': ('#7a3c1e', '#ffdcae')},
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
    # Third-stage forms. Deeper and richer than the stage they grow out of —
    # a final form that is merely a brighter recolour reads as the same creature.
    'grove':   {'body': ('#14402a', '#7ad98e'), 'leaf': ('#5c3a18', '#d9a860'), 'belly': ('#a8801e', '#ffe89a')},
    # belly was ('#2a1410', ...) — so dark the muzzle read as a hole punched
    # through the face rather than a lighter patch of fur.
    'cinder':  {'body': ('#5c1005', '#ff8a3d'), 'leaf': ('#8a1f06', '#ffd45e'), 'belly': ('#7a3418', '#ffc48a')},
    'maels':   {'body': ('#04203f', '#6cc4ff'), 'leaf': ('#0d5c7a', '#9fe8ff'), 'belly': ('#123a5e', '#d0f2ff')},
}

RAMP_STEPS = 7


def build_palette(spec):
    """Flatten a palette spec into (index list, {(ramp, step): index})."""
    colors = [None]          # 0 is always transparent
    index = {}
    for name in ('body', 'leaf', 'belly'):
        steps = ramp(*spec[name], steps=RAMP_STEPS)
        for i, c in enumerate(steps):
            index[(name, i)] = len(colors)
            colors.append(c)
        # A keyline that is merely the ramp's darkest step reads as a coloured
        # halo — a red fringe around warm hair, cyan around blue cloth. Pull it
        # most of the way to ink: enough hue survives to tie the line to the
        # surface, not enough to glow. At 0.62 a warm creature still came out
        # ringed in bright red-brown and read as a sticker; 0.80 sits down.
        index[(name, 'line')] = len(colors)
        colors.append(mix(steps[0], INK, 0.80))
    for name, c in (('ink', INK), ('white', WHITE), ('eye', EYE_DARK)):
        index[(name, 0)] = len(colors)
        colors.append(c)
    return colors, index


PALETTES = {}
RAMP_INDEX = {}
for _k, _spec in PALETTE_SPECS.items():
    PALETTES[_k], RAMP_INDEX[_k] = build_palette(_spec)


# ----------------------------------------------------------------- canvas ---
# Hard value bands, not a smooth gradient. A continuous ramp reads airbrushed;
# handheld sprite work bands into a few clear steps and lets the boundaries do
# the describing. Four bands plus the specular is the classic budget.
BANDS = 5

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

    def __init__(self, w, h, palette, scale=1):
        self.scale = scale
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
        """Sclera, lid shadow, pupil, specular.

        A white dot with a black dot in it reads as a bead. What sells an eye at
        this size is the lid shadow across the top and a specular that is big
        enough to survive — one pixel of highlight disappears the moment the
        sprite is scaled down."""
        S = self.scale
        self.blob(cx, cy, r, r + 0.35, 'white', 1.0)
        # The lid was a third of the eye's height and the pupil most of the
        # rest, so every creature came out heavy-lidded and sullen. A thin lid
        # high on the eye reads as a brow; the white has to survive around the
        # pupil or there is no eye left to see.
        self.blob(cx, cy - r * 0.92, r * 0.92, r * 0.26, 'eye', 0.0)     # lid line
        self.blob(cx + look[0], cy + look[1] + r * 0.10, r * 0.54, r * 0.62, 'eye', 0.0)
        # specular: a 2x2 block up and left of the pupil, inside the sclera
        hx, hy = int((cx - r * 0.42) * S), int((cy - r * 0.34) * S)
        for dy in range(max(2, S)):
            for dx in range(max(2, S)):
                self._set(hx + dx, hy + dy, 'white', 1.0)
        # a smaller bounce light low-right keeps the eye from looking painted on
        self._set(int((cx + r * 0.34) * S), int((cy + r * 0.44) * S), 'white', 1.0)

    # -- finishing passes ---------------------------------------------------
    def rim(self, ramp_name='leaf', strength=1.0):
        """Bounce light along the lower-right silhouette edge."""
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
                    step = int(round(sh * (RAMP_STEPS - 1)))
                else:
                    pos = sh * (BANDS - 1)
                    band = int(pos)
                    frac = pos - band
                    # dither only near a band edge, so lit flats stay clean
                    if DITHER_ZONE > 0 and band < BANDS - 1:
                        lo, hi = 0.5 - DITHER_ZONE / 2, 0.5 + DITHER_ZONE / 2
                        if lo < frac < hi:
                            t = (frac - lo) / (hi - lo)
                            if t > (BAYER[y % 4][x % 4] + 0.5) / 16.0:
                                band += 1
                        elif frac >= hi:
                            band += 1
                    band = max(0, min(BANDS - 1, band))
                    step = int(round(band * (RAMP_STEPS - 1) / float(BANDS - 1)))
                step = max(0, min(RAMP_STEPS - 1, step))
                row += DIGITS[idx[(name, step)]]
            rows.append(row)
        return rows


# =========================================================================
# CREATURES — 48x48. Each is a few lit forms plus its own distinguishing
# features. All original designs.
# =========================================================================
CREATURE_SIZE = 48


# Creatures render at 2x the authoring grid — 96x96. The detail budget at 48
# was the hard ceiling on how much character a sprite could carry: an eye was
# six pixels and a paw was three.
CREATURE_SCALE = 2


def new_creature(palette):
    return Canvas(CREATURE_SIZE, CREATURE_SIZE, palette, scale=CREATURE_SCALE)


def sproutle(pal='sprout'):
    """A seedling that stands up. Round, but with arms, feet and a sprout, so
    the silhouette is a small figure rather than an egg with a leaf."""
    c = new_creature(pal)
    c.shadow(24, 44, 12, 3)
    c.limb(24, 16, 24, 8, 1.3, 1.0, 'leaf', ambient=0.4)
    c.sphere(17.5, 6.5, 6.0, 3.2, 'leaf', ambient=0.5)
    c.sphere(30.5, 5.5, 5.4, 3.0, 'leaf', ambient=0.6)
    c.limb(17, 36, 14, 43, 2.6, 2.4, 'body', ambient=0.24)
    c.limb(31, 36, 34, 43, 2.6, 2.4, 'body', ambient=0.24)
    c.blob(13.5, 44, 3.6, 2.0, 'body', 0.34)
    c.blob(34.5, 44, 3.6, 2.0, 'body', 0.34)
    c.sphere(24, 27, 13.5, 12.5, 'body')
    c.sphere(24, 32, 8.0, 6.4, 'belly', ambient=0.54)
    c.limb(12.5, 26, 9, 33, 2.4, 1.9, 'body', ambient=0.34)
    c.limb(35.5, 26, 39, 33, 2.4, 1.9, 'body', ambient=0.34)
    c.blob(8.5, 34, 2.4, 2.2, 'body', 0.42)
    c.blob(39.5, 34, 2.4, 2.2, 'body', 0.42)
    c.eye(19, 24, 3.3)
    c.eye(29, 24, 3.3)
    c.blob(24, 29.5, 2.2, 1.1, 'leaf', 0.22)
    c.occlude()
    c.rim('leaf')
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
    """An ember cub, sitting up.

    Rebuilt against the silhouette test: the first version was an egg with ears,
    indistinguishable in black from every other creature. This one has a neck, a
    chest, four legs and a raised tail, so the shape says "small quadruped"
    before any colour is read.
    """
    c = new_creature(pal)
    c.shadow(24, 44, 14, 3)

    # tail first, so the body overlaps its root
    c.limb(31, 34, 40, 22, 2.8, 1.4, 'body')
    # A flame, not a bead on a stick: an asymmetric tongue with a lick off the
    # side, so the tail ends in a shape rather than a full stop.
    c.poly([(40, 24), (44, 16), (41.5, 17.5), (42, 10), (38, 17), (39, 15.5), (37.5, 23)], 'leaf', 0.95)
    c.poly([(40, 22), (42, 17), (40.5, 18), (40.5, 14), (38.5, 18.5), (38.8, 21)], 'belly', 1.0)

    # hind legs, then the body sitting over them
    c.limb(15, 33, 13, 42, 3.4, 2.8, 'body', ambient=0.22)
    c.limb(33, 33, 35, 42, 3.4, 2.8, 'body', ambient=0.22)
    c.blob(12.5, 43, 4.0, 2.2, 'body', 0.30)              # hind paws
    c.blob(35.5, 43, 4.0, 2.2, 'body', 0.30)

    c.sphere(24, 33, 11.5, 10.0, 'body')                  # chest / body
    c.sphere(24, 36, 7.0, 5.4, 'belly', ambient=0.52)     # pale front

    # forelegs in front of the chest
    c.limb(19, 34, 18, 43, 2.6, 2.2, 'body', ambient=0.34)
    c.limb(29, 34, 30, 43, 2.6, 2.2, 'body', ambient=0.34)
    c.blob(17.5, 44, 3.2, 1.8, 'belly', 0.62)
    c.blob(30.5, 44, 3.2, 1.8, 'belly', 0.62)

    c.limb(24, 27, 24, 22, 5.0, 5.6, 'body', ambient=0.30) # neck

    # head last: ears behind, skull, muzzle
    c.limb(16.5, 15, 14.5, 3, 4.6, 0.7, 'body', ambient=0.34)   # ears
    c.limb(31.5, 15, 33.5, 3, 4.6, 0.7, 'body', ambient=0.34)
    c.limb(16.5, 14, 15.3, 6, 2.4, 0.5, 'leaf', ambient=0.60)   # inner ear
    c.limb(31.5, 14, 32.7, 6, 2.4, 0.5, 'leaf', ambient=0.52)
    c.sphere(24, 18, 12.0, 10.5, 'body')                   # skull
    c.sphere(24, 23, 6.4, 4.4, 'belly', ambient=0.56)      # muzzle
    c.poly([(24, 6), (27, 13), (24, 11), (21, 13)], 'leaf', 1.0)  # flame mark

    c.eye(18.5, 17, 3.4)
    c.eye(29.5, 17, 3.4)
    c.blob(24, 21.5, 1.9, 1.3, 'eye', 0.0)                 # nose
    c.blob(24, 24.5, 2.6, 0.9, 'eye', 0.0)                 # mouth line

    c.occlude()
    c.rim('leaf')
    c.outline()
    return c


def dewbble(pal='dew'):
    """A dewdrop that walks. The teardrop point is kept as the identity, but it
    has stubby arms and feet so it is a creature and not a shape."""
    c = new_creature(pal)
    c.shadow(24, 44, 12, 3)
    c.limb(19, 37, 16, 43, 2.4, 2.2, 'body', ambient=0.24)
    c.limb(29, 37, 32, 43, 2.4, 2.2, 'body', ambient=0.24)
    c.blob(15.5, 44, 3.4, 2.0, 'body', 0.32)
    c.blob(32.5, 44, 3.4, 2.0, 'body', 0.32)
    c.limb(24, 20, 24, 4, 6.0, 0.6, 'body', ambient=0.40)      # the point
    c.sphere(24, 29, 13.0, 12.0, 'body')                       # the drop
    c.sphere(24, 34, 7.6, 5.6, 'belly', ambient=0.56)
    c.limb(12.5, 29, 9, 35, 2.2, 1.8, 'body', ambient=0.34)
    c.limb(35.5, 29, 39, 35, 2.2, 1.8, 'body', ambient=0.34)
    c.blob(8.5, 36, 2.3, 2.1, 'body', 0.42)
    c.blob(39.5, 36, 2.3, 2.1, 'body', 0.42)
    c.sphere(18, 20, 3.6, 4.4, 'leaf', ambient=0.80)           # surface glint
    c.eye(19, 27, 3.3)
    c.eye(29, 27, 3.3)
    c.blob(24, 32, 2.0, 1.1, 'eye', 0.0)
    c.occlude()
    c.rim('leaf')
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

    # Legs are trousers, not bare sticks: same ramp as the shirt, several steps
    # darker. Drawn wide enough to survive being scaled down to a 16px tile.
    def leg(x0, x1, lift):
        top, sole = 23, 29 + lift
        c.rect(x0, top, x1, sole - 1, 'body', 0.24)
        c.rect(x0, top, x0, sole - 1, 'body', 0.34)          # inner highlight
        c.rect(x0 - 1, sole, x1 + 1, sole + 1, 'ink', 0)     # shoe
        c.rect(x0 - 1, sole, x1, sole, 'body', 0.16)         # laces catch light

    leg(7, 10, max(0, swing))
    leg(13, 16, max(0, -swing))

    # body: narrower in profile so the turn reads on silhouette alone
    c.sphere(12, 19, 5.5 if side else 7, 6, 'body')
    c.rect(5 if not side else 7, 24, 19 if not side else 17, 24, 'body', 0.30)   # shirt hem
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


def tile_grass(variant=0):
    """Grass is 90% of what the player looks at, so it has to hold up flat.

    A base value, clustered mottle for depth, and a handful of blades with a
    dark pixel behind each so the tuft reads as standing up off the ground.
    """
    c = tile('terra')
    seed = 11 + variant * 7
    # Spread is deliberately small: at seven ramp steps most cells land on the
    # same colour and only a few break away, which is depth. Widen it and the
    # tile turns into visible 2x2 squares.
    mottle(c, 'body', 0.58, 0.042, seed)
    blades = ((3, 5), (10, 3), (6, 11), (13, 9)) if variant == 0 else ((8, 4), (2, 10), (12, 12), (5, 7))
    for bx, by in blades:
        c.put(bx, by - 2, 'body', 0.92)
        c.put(bx, by - 1, 'body', 0.88)
        c.put(bx, by, 'body', 0.78)
        c.put(bx + 1, by - 1, 'body', 0.30)  # the blade's own shadow
        c.put(bx + 1, by, 'body', 0.34)
        c.put(bx - 1, by, 'body', 0.70)      # a second, shorter leaf
    if variant == 1:                          # a couple of pebbles, sparingly
        for px_, py_ in ((14, 4), (4, 13)):
            c.put(px_, py_, 'leaf', 0.62)
            c.put(px_, py_ + 1, 'leaf', 0.3)
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
    add('groveheart', groveheart()); add('cindermane', cindermane())
    add('maelstride', maelstride())
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
    add('tile_path', tile_path(0)); add('tile_path_b', tile_path(1))
    add('tile_tree', tile_tree())
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
