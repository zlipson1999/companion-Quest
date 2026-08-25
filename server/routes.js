// The friends API, mounted on the existing Coach proxy.
//
// Everything past /auth requires a live session, and every read is scoped to
// you plus your accepted friends. There is no endpoint that returns a stranger:
// even the code lookup answers only with a name and an id, never with numbers.

const express = require('express');
const rateLimit = require('express-rate-limit');
const { db } = require('./db');
const {
  verifyIdToken, findOrCreatePlayer, issueSession, endSession, requireAuth, cleanName,
} = require('./auth');
const {
  playerByCode, publicPlayer, requestFriend, acceptFriend, removeFriend, listFriends,
  weeklyBoard, recordBoard, BOARDS,
} = require('./friends');
const { checkDay, checkRecord, isDateKey } = require('./validate');

const now = () => new Date().toISOString();
const todayKey = () => new Date().toISOString().slice(0, 10);

// Sign-in is the expensive, abusable endpoint (it fetches remote keys), and a
// friend-code lookup is the one an attacker would run in a loop to enumerate
// players. Both are limited harder than ordinary reads.
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const lookupLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const writeLimit = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const router = express.Router();

// --- sign in ----------------------------------------------------------------

// TEST ONLY. Signs in without a provider, so the friends API can be exercised
// without real Apple/Google credentials. Mounted only when FRIENDS_TEST_AUTH is
// explicitly set AND we are not in production, and it says so loudly at boot —
// an ungated developer path into somebody's account is the one thing this file
// must not ship with. Note it is registered BEFORE /auth/:provider would match,
// so 'test' can never fall through to a real provider.
if (process.env.FRIENDS_TEST_AUTH === '1' && process.env.NODE_ENV !== 'production') {
  console.warn('WARNING: FRIENDS_TEST_AUTH is on — /auth/test signs in ANY caller. Never enable this on a public server.');
  router.post('/auth/test', authLimit, (req, res) => {
    const { sub, displayName } = req.body || {};
    if (typeof sub !== 'string' || !sub) return res.status(400).json({ error: 'missing_sub' });
    const player = findOrCreatePlayer('google', `test:${sub}`, displayName);
    const session = issueSession(player.id);
    res.json({ token: session.token, expiresAt: session.expiresAt, me: publicPlayer(player) });
  });
}

router.post('/auth/:provider', authLimit, async (req, res) => {
  const { provider } = req.params;
  const { idToken, displayName } = req.body || {};
  if (typeof idToken !== 'string' || !idToken) {
    return res.status(400).json({ error: 'missing_token' });
  }
  try {
    const sub = await verifyIdToken(provider, idToken);
    const player = findOrCreatePlayer(provider, sub, displayName);
    const session = issueSession(player.id);
    return res.json({ token: session.token, expiresAt: session.expiresAt, me: publicPlayer(player) });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('auth error:', err && err.message);
    return res.status(status).json({ error: 'sign_in_failed', message: err.message });
  }
});

router.post('/auth/logout', requireAuth, (req, res) => {
  endSession(req.sessionToken);
  res.json({ ok: true });
});

// Leaving should actually leave: the row cascades to days, records and
// friendships, so "delete my account" means the data is gone rather than
// hidden.
router.delete('/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM player WHERE id = ?').run(req.player.id);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ me: publicPlayer(req.player) });
});

router.patch('/me', requireAuth, writeLimit, (req, res) => {
  const name = cleanName((req.body || {}).displayName);
  if (!name) return res.status(400).json({ error: 'bad_name' });
  db.prepare('UPDATE player SET display_name = ? WHERE id = ?').run(name, req.player.id);
  res.json({ me: { ...publicPlayer(req.player), name } });
});

// --- sync -------------------------------------------------------------------

const MAX_DAYS_PER_SYNC = 60;      // the client keeps 60 days of history
const MAX_RECORDS_PER_SYNC = 200;

