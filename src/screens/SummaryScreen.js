// Status / summary screen — a handheld-style data readout of your companion and
// your real-life progress.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, ProgressBar, HPBar, PixelText, PixelButton, PixelSprite } from '../components';
import { EVO_SOURCES, evolveHint, evolveProgress } from '../state/evolution';
import { palette, space } from '../theme';
import { useGame, useCompanion, useModules } from '../state';
import { useNav } from './navContext';
import { getGoal } from '../data/goals';
import { moduleSprite } from '../modules';

function StatCell({ label, value, color }) {
  return (
    <View style={{ width: '50%', paddingVertical: 8, paddingHorizontal: 4 }}>
      <PixelText size="tiny" color={palette.windowTextDim}>
        {label}
      </PixelText>
      <PixelText size="body" color={color || palette.windowText} style={{ marginTop: 6 }}>
        {value}
      </PixelText>
    </View>
  );
}

export default function SummaryScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate, goBack, back } = useNav();
  const modules = useModules();
  const goal = getGoal(state.goalId);
  const evo = evolveProgress(companion, companion.creature, companion.level);
  const s = state.stats;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Status
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Window tone="dark" pad={14}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', marginRight: space.md }}>
              <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={88} bob />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <PixelText size="label" color={palette.secondary}>
                {companion.creature.name}
              </PixelText>
              <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 6 }}>
                {companion.creature.species}
              </PixelText>
              <PixelText size="small" color={palette.windowFill} style={{ marginTop: 10 }}>
                Lv. {companion.level}
              </PixelText>
            </View>
          </View>
          <View style={{ marginTop: space.md }}>
            <HPBar hp={companion.hp} maxHp={companion.maxHp} width={200} label="HP" />
          </View>
          <View style={{ marginTop: space.sm }}>
            <ProgressBar value={companion.xpInto} max={companion.xpNeeded} color={palette.xp} height={12} label="XP to next level" />
          </View>
          {/* Evolve points: what the real-world work is actually building
              toward. Shown next to XP because they are different things and the
              difference matters — XP comes from playing, this comes from doing. */}
          {evo ? (
            <View style={{ marginTop: space.sm }}>
              <ProgressBar
                value={Math.min(evo.points, evo.needPoints)}
                max={evo.needPoints}
                color={palette.success}
                height={12}
                label={`Evolve points  ${evo.points}/${evo.needPoints}`}
                showText={false}
              />
              <PixelText size="tiny" color={evo.ready ? palette.secondary : palette.windowBorderLight} style={{ marginTop: 5, lineHeight: 13 }}>
                {evolveHint(companion, companion.creature, companion.level)}
              </PixelText>
              <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 5, lineHeight: 13 }}>
                Earned from {Object.values(EVO_SOURCES).map((s) => s.label).join(', ')}.
              </PixelText>
            </View>
          ) : (
            <PixelText size="tiny" color={palette.secondary} style={{ marginTop: space.sm }}>
              Final form — nothing left to grow into.
            </PixelText>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
            <PixelText size="tiny" color={palette.accent}>
              Bond {companion.bond}
            </PixelText>
            <PixelText size="tiny" color={palette.windowBorderLight}>
              Goal: {goal ? goal.name : '-'}
            </PixelText>
          </View>
          {companion.creature.flavor ? (
            <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: space.sm, lineHeight: 14 }}>
              {companion.creature.flavor}
            </PixelText>
          ) : null}
        </Window>

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
            Your Journey
          </PixelText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <StatCell label="Distance" value={`${(s.distanceMi || 0).toFixed(2)} mi`} color={palette.primaryDark} />
            <StatCell label="Total steps" value={s.totalSteps.toLocaleString()} />
            <StatCell label="Milestones" value={s.milestonesReached} />
            <StatCell label="Companions" value={s.caught || 0} color={palette.success} />
            <StatCell label="Battles won" value={s.battlesWon} color={palette.success} />
            <StatCell label="Battles lost" value={s.battlesLost} />
            <StatCell label="Workouts" value={s.workoutsDone} color={palette.accentDark} />
            <StatCell label="Items found" value={s.itemsCollected} />
            <StatCell label="Habit logs" value={s.habitLogs || 0} color={palette.primaryDark} />
            <StatCell label="Goals met" value={s.habitGoalsHit || 0} color={palette.success} />
            <StatCell label="Day streak" value={`${s.streak} days`} color={palette.accentDark} />
            <StatCell label="Days active" value={s.daysActive} />
          </View>
        </Window>

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
            Daily Habits
          </PixelText>
          {modules.map(({ module, state: modState, progress }) => (
            <View key={module.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <PixelSprite spriteKey={moduleSprite(module)} palette={module.spritePalette} size={22} />
              <PixelText size="tiny" color={palette.windowText} style={{ flex: 1, marginLeft: space.sm }}>
                {module.name}
              </PixelText>
              <PixelText size="tiny" color={progress.done ? palette.success : palette.windowTextDim}>
                {progress.value}/{progress.goal}
              </PixelText>
              <PixelText size="tiny" color={palette.accentDark} style={{ width: 62, textAlign: 'right' }}>
                {modState.streak}d streak
              </PixelText>
            </View>
          ))}
        </Window>
      </ScrollView>

      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
