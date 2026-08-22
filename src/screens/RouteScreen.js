// Real distance moves you. Steps become miles (or GPS on a run), your character
// advances, and milestones drop items.
//
// TWO MODES, and the difference is the point:
//
//   route      Route 1. Trail markers reveal encounters — companions to meet
//              and bad habits to work through — so distance out here is where
//              the game happens to you.
//   treadmill  The Hall's cardio deck. Identical credit: the same miles, the
//              same milestones, the same progression. What it does not have is
//              anything that stops you — no encounters, no challenges. It is
//              for the days you want to put the miles in and be left alone.
//
// Both are real movement. Neither is a "walk" button.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, Window, ProgressBar, PixelText, PixelSprite, PixelButton, TrailAction, Tile, MenuButton, TOP_INSET } from '../components';
import { palette, space, screen, tokens } from '../theme';
import { useGame, useCompanion, useDistance } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { pacingForGoal, formatMiles } from '../data/route';
import { PICKUP_POOL, getItem } from '../data/items';
import { rollWildEncounter } from '../data/wild';
import { getCreature } from '../data/creatures';
import { outfitPalette } from '../data/outfits';
import { playerSprite } from '../data/characters';
import { routeCheer, pickupLine } from '../coach';

// The trail itself.
//
// This used to be three flat rectangles with a dashed centre line — it read as
// a road-safety diagram, and it was the last screen in the app still drawing
// scenery out of coloured Views. It is a real tile field now: the same grass,
// path, tall grass and tree tiles the overworld uses, scrolling past you.
const ROUTE_TS = 22;

// A deterministic strip, so the trail looks the same every time you walk it and
// nothing reshuffles under you on a re-render.
function routeRow(r, cols, treadmill) {
  const laneW = Math.max(3, Math.round(cols * 0.3));
  const lane0 = Math.floor((cols - laneW) / 2);
  const h = (r * 2654435761) >>> 0;
  let row = '';
  for (let x = 0; x < cols; x += 1) {
    const n = ((h ^ (x * 2246822519)) >>> 0) % 100;
    if (treadmill) {
      // Indoors: plain Hall floor. The running lane itself is a ZONE declared
      // on the scene map below, not a code per square — the belt used to be a
      // row of mat props and so it had a hard sawn edge down each side.
      row += '.';
    } else if (x >= lane0 && x < lane0 + laneW) {
      row += '#';
    } else if (x < 1 || x > cols - 2) {
      row += 'T';
    } else if (x < 2 || x > cols - 3) {
      row += n < 62 ? 'T' : '^';
    } else {
      row += n < 14 ? '^' : n < 22 ? ',' : '.';
    }
  }
  return row;
}

function ScrollingScene({ width, height, moving, treadmill }) {
  const offset = useRef(new Animated.Value(0)).current;
  const cols = Math.ceil(width / ROUTE_TS);
  const rows = Math.ceil(height / ROUTE_TS) + 1;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let loop;
    if (moving) {
      // One full tile-row per cycle, then reset — two stacked copies of the
      // strip make the wrap invisible.
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

  // Tile resolves its layers from its neighbours, so the strip has to be a map
  // rather than loose codes. Handing it rows one at a time cost the trail its
  // autotiled edges and its trees — the scene came out as a field of grass.
  const sceneMap = useMemo(() => {
    const grid = Array.from({ length: rows * 2 }, (_, r) => routeRow(r % rows, cols, treadmill));
    const laneW = Math.max(3, Math.round(cols * 0.3));
    const lane0 = Math.floor((cols - laneW) / 2);
    return {
      id: treadmill ? 'gym' : 'route',
      cols,
      rows: rows * 2,
      grid,
      // The deck's running surface, as a zone: it gets the same joint and lip
      // the Hall's own matting has, so it reads as a lane let into the floor
      // rather than as a strip laid on top of it.
      zones: treadmill
        ? [{ field: 'tile_gym_mats', x0: lane0, y0: 0, x1: lane0 + laneW - 1, y1: rows * 2 - 1 }]
        : undefined,
    };
  }, [rows, cols, treadmill]);

  const strip = useMemo(
    () =>
      sceneMap.grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, x) => (
            <Tile key={x} code={code} s={ROUTE_TS} frame={frame} x={x} y={r} map={sceneMap} />
          ))}
        </View>
      )),
    [sceneMap, frame]
  );

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: treadmill ? palette.bgAlt : palette.grassDark }}>
      <Animated.View style={{ position: 'absolute', top: -ROUTE_TS * rows, transform: [{ translateY: translate }] }}>
        {strip}
      </Animated.View>
    </View>
  );
}

