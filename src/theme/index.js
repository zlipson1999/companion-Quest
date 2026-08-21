export { palette, spritePalettes, shade, default as colors } from './colors';
export { fonts, FONT_FAMILY } from './typography';
export { screen, TILE, space, border } from './metrics';

import { palette } from './colors';
import { fonts } from './typography';
import { space, border, TILE, screen } from './metrics';

const theme = { palette, fonts, space, border, TILE, screen };
export default theme;
