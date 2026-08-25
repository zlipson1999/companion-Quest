// What the Coach is allowed to know about you.
//
// Until now the one real LLM in the app was blind: it could talk about training
// in general but had no idea whether you had trained. "You've hit hydration six
// days running but haven't touched legs in two weeks" is a sentence only it can
// say, and it needs the facts to say it.
//
// This builds a small, factual, human-readable brief — no raw state dumps, no
// identifiers, nothing beyond the fitness data the player generated themselves.
// It goes to the player's own proxy, which is where the API key already lives.

import { MODULES, moduleProgress, moduleStateFor } from '../modules';
import { computeRecovery } from '../state/recovery';
import { lastDays, totals, isActive } from '../state/history';
import { todayKey } from '../modules/daily';
import { getMovement } from '../data/movements';
import { MUSCLES, MUSCLE_IDS } from '../data/muscles';

const RECENT_DAYS = 14;
const STALE_MUSCLE_DAYS = 14;

export function buildCoachContext(state, companion) {
  if (!state || !state.started) return null;
  const today = todayKey();
  const lines = [];

  if (companion) {
    lines.push(`Companion: ${companion.creature.name}, level ${companion.level}, bond ${companion.bond}.`);
  }

  // --- habits: today plus the streak, which is what they will ask about ---
  const habits = MODULES.map((m) => {
    const st = moduleStateFor(state.modules, m.id, today);
    const p = moduleProgress(m, st);
    return `${m.name} ${p.value}/${p.goal} ${m.unit} today${st.streak ? `, ${st.streak}-day streak` : ''}${p.done ? ' (goal met)' : ''}`;
  });
  lines.push(`Today's habits: ${habits.join('; ')}.`);

  // --- the last two weeks in numbers ---
  const recent = lastDays(state.history, today, RECENT_DAYS);
  const t = totals(recent);
  lines.push(
    `Last ${RECENT_DAYS} days: ${t.activeDays} active days, ${t.restDays} logged rest days, ` +
      `${t.sessions + t.workouts} workouts, ${Math.round(t.distanceMi * 10) / 10} total miles` +
      `${t.cyclingMi ? ` (${Math.round(t.cyclingMi * 10) / 10} cycled)` : ''}, ` +
      `${t.habitLogs} habit logs.`
  );

  // --- recovery, stated plainly so it can act on it ---
  const rec = computeRecovery(state.history, today);
  lines.push(
    `Recovery: ${rec.headline.toLowerCase()} — ${rec.streak} consecutive active days, ` +
      `7-day training load ${rec.acute} against a usual ${rec.chronic}` +
      `${rec.needsRest ? '. THIS PLAYER IS DUE A REST DAY.' : '.'}`
  );

  // --- the Forge: what they actually train, and what they are neglecting ---
  const forge = moduleStateFor(state.modules, 'forge', today);
  const log = forge.log || [];
  if (log.length) {
    lines.push(
      `Recent sessions: ${log
        .slice(0, 6)
        .map((e) => `${e.name} (${e.date}, ${e.sets} sets${e.partial ? ', partial' : ''})`)
        .join(', ')}.`
    );
    // The neglect claim reads the WHOLE log, not the six most recent sessions —
    // a frequent trainer was being told they neglect muscles they trained days
    // ago, and the Coach then stated it as fact.
    const stale = neglectedMuscles(log, today);
    if (stale.length) {
      lines.push(`Not trained in ${STALE_MUSCLE_DAYS} days: ${stale.map((id) => MUSCLES[id].name).join(', ')}.`);
    }
  } else {
    lines.push('No workout sessions logged yet.');
  }

  const plans = (forge.plans || []).map((p) => p.name);
  if (plans.length) lines.push(`Saved workout plans: ${plans.join(', ')}.`);

  return lines.join('\n');
}

// Muscle groups no logged session has touched inside the window. Only meaningful
// once there is something logged, so an empty log reports nothing rather than
// claiming the player neglects their entire body.
export function neglectedMuscles(log, today) {
  if (!log || !log.length) return [];
  const cutoff = new Date(today + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - STALE_MUSCLE_DAYS);
  const touched = new Set();
  let inWindow = 0;
  log.forEach((e) => {
    if (new Date(e.date + 'T00:00:00') < cutoff) return;
    inWindow += 1;
    (e.blocks || []).forEach((b) => {
      const mv = getMovement(b.movementId);
      if (!mv) return;
      // Secondary work is still work: a movement that hits the core hard as a
      // stabiliser should not leave the core reading as untrained.
      [...(mv.primary || []), ...(mv.secondary || [])].forEach((m) => touched.add(m));
    });
  });
  // Nothing logged inside the window means "no recent data", not "neglects
  // everything" — saying the latter would be a confident falsehood.
  if (!inWindow) return [];
  return MUSCLE_IDS.filter((id) => !touched.has(id));
}

// A short, grounded opener for the chat, used with or without the server.
export function groundedGreeting(state, companion) {
  const name = companion ? companion.creature.name : 'your companion';
  if (!state || !state.started) return `Hey! I'm ${name}. Ask me anything about training, food, hydration or recovery.`;
  const rec = computeRecovery(state.history, todayKey());
  if (rec.needsRest) return `Hey. Before anything else — ${rec.streak} days straight is a lot. What would make today an easy one?`;
  const recent = lastDays(state.history, todayKey(), 7);
  const active = recent.filter(isActive).length;
  if (!active) return `Good to see you. Nothing logged this week yet — want to pick something small to start with?`;
  return `Hey! ${active} active ${active === 1 ? 'day' : 'days'} this week. What are we working on?`;
}

export default buildCoachContext;
