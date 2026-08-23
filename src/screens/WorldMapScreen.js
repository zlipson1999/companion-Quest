// World Map / Region Journey.
//
// The 11 regions are data in regions.js, but until now the only way to pick a
// trail was a flat chip list inside the Route menu. That list does not show
// locked vs open, regional Quest Pins, biomes, or which companions live where.
//
// This screen is the journal for the wider world:
//   World → Region → Trail
// Selecting an unlocked trail sets it active and opens the existing Route
// screen. Nothing here changes how walking, Wardens, or pins work.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Screen, PixelText, FieldCard, TrailAction, ObjectiveRibbon, PixelSprite,
} from '../components';
import { palette, space, tokens, scale } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import {
  REGIONS, getRegion, regionIdForTrail, regionBadgeEarned,
} from '../data/regions';
import {
  getRoute, isTrailUnlocked, normalizeTrails, creatureTrailId,
} from '../data/routes';
import { getCreature } from '../data/creatures';
import { sceneTone } from '../data/sceneSky';
import { playSfx } from '../audio';

const SILHOUETTE = [
  'transparent', palette.ink, palette.ink, palette.ink,
  palette.ink, palette.ink, palette.ink,
];

function trailIdsOf(region) {
  if (!region) return [];
  if (region.generated && Array.isArray(region.trails)) {
    return region.trails.map((t) => t.id);
  }
  return region.trailIds || [];
}

function regionOpen(region, trails) {
  if (!region) return false;
  if (region.id === 'grove') return true;
  const ids = trailIdsOf(region);
  if (!ids.length) return false;
  return isTrailUnlocked(ids[0], trails);
}

function regionStatus(region, trails) {
  if (regionBadgeEarned(trails, region.id)) return 'complete';
  if (regionOpen(region, trails)) return 'open';
  return 'locked';
}

function statusLabel(status) {
  if (status === 'complete') return 'PIN EARNED';
  if (status === 'open') return 'OPEN';
  return 'LOCKED';
}

function statusColor(status) {
  if (status === 'complete') return palette.success;
  if (status === 'open') return palette.secondary;
  return palette.windowTextDim;
}

function unlockHint(region) {
  if (!region || region.id === 'grove') return 'Always open.';
  const pinTrail = region.unlock ? getRoute(region.unlock) : null;
  if (pinTrail) return `Opens with the ${pinTrail.pinName}.`;
  return region.progress && region.progress.open ? region.progress.open : 'Not yet open.';
}

function BiomeStrip({ toneId }) {
  const tone = sceneTone(toneId);
  const bands = [tone.zenith, tone.sky, tone.haze, tone.groundFar, tone.ground];
  return (
    <View style={{ flexDirection: 'row', height: 10, borderRadius: 2, overflow: 'hidden', borderWidth: 1, borderColor: tokens.line }}>
      {bands.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}

function PinChip({ earned, name }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 6,
        borderWidth: 2,
        borderColor: earned ? tokens.accent : tokens.line,
        backgroundColor: earned ? tokens.surfaceRaised : tokens.surfaceSunken,
        borderRadius: scale.radius.small,
      }}
    >
      <PixelText size="tiny" color={earned ? tokens.accent : tokens.disabledInk}>
        {earned ? name : '· · ·'}
      </PixelText>
    </View>
  );
}

function FaceRow({ familyIds, dex, trails }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
      {familyIds.map((id) => {
        const c = getCreature(id);
        if (!c) return null;
        const status = (dex && dex[id]) || 'unknown';
        const known = status === 'owned' || status === 'seen';
        const trailId = creatureTrailId(id);
        const locked = !!(trailId && !isTrailUnlocked(trailId, trails) && !known);
        return (
          <View key={id} style={{ width: 48, alignItems: 'center', marginRight: 4, marginBottom: 6 }}>
            <PixelSprite
              spriteKey={c.sprite}
              palette={known ? c.palette : SILHOUETTE}
              size={40}
            />
            <PixelText size="tiny" color={tokens.textOnPaperDim} numberOfLines={1}>
              {known ? c.name : locked ? '···' : '???'}
            </PixelText>
          </View>
        );
      })}
    </View>
  );
}

