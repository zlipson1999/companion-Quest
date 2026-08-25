// Deterministic checks for the treadmill and outdoor-bike console maths.
//
//   node --import ./tools/register-esm.mjs tools/test_cardio.mjs

import {
  cyclingMet,
  formatSpeed,
  kcalForBike,
  speedFor,
} from '../src/state/cardioMaths.js';

const failures = [];

function equal(label, got, want) {
  if (got !== want) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

function close(label, got, want, epsilon = 0.001) {
  if (Math.abs(got - want) > epsilon) failures.push(`${label}: got ${got}, want ${want} +/- ${epsilon}`);
}

equal('speed waits for meaningful distance', speedFor(0.01, 60), null);
equal('speed waits for meaningful time', speedFor(1, 4), null);
close('15 mph from quarter mile in one minute', speedFor(0.25, 60), 15);
equal('speed placeholder', formatSpeed(null), '--.-');
equal('speed formatting', formatSpeed(12.34), '12.3');

equal('easy cycling MET', cyclingMet(9.9), 4);
equal('10 mph cycling MET', cyclingMet(10), 6.8);
equal('12 mph cycling MET', cyclingMet(12), 8);
equal('14 mph cycling MET', cyclingMet(14), 10);
equal('16 mph cycling MET', cyclingMet(16), 12);
close('bike kcal uses speed MET and body mass', kcalForBike(0.25, 60, 155), 12.3036);
equal('stationary ride burns no reported kcal', kcalForBike(0, 600, 155), 0);

if (failures.length) {
  console.error(`FAIL ${failures.length} cardio check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('ok     outdoor-bike speed bands, formatting and calorie estimate');
