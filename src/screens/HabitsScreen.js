// The Habits hub — every installed life module as a bordered card showing
// today's standing. This screen is written against the registry, not against
// hydration/diet specifically: drop a new module into src/modules and it turns
// up here with a card, a progress bar and a log screen for free.

import React, { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite, Triangle } from '../components';
import { palette, space } from '../theme';
import { useGame, useModules, useCompanion } from '../state';
import { moduleSprite, moduleSummary, modulesNeedRoll } from '../modules';
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
      <Window tone="cream" pad={12}>
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
      </Window>
    </Pressable>
  );
}

export default function HabitsScreen() {
  const { state, dispatch } = useGame();
  const modules = useModules();
  const companion = useCompanion();
  const { navigate } = useNav();

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

      <Window tone="dark" pad={12} style={{ marginBottom: space.sm }}>
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
      </Window>

      <ScrollView showsVerticalScrollIndicator={false}>
        {modules.map(({ module, state: modState, progress }) => (
          <ModuleCard
            key={module.id}
            module={module}
            state={modState}
            progress={progress}
            onPress={() => navigate('habit', { moduleId: module.id })}
          />
        ))}
        <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: space.xs, lineHeight: 14 }}>
          Habits feed the same growth as miles and battles.
        </PixelText>
      </ScrollView>

      <PixelButton
        label="Back to Town"
        tone="plain"
        sound="cancel"
        onPress={() => navigate('hub')}
        style={{ marginTop: space.sm }}
      />
    </Screen>
  );
}
