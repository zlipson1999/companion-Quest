// Quest Fitness — the gym interior.
//
// The gym door used to jump straight to the exercise list, so the building the
// whole onboarding walks you toward had no inside. Here the equipment IS the
// menu: walk into a rack, a machine, the treadmill or the mirror and it opens
// the system that piece stands for. That replaces a screen of buttons
// explaining the systems with a room that demonstrates them.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WorldScreen, CompanionStatus, CardioConsole, DialogueBox } from '../components';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { SPAR_PARAMS } from './SparIntroScreen';
import { playSfx } from '../audio';
import { GYM, mapWithout, isWalkable, tileAt, triggerForCode, interactionForCode } from '../data/maps';
import { recallSpot, rememberSpot } from './placeMemory';
import { useKeepAwake } from 'expo-keep-awake';
import useCardio from './useCardio';
import { DEFAULT_BODY_WEIGHT_LB } from '../state/cardioMaths';
import { breakdownSince, formatBreakdown } from '../data/exercises';
import { getWorkout } from '../data/workouts';

// Scoped to the session by being a component: expo's hook cannot be called
// conditionally, and a phone that sleeps halfway through a run on the deck is
// a phone that stops counting.
function KeepAwakeOnDeck() {
  useKeepAwake();
  return null;
}

const MENU = [
  { label: 'Back to Sunkist Lane', value: 'hub', sublabel: 'the lane outside' },
  { label: 'Shelf sessions', value: 'workout', sublabel: 'take a session off the shelf' },
  { label: 'Trails', value: 'route', sublabel: 'real miles, Wardens' },
  { label: 'Team', value: 'party', sublabel: 'companions' },
  { label: 'Options', value: 'options', sublabel: 'settings' },
];

// Maple's tour of her own floor. She WALKS to each station and explains it
// standing in front of the thing, because a room demonstrates better than a
// lecture: each stop is a stand tile, the way she faces, and what she says.
// The route between stops is found at runtime over the real grid, so a future
// floor re-plan cannot silently walk her through a rack.
const TOUR_STOPS = [
  { at: { x: 6, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'Welcome to Quest Fitness. Everything in this room works one way: walk up to a thing and use it. Stay close - I will show you every station on my floor.' },
    { speaker: 'Coach Maple', text: 'Reception. Your whole record lives here - every mile, every session, every catch. Walk into the desk any time you want the honest total.' },
  ] },
  { at: { x: 7, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'The cork noticeboard. Friends pin their weeks here - miles, days, sessions. Only people you both agreed to, and only what a person can actually do.' },
  ] },
  { at: { x: 11, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'The smoothie bar. It takes Trail Credit, and credit is minted by effort - miles walked, sessions done. Nobody buys their way up in here.' },
  ] },
  { at: { x: 2, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'Lockers. Your supplies live here - the same bag you carry on the trail. Apples, water, and the Kinship Knots you will learn about soon.' },
  ] },
  { at: { x: 1, y: 2 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'The mirror. Not for admiring - walk into it mid-session and it becomes a form check: your own camera with the movement cues over the top. What a mirror is FOR.' },
  ] },
  { at: { x: 2, y: 4 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'Kettlebells. Swings, carries, get-ups - walk in and the Forge opens with them ready.' },
  ] },
  { at: { x: 2, y: 6 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'The dumbbell run. Every session you write yourself starts by walking into the iron you mean to use.' },
  ] },
  { at: { x: 4, y: 5 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'Flat benches. Iron, not furniture - press here, log the weight you actually lifted, and your bests land on the boards.' },
  ] },
  { at: { x: 4, y: 8 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'The EZ-bar cradle. Curls and skull-crushers without the wrist ache. Same Forge, same honest count.' },
  ] },
  { at: { x: 5, y: 2 }, face: 'up', lines: [
    { speaker: 'Coach Maple', text: 'The power racks. The heart of the Forge: build your OWN session - movements, sets, the load on the bar. Write down what really happened, not what you hoped.' },
  ] },
  { at: { x: 14, y: 2 }, face: 'up', lines: [
    { speaker: 'Coach Maple', text: 'The pull-up bar. Bodyweight is iron too - it goes in the Forge like everything else.' },
  ] },
  { at: { x: 13, y: 1 }, face: 'up', lines: [
    { speaker: 'Coach Maple', text: 'My whiteboard keeps this week against the week before - the honest verdict, not the flattering one.' },
  ] },
  { at: { x: 6, y: 6 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The machines. Guided iron - walk into any of them when you want a session built around what a machine does best.' },
  ] },
  { at: { x: 14, y: 4 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The water station. It opens your daily habits - water, food, sleep, stillness. Logging them honestly grows your companion the same as the iron does.' },
  ] },
  { at: { x: 14, y: 6 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The deck. Step on and the console starts - and hear me on this: only REAL movement counts. There is no button that walks for you, here or anywhere in your life.' },
  ] },
  { at: { x: 14, y: 10 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The rowers. Same rule as the deck - the console counts what your body actually does.' },
  ] },
  { at: { x: 14, y: 12 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The mat floor. Walk on for a guided circuit - dead bugs, push-ups, holds. Reps you really do, counted when you say they are done. Your word is the equipment here.' },
  ] },
  // The tour ENDS on the turf, on purpose: warming up is where a session
  // starts, so it is the last thing she teaches and the first thing you do -
  // and it is where Rowan finds you afterwards.
  { at: { x: 2, y: 13 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'Last stop, and the most important: the turf. Every session STARTS here, with dynamic stretches - leg swings, walking lunges, arm circles, high knees. Movement that warms you, not holds that put you to sleep.' },
    { speaker: 'Coach Maple', text: 'Warm muscles move better and get hurt less. Walk onto the turf before the iron, every time, and the routine will guide you through it.' },
    { speaker: 'Coach Maple', text: 'So - the real question, right here on the grass. What are you here to become? Answer honestly, because a companion is about to recognize you by it.' },
  ] },
];

