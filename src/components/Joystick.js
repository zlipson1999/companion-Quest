// Thumb stick for overworld movement.
//
// The D-pad asks for one deliberate tap per square, which is fine for nudging
// into a doorway and tiring for crossing a map. A stick you hold and lean is
// the natural way to cross a room, so it is offered alongside rather than
// instead: the pad is still the precise option, and Options picks the default.
//
// Movement is still grid-stepped underneath — the stick reports a direction and
// repeats it on a timer while held, rather than pretending to be analogue.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { palette } from '../theme';
import { playSfx } from '../audio';

const BASE = 118;
const KNOB = 50;
const RADIUS = (BASE - KNOB) / 2;
// Far enough that resting a thumb does not walk you into a wall.
const DEAD_ZONE = 12;
// First step is immediate; the repeat is slower so a long hold does not sprint.
const REPEAT_MS = 165;

function directionFor(dx, dy) {
  if (Math.hypot(dx, dy) < DEAD_ZONE) return null;
  // Whichever axis dominates. Diagonals resolve to one of the four rather than
  // stepping twice, which would cut corners through walls.
  return Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');
}

export default function Joystick({ onMove, style }) {
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dirRef = useRef(null);
  const timer = useRef(null);
  const moveRef = useRef(onMove);
  const [active, setActive] = useState(false);

  useEffect(() => {
    moveRef.current = onMove;
  }, [onMove]);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    dirRef.current = null;
    setActive(false);
    Animated.spring(knob, { toValue: { x: 0, y: 0 }, useNativeDriver: true, speed: 24, bounciness: 6 }).start();
  }, [knob]);

  // A held direction repeats on one interval that reads dirRef, so leaning from
  // one direction into another keeps walking instead of restarting the timer.
  const start = useCallback(() => {
    if (timer.current) return;
    timer.current = setInterval(() => {
      if (dirRef.current) moveRef.current(dirRef.current);
    }, REPEAT_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setActive(true),
      onPanResponderMove: (_e, g) => {
        const clamped = Math.min(1, Math.hypot(g.dx, g.dy) / RADIUS || 0);
        const angle = Math.atan2(g.dy, g.dx);
        knob.setValue({ x: Math.cos(angle) * RADIUS * clamped, y: Math.sin(angle) * RADIUS * clamped });

        const next = directionFor(g.dx, g.dy);
        if (next && next !== dirRef.current) {
          dirRef.current = next;
          playSfx('cursor');
          moveRef.current(next);      // the first step lands immediately
          start();
        } else if (!next) {
          dirRef.current = null;
        }
      },
      onPanResponderRelease: stop,
      onPanResponderTerminate: stop,
    })
  ).current;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Movement stick. Hold and lean to walk."
      {...responder.panHandlers}
      style={[
        {
          width: BASE,
          height: BASE,
          borderRadius: BASE / 2,
          backgroundColor: palette.windowFillAlt || palette.bgAlt,
          borderWidth: 3,
          borderColor: active ? palette.accent : palette.ink,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: active ? palette.primaryDark : palette.primary,
          borderWidth: 3,
          borderColor: palette.ink,
          transform: [{ translateX: knob.x }, { translateY: knob.y }],
        }}
      />
    </View>
  );
}
