// Animated wrapper around PixelArt that knows the sprite registry. Handles the
// classic handheld creature animations: a gentle idle bob, a shake + white
// flash when hit, and a faint (fade + drop). Drive the hit animation by
// incrementing `hitCount`.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image } from 'react-native';
import PixelArt from './PixelArt';
import { SPRITES } from '../data/sprites';
import { standinSprite } from '../data/spriteStandins';
import { ITEM_IMAGES } from '../data/itemImages';

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
  const firstHit = useRef(true);
  const firstLunge = useRef(true);
  const png = ITEM_IMAGES[spriteKey];

  useEffect(() => {
    if (!bob) {
      bobY.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, bobY]);

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

  // Painted plates (charms, knot) — full isolated PNG, not the 96-cell trace.
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
  const cols = sprite.grid[0].length;
  const rows = sprite.grid.length;
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
      <PixelArt grid={sprite.grid} palette={pal} pixelSize={px} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: flash }}>
        <PixelArt grid={sprite.grid} palette={whitePal} pixelSize={px} />
      </Animated.View>
    </Animated.View>
  );
}
