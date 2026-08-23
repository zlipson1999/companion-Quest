// Companion creation — the same type as character creation.
// Three first-rendition faces on one plate. The goal is their temperament,
// not a menu that hides who you are bonding with.

import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { GOALS } from '../data/goals';
import { STARTER_IDS, getCreature } from '../data/creatures';

export default function GoalSelectScreen() {
  const { dispatch } = useGame();
  const { navigate } = useNav();
  const starters = STARTER_IDS.map((id) => {
    const companion = getCreature(id);
    const goal = GOALS.find((g) => g.companionId === companion.id);
    return { companion, goal };
  });
  const [selected, setSelected] = useState(STARTER_IDS[0]);
  const current = starters.find((row) => row.companion.id === selected);

  const confirm = () => {
    dispatch({
      type: 'START_GAME',
      payload: { goalId: current.goal.id, starterId: current.companion.id },
    });
    navigate('pairing', { goalId: current.goal.id, starterId: current.companion.id });
  };

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Create Your Companion
      </PixelText>
      <PixelText size="tiny" color={palette.windowFill} align="center" style={{ lineHeight: 15 }}>
        Three faces on one plate. Same type as the character card.
      </PixelText>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Window tone="dark" pad={14} style={{ marginTop: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {starters.map(({ companion }) => {
              const isSel = selected === companion.id;
              return (
                <Pressable
                  key={companion.id}
                  onPress={() => { playSfx('cursor'); setSelected(companion.id); }}
                  style={{ alignItems: 'center', minWidth: 44, paddingHorizontal: 2 }}
                >
                  <View style={{
                    borderWidth: isSel ? 2 : 0,
                    borderColor: palette.accent,
                    padding: 4,
                  }}>
                    <PixelSprite
                      spriteKey={companion.sprite}
                      palette={companion.palette}
                      size={isSel ? 72 : 56}
                    />
                  </View>
                  <PixelText
                    size="tiny"
                    color={isSel ? palette.secondary : palette.windowFill}
                    style={{ marginTop: 6 }}
                  >
                    {companion.name}
                  </PixelText>
                </Pressable>
              );
            })}
          </View>

          <PixelText size="small" color={palette.secondary} align="center" style={{ marginTop: space.md }}>
            {current.companion.name} · {current.goal.name}
          </PixelText>
          <PixelText size="tiny" color={palette.windowFill} align="center" style={{ marginTop: 5, lineHeight: 14 }}>
            {current.goal.tagline}
          </PixelText>
        </Window>

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 16 }}>
            {current.companion.flavor}
          </PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 8, lineHeight: 16 }}>
            {current.goal.description}
          </PixelText>
        </Window>

        <Window tone="dark" pad={12} style={{ marginTop: space.md, marginBottom: space.md }}>
          <PixelText size="small" color={palette.secondary}>Coach Maple listens...</PixelText>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 8, lineHeight: 16 }}>
            {current.companion.name} recognized that season in you.
          </PixelText>
        </Window>
      </ScrollView>

      <PixelButton label="This Is My Companion" tone="gold" onPress={confirm} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
