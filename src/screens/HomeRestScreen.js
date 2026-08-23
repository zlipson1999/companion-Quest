import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, WorldScreen, DialogueBox, CompanionStatus } from '../components';
import { palette, screen, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { BEDROOM, DOWNSTAIRS, isWalkable, interactionForCode } from '../data/maps';
import { forgetSpot, recallSpot, rememberSpot } from './placeMemory';
import { playSfx } from '../audio';

// The rooms themselves live in data/maps.js — they were declared here AND in
// HomeIntroScreen, and the two copies had already drifted. This screen brings
// only what is its own: where you come in, and what you are here to do.
const FLOORS = {
  downstairs: {
    ...DOWNSTAIRS,
    name: 'Home — Downstairs',
    // Not (6,13): that is directly under the sofa, so the first step into the
    // room sat you down on it instead of walking.
    spawn: { x: 7, y: 13 },
    stairs: { x: 11, y: 1 },
    hint: 'Sleep is upstairs. Walk to the stairs.',
  },
  upstairs: {
    ...BEDROOM,
    name: 'Home — Bedroom',
    spawn: { x: 9, y: 10 },
    bed: { x: 1, y: 2 },
    hint: 'Walk to your bed and sleep.',
  },
};

export default function HomeRestScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  // Which floor you were on is part of where you were standing: opening your
  // habits from the bedroom desk and coming back downstairs is the same bug as
  // coming back to the gym door.
  const [floorId, setFloorId] = useState(() => recallSpot('home:floor', 'downstairs'));
  const [sleeping, setSleeping] = useState(false);
  const floor = FLOORS[floorId];
  const [player, setPlayer] = useState(() =>
    recallSpot(`home:${floorId}`, { ...floor.spawn, facing: 'up' }, (s) => isWalkable(floor, s.x, s.y))
  );
  const [facing, setFacing] = useState(null);
  const playerRef = useRef(player);
  const lines = useMemo(() => [
    { speaker: 'Home', text: 'The lights soften. The day can end here.' },
    { speaker: companion.creature.name, text: 'We did enough for today. Let’s sleep, then meet tomorrow together.' },
    { speaker: 'Home', text: `${companion.creature.name}'s Resolve is fully restored.` },
  ], [companion.creature.name]);

  const changeFloor = () => {
    playSfx('confirm');
    setFloorId('upstairs');
    rememberSpot('home:floor', 'upstairs');
    playerRef.current = { ...FLOORS.upstairs.spawn, facing: 'left' };
    setPlayer(playerRef.current);
    rememberSpot('home:upstairs', playerRef.current);
  };
  const sleep = () => {
    dispatch({ type: 'HEAL_FULL' });
    playSfx('heal');
    setSleeping(true);
    // Sleeping ends the day. Coming home after it should start at the front
    // door, not beside the bed you just got out of.
    forgetSpot('home:floor');
    forgetSpot('home:downstairs');
    forgetSpot('home:upstairs');
  };
  const move = (dir) => {
    if (sleeping) return;
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const blocked = !isWalkable(floor, nx, ny);
    const next = blocked ? { x, y, facing: dir } : { x: nx, y: ny, facing: dir };
    playerRef.current = next; setPlayer(next);
    rememberSpot('home:floor', floorId);
    rememberSpot(`home:${floorId}`, next);
    if (floorId === 'downstairs' && next.x === floor.stairs.x && next.y === floor.stairs.y) setTimeout(changeFloor, 120);

    // The bed is a solid prop, so you cannot stand on it — walking into it is
    // what puts you to sleep. Coming home to rest, the bed means sleep rather
    // than the sleep LOG, so it is handled before the furniture table.
    if (floorId === 'upstairs' && nx === floor.bed.x && ny === floor.bed.y) {
      setFacing(null);
      setTimeout(sleep, 120);
      return;
    }

    if (blocked) {
      const station = interactionForCode(floor.grid[ny] && floor.grid[ny][nx], floor);
      setFacing(station);
      if (station && station.screen) {
        playSfx('confirm');
        rememberSpot('home:floor', floorId);
        rememberSpot(`home:${floorId}`, playerRef.current);
        setTimeout(() => navigate(station.screen, station.params || {}), 140);
      }
      return;
    }
    setFacing(null);
  };
  // Sleeping takes the screen over entirely — the dialogue is the scene at
  // that point, so the world and its controls step out of the way.
  if (sleeping) {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <DialogueBox lines={lines} onComplete={() => navigate('hub')} />
      </Screen>
    );
  }

  return (
    <WorldScreen
      map={floor}
      player={player}
      onMove={move}
      place={floor.name}
      objective={facing ? facing.label : floor.hint}
      status={<CompanionStatus companion={companion} stats={state.stats} />}
    />
  );
}
