// Creature Index — your collection, styled like a handheld data readout.
// Owned entries expand: habitat, evolution line, discovery, personality.
// The chrome is still Window + PixelText. Nothing here restyles the rest of the game.

import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { INDEX_ORDER, getCreature, CREATURE_TYPES, familyOf } from '../data/creatures';
import { isCreatureLocked, getRoute, creatureTrailId } from '../data/routes';
import { personalityOf, bondMilestone } from '../data/personality';

const SILHOUETTE = ['transparent', palette.ink, palette.ink, palette.ink, palette.ink, palette.ink, palette.ink];

function habitatOf(id) {
  const c = getCreature(id);
  if (c && (c.trail || c.routeName)) {
    return [c.routeName, c.trail].filter(Boolean).join(' · ');
  }
  const routeId = creatureTrailId(id);
  const route = routeId ? getRoute(routeId) : null;
  if (!route) return null;
  return [route.region, route.name, route.biomeName].filter(Boolean).join(' · ');
}

function nodeShown(cid, id, status, dex) {
  if (cid === id && (status === 'owned' || status === 'seen')) return true;
  const s = dex && dex[cid];
  return s === 'owned' || s === 'seen';
}

function Entry({ id, status, locked, expanded, onToggle, partyBond, dex }) {
  const c = getCreature(id);
  const known = !locked && (status === 'owned' || status === 'seen');
  const typeLabel = c.type && CREATURE_TYPES[c.type];
  const chain = familyOf(id);
  const p = known ? personalityOf(c) : null;
  const habitat = habitatOf(id);

  return (
    <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          locked
            ? 'A later trail. Not yet unlocked.'
            : known
              ? `${c.name}. ${status === 'owned' ? 'Owned' : 'Seen'}. ${c.species || ''}. Tap for details.`
              : 'Unknown companion. Not yet discovered. Tap for a hint.'
        }
        onPress={onToggle}
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
              <PixelText size="tiny" color={palette.windowTextDim}>LOCKED</PixelText>
            ) : status === 'owned' ? (
              <PixelText size="tiny" color={palette.success}>OWNED</PixelText>
            ) : status === 'seen' ? (
              <PixelText size="tiny" color={palette.accentDark}>SEEN</PixelText>
            ) : (
              <PixelText size="tiny" color={palette.windowTextDim}>UNKNOWN</PixelText>
            )}
          </View>
          {known ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
              {c.species}{typeLabel ? ` · ${typeLabel}` : ''}
            </PixelText>
          ) : (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6 }}>
              {locked ? 'a later trail' : 'not yet discovered'}
            </PixelText>
          )}
          {known && habitat ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 4 }}>
              {habitat}
            </PixelText>
          ) : null}
        </View>
      </Pressable>

      {expanded && !locked ? (
        <View style={{ marginTop: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: palette.windowFrame }}>
          {chain.length > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {chain.map((cid, i) => {
                const node = getCreature(cid);
                const show = nodeShown(cid, id, status, dex);
                return (
                  <View key={cid} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {i > 0 ? (
                      <PixelText size="tiny" color={palette.windowTextDim} style={{ marginHorizontal: 4 }}>→</PixelText>
                    ) : null}
                    <View style={{ alignItems: 'center', width: 52 }}>
                      <PixelSprite
                        spriteKey={node.sprite}
                        palette={show ? node.palette : SILHOUETTE}
                        size={40}
                      />
                      <PixelText size="tiny" color={palette.windowTextDim} numberOfLines={1}>
                        {show ? node.name : '???'}
                      </PixelText>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {status === 'owned' && c.flavor ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ lineHeight: 14, marginBottom: 6 }}>
              {c.flavor}
            </PixelText>
          ) : null}

          {status === 'owned' && c.passive ? (
            <PixelText size="tiny" color={palette.accentDark} style={{ lineHeight: 14, marginBottom: 6 }}>
              {c.passive.name}: {c.passive.text}
            </PixelText>
          ) : null}

          {status === 'owned' && p ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ lineHeight: 14, marginBottom: 4 }}>
              {p.tendency}
              {p.likes && p.likes.length ? ` · likes ${p.likes[0]}` : ''}
            </PixelText>
          ) : null}

          {status === 'owned' && partyBond != null ? (
            <PixelText size="tiny" color={palette.success} style={{ marginBottom: 4 }}>
              Bond {partyBond}{bondMilestone(c, partyBond) ? ` · ${bondMilestone(c, partyBond)}` : ''}
            </PixelText>
          ) : null}

          {c.evolveNeed && c.evolveNeed.behavior && status === 'owned' ? (
            <PixelText size="tiny" color={palette.windowTextDim}>
              Grows with: {c.evolveNeed.behavior.hint}
            </PixelText>
          ) : null}

          {!known && c.encounter && c.encounter.hint ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ lineHeight: 14 }}>
              Hint: {c.encounter.hint}
            </PixelText>
          ) : null}
        </View>
      ) : null}
    </Window>
  );
}

export default function IndexScreen() {
  const { state } = useGame();
  const { goBack, back } = useNav();
  const order = INDEX_ORDER;
  const owned = order.filter((id) => state.dex[id] === 'owned').length;
  const seen = order.filter((id) => state.dex[id] === 'seen').length;
  const [open, setOpen] = useState(null);

  const bondById = {};
  (state.party || []).forEach((m) => {
    if (m && m.id) bondById[m.id] = m.bond;
  });

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Creature Index
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.md }}>
        Owned {owned} · Seen {seen} · Total {order.length} · tap a row
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        {order.map((id) => {
          const status = state.dex[id] || 'unknown';
          const locked = isCreatureLocked(id, state.trails) && status !== 'owned';
          return (
            <Entry
              key={id}
              id={id}
              status={status}
              locked={locked}
              expanded={open === id}
              onToggle={() => setOpen(open === id ? null : id)}
              partyBond={bondById[id]}
              dex={state.dex}
            />
          );
        })}
      </ScrollView>
      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
