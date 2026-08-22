// The treadmill console.
//
// Modelled on the thing it is: a dark fascia with lit readouts, the big numbers
// you actually watch across the top and the rest in a row underneath, each
// under a small hard label. It sits over the room rather than replacing it —
// you are standing on the deck in the gym, not on a screen about a gym.
//
// Three of these numbers are measured and one is not, and the console says so.
// A calorie estimate printed in the same style as a distance reads as a fourth
// measurement, which would be the display lying about how much it knows.

import React from 'react';
import { View } from 'react-native';
import PixelText from './PixelText';
import PixelButton from './PixelButton';
import TrailAction from './TrailAction';
import { palette, tokens, scale, space } from '../theme';
import { formatClock, formatPace, kcalFor, lapsFor, paceFor } from '../state/cardioMaths';

function Readout({ label, value, unit, big, live }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ letterSpacing: 1 }}>
        {label}
      </PixelText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
        <PixelText
          size={big ? 'heading' : 'small'}
          color={live ? palette.secondary : tokens.textOnDark}
        >
          {value}
        </PixelText>
        {unit ? (
          <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginLeft: 3 }}>
            {unit}
          </PixelText>
        ) : null}
      </View>
    </View>
  );
}

export default function CardioConsole({
  station = 'treadmill',
  seconds = 0,
  miles = 0,
  steps = 0,
  bodyWeightLb,
  moving = false,
  note,
  onStop,
  // Only passed when nothing on the device can count a step. The trail already
  // offers these; without them here the deck is a console that can never move,
  // which is worse than no console.
  onInject,
  style,
}) {
  const pace = paceFor(miles, seconds);
  const kcal = kcalFor(miles, seconds, bodyWeightLb);

  return (
    <View
      style={[
        {
          backgroundColor: tokens.surfaceSunken,
          borderColor: tokens.line,
          borderWidth: 3,
          borderRadius: scale.radius.panel,
          padding: space.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ letterSpacing: 1 }}>
          {station === 'rower' ? 'ROWER' : 'TREADMILL'}
        </PixelText>
        {/* The one moving part of a console you are not touching. */}
        <PixelText size="tiny" color={moving ? palette.secondary : tokens.disabledInk}>
          {moving ? '- RUNNING -' : '- READY -'}
        </PixelText>
      </View>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <Readout label="TIME" value={formatClock(seconds)} big live={moving} />
        <Readout label="DISTANCE" value={miles.toFixed(2)} unit="mi" big live={moving} />
      </View>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <Readout label="LAPS" value={lapsFor(miles).toFixed(1)} />
        <Readout label="PACE" value={formatPace(pace)} unit="/mi" />
        <Readout label="KCAL" value={String(Math.round(kcal))} />
        <Readout label="STEPS" value={steps.toLocaleString()} />
      </View>

      {/* Which of these the machine actually knows. */}
      <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: space.sm, lineHeight: 13 }}>
        {'Laps are quarter miles. Kcal is an estimate from your distance, pace and body weight — set it in Options.'}
      </PixelText>

      {onInject ? (
        <View style={{ marginTop: space.sm }}>
          <PixelText size="tiny" color={palette.danger}>
            No step counter on this device
          </PixelText>
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            {[[100, '+0.05mi'], [500, '+0.25mi'], [2000, '+1mi']].map(([n, label], i) => (
              <PixelButton
                key={n}
                label={label}
                tone="dark"
                size="small"
                sound="cursor"
                style={{ flex: 1, marginRight: i < 2 ? 6 : 0, paddingVertical: 8 }}
                onPress={() => onInject(n)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {note ? (
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6, lineHeight: 13 }}>
          {note}
        </PixelText>
      ) : null}

      <TrailAction
        label={station === 'rower' ? 'Off the rower' : 'Step off the deck'}
        tone="primary"
        style={{ marginTop: space.sm }}
        onPress={onStop}
      />
    </View>
  );
}
