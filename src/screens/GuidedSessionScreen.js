import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, PixelText, PixelButton, ProgressBar, DialogueBox, PixelSprite } from '../components';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { palette, space } from '../theme';
import { playSfx } from '../audio';

const EXERCISES = [
  { id: 'march', name: 'March in Place', kind: 'timer', target: 60, cue: 'Easy pace. Let your arms move. This is a warm-up, not a test.', alt: 'Seated march' },
  { id: 'squat', name: 'Squats / Sit-to-Stands', kind: 'reps', target: 8, cue: 'Stand tall each rep. Use a chair if that feels better.', alt: 'Chair sit-to-stand' },
  { id: 'wall_pushup', name: 'Wall Push-Ups', kind: 'reps', target: 8, cue: 'Body long, hands on the wall, move at your own pace.', alt: 'Higher wall angle / smaller range' },
  { id: 'knee_raise', name: 'Alternating Knee Raises', kind: 'alternate', target: 10, cue: 'Left, right, steady. Hold something stable if you want.', alt: 'Seated alternating knee raise' },
  { id: 'breathe', name: 'Stretch + Breathing', kind: 'timer', target: 60, cue: 'Slow down. Breathe comfortably and let your shoulders soften.', alt: 'Seated breathing' },
];

const INTRO = [
  { speaker: 'Coach Maple', text: 'You have seen the gym and you have seen home. Now we put the two halves together. This is a real session — you move, and your companion moves with you.' },
  { speaker: 'Coach Maple', text: 'Nothing extreme. Five simple bodyweight movements. Take your time, use an easier option whenever you need it, and skip anything that does not feel right.' },
];

const COMPLETE = [
  { speaker: 'Coach Maple', text: 'That is it. A session does not have to be huge. Show up, move a little, and give yourself something to build on.' },
  { speaker: 'Coach Maple', text: 'You are heading out for real now, so I want you prepared. Five Kinship Knots for the road — and your first Bramble Blend is on the house.' },
];

export default function GuidedSessionScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  const [phase, setPhase] = useState('intro');
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const exercise = EXERCISES[index];

  useEffect(() => {
    if (!running || !exercise || exercise.kind !== 'timer') return undefined;
    const t = setInterval(() => setProgress((p) => Math.min(exercise.target, p + 1)), 1000);
    return () => clearInterval(t);
  }, [running, exercise]);

  useEffect(() => {
    if (exercise && progress >= exercise.target) setRunning(false);
  }, [progress, exercise]);

  const pct = exercise ? Math.min(1, progress / exercise.target) : 0;
  const label = useMemo(() => {
    if (!exercise) return '';
    if (exercise.kind === 'timer') return `${progress} / ${exercise.target} sec`;
    return `${progress} / ${exercise.target} reps`;
  }, [exercise, progress]);

  const next = () => {
    playSfx('confirm');
    if (index >= EXERCISES.length - 1) {
      setPhase('complete');
      return;
    }
    setIndex((i) => i + 1);
    setProgress(0);
    setRunning(false);
    setAlternate(false);
  };

  const finish = () => {
    // Reducer owns the one-time guard: revisiting this screen can never farm rewards.
    dispatch({ type: 'COMPLETE_MAPLE_SESSION' });
    playSfx('heal');
    navigate('gym');
  };

  if (phase === 'intro') {
    return <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}><DialogueBox lines={INTRO} onComplete={() => setPhase('work')} /></Screen>;
  }
  if (phase === 'complete') {
    return <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}><DialogueBox lines={COMPLETE} onComplete={finish} /></Screen>;
  }

  return (
    <Screen style={{ padding: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
        <View style={{ flex: 1 }}>
          <PixelText size="tiny" color={palette.muted}>COACH MAPLE · FIRST SESSION</PixelText>
          <PixelText size="small" color={palette.white}>{exercise.name}</PixelText>
        </View>
        {companion && companion.creature ? <PixelSprite id={companion.creature.id} scale={2} /> : null}
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: space.md }}>
        <PixelText size="tiny" color={palette.muted} align="center">{exercise.cue}</PixelText>
        {alternate ? <PixelText size="tiny" color={palette.white} align="center">EASIER OPTION: {exercise.alt}</PixelText> : null}
        <PixelText size="large" color={palette.white} align="center">{label}</PixelText>
        <ProgressBar value={pct} />

        {exercise.kind === 'timer' ? (
          <PixelButton label={running ? 'PAUSE' : progress ? 'RESUME' : 'READY — START'} onPress={() => setRunning((v) => !v)} />
        ) : exercise.kind === 'alternate' ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}><PixelButton label="LEFT" disabled={progress >= exercise.target} onPress={() => setProgress((p) => Math.min(exercise.target, p + 1))} /></View>
            <View style={{ flex: 1 }}><PixelButton label="RIGHT" disabled={progress >= exercise.target} onPress={() => setProgress((p) => Math.min(exercise.target, p + 1))} /></View>
          </View>
        ) : (
          <PixelButton label="REP" disabled={progress >= exercise.target} onPress={() => setProgress((p) => Math.min(exercise.target, p + 1))} />
        )}

        <PixelButton label={alternate ? 'STANDARD MOVEMENT' : 'EASIER OPTION'} onPress={() => setAlternate((v) => !v)} />
        <PixelButton label="SKIP THIS MOVEMENT" onPress={() => setProgress(exercise.target)} />
        {progress >= exercise.target ? <PixelButton label={index === EXERCISES.length - 1 ? 'FINISH SESSION' : 'NEXT MOVEMENT'} onPress={next} /> : null}
      </View>

      <PixelText size="tiny" color={palette.muted} align="center">No speed score. Pause whenever you need. Stop if something hurts.</PixelText>
    </Screen>
  );
}
