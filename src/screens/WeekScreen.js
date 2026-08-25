// The weekly rollup.
//
// Streaks answer "did I show up today". Nothing answered "how was my week" —
// which is the question people actually ask themselves, and the timescale
// training is planned on. Seven columns, this week against last, and the honest
// arithmetic underneath.

import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, PixelText, FieldCard, TrailAction, ObjectiveRibbon } from '../components';
import { palette, space, tokens } from '../theme';
import { useGame, useModules, useRecovery } from '../state';
import { isActive, previousWeekOf, totals, weekOf } from '../state/history';
import { todayKey } from '../modules';
import { useNav } from './navContext';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MAX_BAR = 46;

function Delta({ now, then, unit, invert }) {
  const d = Math.round((now - then) * 10) / 10;
  if (!then && !now) return <PixelText size="tiny" color={palette.windowTextDim}>—</PixelText>;
  const better = invert ? d < 0 : d > 0;
  const color = d === 0 ? palette.windowTextDim : better ? palette.success : palette.accentDark;
  return (
    <PixelText size="tiny" color={color}>
      {d === 0 ? 'same' : `${d > 0 ? '+' : ''}${d}${unit || ''}`}
    </PixelText>
  );
}

export default function WeekScreen() {
  const { state } = useGame();
  const modules = useModules();
  const recovery = useRecovery();
  const { navigate, goBack, back } = useNav();
  const today = todayKey();

  const days = useMemo(() => weekOf(state.history, today), [state.history, today]);
  const prev = useMemo(() => previousWeekOf(state.history, today), [state.history, today]);

  // Days elapsed so far this week, today included. Comparing a Tuesday against
  // a complete previous week made every delta red and had the verdict read
  // "2 active days against 6 last week" — true, and useless.
  const elapsed = Math.max(1, days.findIndex((d) => d.date === today) + 1);
  const now = totals(days.slice(0, elapsed));
  const before = totals(prev.slice(0, elapsed));
  const partWeek = elapsed < 7;

  // Bars are scaled against the busiest day across BOTH weeks, so this week
  // looking smaller actually means it was smaller.
  const peak = Math.max(1, ...days.concat(prev).map((d) => d.xp || 0));

  return (
    <Screen style={{ padding: space.md }}>
      <ObjectiveRibbon place="Your Week" objective="Seven columns. This week against last." />

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.md }}>
        <FieldCard tone="ink" title="This week">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: MAX_BAR + 34 }}>
            {days.map((d, i) => {
              const future = i >= elapsed;
              const h = future ? 2 : Math.max(2, Math.round(((d.xp || 0) / peak) * MAX_BAR));
              const isToday = d.date === today;
              const color = future
                ? palette.inkSoft
                : d.rested
                ? palette.water
                : isActive(d)
                ? palette.xp
                : palette.barTrack;
              return (
                <View key={d.date} style={{ alignItems: 'center', flex: 1 }}>
                  <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginBottom: 4 }}>
                    {future ? '' : d.xp || ''}
                  </PixelText>
                  <View style={{ width: 16, height: h, backgroundColor: color, borderWidth: 2, borderColor: palette.ink }} />
                  <PixelText size="tiny" color={isToday ? palette.secondary : palette.windowBorderLight} style={{ marginTop: 5 }}>
                    {DAY_LETTERS[i]}
                  </PixelText>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
            <PixelText size="tiny" color={palette.xp}>trained</PixelText>
            <PixelText size="tiny" color={palette.water}>rested</PixelText>
            <PixelText size="tiny" color={palette.windowBorderLight}>nothing logged</PixelText>
          </View>
        </FieldCard>

        <FieldCard tone="paper" title={partWeek ? 'This week so far' : 'This week'} caption={partWeek ? `vs same ${elapsed} day${elapsed === 1 ? '' : 's'} last week` : 'vs last'} style={{ marginTop: space.sm }}>
          {[
            ['Active days', now.activeDays, before.activeDays, ''],
            ['Rest days', now.restDays, before.restDays, ''],
            ['Workout sessions', now.sessions + now.workouts, before.sessions + before.workouts, ''],
            ['Total distance', Math.round(now.distanceMi * 100) / 100, Math.round(before.distanceMi * 100) / 100, ' mi'],
            ['Bike distance', Math.round(now.cyclingMi * 100) / 100, Math.round(before.cyclingMi * 100) / 100, ' mi'],
            ['Bike rides', now.rides, before.rides, ''],
            ['Cardio sessions', now.cardioSessions, before.cardioSessions, ''],
            ['Habit logs', now.habitLogs, before.habitLogs, ''],
            ['Daily goals met', now.goalsMet, before.goalsMet, ''],
            ['XP earned', now.xp, before.xp, ''],
            ['Training load', Math.round(now.load * 10) / 10, Math.round(before.load * 10) / 10, ''],
          ].map((r) => (
            <View key={r[0]} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
              <PixelText size="tiny" color={palette.windowTextDim} style={{ flex: 1 }}>{r[0]}</PixelText>
              <PixelText size="small" color={palette.windowText} style={{ width: 62, textAlign: 'right' }}>
                {r[1]}{r[3]}
              </PixelText>
              <View style={{ width: 58, alignItems: 'flex-end' }}>
                <Delta now={r[1]} then={r[2]} unit={r[3]} />
              </View>
            </View>
          ))}
        </FieldCard>

        <FieldCard tone="paper" title="Habits this week" style={{ marginTop: space.sm }}>
          {modules.map(({ module, state: modState }) => (
            <View key={module.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <PixelText size="tiny" color={palette.windowText} style={{ flex: 1 }}>{module.name}</PixelText>
              <PixelText size="tiny" color={modState.streak > 0 ? palette.accentDark : palette.windowTextDim}>
                {modState.streak}d streak
              </PixelText>
              <PixelText size="tiny" color={palette.windowTextDim} style={{ width: 74, textAlign: 'right' }}>
                best {modState.bestStreak}
              </PixelText>
            </View>
          ))}
        </FieldCard>

        <FieldCard tone="ink" title="How it is going" style={{ marginTop: space.sm }}>
          <PixelText
            size="tiny"
            color={tokens.textOnDark}
            style={{ lineHeight: 15 }}
            accessibilityRole="text"
            accessibilityLabel={weekVerdict(now, before, recovery, partWeek, elapsed)}
          >
            {weekVerdict(now, before, recovery, partWeek, elapsed)}
          </PixelText>
        </FieldCard>
        <View style={{ height: space.sm }} />
      </ScrollView>

      <TrailAction label={back.label} tone="quiet" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}

// One plain sentence about the week. Says the awkward thing when there is one.
// Every comparison here is against the SAME number of days last week, so a
// midweek verdict is a fair one.
function weekVerdict(now, before, recovery, partWeek, elapsed) {
  const span = partWeek ? `${elapsed} day${elapsed === 1 ? '' : 's'} in` : 'This week';
  if (!now.activeDays && !now.restDays) {
    return partWeek
      ? `Nothing logged yet this week. One small thing today is how weeks like this turn around.`
      : 'A blank week. It happens — the next one starts whenever you decide it does.';
  }
  if (recovery.needsRest) return `${now.activeDays} active days and ${now.restDays} rest days. ${recovery.advice}`;
  if (!partWeek && now.activeDays >= 6 && !now.restDays) {
    return `${now.activeDays} days on and none off. Impressive, and not something to repeat next week.`;
  }
  if (now.activeDays > before.activeDays) {
    return `${span}: ${now.activeDays} active days, against ${before.activeDays} by this point last week. That is the direction that matters.`;
  }
  if (now.activeDays < before.activeDays) {
    return `${span}: ${now.activeDays} active days, against ${before.activeDays} by this point last week. Weeks vary — what counts is that the next one starts.`;
  }
  return `${span}: ${now.activeDays} active days and ${now.restDays} rest. Steady is underrated.`;
}
