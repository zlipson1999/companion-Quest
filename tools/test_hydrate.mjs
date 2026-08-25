// A v1 save through the real HYDRATE path. Asserts required keys exist.
// Does not invent days of history nobody logged.
//
//   node --import ./tools/register-esm.mjs tools/test_hydrate.mjs

import { MODULE_IDS } from '../src/modules/index.js';
import { HYDRATE_KEYS, SAVE_VERSION, hydrateSave } from '../src/state/hydrate.js';

const V1 = {
  version: 1,
  started: true,
  goalId: 'distance',
  companion: { id: 'emberkit', xp: 40, bond: 8, hp: 30 },
  stats: { totalSteps: 1000, distanceMi: 0.4 },
  bag: { token: 2, potion: 1 },
  dex: { emberkit: 'owned' },
};

const next = hydrateSave(V1);
const fail = [];

function eq(label, got, want) {
  if (got !== want) fail.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

for (const key of HYDRATE_KEYS) {
  if (!(key in next) || next[key] === undefined) fail.push(`missing key ${key}`);
}

eq('version', next.version, SAVE_VERSION);
eq('companion deleted', 'companion' in next, false);
eq('party length', next.party.length, 1);
eq('party id', next.party[0].id, 'emberkit');
eq('evo default', next.party[0].evo, 0);
eq('legacy goalId distance -> lean', next.goalId, 'lean');
eq('credits start at 0', next.credits, 0);
eq('token folded to knot', next.bag.knot, 2);
eq('token gone', next.bag.token, undefined);
eq('existing bag item kept', next.bag.potion, 1);
eq('history empty (days not invented)', Object.keys(next.history).length, 0);
eq('cardio sessions empty (sessions not invented)', next.cardioSessions.length, 0);
eq('gym check-ins empty (visits not invented)', next.gymCheckIns.length, 0);
eq('settings.control', next.settings.control, 'dpad');
eq('settings.bodyWeightLb present', typeof next.settings.bodyWeightLb, 'number');
eq('stats.exercises present', typeof next.stats.exercises, 'object');
eq('stats.xpCarry', typeof next.stats.xpCarry, 'number');
eq('stats.cyclingMi default', next.stats.cyclingMi, 0);
eq('stats.ridesDone default', next.stats.ridesDone, 0);
eq('meta.sparDone', next.meta.sparDone, false);
eq('trails present', typeof next.trails, 'object');
eq('maple miles not back-credited', next.trails.progress.maple.miles, 0);

const V10 = {
  ...V1,
  version: 10,
  companion: undefined,
  party: [{ id: 'emberkit', xp: 40, bond: 8, hp: 30 }],
  stats: { totalSteps: 12000, distanceMi: 6 },
  bag: { knot: 2 },
};
const fromV10 = hydrateSave(V10);
eq('v10 lifetime distance preserved', fromV10.stats.distanceMi, 6);
eq('v10 cycling miles not invented', fromV10.stats.cyclingMi, 0);
eq('v10 rides not invented', fromV10.stats.ridesDone, 0);
eq('v10 cardio sessions not invented', fromV10.cardioSessions.length, 0);

const V11 = {
  ...V10,
  version: 11,
  stats: { totalSteps: 12000, distanceMi: 9, cyclingMi: 3, ridesDone: 1 },
};
const fromV11 = hydrateSave(V11);
eq('v11 lifetime cycling preserved', fromV11.stats.cyclingMi, 3);
eq('v11 rides preserved', fromV11.stats.ridesDone, 1);
eq('v11 session rows not invented from totals', fromV11.cardioSessions.length, 0);
eq('v11 gym check-ins not invented', fromV11.gymCheckIns.length, 0);

const V12 = {
  ...V11,
  version: 12,
  cardioSessions: [{ id: 'bike:1', station: 'bike', miles: 2, seconds: 600, endedAt: '2026-08-20T12:00:00.000Z' }],
};
const fromV12 = hydrateSave(V12);
eq('v12 cardio history preserved', fromV12.cardioSessions.length, 1);
eq('v12 gym check-ins not invented', fromV12.gymCheckIns.length, 0);

for (const id of MODULE_IDS) {
  if (!next.modules[id]) fail.push(`module ${id} missing after hydrate`);
}

if (fail.length) {
  console.error(`FAIL ${fail.length} hydrate check(s):`);
  fail.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log(`ok     v1 save hydrates to version ${next.version} with ${HYDRATE_KEYS.length} required keys`);
process.exit(0);
