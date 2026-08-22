// The world, full-bleed, with everything else laid over it.
//
// Every walkable screen used to be a DualPane: the map in a box in the top half
// and a panel of buttons underneath. That gave the world about a third of the
// phone and made the map feel like a preview of the game rather than the game.
//
// Here the map fills the screen and scrolls under the player, and the interface
// sits on top of it: where you are and what to do next along the top, the stick
// in the thumb's corner, and everything that used to be a list behind one menu
// button. Nothing that is not needed to walk around is on screen by default.

import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StatusBar, View } from 'react-native';
import TileMap from './TileMap';
import MoveControl from './MoveControl';
import ObjectiveRibbon from './ObjectiveRibbon';
import TrailAction from './TrailAction';
import PixelText from './PixelText';
import Screen from './Screen';
import { palette, space, screen, tokens, scale } from '../theme';

// How much of the phone the world takes.
//
//   'full'  the world IS the screen; the interface floats over it.
//   'half'  the world sits in the upper portion with a panel under it.
//
// Not every space wants the same treatment. Route 1 and the open maps earn the
// whole phone — that is where the game is looked at. The house is a short
// scripted walk through small rooms, and filling the screen with it means
// either enormous tiles or a camera swinging around a space you cross in six
// steps; a calmer frame with the room's name under it reads better and keeps
// the hint where the eye already is.
export const HALF_SHARE = 0.56;

export function worldTileFor(map, layout = 'full') {
  if (layout === 'half') {
    // CONTAIN, not cover. The whole point of the calmer frame is that you can
    // see the room you are standing in; sizing it to fill the box cropped the
    // walls off the sides and left the camera swinging around a space you
    // cross in six steps.
    const box = screen.height * HALF_SHARE;
    return Math.max(24, Math.floor(Math.min(box / map.rows, screen.width / map.cols)));
  }
  // Full screen covers the height. The width is free to overflow — the camera
  // scrolls it — but a short map must never leave a band of nothing under it.
  // This was clamped at 68 before, which letterboxed tall phones by about a
  // hundred pixels. The floor is only for a map tall enough that covering
  // would otherwise make the tiles unreadably small.
  return Math.max(40, Math.ceil(screen.height / map.rows));
}

// Where the map does not reach, show the world's own tone rather than black —
// a letterbox reads as a bug, a margin of ground reads as distance.
const VOID_BY_MAP = { gym: '#1b2126', home: '#241a12' };

// The overlay sits over a full-bleed world, so nothing else is holding it clear
// of the status bar or the notch. On Android that is a measurable number; on
// iOS SafeAreaView has already inset us, and this is breathing room.
export const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12;

export function MenuButton({ onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        width: scale.touchMin,
        height: scale.touchMin,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? tokens.surface : tokens.surfaceRaised,
        borderColor: tokens.line,
        borderWidth: 2,
        borderRadius: scale.radius.small,
      })}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: 20, height: 3, backgroundColor: tokens.textOnDark, marginVertical: 2 }}
        />
      ))}
    </Pressable>
  );
}

export default function WorldScreen({
  map,
  player,
  onMove,
  place,
  objective,
  menu = [],
  onSelect,
  status,
  // Some rooms want a line of their own under the ribbon (a station name, a
  // hint). Kept to one line: the world is the thing being looked at.
  note,
  showControl = true,
  layout = 'full',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const half = layout === 'half';
  const worldH = half ? Math.round(screen.height * HALF_SHARE) : screen.height;
  const viewport = { width: screen.width, height: worldH };
  const tile = worldTileFor(map, layout);
  const voidColor = VOID_BY_MAP[map.id] || palette.grassDark;

  const chrome = (
    <>
      {/* Top: where you are, what to do next, and the way into everything
          else. One row, so the world keeps the screen. */}
      <View
        style={{
          position: 'absolute',
          top: TOP_INSET,
          left: space.sm,
          right: space.sm,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <View style={{ flex: 1 }}>
          <ObjectiveRibbon place={place} objective={objective} />
          {note ? (
            <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 6, marginLeft: 4, lineHeight: 13 }}>
              {note}
            </PixelText>
          ) : null}
        </View>
        {menu.length ? (
          <View style={{ marginLeft: space.sm }}>
            <MenuButton onPress={() => setMenuOpen(true)} />
          </View>
        ) : null}
      </View>

      {status ? (
        <View style={{ position: 'absolute', top: TOP_INSET + 76, left: space.sm, right: space.sm }}>{status}</View>
      ) : null}
    </>
  );

  const sheet = (
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <Pressable style={{ flex: 1, backgroundColor: '#000000cc' }} onPress={() => setMenuOpen(false)}>
        <Pressable
          onPress={() => {}}
          style={{
            marginTop: 'auto',
            backgroundColor: tokens.surface,
            borderTopColor: tokens.line,
            borderTopWidth: 3,
            padding: space.md,
            maxHeight: '72%',
          }}
        >
          <PixelText size="small" color={tokens.textOnDark} style={{ marginBottom: space.sm }}>
            MENU
          </PixelText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {menu.map((item) => (
              <TrailAction
                key={item.value}
                label={item.label}
                sublabel={item.sublabel}
                tone="quiet"
                style={{ marginBottom: space.sm }}
                onPress={() => {
                  setMenuOpen(false);
                  onSelect(item);
                }}
              />
            ))}
          </ScrollView>
          <TrailAction label="Close" tone="quiet" onPress={() => setMenuOpen(false)} />
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (half) {
    return (
      <Screen padTop={false} style={{ padding: 0 }}>
        <View style={{ height: worldH, backgroundColor: voidColor }}>
          <TileMap map={map} player={player} tileSize={tile} viewport={viewport} />
          {menu.length ? (
            <View style={{ position: 'absolute', top: TOP_INSET, right: space.sm }}>
              <MenuButton onPress={() => setMenuOpen(true)} />
            </View>
          ) : null}
          {status ? (
            <View style={{ position: 'absolute', top: TOP_INSET, left: space.sm, right: space.sm + 56 }}>{status}</View>
          ) : null}
        </View>
        {/* The panel the world does not take. In a small room there is space
            for the stick to sit beside the hint rather than over it. */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: space.md, backgroundColor: palette.bgAlt }}>
          {showControl ? <MoveControl onMove={onMove} /> : null}
          <View style={{ flex: 1, marginLeft: space.md }}>
            <PixelText size="small" color={palette.secondary}>{place}</PixelText>
            {objective ? (
              <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 8, lineHeight: 15 }}>
                {objective}
              </PixelText>
            ) : null}
          </View>
        </View>
        {sheet}
      </Screen>
    );
  }

  return (
    <Screen padTop={false} style={{ padding: 0 }}>
      <View style={{ flex: 1, backgroundColor: voidColor }}>
        <TileMap map={map} player={player} tileSize={tile} viewport={viewport} />

        {chrome}

        {/* The stick lives in the thumb's corner, over the world rather than
            in a panel below it. */}
        {showControl ? (
          <View style={{ position: 'absolute', left: space.md, bottom: space.xl }}>
            <MoveControl onMove={onMove} />
          </View>
        ) : null}
      </View>

      {sheet}
    </Screen>
  );
}
