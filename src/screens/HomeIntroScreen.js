import React, { useRef, useState } from 'react';
import { WorldScreen, CompanionStatus } from '../components';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { BEDROOM, DOWNSTAIRS, isWalkable, interactionForCode } from '../data/maps';
import { playSfx } from '../audio';
import { recallSpot, rememberSpot } from './placeMemory';

// The two rooms come from data/maps.js; the intro brings the route through
// them. The front door used to dump you onto a 9×7 stub "lane" and then a
// Coach lecture screen. The real town is HUB — Sunkist Lane — and the gym
// talk happens when you walk up to Coach inside Quest Fitness.
const AREAS = {
  bedroom: {
    ...BEDROOM,
    name: 'Your Room — Upstairs',
    spawn: { x: 5, y: 8 },
    exit: { x: 9, y: 11 },
    hint: 'Use the stick to walk — that is how you move in every room. Stairs are in the far corner.',
    next: 'downstairs',
  },
  downstairs: {
    ...DOWNSTAIRS,
    name: 'Your Home — Downstairs',
    spawn: { x: 11, y: 2 },
    exit: { x: 6, y: 14 },
    hint: 'The stick walks you through the door onto Sunkist Lane. On the trail later, only real walking counts.',
    next: 'hub',
  },
};

// Just south of the house door on HUB, facing the lane.
const LANE_FROM_HOUSE = { x: 2, y: 6, facing: 'down' };

function persistArea(areaId, spot) {
  rememberSpot('intro:area', areaId);
  rememberSpot(`intro:${areaId}`, spot);
  // Share the house keys so a cookbook opened during the intro returns
  // to the kitchen, not a remounted bedroom.
  const floor = areaId === 'bedroom' ? 'upstairs' : 'downstairs';
  rememberSpot('home:floor', floor);
  rememberSpot(`home:${floor}`, spot);
}

export default function HomeIntroScreen() {
  const { navigate } = useNav();
  const { state } = useGame();
  const companion = useCompanion();
  const [areaId, setAreaId] = useState(() => recallSpot('intro:area', 'bedroom'));
  const area = AREAS[areaId];
  const [player, setPlayer] = useState(() =>
    recallSpot(`intro:${areaId}`, { ...area.spawn, facing: 'down' }, (s) => isWalkable(area, s.x, s.y))
  );
  const [facing, setFacing] = useState(null);
  const playerRef = useRef(player);

  const enter = (next) => {
    playSfx('confirm');
    if (next === 'hub') {
      rememberSpot('hub', LANE_FROM_HOUSE);
      return navigate('hub');
    }
    const nextArea = AREAS[next];
    const spot = { ...nextArea.spawn, facing: 'down' };
    persistArea(next, spot);
    setAreaId(next);
    playerRef.current = spot;
    setPlayer(spot);
  };

  const move = (dir) => {
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const blocked = !isWalkable(area, nx, ny);
    const next = blocked ? { x, y, facing: dir } : { x: nx, y: ny, facing: dir };
    playerRef.current = next;
    setPlayer(next);
    persistArea(areaId, next);

    // Walking into your own furniture uses it, the same way the gym's
    // equipment works. The bed logs last night, the desk opens your habits,
    // the kitchen shelf is the cookbook. Persist first so Back remounts
    // this floor rather than the bedroom default.
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
