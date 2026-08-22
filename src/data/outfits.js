// Training-gear colourways, applied on top of whichever character you picked.
//
// An outfit recolours exactly one ramp — the clothing — and leaves hair, skin
// and trim alone. The span comes from SPRITE_RAMPS rather than a hard-coded
// 1..26, because the character palettes carry a fourth ramp and run at a
// shorter length; assuming the creature layout here would have quietly repainted
// hair and skin the moment a player picked anything but the default body.

import { SPRITE_PALETTES, SPRITE_RAMPS } from './sprites';
import { getCharacter } from './characters';

export const OUTFITS = [
  { id: 'pace', name: 'Pace Blue', dark: '#12345a', light: '#91c7ff', blurb: 'Cool, focused training gear.' },
  { id: 'grove', name: 'Grove Green', dark: '#183f32', light: '#9be7a5', blurb: 'Grounded, outdoors-ready gear.' },
  { id: 'spark', name: 'Spark Coral', dark: '#632a35', light: '#ff9b74', blurb: 'Warm, energetic training gear.' },
];

// Kept as the character list's public name so existing callers and saved
// payloads kept working when characters became their own module.
export { CHARACTERS as GENDERS } from './characters';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// The palette a character's sprites are generated against.
function basePaletteKey(characterId) {
  const { id } = getCharacter(characterId);
  return id ? `pc_${id}` : 'hero';
}

export function outfitPalette(outfitId, characterId) {
  const key = basePaletteKey(characterId);
  const base = SPRITE_PALETTES[key] || SPRITE_PALETTES.hero;
  const outfit = OUTFITS.find((item) => item.id === outfitId);
  if (!outfit) return base;

  const span = (SPRITE_RAMPS[key] || {}).body;
  if (!span) return base;
  const [start, end] = span;
  const steps = end - start;

  return base.map((color, index) => {
    if (index < start || index > end) return color;
    return mix(outfit.dark, outfit.light, steps ? (index - start) / steps : 0);
  });
}
