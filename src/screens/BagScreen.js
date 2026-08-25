// Backpack — the player's actual bag. The top level is intentionally physical:
// phone, badge case, Trail Gear, food, Kinship Knots, and personal keepsakes.
// Existing game state remains the source of truth; this screen does not invent
// a second set of wellness or progression counters.

import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite, CardioHistoryList, GymCheckInList } from '../components';
import { palette, space } from '../theme';
import { cardioTotals, gymCheckInStats, useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { ITEMS, getItem } from '../data/items';
import { TRAIL_CHARMS } from '../data/charms';
import { REGIONAL_BADGES } from '../data/badges';
import { getGoal } from '../data/goals';
import { DEFAULT_BODY_WEIGHT_LB, displayWeight } from '../state/cardioMaths';
import { TOKENS, getQuest, questProgress } from '../data/quests';
import { TOKEN_IMAGES } from '../data/tokenImages';
import { todayKey } from '../modules';

const POCKETS = [
  { id: 'phone', label: 'Phone', sub: 'Personal Tracker' },
  { id: 'badges', label: 'Badge Case', sub: 'Regional Badges' },
  { id: 'gear', label: 'Trail Gear', sub: 'Guardian Charms' },
  { id: 'food', label: 'Smoothies & Snacks', sub: 'Food + recovery' },
  { id: 'knots', label: 'Kinship Knots', sub: 'Bonding resource' },
  { id: 'personal', label: 'Personal Items', sub: 'Keepsakes + accessories' },
];

const REGION_NAMES = {
  grove: 'The Grove',
  tideglass: 'Tideglass Coast',
  redmesa: 'Red Mesa',
  moonfen: 'Moonfen',
  frostpine: 'Frostpine Reach',
  copper: 'Copper Canyon',
  starfall: 'Starfall Prairie',
  amber: 'Amber Orchard',
  thunderstep: 'Thunderstep Highlands',
  mangrove: 'Mangrove Maze',
  deephorizon: 'Deep Horizon',
};

function localDayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function statRow(label, value) {
  return (
    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
      <PixelText size="tiny" color={palette.windowTextDim}>{label}</PixelText>
      <PixelText size="tiny" color={palette.windowText}>{String(value)}</PixelText>
    </View>
  );
}

function titleCase(id) {
  return String(id || '')
    .replace(/^workout:/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function exerciseSummary(value) {
  if (typeof value === 'number') return `${value}`;
  if (!value || typeof value !== 'object') return 'Logged';
  const bits = [];
  if (value.sets) bits.push(`${value.sets} sets`);
  if (value.reps) bits.push(`${value.reps} reps`);
  if (value.holdSec) bits.push(`${value.holdSec}s`);
  if (value.count) bits.push(`${value.count}x`);
  if (value.max) bits.push(`PR ${value.max}`);
  return bits.length ? bits.join(' · ') : 'Logged';
}

export default function BagScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, goBack, back } = useNav();
  const [pocket, setPocket] = useState(null);
  const [toast, setToast] = useState('Your backpack. Everything you carry has a place.');

  const today = (state.history && state.history[localDayKey()]) || {};
  const goal = getGoal(state.goalId);
  const units = state.settings.units || 'lb';
  const bodyWeight = state.settings.bodyWeightLb || DEFAULT_BODY_WEIGHT_LB;
  const weightWasExplicitlyChanged = bodyWeight !== DEFAULT_BODY_WEIGHT_LB;

  const charmIds = useMemo(() => new Set(TRAIL_CHARMS.map((c) => c.id)), []);
  const ownedFood = Object.keys(ITEMS).filter((id) => {
    if ((state.bag[id] || 0) <= 0) return false;
    if (id === 'knot' || charmIds.has(id)) return false;
    return true;
  });
  const ownedCharms = TRAIL_CHARMS.filter((c) => (state.bag[c.id] || 0) > 0 || state.discoveredCharms[c.id]);
  const exerciseEntries = Object.entries(state.stats.exercises || {}).filter(([id]) => !id.startsWith('workout:'));
  const routineEntries = Object.entries(state.stats.exercises || {}).filter(([id]) => id.startsWith('workout:'));
  const checkIns = gymCheckInStats(state.gymCheckIns);
  const cardio = cardioTotals(state.cardioSessions);

  const useItem = (id) => {
    const item = getItem(id);
    if (!item || !item.effect) {
      setToast(`${item ? item.name : 'That item'} is not used from this pocket.`);
      return;
    }
    if (!companion) {
      setToast('Meet Coach Maple in the gym — food and recovery items are for the two of you.');
      return;
    }
    dispatch({ type: 'USE_ITEM', payload: { itemId: id } });
    playSfx(item.effect.heal ? 'heal' : 'item');
    setToast(`Used ${item.name}.`);
  };

  const renderPhone = () => (
    <>
      <Window tone="dark" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="body" color={palette.secondary}>Personal Tracker</PixelText>
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4, lineHeight: 13 }}>
          Real work done in Companion Quest feeds this tracker automatically. Care/imported health data can plug into this same view later.
        </PixelText>
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Quest Log</PixelText>
        {(state.quests.active || []).length ? state.quests.active.map((active) => {
          const quest = getQuest(active.questId);
          if (!quest) return null;
          const prog = questProgress(quest, active, state, todayKey());
          return (
            <View key={quest.id} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <PixelText size="tiny" color={palette.windowText}>{quest.name}</PixelText>
                <PixelText size="tiny" color={prog.done ? palette.success : prog.expired ? palette.danger : palette.windowTextDim}>
                  {prog.done ? 'Ready — turn in at reception' : prog.expired ? 'Out of time' : `until ${prog.endDay}`}
                </PixelText>
              </View>
              {prog.reqs.map((r) => (
                <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <PixelText size="tiny" color={r.done ? palette.success : palette.windowTextDim} style={{ flex: 1, lineHeight: 13 }}>
                    {(r.done ? '✓ ' : '· ') + r.label}
                  </PixelText>
                  <PixelText size="tiny" color={palette.windowText}>{`${Math.floor(r.have * 10) / 10}/${r.need}`}</PixelText>
                </View>
              ))}
            </View>
          );
        }) : (
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 13 }}>
            No active quests. The Quest Ledger at reception sells them for 5–15 Quest Credits — up to three at a time.
          </PixelText>
        )}
        {statRow('Completed', (state.quests.completed || []).length)}
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Token Case</PixelText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {TOKENS.map((t) => {
            const n = (state.quests.tokens || {})[t.id] || 0;
            return (
              <View key={t.id} style={{ width: '25%', alignItems: 'center', marginBottom: space.sm }}>
                <Image source={TOKEN_IMAGES[t.id]} resizeMode="contain" fadeDuration={0} style={{ width: 56, height: 56, opacity: n ? 1 : 0.2 }} />
                <PixelText size="tiny" color={n ? palette.windowText : palette.windowTextDim} style={{ marginTop: 2 }}>
                  {n ? `x${n}` : '—'}
                </PixelText>
              </View>
            );
          })}
        </View>
        <PixelText size="tiny" color={palette.windowTextDim} style={{ lineHeight: 13 }}>
          Proof of finished quests, one per category. Collectible, never spendable.
        </PixelText>
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Profile</PixelText>
        {statRow('Goal', goal ? goal.name : 'Not chosen yet')}
        {statRow('Weight', weightWasExplicitlyChanged ? `${displayWeight(bodyWeight, units)} ${units}` : 'Not logged yet')}
        <PixelButton label="Log / Update Weight" tone="plain" size="small" style={{ marginTop: space.sm }} onPress={() => navigate('options')} />
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Mileage</PixelText>
        {statRow('Today — all', `${(today.distanceMi || 0).toFixed(1)} mi`)}
        {statRow('Today — bike', `${(today.cyclingMi || 0).toFixed(1)} mi`)}
        {statRow('Lifetime — all', `${(state.stats.distanceMi || 0).toFixed(1)} mi`)}
        {statRow('Lifetime — bike', `${(state.stats.cyclingMi || 0).toFixed(1)} mi`)}
        {statRow('Bike Rides', state.stats.ridesDone || 0)}
        {statRow('Steps', state.stats.totalSteps || 0)}
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Personal — Gym Attendance</PixelText>
        {statRow('Current Streak', `${checkIns.currentStreak}d`)}
        {statRow('Longest Streak', `${checkIns.longestStreak}d`)}
        {statRow('Days Checked In', checkIns.totalDays)}
        <GymCheckInList entries={state.gymCheckIns} />
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.sm, lineHeight: 13 }}>
          Reception records your first desk check-in time each day. Your attendance stats live here in the Phone’s Personal section; reception does not track mileage or award anything.
        </PixelText>
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Cardio Totals</PixelText>
        {statRow('Cardio minutes', state.stats.cardioMinutes || 0)}
        {statRow('Cardio sessions', state.stats.cardioSessionsDone || 0)}
        {statRow('Credits from cardio', state.stats.cardioCreditsEarned || 0)}
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.sm, letterSpacing: 1 }}>
          BY MACHINE
        </PixelText>
        {statRow('Treadmill', `${(state.stats.treadmillMi || 0).toFixed(1)} mi · ${cardio.byMachine.treadmill.sessions} sessions`)}
        {statRow('Bike Ride', `${(state.stats.cyclingMi || 0).toFixed(1)} mi · ${state.stats.ridesDone || 0} rides`)}
        {statRow('Rower', `${cardio.byMachine.rower.machineMeters || 0} m · ${cardio.byMachine.rower.sessions} sessions`)}
        {statRow('Stair Climber', `${state.stats.stairFloors || 0} floors · ${cardio.byMachine.stairclimber.sessions} sessions`)}
        {statRow('Elliptical', `${state.stats.ellipticalStrides || 0} strides · ${cardio.byMachine.elliptical.sessions} sessions`)}
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Recent Cardio</PixelText>
        <CardioHistoryList sessions={state.cardioSessions} limit={8} />
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.sm, lineHeight: 13 }}>
          All five machines land here. Their active time pays Quest Credits; none of it advances a trail, its milestones or its encounters. A * marks a figure read off the machine and entered by hand.
        </PixelText>
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Gym Work</PixelText>
        {statRow('Workouts', state.stats.workoutsDone || 0)}
        {statRow('Sets', state.stats.sets || 0)}
        {statRow('Reps', state.stats.reps || 0)}
        {statRow('Hold Time', `${state.stats.holdSec || 0}s`)}
        {statRow('Routines Logged', routineEntries.length)}
      </Window>

      <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={palette.windowText}>Exercise Records</PixelText>
        {exerciseEntries.length ? exerciseEntries.slice(0, 10).map(([id, value]) => statRow(titleCase(id), exerciseSummary(value))) : (
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>No gym exercises logged yet.</PixelText>
        )}
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.sm, lineHeight: 13 }}>
          Bike rides, runs, lifts, and true max/PR records appear as those sources expose structured records. We do not fabricate a PR from total reps.
        </PixelText>
      </Window>
    </>
  );

  const renderBadges = () => (
    <>
      <Window tone="dark" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="body" color={palette.secondary}>Regional Badge Case</PixelText>
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4 }}>
          {`${REGIONAL_BADGES.filter((b) => state.trails.progress[b.trailId] && state.trails.progress[b.trailId].pin).length} / ${REGIONAL_BADGES.length} earned`}
        </PixelText>
      </Window>
      {REGIONAL_BADGES.map((badge, index) => {
        const earned = !!(state.trails.progress[badge.trailId] && state.trails.progress[badge.trailId].pin);
        return (
          <Window key={badge.id} tone="cream" pad={10} style={{ marginBottom: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderWidth: earned ? 0 : 1, borderColor: palette.windowTextDim }}>
                <PixelSprite
                  spriteKey={badge.sprite}
                  size={54}
                  accessibilityLabel={earned ? badge.name : `Locked badge outline for ${REGION_NAMES[badge.regionId]}`}
                  style={earned ? null : { opacity: 0.14 }}
                />
              </View>
              <View style={{ flex: 1, marginLeft: space.md }}>
                <PixelText size="tiny" color={palette.windowTextDim}>{`${index + 1}. ${REGION_NAMES[badge.regionId] || badge.regionId}`}</PixelText>
                <PixelText size="body" color={earned ? palette.windowText : palette.windowTextDim} style={{ marginTop: 4 }}>
                  {earned ? badge.name : 'Badge Slot'}
                </PixelText>
                <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4 }}>
                  {earned ? 'Regional Warden defeated.' : 'Defeat this region\'s final Warden to fill this outline.'}
                </PixelText>
              </View>
            </View>
          </Window>
        );
      })}
    </>
  );

  const renderGear = () => (
    <>
      <Window tone="dark" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="body" color={palette.secondary}>Trail Gear</PixelText>
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4, lineHeight: 13 }}>
          Guardian Charms you have discovered. First clear gives one; Maple stocks extras afterward. Your active companion wears ONE — its effect is live in every battle.
        </PixelText>
      </Window>
      {ownedCharms.length ? ownedCharms.map((charm) => {
        const count = state.bag[charm.id] || 0;
        const worn = !!(companion && companion.charm === charm.id);
        return (
          <Window key={charm.id} tone="cream" pad={10} style={{ marginBottom: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <PixelSprite spriteKey={charm.id} palette={`art_${charm.id}`} size={64} accessibilityLabel={charm.name} />
              </View>
              <View style={{ flex: 1, marginLeft: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <PixelText size="body" color={palette.windowText}>{charm.name}</PixelText>
                  <PixelText size="tiny" color={worn ? palette.success : palette.accentDark}>{worn ? 'WORN' : `x${count}`}</PixelText>
                </View>
                <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4 }}>{charm.theme}</PixelText>
                <PixelText size="tiny" color={palette.windowText} style={{ marginTop: 4, lineHeight: 13 }}>{charm.effect}</PixelText>
              </View>
            </View>
            {companion && worn ? (
              <PixelButton
                label={`Take off ${companion.creature.name}'s charm`}
                tone="plain" size="small" sound="cancel" style={{ marginTop: space.sm }}
                onPress={() => { dispatch({ type: 'UNEQUIP_CHARM' }); setToast(`${charm.name} goes back in the pack.`); }}
              />
            ) : companion && count > 0 ? (
              <PixelButton
                label={`Equip on ${companion.creature.name}`}
                tone="gold" size="small" style={{ marginTop: space.sm }}
                onPress={() => { dispatch({ type: 'EQUIP_CHARM', payload: { charmId: charm.id } }); setToast(`${companion.creature.name} wears the ${charm.name}.`); }}
              />
            ) : null}
          </Window>
        );
      }) : (
        <Window tone="cream" pad={16}>
          <PixelText size="small" color={palette.windowTextDim} align="center">No Trail Gear discovered yet.</PixelText>
        </Window>
      )}
    </>
  );

  const renderFood = () => (
    <>
      <Window tone="dark" pad={12} style={{ marginBottom: space.sm }}>
        <PixelText size="body" color={palette.secondary}>Smoothies & Snacks</PixelText>
        <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4 }}>Food, drinks, and recovery items you are carrying.</PixelText>
      </Window>
      {ownedFood.length ? ownedFood.map((id) => {
        const item = getItem(id);
        return (
          <Window key={id} tone="cream" pad={10} style={{ marginBottom: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PixelSprite spriteKey={item.sprite} palette={item.palette} size={48} accessibilityLabel={item.name} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <PixelText size="body" color={palette.windowText}>{item.name}</PixelText>
                  <PixelText size="tiny" color={palette.accentDark}>{`x${state.bag[id]}`}</PixelText>
                </View>
                <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, lineHeight: 13 }}>{item.description}</PixelText>
              </View>
            </View>
            {item.effect ? <PixelButton label="Use" tone="gold" size="small" style={{ marginTop: space.sm }} onPress={() => useItem(id)} /> : null}
          </Window>
        );
      }) : (
        <Window tone="cream" pad={16}><PixelText size="small" color={palette.windowTextDim} align="center">No snacks or smoothies packed right now.</PixelText></Window>
      )}
    </>
  );

  const renderKnots = () => {
    const count = state.bag.knot || 0;
    return (
      <Window tone="cream" pad={18}>
        <View style={{ alignItems: 'center' }}>
          <PixelSprite spriteKey="item_knot" palette="art_item_knot" size={92} accessibilityLabel="Kinship Knot" />
          <PixelText size="heading" color={palette.windowText} style={{ marginTop: space.sm }}>Kinship Knots</PixelText>
          <PixelText size="body" color={palette.accentDark} style={{ marginTop: 6 }}>{`x ${count}`}</PixelText>
          <PixelText size="small" color={palette.windowTextDim} align="center" style={{ marginTop: space.md, lineHeight: 16 }}>
            Two journeys, tied together. Offer one to a wild companion during an encounter; it decides whether to complete the bond.
          </PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: space.sm }}>
            Knots cannot be used directly from the backpack.
          </PixelText>
        </View>
      </Window>
    );
  };

  const renderPersonal = () => (
    <Window tone="cream" pad={18}>
      <PixelText size="body" color={palette.windowText}>Personal Items</PixelText>
      <PixelText size="small" color={palette.windowTextDim} style={{ marginTop: space.sm, lineHeight: 16 }}>
        This pocket is ready for future phone accessories, story keepsakes, photos, keys, cosmetics, event items, and other personal collectibles.
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.md }}>EMPTY FOR NOW</PixelText>
    </Window>
  );

  const renderPocket = () => {
    if (pocket === 'phone') return renderPhone();
    if (pocket === 'badges') return renderBadges();
    if (pocket === 'gear') return renderGear();
    if (pocket === 'food') return renderFood();
    if (pocket === 'knots') return renderKnots();
    if (pocket === 'personal') return renderPersonal();
    return null;
  };

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Backpack
      </PixelText>

      <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PixelText size="tiny" color={palette.windowFill}>{companion ? `Traveling with ${companion.creature.name}` : 'Your personal pack'}</PixelText>
          <PixelText size="tiny" color={palette.secondary}>{`${state.credits || 0} Quest Credits`}</PixelText>
        </View>
      </Window>

      <Window tone="cream" pad={8} style={{ marginBottom: space.sm }}>
        <PixelText size="tiny" color={palette.windowTextDim}>{toast}</PixelText>
      </Window>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 72 }}>
        {!pocket ? (
          POCKETS.map((p) => (
            <Window key={p.id} tone="cream" pad={10} style={{ marginBottom: space.sm }}>
              <PixelButton label={p.label} tone="plain" onPress={() => { playSfx('confirm'); setPocket(p.id); setToast(p.sub); }} />
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, textAlign: 'center' }}>{p.sub}</PixelText>
            </Window>
          ))
        ) : renderPocket()}
      </ScrollView>

      {pocket ? (
        <PixelButton label="Back to Backpack" tone="plain" sound="cancel" onPress={() => { setPocket(null); setToast('Your backpack. Everything you carry has a place.'); }} style={{ marginTop: space.sm }} />
      ) : (
        <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
      )}
    </Screen>
  );
}