function WorldView({ trails, currentRegionId, onOpenRegion }) {
  return (
    <View>
      <FieldCard tone="ink" title="The wider walk" caption="Eleven regions. Pins open the next gate.">
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ lineHeight: 14 }}>
          The Grove is home. Horizon regions open from Grove pins. Clear a region's
          Warden for its Quest Badge.
        </PixelText>
      </FieldCard>

      {REGIONS.map((region, i) => {
        const status = regionStatus(region, trails);
        const here = region.id === currentRegionId;
        const badge = region.badge;
        const badgeEarned = regionBadgeEarned(trails, region.id);
        const toneId = (region.visual && region.visual.stageTone) || 'maple';
        const ids = trailIdsOf(region);
        const pinsEarned = ids.filter((tid) => trails.progress[tid] && trails.progress[tid].pin).length;

        return (
          <View key={region.id}>
            {i > 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                <PixelText size="tiny" color={tokens.textOnDarkDim}>↓</PixelText>
              </View>
            ) : <View style={{ height: space.sm }} />}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: status === 'locked' }}
              accessibilityLabel={`${region.name}. ${statusLabel(status)}. ${here ? 'Current region.' : ''}`}
              onPress={() => {
                playSfx('cursor');
                onOpenRegion(region.id);
              }}
            >
              <FieldCard
                tone={status === 'locked' ? 'ink' : 'paper'}
                title={region.name}
                caption={status === 'locked' ? unlockHint(region) : region.identity}
                accent={here ? tokens.accent : status === 'complete' ? tokens.growth : undefined}
                style={{ opacity: status === 'locked' ? 0.72 : 1 }}
              >
                <BiomeStrip toneId={toneId} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                  <PixelText size="tiny" color={statusColor(status)}>
                    {statusLabel(status)}{here ? ' · HERE' : ''}
                  </PixelText>
                  <PixelText size="tiny" color={tokens.textOnPaperDim}>
                    {pinsEarned}/{ids.length || 0} pins
                    {badge ? ` · ${badgeEarned ? badge.name : '—'}` : ''}
                  </PixelText>
                </View>
              </FieldCard>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function RegionView({ region, trails, dex, currentTrailId, onPickTrail, onBack }) {
  const status = regionStatus(region, trails);
  const ids = trailIdsOf(region);
  const badgeEarned = regionBadgeEarned(trails, region.id);
  const families = (region.ecology && region.ecology.families) || [];
  const toneId = (region.visual && region.visual.stageTone) || 'maple';

  return (
    <View>
      <FieldCard tone="paper" title={region.name} caption={region.identity}>
        <BiomeStrip toneId={toneId} />
        <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 8, lineHeight: 14 }}>
          {region.visual && region.visual.palette ? `Palette · ${region.visual.palette}` : ''}
        </PixelText>
        <PixelText size="tiny" color={statusColor(status)} style={{ marginTop: 6 }}>
          {statusLabel(status)}
          {status === 'locked' ? ` · ${unlockHint(region)}` : ''}
        </PixelText>
        {region.progress && region.progress.finish ? (
          <PixelText size="tiny" color={tokens.textOnPaperDim} style={{ marginTop: 4, lineHeight: 14 }}>
            {region.progress.finish}
          </PixelText>
        ) : null}
      </FieldCard>

      <FieldCard tone="ink" title="Quest pins" style={{ marginTop: space.sm }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {ids.map((tid) => {
            const route = getRoute(tid);
            const earned = !!(trails.progress[tid] && trails.progress[tid].pin);
            return <PinChip key={tid} earned={earned} name={route.pinName || route.name} />;
          })}
          {region.badge ? (
            <PinChip earned={badgeEarned} name={region.badge.name} />
          ) : null}
        </View>
      </FieldCard>

      <FieldCard tone="paper" title="Companions of this region" caption="Silhouette until seen" style={{ marginTop: space.sm }}>
        <FaceRow familyIds={families} dex={dex} trails={trails} />
      </FieldCard>

      {region.landmarks && region.landmarks.length ? (
        <FieldCard tone="ink" title="Landmarks" style={{ marginTop: space.sm }}>
          {region.landmarks.map((lm) => (
            <View key={`${lm.trail}-${lm.name}`} style={{ marginBottom: 8 }}>
              <PixelText size="tiny" color={tokens.textOnDark}>{lm.name}</PixelText>
              <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ lineHeight: 13 }}>
                {lm.note}
              </PixelText>
            </View>
          ))}
        </FieldCard>
      ) : null}

      <FieldCard tone="paper" title="Trails" style={{ marginTop: space.sm }}>
        {ids.map((tid) => {
          const route = getRoute(tid);
          const unlocked = isTrailUnlocked(tid, trails);
          const prog = trails.progress[tid] || { miles: 0, reps: 0, pin: false };
          const active = tid === currentTrailId;
          const sub = unlocked
            ? `${route.miles} mi · ${route.reps} reps${prog.pin ? ` · ${route.pinName}` : ''}${route.biomeName ? ` · ${route.biomeName}` : ''}`
            : route.unlock
              ? `Needs ${getRoute(route.unlock).pinName}`
              : 'Locked';
          return (
            <TrailAction
              key={tid}
              label={route.name}
              sublabel={sub}
              tone={active ? 'primary' : unlocked ? 'paper' : 'quiet'}
              selected={active}
              disabled={!unlocked}
              onPress={() => onPickTrail(tid)}
              style={{ marginTop: 8 }}
            />
          );
        })}
      </FieldCard>

      <TrailAction label="Back to world" tone="quiet" onPress={onBack} style={{ marginTop: space.md }} />
    </View>
  );
}

