// Maple's Guided First Session — the bridge between the intro and the loop.
//
// The tour SHOWED the gym and the contest showed a battle; this is the first
// thing you actually DO. Five gentle movements, coached one at a time, each
// interactive in its own honest way: the timed ones run a real start/pause
// clock, the rep ones count only when you tap that you did a rep, and the
// alternating one keeps your left/right rhythm for you. Every movement offers
// an easier version and a skip, and nothing scores your speed — the only thing
// being measured is that you showed up and moved.
//
// Completion goes through the SAME COMPLETE_WORKOUT the shelf and the Forge
// use (XP, bond, evolve points, workout stats, session credit), because the
// first workout is a real workout, not a tutorial pretending to be one. The
// one-time starter package on top (5 Kinship Knots + a Bramble Blend) is
// granted by CLAIM_STARTER_PACK, which the reducer itself gates on
// meta.mapleSessionDone so it can never be farmed.

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, Window, DialogueBox, PixelText, PixelButton, PixelSprite, ProgressBar } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { levelFromXp } from '../state/leveling';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { WORKOUTS } from '../data/workouts';
import { pacingForGoal } from '../data/route';
import { levelUpLine } from '../coach';

const SESSION = WORKOUTS.find((w) => w.id === 'firstsession');

// Each stage: how it is done (timer / reps / alternate), the movement, an
// easier stand-in, and what Maple says standing next to you. The alt swaps the
// NAME and the cue, never the credit — an easier version done is done.
const STAGES = [
  {
    id: 'march', kind: 'timer', seconds: 60,
    move: { name: 'March in Place', cue: 'Knees toward hip height, arms swinging, soft landings. Easy enough to talk through.' },
    alt: { name: 'Seated March', cue: 'Sit tall on a chair and lift one knee at a time. Same rhythm, full support.' },
    coach: 'First one: sixty seconds of marching, right where you stand. Press START when you are moving, PAUSE any time you need. This is a warm-up, not a race.',
  },
  {
    id: 'squats', kind: 'reps', target: 8,
    move: { name: 'Squats', cue: 'Feet shoulder width. Sit back and down, knees over toes, drive up through mid-foot.' },
    alt: { name: 'Sit-to-Stands', cue: 'Stand up from a chair, then sit back down slowly. The exact same movement, with a safety net.' },
    coach: 'Eight squats. Do one for real, then tap REP — your pace, my count. If squats are not there yet, sit-to-stands are the same lesson.',
  },
  {
    id: 'wallpush', kind: 'reps', target: 8,
    move: { name: 'Wall Push-Ups', cue: 'Hands on the wall at shoulder height, body one straight line. Chest to the wall, push it away.' },
    alt: { name: 'Wall Press Holds', cue: 'Lean into the wall, hold a slow three-count, push back tall. Strength is built holding too.' },
    coach: 'Eight wall push-ups. The wall takes exactly as much of you as you give it — that is why every pressing journey starts there.',
  },
  {
    id: 'knees', kind: 'alternate', target: 10,
    move: { name: 'Alternating Knee Raises', cue: 'Stand tall, raise one knee toward your hands, lower with control, switch sides.' },
    alt: { name: 'Toe Taps', cue: 'Tap one foot out in front at a time instead of raising the knee. Keep the left-right rhythm.' },
    coach: 'Ten knee raises, alternating. Tap LEFT and RIGHT as you go — the buttons keep the rhythm honest so you never lose count.',
  },
  {
    id: 'stretch', kind: 'timer', seconds: 60,
    move: { name: 'Stretch + Breathing', cue: 'Reach tall, fold forward, roll up slowly. Long slow breaths the whole minute.' },
    alt: { name: 'Seated Breathing', cue: 'Sit comfortably. In through the nose for four, out through the mouth for six.' },
    coach: 'Last one, and it counts as much as the rest: a minute to stretch and breathe. Press START and let everything slow down.',
  },
];

const WELCOME = [
  { speaker: 'Coach Maple', text: 'You came back. That is the whole secret, by the way — everything else is details.' },
  { speaker: 'Coach Maple', text: 'Five movements, nothing heavy: a march, squats, wall push-ups, knee raises, and a long breath out. I will walk you through each one.' },
  { speaker: 'Coach Maple', text: 'Two promises. Every movement has an easier version, and skipping one is always allowed. Nothing here times you or scores you — showing up and moving IS the session.' },
];

