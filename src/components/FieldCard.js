// Field Card — the one way information is presented.
//
// Screens had each grown their own bordered box, so a stat block, a plan and a
// habit row all looked like different kinds of thing for no reason. A Field
// Card is a titled panel on journal paper or field ink, with one hard offset
// shadow rather than a diffuse web blur, and stepped corners rather than the
// rounded-rectangle look of a generic mobile app.

import React from 'react';
import { View } from 'react-native';
import PixelText from './PixelText';
import { tokens, scale } from '../theme';

export default function FieldCard({
  title,
  caption,
  tone = 'ink',        // 'ink' (in the world) | 'paper' (a journal page)
  accent,              // optional left rule colour: use it to type the card
  children,
  style,
  ...rest
}) {
  const onPaper = tone === 'paper';
  const surface = onPaper ? tokens.sheet : tokens.surfaceRaised;
  const edge = onPaper ? tokens.sheetEdge : tokens.line;
  const titleColor = onPaper ? tokens.textOnPaper : tokens.textOnDark;
  const captionColor = onPaper ? tokens.textOnPaperDim : tokens.textOnDarkDim;

  return (
    <View style={[{ paddingBottom: scale.shadowOffset, paddingRight: scale.shadowOffset }, style]} {...rest}>
      {/* the offset shadow is a solid block behind the card, not a blur */}
      <View
        style={{
          position: 'absolute',
          left: scale.shadowOffset,
          top: scale.shadowOffset,
          right: 0,
          bottom: 0,
          backgroundColor: tokens.lineStrong,
          borderRadius: scale.radius.panel,
        }}
      />
      <View
        style={{
          backgroundColor: surface,
          borderColor: edge,
          borderWidth: 2,
          borderRadius: scale.radius.panel,
          padding: scale.gap.md,
        }}
      >
        {accent ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: scale.unit,
              backgroundColor: accent,
            }}
          />
        ) : null}
        {title ? (
          <PixelText size="tiny" color={titleColor} style={{ letterSpacing: 1 }}>
            {String(title).toUpperCase()}
          </PixelText>
        ) : null}
        {caption ? (
          <PixelText size="tiny" color={captionColor} style={{ marginTop: scale.gap.xs, lineHeight: 14 }}>
            {caption}
          </PixelText>
        ) : null}
        {children ? <View style={{ marginTop: title || caption ? scale.gap.sm : 0 }}>{children}</View> : null}
      </View>
    </View>
  );
}
