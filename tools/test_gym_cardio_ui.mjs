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
// The bike animates only when the ride is live AND real GPS movement is
// arriving; every other machine animates only on its own real signal, and a
// paused session animates on none of them. The expressions moved into the
// machine registry when the floor grew to five, so these assert the
// generalized form rather than the old two-machine ternary.
requireMatch('Bike animation must require a live ride and real movement', gym, /machine\.tracking === 'gps'\s*\n?\s*\? !!\(cardio\.gpsStarted && cardio\.phase === 'running' && moving\)/);
requireMatch('Every other machine animates only on its own live signal', gym, /: sessionLive/);
requireMatch('A live session means running AND actually moving', gym, /const sessionLive = !!\(cardio && cardio\.phase === 'running' && machineMoving\)/);
requireMatch('A paused session stops the animation', gym, /done \? \{ type: done\.machineId, active: false \}/);
requireMatch('A timer-only machine animates from logged strokes, not a sensor', gym, /machine\.tracking === 'timer' \? tapPulse : moving/);
requireMatch('World overlay must be absolutely positioned over the room', world, /worldOverlay[\s\S]*?position: 'absolute'[\s\S]*?width: '74%'/);
requireMatch('Compact console must expose visible moving and stopped states', consoleSource, /moving \? 'MOVING' : 'STOPPED'/);
requireMatch('Compact console must expose a paused state', consoleSource, /paused \? 'PAUSED'/);
requireMatch('Compact bike console must expose its riding state', consoleSource, /moving \? 'RIDING'/);
requireMatch('Pausing must be reachable from the compact console', consoleSource, /label=\{paused \? 'Resume' : 'Pause'\}/);
// There is deliberately NO discard control once a session is running: a
// button next to Finish is a way to lose a hard workout to one tired thumb.
// Check for a rendered control, not the word: the files explain in prose
// why there is no discard, and that explanation must not trip the guard.
const discardControl = /label=(?:"|'|\{`)?Discard/;
if (discardControl.test(consoleSource)) failures.push('the live console must not offer a discard button');
requireMatch('Activity frames must return to idle when movement stops', tileMap, /!playerActivity \|\| !playerActivity\.active[\s\S]*?setActivityFrame\(0\)/);
requireMatch('Activity frames must alternate while movement is live', tileMap, /setInterval\(\(\) => setActivityFrame\(\(f\) => \(f === 1 \? 2 : 1\)\)/);
requireMatch('Bike must use its side-on mounted pose', tileMap, /bike: \{ facing: 'left'/);
requireMatch('Treadmill must face along the deck', tileMap, /treadmill: \{ facing: 'up'/);
requireMatch('Rower must use a side-on drive pose', tileMap, /rower: \{ facing: 'left'/);
requireMatch('Stair climber must face the machine', tileMap, /stairclimber: \{ facing: 'up'/);
requireMatch('Elliptical must face the machine', tileMap, /elliptical: \{ facing: 'up'/);
requireMatch('The pose table must drive the sprite, not a per-machine branch', tileMap, /const pose = playerActivity \? CARDIO_POSE\[playerActivity\.type\] : null/);

// The summary is where hand-entered totals are asked for: off the machine,
// stopped, reading its display.
const summary = read('../src/components/CardioSummary.js');
requireMatch('The summary must label hand-entered figures as hand-entered', summary, /ENTERED BY HAND/);
requireMatch('The summary must show the credits the session earned', summary, /Quest Credits/);
if (discardControl.test(summary)) failures.push('the completion summary must not offer a discard button');
requireMatch('Saving is the only way off the summary', summary, /Save session/);

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

console.log('ok     compact overlay keeps all five machines visible, animated only by real movement');
