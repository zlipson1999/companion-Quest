// The plan builder. Everything you change re-runs the analyser immediately, so
// the body map, the perks and the reward all move while you are still editing —
// the point being that you can see what a choice is worth before committing.

import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Screen, Window, BodyMap3D, PixelText, PixelButton } from '../components';
import { palette, space, FONT_FAMILY } from '../theme';
import { useGame } from '../state';
import { moduleStateFor } from '../modules';
import { analysePlan, suggestionsFor } from '../modules/forge/analysis';
import { EQUIPMENT, EQUIPMENT_IDS, MOVEMENTS, PATTERNS, PATTERN_IDS, getMovement, searchMovements } from '../data/movements';
import { MAX_WEIGHT, WEIGHT_STEP, unitLabel, weightOf } from '../modules/forge/weight';
import { MUSCLES } from '../data/muscles';
import { useNav } from './navContext';
import { playSfx } from '../audio';

const FORGE_ID = 'forge';
const MAX_BLOCKS = 12;

function Stepper({ label, value, onChange, step = 1, min = 1, max = 99, zeroLabel }) {
  const set = (v) => {
    playSfx('cursor');
    onChange(Math.max(min, Math.min(max, v)));
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <PixelText size="tiny" color={palette.windowTextDim}>{label}</PixelText>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
        <PixelButton label="-" tone="plain" size="tiny" sound={null} onPress={() => set(value - step)} style={{ paddingVertical: 5, paddingHorizontal: 9 }} />
        <PixelText size="small" color={palette.windowText} style={{ minWidth: 38, textAlign: 'center' }}>
          {value === 0 && zeroLabel ? zeroLabel : value}
        </PixelText>
        <PixelButton label="+" tone="plain" size="tiny" sound={null} onPress={() => set(value + step)} style={{ paddingVertical: 5, paddingHorizontal: 9 }} />
      </View>
    </View>
  );
}

