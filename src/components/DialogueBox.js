// Classic JRPG dialogue: a bordered window with a speaker name tab, text that
// types out character-by-character with a blip, a blinking advance arrow, and
// tap-to-advance (tap once to finish typing instantly, again to continue).
//
// Pass a STABLE `lines` array ([{ speaker, text }]). onComplete fires after the
// last line is advanced.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import FieldCard from './FieldCard';
import PixelText from './PixelText';
import Triangle from './Triangle';
import { tokens, space } from '../theme';
import { playSfx } from '../audio';

export default function DialogueBox({ lines, onComplete, speed = 30, style }) {
  const [li, setLi] = useState(0);
  const [shown, setShown] = useState(0);
  const intervalRef = useRef(null);
  const arrow = useRef(new Animated.Value(0)).current;

  const safeLines = lines && lines.length ? lines : [{ speaker: '', text: '' }];
  const line = safeLines[Math.min(li, safeLines.length - 1)];
  const full = line.text || '';
  const typing = shown < full.length;

  useEffect(() => {
    setLi(0);
    setShown(0);
  }, [lines]);

  useEffect(() => {
    setShown(0);
    const text = safeLines[Math.min(li, safeLines.length - 1)].text || '';
    let i = 0;
    intervalRef.current = setInterval(() => {
      i += 1;
      setShown(i);
      const ch = text[i - 1];
      if (ch && ch !== ' ' && ch !== '\n' && i % 2 === 0) playSfx('blip');
      if (i >= text.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, Math.max(16, Math.round(1000 / speed)));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [li, lines]);

  useEffect(() => {
    if (typing) {
      arrow.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrow, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(arrow, { toValue: 0, duration: 450, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [typing, arrow]);

  const handlePress = () => {
    if (typing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setShown(full.length);
      playSfx('cursor');
      return;
    }
    if (li < safeLines.length - 1) {
      playSfx('confirm');
      setLi(li + 1);
    } else {
      playSfx('confirm');
      onComplete && onComplete();
    }
  };

  const speaker = line.speaker && line.speaker !== 'Narration' ? line.speaker : null;

  return (
    <Pressable onPress={handlePress} style={style}>
      {/* One panel language.
          This used to be a `Window`: cream fill, purple frame, bevelled
          highlights — chrome that appeared nowhere else, so the game showed
          three different ideas of "a panel" depending on which screen you were
          standing on. It is a FieldCard on its PAPER surface now, which is the
          same card the lane and the objective ribbon use, in the same token
          system, with the same offset shadow and border.
          Paper is kept on purpose: dialogue reading as a page is the point, and
          the token system already has the stock for it. What goes is the
          one-off frame, not the character. */}
      <FieldCard tone="paper" accent={tokens.accentDeep} title={speaker || undefined}>
        <View style={{ minHeight: 88 }}>
          <PixelText size="body" color={tokens.textOnPaper} style={{ lineHeight: 22 }}>
            {full.slice(0, shown)}
          </PixelText>
        </View>
        <Animated.View
          style={{
            position: 'absolute',
            right: 4,
            bottom: 0,
            opacity: arrow,
            // it bobs as well as blinks — a static blinking arrow reads as a
            // cursor, a bobbing one reads as "there is more, tap me"
            transform: [{ translateY: arrow.interpolate({ inputRange: [0, 1], outputRange: [2, -2] }) }],
          }}
        >
          <Triangle direction="down" size={6} color={tokens.textOnPaperDim} />
        </Animated.View>
      </FieldCard>
    </Pressable>
  );
}
