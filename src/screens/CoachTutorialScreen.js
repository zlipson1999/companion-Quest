import React from 'react';
import { View } from 'react-native';
import { Screen, DualPane, DialogueBox, PixelText, PixelSprite, Window } from '../components';
import { COACH_PORTRAIT } from '../data/characters';
import { palette, space } from '../theme';
import { useNav } from './navContext';

const lessons = [
  { speaker: 'Coach Maple', text: 'You made it from home under your own power. That is the first rule here: real movement moves your journey.' },
  { speaker: 'Coach Maple', text: 'I am Maple. I keep this Training Hall, study how habits grow, and help trailkeepers listen to their companions.' },
  { speaker: 'Coach Maple', text: 'Walking and running move you along trails. Real exercise builds Resolve during challenges. Water, food, sleep, stillness, and honest training logs all matter.' },
  { speaker: 'Coach Maple', text: 'Growth records long-term progress. Effort earns Growth and bond; enough shared practice raises a companion’s level and can reveal a new form.' },
  { speaker: 'Coach Maple', text: 'Bond Tokens are invitations, never traps. A trail companion chooses whether to enter your Circle, and you can rotate who takes the lead.' },
  { speaker: 'Coach Maple', text: 'Your Journal remembers progress. Supplies help on the trail. The Coach desk can answer wellness questions, but injuries and medical concerns belong with a qualified professional.' },
  { speaker: 'Coach Maple', text: 'Recovery is part of training. When you need it, return home, go upstairs, and sleep. Rest restores Resolve; it is never something to feel guilty about.' },
  { speaker: 'Coach Maple', text: 'There is no perfect goal. Tell me what you want your next season of life to feel like. Your answer will help one companion recognize you.' },
];

export default function CoachTutorialScreen() {
  const { navigate } = useNav();
  return (
    <Screen padTop={false}>
      <DualPane
        top={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bgAlt }}><PixelText size="small" color={palette.secondary}>Maple Training Hall</PixelText><PixelSprite spriteKey={COACH_PORTRAIT} size={166} accessibilityLabel="Coach Maple welcoming you to the Training Hall" /><Window tone="dark" pad={7} style={{ marginTop: space.sm }}><PixelText size="tiny" color={palette.windowFill}>COACH MAPLE · TRAIL MENTOR</PixelText></Window></View>}
        bottom={<View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}><DialogueBox lines={lessons} onComplete={() => navigate('goal')} /></View>}
      />
    </Screen>
  );
}
