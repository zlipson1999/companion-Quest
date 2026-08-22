import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, WorldScreen, DialogueBox, CompanionStatus } from '../components';
import { palette, screen, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { isWalkable, interactionForCode } from '../data/maps';
import { playSfx } from '../audio';

const FLOORS = {
  downstairs: {
    name: 'Home — Downstairs', id: 'home', cols: 11, rows: 11,
    spawn: { x: 5, y: 9 }, stairs: { x: 9, y: 1 },
    grid: [
      'WWWWWWWWWWW',
      'WccccF...sW',
      'W.........W',
      'W..a......W',
      'W.........W',
      'W...rrr...W',
      'Wf..rrr..oW',
      'W.........W',
      'W.p.......W',
      'W.........W',
      'WWWWWWWWWWW',
    ],
    interactions: {
      c: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Counter — log a meal' },
      F: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Fridge — log a meal' },
      a: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Table — log a meal' },
      o: { screen: 'cookbook', label: 'Shelf — the kitchen cookbook' },
      f: { screen: 'habit', params: { moduleId: 'meditation' }, label: 'Sofa — sit and be still' },
    },
    hint: 'Sleep is upstairs. Walk to the stairs.',
  },
  upstairs: {
    name: 'Home — Bedroom', id: 'home', cols: 11, rows: 11,
    spawn: { x: 9, y: 9 }, bed: { x: 1, y: 2 },
    grid: [
      'WWWWWWWWWWW',
      'WHHHHHHHHHW',
      'We...v...oW',
      'WE.......pW',
      'W.........W',
      'W...rrr...W',
      'W...rrr...W',
      'W.........W',
      'Wk........W',
      'W........sW',
      'WWWWWWWWWWW',
    ],
    // Furniture that does something. Same rule as the Training Hall: the thing
    // that does the job is the thing you walk up to.
    interactions: {
      e: { screen: 'habit', params: { moduleId: 'sleep' }, label: 'Bed — log last night' },
      E: { screen: 'habit', params: { moduleId: 'sleep' }, label: 'Bed — log last night' },
      k: { screen: 'habits', label: 'Desk — your daily habits' },
      o: { screen: 'index', label: 'Shelf — your creature index' },
      v: { screen: 'week', label: 'Screen — this week so far' },
    },
    hint: 'Walk to your bed and sleep.',
  },
};

export default function HomeRestScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  const [floorId, setFloorId] = useState('downstairs');
  const [sleeping, setSleeping] = useState(false);
  const floor = FLOORS[floorId];
  const [player, setPlayer] = useState({ ...floor.spawn, facing: 'up' });
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
    playerRef.current = { ...FLOORS.upstairs.spawn, facing: 'left' };
    setPlayer(playerRef.current);
  };
  const sleep = () => {
    dispatch({ type: 'HEAL_FULL' });
    playSfx('heal');
    setSleeping(true);
  };
  const move = (dir) => {
    if (sleeping) return;
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const blocked = !isWalkable(floor, nx, ny);
    const next = blocked ? { x, y, facing: dir } : { x: nx, y: ny, facing: dir };
    playerRef.current = next; setPlayer(next);
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
      if (station) {
        playSfx('confirm');
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
