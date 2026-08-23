// Creature Index — your collection, styled like a handheld data readout.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { INDEX_ORDER, getCreature, CREATURE_TYPES } from '../data/creatures';
import { isCreatureLocked } from '../data/routes';

const SILHOUETTE = ['transparent', palette.ink, palette.ink, palette.ink, palette.ink, palette.ink, palette.ink];

function Entry({ id, status, locked }) {
  const c = getCreature(id);
  const known = !locked && (status === 'owned' || status === 'seen');
  const typeLabel = c.type && CREATURE_TYPES[c.type];
  return (
    <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={
          locked
            ? 'A later trail. Not yet unlocked.'
            : known
              ? `${c.name}. ${status === 'owned' ? 'Owned' : 'Seen'}. ${c.species || ''}`
              : 'Unknown companion. Not yet discovered.'
        }
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
          <PixelSprite spriteKey={c.sprite} palette={known ? c.palette : SILHOUETTE} size={56} />
        </View>
        <View style={{ flex: 1, marginLeft: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="body" color={palette.windowText}>
              {known ? c.name : '???'}
            </PixelText>
            {locked ? (
              <PixelText size="tiny" color={palette.windowTextDim}>
                LOCKED
              </PixelText>
            ) : status === 'owned' ? (
              <PixelText size="tiny" color={palette.success}>
                OWNED
              </PixelText>
            ) : status === 'seen' ? (
              <PixelText size="tiny" color={palette.accentDark}>
                SEEN
              </PixelText>
            ) : null}
          </View>
          {known ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
              {c.species}{typeLabel ? ` · ${typeLabel}` : ''}{c.trail ? ` · ${c.trail}` : ''}
            </PixelText>
          ) : (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
              {locked ? 'a later trail' : (c.encounter && c.encounter.hint) ? c.encounter.hint : 'not yet discovered'}
            </PixelText>
          )}
          {known && c.evolvesTo ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4 }}>
              {`grows into ${c.evolvesTo}`}
            </PixelText>
          ) : null}
          {status === 'owned' && c.passive ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 14 }}>
              {`${c.passive.name}. ${c.passive.text}`}
            </PixelText>
          ) : null}
          {status === 'owned' && c.flavor ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 14 }}>
              {c.flavor}
            </PixelText>
          ) : null}
          {status === 'owned' && c.personality ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 14 }}>
              {c.personality.tendency}
            </PixelText>
          ) : null}
        </View>
      </View>
    </Window>
  );
}

export default function IndexScreen() {
  const { state } = useGame();
  const { goBack, back } = useNav();
  const order = INDEX_ORDER;
  const owned = order.filter((id) => state.dex[id] === 'owned').length;
  const seen = order.filter((id) => state.dex[id] === 'seen').length;

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Creature Index
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.md }}>
        Owned {owned} · Seen {seen} · Total {order.length}
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        {order.map((id) => {
          const status = state.dex[id] || 'unknown';
          // A companion you already travel with is never a silhouette, even
          // if its trail is still the next one along (older saves).
          const locked = isCreatureLocked(id, state.trails) && status !== 'owned';
          return <Entry key={id} id={id} status={status} locked={locked} />;
        })}
      </ScrollView>
      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
