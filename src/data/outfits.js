import { SPRITE_PALETTES } from './sprites';

export const OUTFITS = [
  { id: 'pace', name: 'Pace Blue', dark: '#12345a', light: '#91c7ff', blurb: 'Cool, focused training gear.' },
  { id: 'grove', name: 'Grove Green', dark: '#183f32', light: '#9be7a5', blurb: 'Grounded, outdoors-ready gear.' },
  { id: 'spark', name: 'Spark Coral', dark: '#632a35', light: '#ff9b74', blurb: 'Warm, energetic training gear.' },
];

export const GENDERS = [
  { id: 'woman', name: 'Woman' },
  { id: 'man', name: 'Man' },
  { id: 'nonbinary', name: 'Nonbinary' },
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const x = hexToRgb(a); const y = hexToRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function outfitPalette(id) {
  const outfit = OUTFITS.find((item) => item.id === id) || OUTFITS[0];
  const base = SPRITE_PALETTES.hero;
  return base.map((color, index) => {
    if (index === 0) return color;
    if (index <= 26) return mix(outfit.dark, outfit.light, (index - 1) / 25);
    return color;
  });
}
