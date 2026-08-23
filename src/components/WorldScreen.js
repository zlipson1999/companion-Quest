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
import HorizonSky from './HorizonSky';
import { palette, space, screen, tokens, scale } from '../theme';
import { OUTDOOR_WORLD_TONE, sceneTone } from '../data/sceneSky';
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

// The one button that touches the world. Gold, like every "do the thing"
// button in the game, with the verb big and the thing named under it.
function InteractButton({ verb, name, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${verb}: ${name}`}
      style={({ pressed }) => ({
        minHeight: scale.touchMin,
        paddingHorizontal: space.lg,
        paddingVertical: 8,
        backgroundColor: pressed ? '#c79a2e' : palette.secondary,
        borderWidth: 3,
        borderColor: palette.ink,
        alignItems: 'center',
      })}
    >
      <PixelText size="small" color={palette.ink}>{verb.toUpperCase()}</PixelText>
      <PixelText size="tiny" color={palette.inkSoft} style={{ marginTop: 2 }}>
        {name}
      </PixelText>
    </Pressable>
  );
}

// You should be able to see the whole place you are standing in.
//
// Rooms, the gym and the town all CONTAIN: the tile size is whatever makes the
// entire map fit across the phone, and nothing is ever cropped or scrolled out
// of view. Covering the screen instead meant a camera swinging around a space
// you could not see the shape of, which is disorienting in a room you cross in
// six steps and no better in a hall.
//
// A map is roughly square and a phone is not, so containing leaves room under
// the world. That space is not a gap — it is where the companion's condition
// lives, on every screen rather than only on the one that remembered to draw it.
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
  showControl = true,
  // A guided NPC (the gym tour's Coach Maple) rendered on the map.
  walker,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reach = showControl ? reachableThing(map, player) : null;
  const tile = worldTileFor(map);
  const worldW = map.cols * tile;
  const worldH = map.rows * tile;
  const outdoor = OUTDOOR_MAPS.has(map.id);
  const voidColor = VOID_BY_MAP[map.id] || (outdoor ? sceneTone(OUTDOOR_WORLD_TONE).ground : palette.grassDark);

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
      {/* Outdoors the map sits on the ground and the slack above the trees
          is sky. Indoors stay centred in the room's own tone. */}
      <View
        style={{
          flex: 1,
          backgroundColor: voidColor,
          alignItems: 'center',
          justifyContent: outdoor ? 'flex-end' : 'center',
        }}
      >
        {outdoor ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: worldH }}>
            <HorizonSky tone={OUTDOOR_WORLD_TONE} horizon={0.82} fillBelow />
          </View>
        ) : null}
        <View style={{ width: worldW, height: worldH }}>
          <TileMap map={map} player={player} tileSize={tile} viewport={{ width: worldW, height: worldH }} walker={walker} />
        </View>
        {reach && showControl ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: space.sm, alignItems: 'center' }}>
            <InteractButton
              verb={reach.thing.verb || 'Use'}
              name={(reach.thing.label || '').split(' — ')[0]}
              onPress={() => onMove(reach.dir)}
            />
          </View>
        ) : null}
        {menu.length ? (
          <View style={{ position: 'absolute', top: TOP_INSET, right: space.sm }}>
            <MenuButton onPress={() => setMenuOpen(true)} />
          </View>
        ) : null}
      </View>

      {/* Under the world: where you are, what to do next, your companion's
          condition, and the stick.
          A contained map is roughly square and a phone is not, so there is
          always slack above the panel. It belongs to the WORLD band, filled
          with the world's own tone — a strip of dark grass above the town reads
          as distance, where the same strip in interface navy read as a gap
          somebody forgot to fill. */}
      <View style={{ backgroundColor: palette.bgAlt, paddingHorizontal: space.md, paddingBottom: space.lg, paddingTop: space.sm }}>
        <ObjectiveRibbon place={place} objective={objective} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.md }}>
          {showControl ? <MoveControl onMove={onMove} /> : null}
          <View style={{ flex: 1, marginLeft: showControl ? space.md : 0 }}>{status}</View>
        </View>
      </View>

      {sheet}
    </Screen>
  );
}
