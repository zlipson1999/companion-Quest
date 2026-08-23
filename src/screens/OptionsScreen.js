// Options — sound toggles and save management.

import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, PixelText, FieldCard, TrailAction, ObjectiveRibbon, CONTROL_MODES } from '../components';
import { palette, space, tokens } from '../theme';
import { useGame, wipeSave } from '../state';
import { DEFAULT_BODY_WEIGHT_LB, displayWeight } from '../state/cardioMaths';
import { useNav } from './navContext';
import { setMuted, setBgmMuted, playSfx } from '../audio';

export default function OptionsScreen() {
  const { state, dispatch } = useGame();
  const { navigate, goBack, back } = useNav();
  const [confirm, setConfirm] = useState(false);

  const sfxOn = !state.settings.muted;
  const bgmOn = !state.settings.bgmMuted;
  const control = state.settings.control || 'stick';
  const units = state.settings.units || 'lb';

  const toggleSfx = () => {
    const next = !state.settings.muted;
    setMuted(next);
    dispatch({ type: 'SET_SETTING', payload: { key: 'muted', value: next } });
    if (!next) playSfx('confirm');
  };

  const toggleBgm = () => {
    const next = !state.settings.bgmMuted;
    setBgmMuted(next);
    dispatch({ type: 'SET_SETTING', payload: { key: 'bgmMuted', value: next } });
  };

  return (
    <Screen style={{ padding: space.md }}>
      <ObjectiveRibbon place="Options" objective="Sound, movement, and the number the console uses" />

      <FieldCard tone="ink" title="Sound" style={{ marginTop: space.md }}>
        <TrailAction label="Sound FX" sublabel={sfxOn ? 'On' : 'Off'} tone={sfxOn ? 'primary' : 'quiet'} selected={sfxOn} onPress={toggleSfx} />
        <TrailAction label="Music" sublabel={bgmOn ? 'On' : 'Off'} tone={bgmOn ? 'primary' : 'quiet'} selected={bgmOn} onPress={toggleBgm} style={{ marginTop: space.sm }} />
      </FieldCard>

      <FieldCard tone="ink" title="Movement" caption={(CONTROL_MODES.find((m) => m.id === control) || CONTROL_MODES[0]).blurb} style={{ marginTop: space.md }}>
        {CONTROL_MODES.map((m) => (
          <TrailAction
            key={m.id}
            label={m.name}
            tone={control === m.id ? 'primary' : 'quiet'}
            selected={control === m.id}
            style={{ marginTop: space.sm }}
            onPress={() => dispatch({ type: 'SET_SETTING', payload: { key: 'control', value: m.id } })}
          />
        ))}
      </FieldCard>

      <FieldCard tone="paper" title="Weight units" caption="A label only. Switching does not reinterpret a saved plan." style={{ marginTop: space.md }}>
        <View style={{ flexDirection: 'row' }}>
          {['lb', 'kg'].map((u) => (
            <TrailAction
              key={u}
              label={u}
              tone={units === u ? 'primary' : 'quiet'}
              selected={units === u}
              style={{ flex: 1, marginRight: u === 'lb' ? 6 : 0 }}
              onPress={() => {
                playSfx('confirm');
                dispatch({ type: 'SET_SETTING', payload: { key: 'units', value: u } });
              }}
            />
          ))}
        </View>
      </FieldCard>

      <FieldCard tone="paper" title="Body weight" caption="Used only to estimate calories on the cardio console. Nothing else reads it." style={{ marginTop: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TrailAction
            label="-"
            tone="quiet"
            style={{ width: 72 }}
            onPress={() => dispatch({
              type: 'SET_SETTING',
              payload: { key: 'bodyWeightLb', value: Math.max(60, (state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB) - 5) },
            })}
          />
          <PixelText size="body" color={tokens.textOnPaper} style={{ flex: 1, textAlign: 'center' }}>
            {`${displayWeight(state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB, units)} ${units}`}
          </PixelText>
          <TrailAction
            label="+"
            tone="quiet"
            style={{ width: 72 }}
            onPress={() => dispatch({
              type: 'SET_SETTING',
              payload: { key: 'bodyWeightLb', value: Math.min(500, (state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB) + 5) },
            })}
          />
        </View>
      </FieldCard>

      <FieldCard tone="ink" title="About" caption="Companion Quest — your real life is the adventure. Move, train, and grow alongside a friend who believes in you. v1.0" style={{ marginTop: space.md }} />

      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {confirm ? (
          <FieldCard tone="paper" title="Erase your save and start over?" style={{ marginBottom: space.sm }}>
            <TrailAction label="Cancel" tone="quiet" onPress={() => setConfirm(false)} />
            <TrailAction
              label="Erase"
              tone="accent"
              style={{ marginTop: space.sm }}
              onPress={async () => { await wipeSave(); dispatch({ type: 'RESET' }); navigate('title'); }}
            />
          </FieldCard>
        ) : (
          <TrailAction label="Erase Save" tone="quiet" style={{ marginBottom: space.sm }} onPress={() => setConfirm(true)} />
        )}
        <TrailAction label={back.label} tone="quiet" onPress={goBack} />
      </View>
    </Screen>
  );
}
