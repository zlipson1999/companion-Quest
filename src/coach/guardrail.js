// Pre-send topical guardrail. Classifies each outgoing message BEFORE it is sent
// so blatantly off-domain or jailbreak messages are refused locally (no API
// call). The server re-checks and the system prompt is the final backstop — this
// is defense in depth and a snappy UX, not the only line of defense.

const DOMAIN = [
  'exercise', 'workout', 'work out', 'fitness', 'train', 'training', 'gym', 'cardio',
  'strength', 'muscle', 'rep', 'reps', 'set', 'sets', 'squat', 'push', 'pushup', 'push-up',
  'plank', 'lunge', 'situp', 'sit-up', 'crunch', 'burpee', 'jumping jack', 'high knee',
  'stretch', 'mobility', 'warm up', 'warm-up', 'cool down', 'cooldown', 'yoga', 'hiit',
  'run', 'running', 'jog', 'walk', 'walking', 'steps', 'mile', 'miles', 'km', 'pace',
  'weight', 'lift', 'lifting', 'core', 'abs', 'cardio', 'stamina', 'endurance',
  'protein', 'calorie', 'calories', 'carb', 'carbs', 'fat', 'nutrition', 'diet', 'eat',
  'eating', 'food', 'meal', 'meals', 'snack', 'breakfast', 'lunch', 'dinner', 'macro',
  'hydrate', 'hydration', 'water', 'drink', 'electrolyte',
  'sleep', 'rest', 'recovery', 'recover', 'sore', 'soreness', 'fatigue', 'tired', 'energy',
  'healthy', 'health', 'fit', 'stronger', 'motivation', 'motivate', 'habit', 'routine',
  'stress', 'breathe', 'breathing', 'posture', 'injury', 'pain', 'hurt', 'ache',
];

const GREETING = [
  'hi', 'hey', 'hello', 'yo', 'sup', 'thanks', 'thank you', 'thankyou', 'ok', 'okay',
  'cool', 'nice', 'yes', 'no', 'yeah', 'nope', 'help', 'who are you', 'what can you do',
  'how are you', 'good morning', 'good night', 'lol', 'haha', 'great', 'awesome',
];

const JAILBREAK =
  /\b(ignore|disregard|forget)\b.{0,20}\b(previous|prior|above|earlier|all|the|your)\b|system prompt|your instructions|reveal (your|the)|developer mode|jail\s?break|\bDAN\b|you are now|pretend (to|you|that|we)|role\s?-?play|act as\b|override|bypass/i;

export function classifyMessage(raw) {
  const text = (raw || '').trim();
  const lower = text.toLowerCase();
  if (!text) return { allowed: false, reason: 'empty' };

  if (JAILBREAK.test(lower)) return { allowed: false, reason: 'jailbreak' };

  if (DOMAIN.some((k) => lower.includes(k))) return { allowed: true, reason: 'domain' };

  // Short conversational messages / greetings are fine — let the model reply in
  // character. (Kept short so a long off-topic message without domain terms is
  // treated as off-domain.)
  if (lower.length <= 32 || GREETING.some((g) => lower.includes(g))) {
    return { allowed: true, reason: 'chitchat' };
  }

  return { allowed: false, reason: 'off-domain' };
}

export default classifyMessage;
