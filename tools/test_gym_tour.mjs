// The gym tour is part of the interaction contract: every usable floor code
// must be covered, and every stop must tell the player what action to take and
// what the interaction does. This catches a new machine being added to the map
// without being added to Maple's walkthrough.

import { readFileSync } from 'node:fs';
import { GYM, interactionForCode, triggerForCode } from '../src/data/maps.js';

const source = readFileSync(new URL('../src/screens/GymScreen.js', import.meta.url), 'utf8');
const bikeLabelSource = [
  source,
  readFileSync(new URL('../src/components/CardioConsole.js', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/state/cardioHistory.js', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/data/cardioMachines.js', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/data/maps.js', import.meta.url), 'utf8'),
].join('\n');
const failures = [];
const covered = new Set();
let stops = 0;

const stopPattern = /covers:\s*\[([^\]]+)\],\s*lines:\s*\[([\s\S]*?)\n\s*\]\s*\},/g;
for (const match of source.matchAll(stopPattern)) {
  stops += 1;
  const codes = [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
  codes.forEach((code) => covered.add(code));
  const dialogue = match[2];
  if (!/walk|step|press|choose|pick|enter|log|buy|use|approach/i.test(dialogue)) {
    failures.push(`tour stop ${codes.join('/')} does not tell the player what action to take`);
  }
  if (!/record|open|start|save|show|return|pay|earn|update|goes|become|run/i.test(dialogue)) {
    failures.push(`tour stop ${codes.join('/')} does not explain the interaction result`);
  }
}

const required = new Set();
GYM.grid.forEach((row) => [...row].forEach((code) => {
  if (interactionForCode(code, GYM) || triggerForCode(code)) required.add(code);
}));

required.forEach((code) => {
  if (!covered.has(code)) failures.push(`gym interaction ${JSON.stringify(code)} is missing from Maple's tour`);
});
covered.forEach((code) => {
  if (!required.has(code)) failures.push(`tour claims unknown gym interaction ${JSON.stringify(code)}`);
});

// Maple's grouped Cardio Section Overview must name what each of the five
// machines measures, not merely list them.
const overview = (source.match(/covers:\s*\[[^\]]*'t'[^\]]*\],\s*lines:\s*\[([\s\S]*?)\n\s*\]\s*\},/) || [])[1] || '';
for (const word of ['treadmill', 'bike', 'rower', 'stair climber', 'elliptical']) {
  if (!overview.toLowerCase().includes(word)) {
    failures.push(`the grouped cardio overview never mentions the ${word}`);
  }
}
for (const rule of [/active time/i, /quest credit/i, /trail/i, /hand|by hand|enter/i]) {
  if (!rule.test(overview)) failures.push(`the grouped cardio overview is missing ${rule}`);
}

if (!bikeLabelSource.includes('Start Bike Ride') || !bikeLabelSource.includes("'Bike Ride'")) {
  failures.push('player-facing cycling labels must use Bike Ride');
}
if (/outdoor\s+(?:bike|bicycle|ride)/i.test(bikeLabelSource)) {
  failures.push('player-facing cycling labels still brand the activity as outdoor');
}

if (failures.length) {
  console.error(`FAIL ${failures.length} gym-tour check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log(`ok     Maple explains action + result for ${required.size} gym interactions across ${stops} stops, cardio grouped`);
