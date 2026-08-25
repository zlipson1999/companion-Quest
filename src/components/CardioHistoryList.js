import React from 'react';
import { View } from 'react-native';
import PixelText from './PixelText';
import { palette, space } from '../theme';
import { cardioStationLabel } from '../state/cardioHistory';
import { formatClock } from '../state/cardioMaths';

function shortDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved session';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CardioHistoryList({ sessions, limit = 6, empty = 'No completed cardio sessions yet.' }) {
  const rows = (Array.isArray(sessions) ? sessions : []).slice(-limit).reverse();
  if (!rows.length) {
    return (
      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 13 }}>
        {empty}
      </PixelText>
    );
  }
  return rows.map((session) => (
    <View
      key={session.id}
      style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm }}
    >
      <View style={{ flex: 1 }}>
        <PixelText size="tiny" color={palette.windowText}>
          {cardioStationLabel(session.station)}
        </PixelText>
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 3 }}>
          {shortDate(session.endedAt)} · {formatClock(session.seconds)}
        </PixelText>
      </View>
      <PixelText size="small" color={session.station === 'bike' ? palette.primaryDark : palette.accentDark}>
        {(session.miles || 0).toFixed(2)} mi
      </PixelText>
    </View>
  ));
}
