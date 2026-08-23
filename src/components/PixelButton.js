// A chunky tactile button with a hard drop-shadow edge that "presses in" on
// touch, plus a confirm/cancel blip.

import React from 'react';
import { Pressable } from 'react-native';
import PixelText from './PixelText';
import { palette, scale } from '../theme';
import { playSfx } from '../audio';

const TONES = {
  primary: { fill: palette.primary, edge: palette.primaryDark, text: palette.white },
  gold: { fill: palette.secondary, edge: '#c79a2e', text: palette.ink },
  danger: { fill: palette.danger, edge: palette.accentDark, text: palette.white },
  plain: { fill: palette.windowFill, edge: palette.windowBorderLight, text: palette.windowText },
  dark: { fill: palette.inkSoft, edge: palette.ink, text: palette.white },
};

export default function PixelButton({ label, onPress, tone = 'primary', disabled = false, sound = 'confirm', size = 'body', style, children }) {
  const t = TONES[tone] || TONES.primary;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        if (sound) playSfx(sound);
        onPress && onPress();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: t.fill,
          borderColor: palette.ink,
          borderWidth: 3,
          minHeight: scale.touchMin,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: pressed ? 3 : 6,
          marginBottom: pressed ? 3 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {children || (
        <PixelText size={size} color={t.text}>
          {label}
        </PixelText>
      )}
    </Pressable>
  );
}
