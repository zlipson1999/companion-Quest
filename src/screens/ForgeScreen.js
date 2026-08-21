// The Workout Forge: your own plans, what each one actually trains, and the
// session runner that logs one.
//
// Four phases in one screen, matching how WorkoutScreen already works:
//   list    — your plans, priced
//   detail  — the 3D body map, the analysis, the perks it earned
//   session — run it block by block, with a form check on any movement
//   result  — what your companion got out of it

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, Window, DialogueBox, BodyMap3D, PixelText, PixelButton, PixelSprite, Triangle } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { levelFromXp } from '../state/leveling';
import { moduleStateFor, getModule, todayKey, logModuleAction } from '../modules';
import { analysePlan, suggestionsFor } from '../modules/forge/analysis';
import { emptyPlan } from '../modules/forge';
import { getMovement } from '../data/movements';
import { MUSCLES } from '../data/muscles';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { habitGoalLine, levelUpLine } from '../coach';

const FORGE_ID = 'forge';

// A resume hop carries its own origin so the round trip through Form Check
// doesn't lose which hub you started from.
function resumeFrom(params) {
  return params && params.resume && params.resume.from;
}

function PerkChip({ perk }) {
  return (
    <View style={{ backgroundColor: palette.ink, borderWidth: 2, borderColor: palette[perk.color] || palette.secondary, paddingHorizontal: 7, paddingVertical: 5, marginRight: 6, marginTop: 6 }}>
      <PixelText size="tiny" color={palette[perk.color] || palette.secondary}>
        {perk.name}
      </PixelText>
    </View>
  );
}

function BlockRow({ block, index, done, onToggle, onForm }) {
  const mv = getMovement(block.movementId);
  if (!mv) return null;
  return (
    <Window tone="cream" pad={11} style={{ marginBottom: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={onToggle} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 18, height: 18, borderWidth: 3, borderColor: palette.ink, backgroundColor: done ? palette.success : palette.windowFillAlt, marginRight: space.sm }} />
          <View style={{ flex: 1 }}>
            <PixelText size="small" color={palette.windowText}>
              {index + 1}. {mv.name}
            </PixelText>
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 5 }}>
              {block.sets} x {block.amount} {mv.unit === 'reps' ? 'reps' : mv.unit === 'seconds' ? 'sec' : mv.unit}
            </PixelText>
          </View>
        </Pressable>
        <PixelButton label="Form" tone="dark" size="tiny" onPress={onForm} style={{ paddingVertical: 7, paddingHorizontal: 10 }} />
      </View>
      <PixelText size="tiny" color={palette.accentDark} style={{ marginTop: 8, lineHeight: 14 }}>
        {mv.cues[0]}
      </PixelText>
    </Window>
  );
}

