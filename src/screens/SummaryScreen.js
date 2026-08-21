// Status / summary screen — a handheld-style data readout of your companion and
// your real-life progress.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, ProgressBar, HPBar, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { getGoal } from '../data/goals';

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
  const { navigate } = useNav();
  const goal = getGoal(state.goalId);
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
            <StatCell label="Day streak" value={`${s.streak} days`} color={palette.accentDark} />
            <StatCell label="Days active" value={s.daysActive} />
          </View>
        </Window>
      </ScrollView>

      <PixelButton label="Back to Town" tone="plain" sound="cancel" onPress={() => navigate('hub')} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
