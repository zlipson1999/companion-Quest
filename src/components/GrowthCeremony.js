// Growth ceremony — a companion's new form, held long enough to see.
//
// Battle used a 120ms white strobe. That is a flash, not a ceremony.
// This one uses the shared `motion.ceremony` token (620ms) once, then
// settles. Reduced motion skips the fade and names both forms in text.

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import PixelSprite from './PixelSprite';
import PixelText from './PixelText';
import { motion, tokens, scale } from '../theme';

export default function GrowthCeremony({ fromCreature, toCreature, checks, onDone }) {
  const fade = useRef(new Animated.Value(1)).current;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [reduce, setReduce] = useState(false);
  const [shown, setShown] = useState('from');

  useEffect(() => {
    let alive = true;
    if (AccessibilityInfo.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled().then((v) => {
        if (alive) setReduce(!!v);
      });
    }
    const sub =
      AccessibilityInfo.addEventListener &&
      AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => {
      alive = false;
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!fromCreature || !toCreature) return undefined;
    if (reduce) {
      setShown('to');
      const t = setTimeout(() => doneRef.current && doneRef.current(), 80);
      return () => clearTimeout(t);
    }
    fade.setValue(1);
    setShown('from');
    const hold = motion.ceremony;
    const anim = Animated.sequence([
      Animated.timing(fade, { toValue: 0.12, duration: hold, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: hold, useNativeDriver: true }),
    ]);
    const swap = setTimeout(() => setShown('to'), hold);
    anim.start(({ finished }) => {
      if (finished && doneRef.current) doneRef.current();
    });
    return () => {
      clearTimeout(swap);
      anim.stop();
    };
  }, [reduce, fromCreature, toCreature, fade]);

  if (!fromCreature || !toCreature) return null;
  const creature = shown === 'to' ? toCreature : fromCreature;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 140 }} accessibilityRole="summary">
      {checks && checks.length ? (
        <View style={{ marginBottom: scale.gap.sm, alignItems: 'center' }}>
          {checks.map((row) => (
            <PixelText key={row.key} size="tiny" color={tokens.textOnDark} style={{ marginTop: 2 }}>
              {row.label} {row.ok ? '✓' : `${row.have} / ${row.need}`}
            </PixelText>
          ))}
        </View>
      ) : null}
      <Animated.View style={{ opacity: fade }}>
        <PixelSprite spriteKey={creature.sprite} palette={creature.palette} size={96} />
      </Animated.View>
      <PixelText size="tiny" color={tokens.textOnDark} style={{ marginTop: scale.gap.sm }} align="center">
        {reduce
          ? `${fromCreature.name} becomes ${toCreature.name}.`
          : shown === 'to'
            ? toCreature.name
            : fromCreature.name}
      </PixelText>
    </View>
  );
}
