// The Maple Training Hall interior.
//
// The gym door used to jump straight to the exercise list, so the building the
// whole onboarding walks you toward had no inside. Here the equipment IS the
// menu: walk into a rack, a machine, the treadmill or the mirror and it opens
// the system that piece stands for. That replaces a screen of buttons
// explaining the systems with a room that demonstrates them.

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, DualPane, TileMap, Dpad, PixelText, FieldCard, TrailAction, ObjectiveRibbon } from '../components';
import { palette, space, screen, tokens } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { GYM, isWalkable, tileAt, triggerForCode, interactionForCode } from '../data/maps';

export default function GymScreen() {
  const { state } = useGame();
  const { navigate } = useNav();

  const [player, setPlayer] = useState({ x: GYM.spawn.x, y: GYM.spawn.y, facing: 'up' });
  const [facingStation, setFacingStation] = useState(null);
  const playerRef = useRef(player);

  const apply = (np) => {
    playerRef.current = np;
    setPlayer(np);
  };

  const move = (dir) => {
    const { x, y } = playerRef.current;
    const nx = dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x;
    const ny = dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y;
    const code = tileAt(GYM, nx, ny);

    if (!isWalkable(GYM, nx, ny)) {
      apply({ x, y, facing: dir });
      // Bumping a station is how you use it, so a blocked tile still has to
      // answer. Anything else in the room is just a wall.
      const station = interactionForCode(code);
      setFacingStation(station);
      if (station) {
        playSfx('confirm');
        setTimeout(() => navigate(station.screen), 140);
      }
      return;
    }

    apply({ x: nx, y: ny, facing: dir });
    setFacingStation(null);
    const trigger = triggerForCode(code);
    if (trigger) {
      playSfx('confirm');
      setTimeout(() => navigate(trigger), 130);
    }
  };

  const tileSize = Math.floor(Math.min(screen.width - 16, screen.height * 0.44) / GYM.cols);

  const top = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bgAlt }}>
      {/* Objective ribbon: one line naming where you are and what to do next,
          instead of leaving the immediate goal to hint text. */}
      <View style={{ position: 'absolute', top: space.sm, left: space.sm, right: space.sm, zIndex: 5 }}>
        <ObjectiveRibbon
          place="Maple Training Hall"
          objective={facingStation ? facingStation.label : 'Walk into any equipment to use it'}
        />
      </View>

      <TileMap map={GYM} player={player} tileSize={tileSize} style={{ marginTop: space.xl }} />
    </View>
  );

  const bottom = (
    <View style={{ flex: 1, flexDirection: 'row', padding: space.sm }}>
      <View style={{ justifyContent: 'center', paddingRight: space.sm }}>
        <Dpad onMove={move} />
        <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: 6, lineHeight: 12 }}>
          walk into a station
        </PixelText>
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <FieldCard
          title="In this room"
          accent={tokens.growth}
          caption="Barbell rack trains Resolve. Dumbbells and the cable machine open the Forge. The treadmill heads out to the trail. The bench is recovery, the cooler is your daily habits, and the mirror is form check."
        />
        <TrailAction
          label="Back to Maple Lane"
          tone="quiet"
          onPress={() => navigate('hub')}
          style={{ marginTop: space.sm }}
        />
      </View>
    </View>
  );

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} topFlex={1.15} bottomFlex={1} />
    </Screen>
  );
}
