// The Habits hub — every installed life module as a bordered card showing
// today's standing. This screen is written against the registry, not against
// hydration/diet specifically: drop a new module into src/modules and it turns
// up here with a card, a progress bar and a log screen for free.

import React, { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, PixelText, PixelButton, PixelSprite, Triangle, FieldCard } from '../components';
import { dayIn } from '../state/history';
import { todayKey } from '../modules';
import { palette, space } from '../theme';
import { useGame, useModules, useCompanion, useRecovery } from '../state';
import { moduleScreen, moduleSprite, moduleSummary, modulesNeedRoll } from '../modules';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { habitsIntro } from '../coach';

function ModuleCard({ module, state, progress, onPress }) {
  return (
    <Pressable
      onPressIn={() => playSfx('cursor')}
      onPress={() => {
        playSfx('confirm');
        onPress();
      }}
      style={{ marginBottom: space.sm }}
    >
      <FieldCard tone="paper" pad={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PixelSprite spriteKey={moduleSprite(module)} palette={module.spritePalette} size={40} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PixelText size="body" color={palette.windowText}>
                {module.name}
              </PixelText>
              {progress.done ? (
                <PixelText size="tiny" color={palette.success} style={{ marginLeft: space.sm }}>
                  DONE
                </PixelText>
              ) : null}
            </View>
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 5 }}>
              {module.tagline}
            </PixelText>
          </View>
          <Triangle direction="right" size={6} color={palette.accent} />
        </View>

        <View style={{ marginTop: space.sm }}>
          <View style={{ height: 12, backgroundColor: palette.barTrack, borderWidth: 2, borderColor: palette.ink }}>
            <View
              style={{
                height: '100%',
                width: `${Math.round(progress.ratio * 100)}%`,
                backgroundColor: progress.done ? palette.success : module.color || palette.primary,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <PixelText size="tiny" color={palette.windowTextDim}>
              {progress.value} / {progress.goal} {module.unit}
            </PixelText>
            <PixelText size="tiny" color={state.streak > 0 ? palette.accentDark : palette.windowTextDim}>
              streak {state.streak}
            </PixelText>
          </View>
        </View>

        <PixelText size="tiny" color={palette.windowText} style={{ marginTop: space.sm, lineHeight: 14 }}>
          {moduleSummary(module, state)}
        </PixelText>
      </FieldCard>
    </Pressable>
  );
}

export default function HabitsScreen() {
  const { state, dispatch } = useGame();
  const modules = useModules();
  const companion = useCompanion();
  const recovery = useRecovery();
  const { navigate, goBack, back } = useNav();
  const restedToday = dayIn(state.history, todayKey()).rested;

  // Self-heal if the app sat open past midnight — the reducer only rolls the
  // day on HYDRATE, so a long-running session would otherwise keep logging
  // into yesterday.
  useEffect(() => {
    if (modulesNeedRoll(state.modules)) dispatch({ type: 'MODULE_RESET_DAY', payload: {} });
  }, [state.modules, dispatch]);

  const doneCount = modules.filter((m) => m.progress.done).length;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Life Habits
      </PixelText>

      <FieldCard tone="ink" pad={12} style={{ marginBottom: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {companion ? (
            <PixelSprite
              spriteKey={companion.creature.sprite}
              palette={companion.creature.palette}
              size={44}
              bob
            />
          ) : null}
          <PixelText size="tiny" color={palette.windowFill} style={{ flex: 1, marginLeft: space.md, lineHeight: 14 }}>
            {habitsIntro()}
          </PixelText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
          <PixelText size="tiny" color={palette.secondary}>
            {doneCount} / {modules.length} goals met today
          </PixelText>
          <PixelText size="tiny" color={palette.windowBorderLight}>
            {state.stats.habitLogs || 0} logs all-time
          </PixelText>
        </View>
      </FieldCard>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recovery sits above the modules on purpose: when it has something to
            say, it matters more than any of them. */}
        <FieldCard tone="paper" pad={12} style={{ marginBottom: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PixelText size="body" color={palette.windowText}>Recovery</PixelText>
            <PixelText
              size="tiny"
              color={recovery.needsRest ? palette.danger : recovery.status === 'building' ? palette.accentDark : palette.success}
            >
              {recovery.headline}
            </PixelText>
          </View>
          <PixelText size="tiny" color={palette.windowText} style={{ marginTop: 8, lineHeight: 15 }}>
            {recovery.advice}
          </PixelText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
            <PixelText size="tiny" color={palette.windowTextDim}>7-day load {recovery.acute}</PixelText>
            <PixelText size="tiny" color={palette.windowTextDim}>vs usual {recovery.ratio ? `${recovery.ratio}x` : '-'}</PixelText>
            <PixelText size="tiny" color={palette.windowTextDim}>{recovery.streak}d streak</PixelText>
          </View>
          {recovery.deloadDue ? (
            <PixelText size="tiny" color={palette.accentDark} style={{ marginTop: 8, lineHeight: 14 }}>
              Three weeks of climbing load. A lighter week now is what makes the next hard one possible.
            </PixelText>
          ) : null}
          <PixelButton
            label={restedToday ? 'Rest day logged' : 'Log a Rest Day'}
            tone={restedToday ? 'plain' : recovery.needsRest ? 'gold' : 'dark'}
            size="small"
            disabled={restedToday}
            style={{ marginTop: space.sm }}
            onPress={() => {
              dispatch({ type: 'REST_DAY', payload: {} });
              playSfx('heal');
            }}
          />
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 7, lineHeight: 14 }}>
            Rest pays bond and healing, never XP. It is a training decision, not a way to earn.
          </PixelText>
        </FieldCard>

        {modules.map(({ module, state: modState, progress }) => (
          <ModuleCard
            key={module.id}
            module={module}
            state={modState}
            progress={progress}
            onPress={() => navigate(moduleScreen(module), { moduleId: module.id, from: 'habits' })}
          />
        ))}
        <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: space.xs, lineHeight: 14 }}>
          Habits feed the same growth as miles and battles.
        </PixelText>
      </ScrollView>

      <PixelButton
        label={back.label}
        tone="plain"
        sound="cancel"
        onPress={goBack}
        style={{ marginTop: space.sm }}
      />
    </Screen>
  );
}
