// Creature Index — collection as family rows (three forms each).
// Uses the existing handheld chrome (Screen, Window, PixelText, PixelSprite).
// Does not restyle Hub, Title, Battle, or any other screen.

import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import {
  INDEX_ORDER,
  WILD_COMPANION_IDS,
  OBSTACLE_IDS,
  getCreature,
  CREATURE_TYPES,
  familyChain,
} from '../data/creatures';
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

function nodeKnown(cid, dex, trails) {
  const status = (dex && dex[cid]) || 'unknown';
  const locked = isCreatureLocked(cid, trails) && status !== 'owned';
  return !locked && (status === 'owned' || status === 'seen');
}

function FamilyRow({ rootId, dex, trails, expanded, onToggle, partyBond }) {
  const chain = familyChain(rootId);
  const root = getCreature(rootId);
  const anyKnown = chain.some((cid) => nodeKnown(cid, dex, trails));
  const familyLocked = chain.every((cid) => {
    const status = (dex && dex[cid]) || 'unknown';
    return isCreatureLocked(cid, trails) && status !== 'owned';
  });
  const focus = chain.find((cid) => nodeKnown(cid, dex, trails)) || rootId;
  const c = getCreature(focus);
  const status = (dex && dex[focus]) || 'unknown';
  const typeLabel = c.type && CREATURE_TYPES[c.type];
  const p = anyKnown ? personalityOf(c) : null;
  const habitat = habitatOf(focus);

  return (
    <Window tone="cream" pad={12} style={{ marginBottom: space.sm }}>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          familyLocked
            ? 'A later trail. Not yet unlocked.'
            : anyKnown
              ? `${c.name} family. Tap for details.`
              : 'Unknown companion family.'
        }
        onPress={onToggle}
        style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}
      >
        {chain.map((cid) => {
          const node = getCreature(cid);
          const known = nodeKnown(cid, dex, trails);
          return (
            <View key={cid} style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                <PixelSprite
                  spriteKey={node.sprite}
                  palette={known ? node.palette : SILHOUETTE}
                  size={64}
                />
              </View>
              <PixelText size="tiny" color={palette.windowTextDim} numberOfLines={1}>
                {known ? node.name : ' '}
              </PixelText>
            </View>
          );
        })}
      </Pressable>

      {expanded && !familyLocked ? (
        <View style={{ marginTop: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: palette.windowFrame }}>
          {anyKnown ? (
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginBottom: 6 }}>
              {c.species}{typeLabel ? ` · ${typeLabel}` : ''}
              {habitat ? ` · ${habitat}` : ''}
            </PixelText>
          ) : (
            <PixelText size="tiny" color={palette.windowTextDim}>
              not yet discovered
            </PixelText>
          )}

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

          {!anyKnown && c.encounter && c.encounter.hint ? (
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

  const families = [...WILD_COMPANION_IDS, ...OBSTACLE_IDS];

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Creature Index
      </PixelText>
      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginBottom: space.md }}>
        Owned {owned} · Seen {seen} · Total {order.length} · tap a family
      </PixelText>
      <ScrollView showsVerticalScrollIndicator={false}>
        {families.map((rootId) => (
          <FamilyRow
            key={rootId}
            rootId={rootId}
            dex={state.dex}
            trails={state.trails}
            expanded={open === rootId}
            onToggle={() => setOpen(open === rootId ? null : rootId)}
            partyBond={bondById[rootId]}
          />
        ))}
      </ScrollView>
      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
