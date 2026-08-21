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
//     actions: [{ id, label, sublabel, amount, reward:{xp,bond,heal}, apply? }],
//       ...or actions(modState) -> [...] when they depend on the player's own
//       content (see ./forge, whose actions ARE the workout plans they wrote).
//     goalReward: { xp, bond },         // one-off bonus for hitting the goal
//     initialState?()                   // extra, non-daily fields the module owns
//     screen?: 'routeName'              // bring your own UI instead of the
//                                       // generic log screen
//     progress?(day), summary?(day), cheer?(day),
//   }
//
// Everything a module logs is paid out through the SAME progression the Route,
// battles and Workouts use, so a habit grows your companion exactly like a mile
// walked does.

import HYDRATION from './hydration';
import DIET from './diet';
import FORGE from './forge';
import SLEEP from './sleep';
import MEDITATION from './meditation';
import { applyLog, normalizeDay, progressFor, rollDay, todayKey } from './daily';

export const MODULES = [HYDRATION, DIET, FORGE, SLEEP, MEDITATION];

export const MODULE_IDS = MODULES.map((m) => m.id);

// Used when a module ships without art of its own.
export const FALLBACK_SPRITE = 'mod_check';

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}

// A module's actions may be a plain list or derived from its own state.
export function moduleActions(module, modState) {
  if (!module || !module.actions) return [];
  const list = typeof module.actions === 'function' ? module.actions(modState) : module.actions;
  return Array.isArray(list) ? list : [];
}

export function getModuleAction(module, actionId, modState) {
  return moduleActions(module, modState).find((a) => a.id === actionId) || null;
}

// Which screen opens when the module's hub card is tapped.
export function moduleScreen(module) {
  return (module && module.screen) || 'habit';
}

export function moduleSprite(module) {
  return (module && module.sprite) || FALLBACK_SPRITE;
}

// Read one module's state out of game state, day-rolled to today. Never returns
// null, so a module added after a save was written just starts at zero, and a
// screen can never render yesterday's counts as today's (the persisted reset
// still happens via MODULE_RESET_DAY / HYDRATE).
export function moduleStateFor(modules, moduleId, date) {
  const module = getModule(moduleId);
  return rollDay(withInitial(module, (modules || {})[moduleId]), date);
}

// A module may own fields beyond the daily counters (the Forge owns the
// player's saved plans). initialState() seeds them once; anything already
// stored wins, so this is safe to run on every read.
function withInitial(module, stored) {
  if (!module || typeof module.initialState !== 'function') return stored;
  return { ...module.initialState(), ...(stored || {}) };
}

// Normalize + day-roll every REGISTERED module. Modules that were uninstalled
// keep their stored state untouched so removing and re-adding one is lossless.
export function rollAllModules(modules, date) {
  const day = date || todayKey();
  const next = { ...(modules || {}) };
  MODULES.forEach((m) => {
    next[m.id] = rollDay(withInitial(m, next[m.id]), day);
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
  return applyLog(module, modState, getModuleAction(module, actionId, modState), date);
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
