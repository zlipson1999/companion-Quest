#!/usr/bin/env python3
"""Convert the authored 4x4 world atlas into traced runtime tile sprites.

Two products per material. A single 16x16 tile is what an autotile mask
composites against. A **field** is the same cell resolved at FIELD px and cut
into FIELD/16 squared tiles by make_sprites, so the ground reads as one
continuous texture across a block of tiles instead of the same 16 pixels
stamped over and over — which is the thing that makes a floor look like a grid
of chunks even when every tile is beautiful.
"""
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'assets' / 'textures' / 'masters' / 'world-material-atlas-v1.png'
SIZE = 32
COLORS = 26
FIELD = 128
FIELD_COLORS = 62
ALPHABET = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    'abcdefghijklmnopqrstuvwxyz'
    '0123456789'
)

# Materials that cover large areas and therefore show their repeat.
FIELDS = {
    'field_grass': (0, 0),
    'field_path': (0, 1),
    'field_water': (2, 1),
    'field_water_b': (3, 1),
    'field_tree': (0, 2),
    'field_wall': (2, 2),
    'field_roof_rest': (0, 3),
    'field_roof_gym': (1, 3),
}

CELLS = {
    'tile_grass': (0, 0), 'tile_grass_b': (1, 0), 'tile_flowers': (2, 0), 'tile_tallgrass': (3, 0),
    'tile_path': (0, 1), 'tile_path_b': (1, 1), 'tile_water': (2, 1), 'tile_water_b': (3, 1),
    'tile_tree': (0, 2), 'tile_wall': (2, 2),
    'tile_roof_rest': (0, 3), 'tile_roof_gym': (1, 3), 'tile_door': (2, 3),
}

def make_seamless(image):
    """Blend an image with its own half-roll so it tiles against itself.

    The atlas cells are inset by a few pixels to keep the separator lines out of
    the game, and that inset breaks whatever tiling the painted swatch had. Over
    one 16px tile nobody notices; across a 64px field it draws a visible seam
    every four tiles.

    Rolling by half the image puts the original edges in the middle, where the
    content is continuous. Cross-fading the two with a weight that falls to zero
    at the border means every border pixel comes from the rolled copy — that is,
    from the middle of the original — so opposite edges meet on pixels that were
    neighbours to begin with.
    """
    width, height = image.size
    rolled = Image.new(image.mode, (width, height))
    half_w, half_h = width // 2, height // 2
    rolled.paste(image.crop((half_w, half_h, width, height)), (0, 0))
    rolled.paste(image.crop((0, half_h, half_w, height)), (width - half_w, 0))
    rolled.paste(image.crop((half_w, 0, width, half_h)), (0, height - half_h))
    rolled.paste(image.crop((0, 0, half_w, half_h)), (width - half_w, height - half_h))

    mask = Image.new('L', (width, height))
    pixels = mask.load()
    for y in range(height):
        fy = min(y, height - 1 - y) / (height / 2.0)
        for x in range(width):
            fx = min(x, width - 1 - x) / (width / 2.0)
            pixels[x, y] = int(255 * min(1.0, fx) * min(1.0, fy))
    return Image.composite(image.convert('RGB'), rolled.convert('RGB'), mask)


def encode(image, size=SIZE, colors=COLORS):
    q = image.convert('RGB').resize((size, size), Image.Resampling.LANCZOS).quantize(
        colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    raw_palette = q.getpalette()
    used = []
    pixels = list(q.getdata())
    for value in pixels:
        if value not in used:
            used.append(value)
    remap = {value: ALPHABET[i] for i, value in enumerate(used)}
    if len(used) > len(ALPHABET):
        raise ValueError('%d colours exceeds the alphabet' % len(used))
    rows = [''.join(remap[pixels[y * size + x]] for x in range(size)) for y in range(size)]
    palette = ['#%02x%02x%02x' % tuple(raw_palette[v * 3:v * 3 + 3]) for v in used]
    return {'palette': palette, 'rows': rows}

def main():
    atlas = Image.open(SOURCE)
    cell_w, cell_h = atlas.width / 4, atlas.height / 4
    for name, (cx, cy) in CELLS.items():
        # Inset the thin atlas separator so it never appears in-game.
        box = (round(cx * cell_w + 3), round(cy * cell_h + 3), round((cx + 1) * cell_w - 3), round((cy + 1) * cell_h - 3))
        output = HERE / f'traced_{name}.json'
        output.write_text(json.dumps(encode(atlas.crop(box)), indent=2) + '\n', encoding='utf-8')
        print(f'wrote {output.name}')

    for name, (cx, cy) in FIELDS.items():
        box = (round(cx * cell_w + 3), round(cy * cell_h + 3), round((cx + 1) * cell_w - 3), round((cy + 1) * cell_h - 3))
        cell = atlas.crop(box).convert('RGB').resize((FIELD * 4, FIELD * 4), Image.Resampling.LANCZOS)
        blob = encode(make_seamless(cell), FIELD, FIELD_COLORS)
        output = HERE / f'traced_{name}.json'
        output.write_text(json.dumps(blob, indent=2) + '\n', encoding='utf-8')
        print(f'wrote {output.name}: {FIELD}x{FIELD}, {len(blob["palette"])} colours')

if __name__ == '__main__':
    main()
