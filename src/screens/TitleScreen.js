// Title card. Coach Maple gives the first invitation before the player begins
// at home; returning players can continue or erase their save.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Screen, PixelText, PixelSprite, FieldCard, TrailAction, ObjectiveRibbon } from '../components';
import { palette, space } from '../theme';
import { useGame, wipeSave } from '../state';
import { useNav } from './navContext';
import { forgetAll } from './placeMemory';

export default function TitleScreen() {
  const { state, dispatch } = useGame();
  const { navigate } = useNav();
  const [confirmReset, setConfirmReset] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  const hasSave = state.started && state.party && state.party.length > 0;

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.xl }}>
      <View style={{ width: '92%' }}>
        <ObjectiveRibbon place="Companion Quest" objective="real effort shapes a shared journey" />
      </View>

      <View style={{ alignItems: 'center' }}>
        <PixelText size="hero" color={palette.secondary} shadow shadowColor={palette.accentDark} align="center">
          COMPANION
        </PixelText>
        <PixelText size="hero" color={palette.primary} shadow shadowColor={palette.primaryDark} align="center" style={{ marginTop: 6 }}>
          QUEST
        </PixelText>
      </View>

      <View style={{ width: '86%' }}>
        {confirmReset ? (
          <FieldCard tone="paper" title="Start over?" caption="Your current companion and progress will be erased.">
            <TrailAction label="Cancel" tone="quiet" onPress={() => setConfirmReset(false)} />
            <TrailAction
              label="Erase"
              tone="accent"
              style={{ marginTop: space.sm }}
              onPress={async () => { await wipeSave(); forgetAll(); dispatch({ type: 'RESET' }); navigate('intro'); }}
            />
          </FieldCard>
        ) : hasSave ? (
          <View>
            <TrailAction label="Continue" tone="primary" onPress={() => navigate('hub')} />
            <TrailAction label="Begin Again" tone="quiet" style={{ marginTop: space.md }} onPress={() => setConfirmReset(true)} />
          </View>
        ) : (
          <Animated.View style={{ opacity: blink }}>
            <TrailAction label="Enter the World" tone="primary" onPress={() => navigate('intro')} />
          </Animated.View>
        )}
      </View>

      <View style={{ alignItems: 'center', marginBottom: space.md, width: '86%' }}>
        <PixelSprite spriteKey="coach_maple" size={104} bob accessibilityLabel="Coach Maple" />
        <FieldCard tone="ink" style={{ marginTop: 8, width: '100%' }}>
          <PixelText size="tiny" color={palette.windowFill} align="center" style={{ lineHeight: 14 }}>
            "Your first lesson begins at your own front door." — Coach Maple
          </PixelText>
        </FieldCard>
      </View>
    </Screen>
  );
}
