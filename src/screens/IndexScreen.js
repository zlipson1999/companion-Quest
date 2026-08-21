// Creature Index — your collection, styled like a handheld data readout.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { STARTER_IDS, WILD_COMPANION_IDS, OBSTACLE_IDS, getCreature } from '../data/creatures';

const SILHOUETTE = ['transparent', palette.ink, palette.ink, palette.ink, palette.ink, palette.ink, palette.ink];

function buildOrder() {
  const ids = [];
  STARTER_IDS.forEach((id) => {
    ids.push(id);
    const evo = getCreature(id).evolvesTo;
    if (evo) ids.push(evo);
  });
  WILD_COMPANION_IDS.filter((id) => !STARTER_IDS.includes(id)).forEach((id) => ids.push(id));
  OBSTACLE_IDS.forEach((id) => ids.push(id));
  return ids;
}

function Entry({ id, status }) {
  const c = getCreature(id);
  const known = status === 'owned' || status === 'seen';
  return (
    <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
          <PixelSprite spriteKey={c.sprite} palette={known ? c.palette : SILHOUETTE} size={56} />
        </View>
        <View style={{ flex: 1, marginLeft: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="body" color={palette.windowText}>
              {known ? c.name : '???'}
            </PixelText>
            {status === 'owned' ? (
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
              {c.species}
            </PixelText>
          ) : (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
              not yet discovered
            </PixelText>
          )}
          {status === 'owned' && c.flavor ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 14 }}>
              {c.flavor}
            </PixelText>
          ) : null}
        </View>
      </View>
    </Window>
  );
}

export default function IndexScreen() {
  const { state } = useGame();
  const { navigate } = useNav();
  const order = buildOrder();
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
        {order.map((id) => (
          <Entry key={id} id={id} status={state.dex[id] || 'unknown'} />
        ))}
      </ScrollView>
      <PixelButton label="Back to Town" tone="plain" sound="cancel" onPress={() => navigate('hub')} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
