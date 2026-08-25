// The five-machine cardio floor, checked deterministically:
//   - all five run through ONE pipeline and ONE credit formula
//   - equal qualifying active time pays equal credits on every machine
//   - paused time, short sessions and discarded sessions pay nothing
//   - a session cannot be saved or paid twice (duplicate finish, reload)
//   - every machine writes the right record and reaches the right surfaces
//   - gym cardio can progress cardio quests and NEVER a trail requirement
//   - manual metrics are validated and can never become trail work
//
//   node --import ./tools/register-esm.mjs tools/test_cardio_machines.mjs

import { readFileSync } from 'node:fs';
import { splitPer500 } from '../src/state/cardioMaths.js';
import {
  CARDIO_MACHINES, CARDIO_MACHINE_IDS, getCardioMachine, validManualValue,
} from '../src/data/cardioMachines.js';
import {
  cardioCredits, CARDIO_MIN_ACTIVE_SEC, CARDIO_SEC_PER_CREDIT, CARDIO_SESSION_CREDIT_CAP,
} from '../src/state/economy.js';
import {
  appendCardioSession, cardioSession, cardioStationLabel, cardioTotals, finishCardioSession,
  normalizeCardioSessions,
} from '../src/state/cardioHistory.js';
import {
  newSession, tickSession, pauseSession, resumeSession, backgroundSession, tapSession,
  setManual, completeSession,
} from '../src/state/cardioSession.js';
import { distancePolicy } from '../src/state/distancePolicy.js';
import { QUESTS, getQuest, questProgress, questSnapshot } from '../src/data/quests.js';
import { reqAcceptsScope, distanceScope } from '../src/data/activityScopes.js';
import { hydrateSave } from '../src/state/hydrate.js';
import { blankDay, isActive, isTraining, TRAINING_CARDIO_MIN } from '../src/state/history.js';

