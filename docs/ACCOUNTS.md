# Accounts, friends and boards

Optional, additive, and off by default. Companion Quest works with no account,
no server and no network — that is still the normal way to play. Signing in adds
friends and leaderboards and takes nothing away.

## 1. The thing to understand first

A leaderboard is the first feature in this game that gives anyone a **reason** to
fake their numbers.

The founding rule is that real life is the game: there are no walk buttons, and
distance comes only from a pedometer or GPS. That rule survived this long
because nothing rewarded breaking it — `stats.distanceMi` sits in AsyncStorage
and has always been trivially editable, and the only person you could fool was
yourself. Point it at your friends and the app's central promise becomes a claim
it cannot back.

So the design starts there, not with the UI:

**The unit of sync is a DAY, never a lifetime total.** "I have walked 400 miles"
can only be believed or not. "On 2026-08-22 I walked 3.1 miles" can be checked —
against what a person can do in a day, and against what that same player said
yesterday. It also makes a sync idempotent: sending Tuesday twice leaves Tuesday
as it was, so a flaky connection cannot inflate anybody.

`server/validate.js` then refuses what is not possible:

| check | limit | why |
|---|---|---|
| distance in a day | 75 mi | 24h ultra records sit near 200; 75 is far above any player of a wellness game and far below a fabricated total |
| steps in a day | 150,000 | as above |
| steps vs distance | 1.2–6.0 ft per step | 40,000 steps and half a mile is not a walk, it is two numbers that did not come from the same legs |
| future days | 1 day of grace | a player ahead of the server in time zone is not cheating |
| editing the past | 14 days | a watch backfills; a board is not rewritten in March |

A flagged day is **kept** — the player's own history stays whole, and the server
does not get to edit someone's log — and left out of every board.

`source` travels with each day (`health` / `pedometer` / `reported`) and the
board says so, rather than averaging a measured week and a typed one into the
same indistinguishable column. The app has no manual distance entry at all
today; the field exists because that is exactly the sort of thing a later
feature changes quietly.

None of this is proof and it is not meant to be. It is the difference between a
board you can top by editing a JSON file and one you have to walk.

## 2. Privacy

One sentence: **you can see a person's numbers only if the two of you have both
agreed.**

It is enforced in one function, `friendIdsOf` in `server/friends.js`, and every
board is built from that list plus yourself. No handler assembles its own idea
of who is visible, because that is how "friends only" ends up true on one screen
and false on another.

- Friendship is stored **once per pair**, in a fixed order, with
  `CHECK (a_id < b_id)`. Two rows per friendship is how a relationship ends up
  accepted in one direction only.
- Only the person who did **not** ask can accept. Otherwise a requester could
  befriend anyone by accepting their own request.
- The code lookup returns a **name and an id, never numbers**. You learn who a
  code belongs to before you ask; you learn nothing about their training until
  they say yes.
- Nothing is stored from the identity provider but the subject id. No email, no
  name we did not ask for, no avatar.
- Deleting cascades. "Delete my account" means the days, the bests and the
  friendships are gone, not hidden.

What leaves the phone is **training only** — days, and the Forge's personal
bests. Not your companion, goal, bag, recipes, or where you were standing. The
friends screen shows the exact count of what it is about to send before you
agree to send it.

## 3. Accounts

Sign in with Apple or Google. The phone runs the provider's flow, comes back
holding an **ID token**, and sends it here once; `server/auth.js` verifies it
against the provider's live published keys and only then issues a session.

Two claims are easy to skip and fatal to:

- **`aud` must be our client id.** A token issued for a different app is a
  perfectly valid Google token. Accepting it lets that app's users — or its
  operator — sign in as anybody here.
- **`iss` must be the provider**, enforced against the JWKS issuer.

A server with no client id configured **refuses** that provider rather than
falling back to "any audience". A misconfigured server that accepts every token
is worse than one that accepts none.

No client secret anywhere: public mobile clients cannot keep one, so the flow
never uses one.

Sessions are opaque random tokens; only their SHA-256 is stored, so a stolen
database does not hand over live sessions. They last 90 days.

**Apple gives a name exactly once**, on first sign-in, and never again — so it
is passed with the token or lost for good. After that the player renames
themselves whenever they like.

## 4. Running it

The friends API lives on the **same** proxy as the Coach, so a player who has
configured one has configured both.

```bash
cd server
npm install
cp .env.example .env         # then fill in the ids below
npm start
```

