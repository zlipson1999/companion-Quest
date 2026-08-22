// Maple Lane. The world fills the phone and scrolls under you; the objective
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
import { HUB, isWalkable, tileAt, triggerForCode } from '../data/maps';

const MENU = [
  { label: 'Route 1', value: 'route', sublabel: 'real miles, encounters' },
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

  const [player, setPlayer] = useState({ x: HUB.spawn.x, y: HUB.spawn.y, facing: 'down' });
  const playerRef = useRef(player);
  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
  };

  const move = (dir) => {
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    if (!isWalkable(HUB, nx, ny)) {
      apply({ x, y, facing: dir });
      return;
    }
    apply({ x: nx, y: ny, facing: dir });
    const trigger = triggerForCode(tileAt(HUB, nx, ny));
    if (trigger) {
      playSfx('confirm');
      setTimeout(() => navigate(trigger), 130);
    }
  };

  const objective = !companion
    ? 'Meet Coach Maple inside Quest Fitness'
    : state.stats.distanceMi < 0.1
      ? 'Head out through the north gate and walk Route 1'
      : 'Train at the gym, or walk Route 1 for more distance';

  return (
    <WorldScreen
      map={HUB}
      player={player}
      onMove={move}
      place="Maple Lane"
      objective={objective}
      status={<CompanionStatus companion={companion} stats={state.stats} />}
      menu={MENU}
      onSelect={(item) => navigate(item.value)}
    />
  );
}
