#!/usr/bin/env python3
"""Split an approval lineup into isolated creature masters.

The approved trail lineups are three designed faces on a shared ground.
`convert_reference.py` wants ONE creature, cropped, on transparency.
This finds column-runs of visible pixels (same idea as convert_character
figure_bounds), mattes the shared backdrop, strips the contact-shadow
ground under the feet, and writes one PNG per name.

A lineup with scenery (forest, sky) is for looking at, not for shipping.
Gale and Canopy are scenic plates — sky/clouds and a forest floor. Do
not split them into `tools/reference_art/<id>.png`. Re-generate each
face alone with the "Ship master" prompt in tools/CHARACTER_PROMPT.md
(flat #000000, no ground). `--force` will split a scenic plate anyway
and the result will be muddy; do not commit those files.

Each family still needs three different life-stage masters (baby /
adolescent / adult). Splitting one pose three times is not a family.
See the hard reject at the top of tools/CHARACTER_PROMPT.md.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


# Border samples farther than this from the median are scenery, not a
# flat field. Maple/Cairn sit around 5; Gale/Canopy sit above 100.
SCENIC_SPREAD = 40
# Tiny leftover clumps (grass specks, matte crumbs) after the figure
# is cut out. Dewbble-style droplets are art and live on a ship master,
# not on an approval lineup, so a 48-px floor is safe here.
MIN_SPECK = 48


def color_dist(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def border_samples(image, step=4):
    width, height = image.size
    pixels = image.load()
    samples = []
    for x in range(0, width, step):
        samples.append(pixels[x, 0][:3])
        samples.append(pixels[x, height - 1][:3])
    for y in range(0, height, step):
        samples.append(pixels[0, y][:3])
        samples.append(pixels[width - 1, y][:3])
    return samples


def sample_border(image, step=4):
    """Typical backdrop colour, taken from the frame, not the figures."""
    samples = border_samples(image, step)
    # Median per channel so one lamp-post highlight does not win.
    rs, gs, bs = zip(*samples)
    mid = len(samples) // 2
    return (sorted(rs)[mid], sorted(gs)[mid], sorted(bs)[mid])


def border_spread(image):
    """How far the frame wanders from its own median colour."""
    samples = border_samples(image)
    mid = sample_border(image)
    return max(color_dist(sample, mid) for sample in samples)


def looks_like_ground(rgb):
    """Dark grass or dirt — the shared strip under an approval lineup.

    Bright lime feet, tan paws and grey stone toes stay, because those
    are lighter or a different hue than the contact patch.
    """
    red, green, blue = rgb
    brightest = max(rgb)
    if brightest <= 18:
        return True
    grass = green >= red + 6 and green >= blue + 8 and green < 95 and brightest < 110
    dirt = (
        red >= green - 4 and green >= blue
        and (red - blue) >= 10 and red < 100
        and brightest < 110 and blue < 70
    )
    return grass or dirt


def matte(image, threshold, ground_frac):
    """Flood from the border: similar colour is backdrop, the rest stays.

    Interior holes (eyes, gaps between wings) stay opaque because the
    flood never reaches them — same rule as convert_character.fill_interior.
    A bottom ground strip that spans the whole plate is treated as
    backdrop even when its colour differs from the sky, because a shared
    grass/sand band is scenery, not a creature.
    """
    width, height = image.size
    pixels = image.load()
    backdrop = sample_border(image)
    outside = [[False] * width for _ in range(height)]
    stack = []
    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= width or y >= height or outside[y][x]:
            continue
        rgb = pixels[x, y][:3]
        dark = max(rgb) <= 18
        near = color_dist(rgb, backdrop) <= threshold
        if not (dark or near):
            continue
        outside[y][x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    # Ground strip: a row in the bottom band that is mostly the same
    # material under everyone, so three creatures do not become one.
    ground_y0 = int(height * (1.0 - ground_frac))
    for y in range(ground_y0, height):
        row = [pixels[x, y][:3] for x in range(width)]
        diffs = [color_dist(row[x], row[x - max(1, width // 20)]) for x in range(1, width)]
        if diffs and (sum(1 for d in diffs if d <= threshold + 20) / len(diffs)) > 0.72:
            for x in range(width):
                outside[y][x] = True

    out = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    dest = out.load()
    for y in range(height):
        for x in range(width):
            if not outside[y][x]:
                dest[x, y] = pixels[x, y][:3] + (255,)
    return out


def figure_runs(image, min_width=24, step=3, gap=8, y_max=None):
    """Column runs of visible pixels — one run per creature.

    y_max ignores a shared ground strip. The grass under a lineup is one
    connected band, and counting it makes three creatures into one figure.
    """
    alpha = image.getchannel('A')
    width, height = image.size
    limit = height if y_max is None else min(height, y_max)
    occupied = []
    for x in range(width):
        occupied.append(any(alpha.getpixel((x, y)) > 32 for y in range(0, limit, step)))

    runs = []
    start = None
    empty = 0
    for x, hit in enumerate(occupied):
        if hit:
            if start is None:
                start = x
            empty = 0
        elif start is not None:
            empty += 1
            if empty >= gap:
                end = x - empty + 1
                if end - start >= min_width:
                    runs.append((start, end))
                start = None
                empty = 0
    if start is not None and width - start >= min_width:
        runs.append((start, width))
    return runs


def crop_figure(image, left, right, pad=8):
    strip = image.crop((max(0, left - pad), 0, min(image.width, right + pad), image.height))
    return recrop(strip)


def recrop(image):
    alpha = image.getchannel('A')
    bbox = alpha.point(lambda value: 255 if value >= 24 else 0).getbbox()
    if not bbox:
        raise ValueError('figure has no visible pixels')
    return image.crop(bbox)


def strip_contact_ground(image, max_frac=0.22):
    """Flood ground-coloured pixels up from the baseline, then recrop.

    The shared grass/dirt band is scenery. A tuft left under one crop
    becomes a muddy stamp once convert_reference downsamples to 96².
    The flood stops at creature colour and will not climb past max_frac
    of the crop, so moss on a stone body stays put.
    """
    width, height = image.size
    pixels = image.load()
    y_cut = int(height * (1.0 - max_frac))
    gone = [[False] * width for _ in range(height)]
    stack = []
    for y in range(max(0, height - 8), height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha >= 24 and looks_like_ground((red, green, blue)):
                stack.append((x, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= width or y >= height or y < y_cut or gone[y][x]:
            continue
        red, green, blue, alpha = pixels[x, y]
        if alpha < 24 or not looks_like_ground((red, green, blue)):
            continue
        gone[y][x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    out = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    dest = out.load()
    for y in range(height):
        for x in range(width):
            if not gone[y][x]:
                dest[x, y] = pixels[x, y]
    return recrop(out)


def drop_specks(image, min_pixels=MIN_SPECK):
    """Remove tiny leftover clumps; keep every larger island."""
    width, height = image.size
    pixels = image.load()
    seen = [[False] * width for _ in range(height)]
    keep = [[False] * width for _ in range(height)]
    for y in range(height):
        for x in range(width):
            if seen[y][x] or pixels[x, y][3] < 24:
                continue
            stack = [(x, y)]
            seen[y][x] = True
            blob = []
            while stack:
                cx, cy = stack.pop()
                blob.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < width and 0 <= ny < height and not seen[ny][nx]:
                        if pixels[nx, ny][3] >= 24:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
            if len(blob) >= min_pixels:
                for bx, by in blob:
                    keep[by][bx] = True
    out = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    dest = out.load()
    for y in range(height):
        for x in range(width):
            if keep[y][x]:
                dest[x, y] = pixels[x, y]
    return recrop(out)


def choose_body_limit(image, expected, ground_frac):
    """Walk the cut-off up until the ground strip stops joining figures.

    A fixed fraction fails when one plate's grass is taller than another's.
    The cut-off is only for FINDING columns; each crop still uses full height.
    """
    height = image.height
    guessed = int(height * (1.0 - ground_frac))
    if not expected:
        return guessed
    # Prefer the lowest cut-off that already yields the expected count, so
    # as much of each body as possible still informs the column run.
    for frac in (ground_frac, 0.22, 0.28, 0.34, 0.40, 0.46):
        limit = int(height * (1.0 - frac))
        runs = figure_runs(image, y_max=limit)
        if len(runs) == expected:
            return limit
    return guessed


def split(source, names, out_dir, threshold, ground_frac, force=False):
    image = Image.open(source).convert('RGBA')
    spread = border_spread(image)
    if spread >= SCENIC_SPREAD and not force:
        raise SystemExit(
            f'{source}: border colour spread {spread} looks like scenery '
            f'(sky, forest, a painted plate), not a flat field. '
            f'Re-generate each face with the Ship master prompt in '
            f'tools/CHARACTER_PROMPT.md. Do not commit a forest-matted '
            f'sprite. Pass --force only to inspect the failure.'
        )
    if spread >= SCENIC_SPREAD:
        print(f'warning: {source} looks scenic (spread {spread}); splitting anyway')
    # Fully-opaque plates (the usual generated lineup) need a matte.
    if image.getchannel('A').getextrema() == (255, 255):
        image = matte(image, threshold, ground_frac)
    body_limit = choose_body_limit(image, len(names), ground_frac)
    runs = figure_runs(image, y_max=body_limit)
    if names and len(runs) != len(names):
        raise SystemExit(
            f'{source}: found {len(runs)} figure(s) {runs}, expected {len(names)} '
            f'({", ".join(names)}). Flatten the backdrop or pass --threshold.'
        )
    if not names:
        names = [f'figure{i}' for i in range(len(runs))]
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for name, (left, right) in zip(names, runs):
        figure = drop_specks(strip_contact_ground(crop_figure(image, left, right)))
        dest = out_dir / f'{name}.png'
        figure.save(dest)
        written.append(dest)
        print(f'wrote {dest}: {figure.size[0]}x{figure.size[1]}')
    return written


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('--names', default='', help='comma-separated creature ids, left to right')
    parser.add_argument('--out', default='tools/reference_art')
    parser.add_argument('--threshold', type=int, default=28,
                        help='colour distance from the border treated as backdrop')
    parser.add_argument('--ground', type=float, default=0.16,
                        help='bottom fraction treated as a shared ground strip')
    parser.add_argument('--force', action='store_true',
                        help='split a scenic plate anyway (do not ship the result)')
    args = parser.parse_args(argv)
    names = [part.strip() for part in args.names.split(',') if part.strip()]
    split(args.source, names, args.out, args.threshold, args.ground, force=args.force)
    return 0


if __name__ == '__main__':
    sys.exit(main())
