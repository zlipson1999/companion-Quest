#!/usr/bin/env python3
"""The people of Companion Quest, built as boxes and lit as pixel art.

WHY THIS EXISTS ALONGSIDE walk_set()
------------------------------------
`walk_set()` in make_sprites.py derives all twelve overworld frames from ONE
traced front-facing figure: it strides the legs, squeezes the figure toward its
centre line for a profile, mirrors that for the other side, and paints the head
band-of-hair-coloured for the back. That was the right call when the only art
was a front-facing card — it gets four facings out of one drawing for free.

It also has a ceiling, and we hit it. A front view squeezed horizontally is not
a profile: the far arm is still there, the nose never breaks the silhouette, and
left is exactly right reversed, so a character walking a lap looks like a
flipbook of the same pose. The back view is a front view with the face painted
over, so the skull has no volume.

So the people are AUTHORED per facing here instead. Four facings are four
different drawings; the sides are drawn separately rather than mirrored.

THE LOOK
--------
Every volume — head, torso, each arm, each leg, each shoe — is a BOX, and it
reads as a box because three faces are visible at three values: a lit top plane,
a mid front plane, a shaded side. That is the whole trick, and it is the entire
job of `box()`.

The rest is ordinary sprite craft: a 3/4 top-down camera, a large head over a
short body so a face survives at phone scale, three walk frames with a body
lift and opposed arm swing, and outlines that are a hue-shifted dark of the
material they surround rather than a flat black keyline.

INDEXED, NOT RGB
----------------
The canvas stores `(material, index)` pairs, never colours. `grain()` — the
low-frequency jitter that gives a face its block texture — shifts the ramp
INDEX by one step, so a figure's palette is exactly its ramps plus one outline
colour per material. Nudging RGB instead produced roughly three hundred unique
colours per sprite, and PixelArt's alphabet holds ninety.

100% original art: every figure is composed from primitives in this file.
"""

# Six steps per material. Wider than it looks — index 0 is the deep shadow that
# only ever appears on a far leg, 5 is the top plane catching light.
RAMP_N = 6


def ramp(base, lo=0.46, hi=1.22):
    r, g, b = base
    out = []
    for i in range(RAMP_N):
        k = lo + (hi - lo) * (i / (RAMP_N - 1))
        out.append(tuple(max(0, min(255, int(v * k))) for v in (r, g, b)))
    return out


def outline_of(c):
    """A dark of the material, pushed toward blue. Pure black around a warm
    skin tone reads as a hole; a cool dark reads as an edge in shade."""
    r, g, b = c
    return (int(r * 0.30), int(g * 0.28), min(255, int(b * 0.36) + 10))


def grain(x, y, s=0):
    """Low-frequency index jitter — the block-texture read. Roughly a quarter
    of pixels move one ramp step, which is visible as texture without breaking
    the flat plane into noise."""
    v = (x * 73 + y * 151 + s * 31) % 17
    return -1 if v < 4 else (1 if v > 13 else 0)


# --------------------------------------------------------------- the cast ---
# `w` is the torso half-width, `hw` the head half-width, `hy` where the head
# starts. Those three are the silhouette: they decide how broad, how big-headed
# and how TALL a person is, and they are the reason you can tell who is coming
# before you can see a colour. An earlier pass had all five within a pixel of
# each other and the cast collapsed into one body in five palettes.
CAST = {
    'rowan': dict(
        w=8, hw=7, hy=1, gear='band', hair='flat',
        skin=(206, 152, 112), hair_c=(112, 70, 42), top=(226, 96, 52),
        leg=(58, 60, 68), shoe=(238, 236, 230), flash=(238, 168, 72)),
    'maple': dict(
        w=6, hw=6, hy=3, gear='jacket', hair='tail',
        skin=(200, 148, 112), hair_c=(96, 62, 44), top=(56, 158, 146),
        leg=(48, 50, 58), shoe=(240, 232, 206), flash=(240, 196, 88)),
    'woman': dict(
        w=5, hw=6, hy=5, gear='satchel', hair='long',
        skin=(228, 180, 140), hair_c=(74, 50, 42), top=(74, 142, 224),
        leg=(52, 56, 74), shoe=(240, 240, 240), flash=(238, 200, 96)),
    'man': dict(
        w=7, hw=7, hy=2, gear='hood', hair='flat',
        skin=(196, 142, 102), hair_c=(64, 48, 34), top=(104, 176, 92),
        leg=(56, 54, 46), shoe=(236, 232, 220), flash=(232, 228, 214)),
    'nonbinary': dict(
        w=6, hw=6, hy=4, gear='crop', hair='undercut',
        skin=(224, 172, 132), hair_c=(168, 132, 206), top=(242, 132, 96),
        leg=(60, 52, 62), shoe=(240, 230, 220), flash=(96, 208, 196)),
}

