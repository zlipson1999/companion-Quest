// Workouts module: pick a real routine, do it, and log it for XP + bond.

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, DialogueBox, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { levelFromXp } from '../state/leveling';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { WORKOUTS } from '../data/workouts';
import { pacingForGoal } from '../data/route';
import { workoutComplete, levelUpLine } from '../coach';

export default function WorkoutScreen({ params = {} }) {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  // A station can name the routine it IS. Walking onto the turf lane is
  // already a choice, so the turf opens the warm-up rather than the list of
  // every routine with the warm-up somewhere in it. Backing out of one of
  // those goes back to the room, not to a list you never asked for.
  const pinned = params.workoutId && WORKOUTS.some((w) => w.id === params.workoutId)
    ? params.workoutId
    : null;

  const [phase, setPhase] = useState(pinned ? 'detail' : 'list');
  const [selected, setSelected] = useState(pinned);
  const [resultLines, setResultLines] = useState([]);

  const workout = selected ? WORKOUTS.find((w) => w.id === selected) : null;

  const complete = () => {
    const mult = pacingForGoal(state.goalId).workoutXpMult || 1;
    const gainedXp = Math.round((workout.reward.xp || 0) * mult);
    const beforeLevel = companion.level;
    const afterLevel = levelFromXp(companion.xp + gainedXp);
    dispatch({ type: 'COMPLETE_WORKOUT', payload: { workoutId: workout.id, reward: workout.reward } });
    playSfx('heal');
    const lines = [
      { speaker: companion.creature.name, text: workoutComplete() },
      { speaker: 'Narration', text: `+${gainedXp} XP   +${workout.reward.bond} bond` },
    ];
    if (afterLevel > beforeLevel) {
      playSfx('levelup');
      lines.push({ speaker: 'Narration', text: levelUpLine(companion.creature.name, afterLevel) });
    }
    setResultLines(lines);
    setPhase('result');
  };

  if (phase === 'result') {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={110} bob />
        </View>
        <DialogueBox lines={resultLines} onComplete={() => navigate(pinned ? 'gym' : 'hub')} />
      </Screen>
    );
  }

  if (phase === 'detail' && workout) {
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
          {workout.name}
        </PixelText>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Window tone="cream" pad={14}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm }}>
              <PixelText size="tiny" color={palette.accentDark}>
                {workout.intensity}
              </PixelText>
              <PixelText size="tiny" color={palette.windowTextDim}>
                ~{workout.minutes} min
              </PixelText>
            </View>
            {workout.steps.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                <PixelText size="small" color={palette.accent}>
                  {i + 1}.{' '}
                </PixelText>
                <PixelText size="small" color={palette.windowText} style={{ flex: 1, lineHeight: 16 }}>
                  {s}
                </PixelText>
              </View>
            ))}
          </Window>
          <Window tone="dark" pad={12} style={{ marginTop: space.sm }}>
            <PixelText size="tiny" color={palette.secondary}>
              Reward: +{workout.reward.xp} XP, +{workout.reward.bond} bond
            </PixelText>
          </Window>
        </ScrollView>
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          <PixelButton
            label={pinned ? 'Back to the Hall' : 'Back'}
            tone="plain"
            sound="cancel"
            style={{ flex: 1, marginRight: 6 }}
            onPress={() => (pinned ? navigate('gym') : setPhase('list'))}
          />
          <PixelButton label="I Did It!" tone="gold" style={{ flex: 1, marginLeft: 6 }} onPress={complete} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Training Yard
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.md }}>
        Real workouts make {companion ? companion.creature.name : 'your companion'} stronger.
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        {WORKOUTS.map((w) => (
          <View key={w.id} style={{ marginBottom: space.sm }}>
            <Window tone="cream" pad={12}>
              <View onTouchEnd={() => { playSfx('confirm'); setSelected(w.id); setPhase('detail'); }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <PixelText size="body" color={palette.windowText}>
                    {w.name}
                  </PixelText>
                  <PixelText size="tiny" color={palette.accentDark}>
                    {w.intensity}
                  </PixelText>
                </View>
                <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 8, lineHeight: 14 }}>
                  {w.description}  ·  +{w.reward.xp} XP
                </PixelText>
              </View>
            </Window>
          </View>
        ))}
      </ScrollView>
      {/* The weights offer both: take one off the shelf, or write your own.
          Sending the player back to the hub to find the Forge made the rack a
          dead end for half of what it is meant to stand for. */}
      <PixelButton
        label="Build Your Own (Forge)"
        tone="dark"
        sound="confirm"
        style={{ marginBottom: space.sm }}
        onPress={() => navigate('forge')}
      />

      <PixelButton label="Back to Town" tone="plain" sound="cancel" onPress={() => navigate('hub')} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
