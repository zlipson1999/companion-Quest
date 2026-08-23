# Shipping Companion Quest — the runbook

Everything in this file is the gap between "built and tested" and "someone
else can play it". Three parts: the server, the phone builds, and the paper.

## 1. The server (turns on: Coach chat, sign-in, cloud saves, friends, boards)

One small Node process serves all of it. It needs a machine that stays on
with a **persistent disk** — the SQLite file IS everyone's data. A $5 VPS
(Hetzner, DigitalOcean) is plenty; a serverless platform is wrong, because
those wipe the disk between runs.

```bash
# on the server
sudo useradd -r -m companionquest
sudo git clone https://github.com/zlipson1999/companion-Quest /opt/companion-quest
cd /opt/companion-quest/server && sudo -u companionquest npm install
sudo -u companionquest cp .env.example .env    # then fill it in — see below
```

`.env`, the parts that matter:

| variable | what it does |
|---|---|
| `ANTHROPIC_API_KEY` | turns the Coach's chat on. Stays here, never in the app. |
| `APPLE_CLIENT_ID` | your app's bundle id, once Apple sign-in exists ($99/yr developer account). |
| `GOOGLE_CLIENT_IDS` | every Google OAuth client id you ship — iOS, Android, web are three different ids and all are "this app". Free, from Google Cloud Console → Credentials. |
| `ALLOWED_ORIGINS` | browsers only (the Pages site's origin if you want web sign-in). Native apps send no Origin and always pass. |
| `TRUST_PROXY=1` | required behind Caddy/nginx, or the rate limiter sees one address for everyone. |
| `FRIENDS_DB` | where the SQLite file lives. Back this file up (below). |

Never set `FRIENDS_TEST_AUTH` here — the server refuses to boot with it in
production, on purpose.

**HTTPS**: `server/deploy/Caddyfile` — two lines, replace the domain, and
Caddy fetches and renews the certificate itself.

**Keep it alive**: `server/deploy/companionquest.service` — copy to systemd,
`systemctl enable --now companionquest`.

**Back it up** (the single highest-value line in this document):
`server/deploy/backup.sh` on a 3 a.m. cron keeps seven rotating daily copies
via SQLite's own `.backup`, which cannot tear a mid-write copy. Sync the
backup directory off the machine too if you can.

A provider with no client id configured is **refused**, not defaulted — until
the ids are in `.env` the sign-in buttons simply do not appear, and the game
plays exactly as it does today. Nothing breaks by deploying gradually.

## 2. Point the app at it

One variable turns everything on at once, set in the build environment:

```
EXPO_PUBLIC_COACH_API_URL=https://api.example.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...       # per-platform Google ids
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

For EAS builds these belong in `eas.json` under each profile's `env`, or in
EAS Secrets. For the Pages web build they would go in the workflow — but the
published web build deliberately ships without them today.

## 3. Real phone builds (TestFlight / Play internal testing)

`eas.json` is already in the repo with development / preview / production
profiles. From your machine:

```bash
npm install -g eas-cli
eas login                       # your Expo account
eas build --profile preview --platform android   # installable APK, no store
eas build --profile production --platform ios    # then: eas submit
```

- Android: the `preview` APK installs directly on any phone — the fastest way
  to hand a friend the game.
- iOS: `production` + `eas submit` puts it in TestFlight (needs the Apple
  developer account). Testers install from the TestFlight app.
- The pedometer needs the motion permission; both are declared in `app.json`
  and asked at first use.

## 4. The paper

- **Privacy policy** — required by Apple and Google the moment sign-in
  exists. The honest one-pager lives at `web/privacy.html`, published with
  the Pages site: `https://zlipson1999.github.io/companion-Quest/privacy.html`.
  Point both store listings and the OAuth consent screens at it.
- **Google OAuth consent screen** (Cloud Console) wants the policy URL and an
  app name; it can stay in "testing" mode with named testers until launch.

## Order that works

1. VPS + Caddy + systemd + backup cron (an afternoon, no accounts needed)
2. `ANTHROPIC_API_KEY` in `.env` → Coach chat is live
3. Google client ids (free) → `.env` + EAS env → sign-in and cloud saves live
4. `eas build --profile preview --platform android` → hand friends an APK
5. Apple developer account when you want iPhones: sign-in + TestFlight
