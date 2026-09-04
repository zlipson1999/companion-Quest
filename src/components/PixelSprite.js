// Animated wrapper around PixelArt that knows the sprite registry. Handles the
// classic handheld creature animations: a breathing idle, a shake + white flash
// when hit, and a faint (fade + drop). Drive the hit animation by incrementing
// `hitCount`.
//
// The idle used to be a three-pixel translate and nothing else, which slides a
// rigid card: the silhouette never changed, so the creature never moved. It
// alternates two DRAWN frames now (`data/idleFrame.js`) — the second is the
// first with a row squeezed out of its torso, so the body compresses, the head
// rides down and the feet stay planted. The translate is still there at one
// pixel, opposed to the squash: the drawn frame carries the breath and the
// motion just keeps it from sitting perfectly still between beats. At the old
// three it swamped the one pixel the drawing was worth.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, PixelRatio } from 'react-native';
import PixelArt from './PixelArt';
import { SPRITES } from '../data/sprites';
import { idleFrame } from '../data/idleFrame';
import { lodGrid } from '../data/spriteLod';
import { paletteFor } from '../data/spritePalette';
import { standinSprite } from '../data/spriteStandins';
import { ITEM_IMAGES } from '../data/itemImages';

// One beat of the idle. Matches the translate's leg so the drawn squash and the
// movement are the same breath.
const IDLE_BEAT_MS = 700;

export default function PixelSprite({
  spriteKey,
  palette,
  size = 96,
  bob = false,
  hitCount = 0,
  // Increment to make the sprite lunge toward its opponent — the attack HAS a
  // body now instead of damage simply appearing on the other side.
  lungeCount = 0,
  lungeDir = { x: 1, y: 0 },
  fainting = false,
  flip = false,
  accessibilityLabel,
  style,
}) {
  const resolvedKey = SPRITES[spriteKey]
    ? spriteKey
    : standinSprite(spriteKey, typeof palette === 'string' ? palette : null, 1);
  const sprite = SPRITES[resolvedKey] || SPRITES[spriteKey];
  const bobY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const faint = useRef(new Animated.Value(0)).current;
  const lunge = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [squashed, setSquashed] = useState(false);
  const firstHit = useRef(true);
  const firstLunge = useRef(true);
  const png = ITEM_IMAGES[spriteKey];

  // ONE timer drives the whole breath. An Animated.loop for the movement and a
  // separate setInterval for the drawn frame is two clocks, and two clocks
  // drift: within a minute the squash lands while the sprite is rising and the
  // motion stops reading as one thing. The interval owns the beat and the
  // translate follows the state it sets.
  useEffect(() => {
    if (!bob) {
      setSquashed(false);
      return undefined;
    }
    const timer = setInterval(() => setSquashed((v) => !v), IDLE_BEAT_MS);
    return () => clearInterval(timer);
  }, [bob]);

  // Tall on the up beat, squashed on the down beat — a creature is at its
  // shortest when it has just settled, not when it is rising. The translate is
  // the smaller half of the motion now; the drawn frame carries the breath, and
  // at the old three pixels the slide swamped the pixel the drawing was worth.
  useEffect(() => {
    if (!bob) {
      Animated.timing(bobY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(bobY, {
      toValue: squashed ? 0 : -2,
      duration: IDLE_BEAT_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [bob, squashed, bobY]);

  useEffect(() => {
    if (firstHit.current) {
      firstHit.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [hitCount, shakeX, flash]);

  useEffect(() => {
    if (firstLunge.current) {
      firstLunge.current = false;
      return;
    }
    // Sharp out, soft back: the strike is fast and the recovery settles.
    Animated.sequence([
      Animated.timing(lunge, {
        toValue: { x: (lungeDir.x || 0) * 20, y: (lungeDir.y || 0) * 20 },
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(lunge, { toValue: { x: 0, y: 0 }, duration: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lungeCount]);

  useEffect(() => {
    if (fainting) {
      Animated.timing(faint, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } else {
      faint.setValue(0);
    }
  }, [fainting, faint]);

  const faintTranslate = faint.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const faintOpacity = faint.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const motionStyle = [
    {
      opacity: faintOpacity,
      transform: [
        { translateX: Animated.add(shakeX, lunge.x) },
        { translateY: Animated.add(lunge.y, Animated.add(bobY, faintTranslate)) },
        { scaleX: flip ? -1 : 1 },
      ],
    },
    style,
  ];
  const a11y = {
    accessible: accessibilityLabel ? true : undefined,
    accessibilityRole: accessibilityLabel ? 'image' : undefined,
    accessibilityLabel,
  };

  // Painted plates (charms, knot, shop food) — full isolated PNG, not the 96-cell trace.
  if (png) {
    return (
      <Animated.View {...a11y} style={[{ width: size, height: size }, ...motionStyle]}>
        <Image
          source={png}
          resizeMode="contain"
          fadeDuration={0}
          style={{ width: size, height: size }}
        />
      </Animated.View>
    );
  }

  if (!sprite) return null;
  // Traced art owns its palette; see data/spritePalette.js for why this is
  // decided in one place rather than at each call site.
  const pal = paletteFor(sprite, palette);
  // The idle's second frame, squashed at FULL resolution — squashRows is
  // measured against the grid it is given, and taking the row before the
  // downsample keeps the breath a whole pixel after it.
  const framed = bob && squashed ? idleFrame(resolvedKey, sprite.grid, size) : sprite.grid;
  // Then the drawing that actually fits. A 96-row creature at 44 points gives
  // each sprite pixel 0.92 of a device pixel, and PixelArt lays one View per
  // run — so the layout has to snap sub-pixel boxes and neighbouring runs merge
  // into each other. That is what turned every companion outside battle into a
  // coloured blob. The cache key carries the squash, or the breathing frame and
  // the still one would share an entry and the idle would stop moving.
  const grid = lodGrid(
    squashed ? `${resolvedKey}~sq` : resolvedKey,
    framed,
    pal,
    size,
    PixelRatio.get()
  );
  const cols = grid[0].length;
  const rows = grid.length;
  // Then snap a sprite pixel to a WHOLE number of device pixels.
  //
  // Choosing the right resolution is only half of it. 48 rows at 44 points is
  // 1.83 device pixels per row, and a row cannot be 1.83 pixels tall — so the
  // layout gives some rows two and some rows one, and the creature comes out
  // in horizontal stripes. Fixing the density without fixing the snapping just
  // trades a blob for a barcode; both halves are needed.
  //
  // The sprite therefore ends up a little larger or smaller than the size
  // asked for — 44 becomes 48 here. That is the right trade at these scales:
  // a few points of layout against every pixel landing where it was drawn.
  const dpr = PixelRatio.get() || 1;
  const px = Math.max(1, Math.round((size / cols) * dpr)) / dpr;
  const w = cols * px;
  const h = rows * px;
  // Must cover the full 90-index alphabet: at 8 entries the flash overlay
  // resolved to transparent for almost every pixel of a modern sprite, which
  // made the hit flash invisible.
  const whitePal = Array(96).fill('#ffffff');

  return (
    <Animated.View {...a11y} style={[{ width: w, height: h }, ...motionStyle]}>
      <PixelArt grid={grid} palette={pal} pixelSize={px} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: flash }}>
        <PixelArt grid={grid} palette={whitePal} pixelSize={px} />
      </Animated.View>
    </Animated.View>
  );
}
