// Objective Ribbon — one line naming where you are and the single next action.
//
// The immediate objective was only ever communicated through hint text buried
// in a lower pane, so a new player standing on Sunkist Lane had no way to know
// that "meet Coach Maple inside Quest Fitness" was the next thing. This
// carries exactly one instruction; when there is nothing to do it says so
// rather than inventing filler.

import React from 'react';
import { View } from 'react-native';
import PixelText from './PixelText';
import Triangle from './Triangle';
import { tokens, scale } from '../theme';

export default function ObjectiveRibbon({ place, objective, tone = 'grove', style }) {
  const stripe = tone === 'ember' ? tokens.resolve : tone === 'sky' ? tokens.growth : tokens.growthDeep;

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={objective ? `${place}. Next: ${objective}` : place}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: tokens.surfaceRaised,
          borderColor: tokens.line,
          borderWidth: 2,
          borderRadius: scale.radius.small,
          paddingVertical: scale.gap.sm,
          paddingHorizontal: scale.gap.md,
        },
        style,
      ]}
    >
      <View style={{ width: scale.unit, alignSelf: 'stretch', backgroundColor: stripe, marginRight: scale.gap.md }} />
      <View style={{ flex: 1 }}>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ letterSpacing: 1 }}>
          {String(place || '').toUpperCase()}
        </PixelText>
        {objective ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale.gap.xs }}>
            {/* the font has no arrow glyph, so the marker is a drawn triangle */}
            <Triangle size={5} color={tokens.accent} direction="right" />
            <PixelText size="tiny" color={tokens.textOnDark} style={{ marginLeft: scale.gap.sm, lineHeight: 14, flex: 1 }}>
              {objective}
            </PixelText>
          </View>
        ) : null}
      </View>
    </View>
  );
}