const src = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
// One function body out of GymScreen, for order-of-operations checks.
const gymSrcFor = (name) => {
  const text = src('src/screens/GymScreen.js');
  const start = text.indexOf(`const ${name} =`);
  return start < 0 ? '' : text.slice(start, text.indexOf('\n  };', start));
};
const failures = [];
const check = (label, ok) => { if (!ok) failures.push(label); };
const equal = (label, got, want) => {
  if (got !== want) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

// ---- Five machines, one registry ----
equal('five cardio machines', CARDIO_MACHINES.length, 5);
equal('machine ids', CARDIO_MACHINE_IDS.join(','), 'treadmill,bike,rower,stairclimber,elliptical');
equal('the bicycle activity is always Bike Ride', cardioStationLabel('bike'), 'Bike Ride');
equal('the climber avoids the trademark', cardioStationLabel('stairclimber'), 'Stair Climber');
CARDIO_MACHINES.forEach((m) => {
  check(`${m.id} declares a tracking method`, ['steps', 'gps', 'timer'].includes(m.tracking));
  check(`${m.id} declares a character pose`, !!m.pose && !!m.pose.facing && m.pose.ms > 0);
  check(`${m.id} explains itself on the tour`, typeof m.tour === 'string' && m.tour.length > 20);
  check(`${m.id} carries safety guidance`, typeof m.safety === 'string' && m.safety.length > 10);
  check(`${m.id} has a map code`, typeof m.code === 'string' && m.code.length === 1);
});

// The render-side pose table must agree with the registry, or a machine
// animates in a pose it never puts anybody in.
const tileMapSrc = src('src/components/TileMap.js');
CARDIO_MACHINES.forEach((m) => {
  const row = `${m.id}: { facing: '${m.pose.facing}', ms: ${m.pose.ms} }`;
  check(`TileMap poses ${m.id} the way the registry says (${row})`, tileMapSrc.includes(row));
});

// ---- One shared duration formula ----
equal('too short pays nothing', cardioCredits(CARDIO_MIN_ACTIVE_SEC - 1), 0);
equal('the minimum qualifies', cardioCredits(CARDIO_MIN_ACTIVE_SEC), 1);
equal('twenty active minutes pay five', cardioCredits(20 * 60), 5);
equal('forty active minutes pay ten', cardioCredits(40 * 60), 10);
equal('the cap holds', cardioCredits(6 * 3600), CARDIO_SESSION_CREDIT_CAP);
equal('zero pays nothing', cardioCredits(0), 0);
equal('nonsense pays nothing', cardioCredits(-500), 0);
equal('the rate is one credit per four minutes', CARDIO_SEC_PER_CREDIT, 240);

// Equal qualifying active time earns equal base credits on EVERY machine.
const stats = { distanceMi: 10, totalSteps: 20000 };
const built = CARDIO_MACHINE_IDS.map((id) => {
  let s = newSession(id, { miles: 9, steps: 18000 }, '2026-08-25T10:00:00.000Z');
  s = { ...s, phase: 'running', activeSeconds: 22 * 60 };
  return completeSession(s, { stats, bodyWeightLb: 155, endedAt: '2026-08-25T10:25:00.000Z' });
});
built.forEach((rec, i) => {
  check(`${CARDIO_MACHINE_IDS[i]} produced a record`, !!rec);
  equal(`${CARDIO_MACHINE_IDS[i]} pays the shared rate for 22 active minutes`, rec.creditsAwarded, 5);
  equal(`${CARDIO_MACHINE_IDS[i]} stores creditsAwarded`, typeof rec.creditsAwarded, 'number');
  check(`${CARDIO_MACHINE_IDS[i]} records its own machine`, rec.station === CARDIO_MACHINE_IDS[i]);
  check(`${CARDIO_MACHINE_IDS[i]} stamps a metric source`, ['sensor', 'gps', 'timer', 'mixed'].includes(rec.source));
  equal(`${CARDIO_MACHINE_IDS[i]} is marked completed`, rec.completion, 'completed');
});
check('every machine paid identically', new Set(built.map((r) => r.creditsAwarded)).size === 1);

// A timer-only machine must not invent sensor distance.
const rowerRec = built[CARDIO_MACHINE_IDS.indexOf('rower')];
equal('the rower claims no sensed distance', rowerRec.miles, 0);
const treadRec = built[CARDIO_MACHINE_IDS.indexOf('treadmill')];
check('the treadmill keeps its measured distance', treadRec.miles > 0);
const ellipRec = built[CARDIO_MACHINE_IDS.indexOf('elliptical')];
check('the elliptical counts strides from the sensor', ellipRec.strides > 0);

// ---- Pause, discard, short: the ways to earn nothing ----
let paused = newSession('treadmill', { miles: 0, steps: 0 }, '2026-08-25T11:00:00.000Z');
paused = { ...paused, phase: 'running' };
for (let i = 0; i < 400; i += 1) paused = tickSession(paused);   // active
paused = pauseSession(paused);
for (let i = 0; i < 4000; i += 1) paused = tickSession(paused);  // paused
equal('active seconds banked while running', paused.activeSeconds, 400);
equal('paused seconds banked separately', paused.pausedSeconds, 4000);
const pausedRec = completeSession(paused, { stats: {}, bodyWeightLb: 155, endedAt: '2026-08-25T12:00:00.000Z' });
equal('paused time never becomes credits', pausedRec.creditsAwarded, cardioCredits(400));
check('an hour of pausing did not out-earn 400 active seconds', pausedRec.creditsAwarded === 1);

let resumed = resumeSession(paused);
equal('resume returns to running', resumed.phase, 'running');
equal('backgrounding the app pauses', backgroundSession(resumed).phase, 'paused');
equal('ticking a summary changes nothing', tickSession({ ...resumed, phase: 'summary' }).activeSeconds, resumed.activeSeconds);

let tooShort = newSession('rower', { miles: 0, steps: 0 }, '2026-08-25T13:00:00.000Z');
tooShort = { ...tooShort, phase: 'running', activeSeconds: 120 };
const shortRec = completeSession(tooShort, { stats: {}, bodyWeightLb: 155, endedAt: '2026-08-25T13:02:00.000Z' });
equal('a two-minute session pays nothing', shortRec.creditsAwarded, 0);
check('but it is still honestly recorded', !!shortRec && shortRec.activeSeconds === 120);

// A discarded session never reaches the log at all: the screen simply never
// dispatches it, which the reducer models as "nothing was appended".
const logAfterDiscard = appendCardioSession([], null);
equal('a discarded session saves nothing', logAfterDiscard.length, 0);

// ---- Saving is idempotent: no duplicate rows, no duplicate credits ----
const once = appendCardioSession([], built[0]);
const twice = appendCardioSession(once, built[0]);
equal('a duplicate finish event adds no row', twice.length, 1);
check('the duplicate returns the same list', twice === once);
const reloaded = normalizeCardioSessions([built[0], built[0], { ...built[0] }]);
equal('reloading collapses duplicate ids', reloaded.length, 1);

// The reducer is the only place credits are paid, and it pays from the row it
// actually appended — so a refused duplicate cannot pay.
const reducerSrc = src('src/state/GameContext.js');
const start = reducerSrc.indexOf("case 'COMPLETE_CARDIO'");
const body = reducerSrc.slice(start, reducerSrc.indexOf('\n    }', start));
check('COMPLETE_CARDIO bails when nothing was appended', /if \(cardioSessions === state\.cardioSessions\) return state/.test(body));
check('COMPLETE_CARDIO pays the record it stored', /creditsAwarded/.test(body));
check('COMPLETE_CARDIO does not touch trail credit carry', !/creditCarry/.test(body));
check('COMPLETE_CARDIO does not touch trail state', !/trails|routeMi|milestone/.test(body));

// ---- Trail isolation, with credits now flowing ----
for (const activity of ['gym-cardio', 'ride']) {
  const p = distancePolicy({ miles: 5, activity });
  check(`${activity} never advances a trail`, !p.advancesTrail);
  check(`${activity} never fills a trail quota`, !p.advancesTrail);
  check(`${activity} never moves a milestone meter`, !p.advancesTrailMilestones);
  check(`${activity} never mints trail credit`, !p.earnsTrailCredit);
  equal(`${activity} is scoped as gym cardio`, distanceScope({ activity }), 'gym_cardio');
}
let threw = false;
try { distancePolicy({ miles: 1, activity: 'gym-cardio', routeId: 'maple' }); } catch { threw = true; }
check('gym cardio carrying a routeId is a programming error', threw);
equal('GPS alone is not trail work', distanceScope({ activity: 'ride' }), 'gym_cardio');
equal('a real routeId is trail work', distanceScope({ routeId: 'maple' }), 'trail_activity');

// Manual entry cannot become trail work, whatever the number says.
const manualRec = finishCardioSession({
  station: 'rower',
  startedAt: '2026-08-25T14:00:00.000Z',
  endedAt: '2026-08-25T14:30:00.000Z',
  activeSeconds: 1800,
  manual: { machineMeters: 6000, strokes: 500 },
});
equal('the rower stores hand-entered machine distance', manualRec.machineMeters, 6000);
equal('hand-entered distance is not sensed distance', manualRec.miles, 0);
equal('a hand-entered session is marked mixed', manualRec.source, 'mixed');
check('no cardio record carries a routeId', !('routeId' in manualRec));

// Invalid manual metrics are refused rather than clamped into fiction.
check('negative strokes are refused', !validManualValue('rower', 'strokes', -5));
check('absurd floors are refused', !validManualValue('stairclimber', 'floors', 99999));
check('NaN is refused', !validManualValue('elliptical', 'machineMiles', Number.NaN));
check('a metric the machine has not got is refused', !validManualValue('treadmill', 'floors', 3));
check('a sane value is accepted', validManualValue('stairclimber', 'floors', 40));

// Each machine asks for exactly the figures it can honestly report.
const manualKeys = (id) => getCardioMachine(id).manual.map((f) => f.key).sort().join(',');
equal('the treadmill needs nothing by hand', manualKeys('treadmill'), '');
equal('the bike asks for cadence', manualKeys('bike'), 'cadence');
equal('the rower asks for metres and strokes', manualKeys('rower'), 'machineMeters,strokes');
equal('the climber asks for floors and level', manualKeys('stairclimber'), 'floors,level');
equal('the elliptical asks for distance and resistance', manualKeys('elliptical'), 'level,machineMiles');
check('the rower speaks metres, not miles', !manualKeys('rower').includes('machineMiles'));

// A rower's split is the machine's metres over the real active time, and is
// absent until those metres are entered.
equal('no metres means no split', splitPer500(0, 600), null);
equal('2000 m in 8:00 is a 2:00 split', splitPer500(2000, 480), 120);
const rowerMeters = finishCardioSession({
  station: 'rower', startedAt: '2026-08-25T16:00:00.000Z', endedAt: '2026-08-25T16:30:00.000Z',
  activeSeconds: 1800, manual: { machineMeters: 5000 },
});
equal('rower metres are stored in metres', rowerMeters.machineMeters, 5000);
equal('rower metres are not silently converted to miles', rowerMeters.machineMiles, 0);
const bikeCadence = finishCardioSession({
  station: 'bike', startedAt: '2026-08-25T17:00:00.000Z', endedAt: '2026-08-25T17:30:00.000Z',
  activeSeconds: 1800, miles: 6, manual: { cadence: 85 }, usedGps: true,
});
equal('the bike stores hand-entered cadence', bikeCadence.cadence, 85);
check('cadence is refused when absurd', !validManualValue('bike', 'cadence', 900));
const badManual = finishCardioSession({
  station: 'stairclimber', startedAt: '2026-08-25T15:00:00.000Z', endedAt: '2026-08-25T15:20:00.000Z',
  activeSeconds: 1200, manual: { floors: -12, level: 999 },
});
equal('a refused manual value stores zero, not garbage', badManual.floors, 0);
equal('an out-of-range level stores zero', badManual.level, 0);
equal('nothing manual survived, so the source stays automatic', badManual.source, 'timer');

// ---- Quests: cardio progresses cardio work, never trail work ----
const machineQuests = ['pullwithpurpose', 'stepbystep', 'smoothstrides', 'cardiocircuit', 'fivemachinecircuit'];
machineQuests.forEach((id) => {
  const q = getQuest(id);
  check(`${id} exists`, !!q);
  equal(`${id} awards the Stride Token`, q.tokenId, 'stride');
  check(`${id} is priced in the 5-15 band`, q.price >= 5 && q.price <= 15);
  q.reqs.forEach((r) => {
    check(`${id} requirement is scoped to gym cardio`, r.scopes.includes('gym_cardio'));
    check(`${id} requirement is NOT trail work`, !r.scopes.includes('trail_activity'));
  });
});

// Every machine can push a Stride quest, and only a qualifying session counts.
const baseState = { stats: { distanceMi: 0, ridesDone: 0, workoutsDone: 0 }, cardioSessions: [], modules: {}, gymCheckIns: [] };
const snap = questSnapshot(baseState);
const withSession = (sessions) => ({ ...baseState, cardioSessions: sessions });
const qualifying = (station, i) => finishCardioSession({
  station,
  startedAt: `2026-08-2${i}T09:00:00.000Z`,
  endedAt: `2026-08-2${i}T09:30:00.000Z`,
  activeSeconds: 1800,
});
const shortOne = finishCardioSession({
  station: 'rower', startedAt: '2026-08-26T09:00:00.000Z', endedAt: '2026-08-26T09:01:00.000Z', activeSeconds: 60,
});
const rowerQuest = getQuest('pullwithpurpose');
const active = { questId: 'pullwithpurpose', startedDay: '2026-08-20', base: snap };
check('a short rower session does not finish the rower quest',
  !questProgress(rowerQuest, active, withSession([shortOne]), '2026-08-21').done);
check('a qualifying rower session finishes the rower quest',
  questProgress(rowerQuest, active, withSession([qualifying('rower', 1)]), '2026-08-21').done);
check('a treadmill session does not finish the ROWER quest',
  !questProgress(rowerQuest, active, withSession([qualifying('treadmill', 1)]), '2026-08-21').done);

const five = CARDIO_MACHINE_IDS.map((id, i) => qualifying(id, i + 1));
const circuit = getQuest('fivemachinecircuit');
const circuitRun = { questId: 'fivemachinecircuit', startedDay: '2026-08-20', base: snap };
equal('four machines is four fifths of the circuit',
  questProgress(circuit, circuitRun, withSession(five.slice(0, 4)), '2026-08-25').reqs[0].have, 4);
check('all five machines complete the Five-Machine Circuit',
  questProgress(circuit, circuitRun, withSession(five), '2026-08-25').done);
check('the same machine five times does not',
  !questProgress(circuit, circuitRun, withSession(CARDIO_MACHINE_IDS.map((_, i) => qualifying('bike', i + 1))), '2026-08-25').done);

// The one trail-quota requirement kind stays out of reach of gym work.
QUESTS.forEach((q) => q.reqs.forEach((r) => {
  if (r.scopes.includes('trail_activity') && r.kind !== 'miles') {
    failures.push(`quest ${q.id} exposes a trail-scoped requirement (${r.kind}) that gym work could reach`);
  }
}));
check('a gym-cardio scope cannot satisfy a strength requirement',
  !reqAcceptsScope({ kind: 'workouts' }, 'gym_cardio'));
check('a gym-cardio scope cannot satisfy an attendance requirement',
  !reqAcceptsScope({ kind: 'checkins' }, 'gym_cardio'));
check('attendance satisfies attendance', reqAcceptsScope({ kind: 'checkins' }, 'gym_attendance'));

// No cardio quest hands out a trail-only reward.
machineQuests.forEach((id) => {
  const r = getQuest(id).reward;
  check(`${id} awards no trail pin or charm`, !r.pin && !r.charm && !r.trail);
  check(`${id} mints no credits`, !('credits' in r));
});

// ---- Review regressions (#85) ----
// A tap-per-stroke machine must not ADD the taps to the total read off the
// machine: they are the same strokes counted twice. The display total wins.
let tapped = newSession('rower', { miles: 0, steps: 0 }, '2026-08-25T18:00:00.000Z');
tapped = { ...tapped, phase: 'running', activeSeconds: 1800 };
for (let i = 0; i < 30; i += 1) tapped = tapSession(tapped);
const tapsOnly = completeSession(tapped, { stats: {}, bodyWeightLb: 155, endedAt: '2026-08-25T18:30:00.000Z' });
equal('taps stand in when nothing was read off the machine', tapsOnly.strokes, 30);
const withDisplay = completeSession(setManual(tapped, 'strokes', 300), {
  stats: {}, bodyWeightLb: 155, endedAt: '2026-08-25T18:30:00.000Z',
});
equal('the machine total wins over taps rather than adding to them', withDisplay.strokes, 300);

// A cardio-only day is a day somebody trained. Without this a half hour on
// the rower reads as "did nothing" in the Week view, and recovery would
// prescribe rest from a workout it did not notice.
const rowerDay = { ...blankDay('2026-08-25'), cardioSessions: 1, cardioMin: 30 };
check('a cardio-only day counts as active', isActive(rowerDay));
check('a qualifying cardio-only day counts as training', isTraining(rowerDay));
const shortCardioDay = { ...blankDay('2026-08-25'), cardioSessions: 1, cardioMin: TRAINING_CARDIO_MIN - 1 };
check('a sub-minimum cardio day is not training', !isTraining(shortCardioDay));
check('an empty day is still neither', !isActive(blankDay('2026-08-25')) && !isTraining(blankDay('2026-08-25')));

// Stepping onto a machine must remember the FLOOR tile, not the equipment:
// apply() moves playerRef synchronously, so the capture has to come first.
const stepOnBody = gymSrcFor('stepOn');
check('the floor tile is captured before stepping onto the machine',
  stepOnBody.indexOf('setFrom({ ...playerRef.current })') < stepOnBody.indexOf('apply({ x: at.x'));

// Backgrounding the app pauses the session for real, not just in principle.
check('AppState pauses a running session', /AppState\.addEventListener\('change'/.test(src('src/screens/GymScreen.js')));
check('the pause uses the shared background transition', /backgroundSession\(cur\)/.test(src('src/screens/GymScreen.js')));

// ---- Surfaces ----
const bagSrc = src('src/screens/BagScreen.js');
['Treadmill', 'Bike Ride', 'Rower', 'Stair Climber', 'Elliptical'].forEach((name) => {
  check(`the Phone lists ${name}`, bagSrc.includes(name));
});
check('the Phone shows cardio minutes', /cardioMinutes/.test(bagSrc));
check('the Phone shows credits earned from cardio', /cardioCreditsEarned/.test(bagSrc));
check('the Phone shows recent cardio', /CardioHistoryList/.test(bagSrc));
const boardSrc = src('src/screens/BoardScreen.js');
check('the noticeboard reports cardio sessions', /cardioSessions/.test(boardSrc));
check('the noticeboard reports active cardio minutes', /cardioMin/.test(boardSrc));
const weekSrc = src('src/screens/WeekScreen.js');
check('the Week view reports cardio minutes', /cardioMin/.test(weekSrc));
const coachSrc = src('src/coach/context.js');
check('the Coach knows all five machines', /stair climber/i.test(coachSrc) && /elliptical/i.test(coachSrc));
check('the Coach states the trail rule', /never advances a trail|ever advances a trail/i.test(coachSrc));
const receptionSrc = src('src/screens/ReceptionScreen.js');
check('reception still tracks no mileage', !/distanceMi|cyclingMi|cardioSessions/.test(receptionSrc));
const barSrc = src('src/screens/SmoothieBarScreen.js');
check('the smoothie bar still tracks no cardio', !/cyclingMi|cardioSessions|cardioMinutes/.test(barSrc));

// The compact console leaves the character visible: the console is rendered
// into worldOverlay (a corner of the live room) and never as a full screen.
const gymSrc = src('src/screens/GymScreen.js');
check('the console rides in the world overlay', /worldOverlay=\{cardio \?/.test(gymSrc));
check('the console is compact', /<CardioConsole\s+compact/.test(gymSrc));
// No discard once a session is running: finishing always offers the summary,
// and saving is the only way off it.
check('the gym offers no discard control', !/onDiscard/.test(gymSrc));
check('the summary saves rather than discards', /onSave=\{saveSession\}/.test(gymSrc));
check('the character is posed on the machine', /playerActivity=\{cardio \?/.test(gymSrc));
check('animation follows real movement, not the open console', /sessionLive/.test(gymSrc));
check('a paused session does not animate', /cardio\.phase === 'running'/.test(gymSrc));
const worldSrc = src('src/components/WorldScreen.js');
check('the overlay is a corner of the room, not a screen', /position: 'absolute'[\s\S]*?worldOverlay|worldOverlay[\s\S]*?position: 'absolute'/.test(worldSrc));

// ---- Map ----
const mapsSrc = src('src/data/maps.js');
CARDIO_MACHINES.forEach((m) => {
  check(`${m.id} has an interaction on the gym floor`, new RegExp(`cardio: '${m.id}'`).test(mapsSrc));
});

// ---- Migration ----
const legacy = {
  version: 12, started: true, goalId: 'root', credits: 40,
  party: [{ id: 'sproutle', xp: 10, bond: 1, hp: 20 }],
  stats: { totalSteps: 4000, distanceMi: 2, cyclingMi: 3, ridesDone: 1 },
  quests: { active: [], completed: [], tokens: { stride: 1 }, refundApplied: true },
  cardioSessions: [
    { id: 'legacy-1', station: 'treadmill', miles: 1.2, seconds: 900, endedAt: '2026-08-01T10:00:00.000Z' },
    { id: 'legacy-2', station: 'bike', miles: 4.5, seconds: 1500, endedAt: '2026-08-02T10:00:00.000Z' },
  ],
  gymCheckIns: [{ day: '2026-08-01', checkedAt: '2026-08-01T09:00:00.000Z' }],
};
const migrated = hydrateSave(structuredClone(legacy));
equal('the save is v13', migrated.version, 13);
equal('old cardio rows survive', migrated.cardioSessions.length, 2);
equal('an old row keeps its measured distance', migrated.cardioSessions[0].miles, 1.2);
equal('an old row keeps its duration as active time', migrated.cardioSessions[0].activeSeconds, 900);
equal('old sessions are NOT paid retroactively', migrated.cardioSessions[0].creditsAwarded, 0);
equal('credits are untouched by migration', migrated.credits, 40);
equal('an old row is marked legacy, not sensed', migrated.cardioSessions[0].source, 'legacy');
equal('new machines start empty, not invented', migrated.stats.stairFloors, 0);
equal('cardio minutes start at zero', migrated.stats.cardioMinutes, 0);
equal('reception attendance survives', migrated.gymCheckIns.length, 1);
check('the ledger refund flag survives', migrated.quests.refundApplied === true);
equal('earned tokens survive', migrated.quests.tokens.stride, 1);
const again = hydrateSave(structuredClone(migrated));
equal('migration is idempotent: rows', again.cardioSessions.length, 2);
equal('migration is idempotent: credits', again.credits, 40);
equal('migration never promotes an old row to rewarded', again.cardioSessions[1].creditsAwarded, 0);

// Totals read the log without re-inventing it.
const totals = cardioTotals(five);
equal('totals count every machine once', totals.sessions, 5);
equal('totals sum the shared credit award', totals.credits, five.reduce((n, s) => n + s.creditsAwarded, 0));

// ---- Wording ----
const wordFiles = [
  'src/data/cardioMachines.js', 'src/state/cardioHistory.js', 'src/state/cardioSession.js',
  'src/components/CardioConsole.js', 'src/components/CardioSummary.js', 'src/screens/GymScreen.js',
  'src/data/maps.js', 'src/screens/BagScreen.js',
];
wordFiles.forEach((rel) => {
  const text = src(rel);
  if (/trail\s+credits?/i.test(text)) failures.push(`${rel} revives the old currency name`);
  if (/outdoor\s+(?:\w+\s+)?rides?\b|outdoor ride live/i.test(text)) failures.push(`${rel} brands a Bike Ride as outdoor`);
  if (/stairmaster/i.test(text)) failures.push(`${rel} uses the StairMaster trademark`);
});

if (failures.length) {
  console.error(`FAIL ${failures.length} cardio-machine check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}
console.log('ok     five machines, one pipeline: shared credits, honest metrics, no trail leakage');
