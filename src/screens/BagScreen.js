// Bag — a nested item menu. Pickups from the Route land here; using one applies
// its effect to your companion (heal / XP / bond).

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, Window, HPBar, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { ITEMS, getItem } from '../data/items';

export default function BagScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, goBack, back } = useNav();
  const [toast, setToast] = useState('Pick an item to use it.');

  const owned = Object.keys(ITEMS).filter((id) => (state.bag[id] || 0) > 0);

  const use = (id) => {
    const item = getItem(id);
    if (!item.effect) {
      setToast(`${item.name} is used in battle, not here.`);
      return;
    }
    // Wardrobe and lockers open before pairing. Consuming a heal into
    // nobody is the same class of bug as the sprite crash below.
    if (!companion) {
      setToast('Meet Coach Maple in the gym — items are for the two of you.');
      return;
    }
    dispatch({ type: 'USE_ITEM', payload: { itemId: id } });
    playSfx(item.effect && item.effect.heal ? 'heal' : 'item');
    const parts = [];
    if (item.effect.heal) parts.push(`+${item.effect.heal} HP`);
    if (item.effect.xp) parts.push(`+${item.effect.xp} XP`);
    if (item.effect.bond) parts.push(`+${item.effect.bond} bond`);
    setToast(`Used ${item.name}!  ${parts.join('  ')}`);
  };

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        Bag
      </PixelText>

      <Window tone="dark" pad={10} style={{ marginBottom: space.sm }}>
        {companion ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={36} />
            <View style={{ flex: 1, marginLeft: space.sm }}>
              <HPBar hp={companion.hp} maxHp={companion.maxHp} width={180} label="HP" />
              {/* Your tab, where you keep your things. The bar is the only place
                  it is spent, so this is the only place it needs to be read. */}
              <PixelText size="tiny" color={palette.secondary} style={{ marginTop: 6 }}>
                {`${state.credits || 0} Trail Credit`}
              </PixelText>
            </View>
          </View>
        ) : (
          <View accessibilityRole="text" accessibilityLabel="Meet Coach Maple in the gym. The bag is for the two of you.">
            <PixelText size="tiny" color={palette.windowFill} style={{ lineHeight: 14 }}>
              Meet Coach Maple in the gym. The bag is for the two of you.
            </PixelText>
            <PixelText size="tiny" color={palette.secondary} style={{ marginTop: 6 }}>
              {`${state.credits || 0} Trail Credit`}
            </PixelText>
          </View>
        )}
      </Window>

      <Window tone="cream" pad={10} style={{ marginBottom: space.sm }}>
        <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 14 }}>
          {toast}
        </PixelText>
      </Window>

      <ScrollView showsVerticalScrollIndicator={false}>
        {owned.length === 0 ? (
          <Window tone="cream" pad={16}>
            <PixelText
              size="small"
              color={palette.windowTextDim}
              align="center"
              accessibilityRole="text"
              accessibilityLabel="Your bag is empty. Walk a trail to find items."
            >
              Your bag is empty. Walk a trail to find items.
            </PixelText>
          </Window>
        ) : (
          owned.map((id) => {
            const item = getItem(id);
            return (
              <Window key={id} tone="cream" pad={12} style={{ marginBottom: space.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <PixelSprite spriteKey={item.sprite} palette={item.palette} size={44} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <PixelText size="body" color={palette.windowText}>
                        {item.name}
                      </PixelText>
                      <PixelText size="small" color={palette.accentDark}>
                        x{state.bag[id]}
                      </PixelText>
                    </View>
                    <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 6, lineHeight: 13 }}>
                      {item.description}
                    </PixelText>
                  </View>
                </View>
                {item.effect ? (
                  <PixelButton label="Use" tone="gold" size="small" style={{ marginTop: space.sm }} onPress={() => use(id)} />
                ) : (
                  <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.sm }}>
                    Used in battle to befriend wild companions.
                  </PixelText>
                )}
              </Window>
            );
          })
        )}
      </ScrollView>

      <PixelButton label={back.label} tone="plain" sound="cancel" onPress={goBack} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
