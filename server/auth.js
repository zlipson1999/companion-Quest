// Sign in with Apple and Google, verified server-side.
//
// The phone runs the provider's own sign-in flow and comes back holding an ID
// token. It sends that token here ONCE; this file checks it is really from
// Apple or Google, really for this app, and not expired — and only then issues
// a Companion Quest session.
//
// The check matters more than it looks. An ID token is just a signed JSON blob:
// a client can mint one that SAYS anything. What makes it trustworthy is the
// signature, which is verified against the provider's published keys (fetched
// live, because they rotate), plus two claims that are easy to forget and fatal
// to skip:
//
//   * `aud` must be OUR client id. A token issued for a different app is a
//     perfectly valid Google token; accepting it lets that app's users — or its
//     operator — sign in as anybody here.
//   * `iss` must be the provider. Enforced by jose against the JWKS issuer.
//
// What is deliberately NOT here: no client secret. Public mobile clients cannot
// keep one, so the flow never uses one, and nothing in this file needs to be
// hidden from the app.

const crypto = require('crypto');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { db, uniqueCode } = require('./db');

const APPLE = {
  jwks: createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')),
  issuer: 'https://appleid.apple.com',
  audience: () => (process.env.APPLE_CLIENT_ID || '').split(',').map((s) => s.trim()).filter(Boolean),
};

const GOOGLE = {
  jwks: createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')),
  issuer: 'https://accounts.google.com',
  // Google issues a DIFFERENT client id per platform (iOS, Android, web), and
  // all of them are legitimately "this app", so every one we ship is allowed.
  audience: () => (process.env.GOOGLE_CLIENT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

const PROVIDERS = { apple: APPLE, google: GOOGLE };

const SESSION_DAYS = 90;

async function verifyIdToken(provider, idToken) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw Object.assign(new Error('unknown provider'), { status: 400 });

  const audience = cfg.audience();
  if (!audience.length) {
    // Refuse rather than fall back to "any audience". A misconfigured server
    // that accepts every token is worse than one that accepts none.
    throw Object.assign(
      new Error(`${provider} sign-in is not configured on this server`),
      { status: 503 }
    );
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, cfg.jwks, { issuer: cfg.issuer, audience }));
  } catch (err) {
    throw Object.assign(new Error('could not verify that sign-in'), { status: 401, cause: err });
  }

  if (!payload.sub) throw Object.assign(new Error('token has no subject'), { status: 401 });
  // Google sets email_verified; Apple only sends an email on first sign-in and
  // we do not store it either way. The subject is the identity.
  return String(payload.sub);
}

const now = () => new Date().toISOString();

function findOrCreatePlayer(provider, sub, wantedName) {
  const existing = db
    .prepare('SELECT * FROM player WHERE provider = ? AND sub = ?')
    .get(provider, sub);
  if (existing) {
    db.prepare('UPDATE player SET seen_at = ? WHERE id = ?').run(now(), existing.id);
    return existing;
  }
  const id = crypto.randomUUID();
  const name = cleanName(wantedName) || 'Trailkeeper';
  const player = {
    id,
    provider,
    sub,
    display_name: name,
    code: uniqueCode(),
    created_at: now(),
    seen_at: now(),
  };
  db.prepare(
    `INSERT INTO player (id, provider, sub, display_name, code, created_at, seen_at)
     VALUES (@id, @provider, @sub, @display_name, @code, @created_at, @seen_at)`
  ).run(player);
  return player;
}

// A display name is shown to a player's friends, so it is length-capped and
// stripped of control characters and newlines — a name is one line of text.
function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  // Control characters and newlines out: a display name is one line of text,
  // and a name containing an escape sequence is a name aimed at a terminal.
  const flat = Array.from(raw)
    .map((ch) => (ch.codePointAt(0) < 0x20 || ch.codePointAt(0) === 0x7f ? ' ' : ch))
    .join('');
  return flat.replace(/\s+/g, ' ').trim().slice(0, 24);
}

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

function issueSession(playerId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO session (token_hash, player_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(hash(token), playerId, now(), expires);
  return { token, expiresAt: expires };
}

function playerForToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT p.* FROM session s JOIN player p ON p.id = s.player_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(hash(token), now());
  return row || null;
}

function endSession(token) {
  if (token) db.prepare('DELETE FROM session WHERE token_hash = ?').run(hash(token));
}

// Express middleware. Everything below /me is friends data, so nothing reaches
// a handler without a live session.
function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const player = playerForToken(token);
  if (!player) return res.status(401).json({ error: 'sign_in_required' });
  req.player = player;
  req.sessionToken = token;
  return next();
}

module.exports = {
  verifyIdToken,
  findOrCreatePlayer,
  issueSession,
  playerForToken,
  endSession,
  requireAuth,
  cleanName,
  SESSION_DAYS,
};
