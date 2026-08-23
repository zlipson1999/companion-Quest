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
import { canEvolve, pointsFor, xpFor } from '../state/evolution';
import { getCreature } from '../data/creatures';
import { evolveLines } from '../coach';
import { moduleStateFor, getModule, todayKey, logModuleAction } from '../modules';
import { analysePlan, suggestionsFor } from '../modules/forge/analysis';
import { emptyPlan } from '../modules/forge';
import { agoLabel, historyFor, lastSession, prTargets, prsSetBy, progressionFor, recordSession, sessionEntry } from '../modules/forge/history';
import { MAX_WEIGHT, WEIGHT_STEP, beatsRecord, formatRecord, formatSet, unitLabel, weightOf } from '../modules/forge/weight';
import { loadOf } from '../state/recovery';
import { useRecovery } from '../state';
import { getMovement } from '../data/movements';
import { MUSCLES } from '../data/muscles';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { habitGoalLine, levelUpLine } from '../coach';

const FORGE_ID = 'forge';

// A resume hop carries its own origin so the round trip through Form Check
// doesn't lose which hub you started from.
function PerkChip({ perk }) {
  return (
    <View style={{ backgroundColor: palette.ink, borderWidth: 2, borderColor: palette[perk.color] || palette.secondary, paddingHorizontal: 7, paddingVertical: 5, marginRight: 6, marginTop: 6 }}>
      <PixelText size="tiny" color={palette[perk.color] || palette.secondary}>
        {perk.name}
      </PixelText>
    </View>
  );
}

// A live stepper for what you are actually doing right now, as opposed to what
// the plan asked for.
function LiveStepper({ label, value, onChange, step = 1, min = 0, max = 999, zeroLabel }) {
  const set = (v) => {
    playSfx('cursor');
    onChange(Math.max(min, Math.min(max, v)));
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <PixelText size="tiny" color={palette.windowTextDim}>{label}</PixelText>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <PixelButton label="-" tone="plain" size="tiny" sound={null} onPress={() => set(value - step)} style={{ paddingVertical: 4, paddingHorizontal: 8 }} />
        <PixelText size="small" color={palette.windowText} style={{ minWidth: 38, textAlign: 'center' }}>
          {value === 0 && zeroLabel ? zeroLabel : value}
        </PixelText>
        <PixelButton label="+" tone="plain" size="tiny" sound={null} onPress={() => set(value + step)} style={{ paddingVertical: 4, paddingHorizontal: 8 }} />
      </View>
    </View>
  );
}

// One movement during a session.
//
// The plan is a target, not a transcript. What gets logged — and what sets a
// personal record — is what you actually did, so the numbers here are editable
// and start at whatever the plan asked for. Ticking a block off without touching
// them means "as written", which is the common case.
function BlockRow({ block, performed, index, done, onToggle, onForm, onEdit, pr, last, units }) {
  const mv = getMovement(block.movementId);
  if (!mv) return null;
  const changed = performed.amount !== block.amount || weightOf(performed) !== weightOf(block);
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
              target {formatSet(block, mv, units)}
              {last ? `   (last: ${formatRecord(last, mv, units)})` : ''}
            </PixelText>
          </View>
        </Pressable>
        {/* A real tap target. This was a tiny chip jammed against the right
            edge — small enough that hitting it was luck rather than aim. */}
        <PixelButton label="Mirror" tone="dark" size="small" onPress={onForm} style={{ paddingVertical: 11, paddingHorizontal: 14, minWidth: 76 }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
        <LiveStepper
          label={mv.unit === 'seconds' ? 'seconds' : 'reps'}
          value={performed.amount}
          step={mv.unit === 'seconds' ? 5 : 1}
          min={1}
          max={mv.unit === 'seconds' ? 600 : 100}
          onChange={(v) => onEdit({ amount: v })}
        />
        <LiveStepper
          label={units}
          value={weightOf(performed)}
          step={WEIGHT_STEP}
          min={0}
          max={MAX_WEIGHT}
          zeroLabel="body"
          onChange={(v) => onEdit({ weight: v || undefined })}
        />
      </View>
      {changed ? (
        <PixelText size="tiny" color={palette.accentDark} style={{ marginTop: 7 }}>
          Logging {formatSet(performed, mv, units)} — what you did, not the target.
        </PixelText>
      ) : null}

      {/* A coaching cue is help, not an error. In accentDark it was the same
          colour the app uses for damage and danger, and read as a warning. */}
      <PixelText size="tiny" color={palette.primaryDark} style={{ marginTop: 8, lineHeight: 14 }}>
        {mv.cues[0]}
      </PixelText>
      {pr && beatsRecord(performed, pr, mv) ? (
        <PixelText size="tiny" color={palette.success} style={{ marginTop: 6 }}>
          Beats your best of {formatRecord(pr, mv, units)}.
        </PixelText>
      ) : null}
    </Window>
  );
}

