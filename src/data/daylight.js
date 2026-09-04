// The hour of the day, applied to whatever sky the scene already has.
//
// SCENE_TONES are BIOMES — maple, cairn, canopy, redmesa. Thirty of them, each
// a place. So time of day cannot be another entry in that table: swapping the
// hub to a "dusk" tone would not make Sunkist Lane evening, it would make it a
// different location. It has to be a transform OVER a tone, which is also why
// it reaches all twenty-eight trails and the challenge stage for free instead
// of only the one map that could have had a second tone hand-written for it.
//
// This is the game's premise showing up in the art. Real walking is the engine,
// and real walking happens before work and after dinner. A world permanently at
// noon quietly says the clock outside does not reach in here.
//
// The transform is deliberately NOT one multiply over the whole picture. A
// uniform darkening is a screenshot with the brightness pulled down, and it
// reads as exactly that. Real air does something specific:
//
//   - At dawn and dusk the sun is ON the horizon, so the HAZE takes almost all
//     the colour and the ZENITH takes almost none — and the zenith actually
//     goes darker while the horizon goes brighter. That opposition is the whole
//     look. Warming all three stops equally gives you an orange fog.
//   - At night colour drains before light does. The sky keeps a little blue,
//     the ground gives up its green almost entirely, and nothing is black.
//
// So each stop moves toward its own target by its own amount.

