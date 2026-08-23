// The first-bond ceremony. Reveals the companion whose temperament fits the
// flourish while Coach introduces them, then returns you to the gym.

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { DualPane, DialogueBox, PixelText, PixelSprite, Screen } from '../components';
import { palette, space } from '../theme';
import { useNav } from './navContext';
import { getGoal } from '../data/goals';
import { getCreature } from '../data/creatures';
import { pairingLines } from '../coach';
import { rememberSpot } from './placeMemory';

export default function PairingScreen({ params }) {
  const { navigate } = useNav();
  const goal = getGoal(params.goalId);
  const companion = getCreature(params.starterId);

  const lines = useMemo(() => pairingLines(companion.name, goal.name), [companion.name, goal.name]);

  const top = (
    <View style={{ flex: 1, backgroundColor: palette.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
      <PixelText size="small" color={palette.secondary}>
        First Bond
      </PixelText>
      <View style={{ marginTop: space.lg, alignItems: 'center' }}>
        <PixelSprite spriteKey={companion.sprite} palette={companion.palette} size={120} bob />
        <View style={{ width: 90, height: 8, backgroundColor: palette.inkSoft, marginTop: 6 }} />
      </View>
      <PixelText size="label" color={palette.windowFill} style={{ marginTop: space.lg }}>
        {companion.name}
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
        {companion.species}
      </PixelText>
    </View>
  );

  const bottom = (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}>
      {/* Back into the gym, facing Coach and Rowan. The first challenge
            starts when you walk up to Rowan — he brings his companion. */}
      <DialogueBox lines={lines} onComplete={() => {
        rememberSpot('gym', { x: 8, y: 16, facing: 'up' });
        navigate('gym');
      }} />
    </View>
  );

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} />
    </Screen>
  );
}