const FRESH_STAGE = { running: false, elapsed: 0, reps: 0, next: 'left', easier: false };

export default function MapleSessionScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  const [phase, setPhase] = useState('welcome');   // welcome | work | result
  const [idx, setIdx] = useState(0);
  const [st, setSt] = useState(FRESH_STAGE);
  const [resultLines, setResultLines] = useState([]);
  const skippedRef = useRef(0);
  const advancingRef = useRef(false);

  const stage = STAGES[idx];

  // The timed stages' clock. Only ticks while START has been pressed, and
  // pausing genuinely stops it — a rest is a rest, not a penalty.
  useEffect(() => {
    if (phase !== 'work' || stage.kind !== 'timer' || !st.running) return undefined;
    const t = setInterval(() => setSt((s) => ({ ...s, elapsed: s.elapsed + 1 })), 1000);
    return () => clearInterval(t);
  }, [phase, idx, stage.kind, st.running]);

  const advance = (skipped) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    if (skipped) skippedRef.current += 1;
    playSfx(skipped ? 'cancel' : 'heal');
    setTimeout(() => {
      advancingRef.current = false;
      if (idx + 1 >= STAGES.length) {
        complete();
        return;
      }
      setIdx(idx + 1);
      setSt(FRESH_STAGE);
    }, skipped ? 150 : 600);
  };

  // A finished timer advances by itself — the effect above only counts, so the
  // moment of completion is observed here where advance() is in scope.
  useEffect(() => {
    if (phase === 'work' && stage.kind === 'timer' && st.running && st.elapsed >= stage.seconds) {
      setSt((s) => ({ ...s, running: false }));
      advance(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.elapsed]);

  const rep = () => {
    playSfx('confirm');
    const n = st.reps + 1;
    if (n >= stage.target) {
      setSt((s) => ({ ...s, reps: n }));
      advance(false);
      return;
    }
    setSt((s) => ({ ...s, reps: n }));
  };

  const altRep = (side) => {
    if (side !== st.next) return;
    playSfx('confirm');
    const n = st.reps + 1;
    if (n >= stage.target) {
      setSt((s) => ({ ...s, reps: n }));
      advance(false);
      return;
    }
    setSt((s) => ({ ...s, reps: n, next: side === 'left' ? 'right' : 'left' }));
  };

  const complete = () => {
    const mult = pacingForGoal(state.goalId).workoutXpMult || 1;
    const gainedXp = Math.round((SESSION.reward.xp || 0) * mult);
    const firstTime = !state.meta.mapleSessionDone;
    // The real progression path: same action, same rewards, same stats row as
    // any session off the shelf. Five stages, five sets.
    dispatch({
      type: 'COMPLETE_WORKOUT',
      payload: { workoutId: SESSION.id, reward: SESSION.reward, sets: STAGES.length },
    });
    dispatch({ type: 'CLAIM_STARTER_PACK' });
    playSfx('heal');
    const skipped = skippedRef.current;
    const lines = [
      {
        speaker: 'Coach Maple',
        text: skipped === 0
          ? 'All five. Your first real session is in the book — and I mean the same book every session goes in.'
          : 'Session done. You skipped a couple, and that is fine — the version of this that matters is the one you actually do.',
      },
      { speaker: 'Narration', text: `+${gainedXp} XP   +${SESSION.reward.bond} bond   — a real session, logged like any other.` },
    ];
    if (companion) {
      const afterLevel = levelFromXp(companion.xp + gainedXp);
      if (afterLevel > companion.level) {
        playSfx('levelup');
        lines.push({ speaker: 'Narration', text: levelUpLine(companion.creature.name, afterLevel) });
      }
    }
    if (firstTime) {
      lines.push(
        { speaker: 'Coach Maple', text: 'One more thing — a starter package, for finishing your first. Five Kinship Knots, for the wild companions you will meet out there. And a Bramble Blend, two straws, for you both.' },
        { speaker: 'Narration', text: 'Received 5 Kinship Knots and 1 Bramble Blend.' }
      );
    }
    lines.push({
      speaker: 'Coach Maple',
      text: 'From here the world is yours: walk the Grove trails, meet the Keepers, and when your miles say you are ready — the regional Warden. Show up, move, and build from there. That is the whole game, in here and out there.',
    });
    setResultLines(lines);
    setPhase('result');
  };

  const companionName = companion && companion.creature && companion.creature.name;

  if (phase === 'welcome') {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <PixelSprite spriteKey="coach_maple" size={104} bob accessibilityLabel="Coach Maple" />
        </View>
        <DialogueBox lines={WELCOME} onComplete={() => { setPhase('work'); playSfx('confirm'); }} />
      </Screen>
    );
  }

  if (phase === 'result') {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {companion ? (
            <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={110} bob />
          ) : null}
        </View>
        <DialogueBox lines={resultLines} onComplete={() => navigate('gym')} />
      </Screen>
    );
  }

  const shown = st.easier ? stage.alt : stage.move;
  const remaining = stage.kind === 'timer' ? Math.max(0, stage.seconds - st.elapsed) : 0;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Maple's First Session
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.sm }}>
        Movement {idx + 1} of {STAGES.length}
      </PixelText>

      {/* She coaches from beside the card, and your companion does the session
          with you — the two of them are the whole reason none of this is a
          form to fill in. */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: space.sm }}>
        <PixelSprite spriteKey="coach_maple" size={64} accessibilityLabel="Coach Maple" />
        {companion ? (
          <View style={{ marginLeft: space.lg, alignItems: 'center' }}>
            <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={64} bob />
            <PixelText size="tiny" color={palette.windowTextDim}>{companionName}</PixelText>
          </View>
        ) : null}
      </View>

      {/* The card floats centred in the slack a tall phone leaves, rather than
          stretching a mostly-empty window down to the buttons. */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
      <Window tone="cream" pad={14}>
        <PixelText size="body" color={palette.windowText} align="center">
          {shown.name}
        </PixelText>
        <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: 6, lineHeight: 14 }}>
          {shown.cue}
        </PixelText>
        <PixelText size="tiny" color={palette.accentDark} style={{ marginTop: space.sm, lineHeight: 14 }}>
          Maple: {stage.coach}
        </PixelText>

        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: space.md }}>
          {stage.kind === 'timer' ? (
            <>
              <PixelText size="heading" color={palette.windowText}>
                {`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
              </PixelText>
              <View style={{ width: '80%', marginVertical: space.sm }}>
                <ProgressBar value={st.elapsed} max={stage.seconds} showText={false} />
              </View>
              <PixelButton
                label={st.running ? 'PAUSE' : st.elapsed > 0 ? 'RESUME' : 'START'}
                tone={st.running ? 'plain' : 'gold'}
                style={{ minWidth: 160 }}
                onPress={() => setSt((s) => ({ ...s, running: !s.running }))}
              />
            </>
          ) : stage.kind === 'reps' ? (
            <>
              <PixelText size="heading" color={palette.windowText}>
                {st.reps} / {stage.target}
              </PixelText>
              <PixelButton label="REP" tone="gold" sound={null} style={{ minWidth: 160, marginTop: space.sm }} onPress={rep} />
            </>
          ) : (
            <>
              <PixelText size="heading" color={palette.windowText}>
                {st.reps} / {stage.target}
              </PixelText>
              <View style={{ flexDirection: 'row', marginTop: space.sm }}>
                <PixelButton
                  label="LEFT"
                  tone={st.next === 'left' ? 'gold' : 'plain'}
                  disabled={st.next !== 'left'}
                  sound={null}
                  style={{ flex: 1, marginRight: 6 }}
                  onPress={() => altRep('left')}
                />
                <PixelButton
                  label="RIGHT"
                  tone={st.next === 'right' ? 'gold' : 'plain'}
                  disabled={st.next !== 'right'}
                  sound={null}
                  style={{ flex: 1, marginLeft: 6 }}
                  onPress={() => altRep('right')}
                />
              </View>
            </>
          )}
        </View>
      </Window>
      </View>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <PixelButton
          label={st.easier ? 'Standard version' : `Easier: ${stage.alt.name}`}
          tone="plain"
          size="tiny"
          style={{ flex: 1, marginRight: 6 }}
          onPress={() => setSt((s) => ({ ...s, easier: !s.easier }))}
        />
        <PixelButton
          label="Skip this one"
          tone="dark"
          size="tiny"
          sound={null}
          style={{ flex: 1, marginLeft: 6 }}
          onPress={() => advance(true)}
        />
      </View>
    </Screen>
  );
}
