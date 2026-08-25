// The noticeboard: how this week is going, among the people you chose.
//
// Four of the five boards reset every Monday, deliberately. An all-time board
// ranks seniority — whoever installed the app first wins for ever, and a friend
// who joins in March is permanently last no matter how well they train. A week
// gives everybody the same empty column on Monday morning.
//
// Personal bests are the exception and are not weekly, because a best is a
// best. They are also the one board where being beaten is useful information
// rather than just a position.
//
// One cork skin. Gym tile G opens this screen; Friends "See the boards" opens
// the same one. Reception (N) stays a separate local check-in desk — not
// corked, not moved here, and not another fitness-stat surface.

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, PixelText, FieldCard, TrailAction, ObjectiveRibbon } from '../components';
import { space, tokens, ramps } from '../theme';
import { useAccount } from '../state/account';
import { useNav } from './navContext';
import api from '../net/api';
import { getMovement } from '../data/movements';
import { playSfx } from '../audio';
import { weekChallenge } from '../state/weekChallenge';
import { todayKey } from '../modules';
import { useGame } from '../state';
import { totals, weekOf } from '../state/history';

const BOARDS = [
  { id: 'distance', tab: 'Miles' },
  { id: 'cycling', tab: 'Bike' },
  { id: 'active', tab: 'Days' },
  { id: 'workouts', tab: 'Sessions' },
  { id: 'records', tab: 'Bests' },
];

// Cork is the trail wood ramp — the same brown the noticeboard prop uses —
// so pinned paper cards sit on a board, not on a stock ticker.
const CORK = ramps.trail[0];

function describeRecord(e) {
  if (e.kind === 'hold') return `${Math.round(e.amount)}s`;
  if (e.weight) return `${Math.round(e.weight)} lb x ${Math.round(e.amount)}`;
  return `${Math.round(e.amount)} reps`;
}

function WeekRow({ row }) {
  return (
    <FieldCard
      tone="paper"
      title={`${row.name}${row.you ? ' (you)' : ''}`}
      caption={row.selfReported ? 'includes self-reported days' : undefined}
      accent={row.you ? tokens.accent : undefined}
      style={{ marginTop: space.sm }}
    >
      <PixelText size="small" color={tokens.textOnPaper}>{row.display}</PixelText>
    </FieldCard>
  );
}

