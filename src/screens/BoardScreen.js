// The noticeboard: how this week is going, among the people you chose.
//
// Three of the four boards reset every Monday, deliberately. An all-time board
// ranks seniority — whoever installed the app first wins for ever, and a friend
// who joins in March is permanently last no matter how well they train. A week
// gives everybody the same empty column on Monday morning.
//
// Personal bests are the exception and are not weekly, because a best is a
// best. They are also the one board where being beaten is useful information
// rather than just a position.

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, ProgressBar } from '../components';
import { palette, space } from '../theme';
import { useAccount } from '../state/account';
import { useNav } from './navContext';
import api from '../net/api';
import { getMovement } from '../data/movements';

const BOARDS = [
  { id: 'distance', tab: 'Miles' },
  { id: 'active', tab: 'Days' },
  { id: 'workouts', tab: 'Sessions' },
  { id: 'records', tab: 'Bests' },
];

function Row({ row, best }) {
  const share = best > 0 ? Math.max(0.04, row.value / best) : 0;
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PixelText size="tiny" color={row.you ? palette.secondary : palette.windowText}>
          {`${row.rank}. ${row.name}${row.you ? ' (you)' : ''}`}
        </PixelText>
        <PixelText size="tiny" color={row.you ? palette.secondary : palette.windowText}>
          {row.display}
        </PixelText>
      </View>
      <ProgressBar
        value={share}
        max={1}
        height={8}
        color={row.you ? palette.secondary : palette.primary}
        style={{ marginTop: 4 }}
      />
      {/* Said out loud rather than folded in: a week a phone counted and a week
          somebody typed are not the same claim. */}
      {row.selfReported ? (
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 3 }}>
          includes self-reported days
        </PixelText>
      ) : null}
    </View>
  );
}

function describeRecord(e) {
  if (e.kind === 'hold') return `${Math.round(e.amount)}s`;
  if (e.weight) return `${Math.round(e.weight)} lb x ${Math.round(e.amount)}`;
  return `${Math.round(e.amount)} reps`;
}

export default function BoardScreen() {
  const { goBack, back, navigate } = useNav();
  const acc = useAccount();
  const [tab, setTab] = useState('distance');
  const [board, setBoard] = useState(null);
  const [records, setRecords] = useState(null);

  const load = useCallback(async () => {
    if (!acc.signedIn) return;
    if (tab === 'records') {
      const out = await acc.run(() => api.records(acc.token));
      setRecords(out ? out.movements || [] : []);
    } else {
      const out = await acc.run(() => api.board(acc.token, tab));
      setBoard(out);
    }
  }, [acc, tab]);

  useEffect(() => { load(); }, [tab, acc.signedIn]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!acc.signedIn) {
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
          The Noticeboard
        </PixelText>
        <Window tone="cream" pad={12}>
          <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 15 }}>
            {acc.available
              ? 'Sign in and swap codes with a friend, and this board fills with the week you have both actually had.'
              : 'This copy has no server set up, so the noticeboard is empty. Everything else works as it always has.'}
          </PixelText>
        </Window>
        {acc.available ? (
          <PixelButton label="Sign in" tone="primary" onPress={() => navigate('friends')} style={{ marginTop: space.md }} />
        ) : null}
        <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
      </Screen>
    );
  }

  const best = board && board.rows.length ? Math.max(...board.rows.map((r) => r.value)) : 0;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        The Noticeboard
      </PixelText>

      <View style={{ flexDirection: 'row', marginBottom: space.sm }}>
        {BOARDS.map((b, i) => (
          <PixelButton
            key={b.id}
            label={b.tab}
            tone={tab === b.id ? 'primary' : 'plain'}
            size="small"
            sound="cursor"
            onPress={() => setTab(b.id)}
            style={{ flex: 1, marginRight: i < BOARDS.length - 1 ? 4 : 0, paddingHorizontal: 2 }}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'records' ? (
          <Window tone="cream" pad={12}>
            <PixelText size="small" color={palette.accentDark}>Personal bests</PixelText>
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4 }}>
              Best single set — not the biggest day
            </PixelText>
            {(records || []).map((m) => (
              <View key={m.movementId} style={{ marginTop: 12 }}>
                <PixelText size="tiny" color={palette.windowText}>
                  {(getMovement(m.movementId) || {}).name || m.movementId}
                </PixelText>
                {m.entries.map((e, i) => (
                  <View key={e.id + i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <PixelText size="tiny" color={e.you ? palette.secondary : palette.windowTextDim}>
                      {`${e.name}${e.you ? ' (you)' : ''}`}
                    </PixelText>
                    <PixelText size="tiny" color={e.you ? palette.secondary : palette.windowText}>
                      {describeRecord(e)}
                    </PixelText>
                  </View>
                ))}
              </View>
            ))}
            {records && !records.length ? (
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 10, lineHeight: 15 }}>
                No bests yet. Log a session in the Forge with the weight you actually lifted
                and it lands here.
              </PixelText>
            ) : null}
          </Window>
        ) : (
          <Window tone="cream" pad={12}>
            <PixelText size="small" color={palette.accentDark}>{board ? board.label : 'Loading...'}</PixelText>
            {board ? (
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4 }}>
                {`week of ${board.weekStart} · resets Monday`}
              </PixelText>
            ) : null}
            {board && board.rows.map((r) => <Row key={r.id} row={r} best={best} />)}
            {board && board.rows.length === 1 ? (
              <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 12, lineHeight: 15 }}>
                Just you so far. Swap trail codes with someone and you will both show up here.
              </PixelText>
            ) : null}
          </Window>
        )}

        {acc.error ? (
          <PixelText size="tiny" color={palette.danger} style={{ marginTop: space.md, lineHeight: 14 }}>
            {acc.error}
          </PixelText>
        ) : null}

        <PixelButton label="Friends and codes" tone="plain" size="small"
          onPress={() => navigate('friends')} style={{ marginTop: space.md }} />
      </ScrollView>

      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
