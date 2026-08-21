// The life-module registry.
//
// A "life module" is any real-life habit that should grow your companion. Each
// one is a plain object with the same shape (see ./hydration.js for the
// reference implementation); dropping a new file in this folder and adding it
// to MODULES below is the entire install step — no reducer, screen or router
// change required.
//
//   {
//     id, name, tagline, blurb,
//     sprite, spritePalette, color, unit,
//     dailyGoal,                        // today's target, in `unit`
//     actions: [{ id, label, sublabel, amount, reward:{xp,bond}, apply? }],
//     goalReward: { xp, bond },         // one-off bonus for hitting the goal
//     progress?(day), summary?(day), cheer?(day),
//   }
//
// Everything a module logs is paid out through the SAME progression the Route,
// battles and Workouts use, so a habit grows your companion exactly like a mile
// walked does.

import HYDRATION from './hydration';
import DIET from './diet';
import { applyLog, normalizeDay, progressFor, rollDay, todayKey } from './daily';

export const MODULES = [HYDRATION, DIET];

export const MODULE_IDS = MODULES.map((m) => m.id);

// Used when a module ships without art of its own.
export const FALLBACK_SPRITE = 'mod_check';

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}

export function getModuleAction(module, actionId) {
  if (!module || !module.actions) return null;
  return module.actions.find((a) => a.id === actionId) || null;
}

export function moduleSprite(module) {
  return (module && module.sprite) || FALLBACK_SPRITE;
}

// Read one module's state out of game state, normalized. Never returns null, so
// a module added after a save was written just starts at zero.
export function moduleStateFor(modules, moduleId) {
  return normalizeDay((modules || {})[moduleId]);
}

// Normalize + day-roll every REGISTERED module. Modules that were uninstalled
// keep their stored state untouched so removing and re-adding one is lossless.
export function rollAllModules(modules, date) {
  const day = date || todayKey();
  const next = { ...(modules || {}) };
  MODULES.forEach((m) => {
    next[m.id] = rollDay(next[m.id], day);
  });
  return next;
}

// True when any registered module is still sitting on a stale day (the app was
// left open past midnight). The Habits screens use this to self-heal.
export function modulesNeedRoll(modules, date) {
  const day = date || todayKey();
  return MODULES.some((m) => moduleStateFor(modules, m.id).date !== day);
}

// Pure preview/apply of a log. Shared by the reducer and the log screen so the
// numbers the player is shown are the numbers that get banked.
export function logModuleAction(module, modState, actionId, date) {
  return applyLog(module, modState, getModuleAction(module, actionId), date);
}

export function moduleProgress(module, modState) {
  return progressFor(module, normalizeDay(modState));
}

export function moduleSummary(module, modState) {
  const day = normalizeDay(modState);
  if (typeof module.summary === 'function') return module.summary(day);
  const prog = progressFor(module, day);
  return `${prog.value} / ${prog.goal} ${module.unit || ''}`.trim();
}

export function moduleCheer(module, modState) {
  const day = normalizeDay(modState);
  if (typeof module.cheer === 'function') return module.cheer(day);
  return 'Logged it. Real life, real progress.';
}

export { todayKey, rollDay, normalizeDay, progressFor, applyLog } from './daily';

export default MODULES;