W, H = 32, 52
CX = 16
MATERIALS = ('skin', 'hair_c', 'top', 'leg', 'shoe', 'flash', 'shirt')
# Maple's jacket needs something between the panels. Drawing that with the skin
# ramp — which is what an earlier pass did — made her look bare-chested.
SHIRT = (236, 232, 224)


class Canvas:
    """Stores (material, index) or (material, 'o') for outline. Never colours."""

    def __init__(self):
        self.g = [[None] * W for _ in range(H)]

    def px(self, x, y, cell):
        if 0 <= x < W and 0 <= y < H and cell is not None:
            self.g[y][x] = cell

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < W and 0 <= y < H else None

    def face(self, x0, y0, x1, y1, mat, idx, seed=0):
        """One flat plane of a box, grained."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                i = max(0, min(RAMP_N - 1, idx + grain(x, y, seed)))
                self.px(x, y, (mat, i))

    def flat(self, x0, y0, x1, y1, cell):
        """A plane with no grain. Features this small — an eye is two pixels —
        lose their shape entirely if a jitter moves one of them."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, cell)

    def box(self, x0, y0, x1, y1, mat, top=2, side=2, lit='l', seed=0):
        """A box seen from 3/4 above: lit top plane, mid front, shaded side.
        Three faces at three values is the entire voxel read."""
        self.face(x0, y0 + top, x1, y1, mat, 3, seed)
        if top:
            self.face(x0, y0, x1, y0 + top - 1, mat, 5, seed + 1)
        if side:
            if lit == 'l':
                self.face(x1 - side + 1, y0 + top, x1, y1, mat, 1, seed + 2)
                self.face(x0, y0 + top, x0, y1, mat, 4, seed + 3)
            else:
                self.face(x0, y0 + top, x0 + side - 1, y1, mat, 1, seed + 2)
                self.face(x1, y0 + top, x1, y1, mat, 4, seed + 3)

    def outline(self):
        """One outline pixel wherever a filled pixel meets empty space, taking
        its hue from whichever material it touches most."""
        add = {}
        for y in range(H):
            for x in range(W):
                if self.g[y][x] is not None:
                    continue
                tally = {}
                for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
                    n = self.get(x + dx, y + dy)
                    if n is not None and n[1] != 'o':
                        tally[n[0]] = tally.get(n[0], 0) + 1
                if tally:
                    add[(x, y)] = (max(tally, key=tally.get), 'o')
        for pos, cell in add.items():
            self.px(pos[0], pos[1], cell)


def head(c, k, top, mode):
    hw = k['hw']
    x0, x1 = CX - hw, CX + hw - 1
    y0, y1 = top, top + hw + 4
    lit = 'r' if mode == 'r' else 'l'
    c.box(x0, y0, x1, y1, 'skin', top=3, side=2, lit=lit, seed=1)

    if mode == 'back':
        # The back of a head is hair all the way down, with a nape only where a
        # neck would actually show. Leaving three full rows of skin here read as
        # a blank face pointing the wrong way.
        c.box(x0, y0, x1, y1, 'hair_c', top=3, side=2, lit=lit, seed=2)
        c.face(CX - 2, y1 - 1, CX + 1, y1, 'skin', 2, 3)
    else:
        c.box(x0, y0, x1, y0 + hw - 1, 'hair_c', top=3, side=2, lit=lit, seed=2)

    style = k['hair']
    if style == 'long':
        sides = ((x0 - 1, x0), (x1, x1 + 1)) if mode in ('front', 'back') else ((x0 - 1, x0),)
        for a, b in sides:
            c.face(a, y0 + 2, b, y1 + 3, 'hair_c', 2, 5)
    elif style == 'tail':
        tx = x1 + 1 if mode != 'l' else x0 - 2
        c.face(tx, y0 + 4, tx + 1, y1 + 4, 'hair_c', 2, 6)
    elif style == 'undercut':
        c.face(x0, y0 + hw, x1, y0 + hw, 'hair_c', 0, 7)     # shaved line, one row

    # Eyes last, so nothing a hairstyle draws can land on top of them.
    if mode == 'front':
        for ex in (CX - 4, CX + 2):
            c.flat(ex, y0 + 7, ex + 1, y0 + 8, ('skin', 'o'))
            c.px(ex, y0 + 7, ('shoe', 5))                   # catchlight
    elif mode != 'back':
        ex = CX + 2 if mode == 'r' else CX - 4
        c.flat(ex, y0 + 7, ex + 1, y0 + 8, ('skin', 'o'))


