// Quest Fitness — the gym interior.
//
// The gym door used to jump straight to the exercise list, so the building the
// whole onboarding walks you toward had no inside. Here the equipment IS the
// menu: walk into a rack, a machine, the treadmill or the mirror and it opens
// the system that piece stands for. That replaces a screen of buttons
// explaining the systems with a room that demonstrates them.

import React, { useRef, useState } from 'react';
import { WorldScreen, CompanionStatus } from '../components';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { GYM, isWalkable, tileAt, triggerForCode, interactionForCode } from '../data/maps';

const MENU = [
  { label: 'Back to Maple Lane', value: 'hub', sublabel: 'the lane outside' },
  { label: 'Talk to Coach', value: 'coach', sublabel: 'ask her anything' },
  { label: 'Route 1', value: 'route', sublabel: 'real miles, encounters' },
  { label: 'Team', value: 'party', sublabel: 'companions' },
  { label: 'Options', value: 'options', sublabel: 'settings' },
];

export default function GymScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  const [player, setPlayer] = useState({ x: GYM.spawn.x, y: GYM.spawn.y, facing: 'up' });
  const [facingStation, setFacingStation] = useState(null);
  const playerRef = useRef(player);

  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
  };

  const move = (dir) => {
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const code = tileAt(GYM, nx, ny);

    if (!isWalkable(GYM, nx, ny)) {
      apply({ x, y, facing: dir });
      // Bumping a station is how you use it, so a blocked tile still has to
      // answer. Anything else in the room is just a wall.
      const station = interactionForCode(code, GYM);
      setFacingStation(station);
      if (station) {
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

  return (
    <WorldScreen
      map={GYM}
      player={player}
      onMove={move}
      place="Quest Fitness"
      objective={facingStation ? facingStation.label : 'Walk into any equipment to use it'}
      menu={MENU}
      onSelect={(item) => navigate(item.value)}
      status={<CompanionStatus companion={companion} stats={state.stats} />}
    />
  );
}
