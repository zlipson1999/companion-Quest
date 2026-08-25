// The gym cardio contract is visual as well as numeric: the room and player
// remain visible, while real sensor deltas own the in-place run/pedal cycle.
// These source-level guards catch the layout regression that put the console
// below the world and squeezed the animation out of view.

import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const gym = read('../src/screens/GymScreen.js');
const world = read('../src/components/WorldScreen.js');
const consoleSource = read('../src/components/CardioConsole.js');
const tileMap = read('../src/components/TileMap.js');
const cardio = read('../src/screens/useCardio.js');
const distance = read('../src/state/useDistance.js');
const failures = [];

function requireMatch(label, source, pattern) {
  if (!pattern.test(source)) failures.push(label);
}

requireMatch('Gym cardio must render through the in-world overlay', gym, /worldOverlay=\{cardio[\s\S]*?<CardioConsole\s+[\s\S]*?compact/);
requireMatch('Gym cardio must not occupy the status pane', gym, /tour \|\| rush[\s\S]*?: cardio \? null :/);
requireMatch('Bike animation must require both a live ride and real movement', gym, /cardio\.station === 'bike' \? !!\(cardio\.gpsStarted && moving\) : !!moving/);
requireMatch('World overlay must be absolutely positioned over the room', world, /worldOverlay[\s\S]*?position: 'absolute'[\s\S]*?width: '74%'/);
requireMatch('Compact console must expose visible moving and stopped states', consoleSource, /moving \? 'MOVING' : 'STOPPED'/);
requireMatch('Compact bike console must expose riding and paused states', consoleSource, /moving \? 'RIDING' : gpsActive \? 'PAUSED' : 'READY'/);
requireMatch('Activity frames must return to idle when movement stops', tileMap, /!playerActivity \|\| !playerActivity\.active[\s\S]*?setActivityFrame\(0\)/);
requireMatch('Activity frames must alternate while movement is live', tileMap, /setInterval\(\(\) => setActivityFrame\(\(f\) => \(f === 1 \? 2 : 1\)\)/);
requireMatch('Bike must use its side-on mounted pose', tileMap, /usingBike \? 'left'/);
requireMatch('Treadmill must face along the deck', tileMap, /usingTreadmill \? 'up'/);

const gpsHold = Number(cardio.match(/GPS_MOVING_MS\s*=\s*(\d+)/)?.[1]);
const gpsInterval = Number(distance.match(/timeInterval:\s*(\d+)/)?.[1]);
if (!(gpsHold > gpsInterval)) {
  failures.push(`bike movement hold (${gpsHold}ms) must bridge the GPS sample interval (${gpsInterval}ms)`);
}

if (failures.length) {
  console.error(`FAIL ${failures.length} gym-cardio UI check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('ok     compact gym overlay preserves live run/pedal animation and idle stop poses');