| variable | what it does |
|---|---|
| `APPLE_CLIENT_ID` | your Apple service/bundle id. Comma-separated if more than one. |
| `GOOGLE_CLIENT_IDS` | every Google client id you ship — iOS, Android and web are different ids and all of them are legitimately "this app". |
| `ALLOWED_ORIGINS` | browsers only. A native app sends no Origin and is always allowed. `*` must be asked for by name. |
| `FRIENDS_DB` | where the SQLite file lives. Defaults beside the server. |
| `TRUST_PROXY` | set behind a reverse proxy, or every request looks like it came from the proxy and one busy player rate-limits everyone. |

Client side, in the app's environment:

| variable | what it does |
|---|---|
| `EXPO_PUBLIC_COACH_API_URL` | the proxy. Without it friends and boards are simply off, and both screens say so. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `..._ANDROID_...` / `..._WEB_...` | per platform. A button with nothing behind it is not drawn. |

### Safe by default

`preflight()` in `server/index.js` runs at boot and refuses configurations that
work fine on a laptop and are holes on a public host:

- `FRIENDS_TEST_AUTH=1` with `NODE_ENV=production` is a **hard stop**, exit 1.
  It signs in any caller as anyone.
- `ALLOWED_ORIGINS` containing `*` in production warns loudly.
- No provider configured in production warns that nobody can sign in.

### Testing it

```bash
npm --prefix server test          # token verification — no server needed
```

Nine checks that the verification actually rejects what it must. It mints its
own signing key, serves its own JWKS and issues tokens each wrong in one way:

| the token | must be |
|---|---|
| correctly signed, our audience | accepted |
| **minted for a different app** | refused |
| from a different issuer | refused |
| signed with somebody else's key | refused |
| expired | refused |
| no subject | refused |
| `alg: none` | refused |
| any token, provider unconfigured | refused **503**, not accepted |

The audience row is the one that matters and the easiest to get wrong: a token
from another app is a completely valid, correctly signed Google token. A server
that checks the signature and forgets `aud` accepts it, and then anybody who can
get a user to sign into their own unrelated app can sign in here as that user.

There is no test hook in the production path. `verifyWithConfig` takes its key
set and audience as arguments and the test passes its own — the difference
between a testable function and a back door.

```bash
rm -f /tmp/cq-test.db
FRIENDS_DB=/tmp/cq-test.db FRIENDS_TEST_AUTH=1 PORT=8788 \
  ANTHROPIC_API_KEY=unused node server/index.js &
npm --prefix server run test:friends
```

21 more checks, asserting the privacy rule from the outside over HTTP: a
stranger is invisible, a **pending** friend is invisible, you cannot accept your
own request, unfriending re-hides, a deleted account is really gone, and the
implausible-day checks fire.

`FRIENDS_TEST_AUTH` mounts a sign-in stub so this runs without real Apple or
Google credentials. It is refused when `NODE_ENV=production` and warns loudly at
boot — an ungated developer path into somebody's account is the one thing this
must not ship with.

## 5. What is not proven

**Only the provider handshakes** — `AppleAuthentication.signInAsync` and the
Google auth-session prompt. They need real client ids and a device, so they have
never run, and that is where to expect friction the first time you build to a
phone.

Everything else is tested, including the part that would actually let a stranger
into somebody's account: the token verification is exercised against real
signatures (§4), and sessions, sync, friendships and boards are exercised over
HTTP. The untested piece is "does the SDK hand us a token", not "do we check the
token".

### On the SQLite dependency

`better-sqlite3` ships **prebuilt binaries** and a clean `npm install` downloads
one rather than compiling — verified. It falls back to building from source only
on a platform or Node version with no prebuild, which is when build tools are
needed.

## 6. Where it lives

| file | what it is |
|---|---|
| `server/db.js` | schema. Players, sessions, days, records, friendships. |
| `server/validate.js` | what the server is willing to believe. |
| `server/auth.js` | provider token verification and sessions. |
| `server/friends.js` | friendships, and the board queries they gate. |
| `server/routes.js` | the HTTP surface. Rate limits live here. |
| `src/net/sync.js` | history → days, Forge records → bests. Pure, testable. |
| `src/net/api.js` | one place that carries the token and turns errors into sentences. |
| `src/net/signin.js` | getting an ID token, and reporting honestly when it cannot. |
| `src/state/account.js` | the session, under its own storage key, never in the save. |
| `src/screens/FriendsScreen.js` | consent: what is shared, with whom, how to stop. |
| `src/screens/BoardScreen.js` | the four boards. |

In the world: the noticeboard hangs on the front wall of Quest Fitness beside
reception (`G` in the gym grid). Cork with pinned cards, because that is the
honest object — a board of your friends' weeks is a few notes somebody put up,
not a stock ticker.
