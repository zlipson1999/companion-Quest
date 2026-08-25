// Persistence via AsyncStorage. The whole game state is one JSON blob. Saves
// are best-effort and never throw into the UI.

import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = 'companionquest:save:v1';
const CARDIO_DRAFT_KEY = 'companionquest:cardio-draft:v1';

export async function loadGame() {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function saveGame(state) {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export async function clearGame() {
  try {
    await Promise.all([
      AsyncStorage.removeItem(SAVE_KEY),
      AsyncStorage.removeItem(CARDIO_DRAFT_KEY),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

export async function loadCardioDraft() {
  try {
    const raw = await AsyncStorage.getItem(CARDIO_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveCardioDraft(draft) {
  try {
    await AsyncStorage.setItem(CARDIO_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch (e) {
    return false;
  }
}

export async function clearCardioDraft() {
  try {
    await AsyncStorage.removeItem(CARDIO_DRAFT_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

export default {
  loadGame, saveGame, clearGame, loadCardioDraft, saveCardioDraft, clearCardioDraft,
};
