// Tiny screen router. Holds the current route, exposes navigate() + a special
// toBattle() that plays the flash/wipe transition before swapping in the Battle
// screen. Picks the initial screen once the save has hydrated.

import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { NavContext, PLACE_LABELS } from './navContext';
import { useGame } from '../state';
import { playBgm, setMuted, setBgmMuted } from '../audio';
import BattleTransition from '../components/BattleTransition';
import { PixelText } from '../components';
import { palette, space } from '../theme';

import TitleScreen from './TitleScreen';
import IntroScreen from './IntroScreen';
import OutfitSelectScreen from './OutfitSelectScreen';
import HomeIntroScreen from './HomeIntroScreen';
import GoalSelectScreen from './GoalSelectScreen';
import CoachTutorialScreen from './CoachTutorialScreen';
import PairingScreen from './PairingScreen';
import HubScreen from './HubScreen';
import GymScreen from './GymScreen';
import SparIntroScreen from './SparIntroScreen';
import CookbookScreen from './CookbookScreen';
import SmoothieBarScreen from './SmoothieBarScreen';
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
import FriendsScreen from './FriendsScreen';
import BoardScreen from './BoardScreen';
import OptionsScreen from './OptionsScreen';
import WorldMapScreen from './WorldMapScreen';
import LoadingScreen from './LoadingScreen';

const SCREENS = {
  title: TitleScreen,
  intro: IntroScreen,
  outfit: OutfitSelectScreen,
  homeIntro: HomeIntroScreen,
  goal: GoalSelectScreen,
  coachTutorial: CoachTutorialScreen,
  pairing: PairingScreen,
  hub: HubScreen,
  gym: GymScreen,
  sparIntro: SparIntroScreen,
  cookbook: CookbookScreen,
  smoothiebar: SmoothieBarScreen,
  route: RouteScreen,
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
  friends: FriendsScreen,
  board: BoardScreen,
  options: OptionsScreen,
  world: WorldMapScreen,
};

// Every non-battle screen plays the town loop. 'route' matters especially:
// fleeing a battle returns there, and without an entry here the battle music
// just kept playing over the walk.
const TOWN_BGM = new Set([
  'title', 'intro', 'outfit', 'homeIntro', 'goal', 'coachTutorial', 'pairing', 'sparIntro', 'cookbook', 'smoothiebar', 'hub', 'gym', 'route', 'rest', 'workout', 'summary', 'index', 'bag', 'friends', 'board',
  'party', 'coach', 'options', 'habits', 'habit', 'forge', 'forgeEdit', 'formcheck', 'week', 'world',
]);

// Somewhere you can WALK AROUND. Arriving at one is a fresh context rather than
// a step deeper, so it clears the trail behind it: what matters from inside the
// Forge is that you came from the gym, not everywhere you had been before that.
const PLACES = new Set(['hub', 'gym', 'rest', 'route', 'title', 'homeIntro']);

// Only places get named on a back button. Anywhere else it is just "Back",
// because "Back to the movement picker" is worse than saying nothing.
export default function Router() {
  const { state, hydrated, saveError } = useGame();
  const [route, setRoute] = useState(null);
  const [stack, setStack] = useState([]);
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

  // Every screen used to hardcode where its Back button went, which is why the
  // Forge sent you to Town whether you had walked in from the gym or opened it
  // from Habits — and why it had grown its own one-off `from` param to paper
  // over the worst case. The router knows the answer; the screens should not
  // have to guess it.
  const nav = useMemo(() => {
    const backTo = stack.length ? stack[stack.length - 1].name : 'hub';
    return {
      route,
      navigate: (name, params = {}) => {
        setStack((s) => {
          if (!route || route.name === name) return s;
          if (PLACES.has(name)) return [];
          // Going back to where you just were is a step BACK, not another step
          // deeper — otherwise the Forge/mirror round trip leaves the mirror on
          // the stack and the Forge's own Back button returns to it.
          if (s.length && s[s.length - 1].name === name) return s.slice(0, -1);
          return [...s, route].slice(-8);
        });
        setRoute({ name, params });
      },
      goBack: () => {
        const prev = stack[stack.length - 1];
        setStack((s) => s.slice(0, -1));
        setRoute(prev || { name: 'hub', params: {} });
      },
      back: {
        to: backTo,
        label: PLACE_LABELS[backTo] ? `Back to ${PLACE_LABELS[backTo]}` : 'Back',
      },
      toBattle: (params = {}) => setPendingBattle(params),
    };
  }, [route, stack]);

  if (!hydrated || !route) {
    return <LoadingScreen />;
  }

  const Active = SCREENS[route.name] || TitleScreen;

  return (
    <NavContext.Provider value={nav}>
      <View style={{ flex: 1 }}>
        {saveError ? (
          <View style={{ backgroundColor: palette.danger, paddingVertical: 8, paddingHorizontal: space.md, zIndex: 40 }}>
            <PixelText size="tiny" color={palette.white} align="center">
              {saveError}
            </PixelText>
          </View>
        ) : null}
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

