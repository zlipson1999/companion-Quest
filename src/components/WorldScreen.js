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
import { Modal, Pressable, ScrollView, View } from 'react-native';
import TileMap from './TileMap';
import MoveControl from './MoveControl';
import ObjectiveRibbon from './ObjectiveRibbon';
import TrailAction from './TrailAction';
import PixelText from './PixelText';
import Screen from './Screen';
import { palette, space, screen, tokens, scale } from '../theme';

// Scale so the map covers the phone's height where it can. A fixed tile size
// left small rooms floating in the middle of a black screen, which is the box
// problem again wearing a different shape. Clamped at both ends: below 48 the
// world stops feeling close, above 68 you can see too little of the room to
// navigate it.
export function worldTileFor(map) {
  return Math.max(48, Math.min(68, Math.round(screen.height / map.rows)));
}

// Where the map does not reach, show the world's own tone rather than black —
// a letterbox reads as a bug, a margin of ground reads as distance.
const VOID_BY_MAP = { gym: '#1b2126', home: '#241a12' };

function MenuButton({ onPress }) {
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
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const viewport = { width: screen.width, height: screen.height };
  const tile = worldTileFor(map);
  const voidColor = VOID_BY_MAP[map.id] || palette.grassDark;

  return (
    <Screen padTop={false} style={{ padding: 0 }}>
      <View style={{ flex: 1, backgroundColor: voidColor }}>
        <TileMap map={map} player={player} tileSize={tile} viewport={viewport} />

        {/* Top: where you are, what to do next, and the way into everything
            else. One row, so the world keeps the screen. */}
        <View
          style={{
            position: 'absolute',
            top: space.xl,
            left: space.sm,
            right: space.sm,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1 }}>
            <ObjectiveRibbon place={place} objective={objective} />
            {note ? (
              <PixelText
                size="tiny"
                color={tokens.textOnDarkDim}
                style={{ marginTop: 6, marginLeft: 4, lineHeight: 13 }}
              >
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
          <View style={{ position: 'absolute', top: space.xl + 74, left: space.sm, right: space.sm }}>{status}</View>
        ) : null}

        {/* The stick lives in the thumb's corner, over the world rather than
            in a panel below it. */}
        {showControl ? (
          <View style={{ position: 'absolute', left: space.md, bottom: space.xl }}>
            <MoveControl onMove={onMove} />
          </View>
        ) : null}
      </View>

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
    </Screen>
  );
}
