import React from 'react';
import { View } from 'react-native';
import { PixelText } from '../components';
import { palette } from '../theme';

export default function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
      <PixelText size="heading" color={palette.secondary}>
        Companion Quest
      </PixelText>
      <PixelText size="small" color={palette.windowTextDim} style={{ marginTop: 16 }}>
        loading...
      </PixelText>
    </View>
  );
}
