import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WorldScreen, CompanionStatus } from '../components';
import { palette, screen, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { BEDROOM, DOWNSTAIRS, isWalkable, interactionForCode } from '../data/maps';
import { playSfx } from '../audio';

// The two rooms come from data/maps.js; the intro brings the route through
// them. They used to be declared here as well as in HomeRestScreen, and the
// copies had drifted — different grids for the same room.
const AREAS = {
  bedroom: {
    ...BEDROOM,
    name: 'Your Room — Upstairs',
    spawn: { x: 5, y: 8 },
    exit: { x: 9, y: 11 },
    hint: 'Your room. The stairs are in the far corner.',
    next: 'downstairs',
  },
  downstairs: {
    ...DOWNSTAIRS,
    name: 'Your Home — Downstairs',
    spawn: { x: 11, y: 2 },
    exit: { x: 6, y: 14 },
    hint: 'Head through your front door.',
    next: 'outside',
  },
  outside: {
    name: 'Maple Lane', cols: 9, rows: 7, spawn: { x: 2, y: 5 }, exit: { x: 6, y: 2 },
    grid: ['TTTTTTTTT', 'ThhhTyyyT', 'THDHTYdYT', 'T.####..T', 'T.#..#..T', 'T.####..T', 'TTTTTTTTT'],
    hint: 'Quest Fitness is next door. Find its entrance.', next: 'coachTutorial',
  },
};

export default function HomeIntroScreen() {
  const { navigate } = useNav();
  const { state } = useGame();
  const companion = useCompanion();
  const [areaId, setAreaId] = useState('bedroom');
  const area = AREAS[areaId];
  const [player, setPlayer] = useState({ ...area.spawn, facing: 'down' });
  const [facing, setFacing] = useState(null);
  const playerRef = useRef(player);

  const enter = (next) => {
    playSfx('confirm');
    if (next === 'coachTutorial') return navigate(next);
    const nextArea = AREAS[next];
    setAreaId(next);
    playerRef.current = { ...nextArea.spawn, facing: 'down' };
    setPlayer(playerRef.current);
  };

  const move = (dir) => {
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const blocked = !isWalkable(area, nx, ny);
    const next = blocked ? { x, y, facing: dir } : { x: nx, y: ny, facing: dir };
    playerRef.current = next;
    setPlayer(next);

    // Walking into your own furniture uses it, the same way the gym's
    // equipment works. The bed logs last night, the desk opens your habits,
    // the kitchen shelf is the cookbook.
    if (blocked) {
      const station = interactionForCode(area.grid[ny] && area.grid[ny][nx], area);
      setFacing(station);
      if (station && station.screen) {
        playSfx('confirm');
        setTimeout(() => navigate(station.screen, station.params || {}), 140);
      }
      return;
    }
    setFacing(null);
    if (next.x === area.exit.x && next.y === area.exit.y) setTimeout(() => enter(area.next), 120);
  };

  return (
    <WorldScreen
      map={area}
      player={player}
      onMove={move}
      place={area.name}
      objective={facing ? facing.label : area.hint}
      status={<CompanionStatus companion={companion} stats={state.stats} />}
    />
  );
}
