// One panel language, and every word on it readable.
//
// Screens used to grow their own bordered box. `Window` was the old one — cream
// fill, purple frame, corner studs — and `FieldCard` is the one that stayed, so
// the migration is finished and this keeps it finished.
//
// The contrast half exists because of a bug that actually shipped: a card given
// the PAPER surface while its text kept the colours written for INK. It lints
// clean, it type-checks, and it renders as dark-on-dark. Nothing but looking at
// it caught it, and looking only reaches the screen you are looking at — so
// every text colour inside every card is checked here instead.
//
//   node --import ./tools/register-esm.mjs tools/test_panels.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { palette } from '../src/theme/colors.js';
import { tokens } from '../src/theme/tokens.js';

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
const lum = (hex) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

// ---- the migration is finished ------------------------------------------

// Window.js itself may stay on disk; nothing may render one.
const users = FILES.filter((f) => !f.endsWith('Window.js') && /<Window[\s/>]/.test(readFileSync(f, 'utf8')));
ok('no screen renders the old Window chrome', users.length === 0, users.join(', ') || 'all on FieldCard');

// FieldCard's vocabulary is ink/paper. Window's was cream/dark, and handing one
// to the other silently falls through to ink — which is how a card meant to be
// a cream page came out dark with its dark text still on it.
const badTone = [];
for (const f of FILES) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<FieldCard\b[\s\S]{0,400}?>/g)) {
    const tag = m[0];
    if (/tone="(cream|dark)"/.test(tag)) badTone.push(`${f}: ${/tone="(\w+)"/.exec(tag)[0]}`);
    // Two tone props on one tag: the last wins silently.
    if ((tag.match(/\btone=/g) || []).length > 1) badTone.push(`${f}: two tone props`);
  }
}
ok('no card is handed Window\'s cream/dark vocabulary', badTone.length === 0, badTone.join('; '));

// ---- every word on a card can be read ------------------------------------

const NAMED = {};
for (const [group, table] of [['palette', palette], ['tokens', tokens]]) {
  for (const [k, v] of Object.entries(table)) {
    if (typeof v === 'string' && v.startsWith('#')) NAMED[`${group}.${k}`] = v;
  }
}
const SURFACE = { paper: lum(tokens.sheet), ink: lum(tokens.surfaceRaised) };
// Below this the pixel font stops resolving against its ground. Pixel text has
// no antialiasing to lean on, so it needs more separation than body copy would.
const MIN_CONTRAST = 45;

const unreadable = [];
let checked = 0;
for (const f of FILES) {
  const lines = readFileSync(f, 'utf8').split('\n');
  let tone = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes('<FieldCard')) {
      // The tag can run over several lines — read forward to its '>' rather
      // than only the line the name is on.
      let tag = '';
      for (let j = i; j < lines.length && j < i + 12; j += 1) {
        tag += ' ' + lines[j];
        if (lines[j].includes('>')) break;
      }
      const t = /tone="(\w+)"/.exec(tag);
      tone = t ? t[1] : (tag.includes('tone={') ? null : 'ink');
      continue;
    }
    if (lines[i].includes('</FieldCard>')) { tone = null; continue; }
    if (!tone) continue;
    for (const cm of lines[i].matchAll(/color=\{(palette|tokens)\.(\w+)\}/g)) {
      const hex = NAMED[`${cm[1]}.${cm[2]}`];
      if (!hex) continue;
      checked += 1;
      const d = Math.abs(lum(hex) - SURFACE[tone]);
      if (d < MIN_CONTRAST) {
        unreadable.push(`${f}:${i + 1} tone=${tone} ${cm[1]}.${cm[2]}=${hex} contrast ${d.toFixed(0)}`);
      }
    }
  }
}
ok('every text colour inside a card reads against its surface',
  unreadable.length === 0, unreadable.length ? unreadable.join('; ') : `${checked} colours`);

// The two surfaces have to stay far enough apart to be worth having, and each
// has to hold its own default text.
ok('paper and ink are distinguishable surfaces',
  Math.abs(SURFACE.paper - SURFACE.ink) > 100,
  `paper ${SURFACE.paper.toFixed(0)} vs ink ${SURFACE.ink.toFixed(0)}`);
ok('each surface carries its own default text',
  Math.abs(lum(tokens.textOnPaper) - SURFACE.paper) > MIN_CONTRAST
  && Math.abs(lum(tokens.textOnDark) - SURFACE.ink) > MIN_CONTRAST);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
