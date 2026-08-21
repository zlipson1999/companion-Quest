// Tiny screen router. Holds the current route, exposes navigate() + a special
// toBattle() that plays the flash/wipe transition before swapping in the Battle
// screen. Picks the initial screen once the save has hydrated.

import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { NavContext } from './navContext';
import { useGame } from '../state';
import { playBgm, setMuted, setBgmMuted } from '../audio';
import BattleTransition from '../components/BattleTransition';

import TitleScreen from './TitleScreen';
import IntroScreen from './IntroScreen';
import GoalSelectScreen from './GoalSelectScreen';
import PairingScreen from './PairingScreen';
import HubScreen from './HubScreen';
import RouteScreen from './RouteScreen';
import BattleScreen from './BattleScreen';
import WorkoutScreen from './WorkoutScreen';
import RestScreen from './RestScreen';
import SummaryScreen from './SummaryScreen';
import IndexScreen from './IndexScreen';
import BagScreen from './BagScreen';
import PartyScreen from './PartyScreen';
import CoachChatScreen from './CoachChatScreen';
import OptionsScreen from './OptionsScreen';
import LoadingScreen from './LoadingScreen';

const SCREENS = {
  title: TitleScreen,
  intro: IntroScreen,
  goal: GoalSelectScreen,
  pairing: PairingScreen,
  hub: HubScreen,
  route: RouteScreen,
  battle: BattleScreen,
  workout: WorkoutScreen,
  rest: RestScreen,
  summary: SummaryScreen,
  index: IndexScreen,
  bag: BagScreen,
  party: PartyScreen,
  coach: CoachChatScreen,
  options: OptionsScreen,
};

const TOWN_BGM = new Set([
  'title', 'intro', 'goal', 'pairing', 'hub', 'rest', 'workout', 'summary', 'index', 'bag', 'party', 'coach', 'options',
]);

export default function Router() {
  const { state, hydrated } = useGame();
  const [route, setRoute] = useState(null);
  const [pendingBattle, setPendingBattle] = useState(null);

  useEffect(() => {
    if (hydrated && route === null) {
      setMuted(!!state.settings.muted);
      setBgmMuted(!!state.settings.bgmMuted);
      setRoute({ name: 'title', params: {} });
    }
  }, [hydrated, route, state.settings]);

  useEffect(() => {
    if (!route) return;
    if (route.name === 'battle') playBgm('battle');
    else if (TOWN_BGM.has(route.name)) playBgm('town');
  }, [route]);

  const nav = useMemo(
    () => ({
      route,
      navigate: (name, params = {}) => setRoute({ name, params }),
      toBattle: (params = {}) => setPendingBattle(params),
    }),
    [route]
  );

  if (!hydrated || !route) {
    return <LoadingScreen />;
  }

  const Active = SCREENS[route.name] || TitleScreen;

  return (
    <NavContext.Provider value={nav}>
      <View style={{ flex: 1 }}>
        <Active params={route.params || {}} />
        {pendingBattle ? (
          <BattleTransition
            onDone={() => {
              setRoute({ name: 'battle', params: pendingBattle });
              setPendingBattle(null);
            }}
          />
        ) : null}
      </View>
    </NavContext.Provider>
  );
}