def gear(c, k, top, ty, mode):
    """What each person wears over the base body. This is the second half of
    the silhouette: a cap, a ponytail and a hood have to be tellable apart in
    the dark from across a room."""
    hw, g = k['hw'], k['gear']
    x0, x1 = CX - hw, CX + hw - 1
    sw = k['w'] if mode in ('front', 'back') else k['w'] - 2

    if g == 'band':
        c.face(x0, top + 5, x1, top + 6, 'flash', 3, 8)
        c.face(x0, top + 5, x1, top + 5, 'flash', 5, 8)
    elif g == 'satchel':
        # A strap across the chest, not a hat. Anything that covers the crown
        # takes her long hair with it, and the long hair is her silhouette.
        for i in range(12):
            x = CX - sw + (i * (2 * sw - 1)) // 12
            c.flat(x, ty + 1 + i, x + 1, ty + 2 + i, ('flash', 3))
        if mode in ('front', 'l'):
            c.flat(CX + sw - 2, ty + 10, CX + sw, ty + 13, ('flash', 2))  # bag
    elif g == 'jacket':
        c.face(CX - sw + 2, ty + 2, CX + sw - 3, ty + 13, 'shirt', 3, 10)
        c.box(CX - sw - 1, ty, CX - sw + 1, ty + 13, 'top', top=2, side=1, lit='l', seed=11)
        c.box(CX + sw - 2, ty, CX + sw, ty + 13, 'top', top=2, side=1, lit='r', seed=11)
        c.face(CX - sw - 1, ty, CX + sw, ty + 1, 'top', 5, 12)        # collar
        if mode == 'front':
            c.face(CX, ty + 4, CX, ty + 7, 'flash', 4, 13)            # lanyard
            c.face(CX - 1, ty + 8, CX, ty + 9, 'flash', 5, 13)        # whistle
    elif g == 'hood':
        # Drawn two ramp steps below the torso it sits on. Drawing it at the
        # same value as the shirt made it invisible, which is what "he has no
        # hood" looked like on the last sheet.
        c.box(CX - sw - 1, ty - 3, CX + sw, ty + 3, 'top', top=2, side=2, lit='l', seed=14)
        c.face(CX - sw - 1, ty - 1, CX + sw, ty, 'top', 1, 14)
        if mode != 'back':
            c.flat(CX - 1, ty + 5, CX - 1, ty + 8, ('flash', 3))      # drawstring
    elif g == 'crop':
        # The crop is the whole read: the shirt stops short and bare midriff
        # shows below a trimmed hem. An earlier pass hung jacket panels either
        # side of the torso, which framed the shirt and read as a vest.
        c.face(CX - sw, ty + 12, CX + sw - 1, ty + 13, 'skin', 3, 16)
        c.face(CX - sw, ty + 11, CX + sw - 1, ty + 11, 'flash', 4, 17)  # hem trim
        c.face(CX - sw, ty, CX + sw - 1, ty + 1, 'flash', 5, 18)      # collar


def neck(c, k, top, ty, mode):
    """Head bottom to torso top. Without this the head hangs four transparent
    rows above the shoulders and every character floats."""
    y0 = top + k['hw'] + 4
    lit = 'r' if mode == 'r' else 'l'
    mat = 'hair_c' if mode == 'back' else 'skin'
    c.box(CX - 2, y0, CX + 1, ty + 1, mat, top=1, side=1, lit=lit, seed=19)


