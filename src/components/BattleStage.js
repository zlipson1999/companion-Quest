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
  grass: { sky: '#4a6ea8', far: '#7fa8d8', disc: palette.grassTall, field: 'grass' },
  trail: { sky: '#5f7fb4', far: '#9fc0e0', disc: palette.sand, field: 'path' },
  dusk: { sky: '#3a2c52', far: '#8a6a9e', disc: '#6b5d7a', field: 'grass' },
  // Indoors. Coach's push-up contest happens on the Hall floor, not on a
  // hillside — a sparring match staged in a meadow reads as a different game.
  hall: { sky: '#232833', far: '#39404d', disc: '#4f8a7e', field: 'gym_floor' },
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
function TileGround({ field }) {
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
        if (field === 'gym_floor') {
          row += '.';
        } else if (field === 'path') {
          row += '#';
        } else {
          // mostly grass, the odd tall-grass clump toward the edges — the
          // middle stays calm so the combatants read cleanly against it
          const h = ((x * 7 + y * 13) >>> 0) % 17;
          row += h === 0 && (x < 2 || x > cols - 3) ? '^' : '.';
        }
      }
      out.push(row);
    }
    return { id: field === 'gym_floor' ? 'gym' : 'stage', cols, rows, grid: out };
  }, [field, cols, rows]);

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
        <TileGround field={t.field} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
