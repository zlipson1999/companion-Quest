// The reception desk, made a place: walking up IS the check-in — the first
// arrival of each local day is recorded with its time, attendance only, no
// reward attached — and the Quest Ledger offers free healthy-habit quests to
// pick up and turn in. Tokens are proof of completion, never money. Your
// full attendance record lives on the Phone, under Personal.

import React, { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion, gymLocalDayKey, gymCheckInStats } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { QUESTS, TOKENS, TOKEN_BY_ID, getQuest, questProgress, MAX_ACTIVE_QUESTS } from '../data/quests';
import { TOKEN_IMAGES } from '../data/tokenImages';
import { todayKey } from '../modules';

function TokenBadge({ tokenId, size = 44, dim = false }) {
  return (
    <Image
      source={TOKEN_IMAGES[tokenId]}
      resizeMode="contain"
      fadeDuration={0}
      style={{ width: size, height: size, opacity: dim ? 0.22 : 1 }}
    />
  );
}

function clockOf(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? 'am' : 'pm';
  return `${((h + 11) % 12) + 1}:${m} ${ampm}`;
}

export default function ReceptionScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { goBack, back } = useNav();
  const [phase, setPhase] = useState('desk');   // desk | ledger
  const [award, setAward] = useState(null);     // quest just turned in
  const today = todayKey();
  const quests = state.quests;

  // Walking up to the desk is the check-in. The reducer keeps only the FIRST
  // arrival per local day, so mounting again later today changes nothing.
  useEffect(() => {
    dispatch({ type: 'GYM_CHECK_IN', payload: { checkedAt: new Date().toISOString() } });
  }, [dispatch]);

  const todayVisit = (state.gymCheckIns || []).find((v) => v.day === gymLocalDayKey());
  const attendance = gymCheckInStats(state.gymCheckIns);

  const accept = (quest) => {
    dispatch({ type: 'ACCEPT_QUEST', payload: { questId: quest.id } });
    playSfx('confirm');
  };

  const turnIn = (quest) => {
    dispatch({ type: 'TURN_IN_QUEST', payload: { questId: quest.id } });
    playSfx('victory');
    setAward(quest);
  };

  const abandon = (quest) => {
    dispatch({ type: 'ABANDON_QUEST', payload: { questId: quest.id } });
    playSfx('cancel');
  };

  // The award moment: the Token, big, and what the week actually paid.
  if (award) {
    const token = TOKEN_BY_ID[award.tokenId];
    return (
      <Screen style={{ padding: space.md, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <TokenBadge tokenId={award.tokenId} size={180} />
          <PixelText size="heading" color={palette.secondary} align="center" style={{ marginTop: space.md }}>
            {token.name}
          </PixelText>
          <PixelText size="small" color={palette.windowFill} align="center" style={{ marginTop: space.sm, lineHeight: 16 }}>
            {award.name} — complete.
          </PixelText>
          <PixelText size="tiny" color={palette.windowFill} align="center" style={{ marginTop: space.sm, lineHeight: 14 }}>
            {companion ? `${companion.creature.name} gains ${award.rewardLine}.` : award.rewardLine}
          </PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: space.md, lineHeight: 14 }}>
            Maple: “That is a week that actually happened. The Token is yours — the habit is the real prize.”
          </PixelText>
        </View>
        <PixelButton label="Back to the desk" tone="gold" style={{ marginTop: space.lg }} onPress={() => setAward(null)} />
      </Screen>
    );
  }

  if (phase === 'ledger') {
    const activeIds = new Set(quests.active.map((a) => a.questId));
    const offered = QUESTS.filter((q) => !activeIds.has(q.id));
    const slotsFull = quests.active.length >= MAX_ACTIVE_QUESTS;
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
          Quest Ledger
        </PixelText>
        <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
          <PixelText size="tiny" color={palette.windowFill}>{`${quests.active.length}/${MAX_ACTIVE_QUESTS} active`}</PixelText>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4, lineHeight: 13 }}>
            Quests are free — pick one up, live it out there, come back to claim its Token. Tokens are proof of completion, not currency, and no credits change hands here.
          </PixelText>
        </Window>
        <ScrollView showsVerticalScrollIndicator={false}>
          {quests.active.map((active) => {
            const quest = getQuest(active.questId);
            if (!quest) return null;
            const prog = questProgress(quest, active, state, today);
            return (
              <Window key={quest.id} tone="cream" pad={12} style={{ marginBottom: space.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TokenBadge tokenId={quest.tokenId} size={44} />
                  <View style={{ flex: 1, marginLeft: space.sm }}>
                    <PixelText size="body" color={palette.windowText}>{quest.name}</PixelText>
                    <PixelText size="tiny" color={prog.expired ? palette.danger : palette.windowTextDim} style={{ marginTop: 2 }}>
                      {prog.expired ? 'Out of time — the week is gone' : `Until ${prog.endDay}`}
                    </PixelText>
                  </View>
                  {prog.done ? <PixelText size="tiny" color={palette.success}>READY</PixelText> : null}
                </View>
                {prog.reqs.map((r) => (
                  <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <PixelText size="tiny" color={r.done ? palette.success : palette.windowTextDim} style={{ flex: 1, lineHeight: 13 }}>
                      {(r.done ? '✓ ' : '· ') + r.label}
                    </PixelText>
                    <PixelText size="tiny" color={palette.windowText}>{`${Math.floor(r.have * 10) / 10}/${r.need}`}</PixelText>
                  </View>
                ))}
                {prog.done ? (
                  <PixelButton label={`Turn in — claim your ${TOKEN_BY_ID[quest.tokenId].name}`} tone="gold" size="small" style={{ marginTop: space.sm }} onPress={() => turnIn(quest)} />
                ) : (
                  <PixelButton label="Set it down (keeps your credits — nothing was paid)" tone="plain" size="tiny" sound="cancel" style={{ marginTop: space.sm }} onPress={() => abandon(quest)} />
                )}
              </Window>
            );
          })}

          <PixelText size="tiny" color={palette.windowFill} style={{ letterSpacing: 1, marginVertical: space.sm }}>
            ON THE BOARD
          </PixelText>
          {offered.map((quest) => (
            <Window key={quest.id} tone="cream" pad={12} style={{ marginBottom: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TokenBadge tokenId={quest.tokenId} size={44} />
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  <PixelText size="body" color={palette.windowText}>{quest.name}</PixelText>
                  <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 2 }}>
                    {`${TOKEN_BY_ID[quest.tokenId].category} · ${quest.days} days · reward: ${quest.rewardLine}`}
                  </PixelText>
                </View>
              </View>
              <PixelText size="tiny" color={palette.windowText} style={{ marginTop: 6, lineHeight: 13 }}>{quest.blurb}</PixelText>
              {quest.reqs.map((r) => (
                <PixelText key={r.label} size="tiny" color={palette.windowTextDim} style={{ marginTop: 3, lineHeight: 13 }}>
                  {'· ' + r.label}
                </PixelText>
              ))}
              <PixelButton
                label={slotsFull ? 'Quest slots full' : 'Accept quest — free'}
                tone={slotsFull ? 'plain' : 'gold'}
                size="small"
                disabled={slotsFull}
                style={{ marginTop: space.sm }}
                onPress={() => accept(quest)}
              />
            </Window>
          ))}
        </ScrollView>
        <PixelButton label="Back to the desk" tone="plain" sound="cancel" style={{ marginTop: space.sm }} onPress={() => setPhase('desk')} />
      </Screen>
    );
  }

  const earned = TOKENS.filter((t) => (quests.tokens[t.id] || 0) > 0).length;
  const readyCount = quests.active.filter((a) => {
    const q = getQuest(a.questId);
    return q && questProgress(q, a, state, today).done;
  }).length;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Reception
      </PixelText>
      <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
        <PixelText size="tiny" color={palette.windowFill} style={{ lineHeight: 13 }}>
          Walking up checked you in. The desk also holds the Quest Ledger — free quests to pick up and turn in. Progress and attendance live on your Phone.
        </PixelText>
      </Window>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="body" color={palette.windowText}>Checked In</PixelText>
            <PixelText size="tiny" color={palette.accentDark}>{`${attendance.totalDays} day${attendance.totalDays === 1 ? '' : 's'} total`}</PixelText>
          </View>
          <PixelText size="tiny" color={palette.success} style={{ marginTop: space.sm }}>
            {todayVisit ? `✓ Today at ${clockOf(todayVisit.checkedAt)} — first arrival of the day` : '…'}
          </PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, lineHeight: 13 }}>
            Attendance only — no reward attached, one record per day. Streaks and the full history are on your Phone under Personal.
          </PixelText>
        </Window>

        <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
          <PixelText size="body" color={palette.windowText}>Quest Ledger</PixelText>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4, lineHeight: 13 }}>
            {`Optional healthy-habit quests, free to pick up. ${quests.active.length} active${readyCount ? `, ${readyCount} ready to turn in` : ''}.`}
          </PixelText>
          <PixelButton label={readyCount ? `Open Ledger — ${readyCount} ready` : 'Open Ledger'} tone="gold" size="small" style={{ marginTop: space.sm }} onPress={() => { playSfx('confirm'); setPhase('ledger'); }} />
        </Window>

        {/* The showcase fills as categories are completed — quiet bragging. */}
        <Window tone="dark" pad={12} style={{ marginBottom: space.sm }}>
          <PixelText size="tiny" color={palette.windowFill} style={{ letterSpacing: 1 }}>TOKEN SHOWCASE</PixelText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
            {TOKENS.map((t) => (
              <TokenBadge key={t.id} tokenId={t.id} size={40} dim={!(quests.tokens[t.id] || 0)} />
            ))}
          </View>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: space.sm }}>
            {`${earned} of ${TOKENS.length} categories earned — proof of completion, not currency`}
          </PixelText>
        </Window>
      </ScrollView>
      <PixelButton label={back.label} tone="plain" sound="cancel" style={{ marginTop: space.sm }} onPress={goBack} />
    </Screen>
  );
}