def body(c, k, ty, mode, swing, fwd):
    sw = k['w'] if mode in ('front', 'back') else k['w'] - 2
    lit = 'r' if mode == 'r' else 'l'
    c.box(CX - sw, ty, CX + sw - 1, ty + 13, 'top', top=2, side=2, lit=lit, seed=20)

    def arm(x, s, side_lit):
        # Lift alone carries the swing. An earlier pass also pushed the arm a
        # pixel outward, which opened a gap at the shoulder and made the arms
        # look detached from the body.
        lift = -2 if s > 0 else (2 if s < 0 else 0)
        c.box(x, ty + 2 + lift, x + 2, ty + 9 + lift, 'top',
              top=1, side=1, lit=side_lit, seed=21)
        c.box(x, ty + 10 + lift, x + 2, ty + 12 + lift, 'skin',
              top=1, side=1, lit=side_lit, seed=22)

    if mode in ('front', 'back'):
        arm(CX - sw - 3, swing, 'l')
        arm(CX + sw, -swing, 'r')
    else:
        arm(CX - sw - 3 if mode == 'l' else CX + sw, swing, lit)

    ly = ty + 14
    if mode in ('l', 'r'):
        near = CX - 3 + (2 if fwd > 0 else -2 if fwd < 0 else 0)
        far = CX - 1 - (2 if fwd > 0 else -2 if fwd < 0 else 0)
        # The far leg is flat and dark so it sits behind rather than beside.
        c.face(far, ly, far + 3, ly + 8, 'leg', 0, 23)
        c.face(far - 1, ly + 9, far + 4, ly + 11, 'leg', 0, 23)
        c.box(near, ly, near + 3, ly + 8, 'leg', top=1, side=1, lit=lit, seed=24)
        c.box(near - 1, ly + 9, near + 4, ly + 11, 'shoe', top=1, side=1, lit=lit, seed=25)
        c.face(near - 1, ly + 11, near + 4, ly + 11, 'flash', 3, 26)
    else:
        spread = 1 if fwd else 0
        for lx, f, sl in ((CX - 5 - spread, fwd, 'l'), (CX + 1 + spread, -fwd, 'r')):
            d = 0 if f >= 0 else 2
            short = 1 if f > 0 else 0
            c.box(lx, ly + d, lx + 3, ly + 8 + d - short, 'leg',
                  top=1, side=1, lit=sl, seed=27)
            toe0, toe1 = (lx - 1, lx + 3) if sl == 'l' else (lx, lx + 4)
            c.box(toe0, ly + 9 + d - short, toe1, ly + 11 + d - short, 'shoe',
                  top=1, side=1, lit=sl, seed=28)
            c.face(toe0, ly + 11 + d - short, toe1, ly + 11 + d - short, 'flash', 3, 29)


def build(name, facing, frame):
    k = CAST[name]
    c = Canvas()
    bob = (0, -2, 0)[frame]
    swing = (0, 2, -2)[frame]
    fwd = (0, 2, -2)[frame]
    mode = {'down': 'front', 'up': 'back', 'left': 'l', 'right': 'r'}[facing]
    top = k['hy'] + bob + 2
    ty = top + k['hw'] + 6
    head(c, k, top, mode)
    neck(c, k, top, ty, mode)
    body(c, k, ty, mode, swing, fwd)
    gear(c, k, top, ty, mode)
    c.outline()
    return c


def _hex(c):
    return '#%02x%02x%02x' % c


def palette_for(name):
    """Ordered colour list, the {(material, index): slot} it indexes, and the
    slot span of each material — outfits recolour a span, so they need it."""
    k = CAST[name]
    colors = ['transparent']
    slots = {}
    spans = {}
    for mat in MATERIALS:
        base = SHIRT if mat == 'shirt' else k[mat]
        steps = ramp(base)
        start = len(colors)
        for i, col in enumerate(steps):
            slots[(mat, i)] = len(colors)
            colors.append(_hex(col))
        spans[mat] = [start, len(colors) - 1]      # outline excluded on purpose
        slots[(mat, 'o')] = len(colors)
        colors.append(_hex(outline_of(steps[2])))
    return colors, slots, spans


def ramp_spans(name):
    """{'body': [start, end]} for the clothing ramp, in the shape SPRITE_RAMPS
    already uses. 'body' is the name the outfit system asks for."""
    _c, _s, spans = palette_for(name)
    return {'body': spans['top'], 'skin': spans['skin'], 'hair': spans['hair_c']}


def cube_walk(name, digits, transparent='.'):
    """{facing+suffix: (colors, rows)} — the same contract walk_set() returns,
    so make_sprites.py can drop this in where the traced set used to go."""
    if name not in CAST:
        return None
    colors, slots, _spans = palette_for(name)
    # Slot n is written as digits[n] and read back by PixelArt as pal[n], so
    # the alphabet has to be at least as long as the colour list.
    if len(colors) > len(digits):
        raise SystemExit('cubecast: %s needs %d colours, alphabet holds %d'
                         % (name, len(colors), len(digits)))
    poses = {}
    for facing in ('down', 'up', 'left', 'right'):
        for suffix, frame in (('', 0), ('_a', 1), ('_b', 2)):
            c = build(name, facing, frame)
            rows = [''.join(transparent if cell is None else digits[slots[cell]]
                            for cell in row) for row in c.g]
            poses[facing + suffix] = (colors, rows)
    return poses
