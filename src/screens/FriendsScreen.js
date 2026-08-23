// Signing in, and who can see your training.
//
// The whole account exists to answer one question — who is allowed to see your
// numbers — so this screen is mostly about consent: what gets shared, with
// whom, and how to take it back. Signing out and deleting are both one tap from
// here, and neither touches your game.
//
// Chrome is the Trailkeeper set (ObjectiveRibbon, FieldCard, TrailAction).
// Friends stays off the six-item hub menu; you walk to the noticeboard or
// open this from there. See the boards opens the same cork BoardScreen.

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Screen, PixelText, FieldCard, TrailAction, ObjectiveRibbon } from '../components';
import { space, tokens, scale } from '../theme';
import { useGame } from '../state';
import { useAccount } from '../state/account';
import { useNav } from './navContext';
import api from '../net/api';
import { syncPayload } from '../net/sync';
import { appleAvailable, signInWithApple, googleConfigured, useGoogleAuth, googleConfig } from '../net/signin';
import { playSfx } from '../audio';

// Google's hook THROWS if no client id is configured for the platform it is
// running on — not a warning, an exception that takes the whole screen white.
// Hooks cannot be called conditionally, so the button that needs it is its own
// component and simply is not mounted when there is nothing for it to use.
function GoogleButton({ onToken, disabled }) {
  const [, response, prompt] = useGoogleAuth(googleConfig);

  // Google answers through the response object rather than the promise, so the
  // sign-in finishes here rather than at the tap.
  useEffect(() => {
    if (response && response.type === 'success') {
      const idToken = response.params && response.params.id_token;
      if (idToken) onToken(idToken);
    }
  }, [response]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TrailAction
      label="Sign in with Google"
      tone="primary"
      disabled={disabled}
      onPress={() => { playSfx('confirm'); prompt(); }}
      style={{ marginTop: space.sm }}
    />
  );
}

function Line({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
      <PixelText size="tiny" color={tokens.textOnPaperDim}>{label}</PixelText>
      <PixelText size="tiny" color={tokens.textOnPaper}>{value}</PixelText>
    </View>
  );
}

