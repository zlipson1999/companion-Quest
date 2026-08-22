// The town hub. Walk around the tile overworld with the D-pad; stepping onto a
// building door or the route gate enters that area. A status strip shows your
// companion, and the lower pane holds the D-pad plus the system menu.

import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, DualPane, TileMap, MoveControl, Window, Menu, PixelText, PixelSprite, ObjectiveRibbon } from '../components';
import { palette, space, screen, tokens } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { HUB, isWalkable, tileAt, triggerForCode } from '../data/maps';

export default function HubScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();

  const [player, setPlayer] = useState({ x: HUB.spawn.x, y: HUB.spawn.y, facing: 'down' });
  const playerRef = useRef(player);
  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
  };

  const move = (dir) => {
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    if (!isWalkable(HUB, nx, ny)) {
      apply({ x, y, facing: dir });
      return;
    }
    apply({ x: nx, y: ny, facing: dir });
    const trigger = triggerForCode(tileAt(HUB, nx, ny));
    if (trigger) {
      playSfx('confirm');
      setTimeout(() => navigate(trigger), 130);
    }
  };

  const objective = !companion
    ? 'Meet Coach Maple inside the Training Hall'
    : state.stats.distanceMi < 0.1
      ? 'Head out through the north gate and walk Route 1'
      : 'Train at the Hall, or walk Route 1 for more distance';

  const tileSize = Math.floor(Math.min(screen.width - 16, screen.height * 0.44) / HUB.cols);

  const top = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.grassDark }}>
      <View style={{ position: 'absolute', top: space.sm, left: space.sm, right: space.sm, zIndex: 5 }}>
        <ObjectiveRibbon
          place="Maple Lane"
          objective={objective}
          style={{ marginBottom: space.sm }}
        />
        <Window tone="dark" pad={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {companion ? <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={30} /> : null}
            <View style={{ flex: 1, marginLeft: space.sm }}>
              <PixelText size="tiny" color={palette.secondary}>
                {companion ? `${companion.creature.name}  Lv.${companion.level}` : ''}
              </PixelText>
              <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4 }}>
                {state.stats.totalSteps.toLocaleString()} steps
              </PixelText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <PixelText size="tiny" color={palette.accent}>
                BOND {companion ? companion.bond : 0}
              </PixelText>
              <PixelText size="tiny" color={palette.hpHigh} style={{ marginTop: 4 }}>
                HP {companion ? Math.round(companion.hp) : 0}
              </PixelText>
            </View>
          </View>
        </Window>
      </View>

      <TileMap map={HUB} player={player} tileSize={tileSize} style={{ marginTop: space.xl }} />
    </View>
  );

  const bottom = (
    <View style={{ flex: 1, flexDirection: 'row', padding: space.sm }}>
      <View style={{ justifyContent: 'center', paddingRight: space.sm }}>
        <MoveControl onMove={move} hint="walk to a door" />
      </View>
      {/* The menu grows as modules are installed; it must scroll rather than
          spill out of the fixed lower pane on a small screen. */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Menu
          tone="dark"
          pad={10}
          columns={2}
          // Places, not a system index.
          //
          // This used to list fourteen destinations, which meant the Training
          // Hall and its equipment were decoration — everything the room stands
          // for was one tap away down here. Training, the Forge, habits, your
          // bag, your record and the coach all live on the gym floor now and
          // are reached by walking to the thing that does them. What is left is
          // the places you go and the two lines that are not places at all.
          options={[
            { label: 'Route 1', value: 'route', sublabel: 'real miles, encounters' },
            { label: 'The Hall', value: 'gym', sublabel: 'train, cardio, coach' },
            { label: 'Go Home', value: 'rest', sublabel: 'sleep upstairs' },
            { label: 'Team', value: 'party', sublabel: 'companions' },
            { label: 'Options', value: 'options', sublabel: 'settings' },
            { label: 'Title', value: 'title', sublabel: 'menu' },
          ]}
          onSelect={(opt) => navigate(opt.value)}
        />
      </ScrollView>
    </View>
  );

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} topFlex={1.15} bottomFlex={1} />
    </Screen>
  );
}

