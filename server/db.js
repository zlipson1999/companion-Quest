// The friends store: who you are, what you did on each day, and who can see it.
//
// SQLite on purpose. This is a self-hosted proxy that already exists for the
// Coach; adding a managed database service to it would make running Companion
// Quest a devops exercise. One file, no server to keep alive, and a backup is
// `cp`.
//
// The unit of sync is a DAY, never a lifetime total. That is the whole design:
// a client that reports "I have walked 400 miles" can only be believed or not,
// while a client that reports "on 2026-08-22 I walked 3.1 miles" can be checked
// against what a person can actually do in a day, and against what that same
// player reported yesterday. See validate.js.

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const FILE = process.env.FRIENDS_DB || path.join(__dirname, 'friends.db');

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- One row per person. 'sub' is the provider's stable subject id; it is the only
-- thing we keep from the identity provider. No email, no name we did not ask
-- for, no avatar URL — a fitness log is sensitive enough on its own.
CREATE TABLE IF NOT EXISTS player (
  id           TEXT PRIMARY KEY,
  provider     TEXT NOT NULL CHECK (provider IN ('apple','google')),
  sub          TEXT NOT NULL,
  display_name TEXT NOT NULL,
  code         TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL,
  seen_at      TEXT NOT NULL,
  UNIQUE (provider, sub)
);

-- Sessions are opaque tokens; only their hash is stored, so a stolen database
-- does not hand over live sessions.
CREATE TABLE IF NOT EXISTS session (
  token_hash TEXT PRIMARY KEY,
  player_id  TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS session_player ON session(player_id);

-- One row per player per day. Everything a board ranks is derived from here.
-- 'source' records how the distance was measured, because "my phone counted
-- this" and "I typed this" are not the same claim and the board should not
-- pretend otherwise.
CREATE TABLE IF NOT EXISTS day (
  player_id   TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,           -- LOCAL date key, YYYY-MM-DD
  steps       INTEGER NOT NULL DEFAULT 0,
  distance_mi REAL    NOT NULL DEFAULT 0,
  workouts    INTEGER NOT NULL DEFAULT 0,
  sets        INTEGER NOT NULL DEFAULT 0,
  reps        INTEGER NOT NULL DEFAULT 0,
  hold_sec    INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 0,   -- 0/1: did anything at all
  source      TEXT    NOT NULL DEFAULT 'reported'
                CHECK (source IN ('health','pedometer','reported')),
  flagged     TEXT,                     -- why the server did not believe it
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (player_id, date)
);
CREATE INDEX IF NOT EXISTS day_date ON day(date);

-- Personal records: the best single set of one movement. Kept separate from
-- 'day' because a record is a standing fact, not something that happened on a
-- date — though it remembers the date it was set.
CREATE TABLE IF NOT EXISTS record (
  player_id   TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  movement_id TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('load','reps','hold')),
  amount      REAL NOT NULL,            -- reps, or seconds for a hold
  weight      REAL,                     -- lb on the bar, when there was any
  sets        INTEGER NOT NULL DEFAULT 1,
  achieved_on TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (player_id, movement_id)
);

-- Friendship is stored ONCE per pair, with the requester first, and always
-- normalised so (a,b) and (b,a) cannot both exist. Two rows per friendship is
-- how a "friends only" rule ends up true in one direction and false in the
-- other.
CREATE TABLE IF NOT EXISTS friendship (
  a_id       TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  b_id       TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  state      TEXT NOT NULL CHECK (state IN ('pending','accepted')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (a_id, b_id),
  CHECK (a_id < b_id)
);
CREATE INDEX IF NOT EXISTS friendship_b ON friendship(b_id);

-- The whole game, one blob per player. Signing in is what makes a journey
-- durable: reinstall the app, sign back in, and your companion is where you
-- left it. The server never reads inside the blob — boards still rank only
-- the checked per-day rows above, never anything a client claims in here.
CREATE TABLE IF NOT EXISTS game_save (
  player_id  TEXT PRIMARY KEY REFERENCES player(id) ON DELETE CASCADE,
  blob       TEXT NOT NULL,
  version    INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
`;

const db = new Database(FILE);
db.exec(SCHEMA);

// A friend code a person can read down a phone line. No vowels and no 0/1/I/O,
// so MAPLE-K7Q2 cannot be misheard as a word or mistyped as a lookalike.
const ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXYZ';

function newCode() {
  let out = '';
  for (let i = 0; i < 6; i += 1) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

function uniqueCode() {
  const taken = db.prepare('SELECT 1 FROM player WHERE code = ?');
  for (let i = 0; i < 40; i += 1) {
    const code = newCode();
    if (!taken.get(code)) return code;
  }
  throw new Error('could not allocate a friend code');
}

// Always store the pair in a fixed order, so the "are we friends" question has
// exactly one row to look at whichever way round it is asked.
function pairOf(x, y) {
  return x < y ? { a_id: x, b_id: y } : { a_id: y, b_id: x };
}

module.exports = { db, uniqueCode, pairOf, FILE };
