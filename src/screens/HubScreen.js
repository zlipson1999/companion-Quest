// Sunkist Lane. The world fills the phone and scrolls under you; the objective
// ribbon, the menu button and the stick sit on top of it.
//
// This used to be a map in the top half with fourteen destinations listed
// underneath, which made the gym decoration — everything the room
// stands for was one tap away down there. What is left in the menu is places
// you go and the two lines that are not places at all.

import React, { useRef, useState } from 'react';
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

export default function HubScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  const [player, setPlayer] = useState(() =>
    recallSpot('hub', { x: HUB.spawn.x, y: HUB.spawn.y, facing: 'down' }, (s) => isWalkable(HUB, s.x, s.y))
  );
  const [facingThing, setFacingThing] = useState(null);
  const playerRef = useRef(player);
  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
    rememberSpot('hub', np);
  };

  const move = (dir) => {
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

  const objective = facingThing ? facingThing.label : !companion
    ? 'Walk with the stick. Meet Coach Maple inside Quest Fitness'
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
      menu={MENU}
      onSelect={(item) => navigate(item.value)}
    />
  );
}
