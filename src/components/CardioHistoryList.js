import React from 'react';
import { View } from 'react-native';
import PixelText from './PixelText';
import { palette, space } from '../theme';
import { cardioStationLabel } from '../state/cardioHistory';
import { formatClock } from '../state/cardioMaths';
import { MACHINE_BY_ID } from '../data/cardioMachines';

// What each machine is worth SHOWING as its headline figure. A rower has no
// distance the phone measured, so printing "0.00 mi" beside it would be the
// list inventing a metric; it shows the strokes or the machine's own total
// instead, and says when a number was typed in rather than sensed.
function headline(session) {
  const machine = MACHINE_BY_ID[session.station];
  if (!machine) return `${(session.miles || 0).toFixed(2)} mi`;
  if (session.miles > 0) return `${session.miles.toFixed(2)} mi`;
  if (session.machineMeters > 0) return `${session.machineMeters} m*`;
  if (session.machineMiles > 0) return `${session.machineMiles.toFixed(2)} mi*`;
  if (session.station === 'rower' && session.strokes > 0) return `${session.strokes} strokes*`;
  if (session.station === 'stairclimber' && session.floors > 0) return `${session.floors} floors*`;
  if (session.station === 'elliptical' && session.strides > 0) return `${session.strides} strides`;
  return formatClock(session.activeSeconds || session.seconds || 0);
}

function shortDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved session';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// A '*' marks a figure read off the physical machine and typed in, not one
// the phone measured. The distinction is the whole point of tracking honestly.
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
          {shortDate(session.endedAt)} · {formatClock(session.activeSeconds || session.seconds)}
          {session.creditsAwarded ? ` · +${session.creditsAwarded}c` : ''}
        </PixelText>
      </View>
      <PixelText size="small" color={session.station === 'bike' ? palette.primaryDark : palette.accentDark}>
        {headline(session)}
      </PixelText>
    </View>
  ));
}
