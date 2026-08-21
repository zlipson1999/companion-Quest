// Client for the coach proxy. Never contains an API key — it only talks to the
// backend at COACH_API_URL, which holds the key.

import { COACH_API_URL } from '../config';

export function isCoachConfigured() {
  return !!COACH_API_URL;
}

export async function sendCoachMessage({ messages, companionName, goalName }) {
  if (!COACH_API_URL) {
    return {
      ok: false,
      reply:
        "I'm ready to chat, but the coach server isn't connected yet. See server/README.md to enable live replies — then set EXPO_PUBLIC_COACH_API_URL.",
    };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${COACH_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, companionName, goalName }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, reply: 'The coach is catching its breath. Try again in a moment.' };
    }
    const data = await res.json();
    return { ok: true, reply: data.reply || 'Let\'s keep our focus on training!', refused: !!data.refused };
  } catch (e) {
    return { ok: false, reply: 'Could not reach the coach server. Check that it\'s running and reachable from your device.' };
  }
}

export default sendCoachMessage;