export default function ForgeEditScreen({ params }) {
  const { state, dispatch } = useGame();
  const { navigate } = useNav();

  const modState = moduleStateFor(state.modules, FORGE_ID);
  const plans = modState.plans || [];
  const original = plans.find((p) => p.id === params.planId) || null;
  const units = unitLabel(state.settings);

  const [draft, setDraft] = useState(() => (original ? { ...original, blocks: [...original.blocks] } : null));
  // The library is large enough that browsing it needs real filtering.
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const startedEmpty = useMemo(() => !!original && original.blocks.length === 0, []);

  const analysis = useMemo(() => (draft ? analysePlan(draft) : null), [draft]);
  // 140 rows re-filtered on every keystroke is worth memoising.
  const picked = useMemo(() => searchMovements(query, { pattern, equipment }), [query, pattern, equipment]);

  if (!draft || !analysis) {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'center' }}>
        <Window tone="cream" pad={14}>
          <PixelText size="body" color={palette.windowText} style={{ lineHeight: 20 }}>
            That plan is gone.
          </PixelText>
        </Window>
        <PixelButton label="Back" tone="plain" sound="cancel" onPress={() => navigate('forge')} style={{ marginTop: space.sm }} />
      </Screen>
    );
  }

  const setBlock = (i, patch) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));

  const addMovement = (mv) => {
    playSfx('confirm');
    setDraft((d) => ({
      ...d,
      blocks: [...d.blocks, { movementId: mv.id, sets: 3, amount: mv.unit === 'seconds' ? 30 : 10 }],
    }));
    setPicking(false);
  };

  const save = () => {
    dispatch({
      type: 'MODULE_PATCH',
      payload: { moduleId: FORGE_ID, patch: { plans: plans.map((p) => (p.id === draft.id ? draft : p)) } },
    });
    playSfx('confirm');
    navigate('forge');
  };

  const cancel = () => {
    // A plan created a moment ago and never filled in shouldn't linger.
    if (startedEmpty && !draft.blocks.length) {
      dispatch({ type: 'MODULE_PATCH', payload: { moduleId: FORGE_ID, patch: { plans: plans.filter((p) => p.id !== draft.id) } } });
    }
    playSfx('cancel');
    navigate('forge');
  };

  // ------------------------------------------------------- movement picker
  if (picking) {
    const chip = (label, active, onPress) => (
      <Pressable
        key={label}
        onPress={() => {
          playSfx('cursor');
          onPress();
        }}
        style={{
          borderWidth: 2,
          borderColor: active ? palette.secondary : palette.inkSoft,
          backgroundColor: active ? palette.secondary : palette.bgAlt,
          paddingHorizontal: 8,
          paddingVertical: 6,
          marginRight: 5,
          marginBottom: 5,
        }}
      >
        <PixelText size="tiny" color={active ? palette.ink : palette.windowBorderLight}>
          {label}
        </PixelText>
      </Pressable>
    );

    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
          Add Movement
        </PixelText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${MOVEMENTS.length} movements...`}
          placeholderTextColor={palette.windowTextDim}
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 9,
            color: palette.windowText,
            backgroundColor: palette.windowFill,
            borderWidth: 3,
            borderColor: palette.ink,
            paddingHorizontal: 10,
            paddingVertical: 9,
          }}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space.sm }}>
          {chip('All kit', equipment == null, () => setEquipment(null))}
          {EQUIPMENT_IDS.map((id) => chip(EQUIPMENT[id].short, equipment === id, () => setEquipment(id)))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {chip('All', pattern == null, () => setPattern(null))}
          {PATTERN_IDS.map((id) => chip(PATTERNS[id].name, pattern === id, () => setPattern(id)))}
        </View>

        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, marginBottom: space.sm }}>
          {picked.length} {picked.length === 1 ? 'movement' : 'movements'}
        </PixelText>

        <FlatList
          data={picked}
          keyExtractor={(mv) => mv.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <Window tone="cream" pad={14}>
              <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 15 }}>
                Nothing matches that. Try a muscle name, or clear the filters.
              </PixelText>
            </Window>
          }
          ListFooterComponent={<View style={{ height: space.sm }} />}
          renderItem={({ item: mv }) => (
            <Pressable onPress={() => addMovement(mv)} style={{ marginBottom: 6 }}>
              <Window tone="cream" pad={11}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <PixelText size="small" color={palette.windowText} style={{ flex: 1 }}>
                    {mv.name}
                  </PixelText>
                  <PixelText size="tiny" color={palette.accentDark}>
                    {EQUIPMENT[mv.equipment].short}  L{mv.load}
                  </PixelText>
                </View>
                <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 14 }}>
                  {PATTERNS[mv.pattern].name}  ·  {mv.primary.map((id) => MUSCLES[id].name).join(', ')}
                </PixelText>
              </Window>
            </Pressable>
          )}
        />

        <PixelButton label="Back" tone="plain" sound="cancel" onPress={() => setPicking(false)} style={{ marginTop: space.sm }} />
      </Screen>
    );
  }

  // -------------------------------------------------------------- the edit
  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Forge
      </PixelText>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="Plan name"
          placeholderTextColor={palette.windowTextDim}
          maxLength={24}
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 11,
            color: palette.windowText,
            backgroundColor: palette.windowFill,
            borderWidth: 3,
            borderColor: palette.ink,
            paddingHorizontal: 10,
            paddingVertical: 10,
            marginBottom: space.sm,
          }}
        />

        <Window tone="dark" pad={3}>
          <BodyMap3D muscle={analysis.muscle} height={200} />
        </Window>

        <Window tone="dark" pad={11} style={{ marginTop: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="tiny" color={palette.secondary}>{analysis.focus}</PixelText>
            <PixelText size="tiny" color={palette.windowFill}>{analysis.sets} sets</PixelText>
            <PixelText size="tiny" color={palette.windowFill}>~{analysis.minutes} min</PixelText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}>
            <PixelText size="tiny" color={palette.xp}>+{analysis.reward.xp} XP</PixelText>
            <PixelText size="tiny" color={palette.accent}>+{analysis.reward.bond} bond</PixelText>
            <PixelText size="tiny" color={palette.windowBorderLight}>{analysis.coverage}/14</PixelText>
          </View>
          {analysis.perks.length ? (
            <PixelText size="tiny" color={palette.secondary} style={{ marginTop: 9, lineHeight: 14 }}>
              {analysis.perks.map((p) => p.name).join('  ')}
            </PixelText>
          ) : null}
          <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 9, lineHeight: 14 }}>
            {suggestionsFor(analysis)[0]}
          </PixelText>
        </Window>

        <PixelText size="small" color={palette.secondary} style={{ marginTop: space.md, marginBottom: space.sm }}>
          Movements
        </PixelText>

        {draft.blocks.map((b, i) => {
          const mv = getMovement(b.movementId);
          if (!mv) return null;
          return (
            <Window key={`${b.movementId}-${i}`} tone="cream" pad={11} style={{ marginBottom: space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <PixelText size="small" color={palette.windowText} style={{ flex: 1 }}>{mv.name}</PixelText>
                <PixelButton
                  label="x"
                  tone="danger"
                  size="tiny"
                  sound="cancel"
                  style={{ paddingVertical: 5, paddingHorizontal: 9 }}
                  onPress={() => setDraft((d) => ({ ...d, blocks: d.blocks.filter((_x, j) => j !== i) }))}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                <Stepper label="sets" value={b.sets} onChange={(v) => setBlock(i, { sets: v })} min={1} max={10} />
                <Stepper
                  label={mv.unit === 'seconds' ? 'seconds' : 'reps'}
                  value={b.amount}
                  step={mv.unit === 'seconds' ? 5 : 1}
                  min={mv.unit === 'seconds' ? 5 : 1}
                  max={mv.unit === 'seconds' ? 180 : 50}
                  onChange={(v) => setBlock(i, { amount: v })}
                />
                {/* Offered on every movement, not just barbell ones — weighted
                    pull-ups and a loaded carry are the whole point of the
                    field. Zero reads as "body", which is the default. */}
                <Stepper
                  label={units}
                  value={weightOf(b)}
                  step={WEIGHT_STEP}
                  min={0}
                  max={MAX_WEIGHT}
                  zeroLabel="body"
                  onChange={(v) => setBlock(i, { weight: v || undefined })}
                />
              </View>
            </Window>
          );
        })}

        {draft.blocks.length >= MAX_BLOCKS ? (
          <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.sm }}>
            That is plenty for one session.
          </PixelText>
        ) : (
          <PixelButton label="+ Add Movement" tone="dark" size="small" onPress={() => setPicking(true)} />
        )}
        <View style={{ height: space.md }} />
      </ScrollView>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <PixelButton label="Cancel" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={cancel} />
        <PixelButton label="Save" tone="gold" style={{ flex: 1, marginLeft: 6 }} onPress={save} />
      </View>
    </Screen>
  );
}
