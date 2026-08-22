// Does the token check actually reject what it should?
//
// The provider handshakes cannot be run here — Sign in with Apple needs an
// iPhone and a real service id. But the handshake is not the part that would
// let a stranger into somebody's account: the VERIFICATION is. So this mints
// its own signing key, serves its own JWKS, and issues tokens that are wrong in
// one specific way each, then checks the server refuses them.
//
// The audience case is the one that matters most and is the easiest to get
// wrong. An ID token from a DIFFERENT app is a completely valid, correctly
// signed Google token. A server that checks the signature and forgets `aud`
// will happily accept it — and then anyone who can get a user to sign into
// their own unrelated app can sign in here as that user.
//
//   node server/test/auth.test.js

const http = require('http');
const { exportJWK, generateKeyPair, SignJWT, createRemoteJWKSet } = require('jose');
const { verifyWithConfig } = require('../auth');

const ISSUER = 'https://issuer.test';
const OURS = 'com.companionquest.app';

let pass = 0;
let fail = 0;
const say = (ok, label, extra = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? '  ' + extra : ''}`);
  if (ok) pass += 1; else fail += 1;
};

// Expect the call to be refused, and to be refused for the right reason.
async function refuses(label, fn, wantStatus = 401) {
  try {
    await fn();
    say(false, label, 'ACCEPTED IT');
  } catch (err) {
    say(err.status === wantStatus, label, `${err.status} ${err.message}`);
  }
}

(async () => {
  const ours = await generateKeyPair('RS256');
  const theirs = await generateKeyPair('RS256');   // somebody else's key entirely

  const jwk = { ...(await exportJWK(ours.publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((r) => server.listen(0, r));
  const jwksUrl = `http://127.0.0.1:${server.address().port}/keys`;

  const cfg = {
    jwks: createRemoteJWKSet(new URL(jwksUrl)),
    issuer: ISSUER,
    audience: () => [OURS],
  };
  // A server that was never given a client id for this provider.
  const unconfigured = { ...cfg, audience: () => [] };

  const mint = ({ key = ours.privateKey, iss = ISSUER, aud = OURS, sub = 'user-1', exp = '5m', kid = 'test-key' } = {}) =>
    new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid })
      .setIssuer(iss)
      .setAudience(aud)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(key);

  // The happy path, so the rest of the failures mean something.
  const good = await mint();
  const sub = await verifyWithConfig(cfg, good);
  say(sub === 'user-1', 'a correctly signed token for our audience is accepted', sub);

  // THE important one.
  await refuses(
    'a token minted for a DIFFERENT app is refused',
    async () => verifyWithConfig(cfg, await mint({ aud: 'com.someone-else.app' }))
  );

  await refuses(
    'a token from a different issuer is refused',
    async () => verifyWithConfig(cfg, await mint({ iss: 'https://evil.test' }))
  );

  await refuses(
    'a token signed with another key is refused',
    async () => verifyWithConfig(cfg, await mint({ key: theirs.privateKey }))
  );

  await refuses(
    'an expired token is refused',
    async () => verifyWithConfig(cfg, await mint({ exp: '-1m' }))
  );

  await refuses(
    'a token with no subject is refused',
    async () => {
      const t = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuer(ISSUER).setAudience(OURS).setIssuedAt().setExpirationTime('5m')
        .sign(ours.privateKey);
      return verifyWithConfig(cfg, t);
    }
  );

  await refuses('a garbage token is refused', () => verifyWithConfig(cfg, 'not.a.token'));

  // An unsigned token whose header CLAIMS no algorithm — the classic. jose
  // refuses it, but a server that decoded instead of verifying would not.
  await refuses(
    'an alg:none token is refused',
    () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify({
        iss: ISSUER, aud: OURS, sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 300,
      })).toString('base64url');
      return verifyWithConfig(cfg, `${header}.${body}.`);
    }
  );

  // A provider with no client id must REFUSE, not fall through to accepting
  // anything. 503, because it is the server that is wrong, not the caller.
  await refuses(
    'an unconfigured provider refuses instead of accepting anything',
    () => verifyWithConfig(unconfigured, good),
    503
  );

  server.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
