// Trailkeeper Field Journal — the semantic layer.
//
// `palette` in colors.js is a flat bag of one-off names (windowFillAlt,
// primaryDark, grassTall) accumulated screen by screen, which is why no two
// screens agree on what "a panel" looks like. These are ramps with roles
// instead: a scene picks one dominant ramp, one support ramp and one accent,
// and every surface in it comes from those.
//
// This is additive. `palette` keeps working and keeps its meaning; screens move
// over to tokens as they are restyled, rather than in one sweep that would have
// to touch twenty files at once to avoid looking half-finished.

export const ramps = {
  // Text, outlines, and the darkest structural values.
  ink: ['#171923', '#292B38', '#454858'],
  // Paper stock: the journal surfaces most information sits on.
  paper: ['#FFF4D6', '#E8D7B3', '#C2A982'],
  // Growth, companions, and the outdoors.
  grove: ['#173F35', '#276451', '#4F8A62', '#91BD69'],
  // Wood, leather, path, and signage.
  trail: ['#68462F', '#9A6843', '#C89255', '#E8BE73'],
  // Sky, water, and cool distance.
  sky: ['#183B56', '#327092', '#67A9B5', '#B9DDD2'],
  // Effort, warmth, and reward.
  ember: ['#7D302C', '#C65338', '#EB8B44', '#FFD078'],
};

// Roles, so a screen never reaches for a raw hex.
export const tokens = {
  // surfaces
  surface: ramps.ink[0],
  surfaceRaised: ramps.ink[1],
  surfaceSunken: '#101219',
  sheet: ramps.paper[0],
  sheetEdge: ramps.paper[2],

  // text
  textOnDark: ramps.paper[0],
  textOnDarkDim: ramps.paper[2],
  textOnPaper: ramps.ink[0],
  textOnPaperDim: ramps.ink[2],

  // structure
  line: ramps.ink[2],
  lineStrong: ramps.ink[0],

  // the two meters the whole game is built around
  resolve: ramps.ember[3],
  resolveDeep: ramps.ember[1],
  growth: ramps.grove[3],
  growthDeep: ramps.grove[1],

  // states. Never colour alone — pair with shape, icon or copy.
  danger: '#C46A5E',
  caution: ramps.ember[2],
  success: ramps.grove[2],
  disabledInk: '#5A5D6B',
  disabledPaper: '#8E8778',

  // accents
  accent: ramps.trail[3],
  accentDeep: ramps.trail[0],
};

// 4px base unit. Touch targets never go below 44.
export const scale = {
  unit: 4,
  gap: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { small: 3, panel: 6, ceremony: 10 },
  touchMin: 44,
  // Panels get one hard offset shadow, not a diffuse web blur.
  shadowOffset: 3,
};

// Three motion speeds, so timings stop being invented per component.
export const motion = {
  feedback: 90,     // immediate: press, tick, toggle
  transition: 190,  // normal UI movement
  ceremony: 620,    // reward, evolution, bonding
};

export default { ramps, tokens, scale, motion };
