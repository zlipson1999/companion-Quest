// Friendships, and the boards they gate.
//
// The privacy rule is one sentence: you can see a person's numbers only if the
// two of you have BOTH agreed. It is enforced in one place — `friendIdsOf` —
// and every board is built from that list plus yourself. No handler assembles
// its own idea of who is visible, because that is how "friends only" ends up
// true on one screen and not on another.

const { db, pairOf } = require('./db');

const now = () => new Date().toISOString();

function playerByCode(code) {
  const clean = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 6) return null;
  return db.prepare('SELECT * FROM player WHERE code = ?').get(`${clean.slice(0, 3)}-${clean.slice(3)}`) || null;
}

const publicPlayer = (p) => ({ id: p.id, name: p.display_name, code: p.code });

// The single source of truth for who may see your numbers.
function friendIdsOf(playerId) {
  const rows = db
    .prepare(
      `SELECT a_id, b_id FROM friendship
       WHERE state = 'accepted' AND (a_id = ? OR b_id = ?)`
    )
    .all(playerId, playerId);
  return rows.map((r) => (r.a_id === playerId ? r.b_id : r.a_id));
}

function friendshipBetween(x, y) {
  const { a_id, b_id } = pairOf(x, y);
  return db.prepare('SELECT * FROM friendship WHERE a_id = ? AND b_id = ?').get(a_id, b_id) || null;
}

function requestFriend(meId, themId) {
  if (meId === themId) return { error: 'that is your own code' };
  const existing = friendshipBetween(meId, themId);
  if (existing) {
    if (existing.state === 'accepted') return { state: 'accepted' };
    // They asked first and we are asking back: that is an acceptance.
    if (existing.requested_by === themId) return acceptFriend(meId, themId);
    return { state: 'pending' };
  }
  const { a_id, b_id } = pairOf(meId, themId);
  db.prepare(
    `INSERT INTO friendship (a_id, b_id, requested_by, state, created_at)
     VALUES (?, ?, ?, 'pending', ?)`
  ).run(a_id, b_id, meId, now());
  return { state: 'pending' };
}

function acceptFriend(meId, themId) {
  const existing = friendshipBetween(meId, themId);
  if (!existing || existing.state === 'accepted') return { state: existing ? 'accepted' : 'none' };
  // Only the person who did NOT ask can accept; otherwise a requester could
  // befriend anybody by accepting their own request.
  if (existing.requested_by === meId) return { error: 'waiting for them to accept' };
  const { a_id, b_id } = pairOf(meId, themId);
  db.prepare("UPDATE friendship SET state = 'accepted' WHERE a_id = ? AND b_id = ?").run(a_id, b_id);
  return { state: 'accepted' };
}

function removeFriend(meId, themId) {
  const { a_id, b_id } = pairOf(meId, themId);
  db.prepare('DELETE FROM friendship WHERE a_id = ? AND b_id = ?').run(a_id, b_id);
  return { state: 'none' };
}

function listFriends(meId) {
  const rows = db
    .prepare(
      `SELECT f.state, f.requested_by, p.*
       FROM friendship f
       JOIN player p ON p.id = CASE WHEN f.a_id = ? THEN f.b_id ELSE f.a_id END
       WHERE f.a_id = ? OR f.b_id = ?
       ORDER BY p.display_name`
    )
    .all(meId, meId, meId);
  return rows.map((r) => ({
    ...publicPlayer(r),
    state: r.state,
    // "They asked you" is a different thing to do something about than
    // "you asked them", and the screen needs to tell them apart.
    incoming: r.state === 'pending' && r.requested_by !== meId,
  }));
}

// --- boards -----------------------------------------------------------------

// Monday-start week containing `date`, as a YYYY-MM-DD key.
function weekStart(date) {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;      // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

const BOARDS = {
  // What each board ranks, and how to say the number.
  distance: {
    label: 'Miles this week',
    sql: 'SUM(distance_mi)',
    format: (v) => `${v.toFixed(1)} mi`,
  },
  active: {
    label: 'Days active this week',
    sql: 'SUM(active)',
    format: (v) => `${Math.round(v)} ${Math.round(v) === 1 ? 'day' : 'days'}`,
  },
  workouts: {
    label: 'Sessions this week',
    sql: 'SUM(workouts)',
    format: (v) => `${Math.round(v)}`,
  },
};

// A weekly board over `day`, restricted to you and your accepted friends.
// Flagged days are excluded from the total but the row still exists, so a
// player's own history is never rewritten by the server's disbelief.
function weeklyBoard(meId, boardId, fromDate) {
  const board = BOARDS[boardId];
  if (!board) return null;
  const ids = [meId, ...friendIdsOf(meId)];
  const start = weekStart(fromDate);
  const holes = ids.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT p.id, p.display_name AS name,
              COALESCE(${board.sql}, 0) AS value,
              SUM(CASE WHEN d.flagged IS NOT NULL THEN 1 ELSE 0 END) AS flagged_days,
              SUM(CASE WHEN d.source = 'reported' THEN 1 ELSE 0 END) AS reported_days
       FROM player p
       LEFT JOIN day d
         ON d.player_id = p.id AND d.date >= ? AND d.date <= ? AND d.flagged IS NULL
       WHERE p.id IN (${holes})
       GROUP BY p.id
       ORDER BY value DESC, p.display_name ASC`
    )
    .all(start, addDays(start, 6), ...ids);

  return {
    board: boardId,
    label: board.label,
    weekStart: start,
    rows: rows.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      name: r.name,
      value: r.value,
      display: board.format(r.value),
      you: r.id === meId,
      // Shown next to the row rather than hidden: a week measured by a phone
      // and a week typed in are both allowed, and the board says which.
      selfReported: r.reported_days > 0,
    })),
  };
}

function addDays(dateKey, n) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Personal records are not weekly — a best is a best. One row per friend per
// movement, best first.
function recordBoard(meId, movementId) {
  const ids = [meId, ...friendIdsOf(meId)];
  const holes = ids.map(() => '?').join(',');
  const where = movementId ? 'AND r.movement_id = ?' : '';
  const args = movementId ? [...ids, movementId] : ids;
  const rows = db
    .prepare(
      `SELECT r.movement_id, r.kind, r.amount, r.weight, r.sets, r.achieved_on,
              p.id AS player_id, p.display_name AS name
       FROM record r JOIN player p ON p.id = r.player_id
       WHERE r.player_id IN (${holes}) ${where}
       ORDER BY r.movement_id ASC,
                CASE WHEN r.weight IS NULL THEN 0 ELSE r.weight END DESC,
                r.amount DESC`
    )
    .all(...args);

  // Group by movement so the screen shows "Back Squat: you 185x5, Rowan 200x3".
  const byMovement = new Map();
  for (const r of rows) {
    if (!byMovement.has(r.movement_id)) byMovement.set(r.movement_id, []);
    byMovement.get(r.movement_id).push({
      id: r.player_id,
      name: r.name,
      kind: r.kind,
      amount: r.amount,
      weight: r.weight == null ? undefined : r.weight,
      sets: r.sets,
      achievedOn: r.achieved_on,
      you: r.player_id === meId,
    });
  }
  return [...byMovement.entries()].map(([movementId2, entries]) => ({
    movementId: movementId2,
    entries,
  }));
}

module.exports = {
  playerByCode,
  publicPlayer,
  friendIdsOf,
  requestFriend,
  acceptFriend,
  removeFriend,
  listFriends,
  weeklyBoard,
  recordBoard,
  weekStart,
  BOARDS,
};
