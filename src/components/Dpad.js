// On-screen directional pad for grid-step movement in the overworld. Chunky,
// tactile, with a soft blip on each press.

import React from 'react';
import { Pressable, View } from 'react-native';
import Triangle from './Triangle';
import { palette } from '../theme';
import { playSfx } from '../audio';

function Pad({ dir, onMove }) {
  return (
    <Pressable
      // The arrows are drawn shapes, so without these the pad is four
      // unlabelled squares to a screen reader.
      accessibilityRole="button"
      accessibilityLabel={`Move ${dir}`}
      onPress={() => {
        playSfx('cursor');
        onMove(dir);
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        backgroundColor: pressed ? '#527b83' : '#355761',
        borderWidth: 3,
        borderColor: '#152d36',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
      })}
    >
      <Triangle direction={dir} size={9} color={palette.white} />
    </Pressable>
  );
}

export default function Dpad({ onMove }) {
  const spacer = <View style={{ width: 44, height: 44, margin: 0 }} />;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row' }}>
        {spacer}
        <Pad dir="up" onMove={onMove} />
        {spacer}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Pad dir="left" onMove={onMove} />
        {spacer}
        <Pad dir="right" onMove={onMove} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {spacer}
        <Pad dir="down" onMove={onMove} />
        {spacer}
      </View>
    </View>
  );
}
