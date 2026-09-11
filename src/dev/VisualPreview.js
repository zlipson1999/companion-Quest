// Isolated visual-QA fixture. Render the REAL screens with a disposable save.
// Never mounts persistence, cloud sync, or a real participant's account.
import React, { useMemo, useReducer } from 'react';
import { GameContext, reducer } from '../state/GameContext';
import { FRESH } from '../state/hydrate';
import Router from '../screens/Router';

export default function VisualPreview({ route }) {
  const initialParams = useMemo(() => {
    const tone = new URLSearchParams(window.location.search).get('visualTone');
    return ['maple', 'rill', 'gale', 'ember', 'cairn', 'canopy'].includes(tone) ? { stageTone: tone } : {};
  }, []);
  const [state, dispatch] = useReducer(reducer, {
    ...FRESH,
    started: true,
    playerGender: 'man',
    goalId: 'root',
    party: [{ id: 'sproutle', baseId: 'sproutle', xp: 120, bond: 24, evo: 0, hp: 38 }],
    stats: { ...FRESH.stats, totalSteps: 6400, distanceMi: 3.2, workoutsDone: 2 },
    settings: { ...FRESH.settings, muted: true, bgmMuted: true },
    meta: { ...FRESH.meta, homeTourDone: true, mapleSessionDone: true, sparDone: true, gymTourDone: true },
  });
  return <GameContext.Provider value={{ state, dispatch, hydrated: true, saveError: null, visualPreview: true }}>
    <Router initialRoute={route} initialParams={initialParams} />
  </GameContext.Provider>;
}
