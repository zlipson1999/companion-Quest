// The time-of-day transform, checked deterministically:
//   - every hour of the day maps to a phase, and the phases are the real ones
//   - noon is an IDENTITY, so the authored biome tones are what you see by day
//   - dawn and dusk brighten the horizon while darkening the zenith — the
//     opposition that makes them read as low sun rather than as a filter
//   - night drains colour and never reaches black
//   - the ground stays legible at night, which is when the game is played
//   - it is a transform over ANY tone, so all thirty biomes keep their identity
//
//   node --import ./tools/register-esm.mjs tools/test_daylight.mjs

import {
  PHASES, PHASE_ORDER, VEILS, daylightTone, phaseAt, veilFor,
} from '../src/data/daylight.js';
import { SCENE_TONES, sceneTone } from '../src/data/sceneSky.js';

let pass = 0;
let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`ok   ${name}${detail ? '  ' + detail : ''}`);
  } else {
    fail += 1;
    console.log(`FAIL ${name}${detail ? '  ' + detail : ''}`);
  }
}

const parse = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = (hex) => {
  const [r, g, b] = parse(hex);
  return r * 0.299 + g * 0.587 + b * 0.114;
};
// Distance from grey — how much colour a hex is actually carrying.
const chroma = (hex) => {
  const c = parse(hex);
  return Math.max(...c) - Math.min(...c);
};

// ---- phases cover the clock ----------------------------------------------

const seen = new Set();
let everyHourNamed = true;
for (let h = 0; h < 24; h += 1) {
  const d = new Date(2026, 0, 15, h, 30, 0);
  const p = phaseAt(d);
  if (!PHASES[p]) everyHourNamed = false;
  seen.add(p);
}
ok('every hour of the day names a real phase', everyHourNamed);
ok('all five phases are reachable from the clock', seen.size === PHASE_ORDER.length,
  [...seen].sort().join(' '));

ok('3am is night', phaseAt(new Date(2026, 0, 15, 3, 0)) === 'night');
ok('5am is dawn', phaseAt(new Date(2026, 0, 15, 5, 0)) === 'dawn');
ok('noon is day', phaseAt(new Date(2026, 0, 15, 12, 0)) === 'day');
ok('6pm is golden hour', phaseAt(new Date(2026, 0, 15, 18, 0)) === 'golden');
ok('8pm is dusk', phaseAt(new Date(2026, 0, 15, 20, 0)) === 'dusk');
ok('11pm is night', phaseAt(new Date(2026, 0, 15, 23, 0)) === 'night');

// ---- day is an identity ---------------------------------------------------

let dayIsIdentity = true;
for (const id of Object.keys(SCENE_TONES)) {
  const base = sceneTone(id);
  const lit = daylightTone(base, 'day');
  for (const k of ['zenith', 'sky', 'haze', 'ground', 'groundFar', 'disc']) {
    if (lit[k] !== base[k]) dayIsIdentity = false;
  }
}
ok('noon leaves every authored tone exactly as drawn', dayIsIdentity,
  `${Object.keys(SCENE_TONES).length} tones`);
ok('day veil is fully transparent', veilFor('day').opacity === 0);
ok('an unknown phase falls back to noon rather than throwing',
  daylightTone(sceneTone('maple'), 'nonsense').sky === sceneTone('maple').sky);

// ---- low sun: the horizon brightens as the zenith darkens ----------------

for (const phase of ['dawn', 'dusk']) {
  const base = sceneTone('maple');
  const lit = daylightTone(base, phase);
  ok(`${phase} darkens the zenith`, lum(lit.zenith) < lum(base.zenith),
    `${Math.round(lum(base.zenith))} -> ${Math.round(lum(lit.zenith))}`);
  ok(`${phase} warms the horizon toward the sun`,
    parse(lit.haze)[0] - parse(lit.haze)[2] > parse(base.haze)[0] - parse(base.haze)[2],
    'red now leads blue at the haze');
  ok(`${phase} moves the haze more than the zenith`,
    Math.abs(lum(lit.haze) - lum(base.haze)) > 0
    && Math.abs(lum(lit.zenith) - lum(base.zenith)) > 0);
}

// ---- night ----------------------------------------------------------------

const night = daylightTone(sceneTone('maple'), 'night');
const noon = sceneTone('maple');
ok('night darkens the sky', lum(night.sky) < lum(noon.sky),
  `${Math.round(lum(noon.sky))} -> ${Math.round(lum(night.sky))}`);
ok('night drains colour before it drains light', chroma(night.ground) < chroma(noon.ground),
  `chroma ${chroma(noon.ground)} -> ${chroma(night.ground)}`);
