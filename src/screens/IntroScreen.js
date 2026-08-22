// A brief product introduction before the player enters the world at home.
// Companion discovery belongs to Coach Maple's in-world lesson at the gym.

import React from 'react';
import { View } from 'react-native';
import { DualPane, DialogueBox, PixelText, PixelSprite, Screen } from '../components';
import { palette, space } from '../theme';
import { useNav } from './navContext';
import { introLines } from '../coach';
import { useGame } from '../state';
import { COACH_PORTRAIT } from '../data/characters';

export default function IntroScreen() {
  const { navigate } = useNav();
  const { state } = useGame();

  const top = (
    <View style={{ flex: 1, backgroundColor: palette.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
      <PixelText size="small" color={palette.secondary}>WELCOME</PixelText>
      <PixelSprite
        spriteKey={COACH_PORTRAIT}
        size={144}
        accessibilityLabel="Coach Maple, your trail mentor"
        style={{ marginVertical: space.xs }}
      />
      <PixelText size="tiny" color={palette.windowFill} align="center" style={{ marginTop: space.md, lineHeight: 15 }}>
        Your real effort shapes this world.
      </PixelText>
    </View>
  );

  const bottom = (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}>
      <DialogueBox
        lines={introLines}
        onComplete={() => navigate(state.playerOutfit && state.playerGender ? 'homeIntro' : 'outfit')}
      />
    </View>
  );

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} topFlex={1} bottomFlex={1} />
    </Screen>
  );
}

