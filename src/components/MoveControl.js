// Whichever movement control the player chose.
//
// Every walkable screen used to hard-code the D-pad, so offering a stick meant
// editing all of them and keeping four copies of the choice in sync. They ask
// for "the movement control" now and this decides.

import React from 'react';
import { View } from 'react-native';
import Dpad from './Dpad';
import Joystick from './Joystick';
import PixelText from './PixelText';
import { palette } from '../theme';
import { useGame } from '../state';

export const CONTROL_MODES = [
  { id: 'stick', name: 'Stick', blurb: 'Hold and lean to walk.' },
  { id: 'dpad', name: 'D-Pad', blurb: 'One tap per square.' },
];

export default function MoveControl({ onMove, hint, style }) {
  const { state } = useGame();
  const mode = (state.settings && state.settings.control) || 'dpad';

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {mode === 'dpad' ? <Dpad onMove={onMove} /> : <Joystick onMove={onMove} />}
      {hint ? (
        <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: 6, lineHeight: 12 }}>
          {hint}
        </PixelText>
      ) : null}
    </View>
  );
}
