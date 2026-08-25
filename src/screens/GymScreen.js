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
    { speaker: 'Coach Maple', text: 'Welcome to Quest Fitness. Everything in this room works one way: walk up to a thing and use it. Stay close - I will take you around every station and tell you what each one actually does.' },
    { speaker: 'Coach Maple', text: 'Reception first. Walk into this desk to check in your record — lifetime miles, every session, battles, catches, streaks, credit — and to purchase quests with your Quest Credits. When you want the honest total of who you have been, it is here.' },
  ] },
  { at: { x: 7, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'The cork noticeboard. This is where friends live. Sign in, read your trail code to someone you actually train near, and once you BOTH agree you can see each other.' },
    { speaker: 'Coach Maple', text: 'Four boards: miles this week, days active, sessions done - those wipe clean every Monday so nobody wins on seniority - and personal bests, which stand until someone beats them. Only real, checked days make the board.' },
  ] },
  { at: { x: 11, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'The smoothie bar. The one place in this world money gets spent - and the money is Quest Credits, minted by effort only: ten a mile walked, eight a session, four a habit goal hit. There is no other way to get it. None.' },
    { speaker: 'Coach Maple', text: 'What it buys: blends that heal your companion, deepen the bond, or fuel a session - each one logs as a real meal choice. Water and apples for the trail. And Kinship Knots, about two and a half miles of walking each - you will need those to bond with wild companions.' },
  ] },
  { at: { x: 2, y: 16 }, face: 'down', lines: [
    { speaker: 'Coach Maple', text: 'Lockers - your bag. Everything you buy or find on the trail lives here. Walk in to use an item: an apple heals a little, a blend heals more, a charm deepens bond. Same bag whether you open it here, at home, or mid-battle.' },
  ] },
  { at: { x: 1, y: 2 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'The mirror. Walk into it and your camera becomes a form check: you watch yourself while the movement cues tick past - knees out, back flat, whatever that lift needs. Nothing is recorded or sent anywhere. It is a mirror that talks.' },
  ] },
  { at: { x: 2, y: 4 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'Kettlebells. Swings, carries, get-ups. Walking into ANY iron in this room opens the Forge - the one place you write a session - so pick the piece you mean to use and it is waiting inside.' },
  ] },
  { at: { x: 2, y: 6 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'The dumbbell run. In the Forge you build a plan: pick movements, set your sets and reps, then run it and check off what you really did. Finished sessions pay XP and bond to your companion and eight credit each.' },
  ] },
  { at: { x: 4, y: 5 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'Flat benches. When you log a lift, log the WEIGHT - your best single set per movement becomes your personal record, and records are the one board that never resets. Being beaten there is information, not an insult.' },
  ] },
  { at: { x: 4, y: 8 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'The EZ-bar cradle. Curls and skull-crushers without the wrist ache. Same Forge as everything else - the label changes, the honesty does not.' },
  ] },
  { at: { x: 5, y: 2 }, face: 'up', lines: [
    { speaker: 'Coach Maple', text: 'The power racks - the heart of the Forge. Squats, presses, pulls. Write down what really happened, not what you hoped: the Forge remembers what you train and can tell you what you have been neglecting.' },
  ] },
  { at: { x: 14, y: 2 }, face: 'up', lines: [
    { speaker: 'Coach Maple', text: 'The pull-up bar. Bodyweight is iron too - reps go in the Forge like any lift, and a max set of pull-ups is as proud a record as anything on a bar.' },
  ] },
  { at: { x: 13, y: 1 }, face: 'up', lines: [
    { speaker: 'Coach Maple', text: 'My whiteboard. Walk into it for your week: this week against the same days last week, and an honest verdict sentence. Not the flattering one - the true one.' },
  ] },
  { at: { x: 6, y: 6 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The machines. Guided iron - same Forge, built around what a machine does best. Good for going close to failure without a spotter.' },
  ] },
  { at: { x: 14, y: 4 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The water station. It opens your daily habits: water, food, sleep, stillness, recovery. Log them honestly - each goal you hit pays four credit and real bond, and some wild companions only ever appear to people who live well. I mean that literally.' },
  ] },
  { at: { x: 14, y: 6 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The deck. Step on and the console starts: time, distance, pace, calories from your real body weight. It counts your phone steps - only REAL movement moves the number. There is no button that walks for you, here or anywhere in your life.' },
    { speaker: 'Coach Maple', text: 'Deck miles are real miles - they pay XP and ten credit each - but they do not fill a TRAIL. Trails want you outside; the Wardens can tell the difference.' },
  ] },
  { at: { x: 14, y: 9 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The bikes. This one stays here; you do not. Start a ride, secure your phone, then take your real bicycle outside. GPS measures the miles while your person pedals here with you.' },
    { speaker: 'Coach Maple', text: 'Ride miles pay the same distance XP and Quest Credits as honest cardio, and the Phone keeps them as cycling miles. They never fill a walking trail. Start and stop only while the real bike is parked.' },
  ] },
  { at: { x: 14, y: 11 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The rowers. Same console, same rule: it counts what your body actually does, and stepping off ends the session honestly.' },
  ] },
  { at: { x: 14, y: 12 }, face: 'right', lines: [
    { speaker: 'Coach Maple', text: 'The mat floor. Walk on and a guided circuit runs - dead bugs, push-ups, holds, rest, repeat. You do the reps for real and confirm when they are done. Your word is the equipment here, and your companion grows exactly as much as your word is good.' },
  ] },
  // The tour ENDS on the turf, on purpose: warming up is where a session
  // starts, so it is the last thing she teaches and the first thing you do -
  // and it is where Rowan finds you afterwards.
  { at: { x: 2, y: 13 }, face: 'left', lines: [
    { speaker: 'Coach Maple', text: 'Last stop, and the most important: the turf. Every session STARTS here, with dynamic stretches - leg swings, walking lunges, arm circles, high knees. Movement that warms you, not holds that put you to sleep.' },
    { speaker: 'Coach Maple', text: 'Warm muscles move better and get hurt less. Walk onto the turf before the iron, every time - it runs the warm-up routine and guides you through each stretch.' },
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
    if (!cardio || (cardio.station === 'bike' && !cardio.gpsStarted)) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [cardio]);

  const { dist, moving } = useCardio({
    active: !!cardio,
    gpsOnly: !!(cardio && cardio.station === 'bike'),
    activity: cardio && cardio.station === 'bike' ? 'ride' : 'gym-cardio',
    onMilestone: (item) => setNote(`Milestone — you picked up ${item.name}.`),
  });

  const stepOn = (code, at, kind) => {
    playSfx('confirm');
    setNote(
      kind === 'bike'
        ? 'The in-game bike starts a real outdoor bicycle ride. GPS begins only when you press Start.'
        : Platform.OS === 'web'
        ? 'A browser cannot count steps on this deck. Use a phone — there are no walk buttons.'
        : null
    );
    setSeconds(0);
    setCardio({
      station: kind,
      gpsStarted: false,
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

  const startBikeRide = async () => {
    if (!cardio || cardio.station !== 'bike' || cardio.gpsStarted) return;
    setNote('Requesting GPS — stay parked until the ride says LIVE.');
    const ok = await dist.startRun();
    if (!ok) return;
    setSeconds(0);
    setCardio((cur) => (cur ? { ...cur, gpsStarted: true } : cur));
    setNote('GPS is live. Secure the phone and ride — the character pedals only when real distance arrives.');
  };

  const stepOff = () => {
    playSfx('cancel');
    if (cardio) {
      const miles = Math.max(0, state.stats.distanceMi - cardio.base.miles);
      if (cardio.station === 'bike') {
        if (dist.running) dist.stopRun();
        dispatch({ type: 'COMPLETE_CARDIO', payload: { station: 'bike', miles, seconds } });
      }
      apply({ ...cardio.from });
    }
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
        // The morning after the home lesson she is not the chat yet: she
        // called you back for your first guided session, so walking up to
        // her IS that session until it is in the book.
        if (code === 'C' && state.meta.homeTourDone && !state.meta.mapleSessionDone) {
          setTimeout(() => navigate('mapleSession'), 140);
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
            ? cardio.station === 'bike'
              ? (cardio.gpsStarted ? 'Outdoor ride live — GPS movement turns the pedals' : 'Bike ready — start GPS while your real bicycle is parked')
              : `On the ${cardio.station === 'rower' ? 'rower' : 'deck'} — only real movement counts`
            : facingStation
              ? facingStation.label
              : !companion
                ? 'Walk up to Coach Maple — she is waiting on the floor'
                : !state.meta.sparDone
                  ? 'Rowan wants a challenge — walk up to him'
                  : state.meta.coachIntroDone && !state.meta.homeTourDone
                    ? 'Head home — how you eat, sleep and live counts too'
                    : state.meta.homeTourDone && !state.meta.mapleSessionDone
                      ? 'Maple called you in — walk up to her for your first guided session'
                      : 'Walk into any equipment to use it'
      }
      menu={cardio || tour || rush ? [] : MENU}
      onSelect={(item) => navigate(item.value)}
      showControl={!cardio && !tour && !rush}
      dialogue={
        tour && tour.talking ? (
          <DialogueBox key={tour.stop} lines={TOUR_STOPS[tour.stop].lines} onComplete={advanceTour} />
        ) : rush && rush.talking ? (
          <DialogueBox
            lines={ROWAN_CHALLENGE}
            onComplete={() => { setRush(null); playSfx('confirm'); toBattle({ ...SPAR_PARAMS }); }}
          />
        ) : null
      }
      playerActivity={cardio ? {
        type: cardio.station,
        active: cardio.station === 'bike' ? !!(cardio.gpsStarted && moving) : !!moving,
      } : null}
      status={
        tour || rush ? (
          <CompanionStatus companion={companion} stats={state.stats} />
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
              gpsActive={!!(cardio.gpsStarted && dist.running)}
              gpsError={cardio.station === 'bike' ? dist.gpsError : null}
              note={note}
              onStartGps={cardio.station === 'bike' ? startBikeRide : null}
              onInject={cardio.station !== 'bike' && dist.showInjector ? dist.injectSteps : null}
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
