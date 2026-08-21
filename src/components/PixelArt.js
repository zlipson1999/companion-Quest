// Renders an original pixel-art sprite (a grid of palette-index chars) as
// scaled Views. Uses per-row run-length grouping so a 16x16 sprite is a
// handful of Views instead of 256.
//
// `palette` may be an array of colors or a key into theme spritePalettes.
// '.' (or index 0) is transparent.

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { spritePalettes } from '../theme';

function resolvePalette(palette) {
  if (Array.isArray(palette)) return palette;
  return spritePalettes[palette] || spritePalettes.hero;
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
        const color = transparent ? 'transparent' : pal[parseInt(r.ch, 10)] || 'transparent';
        return <View key={k} style={{ width: r.len * px, height: px, backgroundColor: color }} />;
      })}
    </View>
  );
}

export default function PixelArt({ grid, palette, size, pixelSize, style }) {
  const pal = useMemo(() => resolvePalette(palette), [palette]);
  const cols = grid && grid[0] ? grid[0].length : 16;
  const px = pixelSize || Math.max(1, Math.round((size || 64) / cols));
  if (!grid) return null;
  return (
    <View style={[{ width: cols * px }, style]}>
      {grid.map((row, y) => (
        <Row key={y} row={row} pal={pal} px={px} />
      ))}
    </View>
  );
}
