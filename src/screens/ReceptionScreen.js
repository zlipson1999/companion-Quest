// Quest Fitness reception — an attendance desk, not a second stats screen.
// Reaching this screen means the player physically walked into the reception
// tile, so mounting it records today's first arrival time automatically.

import React, { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton } from '../components';
import { gymLocalDayKey, useGame } from '../state';
import { palette, space } from '../theme';
import { useNav } from './navContext';

function timeLabel(entry) {
  if (!entry) return '--';
  return new Date(entry.checkedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ReceptionScreen() {
  const { state, dispatch } = useGame();
  const { goBack, back } = useNav();
  const arrival = useRef(null);
  if (!arrival.current) {
    const now = new Date();
    arrival.current = { checkedAt: now.toISOString(), day: gymLocalDayKey(now) };
  }

  useEffect(() => {
    dispatch({ type: 'GYM_CHECK_IN', payload: arrival.current });
  }, [dispatch]);

  const entries = state.gymCheckIns || [];
  const todayEntry = entries.find((entry) => entry.day === arrival.current.day);

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Reception
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Window tone="dark" pad={14}>
          <PixelText size="body" color={palette.secondary}>Quest Fitness Check-In</PixelText>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 8, lineHeight: 14 }}>
            You walked up to the desk, so today’s visit is in the book. Reception records attendance only—no mileage, workouts, battles, or rewards.
          </PixelText>
        </Window>

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="small" color={palette.success}>CHECKED IN</PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 13 }}>
            {todayEntry
              ? `Today at ${timeLabel(todayEntry)}. Returning to the desk today keeps the original arrival time.`
              : 'Recording today’s arrival…'}
          </PixelText>
        </Window>

        <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: space.md, lineHeight: 14 }}>
          Open Phone → Personal Tracker to see your attendance streak, total days, and dated check-in times.
        </PixelText>

        <PixelButton label={back} tone="plain" onPress={goBack} style={{ marginTop: space.md }} />
        <View style={{ height: space.lg }} />
      </ScrollView>
    </Screen>
  );
}
