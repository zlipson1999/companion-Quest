// The Quest Ledger's promises, checked deterministically:
//   - quests cost 5-15 Quest Credits, and BUYING is the only credit movement
//     (abandon refunds nothing, turn-in mints nothing)
//   - tokens are proof, never currency: nothing spends or sells one
//   - progress is measured from the snapshot taken at purchase
//   - gym cardio never reaches trails, milestones, or Quest Credits
//   - the v12 migration refunds launch-era purchases exactly once
//
//   node --import ./tools/register-esm.mjs tools/test_quest_ledger.mjs

import { readFileSync } from 'node:fs';
import {
  MAX_ACTIVE_QUESTS, QUESTS, TOKENS, getQuest, questProgress, questSnapshot,
} from '../src/data/quests.js';
import { appendCardioSession, cardioStationLabel } from '../src/state/cardioHistory.js';
import { distancePolicy } from '../src/state/distancePolicy.js';
import { hydrateSave } from '../src/state/hydrate.js';

const src = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

const failures = [];
const check = (label, ok) => { if (!ok) failures.push(label); };
const equal = (label, got, want) => {
  if (got !== want) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

// ---- Quests are priced 5-15; tokens are not currency ----
equal('seven token categories', TOKENS.length, 7);
equal('eight quests on the board', QUESTS.length, 8);
equal('three active quests at most', MAX_ACTIVE_QUESTS, 3);
QUESTS.forEach((q) => {
  check(`quest ${q.id} price is an integer`, Number.isInteger(q.price));
  check(`quest ${q.id} price sits in the 5-15 band (${q.price})`, q.price >= 5 && q.price <= 15);
  check(`quest ${q.id} pays no credits`, !('credits' in (q.reward || {})));
});
const flagship2 = QUESTS.find((q) => q.flagship);
check('the flagship is the most expensive quest',
  QUESTS.every((q) => q.flagship || q.price < flagship2.price));

// The reducer file is the one place quest actions live. Buying is the ONLY
// credit movement: BUY_QUEST must check affordability and deduct the price,
// while abandoning and turning in stay credit-neutral by construction.
const reducerSrc = readFileSync(new URL('../src/state/GameContext.js', import.meta.url), 'utf8');
const caseBody = (action) => {
  const start = reducerSrc.indexOf(`case '${action}'`);
  check(`reducer still handles ${action}`, start >= 0);
  return start >= 0 ? reducerSrc.slice(start, reducerSrc.indexOf('\n    }', start)) : '';
};
for (const action of ['TURN_IN_QUEST', 'ABANDON_QUEST']) {
  check(`${action} never touches credits`, !/credits/.test(caseBody(action)));
}
const buyBody = caseBody('BUY_QUEST');
check('BUY_QUEST refuses an unaffordable quest', /<\s*quest\.price[\s\S]*return state/.test(buyBody));
check('BUY_QUEST deducts exactly the price', buyBody.includes('state.credits - quest.price'));
check('ACCEPT_QUEST is gone — quests are bought', !reducerSrc.includes('ACCEPT_QUEST'));
check('no reducer case spends tokens', !/tokens\[[^\]]*\]\s*-|tokens[^\n]*- 1/.test(reducerSrc));

// ---- Progress counts only effort after acceptance ----
const state = {
  stats: { distanceMi: 4.2, ridesDone: 1, workoutsDone: 3 },
  cardioSessions: [{ station: 'bike', miles: 2, seconds: 600, endedAt: '2026-08-20T10:00:00.000Z' }],
  modules: { diet: { totalLogs: 5 }, sleep: { totalLogs: 2 }, meditation: { totalLogs: 1 }, hydration: { goalDays: 6 } },
  gymCheckIns: [
    { day: '2026-08-18', checkedAt: '2026-08-18T09:00:00.000Z' },
    { day: '2026-08-20', checkedAt: '2026-08-20T09:00:00.000Z' },
    { day: '2026-08-21', checkedAt: '2026-08-21T09:00:00.000Z' },
  ],
  quests: { active: [], completed: [], tokens: {} },
};
const snap = questSnapshot(state);
equal('snapshot captures miles', snap.miles, 4.2);
equal('snapshot captures cardio sessions', snap.cardio, 1);

const trek = getQuest('tenminutetrek');
const fresh = { questId: 'tenminutetrek', startedDay: '2026-08-19', base: snap };
const before = questProgress(trek, fresh, state, '2026-08-20');
equal('a just-accepted quest starts at zero', before.reqs[0].have, 0);
check('a just-accepted quest is not done', !before.done);
const walked = { ...state, stats: { ...state.stats, distanceMi: 4.8 } };
const after = questProgress(trek, fresh, walked, '2026-08-20');
check('0.6 new miles finish the half-mile trek', after.done);

