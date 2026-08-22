import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, DualPane, TileMap, Dpad, Window, PixelText, DialogueBox } from '../components';
import { palette, screen, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { isWalkable } from '../data/maps';
import { playSfx } from '../audio';

const FLOORS = {
  downstairs: {
    name: 'Home — Downstairs', cols: 7, rows: 7, spawn: { x: 3, y: 5 }, stairs: { x: 5, y: 2 },
    grid: ['WWWWWWW', 'WHHHHHW', 'WH...DW', 'WH...HW', 'WH...HW', 'WH###HW', 'WWWWWWW'],
    hint: 'Sleep is upstairs. Walk to the stair door.',
  },
  upstairs: {
    name: 'Home — Bedroom', cols: 7, rows: 7, spawn: { x: 5, y: 4 }, bed: { x: 2, y: 2 },
    grid: ['WWWWWWW', 'WHHHHHW', 'WHD..HW', 'WH...HW', 'WH...HW', 'WH###HW', 'WWWWWWW'],
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
    if (floorId === 'upstairs' && next.x === floor.bed.x && next.y === floor.bed.y) setTimeout(sleep, 120);
  };
  const tileSize = Math.floor(Math.min(screen.width - 20, screen.height * 0.45) / floor.cols);
  return (
    <Screen padTop={false}>
      <DualPane
        top={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#302841' }}><TileMap map={floor} player={player} tileSize={tileSize} /></View>}
        bottom={sleeping ? <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}><DialogueBox lines={lines} onComplete={() => navigate('hub')} /></View> : <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: space.md }}><Dpad onMove={move} /><Window tone="dark" pad={12} style={{ flex: 1, marginLeft: space.md }}><PixelText size="small" color={palette.secondary}>{floor.name}</PixelText><PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 10, lineHeight: 15 }}>{floor.hint}</PixelText></Window></View>}
      />
    </Screen>
  );
}
