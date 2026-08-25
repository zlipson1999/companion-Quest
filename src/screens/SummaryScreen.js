// Status / summary screen — a handheld-style data readout of your companion and
// your real-life progress.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, ProgressBar, HPBar, PixelText, PixelButton, PixelSprite } from '../components';
import { EVO_SOURCES, evolveHint, evolveProgress } from '../state/evolution';
import { evolveChecklist, bondMilestoneText } from '../state/companionLife';
import { palette, space } from '../theme';
import { useGame, useCompanion, useModules } from '../state';
import { useNav } from './navContext';
import { getGoal } from '../data/goals';
import { ROUTES, normalizeTrails } from '../data/routes';
import { breakdownSince } from '../data/exercises';
import { getWorkout } from '../data/workouts';
import { moduleSprite } from '../modules';

function StatCell({ label, value, color }) {
  return (
    <View style={{ width: '50%', paddingVertical: 8, paddingHorizontal: 4 }}>
      <PixelText size="tiny" color={palette.windowTextDim}>
        {label}
      </PixelText>
      <PixelText size="body" color={color || palette.windowText} style={{ marginTop: 6 }}>
        {value}
      </PixelText>
    </View>
  );
}

export default function SummaryScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { goBack, back } = useNav();
  const modules = useModules();
  const goal = getGoal(state.goalId);
  const trails = normalizeTrails(state.trails);
  // Reception is reachable before pairing. evolveProgress reads
  // companion.creature at the top of the page, so this used to throw
  // the moment you walked into the desk.
  const evo = companion ? evolveProgress(companion, companion.creature, companion.level) : null;
  const checks = companion ? evolveChecklist(companion, companion.creature, companion.level) : null;
  const milestone = companion ? bondMilestoneText(companion.creature, companion.bond) : null;
  const memories = (companion && companion.memories) || [];
  const s = state.stats;
  // The same diff the cardio console runs, against a zero baseline: the
  // console reports the walk you are on and forgets it when you go home, and
  // "how many push-ups have I ever done" is the one number a fitness game
  // should be able to answer.
  const everDone = React.useMemo(
    () => breakdownSince(s.exercises, {}, (id) => (getWorkout(id) || {}).name || id),
    [s.exercises]
  );

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Status
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Window tone="dark" pad={14}>
          {companion ? (
            <View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ alignItems: 'center', marginRight: space.md }}>
                  <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={88} bob />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <PixelText size="label" color={palette.secondary}>
                    {companion.creature.name}
                  </PixelText>
                  <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 6 }}>
                    {companion.creature.species}
                  </PixelText>
                  <PixelText size="small" color={palette.windowFill} style={{ marginTop: 10 }}>
                    Lv. {companion.level}
                  </PixelText>
                </View>
              </View>
              <View style={{ marginTop: space.md }}>
                <HPBar hp={companion.hp} maxHp={companion.maxHp} width={200} label="HP" />
              </View>
              <View style={{ marginTop: space.sm }}>
                <ProgressBar value={companion.xpInto} max={companion.xpNeeded} color={palette.xp} height={12} label="XP to next level" />
              </View>
              {/* Evolve points: what the real-world work is actually building
                  toward. Shown next to XP because they are different things and the
                  difference matters — XP comes from playing, this comes from doing. */}
              {evo ? (
                <View style={{ marginTop: space.sm }}>
                  <ProgressBar
                    value={Math.min(evo.points, evo.needPoints)}
                    max={evo.needPoints}
                    color={palette.success}
                    height={12}
                    label={`Evolve points  ${evo.points}/${evo.needPoints}`}
                    showText={false}
                  />
                  <PixelText size="tiny" color={evo.ready ? palette.secondary : palette.windowBorderLight} style={{ marginTop: 5, lineHeight: 13 }}>
                    {evolveHint(companion, companion.creature, companion.level)}
                  </PixelText>
                  {checks ? (
                    <View style={{ marginTop: 8 }}>
                      {checks.map((row) => (
                        <PixelText
                          key={row.key}
                          size="tiny"
                          color={row.ok ? palette.secondary : palette.windowBorderLight}
                          style={{ marginTop: 3 }}
                        >
                          {row.label} {row.ok ? '✓' : `${Math.round(row.have * 10) / 10} / ${row.need}`}
                        </PixelText>
                      ))}
                    </View>
                  ) : null}
                  {companion.creature.passive ? (
                    <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 8, lineHeight: 13 }}>
                      {companion.creature.passive.name} — {companion.creature.passive.text}
                    </PixelText>
                  ) : null}
                  {milestone ? (
                    <PixelText size="tiny" color={palette.accent} style={{ marginTop: 6, lineHeight: 13 }}>
                      {milestone}
                    </PixelText>
                  ) : null}
                  <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: 5, lineHeight: 13 }}>
                    Earned from {Object.values(EVO_SOURCES).map((s) => s.label).join(', ')}.
                  </PixelText>
                </View>
              ) : (
                <PixelText size="tiny" color={palette.secondary} style={{ marginTop: space.sm }}>
                  Final form — nothing left to grow into.
                </PixelText>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
                <PixelText size="tiny" color={palette.accent}>
                  Bond {companion.bond}
                </PixelText>
                <PixelText size="tiny" color={palette.windowBorderLight}>
                  Goal: {goal ? goal.name : '-'}
                </PixelText>
              </View>
              {companion.creature.flavor ? (
                <PixelText size="tiny" color={palette.windowBorderLight} style={{ marginTop: space.sm, lineHeight: 14 }}>
                  {companion.creature.flavor}
                </PixelText>
              ) : null}
            </View>
          ) : (
            <PixelText
              size="tiny"
              color={palette.windowFill}
              style={{ lineHeight: 14 }}
              accessibilityRole="text"
              accessibilityLabel="No companion yet. Meet Coach Maple in the gym — then this page is theirs."
            >
              No companion yet. Meet Coach Maple in the gym — then this page is theirs.
            </PixelText>
          )}
        </Window>

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
            Your Journey
          </PixelText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <StatCell label="Distance" value={`${(s.distanceMi || 0).toFixed(2)} mi`} color={palette.primaryDark} />
            <StatCell label="Cycling" value={`${(s.cyclingMi || 0).toFixed(2)} mi`} color={palette.primaryDark} />
            <StatCell label="Bike rides" value={s.ridesDone || 0} color={palette.accentDark} />
            <StatCell label="Total steps" value={s.totalSteps.toLocaleString()} />
            <StatCell label="Milestones" value={s.milestonesReached} />
            <StatCell label="Companions" value={s.caught || 0} color={palette.success} />
            <StatCell label="Battles won" value={s.battlesWon} color={palette.success} />
            <StatCell label="Battles lost" value={s.battlesLost} />
            <StatCell label="Workouts" value={s.workoutsDone} color={palette.accentDark} />
            <StatCell label="Sets" value={(s.sets || 0).toLocaleString()} color={palette.accentDark} />
            <StatCell label="Reps" value={(s.reps || 0).toLocaleString()} color={palette.accentDark} />
            <StatCell label="Time held" value={`${s.holdSec || 0}s`} color={palette.accentDark} />
            <StatCell label="Trail Credit" value={(state.credits || 0).toLocaleString()} color={palette.secondary} />
            <StatCell label="Items found" value={s.itemsCollected} />
            <StatCell label="Habit logs" value={s.habitLogs || 0} color={palette.primaryDark} />
            <StatCell label="Goals met" value={s.habitGoalsHit || 0} color={palette.success} />
            <StatCell label="Day streak" value={`${s.streak} days`} color={palette.accentDark} />
            <StatCell label="Days active" value={s.daysActive} />
          </View>
        </Window>

        {everDone.length ? (
          <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
            <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
              Every Rep You've Done
            </PixelText>
            {everDone.map((e) => (
              <View
                key={e.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}
              >
                <PixelText size="tiny" color={palette.windowText} style={{ flex: 1 }}>
                  {e.name}
                </PixelText>
                <PixelText size="tiny" color={palette.primaryDark}>
                  {/* A hold is measured in seconds and a routine in times done;
                      only a rep count is a count of repetitions. */}
                  {e.kind === 'hold' ? `${e.amount}s` : e.kind === 'workout' ? `x${e.amount}` : e.amount}
                </PixelText>
              </View>
            ))}
          </Window>
        ) : null}

        {memories.length ? (
          <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
            <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
              Memories
            </PixelText>
            {memories.slice().reverse().map((m) => (
              <View key={m.id} style={{ marginTop: 8 }}>
                <PixelText size="tiny" color={palette.windowText}>
                  {m.title}
                </PixelText>
                <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 3, lineHeight: 13 }}>
                  {m.detail}{m.at ? `  ·  ${m.at}` : ''}
                </PixelText>
              </View>
            ))}
          </Window>
        ) : null}

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
            Quest Pins
          </PixelText>
          {ROUTES.map((r) => {
            const earned = !!(trails.progress[r.id] && trails.progress[r.id].pin);
            return (
              <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <PixelText size="tiny" color={palette.windowText}>
                  {r.pinName}
                </PixelText>
                <PixelText size="tiny" color={earned ? palette.success : palette.windowTextDim}>
                  {earned ? 'earned' : 'not yet'}
                </PixelText>
              </View>
            );
          })}
        </Window>

        <Window tone="cream" pad={12} style={{ marginTop: space.md }}>
          <PixelText size="small" color={palette.accentDark} style={{ marginBottom: 6 }}>
            Daily Habits
          </PixelText>
          {modules.map(({ module, state: modState, progress }) => (
            <View key={module.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <PixelSprite spriteKey={moduleSprite(module)} palette={module.spritePalette} size={22} />
              <PixelText size="tiny" color={palette.windowText} style={{ flex: 1, marginLeft: space.sm }}>
                {module.name}
              </PixelText>
              <PixelText size="tiny" color={progress.done ? palette.success : palette.windowTextDim}>
                {progress.value}/{progress.goal}
              </PixelText>
              <PixelText size="tiny" color={palette.accentDark} style={{ width: 62, textAlign: 'right' }}>
                {modState.streak}d streak
              </PixelText>
            </View>
          ))}
        </Window>
      </ScrollView>

      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
