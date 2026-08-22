// Trail Action — the one way an action is offered.
//
// Buttons across the app had press states only where someone remembered to add
// one, and selection was signalled by colour alone. This one has real press
// depth (the face drops onto its own shadow), a disabled state that reads
// without colour vision, and selection marked by an outline and a leading rule
// as well as a fill.

import React, { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import PixelText from './PixelText';
import { tokens, scale, motion } from '../theme';

const TONES = {
  primary: { fill: tokens.growthDeep, text: tokens.textOnDark, edge: tokens.growth },
  accent: { fill: tokens.resolveDeep, text: tokens.textOnDark, edge: tokens.resolve },
  quiet: { fill: tokens.surfaceRaised, text: tokens.textOnDark, edge: tokens.line },
  paper: { fill: tokens.sheet, text: tokens.textOnPaper, edge: tokens.sheetEdge },
};

export default function TrailAction({
  label,
  sublabel,
  tone = 'quiet',
  selected = false,
  disabled = false,
  onPress,
  style,
}) {
  const depth = useRef(new Animated.Value(0)).current;
  const t = TONES[tone] || TONES.quiet;

  const press = (to) =>
    Animated.timing(depth, {
      toValue: to,
      duration: motion.feedback,
      useNativeDriver: true,
    }).start();

  const fill = disabled ? tokens.surfaceRaised : t.fill;
  const text = disabled ? tokens.disabledInk : t.text;
  const edge = disabled ? tokens.disabledInk : selected ? tokens.accent : t.edge;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPressIn={() => press(1)}
      onPressOut={() => press(0)}
      onPress={onPress}
      style={[{ minHeight: scale.touchMin, paddingBottom: scale.shadowOffset, paddingRight: scale.shadowOffset }, style]}
    >
      <View
        style={{
          position: 'absolute',
          left: scale.shadowOffset,
          top: scale.shadowOffset,
          right: 0,
          bottom: 0,
          backgroundColor: tokens.lineStrong,
          borderRadius: scale.radius.small,
        }}
      />
      <Animated.View
        style={{
          transform: [
            { translateX: depth.interpolate({ inputRange: [0, 1], outputRange: [0, scale.shadowOffset] }) },
            { translateY: depth.interpolate({ inputRange: [0, 1], outputRange: [0, scale.shadowOffset] }) },
          ],
          backgroundColor: fill,
          borderColor: edge,
          // Selection is a heavier outline as well as a colour, so it survives
          // being read without colour vision.
          borderWidth: selected ? 3 : 2,
          borderRadius: scale.radius.small,
          minHeight: scale.touchMin,
          paddingHorizontal: scale.gap.md,
          paddingVertical: scale.gap.sm,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {selected ? (
          <View
            style={{
              width: scale.unit,
              height: scale.gap.lg,
              backgroundColor: tokens.accent,
              marginRight: scale.gap.sm,
            }}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <PixelText size="tiny" color={text}>{label}</PixelText>
          {sublabel ? (
            <PixelText size="tiny" color={disabled ? tokens.disabledInk : tokens.textOnDarkDim} style={{ marginTop: 3 }}>
              {sublabel}
            </PixelText>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}
