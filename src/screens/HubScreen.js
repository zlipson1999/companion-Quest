// Maple Lane. The world fills the phone and scrolls under you; the objective
// ribbon, the menu button and the stick sit on top of it.
//
// This used to be a map in the top half with fourteen destinations listed
// underneath, which made the Training Hall decoration — everything the room
// stands for was one tap away down there. What is left in the menu is places
// you go and the two lines that are not places at all.

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WorldScreen, Window, PixelText, PixelSprite } from '../components';
import { palette, space, tokens } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { HUB, isWalkable, tileAt, triggerForCode } from '../data/maps';

const MENU = [
  { label: 'Route 1', value: 'route', sublabel: 'real miles, encounters' },
  { label: 'The Hall', value: 'gym', sublabel: 'train, cardio, coach' },
  { label: 'Go Home', value: 'rest', sublabel: 'sleep upstairs' },
  { label: 'Team', value: 'party', sublabel: 'companions' },
  { label: 'Options', value: 'options', sublabel: 'settings' },
  { label: 'Title', value: 'title', sublabel: 'main menu' },
];

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

  const status = companion ? (
    <Window tone="dark" pad={8}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={28} />
        <View style={{ flex: 1, marginLeft: space.sm }}>
          <PixelText size="tiny" color={palette.secondary}>
            {`${companion.creature.name}  Lv.${companion.level}`}
          </PixelText>
          <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 4 }}>
            {state.stats.totalSteps.toLocaleString()} steps
          </PixelText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <PixelText size="tiny" color={tokens.resolve}>{`BOND ${companion.bond}`}</PixelText>
          <PixelText size="tiny" color={tokens.growth} style={{ marginTop: 4 }}>
            {`HP ${Math.round(companion.hp)}`}
          </PixelText>
        </View>
      </View>
    </Window>
  ) : null;

  return (
    <WorldScreen
      map={HUB}
      player={player}
      onMove={move}
      place="Maple Lane"
      objective={objective}
      status={status}
      menu={MENU}
      onSelect={(item) => navigate(item.value)}
    />
  );
}
