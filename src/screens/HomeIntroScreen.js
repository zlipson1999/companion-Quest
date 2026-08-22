import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, DualPane, TileMap, Dpad, Window, PixelText } from '../components';
import { palette, screen, space } from '../theme';
import { useNav } from './navContext';
import { isWalkable } from '../data/maps';
import { playSfx } from '../audio';

const AREAS = {
  // Real rooms, not four walls and a floor. Furniture is prop overlays on the
  // room's own boards, and every piece is solid so the space has to be walked
  // around — which is what makes it read as somewhere the player lives.
  //
  //   e/E bed   v TV   k desk   r rug   o shelf   p plant   s stairs
  //   f sofa    a table   c counter   F fridge
  bedroom: {
    name: 'Your Room — Upstairs', id: 'home', cols: 9, rows: 8,
    spawn: { x: 4, y: 5 }, exit: { x: 7, y: 6 },
    grid: [
      'WWWWWWWWW',
      'WHHHHHHHW',
      'We..v..oW',
      'WE.....pW',
      'W..rr...W',
      'W..rr...W',
      'Wk.....sW',
      'WWWWWWWWW',
    ],
    hint: 'Your room. The stairs are in the far corner.', next: 'downstairs',
  },
  downstairs: {
    name: 'Your Home — Downstairs', id: 'home', cols: 9, rows: 8,
    spawn: { x: 7, y: 2 }, exit: { x: 4, y: 6 },
    grid: [
      'WWWWWWWWW',
      'WcccF..sW',
      'W.......W',
      'W.a....pW',
      'W...rr..W',
      'Wf..rr..W',
      'W...D...W',
      'WWWWWWWWW',
    ],
    hint: 'Head through your front door.', next: 'outside',
  },
  outside: {
    name: 'Maple Lane', cols: 9, rows: 7, spawn: { x: 2, y: 5 }, exit: { x: 6, y: 2 },
    grid: ['TTTTTTTTT', 'ThhhTyyyT', 'THDHTYdYT', 'T.####..T', 'T.#..#..T', 'T.####..T', 'TTTTTTTTT'],
    hint: 'The Training Hall is next door. Find its entrance.', next: 'coachTutorial',
  },
};

export default function HomeIntroScreen() {
  const { navigate } = useNav();
  const [areaId, setAreaId] = useState('bedroom');
  const area = AREAS[areaId];
  const [player, setPlayer] = useState({ ...area.spawn, facing: 'down' });
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
    const next = isWalkable(area, nx, ny) ? { x: nx, y: ny, facing: dir } : { x, y, facing: dir };
    playerRef.current = next;
    setPlayer(next);
    if (next.x === area.exit.x && next.y === area.exit.y) setTimeout(() => enter(area.next), 120);
  };

  const tileSize = Math.floor(Math.min(screen.width - 20, screen.height * 0.45) / area.cols);
  return (
    <Screen padTop={false}>
      <DualPane
        top={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.grassDark }}><TileMap map={area} player={player} tileSize={tileSize} /></View>}
        bottom={<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: space.md }}><Dpad onMove={move} /><Window tone="dark" pad={12} style={{ flex: 1, marginLeft: space.md }}><PixelText size="small" color={palette.secondary}>{area.name}</PixelText><PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 10, lineHeight: 15 }}>{area.hint}</PixelText></Window></View>}
      />
    </Screen>
  );
}
