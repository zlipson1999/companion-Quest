// The battle status plate — the single most recognisable piece of furniture in
// a creature-battle screen: name and level on the top line, a tagged HP bar
// under it, and, for YOUR side only, a thin experience bar pinned along the
// bottom edge.
//
// Rebuilt as its own component rather than a generic Window so the proportions
// stay right: the bar is the widest thing on the plate, the level sits hard
// right, and the EXP strip runs the full width with no padding around it.

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import PixelText from './PixelText';
import BarFill from './BarFill';
import { palette } from '../theme';

function Bar({ ratio, color, height, track }) {
  const anim = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: ratio, duration: 350, useNativeDriver: false }).start();
  }, [ratio, anim]);
  return <BarFill ratioAnim={anim} color={color} height={height} trackColor={track} style={{ flex: 1 }} />;
}

export default function StatusPlate({
  name,
  level,
  hp,
  maxHp,
  xpInto,
  xpNeeded,
  showNumbers = false,
  tag,
  tagColor,
  style,
}) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const hpColor = ratio > 0.5 ? palette.hpHigh : ratio > 0.2 ? palette.hpMid : palette.hpLow;
  const mine = xpNeeded != null;

  return (
    <View style={[{ backgroundColor: palette.ink, padding: 1 }, style]}>
      <View style={{ backgroundColor: palette.windowFrame, padding: 3 }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: palette.windowFrameLight }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: palette.windowFrameDark }} />
        <View style={{ borderWidth: 1, borderColor: palette.inkSoft, backgroundColor: palette.bgAlt }}>
        <View style={{ paddingHorizontal: 8, paddingTop: 7, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <PixelText size="small" color={palette.windowFill} numberOfLines={1} style={{ flex: 1, marginRight: 6 }}>
              {name}
            </PixelText>
            {level != null ? (
              <PixelText size="tiny" color={palette.secondary}>
                Lv{level}
              </PixelText>
            ) : null}
            {tag ? (
              <PixelText size="tiny" color={tagColor || palette.danger}>
                {tag}
              </PixelText>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
            <PixelText size="tiny" color={palette.secondary} style={{ marginRight: 5 }}>
              HP
            </PixelText>
            <Bar ratio={ratio} color={hpColor} height={9} track={palette.barTrack} />
          </View>

          {showNumbers ? (
            <PixelText size="tiny" color={palette.windowFill} align="right" style={{ marginTop: 5 }}>
              {Math.max(0, Math.round(hp))}/{maxHp}
            </PixelText>
          ) : null}
        </View>

          {/* the EXP strip — your side only, flush to the bottom edge */}
          {mine ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 3, paddingBottom: 3 }}>
              <PixelText size="tiny" color={palette.xp} style={{ marginRight: 5 }}>
                EXP
              </PixelText>
              <Bar ratio={xpNeeded > 0 ? Math.max(0, Math.min(1, xpInto / xpNeeded)) : 0} color={palette.xp} height={6} track={palette.ink} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
