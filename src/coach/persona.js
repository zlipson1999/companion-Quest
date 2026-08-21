// Shared persona + domain config for the AI Companion Coach. The authoritative
// system prompt lives on the server (server/index.js); this mirrors the allowed
// domain and the warm refusal/redirect copy used by the client-side guardrail.

export const ALLOWED_DOMAIN =
  'fitness, exercise, workouts, movement, nutrition, hydration, sleep, recovery, and healthy habits';

export const REFUSAL_LINES = [
  "Let's keep our focus on training! Ask me anything about workouts, food, hydration, or recovery.",
  "That's outside my lane, buddy — I'm all about fitness, food, hydration, and rest. What are we working on today?",
  "Ha! I only know one thing: helping you live healthier. Ask me about movement, meals, water, or recovery!",
];

export const JAILBREAK_LINE =
  "Nice try! But I stay in character — I only coach fitness, food, hydration, and recovery. So... what are we training today?";

export function refusal() {
  return REFUSAL_LINES[Math.floor(Math.random() * REFUSAL_LINES.length)];
}

export function greeting(companionName) {
  return `Hey, it's ${companionName}! I'm your coach for anything fitness, food, hydration, or recovery. What's on your mind today?`;
}

export default { ALLOWED_DOMAIN, REFUSAL_LINES, JAILBREAK_LINE, refusal, greeting };
