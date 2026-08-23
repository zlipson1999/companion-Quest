// The battle backdrop: sky, a haze line at the horizon, and REAL GROUND — the
// same 16x16 tiles the overworld walks on, drawn big. The zoomed-in tiles are
// what ties the fight to the world: you were just standing on this grass.
//
// The first version banded the sky and ground into flat colour stripes. Bands
// read as a gradient tool, not a place; the tiles already existed and already
// read as terrain, so the ground uses them instead of reinventing anything.

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { palette, screen, shade } from '../theme';
import { Tile } from './TileMap';

// Half-widths down the disc: widest just past the middle, so it reads as a
// shallow ellipse lit from above rather than a flat stripe.
const DISC = [0.52, 0.78, 0.93, 1.0, 1.0, 0.96, 0.84, 0.62];

const TONES = {
  grass: { sky: '#4a6ea8', far: '#7fa8d8', disc: palette.grassTall, mapId: 'route_maple', codes: 'grass' },
  maple: { sky: '#4a6ea8', far: '#7fa8d8', disc: palette.grassTall, mapId: 'route_maple', codes: 'grass' },
  trail: { sky: '#5f7fb4', far: '#9fc0e0', disc: palette.sand, mapId: 'route_gale', codes: 'path' },
  dusk: { sky: '#3a2c52', far: '#8a6a9e', disc: '#6b5d7a', mapId: 'route_maple', codes: 'grass' },
  // Indoors. Coach's push-up contest happens on the gym floor, not on a
  // hillside — a sparring match staged in a meadow reads as a different game.
  hall: { sky: '#232833', far: '#39404d', disc: '#4f8a7e', mapId: 'gym', codes: 'floor' },
  cairn: { sky: '#5c5a52', far: '#b0a890', disc: '#8a7a58', mapId: 'route_cairn', codes: 'earth' },
  gale: { sky: '#6aa8dc', far: '#d0e8f8', disc: palette.sand, mapId: 'route_gale', codes: 'open' },
  canopy: { sky: '#1c2a1a', far: '#3a5a32', disc: '#2e4a28', mapId: 'route_canopy', codes: 'shade' },
  rill: { sky: '#3a6a88', far: '#8ec8d8', disc: '#4a8aa0', mapId: 'route_rill', codes: 'open' },
  ember: { sky: '#6a2a14', far: '#d87838', disc: '#8a4a20', mapId: 'route_ember', codes: 'earth' },
};

// Battle tiles are drawn at 3x the overworld's usual scale — "zoomed in".
const TILE_SIZE = 52;

export function Platform({ width = 96, tone = 'grass' }) {
  const t = TONES[tone] || TONES.grass;
  const px = 3;
  const last = DISC.length - 1;
  return (
    <View style={{ alignItems: 'center' }}>
      {DISC.map((w, i) => {
        // top rows catch the light, the bottom rows are the shaded underside
        const amt = i === 0 ? 0.34 : i === 1 ? 0.18 : i >= last - 1 ? -0.34 : i >= last - 2 ? -0.16 : 0;
        return (
          <View
            key={i}
            style={{
              width: Math.round(width * w),
              height: px,
              backgroundColor: shade(t.disc, amt),
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: shade(t.disc, -0.55),
            }}
          />
        );
      })}
    </View>
  );
}

// The ground: rows of real tiles, scattered exactly the way the overworld
// scatters them (same coordinate hash, via Tile), clipped to the stage.
function TileGround({ mapId, codes }) {
  const cols = Math.ceil(screen.width / TILE_SIZE) + 1;
  const rows = Math.ceil((screen.height * 0.5) / TILE_SIZE) + 1;
  // Tile resolves its layers from its neighbours, so the stage floor has to be
  // a map rather than loose codes. Passing rows one at a time meant every tone
  // rendered as plain grass whatever its codes said.
  const sceneMap = useMemo(() => {
    const out = [];
    for (let y = 0; y < rows; y += 1) {
      let row = '';
      for (let x = 0; x < cols; x += 1) {
        const h = ((x * 7 + y * 13) >>> 0) % 17;
        const edge = x < 2 || x > cols - 3;
        if (codes === 'floor') {
          row += '.';
        } else if (codes === 'path') {
          row += '#';
        } else if (codes === 'earth') {
          row += h === 0 ? '#' : h < 3 ? '*' : '.';
        } else if (codes === 'open') {
          row += h === 0 && !edge ? '#' : h === 1 ? ',' : '.';
        } else if (codes === 'shade') {
          row += edge && h < 8 ? 'T' : h === 0 ? '^' : '.';
        } else {
          row += h === 0 && edge ? '^' : '.';
        }
      }
      out.push(row);
    }
    return { id: mapId || 'stage', cols, rows, grid: out };
  }, [codes, mapId, cols, rows]);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
      {sceneMap.grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, x) => (
            <Tile key={x} code={code} s={TILE_SIZE} frame={0} x={x} y={y} map={sceneMap} />
          ))}
        </View>
      ))}
    </View>
  );
}

// A full-bleed backdrop. `horizon` is where the ground starts, 0..1 from top.
export default function BattleStage({ tone = 'grass', horizon = 0.52, children, style }) {
  const t = TONES[tone] || TONES.grass;
  const skyH = horizon * 100;
  return (
    <View style={[{ flex: 1, backgroundColor: t.sky }, style]}>
      {/* haze over distant ground — one line, not a stack of stripes */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: `${skyH}%`, height: 4, backgroundColor: t.far }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: `${skyH}%`, bottom: 0 }}>
        <TileGround mapId={t.mapId} codes={t.codes} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
