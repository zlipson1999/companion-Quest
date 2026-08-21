// Pixel font config. We use Press Start 2P everywhere for that handheld feel.
// The font is loaded in App.js via @expo-google-fonts/press-start-2p.

export const FONT_FAMILY = 'PressStart2P_400Regular';

export const fonts = {
  tiny: { fontFamily: FONT_FAMILY, fontSize: 7, lineHeight: 12 },
  small: { fontFamily: FONT_FAMILY, fontSize: 9, lineHeight: 16 },
  body: { fontFamily: FONT_FAMILY, fontSize: 11, lineHeight: 19 },
  label: { fontFamily: FONT_FAMILY, fontSize: 12, lineHeight: 20 },
  heading: { fontFamily: FONT_FAMILY, fontSize: 16, lineHeight: 26 },
  title: { fontFamily: FONT_FAMILY, fontSize: 24, lineHeight: 34 },
  hero: { fontFamily: FONT_FAMILY, fontSize: 30, lineHeight: 42 },
};

export default fonts;
