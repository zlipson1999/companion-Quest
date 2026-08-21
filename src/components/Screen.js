// Full-screen container with safe-area padding (handles the Android status bar
// and iOS notch) and the game's dark background.

import React from 'react';
import { Platform, SafeAreaView, StatusBar, View } from 'react-native';
import { palette } from '../theme';

export default function Screen({ children, style, padTop = true }) {
  const androidPad = Platform.OS === 'android' && padTop ? StatusBar.currentHeight || 24 : 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={[{ flex: 1, paddingTop: androidPad }, style]}>{children}</View>
    </SafeAreaView>
  );
}
