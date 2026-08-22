// Quest Fitness — the gym interior.
//
// The gym door used to jump straight to the exercise list, so the building the
// whole onboarding walks you toward had no inside. Here the equipment IS the
// menu: walk into a rack, a machine, the treadmill or the mirror and it opens
// the system that piece stands for. That replaces a screen of buttons
// explaining the systems with a room that demonstrates them.

import React, { useEffect, useRef, useState } from 'react';
import { WorldScreen, CompanionStatus, CardioConsole } from '../components';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { GYM, mapWithout, isWalkable, tileAt, triggerForCode, interactionForCode } from '../data/maps';
import { recallSpot, rememberSpot } from './placeMemory';
import { useKeepAwake } from 'expo-keep-awake';
import useCardio from './useCardio';
import { DEFAULT_BODY_WEIGHT_LB } from '../state/cardioMaths';

// Scoped to the session by being a component: expo's hook cannot be called
// conditionally, and a phone that sleeps halfway through a run on the deck is
// a phone that stops counting.
function KeepAwakeOnDeck() {
  useKeepAwake();
  return null;
}

const MENU = [
  { label: 'Back to Maple Lane', value: 'hub', sublabel: 'the lane outside' },
  { label: 'Talk to Coach', value: 'coach', sublabel: 'ask her anything' },
  { label: 'Route 1', value: 'route', sublabel: 'real miles, encounters' },
  { label: 'Team', value: 'party', sublabel: 'companions' },
  { label: 'Options', value: 'options', sublabel: 'settings' },
];

export default function GymScreen() {
  const { state } = useGame();
  // Rowan is here for the push-up contest and then he has done his session and
  // gone. Coach stays — she keeps the place.
  const map = state.meta.sparDone ? mapWithout(GYM, ['A']) : GYM;
  const companion = useCompanion();
  const { navigate } = useNav();

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

  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
    rememberSpot('gym', np);
  };

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
    setNote(null);
    setSeconds(0);
    setCardio({
      station: kind,
      from: { ...playerRef.current },
      base: {
        miles: state.stats.distanceMi,
        steps: state.stats.totalSteps,
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
    // the bar on a real one.
    if (cardio) return;
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
        playSfx('confirm');
        // Coach is the goal conversation until you have a companion, and the
        // chat after that. Re-running the goal screen on a live save would
        // dispatch START_GAME and replace the party.
        const target = code === 'C' && !companion ? 'goal' : station.screen;
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
  const sessionReps = cardio ? Math.max(0, state.stats.reps - cardio.base.reps) : 0;
  const sessionHold = cardio ? Math.max(0, state.stats.holdSec - cardio.base.holdSec) : 0;

  return (
    <WorldScreen
      map={map}
      player={player}
      onMove={move}
      place="Quest Fitness"
      objective={
        cardio
          ? `On the ${cardio.station === 'rower' ? 'rower' : 'deck'} — only real movement counts`
          : facingStation
            ? facingStation.label
            : 'Walk into any equipment to use it'
      }
      menu={cardio ? [] : MENU}
      onSelect={(item) => navigate(item.value)}
      showControl={!cardio}
      status={
        cardio ? (
          <>
            <KeepAwakeOnDeck />
            <CardioConsole
              station={cardio.station}
              seconds={seconds}
              miles={sessionMiles}
              steps={sessionSteps}
              reps={sessionReps}
              holdSec={sessionHold}
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
