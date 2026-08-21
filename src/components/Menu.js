// A bordered menu with a visible selection cursor and tactile sounds: the
// cursor "moves" (blip) as your finger lands on a row, and confirms on release.
// Supports a single column or a 2x2 grid (used by the battle action menu).

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Window from './Window';
import PixelText from './PixelText';
import Triangle from './Triangle';
import { palette, space } from '../theme';
import { playSfx } from '../audio';

function MenuItem({ option, focused, onIn, onPress, width, labelColor, dimColor }) {
  const disabled = option.disabled;
  return (
    <Pressable
      onPressIn={() => !disabled && onIn()}
      onPress={() => !disabled && onPress()}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingRight: space.sm, width, opacity: disabled ? 0.4 : 1 }}
    >
      <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>
        {focused ? <Triangle direction="right" size={6} color={palette.accent} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <PixelText size="body" color={labelColor}>
          {option.label}
        </PixelText>
        {option.sublabel ? (
          <PixelText size="tiny" color={dimColor} style={{ marginTop: 3 }}>
            {option.sublabel}
          </PixelText>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Menu({ options, onSelect, columns = 1, framed = true, tone = 'cream', initialFocus = 0, style, pad = 12 }) {
  const [focused, setFocused] = useState(initialFocus);

  const handleIn = (i) => {
    setFocused(i);
    playSfx('cursor');
  };
  const handlePress = (opt, i) => {
    playSfx('confirm');
    onSelect && onSelect(opt, i);
  };

  const itemWidth = columns === 2 ? '50%' : '100%';
  const labelColor = tone === 'dark' ? palette.windowFill : palette.windowText;
  const dimColor = tone === 'dark' ? palette.windowBorderLight : palette.windowTextDim;

  const list = (
    <View style={{ flexDirection: columns === 2 ? 'row' : 'column', flexWrap: 'wrap' }}>
      {options.map((opt, i) => (
        <MenuItem
          key={opt.value != null ? String(opt.value) : i}
          option={opt}
          focused={focused === i}
          onIn={() => handleIn(i)}
          onPress={() => handlePress(opt, i)}
          width={itemWidth}
          labelColor={labelColor}
          dimColor={dimColor}
        />
      ))}
    </View>
  );

  if (!framed) return <View style={style}>{list}</View>;
  return (
    <Window tone={tone} pad={pad} style={style}>
      {list}
    </Window>
  );
}
