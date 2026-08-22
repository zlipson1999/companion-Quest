import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WorldScreen, CompanionStatus } from '../components';
import { palette, screen, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { isWalkable, interactionForCode } from '../data/maps';
import { playSfx } from '../audio';

const AREAS = {
  // Real rooms, not four walls and a floor. Furniture is prop overlays on the
  // room's own boards, and every piece is solid so the space has to be walked
  // around — which is what makes it read as somewhere the player lives.
  //
  //   e/E bed   v TV   k desk   r rug   o shelf   p plant   s stairs
  //   f sofa    a table   c counter   F fridge
  bedroom: {
    name: 'Your Room — Upstairs', id: 'home', cols: 11, rows: 11,
    spawn: { x: 5, y: 7 }, exit: { x: 9, y: 9 },
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
    hint: 'Your room. The stairs are in the far corner.', next: 'downstairs',
  },
  downstairs: {
    name: 'Your Home — Downstairs', id: 'home', cols: 11, rows: 11,
    spawn: { x: 9, y: 2 }, exit: { x: 5, y: 9 },
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
      'W....D....W',
      'WWWWWWWWWWW',
    ],
    interactions: {
      c: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Counter — log a meal' },
      F: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Fridge — log a meal' },
      a: { screen: 'habit', params: { moduleId: 'diet' }, label: 'Table — log a meal' },
      o: { screen: 'cookbook', label: 'Shelf — the kitchen cookbook' },
      f: { screen: 'habit', params: { moduleId: 'meditation' }, label: 'Sofa — sit and be still' },
    },
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

    // Walking into your own furniture uses it, the same way the Hall's
    // equipment works. The bed logs last night, the desk opens your habits,
    // the kitchen shelf is the cookbook.
    if (blocked) {
      const station = interactionForCode(area.grid[ny] && area.grid[ny][nx], area);
      setFacing(station);
      if (station) {
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
