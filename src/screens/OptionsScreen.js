// Options — sound toggles and save management.

import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, CONTROL_MODES } from '../components';
import { palette, space } from '../theme';
import { useGame, wipeSave } from '../state';
import { DEFAULT_BODY_WEIGHT_LB, displayWeight } from '../state/cardioMaths';
import { useNav } from './navContext';
import { setMuted, setBgmMuted, playSfx } from '../audio';

function Toggle({ label, value, onToggle }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
      <PixelText size="body" color={palette.windowFill}>
        {label}
      </PixelText>
      <PixelButton label={value ? 'ON' : 'OFF'} tone={value ? 'primary' : 'dark'} size="small" sound={null} style={{ minWidth: 70 }} onPress={onToggle} />
    </View>
  );
}

// Which unit the Forge writes weights in. Purely a label — the number you type
// is stored as typed, so switching does not silently reinterpret a saved plan.
function UnitPicker({ value, onPick }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <PixelText size="body" color={palette.windowFill}>
        Weight units
      </PixelText>
      <View style={{ flexDirection: 'row' }}>
        {['lb', 'kg'].map((u) => (
          <PixelButton
            key={u}
            label={u}
            tone={value === u ? 'primary' : 'dark'}
            size="small"
            sound={null}
            style={{ minWidth: 52, marginLeft: 6 }}
            onPress={() => onPick(u)}
          />
        ))}
      </View>
    </View>
  );
}

export default function OptionsScreen() {
  const { state, dispatch } = useGame();
  const { navigate, goBack, back } = useNav();
  const [confirm, setConfirm] = useState(false);

  const sfxOn = !state.settings.muted;
  const bgmOn = !state.settings.bgmMuted;

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
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Options
      </PixelText>

      <Window tone="dark" pad={16}>
        <Toggle label="Sound FX" value={sfxOn} onToggle={toggleSfx} />
        <Toggle label="Music" value={bgmOn} onToggle={toggleBgm} />
        <PixelText size="tiny" color={palette.secondary} style={{ marginTop: space.md }}>Movement</PixelText>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          {CONTROL_MODES.map((m, i) => (
            <PixelButton
              key={m.id}
              label={m.name}
              size="small"
              tone={(state.settings.control || 'stick') === m.id ? 'gold' : 'dark'}
              style={{ flex: 1, marginLeft: i ? 4 : 0 }}
              onPress={() => dispatch({ type: 'SET_SETTING', payload: { key: 'control', value: m.id } })}
            />
          ))}
        </View>
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 5, lineHeight: 13 }}>
          {(CONTROL_MODES.find((m) => m.id === (state.settings.control || 'stick')) || CONTROL_MODES[0]).blurb}
        </PixelText>
        <UnitPicker
          value={state.settings.units || 'lb'}
          onPick={(u) => {
            playSfx('confirm');
            dispatch({ type: 'SET_SETTING', payload: { key: 'units', value: u } });
          }}
        />
      </Window>

      <Window tone="dark" pad={14} style={{ marginTop: space.md }}>
        <PixelText size="small" color={palette.secondary}>
          About
        </PixelText>
        <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 8, lineHeight: 14 }}>
          Companion Quest — your real life is the adventure. Move, train, and grow alongside a friend who believes in you. v1.0
        </PixelText>
      </Window>

      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {confirm ? (
          <Window tone="cream" pad={14} style={{ marginBottom: space.sm }}>
            <PixelText size="small" color={palette.windowText} align="center" style={{ lineHeight: 18 }}>
              Erase your save and start over?
            </PixelText>
            <View style={{ flexDirection: 'row', marginTop: space.md }}>
              <PixelButton label="Cancel" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={() => setConfirm(false)} />
              <PixelButton label="Erase" tone="danger" style={{ flex: 1, marginLeft: 6 }} onPress={async () => { await wipeSave(); dispatch({ type: 'RESET' }); navigate('title'); }} />
            </View>
          </Window>
        ) : (
          <PixelButton label="Erase Save" tone="dark" sound="cancel" style={{ marginBottom: space.sm }} onPress={() => setConfirm(true)} />
        )}
        {/* The console's calorie readout is the only estimated number on it,
            and body weight is most of what the estimate depends on. Asking for
            it once beats printing a number computed for somebody else. */}
        <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
          <PixelText size="small" color={palette.windowText}>Body weight</PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 13 }}>
            Used only to estimate calories on the cardio console. Nothing else reads it.
          </PixelText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm }}>
            <PixelButton
              label="-"
              tone="dark"
              size="small"
              style={{ width: 52 }}
              onPress={() => dispatch({
                type: 'SET_SETTING',
                payload: { key: 'bodyWeightLb', value: Math.max(60, (state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB) - 5) },
              })}
            />
            <PixelText size="body" color={palette.windowText} style={{ flex: 1, textAlign: 'center' }}>
              {`${displayWeight(state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB, state.settings.units)} ${state.settings.units || 'lb'}`}
            </PixelText>
            <PixelButton
              label="+"
              tone="dark"
              size="small"
              style={{ width: 52 }}
              onPress={() => dispatch({
                type: 'SET_SETTING',
                payload: { key: 'bodyWeightLb', value: Math.min(500, (state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB) + 5) },
              })}
            />
          </View>
        </Window>

        <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} />
      </View>
    </Screen>
  );
}
