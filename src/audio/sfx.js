// Sound manager for Companion Quest. Loads original 8-bit SFX + chiptune loops
// and plays them via expo-av. Everything is wrapped so a load/playback failure
// (e.g. on web, or before assets finish loading) degrades silently instead of
// crashing the game.

import { Audio } from 'expo-av';

const SFX_SOURCES = {
  blip: require('../../assets/sfx/blip.wav'),
  cursor: require('../../assets/sfx/cursor.wav'),
  confirm: require('../../assets/sfx/confirm.wav'),
  cancel: require('../../assets/sfx/cancel.wav'),
  encounter: require('../../assets/sfx/encounter.wav'),
  hit: require('../../assets/sfx/hit.wav'),
  lowhp: require('../../assets/sfx/lowhp.wav'),
  victory: require('../../assets/sfx/victory.wav'),
  levelup: require('../../assets/sfx/levelup.wav'),
  evolve: require('../../assets/sfx/evolve.wav'),
  item: require('../../assets/sfx/item.wav'),
  heal: require('../../assets/sfx/heal.wav'),
  milestone: require('../../assets/sfx/milestone.wav'),
  catch: require('../../assets/sfx/catch.wav'),
  noticeboard: require('../../assets/sfx/noticeboard.wav'),
  board_tab: require('../../assets/sfx/board_tab.wav'),
  board_update: require('../../assets/sfx/board_update.wav'),
  friend_request: require('../../assets/sfx/friend_request.wav'),
  friend_accept: require('../../assets/sfx/friend_accept.wav'),
};

const BGM_SOURCES = {
  town: require('../../assets/sfx/bgm_town.wav'),
  battle: require('../../assets/sfx/bgm_battle.wav'),
};

const sfx = {};
let bgm = {};
let currentBgm = null;
let ready = false;
let muted = false;
let bgmMuted = false;

export async function initAudio() {
  if (ready) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
    await Promise.all(
      Object.entries(SFX_SOURCES).map(async ([name, src]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(src, { volume: 0.9 });
          sfx[name] = sound;
        } catch (e) {}
      })
    );
    await Promise.all(
      Object.entries(BGM_SOURCES).map(async ([name, src]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(src, { volume: 0.5, isLooping: true });
          bgm[name] = sound;
        } catch (e) {}
      })
    );
    ready = true;
  } catch (e) {
    ready = false;
  }
}

export function setMuted(value) {
  muted = !!value;
  if (muted) stopBgm();
}
export function isMuted() {
  return muted;
}
export function setBgmMuted(value) {
  bgmMuted = !!value;
  if (bgmMuted) stopBgm();
}
export function isBgmMuted() {
  return bgmMuted;
}

export async function playSfx(name) {
  if (muted || !ready) return;
  const sound = sfx[name];
  if (!sound) return;
  try {
    await sound.replayAsync();
  } catch (e) {}
}

export async function playBgm(name) {
  if (!ready || muted || bgmMuted) return;
  if (currentBgm === name) return;
  await stopBgm();
  const track = bgm[name];
  if (!track) return;
  try {
    await track.setPositionAsync(0);
    await track.playAsync();
    currentBgm = name;
  } catch (e) {}
}

export async function stopBgm() {
  const name = currentBgm;
  currentBgm = null;
  if (!name) return;
  const track = bgm[name];
  if (!track) return;
  try {
    await track.stopAsync();
  } catch (e) {}
}

export async function unloadAudio() {
  try {
    await Promise.all(Object.values(sfx).map((s) => s.unloadAsync()));
    await Promise.all(Object.values(bgm).map((s) => s.unloadAsync()));
  } catch (e) {}
  ready = false;
  currentBgm = null;
}
