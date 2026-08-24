// The A/B action buttons, to the D-pad's right. The overworld's control surface
// is now a handheld's: pad on the left, two round buttons on the right.
//
// A is "confirm / interact" — when you're facing something you can use it lights
// up and does it (the same step-into-the-tile the map has always used), and its
// verb shows above the cluster so nobody stands beside a person wondering what
// to press. B is "back / cancel"; in the open world there is nothing to cancel,
// so it rests quiet and wakes wherever a back exists.
//
// Neither is a cursor. Menus and dialogue are still touched directly — the menu
// button is a finger tap, and a conversation advances by tapping the screen.

import React from 'react';
import { Pressable, View } from 'react-native';
import PixelText from './PixelText';
import { palette, tokens } from '../theme';
import { playSfx } from '../audio';

function Btn({ label, onPress, tone }) {
  const enabled = !!onPress;
  // B used to wear the panel's own background and disappeared into the band.
  // Both buttons get a face that exists against bgAlt: A is the gold every
  // "do the thing" control wears, B is a raised slate with light text.
  const rest = tone === 'a' ? palette.secondary : tokens.surfaceRaised;
  const down = tone === 'a' ? '#c79a2e' : tokens.surface;
  const text = tone === 'a' ? palette.ink : tokens.textOnDark;
  return (
    <Pressable
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={tone === 'a' ? 'A — confirm' : 'B — back'}
      accessibilityState={{ disabled: !enabled }}
      onPress={() => {
        playSfx(tone === 'a' ? 'confirm' : 'cancel');
        onPress && onPress();
      }}
      style={({ pressed }) => ({
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: pressed ? down : rest,
        opacity: enabled ? 1 : 0.55,
        borderWidth: 3,
        borderColor: tokens.line,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <PixelText size="small" color={text}>{label}</PixelText>
    </Pressable>
  );
}

export default function FaceButtons({ onA, onB }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {/* A sits high-right, B low-left — the real hardware's diagonal. A
          lighting up IS the signal that something is in reach; no label. */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ marginTop: 22, marginRight: 8 }}>
          <Btn label="B" tone="b" onPress={onB} />
        </View>
        <View style={{ marginBottom: 22 }}>
          <Btn label="A" tone="a" onPress={onA} />
        </View>
      </View>
    </View>
  );
}
