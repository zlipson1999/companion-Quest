// Sunkist Lane. The world fills the phone and scrolls under you; the objective
// ribbon, the menu button and the stick sit on top of it.
//
// This used to be a map in the top half with fourteen destinations listed
// underneath, which made the gym decoration — everything the room
// stands for was one tap away down there. What is left in the menu is places
// you go and the two lines that are not places at all.

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WorldScreen, CompanionStatus } from '../components';
import { palette, space, tokens } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { HUB, isWalkable, tileAt, triggerForCode, interactionForCode } from '../data/maps';
import { recallSpot, rememberSpot } from './placeMemory';

const MENU = [
  { label: 'Trails', value: 'world', sublabel: 'regions, pins, Wardens' },
  { label: 'Quest Fitness', value: 'gym', sublabel: 'train, cardio, coach' },
  { label: 'Go Home', value: 'rest', sublabel: 'sleep upstairs' },
  { label: 'Team', value: 'party', sublabel: 'companions' },
  { label: 'Options', value: 'options', sublabel: 'settings' },
  { label: 'Title', value: 'title', sublabel: 'main menu' },
];

export const TRAIL_ARRIVAL_STEPS = [
  { x: 6, y: 0, facing: 'down' },
  { x: 6, y: 1, facing: 'down' },
  { x: 6, y: 2, facing: 'down' },
  { x: 6, y: 3, facing: 'down' },
];
export const TRAIL_ARRIVAL_STEP_MS = 180;

export default function HubScreen({ params = {} }) {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  const arrivingFromTrail = params.entry === 'trail';
  const [player, setPlayer] = useState(() => arrivingFromTrail
    ? TRAIL_ARRIVAL_STEPS[0]
    : recallSpot('hub', { x: HUB.spawn.x, y: HUB.spawn.y, facing: 'down' }, (s) => isWalkable(HUB, s.x, s.y))
  );
  const [arrivalLocked, setArrivalLocked] = useState(arrivingFromTrail);
  const [facingThing, setFacingThing] = useState(null);
  const playerRef = useRef(player);
  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
    rememberSpot('hub', np);
  };

  useEffect(() => {
    if (!arrivingFromTrail) return undefined;
    const timers = TRAIL_ARRIVAL_STEPS.slice(1).map((step, index) => setTimeout(() => {
      playerRef.current = step;
      setPlayer(step);
      rememberSpot('hub', step);
      if (index === TRAIL_ARRIVAL_STEPS.length - 2) setArrivalLocked(false);
    }, TRAIL_ARRIVAL_STEP_MS * (index + 1)));
    return () => timers.forEach(clearTimeout);
  }, [arrivingFromTrail]);

  const move = (dir) => {
    if (arrivalLocked) return;
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    if (!isWalkable(HUB, nx, ny)) {
      apply({ x, y, facing: dir });
      // The lane has things on it now, and the same rule applies outdoors as
      // in: what you walk into is what you use. Some of them only have
      // something to SAY — a signpost that opened a menu would be a menu — so
      // the label goes to the ribbon and nothing is navigated.
      const thing = interactionForCode(tileAt(HUB, nx, ny), HUB);
      setFacingThing(thing);
      if (thing && thing.screen) {
        playSfx('confirm');
        setTimeout(() => navigate(thing.screen, thing.params || {}), 140);
      }
      return;
    }
    apply({ x: nx, y: ny, facing: dir });
    setFacingThing(null);
    const trigger = triggerForCode(tileAt(HUB, nx, ny));
    if (trigger) {
      playSfx('confirm');
      setTimeout(() => navigate(trigger), 130);
    }
  };

  const objective = arrivalLocked ? 'Leaving the trail — partial progress saved'
    : facingThing ? facingThing.label : !companion
    ? 'Walk with the stick. Meet Coach Maple inside Quest Fitness'
    : state.meta.homeTourDone && !state.meta.mapleSessionDone
      ? 'Maple called — she is waiting at Quest Fitness with your first session'
      : state.stats.distanceMi < 0.1
        ? 'The stick is for the lane. Through the north gate, only real walking moves you'
        : 'Train at the gym, or walk a trail for more distance';

  return (
    <WorldScreen
      map={HUB}
      player={player}
      onMove={move}
      place="Sunkist Lane"
      objective={objective}
      status={<CompanionStatus companion={companion} stats={state.stats} />}
      menu={arrivalLocked ? [] : MENU}
      showControl={!arrivalLocked}
      onSelect={(item) => navigate(item.value)}
    />
  );
}