// Mix a hex toward a target hex. Local copy rather than importing mixHex from
// sceneSky, which would make the two modules mutually dependent.
function parse(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(c) {
  return `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

function mix(a, b, t) {
  if (t <= 0) return a;
  const pa = parse(a);
  const pb = parse(b);
  return toHex(pa.map((v, i) => v + (pb[i] - v) * t));
}

// Pull a colour toward its own grey. Night takes saturation before it takes
// light — a desaturated blue dark reads as night, an equally dark but still
// vivid green reads as a bug.
function desaturate(hex, amount) {
  if (amount <= 0) return hex;
  const c = parse(hex);
  const grey = c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
  return toHex(c.map((v) => v + (grey - v) * amount));
}

// Each phase names, per stop, how far to move and where. `to` is the target
// colour, `amt` how much of the way. `desat` drains colour, `dark` mixes toward
// the phase's own black — never #000000, which kills the hue outright.
//
// NIGHT HAS A FLOOR. This is a game you play while walking outside at 9pm, and
// a world you cannot read is worse than a world at the wrong hour. Night dims
// the sky hard and the ground much less, so the tiles you are navigating stay
// legible; the darkness is carried by the air, which has nothing in it to read.
export const PHASES = {
  dawn: {
    label: 'dawn',
    zenith: { to: '#1c2044', amt: 0.62, desat: 0.10, dark: 0.12 },
    sky: { to: '#8a6a96', amt: 0.42, desat: 0.06, dark: 0.04 },
    haze: { to: '#f0b481', amt: 0.62, desat: 0.00, dark: 0.00 },
    ground: { to: '#4a4a72', amt: 0.30, desat: 0.22, dark: 0.14 },
  },
  day: {
    label: 'day',
    // Noon is the tones as authored. Every other phase is measured against it,
    // so this MUST stay an identity — see daylightTone's early return.
    zenith: { to: '#000000', amt: 0, desat: 0, dark: 0 },
    sky: { to: '#000000', amt: 0, desat: 0, dark: 0 },
    haze: { to: '#000000', amt: 0, desat: 0, dark: 0 },
    ground: { to: '#000000', amt: 0, desat: 0, dark: 0 },
  },
  golden: {
    label: 'golden hour',
    zenith: { to: '#1c2a56', amt: 0.50, desat: 0.00, dark: 0.04 },
    sky: { to: '#b98a68', amt: 0.34, desat: 0.00, dark: 0.00 },
    haze: { to: '#f6cf8e', amt: 0.52, desat: 0.00, dark: 0.00 },
    ground: { to: '#c08a4a', amt: 0.20, desat: 0.00, dark: 0.02 },
  },
  dusk: {
    label: 'dusk',
    zenith: { to: '#161a34', amt: 0.62, desat: 0.14, dark: 0.24 },
    sky: { to: '#6a4a7a', amt: 0.46, desat: 0.08, dark: 0.10 },
    haze: { to: '#d8865e', amt: 0.55, desat: 0.04, dark: 0.04 },
    ground: { to: '#3a3454', amt: 0.40, desat: 0.30, dark: 0.22 },
  },
  night: {
    label: 'night',
    zenith: { to: '#0a0c1a', amt: 0.72, desat: 0.30, dark: 0.30 },
    sky: { to: '#141a34', amt: 0.66, desat: 0.34, dark: 0.20 },
    haze: { to: '#2a3352', amt: 0.62, desat: 0.38, dark: 0.12 },
    // Far softer than the sky above it, on purpose — see the floor note above.
    ground: { to: '#232a44', amt: 0.44, desat: 0.42, dark: 0.16 },
  },
};

// The sky is colours this module computes; the GROUND is baked PNG tiles out of
// the atlas, and no amount of tone maths reaches them. Left alone you get a
// midnight sky over noon-bright grass, which reads as broken rather than as
// late — the one arrangement worse than a world permanently at noon.
//
// So each phase also carries the light the ground is standing in, drawn as one
// translucent plate over the tiles. This is the same trick the sky veil uses:
// a single overlay that takes whatever it is laid over, instead of thirty
// biomes × five hours of re-rendered tile art.
//
// Opacities are deliberately modest. The veil has to sell the hour without
// taking the tiles' own texture with it, and every one of these sits over
// something a player is navigating.
export const VEILS = {
  dawn: { color: '#3a3a72', opacity: 0.24 },
  day: { color: '#000000', opacity: 0 },
  golden: { color: '#e0a058', opacity: 0.18 },
  dusk: { color: '#2e2a5a', opacity: 0.34 },
  night: { color: '#101838', opacity: 0.52 },
};

export function veilFor(phase = 'day') {
  return VEILS[phase] || VEILS.day;
}

export const PHASE_ORDER = ['dawn', 'golden', 'day', 'dusk', 'night'];

// Hour boundaries, local time. Golden hour appears twice — once climbing out of
// dawn and once falling into dusk — which is why this is a lookup rather than a
// pair of comparisons. Whole hours only: the sky changing on a minute boundary
// while you are looking at it is worse than the sky being an hour coarse.
const BY_HOUR = [
  'night', 'night', 'night', 'night', // 00-03
  'dawn', 'dawn', 'dawn', // 04-06
  'golden', // 07
  'day', 'day', 'day', 'day', 'day', 'day', 'day', 'day', 'day', // 08-16
  'golden', 'golden', // 17-18
  'dusk', 'dusk', // 19-20
  'night', 'night', 'night', // 21-23
];

// The phase for a moment. Takes a Date so it is pure and testable; callers in
// the app pass `new Date()` through useDaylight.
export function phaseAt(date = new Date()) {
  const h = date.getHours();
  return BY_HOUR[h] || 'day';
}

function apply(hex, spec, black) {
  if (!spec) return hex;
  let c = hex;
  if (spec.amt > 0) c = mix(c, spec.to, spec.amt);
  if (spec.desat > 0) c = desaturate(c, spec.desat);
  if (spec.dark > 0) c = mix(c, black, spec.dark);
  return c;
}

// A tone as it looks at that hour. Pure: same tone + phase in, same colours out.
//
// `disc` (the battle platform) follows the ground rather than the sky — it is
// lit by the same light the grass is, and letting it track the haze made the
// companion stand on a glowing plate at dusk.
export function daylightTone(tone, phase = 'day') {
  const p = PHASES[phase];
  if (!p || phase === 'day') return tone;
  // Mix toward the phase's own darkest air, not toward pure black, so a hue
  // survives all the way down.
  const black = p.zenith.to;
  return {
    ...tone,
    zenith: apply(tone.zenith, p.zenith, black),
    sky: apply(tone.sky, p.sky, black),
    haze: apply(tone.haze, p.haze, black),
    groundFar: apply(tone.groundFar, p.ground, black),
    ground: apply(tone.ground, p.ground, black),
    disc: apply(tone.disc, p.ground, black),
  };
}
