// Coach's opening — typed dialogue in the lower pane, a warm welcome scene up
// top with the original starters waiting to meet you.

import React from 'react';
import { View } from 'react-native';
import { DualPane, DialogueBox, PixelText, PixelSprite, Screen } from '../components';
import { palette, space } from '../theme';
import { useNav } from './navContext';
import { introLines } from '../coach';
import { STARTER_IDS, getCreature } from '../data/creatures';

export default function IntroScreen() {
  const { navigate } = useNav();

  const top = (
    <View style={{ flex: 1, backgroundColor: palette.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
      <PixelText size="small" color={palette.secondary}>
        ~ Welcome ~
      </PixelText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: space.xl }}>
        {STARTER_IDS.map((id) => {
          const c = getCreature(id);
          return (
            <View key={id} style={{ marginHorizontal: space.md, alignItems: 'center' }}>
              <PixelSprite spriteKey={c.sprite} palette={c.palette} size={72} bob />
              <View style={{ width: 56, height: 6, backgroundColor: palette.inkSoft, marginTop: 4 }} />
            </View>
          );
        })}
      </View>
    </View>
  );

  const bottom = (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}>
      <DialogueBox lines={introLines} onComplete={() => navigate('goal')} />
    </View>
  );

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} topFlex={1} bottomFlex={1} />
    </Screen>
  );
}
