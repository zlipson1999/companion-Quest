// The completion summary: what the session actually was, before it is saved.
//
// This is where manual entry lives, deliberately. Typing a number while a
// stair climber is moving under you is the sort of thing a wellness game
// should not ask for, so the machines that cannot sense their own totals ask
// for them HERE — stopped, off the machine, reading its display — and every
// hand-entered figure is labelled as hand-entered so the record never
// pretends a phone measured it.
//
// Saving is one press and one press only: the reducer refuses a session id it
// has already stored, so a double tap, a re-render or a reload cannot pay the
// credits twice.

import React from 'react';
import { ScrollView, View } from 'react-native';
import PixelText from './PixelText';
import PixelButton from './PixelButton';
import TrailAction from './TrailAction';
import { palette, tokens, scale, space } from '../theme';
import { formatClock, splitPer500 } from '../state/cardioMaths';
import { MACHINE_BY_ID } from '../data/cardioMachines';
import { CARDIO_MIN_ACTIVE_SEC } from '../state/economy';

function Row({ label, value, tone }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
      <PixelText size="tiny" color={tokens.textOnDarkDim}>{label}</PixelText>
      <PixelText size="tiny" color={tone || tokens.textOnDark}>{value}</PixelText>
    </View>
  );
}

export default function CardioSummary({
  station,
  activeSeconds = 0,
  pausedSeconds = 0,
  miles = 0,
  steps = 0,
  taps = 0,
  kcal = 0,
  credits = 0,
  manual = {},
  onManual,
  onSave,
  style,
}) {
  const machine = MACHINE_BY_ID[station];
  const qualified = activeSeconds >= CARDIO_MIN_ACTIVE_SEC;
  const short = Math.max(0, CARDIO_MIN_ACTIVE_SEC - activeSeconds);

  return (
    <View
      style={[
        {
          backgroundColor: '#101219f2',
          borderColor: tokens.line,
          borderWidth: 3,
          borderRadius: scale.radius.panel,
          padding: space.sm,
        },
        style,
      ]}
    >
      <PixelText size="tiny" color={palette.secondary} style={{ letterSpacing: 1 }}>
        {`${machine ? machine.name.toUpperCase() : 'CARDIO'} — SESSION COMPLETE`}
      </PixelText>

      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        <Row label="Active time" value={formatClock(activeSeconds)} tone={palette.secondary} />
        {pausedSeconds > 0 ? <Row label="Paused (unpaid)" value={formatClock(pausedSeconds)} /> : null}
        {machine && machine.tracking === 'gps' ? <Row label="GPS distance" value={`${miles.toFixed(2)} mi`} /> : null}
        {machine && machine.tracking === 'gps' && activeSeconds > 30 ? (
          <Row label="Average speed" value={`${(miles / (activeSeconds / 3600)).toFixed(1)} mph`} />
        ) : null}
        {machine && machine.id === 'treadmill' ? <Row label="Distance" value={`${miles.toFixed(2)} mi`} /> : null}
        {machine && machine.tracking === 'steps' ? (
          <Row label={machine.id === 'elliptical' ? 'Strides (sensor)' : 'Steps (sensor)'} value={steps.toLocaleString()} />
        ) : null}
        {machine && machine.id === 'stairclimber' && activeSeconds > 30 ? (
          <Row label="Steps per minute" value={String(Math.round(steps / (activeSeconds / 60)))} />
        ) : null}
        {taps > 0 ? <Row label="Strokes you logged" value={String(taps)} /> : null}
        {machine && machine.id === 'rower' && manual.machineMeters ? (
          <Row
            label="Split (per 500 m)"
            value={formatClock(splitPer500(manual.machineMeters, activeSeconds) || 0)}
            tone={palette.secondary}
          />
        ) : null}
        <Row label="Kcal (estimate)" value={String(Math.round(kcal))} />

        {machine && machine.manual.length ? (
          <View style={{ marginTop: space.sm, borderTopColor: tokens.line, borderTopWidth: 2, paddingTop: space.sm }}>
            <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ letterSpacing: 1 }}>
              FROM THE MACHINE DISPLAY — ENTERED BY HAND
            </PixelText>
            <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 4, lineHeight: 13 }}>
              Optional. Read these off the machine now that you are stopped; your phone cannot measure them.
            </PixelText>
            {machine.manual.map((field) => (
              <View key={field.key} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <PixelText size="tiny" color={palette.windowFill} style={{ flex: 1 }}>
                  {`${field.label}: ${manual[field.key] || 0}`}
                </PixelText>
                <PixelButton
                  label="-"
                  tone="dark"
                  size="small"
                  sound="cursor"
                  style={{ width: 42, paddingVertical: 6, marginRight: 4 }}
                  onPress={() => onManual(field.key, Math.max(0, Math.round(((manual[field.key] || 0) - field.step) * 10) / 10))}
                />
                <PixelButton
                  label="+"
                  tone="dark"
                  size="small"
                  sound="cursor"
                  style={{ width: 42, paddingVertical: 6 }}
                  onPress={() => onManual(field.key, Math.min(field.max, Math.round(((manual[field.key] || 0) + field.step) * 10) / 10))}
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={{ marginTop: space.sm, borderTopColor: tokens.line, borderTopWidth: 2, paddingTop: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PixelText size="small" color={tokens.textOnDark}>Quest Credits</PixelText>
          <PixelText size="small" color={credits > 0 ? palette.secondary : tokens.disabledInk}>
            {`+${credits}`}
          </PixelText>
        </View>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 4, lineHeight: 13 }}>
          {qualified
            ? 'Paid on active time alone — the same rate on every machine here. Gym cardio, never trail progress.'
            : `Too short to pay: ${formatClock(short)} more active time would qualify. Saved to your history all the same.`}
        </PixelText>
      </View>

      {/* Saving is the only way off this screen, on purpose. A discard
          button next to Save after a hard session is a way to lose the work
          to one tired thumb, and there is nothing here worth throwing away:
          a session under the minimum already pays nothing and simply joins
          the history as what it was. */}
      <TrailAction
        label={credits > 0 ? `Save session — collect ${credits}` : 'Save session'}
        tone="primary"
        style={{ marginTop: space.sm }}
        onPress={onSave}
      />
    </View>
  );
}
