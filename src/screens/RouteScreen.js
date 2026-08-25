// Route 1. Real distance moves you: steps become miles (or GPS on a run), your
// character advances, milestones drop items, and trail markers reveal
// encounters — companions to meet and bad habits to work through.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, Window, ProgressBar, PixelText, PixelSprite, PixelButton, TrailAction, CardioConsole, Tile, MenuButton, TOP_INSET, HorizonSky } from '../components';
import { palette, space, screen, tokens } from '../theme';
import { sceneTone } from '../data/sceneSky';
import { useGame, useCompanion } from '../state';
import { useNav, PLACE_LABELS } from './navContext';
import { playSfx } from '../audio';
import { pacingForGoal, formatMiles } from '../data/route';
import { isGrownForm, rollWildEncounter } from '../data/wild';
import { encounterContext, encounterMeterScale } from '../state/companionLife';
import { encourageLine } from '../data/personality';
import {
  ROUTES,
  getRoute,
  isTrailUnlocked,
  isRegionalWarden,
  trailOf,
  trailReady,
  trailRow,
  wardenBattle,
} from '../data/routes';
import { getCreature } from '../data/creatures';
import { getWarden } from '../data/wardens';
import { breakdownSince, formatBreakdown } from '../data/exercises';
import { getWorkout } from '../data/workouts';
import { outfitPalette } from '../data/outfits';
import { playerSprite } from '../data/characters';
import { routeCheer, pickupLine } from '../coach';
import useCardio from './useCardio';
import { forgetSpot, recallSpot, rememberSpot } from './placeMemory';
import { DEFAULT_BODY_WEIGHT_LB } from '../state/cardioMaths';
import { saveGame } from '../state/storage';

const ROUTE_TS = 22;

function ScrollingScene({ width, height, moving, trailId }) {
  const offset = useRef(new Animated.Value(0)).current;
  const route = getRoute(trailId);
  const scene = sceneTone(route.stageTone || trailId);
  const skyH = Math.round(height * (route.horizon || 0.16));
  const groundH = Math.max(ROUTE_TS * 4, height - skyH);
  const cols = Math.ceil(width / ROUTE_TS);
  const rows = Math.ceil(groundH / ROUTE_TS) + 1;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let loop;
    if (moving) {
      offset.setValue(0);
      loop = Animated.loop(Animated.timing(offset, { toValue: 1, duration: 620, useNativeDriver: true }));
      loop.start();
    } else {
      offset.setValue(0);
    }
    return () => loop && loop.stop();
  }, [offset, moving]);

  useEffect(() => {
    const t = setInterval(() => setFrame((f) => f + 1), 620);
    return () => clearInterval(t);
  }, []);

  const translate = offset.interpolate({ inputRange: [0, 1], outputRange: [0, ROUTE_TS] });
  const sceneMap = useMemo(() => {
    const grid = Array.from({ length: rows * 2 }, (_, r) => trailRow(trailId, r % rows, cols));
    return { id: route.mapId, cols, rows: rows * 2, grid };
  }, [rows, cols, trailId, route.mapId]);

  const strip = useMemo(
    () => sceneMap.grid.map((row, r) => (
      <View key={r} style={{ flexDirection: 'row' }}>
        {row.split('').map((code, x) => (
          <Tile key={x} code={code} s={ROUTE_TS} frame={frame} x={x} y={r} map={sceneMap} />
        ))}
      </View>
    )),
    [sceneMap, frame]
  );

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: scene.ground }}>
      <HorizonSky tone={route.stageTone || trailId} horizon={route.horizon || 0.16} />
      <Animated.View style={{ position: 'absolute', top: skyH - ROUTE_TS, transform: [{ translateY: translate }] }}>
        {strip}
      </Animated.View>
    </View>
  );
}

