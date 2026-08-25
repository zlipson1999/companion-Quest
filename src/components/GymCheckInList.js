import React from 'react';
import { View } from 'react-native';
import PixelText from './PixelText';
import { palette } from '../theme';
import { normalizeGymCheckIns } from '../state/gymCheckIns';

function dateLabel(entry) {
  const value = new Date(entry.checkedAt);
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeLabel(entry) {
  const value = new Date(entry.checkedAt);
  return value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function GymCheckInList({ entries, limit = null }) {
  const all = normalizeGymCheckIns(entries).slice().reverse();
  const recent = Number.isFinite(limit) ? all.slice(0, limit) : all;
  if (!recent.length) {
    return (
      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
        No Quest Fitness check-ins yet.
      </PixelText>
    );
  }
  return recent.map((entry) => (
    <View
      key={entry.day}
      style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}
    >
      <PixelText size="tiny" color={palette.windowText}>{dateLabel(entry)}</PixelText>
      <PixelText size="tiny" color={palette.primaryDark}>{timeLabel(entry)}</PixelText>
    </View>
  ));
}