// Check-ins earlier than acceptance never count.
const flagship = getQuest('sevendayfoundation');
const flagshipRun = { questId: 'sevendayfoundation', startedDay: '2026-08-19', base: snap };
const checkinReq = questProgress(flagship, flagshipRun, state, '2026-08-21').reqs
  .find((r) => r.label.includes('reception'));
equal('only post-acceptance check-in days count', checkinReq.have, 2);

// The clock runs out.
const stale = { questId: 'tenminutetrek', startedDay: '2026-08-01', base: snap };
check('an unfinished quest expires after its window', questProgress(trek, stale, state, '2026-08-20').expired);

// ---- Gym cardio is isolated from trails and credits ----
const trail = distancePolicy({ miles: 1, routeId: 'maple' });
check('trail miles advance the trail', trail.advancesTrail && trail.earnsTrailCredit && trail.advancesTrailMilestones);
for (const activity of ['gym-cardio', 'ride']) {
  const gym = distancePolicy({ miles: 1, activity });
  check(`${activity} never advances a trail`, !gym.advancesTrail);
  check(`${activity} never earns Quest Credits`, !gym.earnsTrailCredit);
  check(`${activity} never moves trail milestones`, !gym.advancesTrailMilestones);
}
let threw = false;
try { distancePolicy({ miles: 1, activity: 'ride', routeId: 'maple' }); } catch { threw = true; }
check('gym cardio carrying a routeId is a programming error', threw);

// ---- Cardio history receives the session, and the right surfaces show it ----
const sessions = appendCardioSession([], {
  station: 'bike', miles: 3.2, seconds: 1200, endedAt: '2026-08-20T10:00:00.000Z',
});
equal('a Bike Ride lands in cardio history', sessions.length, 1);
equal('the session keeps its mileage', sessions[0].miles, 3.2);
equal('the activity is named Bike Ride', cardioStationLabel('bike'), 'Bike Ride');

const bagSrc = src('src/screens/BagScreen.js');
check('Phone Personal shows attendance stats', /gymCheckInStats/.test(bagSrc) && /GymCheckInList/.test(bagSrc));
check('Phone Personal shows recent cardio', /CardioHistoryList/.test(bagSrc));
check('Phone holds the Quest Log', bagSrc.includes('Quest Log'));
check('Phone holds the Token Case', bagSrc.includes('Token Case'));
const boardSrc = src('src/screens/BoardScreen.js');
check('the noticeboard has a Bike board', /bike/i.test(boardSrc) && /cyclingMi|cycling/i.test(boardSrc));
const receptionSrc = src('src/screens/ReceptionScreen.js');
check('reception never renders mileage', !/distanceMi|cyclingMi/.test(receptionSrc));
const smoothieSrc = src('src/screens/SmoothieBarScreen.js');
check('the smoothie bar never tracks mileage or quests', !/cyclingMi|cardioSessions|Quest Log/.test(smoothieSrc));

// ---- v12 migration: the one-time refund and the check-in conversion ----
const pricedEra = {
  version: 11, started: true, goalId: 'root', credits: 5,
  party: [{ id: 'sproutle', xp: 10, bond: 1, hp: 20 }],
  stats: { totalSteps: 100, distanceMi: 1 },
  quests: {
    checkIns: ['2026-08-18', '2026-08-19'],
    active: [{ questId: 'sevendayfoundation', startedDay: '2026-08-19', base: {} }],
    completed: [{ questId: 'wheelsinmotion', day: '2026-08-18' }],
    tokens: { stride: 1 },
  },
};
const migrated = hydrateSave(structuredClone(pricedEra));
equal('refund pays the exact historical prices (30 + 10)', migrated.credits, 45);
check('refund is flagged so it cannot repeat', migrated.quests.refundApplied === true);
equal('day-only check-ins become timestamped attendance', migrated.gymCheckIns.length, 2);
equal('converted check-in keeps its day', migrated.gymCheckIns[0].day, '2026-08-18');
check('converted check-in gains a real timestamp', !Number.isNaN(new Date(migrated.gymCheckIns[0].checkedAt).getTime()));
check('quests.checkIns bucket is gone', !('checkIns' in migrated.quests));
check('earned tokens survive migration', migrated.quests.tokens.stride === 1);

// Hydrating the migrated save again must not pay twice.
const again = hydrateSave(structuredClone(migrated));
equal('re-hydrating never refunds twice', again.credits, 45);

// A fresh save has nothing to refund.
const blank = hydrateSave({ version: 11, started: false });
equal('a save with no purchases gets no credits', blank.credits, 0);

if (failures.length) {
  console.error(`FAIL ${failures.length} quest-ledger check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}
console.log('ok     priced quest ledger (5-15), token-as-proof, cardio isolation and the v12 refund');
