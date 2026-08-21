// Persistence via AsyncStorage. The whole game state is one JSON blob. Saves
// are best-effort and never throw into the UI.

import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = 'companionquest:save:v1';

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
    await AsyncStorage.removeItem(SAVE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

export default { loadGame, saveGame, clearGame };