export default function ForgeScreen({ params }) {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const recovery = useRecovery();
  const { navigate, goBack, back } = useNav();

  const module = getModule(FORGE_ID);
  const modState = moduleStateFor(state.modules, FORGE_ID);
  const plans = modState.plans || [];

  // Coming back from the form-check screen re-enters the session exactly where
  // it was left — the router unmounts us, so the session carries its own state
  // across in params rather than being silently thrown away.
  const resume = (params && params.resume) || null;
  const [phase, setPhase] = useState(resume ? 'session' : 'list');
  const [selectedId, setSelectedId] = useState(resume ? resume.planId : null);
  const [checked, setChecked] = useState(resume ? resume.checked || {} : {});
  // What was ACTUALLY done, per block index, overriding the plan's target.
  // Empty means "exactly as written", which is the common case.
  const [actual, setActual] = useState(resume ? resume.actual || {} : {});
  const [resultLines, setResultLines] = useState([]);

  const plan = plans.find((p) => p.id === selectedId) || null;
  const analysis = useMemo(() => (plan ? analysePlan(plan) : null), [plan]);
  const units = unitLabel(state.settings);

  // The plan's block merged with anything edited during the session.
  const performedBlock = (b, i) => ({ ...b, ...(actual[i] || {}) });

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
    // Log what was DONE, not what was planned. Ticking one block of five and
    // pressing "Log 1/5" used to record the whole plan: full volume into
    // recovery, and a personal best on every movement you skipped.
    // ...and log the numbers as edited during the session, not the plan's
    // targets. Writing the target down when you actually managed three of the
    // five reps would mint a personal best you never earned.
    const doneBlocks = plan.blocks.map(performedBlock).filter((_b, i) => checked[i]);
    if (!doneBlocks.length) return;
    const performed = { ...plan, blocks: doneBlocks, partial: doneBlocks.length < plan.blocks.length };
    const done = analysePlan(performed);
    const load = loadOf(done);

    // The action is priced on the whole plan; a part-finished session is worth
    // proportionally less. clampReward in applyLog guarantees this can only
    // reduce the payout, never inflate it.
    const capped = done.reward;
    const preview = logModuleAction(module, modState, `plan:${plan.id}`, todayKey(), capped);
    if (!preview) return;
    dispatch({ type: 'MODULE_LOG', payload: { moduleId: FORGE_ID, actionId: `plan:${plan.id}`, load, capped } });

    // Write the session into the Forge's own log and fold in any new records.
    const entry = sessionEntry(performed, done, todayKey(), load, preview.reward.xp);
    const newPrs = prsSetBy(modState, entry);
    dispatch({ type: 'MODULE_PATCH', payload: { moduleId: FORGE_ID, patch: recordSession(modState, entry) } });

    const lines = [
      {
        speaker: 'Narration',
        text: performed.partial
          ? `${plan.name} — ${doneBlocks.length} of ${plan.blocks.length} blocks done, ${done.sets} sets in about ${done.minutes} minutes.`
          : `${plan.name} complete — ${done.sets} sets, about ${done.minutes} minutes.`,
      },
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
    if (done.perks.length && companion) {
      lines.push({ speaker: companion.creature.name, text: `${done.perks.map((p) => p.name).join(' and ')} — I could feel that in the work.` });
    }
    if (newPrs.length) {
      const names = newPrs.map((b) => getMovement(b.movementId).name).join(', ');
      playSfx('milestone');
      dispatch({ type: 'RECORD_PR', payload: { count: newPrs.length } });
      lines.push({
        speaker: 'Narration',
        text: `New personal best: ${names}!  +${xpFor('pr', newPrs.length)} XP  +${pointsFor('pr', newPrs.length)} evolve points`,
      });
    }
    if (preview.goalJustHit) lines.push({ speaker: 'Narration', text: habitGoalLine(module.name) });
    // Racks open before pairing. MODULE_LOG already no-ops an empty party;
    // the crash was reading companion.creature / companion.xp here.
    if (companion) {
      const after = levelFromXp(companion.xp + preview.reward.xp);
      if (after > companion.level) {
        playSfx('levelup');
        lines.push({ speaker: 'Narration', text: levelUpLine(companion.creature.name, after) });
      }

      // Evolution can no longer only happen in battle. A player who lifts and
      // never fights was previously capped at their starting form forever, which
      // made the whole progression invisible to exactly the people this module is
      // for. Project the points this session just paid, since `companion` is the
      // pre-dispatch snapshot.
      const projected = {
        ...companion,
        evo: (companion.evo || 0) + pointsFor('session') + pointsFor('pr', newPrs.length),
      };
      const creature = getCreature(companion.id);
      if (canEvolve(projected, creature, after)) {
        const evoLines = evolveLines(creature.name, getCreature(creature.evolvesTo).name);
        lines.push(evoLines[0], evoLines[2]);
        playSfx('evolve');
        dispatch({ type: 'EVOLVE', payload: { newId: creature.evolvesTo } });
      }
    } else {
      lines.push({ speaker: 'Narration', text: 'Meet Coach Maple in the gym — then this work has someone to grow.' });
    }
    setResultLines(lines);
    setPhase('result');
  };

  // ---------------------------------------------------------------- result
  if (phase === 'result') {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {companion ? (
            <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={110} bob />
          ) : (
            <PixelText size="tiny" color={palette.windowFill} align="center" style={{ lineHeight: 14 }}>
              Meet Coach Maple in the gym.
            </PixelText>
          )}
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
    const prev = lastSession(modState, plan.id);
    const records = modState.records || {};
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
          {recovery.needsRest ? (
            <PixelText size="tiny" color={palette.hpMid} style={{ marginTop: 8, lineHeight: 14 }}>
              {recovery.advice} You can absolutely still train — just going in with your eyes open.
            </PixelText>
          ) : null}
        </Window>
        <ScrollView showsVerticalScrollIndicator={false}>
          {plan.blocks.map((b, i) => (
            <BlockRow
              key={`${b.movementId}-${i}`}
              block={b}
              performed={performedBlock(b, i)}
              index={i}
              done={!!checked[i]}
              units={units}
              onToggle={() => {
                playSfx('cursor');
                setChecked((c) => ({ ...c, [i]: !c[i] }));
              }}
              onEdit={(patch) => setActual((a) => ({ ...a, [i]: { ...(a[i] || {}), ...patch } }))}
              pr={records[b.movementId]}
              last={prev ? prev.blocks.filter((x) => x.movementId === b.movementId)[0] || null : null}
              onForm={() => navigate('formcheck', { movementId: b.movementId, planId: plan.id, checked, actual, from })}
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
    const prog = progressionFor(modState, plan.id, analysis);
    const best = (modState.bests || {})[plan.id];
    const runs = historyFor(modState, plan.id).length;
    const targets = prTargets(modState, plan);
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
            <PixelText size="small" color={palette.accentDark}>Last time</PixelText>
            {prog ? (
              <View>
                <PixelText size="tiny" color={palette.windowText} style={{ marginTop: 8, lineHeight: 15 }}>
                  {agoLabel(prog.last.date, todayKey())} — {prog.last.sets} sets, volume {prog.last.volume}, {prog.last.xp} XP
                </PixelText>
                <PixelText
                  size="tiny"
                  color={prog.improved ? palette.success : prog.unchanged ? palette.windowTextDim : palette.accentDark}
                  style={{ marginTop: 7, lineHeight: 14 }}
                >
                  {prog.unchanged
                    ? 'As written, this is the same session again. Add a set or a rep to move forward.'
                    : prog.improved
                    ? `As written that is ${prog.volumeDelta > 0 ? `+${prog.volumeDelta} volume` : `${prog.setsDelta > 0 ? '+' : ''}${prog.setsDelta} sets`} on last time.`
                    : `As written that is lighter than last time (${prog.volumeDelta} volume). Fine on purpose, worth noticing by accident.`}
                </PixelText>
                {best ? (
                  <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 7 }}>
                    Best: volume {best.volume} on {best.date}  ·  done {runs} time{runs === 1 ? '' : 's'}
                  </PixelText>
                ) : null}
              </View>
            ) : (
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 8, lineHeight: 15 }}>
                Never run. Do it once and the Forge starts tracking what to beat.
              </PixelText>
            )}
          </Window>

          {targets.some((t) => t.pr || t.beats) ? (
            <Window tone="cream" pad={12} style={{ marginTop: space.sm }}>
              <PixelText size="small" color={palette.accentDark}>Personal bests</PixelText>
              {targets.map((t) => {
                const mv = getMovement(t.movementId);
                if (!mv) return null;
                return (
                  <View key={t.movementId} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
                    <PixelText size="tiny" color={palette.windowText} style={{ flex: 1 }}>{mv.name}</PixelText>
                    <PixelText size="tiny" color={t.beats ? palette.success : palette.windowTextDim}>
                      {t.pr ? `${t.pr.amount}${mv.unit === 'seconds' ? 's' : ''}${t.beats ? '  BEATS IT' : ''}` : 'no record yet'}
                    </PixelText>
                  </View>
                );
              })}
            </Window>
          ) : null}

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
          <PixelButton label="Start Session" tone="gold" disabled={!analysis.sets} style={{ flex: 1, marginLeft: 6 }} onPress={() => { setChecked({}); setActual({}); setPhase('session'); }} />
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
        label={back.label}
        tone="plain"
        sound="cancel"
        onPress={goBack}
        style={{ marginTop: 6 }}
      />
    </Screen>
  );
}
