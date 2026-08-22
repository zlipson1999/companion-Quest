export { palette, spritePalettes, shade, default as colors } from './colors';
export { fonts, FONT_FAMILY } from './typography';
export { screen, TILE, space, border } from './metrics';
export { ramps, tokens, scale, motion } from './tokens';

import { palette } from './colors';
import { fonts } from './typography';
import { space, border, TILE, screen } from './metrics';
import { ramps, tokens, scale, motion } from './tokens';

const theme = { palette, fonts, space, border, TILE, screen, ramps, tokens, scale, motion };
export default theme;
