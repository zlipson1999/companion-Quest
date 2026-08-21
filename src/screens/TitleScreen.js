// Title card. Shows the logo, a row of original starters bobbing along the
// bottom, and either Start (new player) or Continue / New Adventure (returning).

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Screen, PixelText, PixelSprite, PixelButton, Window } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { STARTER_IDS, getCreature } from '../data/creatures';

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
      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <PixelText size="hero" color={palette.secondary} shadow shadowColor={palette.accentDark} align="center">
          COMPANION
        </PixelText>
        <PixelText size="hero" color={palette.primary} shadow shadowColor={palette.primaryDark} align="center" style={{ marginTop: 6 }}>
          QUEST
        </PixelText>
        <PixelText size="small" color={palette.windowFill} align="center" style={{ marginTop: space.lg }}>
          your real life is the adventure
        </PixelText>
      </View>

      <View style={{ width: '86%' }}>
        {confirmReset ? (
          <Window pad={14}>
            <PixelText size="body" color={palette.windowText} align="center" style={{ lineHeight: 22 }}>
              Start over? Your current companion and progress will be erased.
            </PixelText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg }}>
              <PixelButton label="Cancel" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={() => setConfirmReset(false)} />
              <PixelButton label="Erase" tone="danger" style={{ flex: 1, marginLeft: 6 }} onPress={() => { dispatch({ type: 'RESET' }); navigate('intro'); }} />
            </View>
          </Window>
        ) : hasSave ? (
          <View>
            <PixelButton label="Continue" tone="gold" onPress={() => navigate('hub')} />
            <PixelButton label="New Adventure" tone="dark" sound="cancel" style={{ marginTop: space.md }} onPress={() => setConfirmReset(true)} />
          </View>
        ) : (
          <Animated.View style={{ opacity: blink }}>
            <PixelButton label="Press Start" tone="primary" onPress={() => navigate('intro')} />
          </Animated.View>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.md }}>
        {STARTER_IDS.map((id) => {
          const c = getCreature(id);
          return (
            <View key={id} style={{ marginHorizontal: space.md }}>
              <PixelSprite spriteKey={c.sprite} palette={c.palette} size={64} bob />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
