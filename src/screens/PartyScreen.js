// Your team. Tap a companion to make it your active buddy (it leads on the
// Route and fights first in battle). Everyone grows from your real activity.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, HPBar, PixelText, PixelButton, PixelSprite, Triangle, FieldCard } from '../components';
import { palette, space } from '../theme';
import { useGame, useParty } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { personalityOf, idleLine } from '../data/personality';

export default function PartyScreen() {
  const { dispatch } = useGame();
  const party = useParty();
  const { navigate, goBack, back } = useNav();

  const setActive = (i) => {
    if (i === party.activeIndex) return;
    playSfx('confirm');
    dispatch({ type: 'SWAP_ACTIVE', payload: { index: i } });
  };

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Your Team
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.md }}>
        {party.members.length}/6 companions · tap to set your active buddy
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        {party.members.length === 0 ? (
          <FieldCard tone="paper" pad={16}>
            <PixelText
              size="small"
              color={palette.windowTextDim}
              align="center"
              accessibilityRole="text"
              accessibilityLabel="No companions yet. Meet Coach Maple in the gym."
            >
              No companions yet. Meet Coach Maple in the gym — then this list is yours.
            </PixelText>
          </FieldCard>
        ) : null}
        {party.members.map((m, i) => {
          const active = i === party.activeIndex;
          return (
            <View key={i} style={{ marginBottom: space.sm }}>
              <FieldCard tone={active ? 'ink' : 'paper'} pad={12} style={active ? { borderColor: palette.accent } : null}>
                <View onTouchEnd={() => setActive(i)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 16, justifyContent: 'center' }}>
                    {active ? <Triangle direction="right" size={6} color={palette.accent} /> : null}
                  </View>
                  <PixelSprite spriteKey={m.creature.sprite} palette={m.creature.palette} size={52} bob={active} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <PixelText size="body" color={active ? palette.secondary : palette.windowText}>
                        {m.creature.name}
                      </PixelText>
                      <PixelText size="tiny" color={active ? palette.windowFill : palette.windowTextDim}>
                        Lv.{m.level}
                      </PixelText>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <HPBar hp={m.hp} maxHp={m.maxHp} width={150} label="HP" showNumbers={false} />
                    </View>
                    <PixelText size="tiny" color={active ? palette.accent : palette.accentDark} style={{ marginTop: 6 }}>
                      {active ? 'ACTIVE' : 'tap to swap in'} · Bond {m.bond}
                    </PixelText>
                    {personalityOf(m.creature) ? (
                      <PixelText size="tiny" color={active ? palette.windowFill : palette.windowTextDim} style={{ marginTop: 4 }} numberOfLines={2}>
                        {personalityOf(m.creature).tendency}
                        {idleLine(m.creature) ? ` · ${idleLine(m.creature)}` : ''}
                      </PixelText>
                    ) : null}
                  </View>
                </View>
              </FieldCard>
            </View>
          );
        })}
      </ScrollView>
      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
