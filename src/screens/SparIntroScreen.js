// Coach Maple's push-up contest — the first battle a new player ever sees.
//
// The battle system used to be introduced by walking into a bad habit on Route
// 1, which is a strange first impression: the mechanics arrive at the same
// moment as a monster and a loss condition. Here Maple is already mid-session
// with another trailkeeper when you walk in, and once you have your companion
// she puts you against them, push-up for push-up.
//
// It runs the REAL battle. Same moves, same Resolve, same victory path — what
// makes it a tutorial is the framing and the fact that Rowan is gentle, not a
// separate pretend system that teaches habits you then have to unlearn.

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Screen, DialogueBox, PixelSprite, PixelText, Window } from '../components';
import { palette, space, tokens } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { COACH_PORTRAIT } from '../data/characters';

// A training partner, not a creature. Named, so the contest has someone in it.
export const SPAR_PARTNER = {
  name: 'Rowan',
  sprite: 'hero_man_down',
  palette: 'pc_man',
};

export const SPAR_PARAMS = {
  targetId: 'spar',
  opponent: SPAR_PARTNER,
  // Deliberately low: the point is to finish it and understand what happened.
  hp: 26,
  xp: 24,
  bond: 5,
  from: 'gym',
};

export default function SparIntroScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate, toBattle } = useNav();
  const name = companion ? companion.creature.name : 'your companion';

  const lines = useMemo(
    () => [
      { speaker: 'Coach Maple', text: 'Rowan — take a breather. We have got a new trailkeeper.' },
      { speaker: 'Rowan', text: 'Oh good. I was going to lose count anyway.' },
      { speaker: 'Coach Maple', text: `So. ${name} is yours now. The two of you work as a pair — you do the effort, they carry the Resolve.` },
      { speaker: 'Coach Maple', text: 'Easiest way to show you is to make you do it. Rowan, push-ups. Best effort against theirs.' },
      { speaker: 'Rowan', text: 'Friendly. Mostly friendly.' },
      { speaker: 'Coach Maple', text: 'Pick a movement, do it for real, and watch what it does to their Resolve. That is the whole of it.' },
    ],
    [name]
  );

  return (
    <Screen style={{ padding: space.md }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <PixelSprite spriteKey={COACH_PORTRAIT} size={116} accessibilityLabel="Coach Maple" />
          <View style={{ width: space.lg }} />
          <View style={{ alignItems: 'center' }}>
            <PixelSprite spriteKey={SPAR_PARTNER.sprite} size={44} bob />
            <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 6 }}>
              Rowan
            </PixelText>
          </View>
        </View>
        <Window tone="dark" pad={10} style={{ marginTop: space.lg }}>
          <PixelText size="tiny" color={palette.secondary}>MAPLE TRAINING HALL</PixelText>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 5, lineHeight: 13 }}>
            A session already in progress.
          </PixelText>
        </Window>
      </View>

      <View style={{ justifyContent: 'flex-end' }}>
        <DialogueBox
          lines={lines}
          onComplete={() => {
            // Straight into the real battle screen, with the gym to come back to.
            toBattle({ ...SPAR_PARAMS, sparIntro: true });
          }}
        />
      </View>
    </Screen>
  );
}
