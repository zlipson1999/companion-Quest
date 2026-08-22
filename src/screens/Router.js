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
import OutfitSelectScreen from './OutfitSelectScreen';
import HomeIntroScreen from './HomeIntroScreen';
import CoachTutorialScreen from './CoachTutorialScreen';
import GoalSelectScreen from './GoalSelectScreen';
import PairingScreen from './PairingScreen';
import HubScreen from './HubScreen';
import GymScreen from './GymScreen';
import RouteScreen from './RouteScreen';
import BattleScreen from './BattleScreen';
import WorkoutScreen from './WorkoutScreen';
import HomeRestScreen from './HomeRestScreen';
import SummaryScreen from './SummaryScreen';
import IndexScreen from './IndexScreen';
import BagScreen from './BagScreen';
import PartyScreen from './PartyScreen';
import HabitsScreen from './HabitsScreen';
import HabitLogScreen from './HabitLogScreen';
import ForgeScreen from './ForgeScreen';
import ForgeEditScreen from './ForgeEditScreen';
import FormCheckScreen from './FormCheckScreen';
import WeekScreen from './WeekScreen';
import CoachChatScreen from './CoachChatScreen';
import OptionsScreen from './OptionsScreen';
import LoadingScreen from './LoadingScreen';

const SCREENS = {
  title: TitleScreen,
  intro: IntroScreen,
  outfit: OutfitSelectScreen,
  homeIntro: HomeIntroScreen,
  coachTutorial: CoachTutorialScreen,
  goal: GoalSelectScreen,
  pairing: PairingScreen,
  hub: HubScreen,
  gym: GymScreen,
  route: RouteScreen,
  treadmill: RouteScreen,
  battle: BattleScreen,
  workout: WorkoutScreen,
  rest: HomeRestScreen,
  summary: SummaryScreen,
  index: IndexScreen,
  bag: BagScreen,
  party: PartyScreen,
  habits: HabitsScreen,
  habit: HabitLogScreen,
  forge: ForgeScreen,
  forgeEdit: ForgeEditScreen,
  formcheck: FormCheckScreen,
  week: WeekScreen,
  coach: CoachChatScreen,
  options: OptionsScreen,
};

// Every non-battle screen plays the town loop. 'route' matters especially:
// fleeing a battle returns there, and without an entry here the battle music
// just kept playing over the walk.
const TOWN_BGM = new Set([
  'title', 'intro', 'outfit', 'homeIntro', 'coachTutorial', 'goal', 'pairing', 'hub', 'gym', 'route', 'treadmill', 'rest', 'workout', 'summary', 'index', 'bag',
  'party', 'coach', 'options', 'habits', 'habit', 'forge', 'forgeEdit', 'formcheck', 'week',
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

