// Ending an outdoor session is a save point, not trail completion. These
// source-level guards protect the ordering because a bundle cannot prove that
// a tired player can safely leave halfway through a trail.

import { readFileSync } from 'node:fs';

const route = readFileSync(new URL('../src/screens/RouteScreen.js', import.meta.url), 'utf8');
const hub = readFileSync(new URL('../src/screens/HubScreen.js', import.meta.url), 'utf8');
const failures = [];

function requireMatch(label, pattern) {
  if (!pattern.test(route)) failures.push(label);
}

requireMatch('The trail menu must offer an explicit end-and-save action', /End Trail Session & Save/);
requireMatch('Ending must stop a live GPS run before saving', /if \(dist\.running\) dist\.stopRun\(\);[\s\S]*?await saveGame\(state\)/);
requireMatch('Ending must wait for the latest state to save before leaving', /const saved = await saveGame\(state\);[\s\S]*?if \(!saved\)[\s\S]*?navigate\('hub', \{ entry: 'trail' \}\)/);
requireMatch('A failed save must keep the player on the trail', /if \(!saved\)[\s\S]*?return;[\s\S]*?navigate\('hub', \{ entry: 'trail' \}\)/);
requireMatch('Ending must clear the session baseline only after a successful save', /const saved = await saveGame\(state\);[\s\S]*?forgetSpot\('route:session'\);[\s\S]*?navigate\('hub', \{ entry: 'trail' \}\)/);
if (!/TRAIL_ARRIVAL_STEPS[\s\S]*?\{ x: 6, y: 0, facing: 'down' \}[\s\S]*?\{ x: 6, y: 3, facing: 'down' \}/.test(hub)) {
  failures.push('Trail return must walk inward from the lane top-centre gate');
}
if (!/arrivalLocked[\s\S]*?showControl=\{!arrivalLocked\}/.test(hub)) {
  failures.push('Movement controls must stay locked until the arrival walk finishes');
}
if (!/menu=\{arrivalLocked \? \[\] : MENU\}/.test(hub)) {
  failures.push('The menu must stay locked until the arrival walk finishes');
}

// Trail completion remains owned by the Warden battle reducer. The exit path
// must never award a pin or synthesize progress merely because it was pressed.
const endHandler = route.match(/const endTrailSession = async \(\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
if (/dispatch\(|awardPin|WIN_BATTLE|ADD_DISTANCE/.test(endHandler)) {
  failures.push('Ending a trail session must not award, complete or invent progress');
}

if (failures.length) {
  console.error(`FAIL ${failures.length} trail-session check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('ok     a trail can end mid-route only after its partial progress saves');