// The client pushes whole DAYS, not deltas on a running total, so a repeated
// sync is idempotent: sending Tuesday twice leaves Tuesday as it was.
router.post('/sync', requireAuth, writeLimit, (req, res) => {
  const { days = [], records = [] } = req.body || {};
  if (!Array.isArray(days) || !Array.isArray(records)) {
    return res.status(400).json({ error: 'bad_body' });
  }
  if (days.length > MAX_DAYS_PER_SYNC || records.length > MAX_RECORDS_PER_SYNC) {
    return res.status(413).json({ error: 'too_much' });
  }

  const today = todayKey();
  const upsertDay = db.prepare(
    `INSERT INTO day (player_id, date, steps, distance_mi, cycling_mi, rides, workouts, sets, reps, hold_sec,
                      active, source, flagged, updated_at)
     VALUES (@player_id, @date, @steps, @distance_mi, @cycling_mi, @rides, @workouts, @sets, @reps, @hold_sec,
             @active, @source, @flagged, @updated_at)
     ON CONFLICT(player_id, date) DO UPDATE SET
       steps = excluded.steps, distance_mi = excluded.distance_mi,
       cycling_mi = excluded.cycling_mi, rides = excluded.rides,
       workouts = excluded.workouts, sets = excluded.sets, reps = excluded.reps,
       hold_sec = excluded.hold_sec, active = excluded.active,
       source = excluded.source, flagged = excluded.flagged,
       updated_at = excluded.updated_at`
  );
  const upsertRecord = db.prepare(
    `INSERT INTO record (player_id, movement_id, kind, amount, weight, sets, achieved_on, updated_at)
     VALUES (@player_id, @movement_id, @kind, @amount, @weight, @sets, @achieved_on, @updated_at)
     ON CONFLICT(player_id, movement_id) DO UPDATE SET
       kind = excluded.kind, amount = excluded.amount, weight = excluded.weight,
       sets = excluded.sets, achieved_on = excluded.achieved_on,
       updated_at = excluded.updated_at`
  );

  const rejected = [];
  const flagged = [];

  const apply = db.transaction(() => {
    for (const raw of days) {
      const { day, flagged: why, error } = checkDay(raw, today);
      if (error) { rejected.push({ date: raw && raw.date, error }); continue; }
      if (why) flagged.push({ date: day.date, why });
      upsertDay.run({ ...day, player_id: req.player.id, flagged: why, updated_at: now() });
    }
    for (const raw of records) {
      const { record, flagged: why, error } = checkRecord(raw, today);
      if (error) { rejected.push({ movementId: raw && raw.movementId, error }); continue; }
      // A flagged record is simply not stored: unlike a day, there is no
      // personal history to preserve — a record IS the claim.
      if (why) { flagged.push({ movementId: record.movement_id, why }); continue; }
      upsertRecord.run({ ...record, player_id: req.player.id, updated_at: now() });
    }
  });
  apply();

  res.json({ ok: true, days: days.length - rejected.length, rejected, flagged });
});

// --- game save --------------------------------------------------------------

// One blob per player, whole-save, last write wins. The blob is opaque to the
// server on purpose: boards rank only the validated day rows, so nothing a
// client writes in here can inflate anybody. Express already caps bodies at
// 256kb; this cap is tighter so the error names the real problem.
const MAX_SAVE_BYTES = 200 * 1024;

router.put('/save', requireAuth, writeLimit, (req, res) => {
  const { save } = req.body || {};
  if (!save || typeof save !== 'object' || typeof save.version !== 'number') {
    return res.status(400).json({ error: 'bad_save' });
  }
  const blob = JSON.stringify(save);
  if (Buffer.byteLength(blob, 'utf8') > MAX_SAVE_BYTES) {
    return res.status(413).json({ error: 'save_too_large' });
  }
  db.prepare(
    `INSERT INTO game_save (player_id, blob, version, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       blob = excluded.blob, version = excluded.version, updated_at = excluded.updated_at`
  ).run(req.player.id, blob, save.version, now());
  res.json({ ok: true });
});

router.get('/save', requireAuth, (req, res) => {
  const row = db.prepare('SELECT blob, updated_at FROM game_save WHERE player_id = ?').get(req.player.id);
  if (!row) return res.json({ save: null });
  try {
    res.json({ save: JSON.parse(row.blob), updatedAt: row.updated_at });
  } catch (e) {
    res.json({ save: null });
  }
});

// --- friends ----------------------------------------------------------------

router.get('/friends', requireAuth, (req, res) => {
  res.json({ friends: listFriends(req.player.id) });
});

// Look someone up by the code they read out to you. Deliberately returns no
// numbers — you learn a name, and only after they accept do you see anything.
router.get('/friends/lookup/:code', requireAuth, lookupLimit, (req, res) => {
  const them = playerByCode(req.params.code);
  if (!them) return res.status(404).json({ error: 'no_such_code' });
  res.json({ player: { id: them.id, name: them.display_name } });
});

router.post('/friends/request', requireAuth, writeLimit, (req, res) => {
  const them = playerByCode((req.body || {}).code);
  if (!them) return res.status(404).json({ error: 'no_such_code' });
  const out = requestFriend(req.player.id, them.id);
  if (out.error) return res.status(400).json(out);
  res.json({ ...out, player: { id: them.id, name: them.display_name } });
});

router.post('/friends/accept', requireAuth, writeLimit, (req, res) => {
  const out = acceptFriend(req.player.id, String((req.body || {}).id || ''));
  if (out.error) return res.status(400).json(out);
  res.json(out);
});

router.delete('/friends/:id', requireAuth, writeLimit, (req, res) => {
  res.json(removeFriend(req.player.id, req.params.id));
});

// --- boards -----------------------------------------------------------------

router.get('/board/:id', requireAuth, (req, res) => {
  const from = isDateKey(req.query.from) ? req.query.from : todayKey();
  const board = weeklyBoard(req.player.id, req.params.id, from);
  if (!board) return res.status(404).json({ error: 'no_such_board', boards: Object.keys(BOARDS) });
  res.json(board);
});

router.get('/records', requireAuth, (req, res) => {
  const movementId = typeof req.query.movementId === 'string' ? req.query.movementId : null;
  res.json({ movements: recordBoard(req.player.id, movementId) });
});

module.exports = router;
