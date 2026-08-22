// Pick a life goal. Each goal previews its paired original starter. Confirming
// starts the game (creates the companion) and moves to the pairing scene.

import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelSprite, PixelButton, Triangle } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { GOALS } from '../data/goals';
import { getCreature } from '../data/creatures';

export default function GoalSelectScreen() {
  const { dispatch } = useGame();
  const { navigate } = useNav();
  const [selected, setSelected] = useState(GOALS[0].id);

  const goal = GOALS.find((g) => g.id === selected);
  const starter = getCreature(goal.starterId);

  const confirm = () => {
    dispatch({ type: 'START_GAME', payload: { goalId: goal.id, starterId: goal.starterId } });
    navigate('pairing', { goalId: goal.id, starterId: goal.starterId });
  };

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.md }}>
        Choose Your Goal
      </PixelText>

      <ScrollView showsVerticalScrollIndicator={false}>
        {GOALS.map((g) => {
          const isSel = g.id === selected;
          const c = getCreature(g.starterId);
          return (
            <View key={g.id} style={{ marginBottom: space.md }}>
              <Window tone="cream" pad={12} style={{ borderColor: isSel ? palette.accent : palette.windowBorder }} innerStyle={isSel ? { borderColor: palette.accent } : null}>
                <Pressable onPress={() => { playSfx('cursor'); setSelected(g.id); }} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <PixelSprite spriteKey={c.sprite} palette={c.palette} size={56} bob={isSel} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 14, justifyContent: 'center' }}>
                        {isSel ? <Triangle direction="right" size={5} color={palette.accent} /> : null}
                      </View>
                      <PixelText size="body" color={palette.windowText}>
                        {g.name}
                      </PixelText>
                    </View>
                    <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 14 }}>
                      {g.tagline}
                    </PixelText>
                  </View>
                </Pressable>
              </Window>
            </View>
          );
        })}

        <Window tone="dark" pad={12} style={{ marginBottom: space.md }}>
          <PixelText size="small" color={palette.secondary}>
            Your companion: {starter.name}
          </PixelText>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 8, lineHeight: 16 }}>
            {goal.description}
          </PixelText>
        </Window>
      </ScrollView>

      <PixelButton label={`Pair with ${starter.name}`} tone="gold" onPress={confirm} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
