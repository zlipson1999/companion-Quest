// Every piece of text in the game flows through here so it always uses the
// pixel font, with an optional hard drop-shadow for that crisp retro look.

import React from 'react';
import { Text } from 'react-native';
import { fonts, palette } from '../theme';

export default function PixelText({
  children,
  size = 'body',
  color = palette.windowText,
  shadow = false,
  shadowColor = '#00000066',
  align = 'left',
  style,
  numberOfLines,
  ...rest
}) {
  const base = fonts[size] || fonts.body;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        base,
        { color, textAlign: align },
        shadow && { textShadowColor: shadowColor, textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
