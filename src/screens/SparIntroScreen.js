// Rowan’s gym challenge — kept as a registered screen so an old stack
// entry still works, but the live path is GymScreen bumping `A`.
//
// He challenges WITH his companion. A person as the HP bar taught the
// wrong loop, and putting Rowan in the creature table would have put
// him in the Index. Pebblepup is already on the roster; this fight
// stamps neither the Index nor a catch.

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Screen, PixelText } from '../components';
import { palette, space } from '../theme';
import { useNav } from './navContext';
import { rowanSprite } from '../data/characters';

// No palette here. Rowan's sprite carries its own, and naming one would
// override it — the same override that was rendering people as flat colour.
export const SPAR_PARTNER = {
  name: 'Rowan',
  sprite: rowanSprite('down', 0),
};

export const SPAR_PARAMS = {
  targetId: 'pebblepup',
  trainer: 'Rowan',
  trainerBattle: true,
  isCompanion: false,
  catchRate: 0,
  hp: 26,
  xp: 24,
  bond: 5,
  from: 'gym',
  sparIntro: true,
  stageTone: 'hall',
};

export default function SparIntroScreen() {
  const { toBattle } = useNav();
  useEffect(() => {
    toBattle({ ...SPAR_PARAMS });
  }, []);

  return (
    <Screen style={{ padding: space.md, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <PixelText size="tiny" color={palette.windowFill}>
          Rowan calls his companion out.
        </PixelText>
      </View>
    </Screen>
  );
}