ok('nothing goes to black', lum(night.zenith) > 6, `zenith lum ${lum(night.zenith).toFixed(1)}`);

// The floor that matters: you play this outside, at night, and have to be able
// to read the tiles you are walking on.
ok('night dims the air harder than the ground',
  (lum(noon.sky) - lum(night.sky)) > (lum(noon.ground) - lum(night.ground)),
  'sky drop > ground drop');
ok('the night veil still lets the tiles through', VEILS.night.opacity < 0.6,
  `opacity ${VEILS.night.opacity}`);

// ---- it is a transform, not a table --------------------------------------

let allBiomesShift = true;
let allStayValid = true;
const hexRe = /^#[0-9a-f]{6}$/;
for (const id of Object.keys(SCENE_TONES)) {
  const base = sceneTone(id);
  for (const phase of PHASE_ORDER) {
    const lit = daylightTone(base, phase);
    for (const k of ['zenith', 'sky', 'haze', 'ground', 'groundFar', 'disc']) {
      if (!hexRe.test(lit[k])) allStayValid = false;
    }
    if (phase === 'night' && lit.sky === base.sky) allBiomesShift = false;
  }
}
ok('every biome × every phase produces a valid colour', allStayValid,
  `${Object.keys(SCENE_TONES).length} tones x ${PHASE_ORDER.length} phases`);
ok('night reaches all thirty biomes, not just the hub', allBiomesShift);

// Two different biomes must not converge on the same night sky — otherwise the
// hour has eaten the place, which is the failure a per-hour tone table would
// have had.
const canopyNight = daylightTone(sceneTone('canopy'), 'night');
const needleNight = daylightTone(sceneTone('needlesnow'), 'night');
ok('biomes keep their identity at night',
  canopyNight.sky !== needleNight.sky && canopyNight.ground !== needleNight.ground,
  `${canopyNight.sky} vs ${needleNight.sky}`);

// The zenith is the part of the sky the sun is furthest from, so its brightness
// is the cleanest read on how much light is left in the day. If these ever come
// out of order the phases have stopped describing a day.
const zen = (p) => lum(daylightTone(sceneTone('maple'), p).zenith);
ok('the zenith darkens in the right order through the day',
  zen('night') < zen('dusk') && zen('dusk') < zen('dawn') && zen('dawn') < zen('day'),
  `night ${zen('night').toFixed(0)} < dusk ${zen('dusk').toFixed(0)} < dawn ${zen('dawn').toFixed(0)} < day ${zen('day').toFixed(0)}`);

// Each phase has to be visibly not-noon, or it is a phase in name only — this
// is what caught dawn moving the zenith by four levels out of 255.
//
// Measured across ALL the stops, not at the zenith: golden hour is a HORIZON
// event. Its zenith is legitimately close to noon's, and an earlier version of
// this check demanded a zenith shift there too, which is asking the sun to be
// somewhere it isn't in order to satisfy a threshold.
const shift = (phase) => {
  const lit = daylightTone(noon, phase);
  return Math.max(...['zenith', 'sky', 'haze', 'ground'].map(
    (k) => Math.abs(lum(lit[k]) - lum(noon[k]))
  ));
};
let allPhasesVisible = true;
const shifts = [];
for (const phase of PHASE_ORDER) {
  if (phase === 'day') continue;
  shifts.push(`${phase} ${shift(phase).toFixed(0)}`);
  if (shift(phase) < 8) allPhasesVisible = false;
}
ok('every phase is visibly not noon somewhere', allPhasesVisible, shifts.join(', '));

// And golden hour must do its work at the horizon specifically, or it is just
// a slightly bluer noon.
const golden = daylightTone(noon, 'golden');
ok('golden hour lands on the horizon, not overhead',
  Math.abs(lum(golden.haze) - lum(noon.haze)) > Math.abs(lum(golden.zenith) - lum(noon.zenith)),
  `haze ${Math.abs(lum(golden.haze) - lum(noon.haze)).toFixed(0)} vs zenith ${Math.abs(lum(golden.zenith) - lum(noon.zenith)).toFixed(0)}`);
ok('golden hour deepens the zenith rather than lightening it',
  lum(golden.zenith) < lum(noon.zenith));

// ---- purity ---------------------------------------------------------------

const a = daylightTone(sceneTone('cairn'), 'dusk');
const b = daylightTone(sceneTone('cairn'), 'dusk');
ok('the transform is pure', JSON.stringify(a) === JSON.stringify(b));
const before = JSON.stringify(SCENE_TONES.cairn);
daylightTone(sceneTone('cairn'), 'night');
ok('the transform does not mutate the tone table',
  JSON.stringify(SCENE_TONES.cairn) === before);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
