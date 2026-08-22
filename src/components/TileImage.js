// One tile, drawn as a window onto the tile atlas.
//
// Tiles used to render through PixelArt, which emits a View per colour run per
// row. That is fine for a creature you draw once, and ruinous for ground: a
// single 16x16 grass tile came to 236 Views and an 11x11 map to roughly 28,000.
// It was the ceiling that made higher resolution impossible — 32px tiles would
// have been four times that again.
//
// Cropping one shared image costs a couple of hundred Views for a whole map no
// matter how detailed the art is, so tile resolution is now a question about
// file size rather than about frame rate.
//
// Characters and creatures stay on PixelArt: only a few are ever on screen, and
// they need runtime palette swaps for outfits, which an atlas cannot do.

import React from 'react';
import { Image, View } from 'react-native';
import { TILE_ATLAS, TILE_CELL, ATLAS_WIDTH, ATLAS_HEIGHT, TILE_FRAMES } from '../data/tileAtlas';

export function hasTile(name) {
  return !!TILE_FRAMES[name];
}

export default function TileImage({ name, size, opacity, layered = false }) {
  const frame = TILE_FRAMES[name];
  if (!frame) return null;
  // The atlas is drawn at whatever scale makes one cell equal to the on-screen
  // tile, then slid so the wanted cell lands in the window.
  const k = size / TILE_CELL;
  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
        opacity,
        ...(layered ? { position: 'absolute', left: 0, top: 0 } : null),
      }}
    >
      <Image
        source={TILE_ATLAS}
        resizeMode="stretch"
        fadeDuration={0}
        style={{
          position: 'absolute',
          width: ATLAS_WIDTH * k,
          height: ATLAS_HEIGHT * k,
          left: -frame[0] * k,
          top: -frame[1] * k,
        }}
      />
    </View>
  );
}
