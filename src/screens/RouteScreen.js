// Route 1 — your REAL distance moves you. Steps become miles (or GPS on a run);
// your character auto-advances along the trail; tall grass rolls wild
// encounters (befriendable companions or bad-habit obstacles). Milestones drop
// items. No pedometer? A dev injector lets you simulate distance.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, DualPane, Window, ProgressBar, PixelText, PixelSprite, PixelButton } from '../components';
import { palette, space, screen } from '../theme';
import { useGame, useCompanion, useDistance } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { pacingForGoal, formatMiles } from '../data/route';
import { PICKUP_POOL, getItem } from '../data/items';
import { rollWildEncounter } from '../data/wild';
import { getCreature } from '../data/creatures';
import { routeCheer, pickupLine } from '../coach';

function ScrollingScene({ width, height, moving }) {
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    if (moving) {
      loop = Animated.loop(Animated.timing(offset, { toValue: 1, duration: 700, useNativeDriver: true }));
      loop.start();
    }
    return () => loop && loop.stop();
  }, [offset, moving]);
  const dashH = 20;
  const translate = offset.interpolate({ inputRange: [0, 1], outputRange: [0, dashH * 2] });
  const laneW = Math.floor(width * 0.34);
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center' }}>
      {/* grass tufts on the sides */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.3, backgroundColor: palette.grassDark, opacity: 0.5 }} />
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.3, backgroundColor: palette.grassDark, opacity: 0.5 }} />
      <View style={{ width: laneW, height, backgroundColor: palette.path }}>
        <Animated.View style={{ transform: [{ translateY: translate }] }}>
          {Array.from({ length: Math.ceil(height / (dashH * 2)) + 2 }).map((_, i) => (
            <View key={i} style={{ width: 6, height: dashH, backgroundColor: palette.pathDark, alignSelf: 'center', marginVertical: dashH / 2 }} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

export default function RouteScreen() {
  useKeepAwake();
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, toBattle } = useNav();
  const dist = useDistance();
  const pacing = pacingForGoal(state.goalId);

  const [message, setMessage] = useState('The trail opens up ahead. Every real step carries you forward!');
  const [encMeter, setEncMeter] = useState(0);
  const [moving, setMoving] = useState(false);

  const lastMiles = useRef(0);
  const lastSteps = useRef(0);
  const prevMilestones = useRef(state.stats.milestonesReached);
  const encMiRef = useRef(0);
  const encThreshRef = useRef(pacing.encMin + Math.random() * (pacing.encMax - pacing.encMin));
  const busyRef = useRef(false);
  const moveTimer = useRef(null);
  const encTimer = useRef(null);

  // Feed real distance into the game; roll grass encounters as you move.
  useEffect(() => {
    const dM = dist.miles - lastMiles.current;
    const dS = dist.steps - lastSteps.current;
    if (dM <= 0 && dS <= 0) return;
    lastMiles.current = dist.miles;
    lastSteps.current = dist.steps;
    dispatch({ type: 'ADD_DISTANCE', payload: { miles: dM, steps: dS } });

    // visual "walking" pulse
    setMoving(true);
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => setMoving(false), 900);

    if (dM > 0 && !busyRef.current) {
      encMiRef.current += dM;
      setEncMeter(Math.min(1, encMiRef.current / encThreshRef.current));
      if (encMiRef.current >= encThreshRef.current) {
        busyRef.current = true;
        const enc = rollWildEncounter(state.stats.milestonesReached + 1);
        const c = getCreature(enc.creatureId);
        dispatch({ type: 'SEE_CREATURE', payload: { id: enc.creatureId } });
        playSfx('encounter');
        setMessage(enc.isCompanion ? `A wild ${c.name} rustles the tall grass!` : `A ${c.name} blocks the path!`);
        encTimer.current = setTimeout(() => toBattle({ ...enc, from: 'route' }), 550);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dist.miles, dist.steps]);

  // Milestone pickups.
  useEffect(() => {
    const cur = state.stats.milestonesReached;
    if (cur > prevMilestones.current) {
      prevMilestones.current = cur;
      playSfx('milestone');
      const itemId = PICKUP_POOL[Math.floor(Math.random() * PICKUP_POOL.length)];
      const item = getItem(itemId);
      dispatch({ type: 'COLLECT_ITEM', payload: { itemId } });
      playSfx('item');
      setMessage(`Milestone! ${pickupLine(item.name)} ${routeCheer()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stats.milestonesReached]);

  useEffect(
    () => () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
      if (encTimer.current) clearTimeout(encTimer.current);
    },
    []
  );

  const sceneH = Math.floor(screen.height * 0.42);
  const toggleRun = async () => {
    if (dist.running) {
      dist.stopRun();
      setMessage('Run ended. Nice work out there!');
    } else {
      const ok = await dist.startRun();
      if (ok) setMessage('Run started — GPS is tracking your real miles. Go!');
    }
  };

  const top = (
    <View style={{ flex: 1, backgroundColor: palette.grass }}>
      <ScrollingScene width={screen.width} height={sceneH} moving={moving || dist.running} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.xl }}>
        {companion ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <PixelSprite spriteKey="hero_down" size={56} bob={moving || dist.running} />
            <View style={{ width: 8 }} />
            <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={52} bob={moving || dist.running} />
          </View>
        ) : null}
      </View>
      <View style={{ position: 'absolute', top: space.sm, left: space.sm, right: space.sm }}>
        <Window tone="dark" pad={8}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="tiny" color={palette.secondary}>
              {pacing.trail}
            </PixelText>
            {dist.running ? (
              <PixelText size="tiny" color={palette.hpHigh}>
                ● GPS RUN
              </PixelText>
            ) : null}
          </View>
          <ProgressBar value={state.stats.routeMi} max={pacing.milestoneMi} color={palette.hpHigh} height={12} label="Next milestone" showText={false} style={{ marginTop: 6 }} />
          <ProgressBar value={encMeter} max={1} color={palette.accent} height={8} label="Tall grass (encounter)" showText={false} style={{ marginTop: 6 }} />
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6 }}>
            {formatMiles(state.stats.distanceMi)} · {state.stats.milestonesReached} milestones
          </PixelText>
        </Window>
      </View>
    </View>
  );

  const bottom = (
    <View style={{ flex: 1, padding: space.md }}>
      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }} innerStyle={{ minHeight: 62 }}>
        <PixelText size="small" color={palette.windowText} style={{ lineHeight: 18 }}>
          {message}
        </PixelText>
      </Window>

      <View style={{ flexDirection: 'row', marginBottom: space.sm }}>
        <PixelButton label={dist.running ? 'Stop Run' : 'Start Run (GPS)'} tone={dist.running ? 'danger' : 'primary'} sound="confirm" style={{ flex: 1 }} onPress={toggleRun} />
      </View>
      {dist.gpsError ? (
        <PixelText size="tiny" color={palette.danger} style={{ marginBottom: space.sm }}>
          {dist.gpsError}
        </PixelText>
      ) : null}

      {dist.showInjector ? (
        <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
          <PixelText size="tiny" color={palette.danger}>
            DEV ONLY · no pedometer detected
          </PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, lineHeight: 12 }}>
            simulate distance for testing (hidden on a real phone)
          </PixelText>
          <View style={{ flexDirection: 'row', marginTop: space.sm }}>
            {[[100, '+0.05mi'], [500, '+0.25mi'], [2000, '+1mi']].map(([n, label], i) => (
              <PixelButton key={n} label={label} tone="primary" size="small" style={{ flex: 1, marginRight: i < 2 ? 6 : 0, paddingVertical: 8 }} sound="cursor" onPress={() => dist.injectSteps(n)} />
            ))}
          </View>
        </Window>
      ) : (
        <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
          <PixelText size="tiny" color={palette.hpHigh}>
            Movement detected — walk or run to advance!
          </PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, lineHeight: 12 }}>
            Steps become miles. Tap Start Run for GPS-tracked distance.
          </PixelText>
        </Window>
      )}

      <PixelButton label="Back to Town" tone="plain" sound="cancel" onPress={() => { if (dist.running) dist.stopRun(); navigate('hub'); }} />
    </View>
  );

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} topFlex={1} bottomFlex={1} />
    </Screen>
  );
}
