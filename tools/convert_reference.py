#!/usr/bin/env python3
"""Convert a transparent creature reference into traced_<id>.json.

The committed PNG remains the visual source of truth. This produces a compact
96x96, indexed, alpha-aware sprite consumed by make_sprites.py.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

SIZE = 96
PADDING = 3
MAX_COLORS = 24
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'


def convert(source, output):
    image = Image.open(source).convert('RGBA')
    # Some extraction services render their transparency preview as a baked
    # white/light-gray checkerboard. Detect that fully opaque case and key only
    # near-neutral, very light pixels; colored water/fire and enclosed cream
    # details remain intact.
    if image.getchannel('A').getextrema() == (255, 255):
        cleaned = []
        for red, green, blue, _alpha in image.getdata():
            neutral_light = max(red, green, blue) - min(red, green, blue) < 18 and min(red, green, blue) > 200
            cleaned.append((red, green, blue, 0 if neutral_light else 255))
        image.putdata(cleaned)
    alpha = image.getchannel('A')
    bbox = alpha.point(lambda value: 255 if value >= 24 else 0).getbbox()
    if not bbox:
        raise ValueError(f'{source}: no visible pixels')
    image = image.crop(bbox)
    image.thumbnail((SIZE - PADDING * 2, SIZE - PADDING * 2), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - image.width) // 2
    y = SIZE - PADDING - image.height
    canvas.alpha_composite(image, (x, y))

    quantized = canvas.quantize(colors=MAX_COLORS, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    palette_data = quantized.getpalette()
    used = []
    rows = []
    alpha = canvas.getchannel('A')
    for py in range(SIZE):
        row = []
        for px in range(SIZE):
            if alpha.getpixel((px, py)) < 48:
                row.append('.')
                continue
            index = quantized.getpixel((px, py))
            if index not in used:
                used.append(index)
            row.append(index)
        rows.append(row)

    if len(used) > len(ALPHABET):
        raise ValueError(f'{source}: {len(used)} colors exceeds traced alphabet')
    remap = {index: ALPHABET[i] for i, index in enumerate(used)}
    encoded = [''.join('.' if value == '.' else remap[value] for value in row) for row in rows]
    colors = [
        '#%02x%02x%02x' % tuple(palette_data[index * 3:index * 3 + 3])
        for index in used
    ]
    Path(output).write_text(json.dumps({'palette': colors, 'rows': encoded}, indent=2) + '\n', encoding='utf-8')
    print(f'wrote {output}: {SIZE}x{SIZE}, {len(colors)} colors')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('output')
    args = parser.parse_args()
    convert(args.source, args.output)
