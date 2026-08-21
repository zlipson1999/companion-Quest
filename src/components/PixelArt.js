// Renders an original pixel-art sprite (a grid of palette-index chars) as
// scaled Views. Uses per-row run-length grouping so a 16x16 sprite is a
// handful of Views instead of 256.
//
// `palette` may be an array of colors or a key into SPRITE_PALETTES, which the
// sprite generator emits alongside the art so nothing is mirrored by hand.
// '.' (or index 0) is transparent. Indices are BASE 36: sprites carry shading
// ramps now and a single digit only addressed ten colours.

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { spritePalettes } from '../theme';
import { SPRITE_PALETTES } from '../data/sprites';

function resolvePalette(palette) {
  if (Array.isArray(palette)) return palette;
  return SPRITE_PALETTES[palette] || spritePalettes[palette] || SPRITE_PALETTES.hero;
}

function Row({ row, pal, px }) {
  const runs = [];
  let i = 0;
  while (i < row.length) {
    const ch = row[i];
    let j = i + 1;
    while (j < row.length && row[j] === ch) j += 1;
    runs.push({ ch, len: j - i });
    i = j;
  }
  return (
    <View style={{ flexDirection: 'row', height: px }}>
      {runs.map((r, k) => {
        const transparent = r.ch === '.' || r.ch === '0';
        const color = transparent ? 'transparent' : pal[parseInt(r.ch, 36)] || 'transparent';
        return <View key={k} style={{ width: r.len * px, height: px, backgroundColor: color }} />;
      })}
    </View>
  );
}

export default function PixelArt({ grid, palette, size, pixelSize, style }) {
  const pal = useMemo(() => resolvePalette(palette), [palette]);
  const cols = grid && grid[0] ? grid[0].length : 16;
  // Fractional when derived from a target size. Rounding to whole pixels was
  // fine at 16x16 (a 30px request landed on 2px cells) but sprites are 48x48
  // now, so rounding snapped a 30px request up to 48 and blew out every layout
  // that asked for a small sprite. Callers wanting crisp integer cells pass
  // pixelSize directly — the tile map does.
  const px = pixelSize || (size ? size / cols : 4);
  if (!grid) return null;
  return (
    <View style={[{ width: cols * px }, style]}>
      {grid.map((row, y) => (
        <Row key={y} row={row} pal={pal} px={px} />
      ))}
    </View>
  );
}
