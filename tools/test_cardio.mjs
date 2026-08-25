// Deterministic checks for the treadmill and outdoor-bike console maths.
//
//   node --import ./tools/register-esm.mjs tools/test_cardio.mjs

import {
  cyclingMet,
  formatSpeed,
  kcalForBike,
  speedFor,
} from '../src/state/cardioMaths.js';
import { distancePolicy } from '../src/state/distancePolicy.js';
import { appendCardioSession } from '../src/state/cardioHistory.js';
import { daysToSync } from '../src/net/sync.js';
import validation from '../server/validate.js';

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

const trailPolicy = distancePolicy({ routeId: 'maple' });
equal('selected trail advances trail quota', trailPolicy.advancesTrail, true);
equal('selected trail earns Trail Credit', trailPolicy.earnsTrailCredit, true);
equal('selected trail advances milestone meter', trailPolicy.advancesTrailMilestones, true);

for (const activity of ['ride', 'gym-cardio']) {
  const gymPolicy = distancePolicy({ activity });
  equal(`${activity} cannot advance a trail`, gymPolicy.advancesTrail, false);
  equal(`${activity} cannot earn Trail Credit`, gymPolicy.earnsTrailCredit, false);
  equal(`${activity} cannot advance trail milestones`, gymPolicy.advancesTrailMilestones, false);
}

let rejectedGymRoute = false;
try { distancePolicy({ routeId: 'maple', activity: 'ride' }); } catch (e) { rejectedGymRoute = true; }
equal('bike routeId is rejected', rejectedGymRoute, true);

let rejectedUnknownRoute = false;
try { distancePolicy({ routeId: 'not-a-route' }); } catch (e) { rejectedUnknownRoute = true; }
equal('unknown routeId cannot mint trail rewards', rejectedUnknownRoute, true);

const session = appendCardioSession([], {
  station: 'bike', miles: 3.4567, seconds: 900, endedAt: '2026-08-24T12:00:00.000Z',
});
equal('bike session retained', session.length, 1);
equal('bike session mileage rounded', session[0].miles, 3.457);
let cappedSessions = [];
for (let i = 0; i < 121; i += 1) {
  cappedSessions = appendCardioSession(cappedSessions, {
    station: 'treadmill', miles: 0.1, seconds: 60,
    endedAt: `2026-08-${String((i % 28) + 1).padStart(2, '0')}T12:${String(i % 60).padStart(2, '0')}:00.000Z`,
    id: `deck-${i}`,
  });
}
equal('cardio history stays bounded', cappedSessions.length, 120);
equal('cardio history drops oldest row', cappedSessions[0].id, 'deck-1');

const sync = daysToSync({
  '2026-08-24': {
    date: '2026-08-24', distanceMi: 4.457, cyclingMi: 3.457, rides: 1,
    steps: 2000, cardioSessions: 1,
  },
});
equal('bike day syncs', sync.length, 1);
equal('bike mileage reaches noticeboard sync', sync[0].cyclingMi, 3.457);
equal('bike ride count reaches noticeboard sync', sync[0].rides, 1);

const checkedMixedDay = validation.checkDay({
  date: '2026-08-24', distanceMi: 25, cyclingMi: 20, rides: 1,
  steps: 10000, active: 1, source: 'pedometer',
}, '2026-08-24');
equal('mixed walk and GPS ride day is accepted', checkedMixedDay.flagged, null);

const impossibleBikeDay = validation.checkDay({
  date: '2026-08-24', distanceMi: 5, cyclingMi: 8, rides: 1,
  active: 1, source: 'reported',
}, '2026-08-24');
equal('cycling cannot exceed total mileage', impossibleBikeDay.flagged, 'cycling exceeds total distance');

if (failures.length) {
  console.error(`FAIL ${failures.length} cardio check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('ok     cardio maths, trail-credit isolation, session history and bike-board sync');