export default function ForgeScreen({ params }) {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  const module = getModule(FORGE_ID);
  const modState = moduleStateFor(state.modules, FORGE_ID);
  const plans = modState.plans || [];

  // Coming back from the form-check screen re-enters the session exactly where
  // it was left — the router unmounts us, so the session carries its own state
  // across in params rather than being silently thrown away.
  // Back should return you where you came from: the Forge is reachable both
  // from the Hub menu and from the Habits hub.
  const from = (params && params.from) || (resumeFrom(params)) || 'hub';
  const resume = (params && params.resume) || null;
  const [phase, setPhase] = useState(resume ? 'session' : 'list');
  const [selectedId, setSelectedId] = useState(resume ? resume.planId : null);
  const [checked, setChecked] = useState(resume ? resume.checked || {} : {});
  const [resultLines, setResultLines] = useState([]);

  const plan = plans.find((p) => p.id === selectedId) || null;
  const analysis = useMemo(() => (plan ? analysePlan(plan) : null), [plan]);

  const open = (p) => {
    playSfx('confirm');
    setSelectedId(p.id);
    setPhase('detail');
  };

  const createPlan = () => {
    const fresh = emptyPlan();
    dispatch({ type: 'MODULE_PATCH', payload: { moduleId: FORGE_ID, patch: { plans: [...plans, fresh] } } });
    navigate('forgeEdit', { planId: fresh.id });
  };

  const deletePlan = () => {
    dispatch({ type: 'MODULE_PATCH', payload: { moduleId: FORGE_ID, patch: { plans: plans.filter((p) => p.id !== plan.id) } } });
    playSfx('cancel');
    setSelectedId(null);
    setPhase('list');
  };

  const finishSession = () => {
    // Price it through the same helper the reducer uses, so what we announce is
    // what gets banked.
    const preview = logModuleAction(module, modState, `plan:${plan.id}`, todayKey());
    if (!preview) return;
    dispatch({ type: 'MODULE_LOG', payload: { moduleId: FORGE_ID, actionId: `plan:${plan.id}` } });

    const lines = [
      { speaker: 'Narration', text: `${plan.name} complete — ${analysis.sets} sets, about ${analysis.minutes} minutes.` },
    ];
    if (preview.reward.xp > 0) {
      lines.push({
        speaker: 'Narration',
        text: `+${preview.reward.xp} XP   +${preview.reward.bond} bond${preview.reward.heal ? `   +${preview.reward.heal} HP` : ''}`,
      });
      playSfx('victory');
    } else {
      lines.push({ speaker: 'Narration', text: "Logged. Today's growth was already banked — rest is part of it." });
      playSfx('confirm');
    }
    if (analysis.perks.length) {
      lines.push({ speaker: companion.creature.name, text: `${analysis.perks.map((p) => p.name).join(' and ')} — I could feel that in the work.` });
    }
    if (preview.goalJustHit) lines.push({ speaker: 'Narration', text: habitGoalLine(module.name) });
    const after = levelFromXp(companion.xp + preview.reward.xp);
    if (after > companion.level) {
      playSfx('levelup');
      lines.push({ speaker: 'Narration', text: levelUpLine(companion.creature.name, after) });
    }
    setResultLines(lines);
    setPhase('result');
  };

  // ---------------------------------------------------------------- result
  if (phase === 'result') {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={110} bob />
        </View>
        <DialogueBox
          lines={resultLines}
          onComplete={() => {
            setChecked({});
            setPhase('list');
          }}
        />
      </Screen>
    );
  }

  // --------------------------------------------------------------- session
  if (phase === 'session' && plan) {
    const total = plan.blocks.length;
    const doneCount = plan.blocks.filter((_b, i) => checked[i]).length;
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
          {plan.name}
        </PixelText>
        <Window tone="dark" pad={11} style={{ marginBottom: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="tiny" color={palette.secondary}>
              {doneCount} / {total} done
            </PixelText>
            <PixelText size="tiny" color={palette.windowBorderLight}>
              tap a row as you finish it
            </PixelText>
          </View>
        </Window>
        <ScrollView showsVerticalScrollIndicator={false}>
          {plan.blocks.map((b, i) => (
            <BlockRow
              key={`${b.movementId}-${i}`}
              block={b}
              index={i}
              done={!!checked[i]}
              onToggle={() => {
                playSfx('cursor');
                setChecked((c) => ({ ...c, [i]: !c[i] }));
              }}
              onForm={() => navigate('formcheck', { movementId: b.movementId, planId: plan.id, checked, from })}
            />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          <PixelButton label="Back" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={() => setPhase('detail')} />
          <PixelButton
            label={doneCount === total ? 'Finished!' : `Log ${doneCount}/${total}`}
            tone="gold"
            disabled={doneCount === 0}
            style={{ flex: 1, marginLeft: 6 }}
            onPress={finishSession}
          />
        </View>
      </Screen>
    );
  }

  // ---------------------------------------------------------------- detail
  if (phase === 'detail' && plan && analysis) {
    const notes = suggestionsFor(analysis);
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
          {plan.name}
        </PixelText>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Window tone="dark" pad={3}>
            <BodyMap3D muscle={analysis.muscle} height={220} />
          </Window>

          <Window tone="dark" pad={12} style={{ marginTop: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <PixelText size="small" color={palette.secondary}>{analysis.focus}</PixelText>
              <PixelText size="tiny" color={palette.windowBorderLight}>~{analysis.minutes} min</PixelText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
              <PixelText size="tiny" color={palette.windowFill}>{analysis.sets} sets</PixelText>
              <PixelText size="tiny" color={palette.windowFill}>{analysis.coverage}/14 groups</PixelText>
              <PixelText size="tiny" color={palette.windowFill}>load {analysis.intensity.toFixed(1)}</PixelText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
              <PixelText size="tiny" color={palette.xp}>+{analysis.reward.xp} XP</PixelText>
              <PixelText size="tiny" color={palette.accent}>+{analysis.reward.bond} bond</PixelText>
              {analysis.reward.heal ? <PixelText size="tiny" color={palette.hpHigh}>+{analysis.reward.heal} HP</PixelText> : null}
            </View>
          </Window>

          <Window tone="cream" pad={12} style={{ marginTop: space.sm }}>
            <PixelText size="small" color={palette.accentDark}>Perks the Forge read into this</PixelText>
            {analysis.perks.length ? (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {analysis.perks.map((p) => <PerkChip key={p.id} perk={p} />)}
                </View>
                {analysis.perks.map((p) => (
                  <PixelText key={p.id} size="tiny" color={palette.windowText} style={{ marginTop: 9, lineHeight: 14 }}>
                    {p.name}: {p.why}
                  </PixelText>
                ))}
              </View>
            ) : (
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 8, lineHeight: 14 }}>
                Not enough here yet for the Forge to call it anything. Four sets is roughly the floor.
              </PixelText>
            )}
          </Window>

          <Window tone="cream" pad={12} style={{ marginTop: space.sm }}>
            <PixelText size="small" color={palette.accentDark}>Trained</PixelText>
            {analysis.trained.length ? (
              <PixelText size="tiny" color={palette.windowText} style={{ marginTop: 8, lineHeight: 15 }}>
                {analysis.trained.map((id) => MUSCLES[id].name).join(', ')}
              </PixelText>
            ) : (
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 8 }}>Nothing yet.</PixelText>
            )}
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 10, lineHeight: 14 }}>
              {notes[0]}
            </PixelText>
          </Window>

          <View style={{ flexDirection: 'row', marginTop: space.sm }}>
            <PixelButton label="Edit" tone="plain" style={{ flex: 1, marginRight: 6 }} onPress={() => navigate('forgeEdit', { planId: plan.id })} />
            <PixelButton label="Delete" tone="danger" sound="cancel" style={{ flex: 1, marginLeft: 6 }} onPress={deletePlan} />
          </View>
          <View style={{ height: space.sm }} />
        </ScrollView>

        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          <PixelButton label="Back" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={() => setPhase('list')} />
          <PixelButton label="Start Session" tone="gold" disabled={!analysis.sets} style={{ flex: 1, marginLeft: 6 }} onPress={() => { setChecked({}); setPhase('session'); }} />
        </View>
      </Screen>
    );
  }

  // ------------------------------------------------------------------ list
  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Workout Forge
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.md, lineHeight: 14 }}>
        {modState.goalHit ? "Today's session is logged. Anything more is for you, not the score." : 'Build a plan. The Forge reads what it trains.'}
      </PixelText>

      <ScrollView showsVerticalScrollIndicator={false}>
        {plans.map((p) => {
          const a = analysePlan(p);
          return (
            <Pressable key={p.id} onPressIn={() => playSfx('cursor')} onPress={() => open(p)} style={{ marginBottom: space.sm }}>
              <Window tone="cream" pad={12}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <PixelText size="body" color={palette.windowText}>{p.name}</PixelText>
                    <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
                      {a.sets ? `${a.focus}  ·  ${a.sets} sets  ·  ~${a.minutes} min` : 'empty — tap to build it'}
                    </PixelText>
                  </View>
                  <Triangle direction="right" size={6} color={palette.accent} />
                </View>
                {a.perks.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {a.perks.map((perk) => <PerkChip key={perk.id} perk={perk} />)}
                  </View>
                ) : null}
                {a.sets ? (
                  <PixelText size="tiny" color={palette.accentDark} style={{ marginTop: 9 }}>
                    +{a.reward.xp} XP   +{a.reward.bond} bond
                  </PixelText>
                ) : null}
              </Window>
            </Pressable>
          );
        })}
        {!plans.length ? (
          <Window tone="cream" pad={14}>
            <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 15 }}>
              Nothing forged yet. Make a plan and it will show you what it trains.
            </PixelText>
          </Window>
        ) : null}
        <View style={{ height: space.sm }} />
      </ScrollView>

      <PixelButton label="New Plan" tone="gold" onPress={createPlan} style={{ marginTop: space.sm }} />
      <PixelButton
        label={from === 'habits' ? 'Back to Habits' : 'Back to Town'}
        tone="plain"
        sound="cancel"
        onPress={() => navigate(from)}
        style={{ marginTop: 6 }}
      />
    </Screen>
  );
}
