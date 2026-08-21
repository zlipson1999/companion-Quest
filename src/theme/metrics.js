import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screen = { width, height };

// Overworld tile size — chunky on purpose.
export const TILE = Math.floor(Math.min(width, 420) / 11);

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const border = {
  thin: 2,
  thick: 4,
  radius: 0,
};

export default { screen, TILE, space, border };
