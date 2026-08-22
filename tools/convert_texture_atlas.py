#!/usr/bin/env python3
"""Convert the authored 4x4 world atlas into traced runtime tile sprites."""
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'assets' / 'textures' / 'masters' / 'world-material-atlas-v1.png'
SIZE = 16
COLORS = 18
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

CELLS = {
    'tile_grass': (0, 0), 'tile_grass_b': (1, 0), 'tile_flowers': (2, 0), 'tile_tallgrass': (3, 0),
    'tile_path': (0, 1), 'tile_path_b': (1, 1), 'tile_water': (2, 1), 'tile_water_b': (3, 1),
    'tile_tree': (0, 2), 'tile_wall': (2, 2),
    'tile_roof_rest': (0, 3), 'tile_roof_gym': (1, 3), 'tile_door': (2, 3), 'tile_gate': (3, 3),
}

def encode(image):
    q = image.convert('RGB').resize((SIZE, SIZE), Image.Resampling.LANCZOS).quantize(
        colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    raw_palette = q.getpalette()
    used = []
    pixels = list(q.getdata())
    for value in pixels:
        if value not in used:
            used.append(value)
    remap = {value: ALPHABET[i] for i, value in enumerate(used)}
    rows = [''.join(remap[pixels[y * SIZE + x]] for x in range(SIZE)) for y in range(SIZE)]
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

if __name__ == '__main__':
    main()
