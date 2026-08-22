// Your companion's condition, at a glance, wherever you are standing.
//
// This used to be a strip that only Maple Lane bothered to draw, so the moment
// you stepped indoors you lost sight of the thing the whole game is about. It
// belongs on every walkable screen: the panel under the world is exactly the
// space for it, and it is the reason that space is not empty.

import React from 'react';
import { View } from 'react-native';
import PixelSprite from './PixelSprite';
import PixelText from './PixelText';
import ProgressBar from './ProgressBar';
import { palette, space, tokens } from '../theme';

export default function CompanionStatus({ companion, stats, style }) {
  if (!companion) {
    return (
      <View style={style}>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ lineHeight: 14 }}>
          No companion yet — Coach Maple is waiting in the Training Hall.
        </PixelText>
      </View>
    );
  }

  // useCompanion already decorates level, maxHp and the XP split — recomputing
  // them here would be a second source of truth for the same numbers.
  const maxHp = companion.maxHp || Math.max(1, Math.round(companion.hp));
  const hpPart = Math.max(0, Math.min(1, companion.hp / maxHp));

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <PixelSprite
        spriteKey={companion.creature.sprite}
        palette={companion.creature.palette}
        size={44}
        bob
      />
      <View style={{ flex: 1, marginLeft: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <PixelText size="tiny" color={palette.secondary}>
            {companion.creature.name}
          </PixelText>
          <PixelText size="tiny" color={tokens.textOnDarkDim}>
            {`Lv.${companion.level}`}
          </PixelText>
        </View>

        {/* Resolve and Growth are the two meters the game is built on, so they
            are the two that travel with you. */}
        <ProgressBar
          value={companion.hp}
          max={maxHp}
          color={hpPart > 0.5 ? palette.hpHigh : hpPart > 0.22 ? palette.hpMid : palette.hpLow}
          height={10}
          showText={false}
          style={{ marginTop: 5 }}
        />
        <ProgressBar
          value={companion.xpInto}
          max={companion.xpNeeded}
          color={palette.xp}
          height={6}
          showText={false}
          style={{ marginTop: 4 }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
          <PixelText size="tiny" color={tokens.resolve}>{`BOND ${companion.bond}`}</PixelText>
          <PixelText size="tiny" color={palette.windowFill}>
            {`${Math.round(companion.hp)}/${maxHp} HP`}
          </PixelText>
        </View>
        {/* What you have actually done, since that is what moved the meters
            above it. */}
        {stats ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <PixelText size="tiny" color={tokens.textOnDarkDim}>
              {`${stats.totalSteps.toLocaleString()} steps`}
            </PixelText>
            <PixelText size="tiny" color={tokens.textOnDarkDim}>
              {`${(stats.distanceMi || 0).toFixed(1)} mi`}
            </PixelText>
            <PixelText size="tiny" color={tokens.textOnDarkDim}>
              {`${stats.workouts || 0} ${stats.workouts === 1 ? 'session' : 'sessions'}`}
            </PixelText>
          </View>
        ) : null}
      </View>
    </View>
  );
}
