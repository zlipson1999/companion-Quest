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
      onPress={() => {
        playSfx('cursor');
        onMove(dir);
      }}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        backgroundColor: pressed ? palette.primaryDark : palette.primary,
        borderWidth: 3,
        borderColor: palette.ink,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 1,
      })}
    >
      <Triangle direction={dir} size={9} color={palette.white} />
    </Pressable>
  );
}

export default function Dpad({ onMove }) {
  const spacer = <View style={{ width: 46, height: 46, margin: 1 }} />;
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
