// Companion Quest — app entry. Loads the pixel font, boots the audio system,
// and mounts the game state provider + screen router.

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

import { GameProvider } from './src/state';
import { Router, LoadingScreen } from './src/screens';
import { initAudio } from './src/audio';
import { palette } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  useEffect(() => {
    initAudio();
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GameProvider>
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <StatusBar style="light" />
        <Router />
      </View>
    </GameProvider>
  );
}
