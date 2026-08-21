# Companion Quest — Coach Proxy (Phase 2)

A tiny backend so your **Anthropic API key never ships in the mobile app**. The
app sends the chat history here; this server applies the domain guardrail + the
domain-locked, jailbreak-resistant system prompt, calls Claude, and returns only
the reply.

## Setup

```bash
cd server
npm install
cp .env.example .env        # then edit .env and paste your ANTHROPIC_API_KEY
npm start                   # -> http://localhost:8787
```

`.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
COACH_MODEL=claude-opus-5   # optional; claude-haiku-4-5 is cheaper/faster
PORT=8787                   # optional
```

## Point the app at it

The app reads the proxy URL from `EXPO_PUBLIC_COACH_API_URL`. From the project
root:

```bash
# iOS simulator / web can use localhost:
EXPO_PUBLIC_COACH_API_URL=http://localhost:8787 npx expo start

# On a real phone (Expo Go), use your computer's LAN IP so the phone can reach it:
EXPO_PUBLIC_COACH_API_URL=http://192.168.1.42:8787 npx expo start
```

Then open **Coach** from the town menu and chat. Without this URL set, the Coach
screen still runs — the guardrail and persona work — but instead of a live reply
it tells you the coach server isn't connected.

## What the server enforces

- **Domain lock:** the system prompt restricts the coach to fitness, exercise,
  nutrition, hydration, sleep/recovery, and motivation — and to warmly refuse +
  redirect anything else.
- **Jailbreak resistance:** user text is treated as untrusted; a server-side
  filter short-circuits obvious "ignore your instructions / developer mode /
  roleplay" attempts before the model is even called, and the system prompt is
  the backstop.
- **No medical advice:** injuries/medical concerns are referred to a
  professional.

Endpoints: `POST /chat` (`{ messages, companionName, goalName }` → `{ reply }`),
`GET /health`.
