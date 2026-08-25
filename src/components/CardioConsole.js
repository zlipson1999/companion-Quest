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
import {
  formatClock,
  formatPace,
  formatSpeed,
  lapsFor,
  paceFor,
  speedFor,
  splitPer500,
} from '../state/cardioMaths';
import { MACHINE_BY_ID } from '../data/cardioMachines';

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

// Readouts per row. Five across a phone is unreadable; three is the most that
// fits with its label intact.
const PER_ROW = 3;

export default function CardioConsole({
  station = 'treadmill',
  // What the fascia calls itself. The trail is not a treadmill.
  title,
  seconds = 0,
  miles = 0,
  steps = 0,
  // Live session state from state/cardioSession.js. 'running' banks active
  // seconds; everything else banks paused seconds and pays nothing.
  phase = 'running',
  kcal = 0,
  credits = 0,
  manual = {},
  taps = 0,
  onManual,
  onTap,
  onPause,
  onResume,
  // Bodyweight work done on this outing, as ONE number. It used to be SETS and
  // REPS side by side, which asked you to add two figures together to know how
  // much you had done — and the breakdown underneath already names every
  // exercise, so the detail was never in the digits. Omitted entirely by the
  // cardio deck: there is nothing to interrupt you on a treadmill, so a
  // permanently-zero counter would be furniture.
  workouts,
  // A short line of what the session actually consisted of. "42 reps" is a
  // number; "10 push-ups · 15 squats · 20s plank" is what you did.
  breakdown,
  bodyWeightLb,
  moving = false,
  gpsActive = false,
  gpsError,
  note,
  onStop,
  onStartGps,
  // Only passed when nothing on the device can count a step. The trail already
  // offers these; without them here the deck is a console that can never move,
  // which is worse than no console.
  onInject,
  // Anything the place adds of its own — the trail hangs its milestone and
  // encounter meters here.
  children,
  style,
  compact = false,
}) {
  const bike = station === 'bike';
  const machine = MACHINE_BY_ID[station];
  const pace = paceFor(miles, seconds);
  const speed = speedFor(miles, seconds);
  const paused = phase === 'paused';
  const timerOnly = !!machine && machine.tracking === 'timer';
  // The second big readout is whatever this machine actually measures. A
  // stair climber showing DISTANCE would be borrowing the treadmill's
  // headline for a number nobody climbs in.
  const headline = station === 'stairclimber'
    ? { label: 'STEPS', value: steps.toLocaleString() }
    : station === 'elliptical'
      ? { label: 'STRIDES', value: steps.toLocaleString() }
      : timerOnly
        ? { label: 'CREDITS', value: String(credits) }
        : { label: 'DISTANCE', value: miles.toFixed(2), unit: 'mi' };
  // Manual values are read off the machine, so they are only meaningful once
  // the player has entered them — the console never guesses at one.

  // Each machine shows what it actually measures, in its own language: a
  // rower judges a piece by metres and split, a climber by floors and steps
  // per minute, a cyclist by speed and cadence. A permanently-blank PACE on
  // a rower would be the console claiming a number it does not have.
  const activeMin = seconds / 60;
  const rowerMeters = manual.machineMeters || 0;
  const split = splitPer500(rowerMeters, seconds);
  const cells = [
    ...(bike ? [
      { label: 'SPEED', value: formatSpeed(speed), unit: 'mph' },
      { label: 'CADENCE', value: manual.cadence ? String(manual.cadence) : '--', unit: 'rpm' },
      { label: 'KCAL', value: String(Math.round(kcal)) },
      { label: 'GPS', value: gpsActive ? 'LIVE' : 'READY' },
    ] : station === 'rower' ? [
      { label: 'METRES', value: rowerMeters ? String(Math.round(rowerMeters)) : '--' },
      { label: 'SPLIT', value: split ? formatClock(split) : '--', unit: '/500m' },
      { label: 'KCAL', value: String(Math.round(kcal)) },
    ] : station === 'stairclimber' ? [
      { label: 'FLOORS', value: String(manual.floors || 0) },
      { label: 'SPM', value: activeMin > 0.5 ? String(Math.round(steps / activeMin)) : '--' },
      { label: 'KCAL', value: String(Math.round(kcal)) },
      { label: 'LEVEL', value: String(manual.level || 0) },
    ] : station === 'elliptical' ? [
      { label: 'DISTANCE', value: manual.machineMiles ? manual.machineMiles.toFixed(2) : '--', unit: 'mi' },
      { label: 'KCAL', value: String(Math.round(kcal)) },
      { label: 'RESIST', value: String(manual.level || 0) },
    ] : [
      { label: 'LAPS', value: lapsFor(miles).toFixed(1) },
      { label: 'PACE', value: formatPace(pace), unit: '/mi' },
      { label: 'KCAL', value: String(Math.round(kcal)) },
      { label: 'STEPS', value: steps.toLocaleString() },
    ]),
    // The work, as opposed to the walking. Challenges are real sets of real
    // exercises; they used to pay their damage and then vanish uncounted.
    ...(workouts == null ? [] : [{ label: 'WORKOUTS', value: String(workouts) }]),
  ];
  const rows = [];
  for (let i = 0; i < cells.length; i += PER_ROW) {
    const row = cells.slice(i, i + PER_ROW);
    while (row.length < PER_ROW) row.push(null);
    rows.push(row);
  }

  const machineTitle = title || (machine ? machine.name.toUpperCase() : 'TREADMILL');
  const statusWord = paused ? 'PAUSED'
    : bike ? (moving ? 'RIDING' : gpsActive ? 'READY' : 'READY')
    : moving ? 'MOVING' : 'STOPPED';

  // In the gym this is a machine fascia laid over one corner of the room, not
  // a destination screen. Keep every live number and both bike actions, but
  // remove the long-form explanation so the player and machine remain visible.
  if (compact) {
    const compactRows = [];
    const perCompactRow = bike ? 3 : 4;
    for (let i = 0; i < cells.length; i += perCompactRow) {
      compactRows.push(cells.slice(i, i + perCompactRow));
    }
    const stopLabel = bike && gpsActive ? 'End Bike Ride'
      : bike && phase === 'ready' ? 'Step off'
      : 'Finish';

    return (
      <View
        style={[
          {
            backgroundColor: '#101219ee',
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
            {machineTitle}
          </PixelText>
          <PixelText size="tiny" color={paused ? palette.danger : moving || gpsActive ? palette.secondary : tokens.disabledInk}>
            {statusWord}
          </PixelText>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <Readout label="ACTIVE" value={formatClock(seconds)} big live={moving && !paused} />
          <Readout {...headline} big live={moving && !paused} />
        </View>

        {compactRows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 5 }}>
            {row.map((cell) => <Readout key={cell.label} {...cell} />)}
          </View>
        ))}

        <PixelText size="tiny" color={tokens.textOnDarkDim} numberOfLines={2} style={{ marginTop: 6, lineHeight: 13 }}>
          {`Active time pays Quest Credits — ${credits} so far. Gym cardio only: never trail progress.`}
        </PixelText>

        {gpsError ? (
          <PixelText size="tiny" color={palette.danger} numberOfLines={2} style={{ marginTop: 5, lineHeight: 13 }}>
            {gpsError}
          </PixelText>
        ) : note ? (
          <PixelText size="tiny" color={palette.windowFill} numberOfLines={2} style={{ marginTop: 5, lineHeight: 13 }}>
            {note}
          </PixelText>
        ) : null}

        {onInject ? (
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            {[[100, '+0.05mi'], [500, '+0.25mi'], [2000, '+1mi']].map(([n, label], i) => (
              <PixelButton
                key={n}
                label={label}
                tone="dark"
                size="small"
                sound="cursor"
                style={{ flex: 1, marginRight: i < 2 ? 4 : 0, paddingVertical: 6 }}
                onPress={() => onInject(n)}
              />
            ))}
          </View>
        ) : null}

        {onTap ? (
          <PixelButton
            label={`Log a stroke  (${(manual.strokes || 0) + taps})`}
            tone="dark"
            size="small"
            sound="cursor"
            style={{ marginTop: 6, paddingVertical: 8 }}
            disabled={paused}
            onPress={onTap}
          />
        ) : null}

        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          {bike && !gpsActive && onStartGps ? (
            <TrailAction
              label="Start Bike Ride"
              sublabel="Start parked"
              tone="primary"
              style={{ flex: 1, marginRight: 6 }}
              onPress={onStartGps}
            />
          ) : null}
          {onPause && !(bike && !gpsActive) ? (
            <PixelButton
              label={paused ? 'Resume' : 'Pause'}
              tone="dark"
              size="small"
              sound="cursor"
              style={{ flex: 1, marginRight: 6, paddingVertical: 8 }}
              onPress={paused ? onResume : onPause}
            />
          ) : null}
          {onStop ? (
            <TrailAction label={stopLabel} tone="primary" style={{ flex: 1 }} onPress={onStop} />
          ) : null}
        </View>

      </View>
    );
  }

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
          {machineTitle}
        </PixelText>
        {/* The one moving part of a console you are not touching. */}
        <PixelText size="tiny" color={paused ? palette.danger : moving || gpsActive ? palette.secondary : tokens.disabledInk}>
          {`- ${statusWord} -`}
        </PixelText>
      </View>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <Readout label="ACTIVE" value={formatClock(seconds)} big live={moving && !paused} />
        <Readout {...headline} big live={moving && !paused} />
      </View>

      {/* Three to a row. Five across a phone put four characters under a
          five-character label and the whole band stopped being readable — so
          the readouts are laid out as a grid rather than as fixed rows, and a
          short last row is padded to keep its columns under the ones above. */}
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: space.sm }}>
          {row.map((cell, j) =>
            cell ? <Readout key={cell.label} {...cell} /> : <View key={`pad${j}`} style={{ flex: 1 }} />
          )}
        </View>
      ))}

      {breakdown ? (
        <View
          style={{
            marginTop: space.sm,
            borderTopColor: tokens.line,
            borderTopWidth: 2,
            paddingTop: space.sm,
          }}
        >
          <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ letterSpacing: 1 }}>
            THIS SESSION
          </PixelText>
          <PixelText size="tiny" color={palette.secondary} style={{ marginTop: 5, lineHeight: 14 }}>
            {breakdown}
          </PixelText>
        </View>
      ) : null}

      {/* Which of these the machine actually knows, and what it pays. */}
      <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: space.sm, lineHeight: 13 }}>
        {machine ? machine.statLine : ''}
      </PixelText>
      <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 5, lineHeight: 13 }}>
        {`Gym cardio: active time pays Quest Credits (${credits} so far this session) and never advances a trail, its milestones or its encounters. Kcal is an estimate.`}
      </PixelText>
      {machine && machine.safety ? (
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 5, lineHeight: 13 }}>
          {machine.safety}
        </PixelText>
      ) : null}


      {bike && !gpsActive && onStartGps ? (
        <View style={{ marginTop: space.sm }}>
          <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ lineHeight: 13 }}>
            Start while stopped, secure the phone, then ride. Do not use the screen while the bicycle is moving.
          </PixelText>
          <TrailAction label="Start Bike Ride" tone="primary" style={{ marginTop: space.sm }} onPress={onStartGps} />
        </View>
      ) : null}

      {gpsError ? (
        <PixelText size="tiny" color={palette.danger} style={{ marginTop: space.sm, lineHeight: 13 }}>
          {gpsError}
        </PixelText>
      ) : null}

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

      {children}

      {note ? (
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6, lineHeight: 13 }}>
          {note}
        </PixelText>
      ) : null}

      {/* Outdoors there is no getting off a trail, so the trail passes no
          onStop and keeps its own way back. */}
      {onStop ? (
        <TrailAction
          label={bike && gpsActive ? 'End Bike Ride' : 'Finish session'}
          tone="primary"
          style={{ marginTop: space.sm }}
          onPress={onStop}
        />
      ) : null}
    </View>
  );
}
