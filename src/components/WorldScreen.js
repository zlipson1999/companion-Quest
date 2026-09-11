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
import FaceButtons from './FaceButtons';
import TrailAction from './TrailAction';
import PixelText from './PixelText';
import Screen from './Screen';
import FieldCard from './FieldCard';
import { palette, space, screen, tokens, scale } from '../theme';
import { OUTDOOR_WORLD_TONE } from '../data/sceneSky';
import { veilFor } from '../data/daylight';
import useDaylight, { useSceneTone } from '../state/useDaylight';
import { tileAt, isWalkable, interactionForCode } from '../data/maps';

// What is within reach: the interactive thing on the tile the player faces,
// falling back to any adjacent one. Walking into a thing still uses it — this
// only makes the possibility VISIBLE, as a button, so nobody stands beside a
// bed or a person wondering what to press.
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function reachableThing(map, player) {
  if (!player) return null;
  const order = [player.facing, 'up', 'left', 'right', 'down'];
  for (const dir of order) {
    if (!DIRS[dir]) continue;
    const x = player.x + DIRS[dir][0];
    const y = player.y + DIRS[dir][1];
    if (isWalkable(map, x, y)) continue;
    const thing = interactionForCode(tileAt(map, x, y), map);
    if (thing) return { dir, thing };
  }
  return null;
}

// Initial viewport estimate before layout measurement.
const WORLD_MAX_SHARE = 0.66;

export function worldTileFor(map) {
  return Math.max(20, Math.floor(Math.min(
    screen.width / map.cols,
    (screen.height * WORLD_MAX_SHARE) / map.rows
  )));
}

// Interiors keep a flat void — a sky over a gym floor is a hole in the roof.
// The lane is outdoor: the map sits on the ground band and the slack above
// the tree line is sky, so grass meets air at a horizon.
const VOID_BY_MAP = { gym: '#1b2126', home: '#241a12' };
const OUTDOOR_MAPS = new Set(['hub']);

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
  // The panel under the world. Screens pass their companion card; anything
  // falsy just leaves the place and objective.
  status,
  // Spoken lines (a tour stop, a challenge, a briefing). All TEXT sits
  // together directly under the world — ribbon first, dialogue beneath it —
  // with the companion card under that and the controls last.
  dialogue,
  showControl = true,
  // A guided NPC (the gym tour's Coach Maple) rendered on the map.
  walker,
  // A real-world cardio station can animate the player in place while the
  // measured activity arrives. The room stays visible; only the player's pose
  // changes from walking the floor to using the machine.
  playerActivity,
  // Small controls that belong to the place itself. Cardio uses this instead
  // of `status`: a full console below the world squeezed the room down until
  // the player could not actually watch their character run or pedal.
  worldOverlay,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reach = showControl ? reachableThing(map, player) : null;
  // Measure the viewport so the follow camera keeps the player in view.
  const [avail, setAvail] = useState(null);
  // A readable pixel scale with the existing follow camera. Overview is a
  // reversible inspection mode; the default puts the player IN the world.
  const [overview, setOverview] = useState(false);
  const tile = overview && avail
    ? Math.max(10, Math.floor(Math.min(avail.w / map.cols, avail.h / map.rows)))
    : 40;
  const worldW = avail ? avail.w : screen.width;
  const worldH = avail ? avail.h : screen.height * WORLD_MAX_SHARE;
  const outdoor = OUTDOOR_MAPS.has(map.id);
  // The letterbox behind an outdoor map is the same ground the sky dissolves
  // into, so it has to travel with the hour or the world sits in a noon frame.
  const phase = useDaylight();
  const worldTone = useSceneTone(OUTDOOR_WORLD_TONE);
  const voidColor = VOID_BY_MAP[map.id] || (outdoor ? worldTone.ground : palette.grassDark);
  // Interiors are lit by their own lamps, not by the sky. A kitchen at 9pm
  // looks like a kitchen; only the outdoors takes the hour.
  const veil = outdoor ? veilFor(phase) : null;

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

  return (
    <Screen padTop={false} style={{ padding: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: TOP_INSET, paddingBottom: 10, backgroundColor: '#203e47', borderBottomWidth: 3, borderBottomColor: '#90b5a4' }}>
        <View style={{ flex: 1 }}>
          <PixelText size="tiny" color="#a8d3bd" style={{ marginBottom: 5 }}>COMPANION QUEST</PixelText>
          <PixelText size="small" color="#fff5d6">{place}</PixelText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={overview ? 'Follow camera' : 'View whole map'} onPress={() => setOverview(!overview)} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginRight: 8, backgroundColor: '#355b61', borderWidth: 2, borderColor: '#86afa4' }}>
          <PixelText size="tiny" color="#fff5d6">{overview ? 'FOLLOW' : 'MAP'}</PixelText>
        </Pressable>
        {menu.length ? <MenuButton onPress={() => setMenuOpen(true)} /> : null}
      </View>
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width && height) setAvail({ w: width, h: height });
        }}
        style={{ flex: 1, minHeight: 140, backgroundColor: voidColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        <View style={{ width: worldW, height: worldH }}>
          <TileMap
            map={map}
            player={player}
            tileSize={tile}
            viewport={{ width: worldW, height: worldH }}
            walker={walker}
            playerActivity={playerActivity}
          />
          {veil && veil.opacity > 0 ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: veil.color,
                opacity: veil.opacity,
              }}
            />
          ) : null}
        </View>
        {worldOverlay ? (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: space.sm,
              bottom: space.sm,
              width: '74%',
              maxWidth: 380,
            }}
          >
            {worldOverlay}
          </View>
        ) : null}
      </View>
      <View style={{ backgroundColor: '#203e47', borderTopWidth: 3, borderTopColor: '#90b5a4', padding: 10 }}>
        {dialogue ? <View style={{ marginBottom: 8, maxHeight: screen.height * 0.3 }}><ScrollView>{dialogue}</ScrollView></View> : (
          <FieldCard tone="paper" pad={8}>
            <PixelText size="tiny" color={tokens.textOnPaper} style={{ lineHeight: 14 }}>{objective}</PixelText>
          </FieldCard>
        )}
        {status ? <View style={{ marginTop: 4 }}>{status}</View> : null}
        {showControl ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <MoveControl onMove={onMove} />
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <PixelText size="tiny" color="#a8d3bd" align="center" numberOfLines={3}>{reach ? reach.thing.label : 'EXPLORE TOGETHER'}</PixelText>
            </View>
            <FaceButtons onA={reach ? () => onMove(reach.dir) : null} onB={menu.length ? () => setMenuOpen(true) : null} />
          </View>
        ) : null}
      </View>

      {sheet}
    </Screen>
  );
}
