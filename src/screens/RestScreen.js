// The Hearth — a caretaker-led recovery space with its own identity.

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen, Window, DialogueBox, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { restLines } from '../coach';

export default function RestScreen() {
  const { dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  const [phase, setPhase] = useState('prompt');

  const lines = useMemo(() => restLines(companion.creature.name), [companion.creature.name]);

  const rest = () => {
    dispatch({ type: 'HEAL_FULL' });
    playSfx('heal');
    setPhase('resting');
  };

  const interior = (
    <View style={{ flex: 1, backgroundColor: '#3a2c52', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', bottom: 30, width: 220, height: 70, backgroundColor: palette.accentDark, opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 40, width: 180, height: 50, backgroundColor: palette.accent, opacity: 0.4 }} />
      <PixelText size="small" color={palette.secondary} style={{ marginBottom: space.lg }}>
        ~ The Hearth ~
      </PixelText>
      <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={120} bob={phase === 'resting'} />
      <View style={{ width: 120, height: 18, backgroundColor: palette.windowFill, marginTop: 8, borderWidth: 3, borderColor: palette.windowBorder }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.md }}>
        <PixelText size="tiny" color={palette.hpHigh}>
          HP {Math.round(companion.hp)}/{companion.maxHp}
        </PixelText>
        <PixelText size="tiny" color={palette.accent} style={{ marginLeft: space.lg }}>
          BOND {companion.bond}
        </PixelText>
      </View>
    </View>
  );

  return (
    <Screen padTop={false}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{interior}</View>
        <View style={{ padding: space.md, backgroundColor: palette.bgAlt }}>
          {phase === 'prompt' ? (
            <View>
              <Window tone="cream" pad={14} style={{ marginBottom: space.sm }}>
                <PixelText size="body" color={palette.windowText} style={{ lineHeight: 20 }}>
                  The Hearth is quiet. Rest here with {companion.creature.name}?
                </PixelText>
              </Window>
              <View style={{ flexDirection: 'row' }}>
                <PixelButton label="Not now" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={() => navigate('hub')} />
                <PixelButton label="Rest" tone="gold" style={{ flex: 1, marginLeft: 6 }} onPress={rest} />
              </View>
            </View>
          ) : (
            <DialogueBox lines={lines} onComplete={() => navigate('hub')} />
          )}
        </View>
      </View>
    </Screen>
  );
}

