// Companion Quest — limited, deliberately retro palette.
// Hard edges, no gradients. Evokes a late-2000s handheld monster RPG
// while staying 100% original. Keep this list short on purpose.

export const palette = {
  // Base / windows
  ink: '#1a1228',
  inkSoft: '#3a2c52',
  bg: '#0f0f1b',
  bgAlt: '#191a2e',

  // Window chrome (classic bordered dialogue/menu windows)
  windowFill: '#f7f3e8',
  windowFillAlt: '#e8e0c8',
  windowBorder: '#2a1e3d',
  windowBorderLight: '#b8a98a',
  windowText: '#2a1e3d',
  windowTextDim: '#6b5d7a',

  // Brand / accents
  primary: '#5b8cff',
  primaryDark: '#2f4fb0',
  secondary: '#ffcf4d',
  accent: '#ff6b9d',
  accentDark: '#c43e6f',

  // Nature / overworld tiles
  grass: '#5aa86b',
  grassDark: '#3f7d50',
  grassTall: '#3e9156',
  path: '#d8c08a',
  pathDark: '#b89a64',
  water: '#4aa6d6',
  waterDark: '#2f7fb0',
  tree: '#2f6b43',
  treeDark: '#1f4a2e',
  roof: '#d65b6b',
  roofDark: '#a83b4b',
  wall: '#e8d8b8',
  wallDark: '#b8a07a',
  sand: '#e6d4a0',

  // HP / status bars
  hpHigh: '#5ed46a',
  hpMid: '#ffcf4d',
  hpLow: '#ff5e5e',
  xp: '#5b8cff',
  barTrack: '#4a3d5e',

  // Feedback
  white: '#ffffff',
  shadow: '#00000055',
  flash: '#fffbe6',
  danger: '#ff5e5e',
  success: '#5ed46a',
};

// Small named palettes used by the in-engine pixel-art renderer.
// Each creature/sprite references a palette by key + a grid of indices.
// Index 0 is ALWAYS transparent.
export const spritePalettes = {
  sprout: ['transparent', '#3f7d50', '#5aa86b', '#8fd99a', '#2a1e3d', '#ffcf4d', '#ffffff'],
  ember: ['transparent', '#c43e2f', '#ff7a3d', '#ffcf4d', '#2a1e3d', '#fff1c2', '#ffffff'],
  dew: ['transparent', '#2f7fb0', '#4aa6d6', '#9fe0f5', '#1a2a40', '#ffffff', '#cfeeff'],
  sludge: ['transparent', '#5a6b3f', '#7d9150', '#3a4a28', '#2a1e3d', '#b8d97a', '#ffffff'],
  snooze: ['transparent', '#5b5b8c', '#8c8cc4', '#3a3a5e', '#2a1e3d', '#cfcfff', '#ffffff'],
  ache: ['transparent', '#a83b4b', '#d65b6b', '#ff9db0', '#2a1e3d', '#ffd6de', '#ffffff'],
  couch: ['transparent', '#7a5a3f', '#a8825a', '#5a3f28', '#2a1e3d', '#d9b98a', '#ffffff'],
  hero: ['transparent', '#2f4fb0', '#5b8cff', '#ffcf4d', '#2a1e3d', '#f7c9a8', '#ffffff'],
  item: ['transparent', '#c43e6f', '#ff6b9d', '#ffcf4d', '#2a1e3d', '#5ed46a', '#ffffff'],
  rock: ['transparent', '#6b6b7a', '#9a9aad', '#c9c9d6', '#2a2438', '#ffcf4d', '#ffffff'],
  air: ['transparent', '#8fb8d6', '#bcdcee', '#eaf6ff', '#2a3a4a', '#ffcf4d', '#ffffff'],
  spore: ['transparent', '#a83b4b', '#d65b6b', '#ffd0b0', '#3a1e28', '#f7f0d8', '#ffffff'],
};

export default palette;
