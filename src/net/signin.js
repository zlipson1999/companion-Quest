// Getting an ID token from Apple or Google.
//
// This file's whole job is to hand the server a token it can verify. It never
// decides who you are — the server does that, against the provider's published
// keys — so nothing here is trusted and nothing here needs a secret.
//
// Availability is not the same question as configuration, and the screen needs
// both. Sign in with Apple exists only on iOS and only on a device that has it;
// Google needs a client id for whichever platform the app is running on. A
// button that cannot work should not be drawn, so each provider reports
// honestly whether it can run right now.

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Required for the Google flow to hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IDS = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export function googleConfigured() {
  return !!(GOOGLE_IDS[Platform.OS] || GOOGLE_IDS.web);
}

export const googleConfig = {
  iosClientId: GOOGLE_IDS.ios,
  androidClientId: GOOGLE_IDS.android,
  webClientId: GOOGLE_IDS.web,
  // We want an ID TOKEN, not an access token: the server verifies a signature,
  // it does not call Google on your behalf and has no business being able to.
  responseType: 'id_token',
  scopes: ['openid', 'profile'],
};

export const useGoogleAuth = Google.useIdTokenAuthRequest;

export async function appleAvailable() {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (e) {
    return false;
  }
}

// Apple gives you a name ONCE, on the very first sign-in, and never again. If
// we do not take it here it is gone for good, so it is passed straight to the
// server with the token — after which the server keeps only what it was given
// and the player can rename themselves whenever they like.
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
  });
  const name = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
    : '';
  return { idToken: credential.identityToken, displayName: name || undefined };
}

export default { appleAvailable, signInWithApple, googleConfigured, useGoogleAuth, googleConfig };
