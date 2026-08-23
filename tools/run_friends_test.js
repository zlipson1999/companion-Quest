#!/usr/bin/env node
// Starts the friends test proxy, runs server/test/friends.test.js, stops it.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const db = '/tmp/cq-test.db';
try { fs.unlinkSync(db); } catch (e) { /* fresh */ }

const child = spawn(process.execPath, ['server/index.js'], {
  cwd: root,
  env: {
    ...process.env,
    FRIENDS_DB: db,
    FRIENDS_TEST_AUTH: '1',
    PORT: '8788',
    ANTHROPIC_API_KEY: 'unused',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const ready = new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('proxy did not start')), 8000);
  const onData = (buf) => {
    const s = buf.toString();
    process.stdout.write(s);
    if (s.includes('listening')) {
      clearTimeout(t);
      resolve();
    }
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('error', reject);
});

(async () => {
  try {
    await ready;
    const run = spawnSync('npm', ['--prefix', 'server', 'run', 'test:friends'], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.kill();
    process.exit(run.status === null ? 1 : run.status);
  } catch (err) {
    child.kill();
    console.error(err.message || err);
    process.exit(1);
  }
})();
