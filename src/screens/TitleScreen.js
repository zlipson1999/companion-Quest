// Title card. Coach Maple gives the first invitation before the player begins
// at home; returning players continue, and a journey rides on the account.
//
// There is deliberately NO start-over button here. Your journey is the point
// of the whole app, and the title screen is the one place a tired thumb finds
// first — erasing lives behind Options, where nobody arrives by accident.
// Signing in is what makes the save durable: the account carries it, so a new
// phone or a reinstall comes back with one tap.

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Screen, PixelText, PixelSprite, FieldCard, TrailAction, ObjectiveRibbon } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { configured } from '../net/api';
import { useNav } from './navContext';

export default function TitleScreen() {
  const { state } = useGame();
  const { navigate } = useNav();
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
        {hasSave ? (
          <TrailAction label="Continue" tone="primary" onPress={() => navigate('hub')} />
        ) : (
          <View>
            <Animated.View style={{ opacity: blink }}>
              <TrailAction label="Enter the World" tone="primary" onPress={() => navigate('intro')} />
            </Animated.View>
            {configured() ? (
              <TrailAction
                label="Sign in — continue a journey"
                tone="quiet"
                style={{ marginTop: space.md }}
                onPress={() => navigate('friends')}
              />
            ) : null}
          </View>
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
