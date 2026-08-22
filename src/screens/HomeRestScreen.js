import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, WorldScreen, DialogueBox } from '../components';
import { palette, screen, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { isWalkable } from '../data/maps';
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
    hint: 'Walk to your bed and sleep.',
  },
};

export default function HomeRestScreen() {
  const { dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  const [floorId, setFloorId] = useState('downstairs');
  const [sleeping, setSleeping] = useState(false);
  const floor = FLOORS[floorId];
  const [player, setPlayer] = useState({ ...floor.spawn, facing: 'up' });
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
    const next = isWalkable(floor, nx, ny) ? { x: nx, y: ny, facing: dir } : { x, y, facing: dir };
    playerRef.current = next; setPlayer(next);
    if (floorId === 'downstairs' && next.x === floor.stairs.x && next.y === floor.stairs.y) setTimeout(changeFloor, 120);
    // The bed is a solid prop now, so you cannot stand on it — walking into it
    // is what puts you to sleep. Test the attempted square, not the one landed on.
    if (floorId === 'upstairs' && nx === floor.bed.x && ny === floor.bed.y) setTimeout(sleep, 120);
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
      objective={floor.hint}
      layout="half"
    />
  );
}