export default function WorldMapScreen({ params = {} }) {
  const { state, dispatch } = useGame();
  const { navigate, goBack, back } = useNav();
  const trails = useMemo(() => normalizeTrails(state.trails), [state.trails]);
  const currentRegionId = regionIdForTrail(trails.activeId) || 'grove';

  const initialRegion = params.regionId && getRegion(params.regionId)
    ? params.regionId
    : null;
  const [focus, setFocus] = useState(initialRegion);

  const region = focus ? getRegion(focus) : null;

  const objective = region
    ? regionStatus(region, trails) === 'locked'
      ? unlockHint(region)
      : 'Pick a trail to walk'
    : 'Choose a region. Open trails lead on.';

  const pickTrail = (tid) => {
    if (!isTrailUnlocked(tid, trails)) return;
    playSfx('confirm');
    dispatch({ type: 'SET_TRAIL', payload: { routeId: tid } });
    navigate('route', { from: 'world' });
  };

  return (
    <Screen style={{ padding: space.md }}>
      <ObjectiveRibbon
        place={region ? region.name : 'World Map'}
        objective={objective}
        tone={region && region.id === 'redmesa' ? 'ember' : 'grove'}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.md }}>
        {region ? (
          <RegionView
            region={region}
            trails={trails}
            dex={state.dex}
            currentTrailId={trails.activeId}
            onPickTrail={pickTrail}
            onBack={() => setFocus(null)}
          />
        ) : (
          <WorldView
            trails={trails}
            currentRegionId={currentRegionId}
            onOpenRegion={(id) => setFocus(id)}
          />
        )}
        <View style={{ height: space.sm }} />
      </ScrollView>

      {!region ? (
        <TrailAction label={back.label} tone="quiet" onPress={goBack} style={{ marginTop: space.sm }} />
      ) : null}
    </Screen>
  );
}
