// Quest Fitness — the gym interior.
//
// The gym door used to jump straight to the exercise list, so the building the
// whole onboarding walks you toward had no inside. Here the equipment IS the
// menu: walk into a rack, a machine, the treadmill or the mirror and it opens
// the system that piece stands for. That replaces a screen of buttons
// explaining the systems with a room that demonstrates them.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { WorldScreen, CompanionStatus, CardioConsole, CardioSummary, DialogueBox } from '../components';
import { useGame, useCompanion } from '../state';
import {
  newSession, tickSession, pauseSession, resumeSession, backgroundSession, tapSession,
  setManual, sessionMetrics, sessionKcal, completeSession,
} from '../state/cardioSession';
import { getCardioMachine } from '../data/cardioMachines';
import { cardioCredits } from '../state/economy';
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
  { at: { x: 6, y: 16 }, face: 'down', covers: ['N', 'C', 'A', 'X'], lines: [
    { speaker: 'Coach Maple', text: 'Welcome to Quest Fitness. Walk into equipment to use it and walk up to a person to talk. After the tour, come back to me for coaching; Rowan will explain his challenge when you approach him.' },
    { speaker: 'Coach Maple', text: 'Reception first. Walk into this desk when you arrive and it records today’s date and your first check-in time — attendance only, once a day, no reward attached. Your check-in streak, total days and visit history live in the Phone’s Personal section.' },
    { speaker: 'Coach Maple', text: 'The desk also holds the Quest Ledger: optional healthy-habit quests bought with Quest Credits — five to fifteen, priced by effort and reward, three at a time at most. Live one out for real, watch its progress in the Phone’s Quest Log, then walk back to this desk to turn it in for its Token and reward.' },
    { speaker: 'Coach Maple', text: 'Tokens are proof of completion and are not currency. They cannot be spent or sold — the case on your Phone is where they live, and the habit itself is the real prize.' },
    { speaker: 'Coach Maple', text: 'The front door behind you works the same way as every doorway: walk through it to return to Sunkist Lane. It never logs a check-in by itself—you must come to this desk.' },
  ] },
  { at: { x: 7, y: 16 }, face: 'down', covers: ['r'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into the cork noticeboard to open its five tabs. Sign in, share your trail code with someone you actually train near, and once you BOTH accept, their checked results can appear beside yours.' },
    { speaker: 'Coach Maple', text: 'Miles, Bike, Days and Sessions show this week and reset every Monday; Bests keeps each person’s strongest set until it is beaten. The local card still works signed out, and only accepted friends appear.' },
  ] },
  { at: { x: 11, y: 16 }, face: 'down', covers: ['J', 'I'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into any part of the smoothie counter to open the shelves. Pick an item, read its exact Quest Credits price and effect, then buy it; if your balance is short, nothing is taken. Purchases go straight into your bag.' },
    { speaker: 'Coach Maple', text: 'Blends heal, deepen bond or fuel a session and log the meal choice they really represent. Water and apples are trail supplies; Kinship Knots let you bond with wild companions. The bar spends Quest Credits—it does not track mileage.' },
  ] },
  { at: { x: 2, y: 16 }, face: 'down', covers: ['L'], lines: [
    { speaker: 'Coach Maple', text: 'Lockers - your bag. Everything you buy or find on the trail lives here. Walk in to use an item: an apple heals a little, a blend heals more, a charm deepens bond. Same bag whether you open it here, at home, or mid-battle.' },
  ] },
  { at: { x: 1, y: 2 }, face: 'left', covers: ['M'], lines: [
    { speaker: 'Coach Maple', text: 'The mirror. Walk into it and your camera becomes a form check: you watch yourself while the movement cues tick past - knees out, back flat, whatever that lift needs. Nothing is recorded or sent anywhere. It is a mirror that talks.' },
  ] },
  { at: { x: 2, y: 4 }, face: 'left', covers: ['j'], lines: [
    { speaker: 'Coach Maple', text: 'Kettlebells. Swings, carries, get-ups. Walking into ANY iron in this room opens the Forge - the one place you write a session - so pick the piece you mean to use and it is waiting inside.' },
  ] },
  { at: { x: 2, y: 6 }, face: 'left', covers: ['b'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into the dumbbell run to open the Forge. Build a plan, pick movements, set your sets, reps and weight, then run it and check off what you really did. Finishing saves the work and pays the normal session rewards.' },
  ] },
  { at: { x: 4, y: 5 }, face: 'left', covers: ['B'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into a flat bench to open the Forge with bench work in mind. Build or run the plan, record the weight and completed reps, and your strongest single set becomes that movement’s personal record. Records do not reset.' },
  ] },
  { at: { x: 4, y: 8 }, face: 'left', covers: ['z'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into the EZ-bar cradle to open the same Forge for curls, skull-crushers or your own plan. Choose the movement, enter the sets, reps and weight you actually complete, then finish the session to save it.' },
  ] },
  { at: { x: 5, y: 2 }, face: 'up', covers: ['R'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into any power rack to open the Forge for squats, presses, pulls or a custom plan. Enter what you really complete; finishing saves the sets, reps and weight so the Phone and Coach can show what you train or neglect.' },
  ] },
  { at: { x: 14, y: 2 }, face: 'up', covers: ['U'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into the pull-up bar to open the Forge, choose pull-ups or another bodyweight movement, and log each set you actually finish. Your strongest set becomes a personal record just like a weighted lift.' },
  ] },
  { at: { x: 13, y: 1 }, face: 'up', covers: ['Z'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into my whiteboard to open your Week view. It shows this week against the same days last week—distance, Bike Rides, sessions and work—then gives you an honest verdict sentence, not merely a flattering one.' },
  ] },
  { at: { x: 6, y: 6 }, face: 'right', covers: ['K'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into any guided machine to open the Forge. Choose the movement that matches the machine, enter the real sets, reps and weight, and finish to save it. These are useful when you want to work hard without a spotter.' },
  ] },
  { at: { x: 14, y: 4 }, face: 'right', covers: ['w'], lines: [
    { speaker: 'Coach Maple', text: 'Walk into the water station to open Daily Habits. Choose water, food, sleep, stillness or recovery, then log only what happened; each module shows today’s count and goal, and a completed goal pays its reward once.' },
  ] },
  // ONE stop for the whole cardio wall. Five machines each getting their own
  // stop turned the middle of the tour into a stationary lecture; the wall is
  // one place, so Maple stands in the middle of it and explains the rules
  // that apply to all five, then what each one measures. The coverage test
  // accepts a grouped stop for every machine it names.
  { at: { x: 14, y: 8 }, face: 'right', covers: ['t', 'c', 'q', 'x', 'm'], lines: [
    { speaker: 'Coach Maple', text: 'The cardio wall — five machines, one rule. Walk into any of them to get on, and the console opens over the room so you can still see yourself working. Your person moves while you move and stops when you stop.' },
    { speaker: 'Coach Maple', text: 'The treadmill tracks real walking or running from your phone steps. The bikes connect a real bicycle to that in-game one: start parked, secure the phone, and GPS measures the ride while your person pedals here.' },
    { speaker: 'Coach Maple', text: 'The rower tracks your time, plus strokes you log and the distance the machine itself shows. The stair climber tracks time and real steps, plus floors and level. The elliptical tracks time and strides, plus its own distance and resistance.' },
    { speaker: 'Coach Maple', text: 'Anything your phone cannot feel — strokes, floors, machine distance — you enter by hand AFTER you finish, off the machine, reading its display. Never type while something is moving under you.' },
    { speaker: 'Coach Maple', text: 'All five pay Quest Credits the same way: by detected active time, at one shared rate, five minutes minimum. Stop moving, pause the console or background the app and the paid clock stops. Every session lands in your Phone cardio history and can push an accepted gym or cardio quest toward its Stride Token.' },
    { speaker: 'Coach Maple', text: 'And none of it touches a trail. No trail quota, no milestone, no encounter, no Warden, no pin, no charm, no trail Token — not even the bike, GPS or not. Trail work starts when you choose a trail outside. That is the line, and it does not move.' },
  ] },
  { at: { x: 14, y: 12 }, face: 'right', covers: ['Q'], lines: [
    { speaker: 'Coach Maple', text: 'The mat floor. Walk on and a guided circuit runs - dead bugs, push-ups, holds, rest, repeat. You do the reps for real and confirm when they are done. Your word is the equipment here, and your companion grows exactly as much as your word is good.' },
  ] },
  // The tour ENDS on the turf, on purpose: warming up is where a session
  // starts, so it is the last thing she teaches and the first thing you do -
  // and it is where Rowan finds you afterwards.
  { at: { x: 2, y: 13 }, face: 'left', covers: ['S'], lines: [
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
  // The finished-but-unsaved session: the summary is showing, nothing has
  // been written yet, and Save/Discard decide which.
  const [done, setDone] = useState(null);
  // Where the player was standing before they got on, so finishing puts them
  // back beside the machine rather than teleporting them to the door.
  const [from, setFrom] = useState(null);
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

  // Leaving the app mid-session pauses it. The phone keeps counting steps with
  // the screen off, but it cannot tell whether you are still on the machine,
  // so banking paid active time through a backgrounded app would be the one
  // thing this game does not do: pay for movement nobody verified.
  useEffect(() => {
    if (!cardio) return undefined;
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') setCardio((cur) => backgroundSession(cur));
    });
    return () => sub.remove();
  }, [!!cardio]);

  const machine = cardio ? getCardioMachine(cardio.machineId) : null;
  const { dist, moving, paying } = useCardio({
    // The sensor only feeds machines that can honestly use it, and only while
    // the session is actually running: a paused console counts nothing.
    active: !!(cardio && cardio.phase === 'running' && machine && machine.tracking !== 'timer'),
    gpsOnly: !!(machine && machine.tracking === 'gps'),
    activity: machine && machine.tracking === 'gps' ? 'ride' : 'gym-cardio',
  });

  // A rower has no sensor to pulse, so its animation comes from the strokes
  // the player logs; everything else animates on real measured movement.
  const [tapPulse, setTapPulse] = useState(false);
  const tapTimer = useRef(null);
  const pulseTap = () => {
    setTapPulse(true);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    // A normal rowing cadence leaves a few seconds between strokes. Keep the
    // movement lease long enough to bridge that gap, then stop paid time and
    // animation automatically when no further stroke is logged.
    tapTimer.current = setTimeout(() => setTapPulse(false), 5000);
  };
  useEffect(() => () => tapTimer.current && clearTimeout(tapTimer.current), []);
  const machineMoving = machine && machine.tracking === 'timer' ? tapPulse : moving;
  // Animation follows `moving` (tight, so the character stops when you do).
  // Payment follows `paying`, a longer lease that bridges the sensor's own
  // reporting gaps — see useCardio for why the two are different numbers.
  // The rower's stroke lease already spans a rowing cadence, so it serves
  // both.
  const machinePaying = machine && machine.tracking === 'timer' ? tapPulse : paying;
  const sessionLive = !!(cardio && cardio.phase === 'running' && machineMoving);
  const sessionPaying = !!(cardio && cardio.phase === 'running' && machinePaying);
  const movementRef = useRef(false);
  movementRef.current = sessionPaying;

  // A running phase is permission to track, not proof of work. Only a live
  // sensor/GPS delta or a recent rowing stroke banks an ACTIVE second.
  // Stationary time remains visible as INACTIVE and earns nothing.
  useEffect(() => {
    if (!cardio) return undefined;
    const t = setInterval(() => {
      setCardio((s) => tickSession(s, movementRef.current));
    }, 1000);
    return () => clearInterval(t);
  }, [!!cardio]);

  const metrics = cardio ? sessionMetrics(cardio, state.stats) : { miles: 0, steps: 0 };
  const bodyWeight = state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB;
  const liveKcal = cardio ? sessionKcal(cardio, metrics, bodyWeight) : 0;
  const liveCredits = cardio ? cardioCredits(cardio.activeSeconds) : 0;

  const stepOn = (code, at, kind) => {
    const m = getCardioMachine(kind);
    if (!m) return;
    playSfx('confirm');
    setNote(
      m.tracking === 'gps'
        ? 'The in-game bike starts a Bike Ride. GPS begins only when you press Start.'
        : m.tracking === 'timer'
        ? 'Log strokes as you pull. The paid clock runs only while strokes are detected; enter the machine total after.'
        : Platform.OS === 'web'
        ? 'A browser cannot count steps on this machine. Use a phone — there are no walk buttons.'
        : null
    );
    setCardio(newSession(kind, {
      miles: state.stats.distanceMi,
      steps: state.stats.totalSteps,
      sets: state.stats.sets,
      exercises: state.stats.exercises,
      reps: state.stats.reps,
      holdSec: state.stats.holdSec,
    }));
    // Where they were standing, captured BEFORE the step onto the machine:
    // apply() moves playerRef synchronously, so reading it afterwards would
    // record the equipment tile itself — a tile nobody can stand on — and
    // rememberSpot would persist that as their place in the room.
    setFrom({ ...playerRef.current });
    // Walking onto the machine IS the animation: the same tween every other
    // step in this room uses, so the character steps up rather than cutting to
    // a screen where they are already running.
    apply({ x: at.x, y: at.y, facing: m.pose.facing === 'left' ? 'left' : 'up' });
  };


  const startBikeRide = async () => {
    if (!cardio || !machine || machine.tracking !== 'gps' || cardio.gpsStarted) return;
    setNote('Requesting GPS — stay parked until the ride says LIVE.');
    const ok = await dist.startRun();
    if (!ok) {
      // Permission denied or no GPS: the session stays honest and stays
      // 'ready', banking paused seconds that will never be paid.
      setNote('GPS is unavailable, so a Bike Ride cannot be measured. Nothing has been recorded.');
      return;
    }
    setCardio((cur) => (cur ? { ...cur, gpsStarted: true, phase: 'running', activeSeconds: 0 } : cur));
    setNote('GPS is live. Secure the phone and ride — the character pedals only when real distance arrives.');
  };

  const togglePause = () => {
    playSfx('cursor');
    setCardio((cur) => (cur && cur.phase === 'paused' ? resumeSession(cur) : pauseSession(cur)));
  };

  const logStroke = () => {
    playSfx('cursor');
    pulseTap();
    setCardio((cur) => tapSession(cur));
  };

  // Finish: stop the sensors, hold the completed session in `done`, and show
  // the summary. NOTHING is written yet — Save writes it, Discard drops it.
  const finishSession = () => {
    if (!cardio) return;
    // A machine that never started measured nothing; leave rather than
    // offering a summary of zeros.
    if (cardio.activeSeconds < 5) { abandonUnstarted(); return; }
    playSfx('confirm');
    if (machine && machine.tracking === 'gps' && dist.running) dist.stopRun();
    setDone({ ...cardio, phase: 'summary', endedAt: new Date().toISOString(), metrics });
    setCardio(null);
    setNote(null);
  };

  const leaveMachine = () => {
    if (from) apply({ ...from });
    setFrom(null);
    setDone(null);
    setCardio(null);
    setNote(null);
  };

  // Stepping off a bike that never started (GPS refused, or the player
  // changed their mind before pressing Start) records nothing, because
  // nothing was measured. There is no discard button once a session is
  // running: finishing always offers the summary, and saving is the only
  // way off it.
  const abandonUnstarted = () => {
    playSfx('cancel');
    if (machine && machine.tracking === 'gps' && dist.running) dist.stopRun();
    leaveMachine();
  };

  // Save exactly once. The record was built by the shared pipeline, and the
  // reducer refuses an id it already holds — so a double tap, a re-render or
  // a reload cannot write a second row or pay a second time.
  const saveSession = () => {
    if (!done) return;
    const record = completeSession(done, {
      stats: state.stats,
      bodyWeightLb: bodyWeight,
      endedAt: done.endedAt,
    });
    if (record) {
      dispatch({ type: 'COMPLETE_CARDIO', payload: record });
      playSfx(record.creditsAwarded > 0 ? 'victory' : 'confirm');
    }
    leaveMachine();
  };

  const move = (dir) => {
    // On the deck you are on the deck. Getting off is the button, the way it is
    // the bar on a real one. While Maple is showing you her floor, the floor
    // is hers — and when Rowan is marching over, you hold your ground.
    if (cardio || done || tour || rush) return;
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

  const sessionMiles = metrics.miles;
  const sessionSteps = metrics.steps;
  const breakdown = useMemo(
    () => formatBreakdown(breakdownSince(state.stats.exercises, ((cardio && cardio.base.exercises) || state.stats.exercises), (id) => {
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
            ? cardio.phase === 'paused'
              ? `${machine.name} paused — paused time earns nothing`
              : machine.tracking === 'gps'
                ? (cardio.gpsStarted ? 'Bike Ride live — GPS movement turns the pedals' : 'Bike ready — start GPS while your real bicycle is parked')
                : machine.tracking === 'timer'
                  ? `On the ${machine.name} — the clock is the workout`
                  : `On the ${machine.name} — only real movement counts`
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
      menu={cardio || done || tour || rush ? [] : MENU}
      onSelect={(item) => navigate(item.value)}
      showControl={!cardio && !done && !tour && !rush}
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
        type: cardio.machineId,
        // Real measured movement is the ONLY thing that animates the
        // character: GPS deltas for the bike, sensor steps for the deck,
        // climber and elliptical, logged strokes for the rower. A paused
        // console never animates, and an open console alone never does.
        active: machine.tracking === 'gps'
          ? !!(cardio.gpsStarted && cardio.phase === 'running' && moving)
          : sessionLive,
      } : done ? { type: done.machineId, active: false } : null}
      worldOverlay={cardio ? (
        <>
          <KeepAwakeOnDeck />
          <CardioConsole
            compact
            station={cardio.machineId}
            phase={cardio.phase}
            seconds={cardio.activeSeconds}
            miles={sessionMiles}
            steps={sessionSteps}
            kcal={liveKcal}
            credits={liveCredits}
            manual={cardio.manual}
            taps={cardio.taps}
            breakdown={breakdown}
            bodyWeightLb={bodyWeight}
            moving={machineMoving}
            gpsActive={!!(cardio.gpsStarted && dist.running)}
            gpsError={machine.tracking === 'gps' ? dist.gpsError : null}
            note={note}
            onStartGps={machine.tracking === 'gps' ? startBikeRide : null}
            onTap={machine.tapMetric ? logStroke : null}
            onPause={togglePause}
            onResume={togglePause}
            onInject={machine.tracking === 'steps' && dist.showInjector ? dist.injectSteps : null}
            onStop={cardio.phase === 'ready' ? abandonUnstarted : finishSession}
          />
        </>
      ) : done ? (
        <CardioSummary
          station={done.machineId}
          activeSeconds={done.activeSeconds}
          inactiveSeconds={done.inactiveSeconds || 0}
          pausedSeconds={done.pausedSeconds}
          miles={done.metrics.miles}
          steps={done.metrics.steps}
          taps={done.taps}
          kcal={sessionKcal(done, done.metrics, bodyWeight)}
          credits={cardioCredits(done.activeSeconds)}
          manual={done.manual}
          onManual={(key, value) => setDone((cur) => setManual(cur, key, value))}
          onSave={saveSession}
        />
      ) : null}
      status={
        tour || rush ? (
          <CompanionStatus companion={companion} stats={state.stats} />
        ) : cardio ? null : (
          <CompanionStatus companion={companion} stats={state.stats} />
        )
      }
    />
  );
}
