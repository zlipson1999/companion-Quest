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
import { Animated, Easing, Image } from 'react-native';
import PixelArt from './PixelArt';
import { SPRITES } from '../data/sprites';
import { idleFrame } from '../data/idleFrame';
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
  const pal = palette || sprite.palette;
  // The idle's second frame. Same dimensions, so everything below is unchanged.
  const grid = bob && squashed ? idleFrame(resolvedKey, sprite.grid, size) : sprite.grid;
  const cols = grid[0].length;
  const rows = grid.length;
  // Fractional cells so `size` is honoured exactly — see PixelArt.
  const px = size / cols;
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
