import React, { useMemo, useRef, useState } from 'react';
import { Screen, WorldScreen, DialogueBox, CompanionStatus } from '../components';
import { space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { BEDROOM, DOWNSTAIRS, isWalkable, interactionForCode, tileAt } from '../data/maps';
import { forgetSpot, recallSpot, rememberSpot } from './placeMemory';
import { playSfx } from '../audio';

const FLOORS = {
  downstairs: { ...DOWNSTAIRS, name: 'Home — Downstairs', spawn: { x: 7, y: 13 }, stairs: { x: 11, y: 1 }, fromStairs: { x: 11, y: 2, facing: 'down' }, hint: 'Sleep is upstairs. The front door goes back to the lane.' },
  upstairs: { ...BEDROOM, name: 'Home — Bedroom', spawn: { x: 9, y: 10 }, stairs: { x: 9, y: 11 }, bed: { x: 1, y: 2 }, hint: 'Walk to your bed and sleep. The stairs go back down.' },
};
const LANE_FROM_HOUSE = { x: 2, y: 6, facing: 'down' };

export default function HomeRestScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  const [floorId, setFloorId] = useState(() => recallSpot('home:floor', 'downstairs'));
  const [sleeping, setSleeping] = useState(false);
  const [mapleCall, setMapleCall] = useState(false);

  const tourStep = state.meta.homeTourStep || 0;
  const homeTour = !!(companion && state.meta.coachIntroDone && state.meta.sparDone && !state.meta.homeTourDone);
  const TOUR_HINTS = [
    'Maple’s tip: the kitchen logs what you actually eat — walk to the fridge or worktop',
    'Upstairs — the desk keeps your daily habits. Go log one honestly',
    'Last one: walk into your bed. Real rest restores Resolve — never feel guilty about it',
  ];
  const [briefed, setBriefed] = useState(!homeTour || tourStep > 0);
  const BRIEFING = [
    { speaker: 'Coach Maple', text: 'One more lesson, and it lives in your own house: home is training too. Three things here feed the same journey the iron does.' },
    { speaker: 'Coach Maple', text: 'The kitchen logs what you actually ate — no calorie maths, just honesty. The desk upstairs keeps your daily habits. And the bed is real rest: Resolve comes back while you sleep.' },
    { speaker: 'Coach Maple', text: 'Try the kitchen first. Log something true, then the desk, then get some sleep. That is a whole day done right.' },
  ];
  const floor = FLOORS[floorId];
  const [player, setPlayer] = useState(() => recallSpot(`home:${floorId}`, { ...floor.spawn, facing: 'up' }, (s) => isWalkable(floor, s.x, s.y)));
  const [facing, setFacing] = useState(null);
  const playerRef = useRef(player);
  const companionName = companion && companion.creature && companion.creature.name;

  const lines = useMemo(() => {
    const out = [{ speaker: 'Home', text: 'The lights soften. The day can end here.' }];
    if (companionName) {
      out.push({ speaker: companionName, text: 'We did enough for today. Let’s sleep, then meet tomorrow together.' });
      out.push({ speaker: 'Home', text: `${companionName}'s Resolve is fully restored.` });
    } else out.push({ speaker: 'Home', text: 'Meet Coach Maple in the gym when you are ready. Sleep first if you need it.' });
    if (mapleCall) {
      out.push({ speaker: 'Phone', text: 'BZZT — Coach Maple is calling.' });
      out.push({ speaker: 'Coach Maple', text: 'You have seen home and the gym. Now I want you to actually train with me. Meet me back at Quest Fitness — I have a short first session ready for you.' });
      out.push({ speaker: 'Coach Maple', text: 'No equipment, no battle, no score. Just you, me, and your companion moving together. I’ll show you every step.' });
    }
    return out;
  }, [companionName, mapleCall]);

  const changeFloor = (nextId) => {
    playSfx('confirm');
    const next = FLOORS[nextId];
    const spot = nextId === 'upstairs' ? { ...next.spawn, facing: 'left' } : { ...next.fromStairs };
    setFloorId(nextId); rememberSpot('home:floor', nextId); playerRef.current = spot; setPlayer(spot); rememberSpot(`home:${nextId}`, spot);
  };
  const leaveHouse = () => { playSfx('confirm'); rememberSpot('hub', LANE_FROM_HOUSE); navigate('hub'); };
  const sleep = () => {
    dispatch({ type: 'HEAL_FULL' }); playSfx('heal'); setSleeping(true);
    forgetSpot('home:floor'); forgetSpot('home:downstairs'); forgetSpot('home:upstairs');
  };

  const move = (dir) => {
    if (sleeping || !briefed) return;
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const blocked = !isWalkable(floor, nx, ny);
    const next = blocked ? { x, y, facing: dir } : { x: nx, y: ny, facing: dir };
    playerRef.current = next; setPlayer(next); rememberSpot('home:floor', floorId); rememberSpot(`home:${floorId}`, next);
    if (floor.stairs && next.x === floor.stairs.x && next.y === floor.stairs.y) setTimeout(() => changeFloor(floorId === 'downstairs' ? 'upstairs' : 'downstairs'), 120);
    if (floorId === 'downstairs' && tileAt(floor, next.x, next.y) === 'D') setTimeout(leaveHouse, 120);

    if (floorId === 'upstairs' && nx === floor.bed.x && ny === floor.bed.y) {
      setFacing(null);
      if (homeTour && tourStep >= 2) {
        // Finishing the home lesson triggers Maple's one-time phone call. The
        // session reward itself has a second guard, so this cannot become a farm.
        setMapleCall(true);
        dispatch({ type: 'MARK_META', payload: { homeTourDone: true, mapleSessionReady: true } });
      }
      setTimeout(sleep, 120); return;
    }

    if (blocked) {
      const station = interactionForCode(floor.grid[ny] && floor.grid[ny][nx], floor);
      setFacing(station);
      if (station && station.screen) {
        playSfx('confirm');
        if (homeTour) {
          const moduleId = station.params && station.params.moduleId;
          if (tourStep === 0 && moduleId === 'diet') dispatch({ type: 'MARK_META', payload: { homeTourStep: 1 } });
          else if (tourStep === 1 && (station.screen === 'habits' || moduleId)) dispatch({ type: 'MARK_META', payload: { homeTourStep: 2 } });
        }
        rememberSpot('home:floor', floorId); rememberSpot(`home:${floorId}`, playerRef.current);
        setTimeout(() => navigate(station.screen, station.params || {}), 140);
      }
      return;
    }
    setFacing(null);
  };

  if (sleeping) {
    // The phone rings inside the sleep dialogue itself (see `lines`). Rather
    // than a black-screen handoff into the session, it drops you back on the
    // lane so you WALK to the gym and start it by talking to Maple — the gym
    // reads mapleSessionReady off her tile.
    return <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}><DialogueBox lines={lines} onComplete={() => navigate('hub')} /></Screen>;
  }

  return (
    <WorldScreen
      map={floor}
      player={player}
      onMove={move}
      place={floor.name}
      objective={homeTour ? TOUR_HINTS[Math.min(tourStep, 2)] : facing ? facing.label : floor.hint}
      showControl={briefed}
      dialogue={!briefed ? <DialogueBox lines={BRIEFING} onComplete={() => setBriefed(true)} /> : null}
      status={<CompanionStatus companion={companion} stats={state.stats} />}
    />
  );
}