export default function BoardScreen() {
  const { goBack, back, navigate } = useNav();
  const { state } = useGame();
  const acc = useAccount();
  const challenge = weekChallenge(todayKey());
  const localWeek = totals(weekOf(state.history, todayKey()));
  const [tab, setTab] = useState(challenge.id);
  const [board, setBoard] = useState(null);
  const [records, setRecords] = useState(null);

  const load = useCallback(async () => {
    if (!acc.signedIn) return;
    if (tab === 'records') {
      const out = await acc.run(() => api.records(acc.token));
      setRecords(out ? out.movements || [] : []);
      if (out) playSfx('board_update');
    } else {
      const out = await acc.run(() => api.board(acc.token, tab));
      setBoard(out);
      if (out) playSfx('board_update');
    }
  }, [acc, tab]);

  useEffect(() => { playSfx('noticeboard'); }, []);
  useEffect(() => { load(); }, [tab, acc.signedIn]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!acc.signedIn) {
    return (
      <Screen style={{ padding: space.md, backgroundColor: CORK }}>
        <ObjectiveRibbon
          place="The Noticeboard"
          objective={challenge.line}
          style={{ marginBottom: space.sm }}
        />
        <FieldCard tone="paper" title="Empty cork">
          <PixelText size="tiny" color={tokens.textOnPaper} style={{ lineHeight: 15 }}>
            {acc.available
              ? 'Sign in and swap codes with a friend, and this board fills with the week you have both actually had.'
              : 'This copy has no server set up, so the noticeboard is empty. Everything else works as it always has.'}
          </PixelText>
        </FieldCard>
        <FieldCard
          tone="paper"
          title="Your bike log"
          caption="saved on this phone"
          style={{ marginTop: space.sm }}
        >
          <PixelText size="small" color={tokens.textOnPaper}>
            {(localWeek.cyclingMi || 0).toFixed(1)} mi · {localWeek.rides || 0} {localWeek.rides === 1 ? 'ride' : 'rides'} this week
          </PixelText>
          <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 6, lineHeight: 15 }}>
            Bike mileage is cardio history only. It never adds trail progress or Quest Credits.
          </PixelText>
        </FieldCard>
        <View style={{ marginTop: 'auto' }}>
          {acc.available ? (
            <TrailAction
              label="Sign in"
              tone="primary"
              onPress={() => { playSfx('confirm'); navigate('friends'); }}
              style={{ marginTop: space.md }}
            />
          ) : null}
          <TrailAction
            label={back.label}
            tone="quiet"
            onPress={() => { playSfx('cancel'); goBack(); }}
            style={{ marginTop: space.sm }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: space.md, backgroundColor: CORK }}>
      <ObjectiveRibbon
        place="The Noticeboard"
        objective={weekChallenge(todayKey()).line}
        style={{ marginBottom: space.sm }}
      />

      <View style={{ flexDirection: 'row', marginBottom: space.sm }}>
        {BOARDS.map((b, i) => (
          <TrailAction
            key={b.id}
            label={b.tab}
            tone={tab === b.id ? 'primary' : 'paper'}
            selected={tab === b.id}
            onPress={() => { playSfx('board_tab'); setTab(b.id); }}
            style={{ flex: 1, marginRight: i < BOARDS.length - 1 ? 4 : 0 }}
          />
        ))}
      </View>

      <FieldCard tone="paper" title="This week's trail" caption={`week of ${challenge.weekStart} · resets Monday`} style={{ marginBottom: space.sm }}>
        <PixelText size="tiny" color={tokens.textOnPaper} style={{ lineHeight: 15 }}>
          {challenge.line} Display only — no extra XP, bond or Quest Credits. The {challenge.tab} column is the one that counts this week.
        </PixelText>
      </FieldCard>

      <FieldCard tone="paper" title="Your bike log" caption="saved on this phone" style={{ marginBottom: space.sm }}>
        <PixelText size="small" color={tokens.textOnPaper}>
          {(localWeek.cyclingMi || 0).toFixed(1)} mi · {localWeek.rides || 0} {localWeek.rides === 1 ? 'ride' : 'rides'} this week
        </PixelText>
        <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 6, lineHeight: 15 }}>
          The Bike board shares checked cycling miles with your accepted circle. No bike mile advances a trail or earns Quest Credits.
        </PixelText>
      </FieldCard>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'records' ? (
          <>
            <FieldCard tone="paper" title="Personal bests" caption="Best single set — not the biggest day">
              <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ lineHeight: 15 }}>
                One card per set. Being beaten here is useful information, not a position.
              </PixelText>
            </FieldCard>
            {(records || []).flatMap((m) =>
              m.entries.map((e, i) => (
                <FieldCard
                  key={`${m.movementId}-${e.id}-${i}`}
                  tone="paper"
                  title={(getMovement(m.movementId) || {}).name || m.movementId}
                  caption={`${e.name}${e.you ? ' (you)' : ''}`}
                  accent={e.you ? tokens.accent : undefined}
                  style={{ marginTop: space.sm }}
                >
                  <PixelText size="small" color={tokens.textOnPaper}>{describeRecord(e)}</PixelText>
                </FieldCard>
              ))
            )}
            {records && !records.length ? (
              <PixelText size="tiny" color={tokens.textOnDark} style={{ marginTop: space.md, lineHeight: 15 }}>
                No bests yet. Log a session in the Forge with the weight you actually lifted
                and it lands here.
              </PixelText>
            ) : null}
          </>
        ) : (
          <>
            <FieldCard
              tone="paper"
              title={board ? board.label : 'Loading...'}
              caption={board ? `week of ${board.weekStart} · resets Monday` : undefined}
            >
              <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ lineHeight: 15 }}>
                This week among people you chose. Total miles, bike miles, days and
                sessions only — no lifetime total, no day-one score.
              </PixelText>
            </FieldCard>
            {board && board.rows.map((r) => <WeekRow key={r.id} row={r} />)}
            {board && board.rows.length === 1 ? (
              <PixelText size="tiny" color={tokens.textOnDark} style={{ marginTop: space.md, lineHeight: 15 }}>
                Just you so far. Swap trail codes with someone and you will both show up here.
              </PixelText>
            ) : null}
          </>
        )}

        {acc.error ? (
          <PixelText size="tiny" color={tokens.danger} style={{ marginTop: space.md, lineHeight: 14 }}>
            {acc.error}
          </PixelText>
        ) : null}
      </ScrollView>

      <View style={{ marginTop: space.sm }}>
        <TrailAction
          label="Friends and codes"
          tone="paper"
          onPress={() => { playSfx('confirm'); navigate('friends'); }}
        />
        <TrailAction
          label={back.label}
          tone="quiet"
          onPress={() => { playSfx('cancel'); goBack(); }}
          style={{ marginTop: space.sm }}
        />
      </View>
    </Screen>
  );
}
