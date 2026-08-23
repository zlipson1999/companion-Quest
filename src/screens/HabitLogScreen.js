// A single life module's log screen. Entirely driven by the module object —
// its actions become the buttons, its dailyGoal becomes the bar, its voice
// becomes the feedback line. Nothing below knows what hydration or diet are.

import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, ProgressBar, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { levelFromXp } from '../state/leveling';
import {
  getModule,
  logModuleAction,
  moduleActions,
  moduleCheer,
  moduleProgress,
  moduleSprite,
  moduleStateFor,
  moduleSummary,
  todayKey,
} from '../modules';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { habitGoalLine, habitLogged, habitStreakLine, levelUpLine } from '../coach';
import { encourageLine } from '../data/personality';

// The label shows what pressing this ACTUALLY does right now — the real payout
// after the daily cap or the top-up ledger, and "sets" rather than "+" for a
// module whose actions replace the day's value. Advertising "+5 hours, +4 XP"
// for a button that replaces the entry and pays nothing is just a lie.
function ActionButton({ action, unit, replaces, preview, onPress }) {
  const paid = preview ? preview.reward : action.reward || {};
  const amount = action.amount == null ? 1 : action.amount;
  const nothing = !paid.xp && !paid.bond && !paid.heal;
  return (
    <PixelButton tone="gold" onPress={onPress} style={{ marginBottom: space.sm }}>
      <View style={{ width: '100%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PixelText size="small" color={palette.ink}>
            {action.label}
          </PixelText>
          <PixelText size="tiny" color={palette.accentDark}>
            {replaces ? `${amount} ${unit}` : `+${amount} ${unit}`}
          </PixelText>
        </View>
        <PixelText size="tiny" color={palette.windowText} style={{ marginTop: 5 }}>
          {action.sublabel ? `${action.sublabel}  ·  ` : ''}
          {nothing
            ? 'already banked today'
            : `+${paid.xp || 0} XP  +${paid.bond || 0} bond${paid.heal ? `  +${paid.heal} HP` : ''}`}
        </PixelText>
      </View>
    </PixelButton>
  );
}

export default function HabitLogScreen({ params }) {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, goBack, back } = useNav();

  const module = getModule(params.moduleId);
  const [feedback, setFeedback] = useState(null);

  const modState = module ? moduleStateFor(state.modules, module.id) : null;
  const stale = modState && modState.date !== todayKey();

  useEffect(() => {
    if (module && stale) dispatch({ type: 'MODULE_RESET_DAY', payload: { moduleId: module.id } });
  }, [module, stale, dispatch]);

  if (!module) {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'center' }}>
        <Window tone="cream" pad={14}>
          <PixelText size="body" color={palette.windowText} style={{ lineHeight: 20 }}>
            That habit isn't installed.
          </PixelText>
        </Window>
        <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
      </Screen>
    );
  }

  const progress = moduleProgress(module, modState);

  const log = (action) => {
    // Preview with the exact same pure helper the reducer uses, so the numbers
    // announced here are the numbers actually banked.
    const preview = logModuleAction(module, modState, action.id, todayKey());
    if (!preview) return;

    dispatch({ type: 'MODULE_LOG', payload: { moduleId: module.id, actionId: action.id } });

    const lines = [`${action.label}  +${preview.reward.xp} XP  +${preview.reward.bond} bond`];
    if (preview.goalJustHit) {
      playSfx('milestone');
      lines.push(habitGoalLine(module.name));
      lines.push(habitStreakLine(preview.streak));
    } else {
      playSfx('item');
      lines.push(moduleCheer(module, preview.state));
    }

    if (companion) {
      const after = levelFromXp(companion.xp + preview.reward.xp);
      if (after > companion.level) {
        playSfx('levelup');
        lines.push(levelUpLine(companion.creature.name, after));
      }
      const voice = encourageLine(companion.creature);
      if (voice) lines.push(voice);
    }

    setFeedback({ title: preview.goalJustHit ? 'Goal complete!' : habitLogged(), lines });
  };

  const barColor = progress.done ? palette.success : module.color || palette.primary;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        {module.name}
      </PixelText>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Window tone="dark" pad={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PixelSprite spriteKey={moduleSprite(module)} palette={module.spritePalette} size={56} bob={progress.done} />
            <View style={{ flex: 1, marginLeft: space.md }}>
              <PixelText size="small" color={palette.secondary}>
                Today
              </PixelText>
              <PixelText size="label" color={palette.windowFill} style={{ marginTop: 6 }}>
                {progress.value} / {progress.goal}
              </PixelText>
              <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 4 }}>
                {module.unit}
              </PixelText>
            </View>
          </View>

          <ProgressBar
            value={progress.value}
            max={progress.goal}
            color={barColor}
            height={16}
            showText={false}
            style={{ marginTop: space.md }}
          />

          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: space.sm, lineHeight: 14 }}>
            {moduleSummary(module, modState)}
          </PixelText>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
            <PixelText size="tiny" color={palette.accent}>
              Streak {modState.streak}
            </PixelText>
            <PixelText size="tiny" color={palette.windowBorderLight}>
              Best {modState.bestStreak}
            </PixelText>
            <PixelText size="tiny" color={palette.windowBorderLight}>
              {modState.goalDays} good days
            </PixelText>
          </View>
        </Window>

        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.md, marginBottom: space.sm, lineHeight: 14 }}>
          {module.blurb}
        </PixelText>

        {moduleActions(module, modState).map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            unit={module.unit}
            replaces={!!module.replaces}
            // Price each button through the same helper the reducer uses, so the
            // number on it is the number it will pay.
            preview={logModuleAction(module, modState, action.id, todayKey())}
            onPress={() => log(action)}
          />
        ))}

        {feedback ? (
          <Window tone="cream" pad={12} style={{ marginTop: space.xs }}>
            <PixelText size="small" color={palette.accentDark}>
              {feedback.title}
            </PixelText>
            {feedback.lines.map((line, i) => (
              <PixelText key={i} size="tiny" color={palette.windowText} style={{ marginTop: 6, lineHeight: 14 }}>
                {line}
              </PixelText>
            ))}
          </Window>
        ) : null}

        {modState.entries.length ? (
          <Window tone="cream" pad={12} style={{ marginTop: space.sm }}>
            <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 4 }} accessibilityRole="header">
              Logged today
            </PixelText>
            {modState.entries
              .slice()
              .reverse()
              .map((entry, i) => (
                <View key={`${entry.actionId}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <PixelText size="tiny" color={palette.windowText}>
                    {entry.label}
                  </PixelText>
                  <PixelText size="tiny" color={palette.windowTextDim}>
                    +{entry.amount}
                  </PixelText>
                </View>
              ))}
          </Window>
        ) : (
          <Window tone="cream" pad={12} style={{ marginTop: space.sm }}>
            <PixelText
              size="tiny"
              color={palette.windowTextDim}
              accessibilityRole="text"
              accessibilityLabel="Nothing logged today."
            >
              Nothing logged today. The first check-in is the one that counts.
            </PixelText>
          </Window>
        )}

        <View style={{ height: space.sm }} />
      </ScrollView>

      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