export default function RouteScreen({ params = {} }) {
  useKeepAwake();
  const treadmill = params.mode === 'treadmill';
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, toBattle } = useNav();
  const dist = useDistance();
  const pacing = pacingForGoal(state.goalId);

  const [message, setMessage] = useState(
    params.mode === 'treadmill'
      ? 'Deck is running. Nothing out here but the miles — go at your own pace.'
      : 'The trail opens up ahead. Every real step carries you forward!'
  );
  const [encMeter, setEncMeter] = useState(0);
  const [moving, setMoving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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

    // Indoors there is nothing to meet, so the encounter meter never fills.
    if (dM > 0 && !busyRef.current && !treadmill) {
      encMiRef.current += dM;
      setEncMeter(Math.min(1, encMiRef.current / encThreshRef.current));
      if (encMiRef.current >= encThreshRef.current) {
        busyRef.current = true;
        const enc = rollWildEncounter(state.stats.milestonesReached + 1);
        const c = getCreature(enc.creatureId);
        dispatch({ type: 'SEE_CREATURE', payload: { id: enc.creatureId } });
        playSfx('encounter');
        setMessage(enc.isCompanion ? `${c.name} steps onto the trail and watches you.` : `${c.name} gathers across the path.`);
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


  const toggleRun = async () => {
    if (dist.running) {
      dist.stopRun();
      setMessage('Run ended. Nice work out there!');
    } else {
      const ok = await dist.startRun();
      if (ok) setMessage('Run started — GPS is tracking your real miles. Go!');
    }
  };

  const trailPanel = (
    <Window tone="dark" pad={8}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PixelText size="tiny" color={palette.secondary}>
          {treadmill ? 'Training Hall — cardio deck' : pacing.trail}
        </PixelText>
        {dist.running ? (
          <PixelText size="tiny" color={palette.hpHigh}>
            ● GPS RUN
          </PixelText>
        ) : null}
      </View>
      <ProgressBar value={state.stats.routeMi} max={pacing.milestoneMi} color={palette.hpHigh} height={12} label="Next milestone" showText={false} style={{ marginTop: 6 }} />
      {treadmill ? null : (
        <ProgressBar value={encMeter} max={1} color={palette.accent} height={8} label="Trail signs" showText={false} style={{ marginTop: 6 }} />
      )}
      <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6 }}>
        {formatMiles(state.stats.distanceMi)} · {state.stats.milestonesReached} milestones
      </PixelText>
    </Window>
  );

  // Everything that explains the step counter rather than showing the trail.
  // It matters — "it doesn't work" is not something anyone can act on — but it
  // is reference, not scenery, so it lives behind the menu button now instead
  // of taking half the screen.
  const stepPanel = dist.showInjector ? (
    <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
      <PixelText size="tiny" color={palette.danger}>No step counter available</PixelText>
      {dist.pedDiag ? (
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 5, lineHeight: 13 }}>
          {dist.pedDiag.host} · {dist.pedDiag.platform}
          {'\n'}permission: {dist.pedDiag.permission || 'unknown'}
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
      {dist.source === 'motion' ? (
        <PixelText size="small" color={palette.secondary} style={{ marginTop: 6 }}>
          {dist.motionSteps} steps detected
        </PixelText>
      ) : null}
      {dist.motionSlow ? (
        <PixelText size="tiny" color={palette.hpMid} style={{ marginTop: 5, lineHeight: 12 }}>
          This phone reports motion at {dist.motionHz} Hz, which is too slow to catch every
          footfall — your real step count is higher than this. A development build fixes it
          properly; see docs/STEP_COUNTING.md.
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
      <View style={{ flex: 1, backgroundColor: treadmill ? palette.bgAlt : palette.grass }}>
        {/* The trail is the screen now, not a window at the top of it. */}
        <ScrollingScene
          width={screen.width}
          height={screen.height}
          moving={moving || dist.running}
          treadmill={treadmill}
        />

        {/* You and your companion, standing clear of the panel below. */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: screen.height * 0.30, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <PixelSprite
              spriteKey={playerSprite(state.playerGender)}
              palette={outfitPalette(state.playerOutfit, state.playerGender)}
              size={40}
              bob={moving || dist.running}
            />
            {companion && !treadmill ? (
              <>
                <View style={{ width: 10 }} />
                <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={60} bob={moving || dist.running} />
              </>
            ) : null}
          </View>
        </View>

        <View style={{ position: 'absolute', top: TOP_INSET, left: space.sm, right: space.sm, flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>{trailPanel}</View>
          <View style={{ marginLeft: space.sm }}>
            <MenuButton onPress={() => setSheetOpen(true)} />
          </View>
        </View>

        <View style={{ position: 'absolute', left: space.sm, right: space.sm, bottom: space.lg }}>
          <Window tone="cream" pad={12} innerStyle={{ minHeight: 56 }}>
            <PixelText size="small" color={palette.windowText} style={{ lineHeight: 18 }}>
              {message}
            </PixelText>
          </Window>
          {dist.gpsError ? (
            <PixelText size="tiny" color={palette.danger} style={{ marginTop: space.sm }}>
              {dist.gpsError}
            </PixelText>
          ) : null}
          {treadmill ? null : (
            <PixelButton
              label={dist.running ? 'Stop Run' : 'Start Run (GPS)'}
              tone={dist.running ? 'danger' : 'primary'}
              sound="confirm"
              style={{ marginTop: space.sm }}
              onPress={toggleRun}
            />
          )}
        </View>
      </View>

      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#000000cc' }} onPress={() => setSheetOpen(false)}>
          <Pressable onPress={() => {}} style={{ marginTop: 'auto', backgroundColor: tokens.surface, borderTopColor: tokens.line, borderTopWidth: 3, padding: space.md, maxHeight: '78%' }}>
            <PixelText size="small" color={tokens.textOnDark} style={{ marginBottom: space.sm }}>
              {treadmill ? 'CARDIO DECK' : 'ON THE TRAIL'}
            </PixelText>
            <ScrollView showsVerticalScrollIndicator={false}>{stepPanel}</ScrollView>
            <TrailAction
              label={treadmill ? 'Step Off the Deck' : 'Back to Town'}
              tone="quiet"
              onPress={() => {
                setSheetOpen(false);
                if (dist.running) dist.stopRun();
                navigate(treadmill ? 'gym' : 'hub');
              }}
            />
            <TrailAction label="Close" tone="quiet" style={{ marginTop: space.sm }} onPress={() => setSheetOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
