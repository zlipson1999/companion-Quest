// Reduced motion, and specifically the flashing.
//
// Two different needs share one switch. The vestibular one — big movement — is
// a comfort issue. The photosensitive one is not: a flash above roughly three
// per second is a published seizure risk, and this app shipped two of them.
//
//   - BattleTransition: four full-SCREEN white flashes at 70ms each. That is
//     about seven per second, over the whole display, every time a battle
//     starts.
//   - PixelSprite: a white overlay across the whole sprite at 60ms on /
//     120ms off, fired once per hit, on a screen where you are hit repeatedly.
//
// Thirteen components animate and exactly one asked whether the person wanted
// any of it. So this checks the rule rather than the count: anything that
// FLASHES must consult the setting, and under it a flash is removed rather
// than shortened — a shorter flash is still a flash.
//
//   node --import ./tools/register-esm.mjs tools/test_motion.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const FILES = walk('src');
const read = (f) => readFileSync(f, 'utf8');

// ---- one copy of the question --------------------------------------------

// Reading AccessibilityInfo directly is how the answer ended up living in one
// component instead of being available to all of them.
const direct = FILES.filter((f) =>
  !f.endsWith('useReducedMotion.js') && /isReduceMotionEnabled|reduceMotionChanged/.test(read(f)));
ok('the setting is read in exactly one place', direct.length === 0,
  direct.join(', ') || 'src/state/useReducedMotion.js');

// ---- everything that flashes asks ----------------------------------------

// A "flash" here is an opacity animation over a white or full-bleed overlay.
// These two are named because they are the two that existed; the check is that
// each one consults the hook, so removing the guard fails rather than the file
// merely being on a list.
const FLASHERS = ['src/components/BattleTransition.js', 'src/components/PixelSprite.js'];
for (const f of FLASHERS) {
  const src = read(f);
  ok(`${f.split('/').pop()} consults reduced motion`, src.includes('useReducedMotion'));
}

// The battle transition's flash sequence must be UNREACHABLE under the flag,
// not merely quicker. An early return before the flashes is what that looks
// like; a `duration:` made conditional is what it must not look like.
const bt = read('src/components/BattleTransition.js');
const flashIdx = bt.indexOf('const flashes');
const guardIdx = bt.indexOf('if (reduce)');
ok('the screen flashes are skipped entirely, not shortened',
  guardIdx > 0 && flashIdx > guardIdx,
  'the reduced path returns before the flash sequence is built');

// The per-hit white overlay likewise.
const ps = read('src/components/PixelSprite.js');
const hitGuard = ps.indexOf('if (reduce) {');
const whiteFlash = ps.indexOf('Animated.timing(flash, { toValue: 1');
ok('the per-hit white overlay is skipped entirely',
  hitGuard > 0 && whiteFlash > hitGuard,
  'the reduced path returns before the flash');

// ...and a hit still has to register. Silence is not an accessible alternative
// to a flash; it is a missing signal.
ok('a hit still reads without the flash', ps.includes('hitDim'),
  'opacity dip replaces the strobe');

// ---- the large movements ask too -----------------------------------------

for (const f of [
  'src/components/PixelSprite.js',
  'src/components/BattleTransition.js',
  'src/components/GrowthCeremony.js',
  'src/screens/BattleScreen.js',
]) {
  ok(`${f.split('/').pop()} honours reduced motion`, read(f).includes('useReducedMotion'));
}

// The idle breath runs on every companion on every screen at once, which is
// exactly the case the setting exists for, and it was added without one.
ok('the idle breath stops under reduced motion',
  /if \(!bob \|\| reduce\)/.test(ps), 'both the drawn frame and the translate');

// ---- the hook itself is defensive ----------------------------------------

const hook = read('src/state/useReducedMotion.js');
ok('the hook guards a platform that lacks the API',
  hook.includes('if (AccessibilityInfo.isReduceMotionEnabled)'),
  'react-native-web does not always define it');
ok('the hook unsubscribes', hook.includes('sub.remove'));
ok('the hook defaults to full motion', /useState\(false\)/.test(hook),
  'so a platform that cannot answer is not silently reduced');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
