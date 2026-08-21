// Animated wrapper around PixelArt that knows the sprite registry. Handles the
// classic handheld creature animations: a gentle idle bob, a shake + white
// flash when hit, and a faint (fade + drop). Drive the hit animation by
// incrementing `hitCount`.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import PixelArt from './PixelArt';
import { SPRITES } from '../data/sprites';

export default function PixelSprite({
  spriteKey,
  palette,
  size = 96,
  bob = false,
  hitCount = 0,
  fainting = false,
  flip = false,
  style,
}) {
  const sprite = SPRITES[spriteKey];
  const bobY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const faint = useRef(new Animated.Value(0)).current;
  const firstHit = useRef(true);

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
    if (fainting) {
      Animated.timing(faint, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } else {
      faint.setValue(0);
    }
  }, [fainting, faint]);

  if (!sprite) return null;
  const pal = palette || sprite.palette;
  const cols = sprite.grid[0].length;
  const rows = sprite.grid.length;
  const px = Math.max(1, Math.round(size / cols));
  const w = cols * px;
  const h = rows * px;

  const faintTranslate = faint.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const faintOpacity = faint.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const whitePal = Array(8).fill('#ffffff');

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          opacity: faintOpacity,
          transform: [{ translateX: shakeX }, { translateY: Animated.add(bobY, faintTranslate) }, { scaleX: flip ? -1 : 1 }],
        },
        style,
      ]}
    >
      <PixelArt grid={sprite.grid} palette={pal} pixelSize={px} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: flash }}>
        <PixelArt grid={sprite.grid} palette={whitePal} pixelSize={px} />
      </Animated.View>
    </Animated.View>
  );
}
