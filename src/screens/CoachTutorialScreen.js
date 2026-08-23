// Coach Maple's welcome: the one conversation that explains how the whole
// game connects — the gym's iron, the kitchen at home, the bed, the habits —
// before the goal talk where you meet your companion.
//
// Reached exactly once, by walking up to Maple with no companion yet. It ends
// in the goal conversation (`goal`), which is where the starter is chosen, so
// the order of the first morning is: lessons -> goal -> first bond -> and then
// Rowan's push-up contest interrupts back on the gym floor (GymScreen).
//
// A live save with a party never lands here: re-running `goal` would dispatch
// START_GAME over a real journey, so the complete guard stays in GymScreen.

import React from 'react';
import { View } from 'react-native';
import { Screen, DualPane, DialogueBox, PixelText, PixelSprite, Window } from '../components';
import { COACH_PORTRAIT } from '../data/characters';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';

const lessons = [
  { speaker: 'Coach Maple', text: 'You made it here from your own front door. That is the first rule of this place: real movement is the only thing that moves your journey.' },
  { speaker: 'Coach Maple', text: 'I am Maple. I keep Quest Fitness, and everything in this room works the same way — walk up to a thing to use it. The racks and iron build your own session. The mats run circuits. The deck and rower count only real movement.' },
  { speaker: 'Coach Maple', text: 'The reception desk keeps your record, the whiteboard keeps your week, and the smoothie bar takes Trail Credit — which is minted by effort and nothing else. Nobody buys their way up here.' },
  { speaker: 'Coach Maple', text: 'It does not stop at this door. Your kitchen at home logs what you actually ate. Your bed logs how you actually slept. Your desk keeps the habits. Water, food, sleep, stillness — they all feed the same journey the iron does.' },
  { speaker: 'Coach Maple', text: 'And all of it lands in one place: your companion. Effort earns Growth and bond. Enough shared practice raises its level, and a life lived well enough can reveal a whole new form.' },
  { speaker: 'Coach Maple', text: 'On the trails you will meet wild companions. A Kinship Knot is an invitation, never a trap — you offer one loop and keep the other, and the companion decides. Finishing strong is what convinces them.' },
  { speaker: 'Coach Maple', text: 'Recovery is training too. When you are worn down, go home and sleep. Rest restores Resolve, and it is never something to feel guilty about.' },
  { speaker: 'Coach Maple', text: 'So — before any of that, the real question. Walk with me a moment: what are you here to become? Answer honestly, because a companion is about to recognize you by it.' },
];

export default function CoachTutorialScreen() {
  const { dispatch } = useGame();
  const { navigate } = useNav();
  return (
    <Screen padTop={false}>
      <DualPane
        top={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bgAlt }}>
            <PixelText size="small" color={palette.secondary}>Quest Fitness</PixelText>
            <PixelSprite spriteKey={COACH_PORTRAIT} size={166} accessibilityLabel="Coach Maple welcoming you to Quest Fitness" />
            <Window tone="dark" pad={7} style={{ marginTop: space.sm }}>
              <PixelText size="tiny" color={palette.windowFill}>COACH MAPLE · TRAIL MENTOR</PixelText>
            </Window>
          </View>
        }
        bottom={
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}>
            <DialogueBox
              lines={lessons}
              onComplete={() => {
                dispatch({ type: 'MARK_META', payload: { coachIntroDone: true } });
                navigate('goal');
              }}
            />
          </View>
        }
      />
    </Screen>
  );
}
