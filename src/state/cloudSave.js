// The save follows the account.
//
// Signing in is what makes a journey durable: reinstall the app or pick up a
// new phone, sign back in, and your companion is where you left it. The rules
// are deliberately simple enough to state in two lines:
//
//   1. A device with a STARTED journey is the source of truth — it uploads.
//   2. The cloud copy only ever fills an EMPTY device. It never overwrites
//      progress you can see in your hand.
//
// So there is no merge, no conflict dialog, and no way for a stale phone in a
// drawer to eat this week's walks. Erasing your save (Options) and playing on
// erases the cloud copy too on the next push, because erase means erase.
//
// Everything here is best-effort and silent: the game has never needed a
// server, and a failed push must never cost a step. Reads the token straight
// from AsyncStorage (loadAccount) so game state stays uncoupled from any
// React account hook.

import { loadAccount } from './account';
import api from '../net/api';

// Pushes ride on the ordinary save-to-disk path, debounced hard: the reducer
// saves on every action, and uploading the whole blob every squat would be
// rude to a phone on trail data. One push soon after things settle, and at
// most one per minute while they keep changing.
const SETTLE_MS = 8000;
const MIN_GAP_MS = 60 * 1000;

let timer = null;
let lastPush = 0;
let pending = null;

async function push(state) {
  const acc = await loadAccount();
  if (!acc) return false;
  try {
    await api.putSave(acc.token, state);
    lastPush = Date.now();
    return true;
  } catch (e) {
    return false; // offline, signed out, misconfigured — all fine, all silent
  }
}

export function pushCloudSaveSoon(state) {
  if (!state || !state.started) return;
  pending = state;
  if (timer) return;
  const wait = Math.max(SETTLE_MS, MIN_GAP_MS - (Date.now() - lastPush));
  timer = setTimeout(() => {
    timer = null;
    const s = pending;
    pending = null;
    push(s);
  }, wait);
}

export function pushCloudSaveNow(state) {
  if (!state || !state.started) return Promise.resolve(false);
  return push(state);
}

// The restore half: what the account has stored, or null. Only worth acting
// on when the local save is not started — rule 2 above.
export async function pullCloudSave() {
  const acc = await loadAccount();
  if (!acc) return null;
  try {
    const out = await api.getSave(acc.token);
    return (out && out.save && out.save.started) ? out.save : null;
  } catch (e) {
    return null;
  }
}

export default { pushCloudSaveSoon, pushCloudSaveNow, pullCloudSave };
