#!/usr/bin/env python3
"""Convert a committed character card into traced_<name>.json.

The creature tracer (convert_reference.py) targets a 96x96 box with 24 colours.
That is right for a compact animal shape and wrong for a person: a standing
figure wastes most of a square canvas on empty air, and 24 colours cannot carry
a face, hair and layered clothing at once. This tool takes an explicit
width x height box and a wider palette, and can crop one figure out of a
multi-character lineup card.

The committed PNG stays the visual source of truth; this only re-indexes it.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

# Positions map to palette indices 1..N (0 is reserved for transparent), so the
# first 26 entries stay byte-identical to what convert_reference.py emits and
# every existing traced_*.json keeps decoding the same way.
TRACE_ALPHABET = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    'abcdefghijklmnopqrstuvwxyz'
    '0123456789'
)
ALPHA_CUTOFF = 48


def figure_bounds(image, min_width=40, step=4):
    """Column runs of visible pixels — one run per figure on a lineup card."""
    alpha = image.getchannel('A')
    width, height = image.size
    runs = []
    start = None
    for x in range(width):
        occupied = any(alpha.getpixel((x, y)) > 32 for y in range(0, height, step))
        if occupied and start is None:
            start = x
        elif not occupied and start is not None:
            if x - start >= min_width:
                runs.append((start, x))
            start = None
    if start is not None and width - start >= min_width:
        runs.append((start, width))
    return runs


def fill_interior(alpha, width, height):
    """Mask of pixels to draw, with holes inside the silhouette closed.

    Downsampling a soft-edged painting leaves scattered part-transparent pixels,
    and a flat cutoff punches those into holes in the middle of a torso. Only
    transparency that connects to the border is real background; everything the
    flood cannot reach is interior and gets drawn.
    """
    opaque = [[alpha.getpixel((x, y)) >= ALPHA_CUTOFF for x in range(width)] for y in range(height)]
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
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        if outside[y][x] or opaque[y][x]:
            continue
        outside[y][x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return [[opaque[y][x] or not outside[y][x] for x in range(width)] for y in range(height)]


def repair_holes(canvas, solid, width, height):
    """Give every drawn-but-transparent pixel a colour from its neighbours."""
    pixels = canvas.load()
    for _ in range(4):
        pending = []
        for y in range(height):
            for x in range(width):
                if not solid[y][x] or pixels[x, y][3] >= ALPHA_CUTOFF:
                    continue
                samples = [
                    pixels[nx, ny]
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny][3] >= ALPHA_CUTOFF
                ]
                if samples:
                    pending.append((x, y, tuple(sum(s[i] for s in samples) // len(samples) for i in range(3))))
        if not pending:
            break
        for x, y, rgb in pending:
            pixels[x, y] = rgb + (255,)
    return canvas


def convert(source, output, box, colors, figure=None, padding=2):
    image = Image.open(source).convert('RGBA')

    if figure is not None:
        runs = figure_bounds(image)
        if figure >= len(runs):
            raise ValueError(f'{source}: figure {figure} of {len(runs)} found')
        left, right = runs[figure]
        image = image.crop((left, 0, right, image.height))

    alpha = image.getchannel('A')
    bbox = alpha.point(lambda value: 255 if value >= 24 else 0).getbbox()
    if not bbox:
        raise ValueError(f'{source}: no visible pixels')
    image = image.crop(bbox)

    target_w, target_h = box
    # Contain inside the box, bottom-aligned: a character stands on the floor of
    # its own cell, so the feet land at a predictable row for every sprite.
    image.thumbnail((target_w - padding * 2, target_h - padding * 2), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((target_w - image.width) // 2, target_h - padding - image.height))

    solid = fill_interior(canvas.getchannel('A'), target_w, target_h)
    # Repair before quantising, not after: a hole pixel still carries the
    # transparent canvas' black RGB, so filling it post-quantisation would swap
    # a hole for a black speck. Borrow the mean of its drawn neighbours instead.
    canvas = repair_holes(canvas, solid, target_w, target_h)

    quantized = canvas.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    palette_data = quantized.getpalette()

    used = []
    rows = []
    for y in range(target_h):
        row = []
        for x in range(target_w):
            if not solid[y][x]:
                row.append('.')
                continue
            index = quantized.getpixel((x, y))
            if index not in used:
                used.append(index)
            row.append(index)
        rows.append(row)

    if len(used) > len(TRACE_ALPHABET):
        raise ValueError(f'{source}: {len(used)} colours exceeds the traced alphabet')

    remap = {index: TRACE_ALPHABET[i] for i, index in enumerate(used)}
    encoded = [''.join('.' if value == '.' else remap[value] for value in row) for row in rows]
    swatches = ['#%02x%02x%02x' % tuple(palette_data[i * 3:i * 3 + 3]) for i in used]

    Path(output).write_text(json.dumps({'palette': swatches, 'rows': encoded}, indent=2) + '\n', encoding='utf-8')
    print(f'wrote {output}: {target_w}x{target_h}, {len(swatches)} colours')


def parse_box(value):
    width, _, height = value.partition('x')
    return int(width), int(height)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('output')
    parser.add_argument('--box', type=parse_box, default=(48, 64), help='WxH target, default 48x64')
    parser.add_argument('--colors', type=int, default=48)
    parser.add_argument('--figure', type=int, default=None, help='index of one figure on a lineup card')
    args = parser.parse_args()
    convert(args.source, args.output, args.box, args.colors, args.figure)