export default function RouteScreen({ params = {} }) {
  useKeepAwake();
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, toBattle } = useNav();
  const pacing = pacingForGoal(state.goalId);
  const { route, progress } = trailOf(state.trails);
  const ready = trailReady(route, progress);
  const regionalWarden = isRegionalWarden(route);
  const gateTitle = regionalWarden ? 'Warden' : 'Keeper';

  const onWeb = Platform.OS === 'web';
  const [message, setMessage] = useState(
    Platform.OS === 'web'
      ? 'A browser can show the trail. It cannot walk it. Open this on a phone — real steps are the only input.'
      : 'The trail opens up ahead. Every real step carries you forward!'
  );
  const [encMeter, setEncMeter] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [stride, setStride] = useState(0);
  const session = useRef(
    recallSpot('route:session', null) || {
      miles: state.stats.distanceMi,
      steps: state.stats.totalSteps,
      sets: state.stats.sets,
      exercises: state.stats.exercises,
      reps: state.stats.reps,
      holdSec: state.stats.holdSec,
      startedAt: Date.now(),
    }
  );
  useEffect(() => { rememberSpot('route:session', session.current); }, []);

  const [seconds, setSeconds] = useState(Math.floor((Date.now() - session.current.startedAt) / 1000));
  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - session.current.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const encMiRef = useRef(0);
  const encThreshRef = useRef(pacing.encMin + Math.random() * (pacing.encMax - pacing.encMin));
  const busyRef = useRef(false);
  const encTimer = useRef(null);
  const trailRef = useRef(route);
  trailRef.current = route;

  const { dist, moving } = useCardio({
    routeId: route.id,
    onDelta: (dM) => {
      if (dM <= 0 || busyRef.current || !companion) return;
      encMiRef.current += dM;
      const current = trailRef.current;
      const ctx = encounterContext(state, {
        sessionMiles: encMiRef.current,
        trailId: current.id,
        bond: companion.bond,
      });
      const thresh = encThreshRef.current * encounterMeterScale(companion.creature, ctx);
      setEncMeter(Math.min(1, encMiRef.current / thresh));
      if (encMiRef.current < thresh) return;
      busyRef.current = true;
      const enc = rollWildEncounter(
        state.stats.milestonesReached + 1,
        current.companions,
        current.warden,
        ctx,
        companion.creature
      );
      const c = getCreature(enc.creatureId);
      dispatch({ type: 'SEE_CREATURE', payload: { id: enc.creatureId } });
      playSfx('encounter');
      const voice = encourageLine(companion.creature);
      setMessage(
        enc.isCompanion
          ? `${c.name} steps onto the trail and watches you.${voice ? ` ${voice}` : ''}`
          : isGrownForm(enc.creatureId)
            ? `${c.name} is a grown form you already know. This meeting is a challenge, not an invitation.`
            : `${c.name} gathers across the path.`
      );
      encTimer.current = setTimeout(() => toBattle({
        ...enc,
        from: 'route',
        routeId: current.id,
        stageTone: current.stageTone,
        horizon: current.horizon,
      }), 550);
    },
    onMilestone: (item) => setMessage(`Milestone! ${pickupLine(item.name)} ${routeCheer()}`),
  });

  const running = moving || dist.running;
  const sessionMiles = Math.max(0, state.stats.distanceMi - session.current.miles);
  const sessionSteps = Math.max(0, state.stats.totalSteps - session.current.steps);
  const breakdown = useMemo(
    () => formatBreakdown(breakdownSince(state.stats.exercises, session.current.exercises, (id) => {
      const w = getWorkout(id);
      return w ? w.name : id;
    })),
    [state.stats.exercises]
  );
  const sessionWorkouts = Math.max(0, state.stats.sets - session.current.sets);

  useEffect(() => {
    if (!running) {
      setStride(0);
      return undefined;
    }
    const legs = setInterval(() => setStride((s) => (s + 1) % 3), 150);
    return () => clearInterval(legs);
  }, [running]);
  useEffect(() => () => { if (encTimer.current) clearTimeout(encTimer.current); }, []);

  const toggleRun = async () => {
    if (dist.running) {
      dist.stopRun();
      setMessage('Run ended. Nice work out there!');
    } else {
      const ok = await dist.startRun();
      if (ok) setMessage('Run started — GPS is tracking your real miles. Go!');
    }
  };

  const endTrailSession = async () => {
    if (endingSession) return;
    setEndingSession(true);
    setSheetOpen(false);
    if (encTimer.current) {
      clearTimeout(encTimer.current);
      encTimer.current = null;
    }
    busyRef.current = true;
    if (dist.running) dist.stopRun();

    // Distance, challenge reps, pickups and credits enter the main state as
    // they happen. Flush that latest state before leaving so ending halfway
    // through a trail is an explicit save point, not merely a navigation.
    const saved = await saveGame(state);
    if (!saved) {
      busyRef.current = false;
      setEndingSession(false);
      setMessage('Progress is still on this screen, but the save failed. Please try End Trail Session again.');
      return;
    }

    forgetSpot('route:session');
    navigate('hub', { entry: 'trail' });
  };

  const pickTrail = (id) => {
    if (!isTrailUnlocked(id, state.trails)) return;
    dispatch({ type: 'SET_TRAIL', payload: { routeId: id } });
    encMiRef.current = 0;
    setEncMeter(0);
    const next = getRoute(id);
    setMessage(`${next.name} stretches out ahead.`);
  };

  const challengeWarden = () => {
    if (!ready || busyRef.current) return;
    if (!companion) {
      setMessage(`Meet Coach Maple in the gym — then the ${gateTitle} has someone to meet.`);
      return;
    }
    busyRef.current = true;
    const battle = wardenBattle(route);
    const c = getCreature(battle.creatureId);
    const keeper = getWarden(route.id);
    dispatch({ type: 'SEE_CREATURE', payload: { id: battle.creatureId } });
    playSfx('encounter');
    setMessage(
      keeper
        ? `${keeper.name} sends ${c.name} out. ${battle.regionalWarden ? `The Warden of ${route.region} guards the way forward.` : `Clear this Keeper challenge to open the next trail.`}`
        : `${c.name} takes the path.`
    );
    encTimer.current = setTimeout(() => toBattle(battle), 550);
  };

  const trailPanel = (
    <CardioConsole
      title={route.name.toUpperCase()}
      seconds={seconds}
      miles={sessionMiles}
      steps={sessionSteps}
      workouts={sessionWorkouts}
      breakdown={breakdown}
      bodyWeightLb={state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB}
      moving={running}
      onInject={dist.showInjector ? dist.injectSteps : null}
    >
      {dist.running ? <PixelText size="tiny" color={palette.hpHigh} style={{ marginTop: space.sm }}>● GPS RUN</PixelText> : null}
      <ProgressBar value={progress.miles} max={route.miles} color={palette.hpHigh} height={12} label={`${route.miles} mi for the ${gateTitle}`} showText={false} style={{ marginTop: space.sm }} />
      <ProgressBar value={progress.reps} max={route.reps} color={palette.accent} height={8} label={`${route.reps} reps in challenges`} showText={false} style={{ marginTop: 6 }} />
      <ProgressBar value={encMeter} max={1} color={palette.secondary} height={6} label="Trail signs" showText={false} style={{ marginTop: 6 }} />
      <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6 }}>
        {formatMiles(progress.miles)} / {route.miles} mi · {progress.reps}/{route.reps} reps
        {progress.pin ? ` · ${regionalWarden ? route.pinName : 'trail cleared'}` : ''}
      </PixelText>
    </CardioConsole>
  );

  const stepPanel = dist.showInjector ? (
    <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
      <PixelText size="tiny" color={palette.danger}>No step counter available</PixelText>
      {dist.pedDiag ? (
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 5, lineHeight: 13 }}>
          {dist.pedDiag.host} · {dist.pedDiag.platform}{'\n'}permission: {dist.pedDiag.permission || 'unknown'}
          {dist.pedDiag.error ? `\nerror: ${dist.pedDiag.error}` : ''}
        </PixelText>
      ) : null}
      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 12 }}>
        Until it works, these buttons stand in for real steps.
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
        {dist.source === 'pedometer'
          ? 'Step counter connected — walk to advance!'
          : dist.source === 'probing'
          ? 'Looking for a step counter...'
          : 'Counting your steps — keep the app open and walk!'}
      </PixelText>
      {dist.source === 'motion' ? <PixelText size="small" color={palette.secondary} style={{ marginTop: 6 }}>{dist.motionSteps} steps detected</PixelText> : null}
      {dist.motionSlow ? (
        <PixelText size="tiny" color={palette.hpMid} style={{ marginTop: 5, lineHeight: 12 }}>
          This phone reports motion at {dist.motionHz} Hz, which is too slow to catch every footfall — your real step count is higher than this. A development build fixes it properly; see docs/STEP_COUNTING.md.
        </PixelText>
      ) : null}
      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, lineHeight: 12 }}>
        {dist.source === 'pedometer'
          ? 'Your phone counts steps even with the screen off. Tap Start Run for GPS distance.'
          : 'No step counter on this build, so the app is reading motion itself — that only works while this screen is open. Start Run uses GPS instead and works better outdoors.'}
      </PixelText>
    </Window>
  );

  return (
    <Screen padTop={false} style={{ padding: 0 }}>
      <View style={{ flex: 1, backgroundColor: palette.grass }}>
        <ScrollingScene width={screen.width} height={screen.height} moving={running} trailId={route.id} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: screen.height * 0.30, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <PixelSprite spriteKey={playerSprite(state.playerGender, 'down', stride)} palette={outfitPalette(state.playerOutfit, state.playerGender)} size={40} bob={running} />
            {companion ? (
              <>
                <View style={{ width: 10 }} />
                <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={60} bob={running} />
              </>
            ) : null}
          </View>
        </View>

        <View style={{ position: 'absolute', top: TOP_INSET, left: space.sm, right: space.sm, flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>{trailPanel}</View>
          <View style={{ marginLeft: space.sm }}><MenuButton onPress={() => setSheetOpen(true)} /></View>
        </View>

        <View style={{ position: 'absolute', left: space.sm, right: space.sm, bottom: space.lg }}>
          <Window tone="cream" pad={12} innerStyle={{ minHeight: 56 }}>
            <PixelText size="small" color={palette.windowText} style={{ lineHeight: 18 }}>{message}</PixelText>
          </Window>
          {onWeb && dist.source === 'none' && !dist.running && !dist.showInjector ? (
            <PixelText size="tiny" color={palette.secondary} style={{ marginTop: space.sm, lineHeight: 14 }}>
              Published web cannot count steps, and there are no walk buttons. GPS on a desktop almost never works. The engine lives on a phone.
            </PixelText>
          ) : null}
          {dist.gpsError ? <PixelText size="tiny" color={palette.danger} style={{ marginTop: space.sm }}>{dist.gpsError}</PixelText> : null}
          {ready ? (
            <PixelButton label={`Challenge the ${gateTitle}`} tone="gold" style={{ marginTop: space.sm }} onPress={challengeWarden} />
          ) : progress.pin ? (
            <PixelText size="tiny" color={palette.secondary} style={{ marginTop: space.sm }} align="center">
              {regionalWarden ? `${route.pinName} earned · next region open` : 'Trail cleared · next trail open'}
            </PixelText>
          ) : null}
          <PixelButton
            label={dist.running ? 'Stop Run' : 'Start Run (GPS)'}
            tone={dist.running ? 'danger' : 'primary'}
            sound="confirm"
            style={{ marginTop: space.sm }}
            onPress={toggleRun}
          />
        </View>
      </View>

      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#000000cc' }} onPress={() => setSheetOpen(false)}>
          <Pressable onPress={() => {}} style={{ marginTop: 'auto', backgroundColor: tokens.surface, borderTopColor: tokens.line, borderTopWidth: 3, padding: space.md, maxHeight: '78%' }}>
            <PixelText size="small" color={tokens.textOnDark} style={{ marginBottom: space.sm }}>ON THE TRAIL</PixelText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: space.sm }}>
              {ROUTES.map((r) => {
                const unlocked = isTrailUnlocked(r.id, state.trails);
                const active = r.id === route.id;
                return (
                  <PixelButton
                    key={r.id}
                    label={r.name}
                    tone={active ? 'gold' : 'dark'}
                    size="small"
                    disabled={!unlocked}
                    sound="cursor"
                    style={{ marginRight: 6, marginBottom: 6, paddingVertical: 8, paddingHorizontal: 10 }}
                    onPress={() => pickTrail(r.id)}
                  />
                );
              })}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>{stepPanel}</ScrollView>
            <TrailAction
              label={endingSession ? 'Saving trail progress...' : 'End Trail Session & Save'}
              sublabel={`Keep partial miles and challenge progress · return to ${PLACE_LABELS.hub}`}
              tone="primary"
              disabled={endingSession}
              onPress={endTrailSession}
            />
            <TrailAction label="Close" tone="quiet" style={{ marginTop: space.sm }} onPress={() => setSheetOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
