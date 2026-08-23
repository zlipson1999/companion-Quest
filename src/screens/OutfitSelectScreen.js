import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, Window, PixelText, PixelSprite, PixelButton } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { forgetSpot } from './placeMemory';
import { OUTFITS, outfitPalette } from '../data/outfits';
import { CHARACTERS, playerPortrait, playerSprite } from '../data/characters';

// Same type as the first character card: three faces in a row, pick one,
// then the gear. Companion creation on the goal screen uses this layout.

export default function OutfitSelectScreen() {
  const { dispatch } = useGame();
  const { navigate } = useNav();
  const [selected, setSelected] = useState(OUTFITS[0].id);
  const [gender, setGender] = useState(CHARACTERS[0].id);
  const outfit = OUTFITS.find((item) => item.id === selected);
  const character = CHARACTERS.find((item) => item.id === gender);

  const confirm = () => {
    dispatch({ type: 'SET_PLAYER_CHARACTER', payload: { outfitId: selected, gender } });
    forgetSpot('intro:area');
    forgetSpot('intro:bedroom');
    forgetSpot('intro:downstairs');
    navigate('homeIntro');
  };

  return (
    <Screen style={{ padding: space.lg }}>
      <PixelText size="heading" color={palette.secondary} align="center">Create Your Character</PixelText>
      <PixelText size="tiny" color={palette.windowFill} align="center" style={{ marginTop: space.sm, lineHeight: 15 }}>
        Three faces on one plate. Pick who you are on the trail.
      </PixelText>

      <Window tone="dark" pad={14} style={{ marginTop: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
          {CHARACTERS.map((item) => {
            const isSel = gender === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setGender(item.id)}
                style={{ alignItems: 'center', minWidth: 44, paddingHorizontal: 4 }}
              >
                <View style={{
                  borderWidth: isSel ? 2 : 0,
                  borderColor: palette.accent,
                  padding: 4,
                }}>
                  <PixelSprite spriteKey={playerPortrait(item.id)} size={isSel ? 72 : 56} />
                </View>
                <PixelText
                  size="tiny"
                  color={isSel ? palette.secondary : palette.windowFill}
                  style={{ marginTop: 6 }}
                >
                  {item.name}
                </PixelText>
              </Pressable>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', marginTop: space.md }}>
          <PixelSprite
            spriteKey={playerSprite(gender)}
            palette={outfitPalette(selected, gender)}
            size={36}
            bob
          />
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4 }}>on the trail</PixelText>
        </View>

        <PixelText size="small" color={palette.secondary} align="center" style={{ marginTop: space.sm }}>
          {character ? character.name : ''} · {outfit.name}
        </PixelText>
        <PixelText size="tiny" color={palette.windowFill} align="center" style={{ marginTop: 5 }}>
          {outfit.blurb}
        </PixelText>
      </Window>

      <PixelText size="small" color={palette.secondary} style={{ marginTop: space.md }}>Gym Outfit</PixelText>
      <View style={{ marginTop: space.sm }}>
        {OUTFITS.map((item) => (
          <PixelButton
            key={item.id}
            label={item.name}
            tone={selected === item.id ? 'gold' : 'dark'}
            onPress={() => setSelected(item.id)}
            style={{ marginTop: space.sm }}
          />
        ))}
      </View>

      <PixelButton label="This Is My Character" tone="primary" onPress={confirm} style={{ marginTop: space.lg }} />
    </Screen>
  );
}
