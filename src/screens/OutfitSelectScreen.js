import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Screen, Window, PixelText, PixelSprite, PixelButton } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { GENDERS, OUTFITS, outfitPalette } from '../data/outfits';

export default function OutfitSelectScreen() {
  const { dispatch } = useGame();
  const { navigate } = useNav();
  const [selected, setSelected] = useState(OUTFITS[0].id);
  const [gender, setGender] = useState(GENDERS[0].id);
  const outfit = OUTFITS.find((item) => item.id === selected);

  const confirm = () => {
    dispatch({ type: 'SET_PLAYER_CHARACTER', payload: { outfitId: selected, gender } });
    navigate('homeIntro');
  };

  return (
    <Screen style={{ padding: space.lg }}>
      <PixelText size="large" color={palette.secondary} align="center">Create Your Character</PixelText>
      <PixelText size="tiny" color={palette.windowFill} align="center" style={{ marginTop: space.sm, lineHeight: 15 }}>
        Choose your gender and the gym clothes your character will wear on this journey.
      </PixelText>
      <Image
        source={require('../../assets/characters/player-selection-lineup-v1.png')}
        resizeMode="contain"
        accessibilityLabel="Three available player character presentations in Pace Blue, Grove Green, and Spark Coral"
        style={{ alignSelf: 'center', width: '100%', height: 190, marginTop: space.sm }}
      />
      <Window tone="dark" pad={14} style={{ alignItems: 'center', marginTop: space.lg }}>
        <PixelSprite spriteKey="hero_down" palette={outfitPalette(selected)} size={88} bob />
        <PixelText size="small" color={palette.secondary} style={{ marginTop: space.sm }}>{outfit.name}</PixelText>
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 5 }}>{outfit.blurb}</PixelText>
      </Window>
      <PixelText size="small" color={palette.secondary} style={{ marginTop: space.md }}>Gender</PixelText>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {GENDERS.map((item, index) => (
          <PixelButton
            key={item.id}
            label={item.name}
            tone={gender === item.id ? 'gold' : 'dark'}
            onPress={() => setGender(item.id)}
            style={{ flex: 1, marginLeft: index ? 4 : 0 }}
          />
        ))}
      </View>
      <PixelText size="small" color={palette.secondary} style={{ marginTop: space.md }}>Gym Outfit</PixelText>
      <View style={{ marginTop: space.md }}>
        {OUTFITS.map((item) => (
          <PixelButton key={item.id} label={item.name} tone={selected === item.id ? 'gold' : 'dark'} onPress={() => setSelected(item.id)} style={{ marginTop: space.sm }} />
        ))}
      </View>
      <PixelButton label="This Is My Character" tone="primary" onPress={confirm} style={{ marginTop: space.lg }} />
    </Screen>
  );
}
