// Exercise the friends API against a running server.
//
// The privacy rule — you see a person's numbers only if you have BOTH agreed —
// is the kind of thing that is true when written and false three commits later,
// so it is asserted from the outside, over HTTP, the way a client would hit it.
//
//   rm -f /tmp/cq-test.db
//   FRIENDS_DB=/tmp/cq-test.db FRIENDS_TEST_AUTH=1 PORT=8788 \
//     ANTHROPIC_API_KEY=unused node server/index.js &
//   node server/test/friends.test.js
//
// FRIENDS_TEST_AUTH mounts a sign-in stub so this runs without real Apple or
// Google credentials. It is refused in production and warns loudly at boot.
const BASE = 'http://localhost:8788';

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, json };
};

const say = (ok, label, extra = '') =>
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? '  ' + extra : ''}`);

(async () => {
  // Three players sign in via the test-only stub.
  const who = {};
  for (const name of ['Ada', 'Rowan', 'Stranger']) {
    const r = await call('POST', '/auth/test', { body: { sub: name.toLowerCase(), displayName: name } });
    who[name] = r.json;
    say(r.status === 200 && r.json.token, `${name} signs in`, r.json && r.json.me && r.json.me.code);
  }

  // No token, no data.
  say((await call('GET', '/friends')).status === 401, 'no token is rejected');
  say((await call('GET', '/board/distance', { token: 'nonsense' })).status === 401, 'a bogus token is rejected');

  // Each pushes a week of days.
  const days = (miles, workouts) => {
    const out = [];
    for (let i = 0; i < 5; i += 1) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ date: d, steps: Math.round(miles * 2000), distanceMi: miles, workouts,
                 sets: workouts * 3, reps: workouts * 30, holdSec: 0, active: 1, source: 'pedometer' });
    }
    return out;
  };
  await call('POST', '/sync', { token: who.Ada.token, body: { days: days(3, 1),
    records: [{ movementId: 'back_squat', kind: 'load', amount: 5, weight: 185, sets: 1, achievedOn: new Date().toISOString().slice(0,10) }] } });
  await call('POST', '/sync', { token: who.Rowan.token, body: { days: days(2, 2),
    records: [{ movementId: 'back_squat', kind: 'load', amount: 3, weight: 225, sets: 1, achievedOn: new Date().toISOString().slice(0,10) }] } });
  await call('POST', '/sync', { token: who.Stranger.token, body: { days: days(99, 1) } });

  // A stranger's numbers must not appear on anyone's board.
  let b = await call('GET', '/board/distance', { token: who.Ada.token });
  say(b.json.rows.length === 1 && b.json.rows[0].you, 'before friending, Ada sees only herself',
      `rows=${b.json.rows.length}`);

  // Ada asks Rowan; nothing is visible until he accepts.
  const req = await call('POST', '/friends/request', { token: who.Ada.token, body: { code: who.Rowan.me.code } });
  say(req.json.state === 'pending', 'request is pending');
  b = await call('GET', '/board/distance', { token: who.Ada.token });
  say(b.json.rows.length === 1, 'a PENDING friend is still invisible', `rows=${b.json.rows.length}`);

  // Requester cannot accept their own request.
  const self = await call('POST', '/friends/accept', { token: who.Ada.token, body: { id: who.Rowan.me.id } });
  say(self.status === 400, 'you cannot accept your own request', self.json && self.json.error);

  await call('POST', '/friends/accept', { token: who.Rowan.token, body: { id: who.Ada.me.id } });
  b = await call('GET', '/board/distance', { token: who.Ada.token });
  say(b.json.rows.length === 2, 'after accepting, both appear', b.json.rows.map(r => `${r.name} ${r.display}`).join(' / '));
  say(b.json.rows[0].name === 'Ada', 'ordered by value', `top=${b.json.rows[0].display}`);

  // The stranger still cannot see them, nor they the stranger.
  const sb = await call('GET', '/board/distance', { token: who.Stranger.token });
  say(sb.json.rows.length === 1 && sb.json.rows[0].you, 'the stranger sees only themselves');
  say(!b.json.rows.some(r => r.name === 'Stranger'), 'the stranger is absent from their board');

  // Records board is friends-only too, and sorts by weight.
  const rec = await call('GET', '/records', { token: who.Ada.token });
  const squat = rec.json.movements.find(m => m.movementId === 'back_squat');
  say(squat && squat.entries.length === 2, 'PR board shows both friends', squat && squat.entries.map(e => `${e.name} ${e.weight}x${e.amount}`).join(' / '));
  say(squat && squat.entries[0].name === 'Rowan', 'heaviest lift first');

  // Implausible data.
  const bad = await call('POST', '/sync', { token: who.Ada.token, body: { days: [
    { date: new Date().toISOString().slice(0,10), steps: 4000, distanceMi: 400, active: 1, source: 'pedometer' },
  ] } });
  say(bad.json.flagged && bad.json.flagged.length === 1, 'a 400-mile day is flagged', JSON.stringify(bad.json.flagged));
  const future = await call('POST', '/sync', { token: who.Ada.token, body: { days: [
    { date: '2099-01-01', distanceMi: 5, active: 1 },
  ] } });
  say(future.json.rejected.length === 1, 'a future day is rejected', JSON.stringify(future.json.rejected));
  const mismatch = await call('POST', '/sync', { token: who.Ada.token, body: { days: [
    { date: new Date(Date.now() - 6*86400000).toISOString().slice(0,10), steps: 40000, distanceMi: 0.5, active: 1 },
  ] } });
  say(mismatch.json.flagged.length === 1, 'steps that disagree with distance are flagged',
      JSON.stringify(mismatch.json.flagged));

  // Flagged days must not count toward the board.
  b = await call('GET', '/board/distance', { token: who.Ada.token });
  say(b.json.rows.find(r => r.you).value < 100, 'the flagged day is left out of the total',
      `Ada=${b.json.rows.find(r => r.you).display}`);

  // Unfriending hides again.
  await call('DELETE', `/friends/${who.Rowan.me.id}`, { token: who.Ada.token });
  b = await call('GET', '/board/distance', { token: who.Ada.token });
  say(b.json.rows.length === 1, 'unfriending hides them again');

  // Account deletion really deletes.
  await call('DELETE', '/me', { token: who.Stranger.token });
  say((await call('GET', '/me', { token: who.Stranger.token })).status === 401, 'deleted account cannot sign back in with the old token');
})();
