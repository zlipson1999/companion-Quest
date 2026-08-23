// Your companion's condition, at a glance, wherever you are standing.
//
// This used to be a strip that only Sunkist Lane bothered to draw, so the moment
// you stepped indoors you lost sight of the thing the whole game is about. It
// belongs on every walkable screen: the panel under the world is exactly the
// space for it, and it is the reason that space is not empty.

import React from 'react';
import { View } from 'react-native';
import PixelSprite from './PixelSprite';
import PixelText from './PixelText';
import ProgressBar from './ProgressBar';
import { palette, space, tokens } from '../theme';
import { idleLine, encourageLine } from '../data/personality';

export default function CompanionStatus({ companion, stats, style }) {
  if (!companion) {
    return (
      <View
        style={style}
        accessibilityRole="text"
        accessibilityLabel="No companion yet — Coach Maple is waiting at Quest Fitness."
      >
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ lineHeight: 14 }}>
          No companion yet — Coach Maple is waiting at Quest Fitness.
        </PixelText>
      </View>
    );
  }

  // useCompanion already decorates level, maxHp and the XP split — recomputing
  // them here would be a second source of truth for the same numbers.
  const maxHp = companion.maxHp || Math.max(1, Math.round(companion.hp));
  const hpPart = Math.max(0, Math.min(1, companion.hp / maxHp));
  const mood = companion.creature
    ? (idleLine(companion.creature) || encourageLine(companion.creature))
    : null;

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
          <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 4 }}>
            {[
              `${(stats.totalSteps || 0).toLocaleString()} steps`,
              `${(stats.distanceMi || 0).toFixed(1)} mi`,
              `${stats.workoutsDone || 0} ${stats.workoutsDone === 1 ? 'session' : 'sessions'}`,
            ].join('  ·  ')}
          </PixelText>
        ) : null}
        {mood ? (
          <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 3 }} numberOfLines={2}>
            {mood}
          </PixelText>
        ) : null}
      </View>
    </View>
  );
}
