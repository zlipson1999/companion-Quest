// Your account, which is NOT part of your game.
//
// Stored under its own AsyncStorage key on purpose. The two have different
// lifetimes and it would be wrong to tie them together in either direction:
// starting a new journey should not sign you out of an account your friends can
// see, and signing out should certainly not delete your companion.
//
// Everything here is optional. Companion Quest works with no account, no
// server and no network — that is the normal way to play. Signing in adds
// friends and boards and takes nothing away.

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { ApiError, configured } from '../net/api';
import { syncPayload } from '../net/sync';

const KEY = 'companionquest:account:v1';

export async function loadAccount() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !saved.token) return null;
    // A token past its date is not worth a round trip to be told so.
    if (saved.expiresAt && Date.parse(saved.expiresAt) < Date.now()) return null;
    return saved;
  } catch (e) {
    return null;
  }
}

export async function saveAccount(account) {
  if (!account) return AsyncStorage.removeItem(KEY);
  return AsyncStorage.setItem(KEY, JSON.stringify(account));
}

// One hook the screens share, so there is a single copy of "am I signed in".
export function useAccount() {
  const [account, setAccount] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    loadAccount().then((a) => {
      if (!alive) return;
      setAccount(a);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const remember = useCallback(async (next) => {
    await saveAccount(next);
    setAccount(next);
  }, []);

  // Any call can come back "you are signed out" — a session expired, or the
  // account was deleted on another device. Handle it once, here, rather than
  // leaving each screen to notice.
  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await saveAccount(null);
        setAccount(null);
      }
      setError(err.message || 'Something went wrong.');
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(
    (provider, idToken, displayName) =>
      run(async () => {
        const out = await api.signIn(provider, idToken, displayName);
        const next = { token: out.token, expiresAt: out.expiresAt, me: out.me };
        await remember(next);
        return next;
      }),
    [run, remember]
  );

  const signOut = useCallback(
    () => run(async () => {
      // Best effort: if the server cannot be reached the local session still
      // goes, because a person tapping "sign out" wants to be signed out.
      try { if (account) await api.signOut(account.token); } catch (e) { /* offline */ }
      await remember(null);
      return true;
    }),
    [run, remember, account]
  );

  const forget = useCallback(
    () => run(async () => {
      if (account) await api.deleteAccount(account.token);
      await remember(null);
      return true;
    }),
    [run, remember, account]
  );

  const push = useCallback(
    (state, opts) => run(async () => {
      if (!account) return null;
      return api.sync(account.token, syncPayload(state, opts));
    }),
    [run, account]
  );

  return useMemo(
    () => ({
      account,
      me: account ? account.me : null,
      token: account ? account.token : null,
      signedIn: !!account,
      available: configured(),
      ready,
      busy,
      error,
      clearError: () => setError(null),
      signIn,
      signOut,
      forget,
      push,
      run,
      setAccount: remember,
    }),
    [account, ready, busy, error, signIn, signOut, forget, push, run, remember]
  );
}

export default useAccount;