export default function FriendsScreen() {
  const { state } = useGame();
  const { goBack, back, navigate } = useNav();
  const acc = useAccount();
  const [friends, setFriends] = useState([]);
  const [code, setCode] = useState('');
  const [note, setNote] = useState(null);
  const [appleOk, setAppleOk] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { appleAvailable().then(setAppleOk); }, []);

  const refresh = useCallback(async () => {
    if (!acc.signedIn) return;
    const out = await acc.run(() => api.friends(acc.token));
    if (out) setFriends(out.friends || []);
  }, [acc]);

  useEffect(() => { refresh(); }, [acc.signedIn]);   // eslint-disable-line react-hooks/exhaustive-deps

  const onApple = async () => {
    playSfx('confirm');
    try {
      const { idToken, displayName } = await signInWithApple();
      if (idToken) await acc.signIn('apple', idToken, displayName);
    } catch (e) {
      // A cancelled sign-in is not an error worth shouting about.
      if (e && e.code !== 'ERR_REQUEST_CANCELED') setNote('That sign-in did not finish.');
    }
  };

  const share = async () => {
    playSfx('confirm');
    const out = await acc.push(state);
    if (out) {
      const flagged = (out.flagged || []).length;
      setNote(
        flagged
          ? `Shared. ${flagged} day${flagged === 1 ? '' : 's'} looked impossible and were left off the boards.`
          : 'Shared with your friends.'
      );
    }
  };

  const add = async () => {
    const out = await acc.run(() => api.addFriend(acc.token, code));
    if (out) {
      playSfx(out.state === 'accepted' ? 'friend_accept' : 'friend_request');
      setCode('');
      setNote(
        out.state === 'accepted'
          ? `You and ${out.player.name} are connected.`
          : `Asked ${out.player.name}. They see it next time they open the noticeboard.`
      );
      refresh();
    }
  };

  const accept = async (f) => {
    const out = await acc.run(() => api.acceptFriend(acc.token, f.id));
    if (out) playSfx('friend_accept');
    refresh();
  };

  const remove = async (f) => {
    playSfx('confirm');
    await acc.run(() => api.removeFriend(acc.token, f.id));
    refresh();
  };

  const payload = acc.signedIn ? syncPayload(state) : { days: [], records: [] };

  return (
    <Screen style={{ padding: space.md }}>
      <ObjectiveRibbon
        place="Trail Friends"
        objective="who can see your training"
        style={{ marginBottom: space.sm }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {!acc.available ? (
          <FieldCard tone="paper" title="Account" caption="No server on this copy">
            <PixelText size="tiny" color={tokens.textOnPaper} style={{ lineHeight: 15 }}>
              This copy of Companion Quest has no server set up, so friends and boards are
              off. Everything else works exactly as it does now — the game has never needed
              an account.
            </PixelText>
          </FieldCard>
        ) : !acc.signedIn ? (
          <FieldCard
            tone="paper"
            title="Account"
            caption="Sign in to compare. An account shares only the training you choose."
          >
            <PixelText size="tiny" color={tokens.textOnPaper} style={{ lineHeight: 15 }}>
              An account shares your TRAINING with friends you choose: the days you were
              active, the miles you walked, the sessions you did, and your personal bests.
            </PixelText>
            <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 8, lineHeight: 15 }}>
              It does not share your companion, your goal, your bag or anything else, and
              nobody sees any of it until you both agree. You can sign out or delete the
              account here at any time — neither touches your game.
            </PixelText>
            {!appleOk && !googleConfigured() ? (
              <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 8, lineHeight: 15 }}>
                No sign-in method is available on this device. Apple sign-in needs an iPhone;
                Google needs a client id set for this platform.
              </PixelText>
            ) : null}
          </FieldCard>
        ) : (
          <>
            <FieldCard tone="paper" title="Account" caption="Your trail code — read it to a friend">
              <PixelText size="tiny" color={tokens.textOnPaperDim}>{acc.me.name}</PixelText>
              <PixelText size="heading" color={tokens.textOnPaper} align="center" style={{ marginVertical: 10 }}>
                {acc.me.code}
              </PixelText>
            </FieldCard>

            <FieldCard tone="paper" title="Add by code" style={{ marginTop: space.md }}>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder="THEIR-CODE"
                placeholderTextColor={tokens.textOnPaperDim}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                style={{
                  marginTop: 4,
                  borderWidth: 2,
                  borderColor: tokens.sheetEdge,
                  color: tokens.textOnPaper,
                  paddingHorizontal: 10,
                  minHeight: scale.touchMin,
                  fontSize: 16,
                  letterSpacing: 2,
                }}
              />
            </FieldCard>

            <FieldCard
              tone="paper"
              title="Circle"
              caption={friends.length ? undefined : 'Nobody yet'}
              style={{ marginTop: space.md }}
            >
              {friends.map((f) => (
                <View key={f.id} style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <PixelText size="tiny" color={tokens.textOnPaper}>{f.name}</PixelText>
                    <PixelText size="tiny" color={f.state === 'accepted' ? tokens.success : tokens.caution}>
                      {f.state === 'accepted' ? 'connected' : f.incoming ? 'wants to connect' : 'waiting'}
                    </PixelText>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    {f.incoming ? (
                      <TrailAction
                        label="Accept"
                        tone="primary"
                        onPress={() => accept(f)}
                        style={{ flex: 1, marginRight: 6 }}
                      />
                    ) : null}
                    <TrailAction
                      label={f.state === 'accepted' ? 'Disconnect' : 'Cancel'}
                      tone="quiet"
                      onPress={() => remove(f)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ))}
              {!friends.length ? (
                <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ lineHeight: 15 }}>
                  Swap codes with someone you actually train near. A board of strangers is
                  a scoreboard; a board of four friends is a reason to go out.
                </PixelText>
              ) : null}
            </FieldCard>

            <FieldCard tone="paper" title="What is shared" style={{ marginTop: space.md }}>
              <Line label="Days of training" value={String(payload.days.length)} />
              <Line label="Personal bests" value={String(payload.records.length)} />
              <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 8, lineHeight: 14 }}>
                One row per day — miles, steps, sessions and sets. Never a running total, so
                the server can check a day against what a person can actually do.
              </PixelText>
            </FieldCard>

            <FieldCard tone="paper" title="Leave" style={{ marginTop: space.md }}>
              <TrailAction label="Sign out" tone="quiet" onPress={() => { playSfx('confirm'); acc.signOut(); }} />
              <TrailAction
                label={confirmDelete ? 'Really delete everything' : 'Delete my account'}
                tone="quiet"
                style={{ marginTop: 8 }}
                onPress={() => {
                  if (!confirmDelete) return setConfirmDelete(true);
                  playSfx('confirm');
                  acc.forget();
                  setConfirmDelete(false);
                }}
              />
              <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 8, lineHeight: 14 }}>
                Deleting removes your days, your bests and your friendships from the server
                for good. Your game on this phone is untouched.
              </PixelText>
            </FieldCard>
          </>
        )}

        {acc.error ? (
          <PixelText size="tiny" color={tokens.danger} style={{ marginTop: space.md, lineHeight: 14 }}>
            {acc.error}
          </PixelText>
        ) : null}
        {note ? (
          <PixelText size="tiny" color={tokens.success} style={{ marginTop: space.sm, lineHeight: 14 }}>
            {note}
          </PixelText>
        ) : null}
      </ScrollView>

      <View style={{ marginTop: space.sm }}>
        {acc.available && !acc.signedIn && appleOk ? (
          <TrailAction label="Sign in with Apple" tone="primary" onPress={onApple} />
        ) : null}
        {acc.available && !acc.signedIn && googleConfigured() ? (
          <GoogleButton onToken={(idToken) => acc.signIn('google', idToken)} disabled={acc.busy} />
        ) : null}
        {acc.signedIn ? (
          <TrailAction
            label={acc.busy ? 'Asking...' : 'Ask to connect'}
            tone="primary"
            onPress={add}
          />
        ) : null}
        {acc.signedIn ? (
          <TrailAction
            label={acc.busy ? 'Sharing...' : 'Share my training'}
            tone="primary"
            onPress={share}
            style={{ marginTop: space.sm }}
          />
        ) : null}
        {acc.signedIn ? (
          <TrailAction
            label="See the boards"
            tone="accent"
            onPress={() => { playSfx('confirm'); navigate('board'); }}
            style={{ marginTop: space.sm }}
          />
        ) : null}
        <TrailAction
          label={back.label}
          tone="quiet"
          onPress={() => { playSfx('cancel'); goBack(); }}
          style={{ marginTop: space.sm }}
        />
      </View>
    </Screen>
  );
}