// Shortest path over the walkable grid. The gym is 17x19; breadth-first is
// instant and cannot be fooled by furniture the way a hand-authored path can.
function pathBetween(map, from, to) {
  const key = (x, y) => `${x},${y}`;
  const prev = new Map([[key(from.x, from.y), null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === to.x && cur.y === to.y) break;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!isWalkable(map, nx, ny) || prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), cur);
      queue.push({ x: nx, y: ny });
    }
  }
  if (!prev.has(key(to.x, to.y))) return [];
  const path = [];
  for (let cur = to; cur && !(cur.x === from.x && cur.y === from.y); cur = prev.get(key(cur.x, cur.y))) {
    path.unshift(cur);
  }
  return path;
}

export default function GymScreen() {
  const { state, dispatch } = useGame();
  // Rowan is here for his challenge and then he has done his session and
  // gone. Coach stays — she keeps the place.
  const map = state.meta.sparDone ? mapWithout(GYM, ['A']) : GYM;
  const companion = useCompanion();
  const { navigate, toBattle } = useNav();

  // Walk into a rack, write a session, come back — and you were at the door
  // again, halfway across the room from the thing you had just used.
  const [player, setPlayer] = useState(() =>
    recallSpot('gym', { x: GYM.spawn.x, y: GYM.spawn.y, facing: 'up' }, (s) => isWalkable(map, s.x, s.y))
  );
  const [facingStation, setFacingStation] = useState(null);
  // Standing on a machine. Cardio used to be a whole separate screen that took
  // over the phone; it is a thing you do in the room, standing on the thing.
  const [cardio, setCardio] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState(null);
  const playerRef = useRef(player);

  // Maple's walking tour: { stop, coach:{x,y,facing}, path:[tiles], talking }.
  // While it runs, her static C tile comes off the map so she is not standing
  // in two places, and the player's controls step aside — this is her floor.
  const [tour, setTour] = useState(null);
  const tourMap = useMemo(() => mapWithout(map, ['C']), [map]);

  const beginStop = (index, from) => {
    const stop = TOUR_STOPS[index];
    const path = pathBetween(tourMap, from, stop.at);
    setTour({ stop: index, coach: { ...from, facing: path.length ? 'down' : stop.face }, path, hist: [], follow: null, talking: path.length === 0 });
  };

  useEffect(() => {
    if (!tour || tour.talking || !tour.path.length) return undefined;
    const t = setTimeout(() => {
      setTour((cur) => {
        if (!cur || cur.talking || !cur.path.length) return cur;
        const [next, ...rest] = cur.path;
        const dirTo = next.x > cur.coach.x ? 'right' : next.x < cur.coach.x ? 'left' : next.y > cur.coach.y ? 'down' : 'up';
        const arrived = rest.length === 0;
        // You follow her, two steps behind, along the exact tiles she walked —
        // so the follower can never clip a rack she went around.
        const hist = [...cur.hist, { x: cur.coach.x, y: cur.coach.y }];
        const follow = hist.length > 1 ? hist.shift() : null;
        return {
          ...cur,
          coach: { x: next.x, y: next.y, facing: arrived ? TOUR_STOPS[cur.stop].face : dirTo },
          path: rest,
          hist,
          follow,
          talking: arrived,
        };
      });
    }, 230);
    return () => clearTimeout(t);
  }, [tour]);

  // The follower's step is applied outside the tour reducer, from the tile it
  // hands over: your sprite walks her trail while she talks ahead of you.
  useEffect(() => {
    if (!tour || !tour.follow) return;
    const me = playerRef.current;
    const f = tour.follow;
    if (f.x === me.x && f.y === me.y) return;
    const facing = f.x > me.x ? 'right' : f.x < me.x ? 'left' : f.y > me.y ? 'down' : 'up';
    apply({ x: f.x, y: f.y, facing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour && tour.follow]);

  const advanceTour = () => {
    if (!tour) return;
    const next = tour.stop + 1;
    if (next >= TOUR_STOPS.length) {
      dispatch({ type: 'MARK_META', payload: { coachIntroDone: true } });
      setTour(null);
      playSfx('confirm');
      // You followed her to the turf, so the first bond returns you exactly
      // where you stand now — which is where Rowan comes to find you.
      rememberSpot('gym', { ...playerRef.current });
      navigate('goal');
      return;
    }
    beginStop(next, { x: tour.coach.x, y: tour.coach.y });
  };

  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
    rememberSpot('gym', np);
  };

  // Rowan does not wait to be found. The moment you are on the floor with a
  // companion of your own — first bond just made on the turf, or a returning
  // save that never had the contest — he WALKS OVER, calls his challenge to
  // your face, and only then does the contest start. Read at mount: listing
  // live deps here re-armed the cleanup every render and it never fired.
  const [rush, setRush] = useState(null);   // { at:{x,y,facing}, path, talking }
  useEffect(() => {
    if (!companion || state.meta.sparDone) return undefined;
    const t = setTimeout(() => {
      const from = { x: 11, y: 15 };        // his spot on the floor
      const target = playerRef.current;
      const route = pathBetween(mapWithout(GYM, ['C', 'A']), from, { x: target.x, y: target.y });
      const path = route.slice(0, -1);      // stop beside you, not on you
      const last = path.length ? path[path.length - 1] : from;
      const face = target.x > last.x ? 'right' : target.x < last.x ? 'left' : target.y > last.y ? 'down' : 'up';
      setRush({ at: { ...from, facing: 'down' }, path, face, talking: path.length === 0 });
    }, 900);
    return () => clearTimeout(t);
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!rush || rush.talking || !rush.path.length) return undefined;
    const t = setTimeout(() => {
      setRush((cur) => {
        if (!cur || cur.talking || !cur.path.length) return cur;
        const [next, ...rest] = cur.path;
        const dirTo = next.x > cur.at.x ? 'right' : next.x < cur.at.x ? 'left' : next.y > cur.at.y ? 'down' : 'up';
        const arrived = rest.length === 0;
        return { ...cur, at: { x: next.x, y: next.y, facing: arrived ? cur.face : dirTo }, path: rest, talking: arrived };
      });
    }, 200);
    return () => clearTimeout(t);
  }, [rush]);

  const ROWAN_CHALLENGE = [
    { speaker: 'Rowan', text: 'Hold up — nobody bonds on my turf without a contest. Pebblepup has been working with me all morning.' },
    { speaker: 'Rowan', text: 'Push-up contest. Right here, right now. Show me what you two are made of!' },
  ];

  // The console's own clock. Only ticks while somebody is standing on the deck.
  useEffect(() => {
    if (!cardio) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [cardio]);

  const { dist, moving } = useCardio({
    active: !!cardio,
    onMilestone: (item) => setNote(`Milestone — you picked up ${item.name}.`),
  });

  const stepOn = (code, at, kind) => {
    playSfx('confirm');
    setNote(
      Platform.OS === 'web'
        ? 'A browser cannot count steps on this deck. Use a phone — there are no walk buttons.'
        : null
    );
    setSeconds(0);
    setCardio({
      station: kind,
      from: { ...playerRef.current },
      base: {
        miles: state.stats.distanceMi,
        steps: state.stats.totalSteps,
        sets: state.stats.sets,
        exercises: state.stats.exercises,
        reps: state.stats.reps,
        holdSec: state.stats.holdSec,
      },
    });
    // Walking onto the machine IS the animation: the same tween every other
    // step in this room uses, so the character steps up rather than cutting to
    // a screen where they are already running.
    apply({ x: at.x, y: at.y, facing: 'up' });
  };

  const stepOff = () => {
    playSfx('cancel');
    if (cardio) apply({ ...cardio.from });
    setCardio(null);
    setNote(null);
  };

  const move = (dir) => {
    // On the deck you are on the deck. Getting off is the button, the way it is
    // the bar on a real one. While Maple is showing you her floor, the floor
    // is hers — and when Rowan is marching over, you hold your ground.
    if (cardio || tour || rush) return;
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const code = tileAt(map, nx, ny);

    if (!isWalkable(map, nx, ny)) {
      apply({ x, y, facing: dir });
      // Bumping a station is how you use it, so a blocked tile still has to
      // answer. Anything else in the room is just a wall.
      const station = interactionForCode(code, map);
      setFacingStation(station);
      if (station && station.cardio) {
        stepOn(code, { x: nx, y: ny }, station.cardio);
        return;
      }
      if (station && station.screen) {
        if (code === 'A' && !companion) return;
        playSfx('confirm');
        // Rowan challenges in the room, with his companion — not a lecture
        // screen that fires the fight by itself.
        if (code === 'A') {
          setTimeout(() => toBattle({ ...SPAR_PARAMS }), 140);
          return;
        }
        // Coach is the walking tour until you have a companion — she leads
        // you around her own floor, station by station, then straight into
        // the goal talk where the starter is chosen. After that she is the
        // chat. Re-running the goal screen on a live save would dispatch
        // START_GAME and replace the party, so the guard is the party itself.
        if (code === 'C' && !companion) {
          playSfx('confirm');
          beginStop(0, { x: 10, y: 15 });
          return;
        }
        const target = station.screen;
        setTimeout(() => navigate(target, station.params || {}), 140);
      }
      return;
    }

    apply({ x: nx, y: ny, facing: dir });
    setFacingStation(null);
    const trigger = triggerForCode(code);
    if (trigger) {
      playSfx('confirm');
      setTimeout(() => navigate(trigger), 130);
    }
  };

  const sessionMiles = cardio ? Math.max(0, state.stats.distanceMi - cardio.base.miles) : 0;
  const sessionSteps = cardio ? Math.max(0, state.stats.totalSteps - cardio.base.steps) : 0;
  const breakdown = useMemo(
    () => formatBreakdown(breakdownSince(state.stats.exercises, (cardio ? cardio.base.exercises : state.stats.exercises), (id) => {
      const w = getWorkout(id);
      return w ? w.name : id;
    })),
    [state.stats.exercises, cardio]
  );

  return (
    <WorldScreen
      map={tour ? tourMap : rush ? mapWithout(GYM, ['A']) : map}
      player={player}
      walker={tour ? tour.coach : rush ? { ...rush.at, kind: 'rowan' } : null}
      onMove={move}
      place="Quest Fitness"
      objective={
        tour
          ? 'Coach Maple is showing you her floor'
          : rush
            ? 'Rowan is coming over'
            : cardio
            ? `On the ${cardio.station === 'rower' ? 'rower' : 'deck'} — only real movement counts`
            : facingStation
              ? facingStation.label
              : !companion
                ? 'Walk up to Coach Maple — she is waiting on the floor'
                : !state.meta.sparDone
                  ? 'Rowan wants a challenge — walk up to him'
                  : state.meta.coachIntroDone && !state.meta.homeTourDone
                    ? 'Head home — how you eat, sleep and live counts too'
                    : 'Walk into any equipment to use it'
      }
      menu={cardio || tour || rush ? [] : MENU}
      onSelect={(item) => navigate(item.value)}
      showControl={!cardio && !tour && !rush}
      status={
        tour ? (
          tour.talking ? (
            <DialogueBox key={tour.stop} lines={TOUR_STOPS[tour.stop].lines} onComplete={advanceTour} />
          ) : null
        ) : rush ? (
          rush.talking ? (
            <DialogueBox
              lines={ROWAN_CHALLENGE}
              onComplete={() => { setRush(null); playSfx('confirm'); toBattle({ ...SPAR_PARAMS }); }}
            />
          ) : null
        ) : cardio ? (
          <>
            <KeepAwakeOnDeck />
            <CardioConsole
              station={cardio.station}
              seconds={seconds}
              miles={sessionMiles}
              steps={sessionSteps}
              breakdown={breakdown}
              bodyWeightLb={state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB}
              moving={moving}
              note={note}
              onInject={dist.showInjector ? dist.injectSteps : null}
              onStop={stepOff}
            />
          </>
        ) : (
          <CompanionStatus companion={companion} stats={state.stats} />
        )
      }
    />
  );
}
