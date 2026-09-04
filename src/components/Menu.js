// A bordered menu with a visible selection cursor and tactile sounds: the
// cursor "moves" (blip) as your finger lands on a row, and confirms on release.
// Supports a single column or a 2x2 grid (used by the battle action menu).

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import FieldCard from './FieldCard';
import PixelText from './PixelText';
import Triangle from './Triangle';
import { palette, space } from '../theme';
import { playSfx } from '../audio';

// The selected row needs a FILL, not just a cursor. A lone arrow beside plain
// text is legible but flat; a highlight bar is what makes a handheld menu feel
// like something you are moving through.
const FOCUS = {
  cream: { fill: '#d8e2ff', rule: '#8ea6e8', text: palette.ink, dim: palette.windowTextDim, cursor: palette.accentDark },
  dark: { fill: '#2e2a52', rule: '#6a5b9e', text: palette.white, dim: palette.windowBorderLight, cursor: palette.secondary },
};

function MenuItem({ option, focused, onIn, onPress, width, labelColor, dimColor, focusTone }) {
  const disabled = option.disabled;
  const f = FOCUS[focusTone] || FOCUS.cream;
  return (
    <Pressable
      onPressIn={() => !disabled && onIn()}
      onPress={() => !disabled && onPress()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingRight: space.sm,
        width,
        opacity: disabled ? 0.4 : 1,
        backgroundColor: focused ? f.fill : 'transparent',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: focused ? f.rule : 'transparent',
      }}
    >
      <View style={{ width: 18, alignItems: 'center', justifyContent: 'center' }}>
        {focused ? <Triangle direction="right" size={6} color={f.cursor} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <PixelText size="body" color={focused ? f.text : labelColor}>
          {option.label}
        </PixelText>
        {option.sublabel ? (
          <PixelText size="tiny" color={focused ? f.dim : dimColor} style={{ marginTop: 3 }}>
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
          focusTone={tone}
        />
      ))}
    </View>
  );

  if (!framed) return <View style={style}>{list}</View>;
  return (
    <FieldCard tone={tone === 'dark' ? 'ink' : 'paper'} pad={pad} style={style}>
      {list}
    </FieldCard>
  );
}
