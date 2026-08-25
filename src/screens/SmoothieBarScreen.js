// Quest Fitness' smoothie bar.
//
// Reached by walking up to the counter, like everything else in the room. What
// it sells is in `src/data/shop.js`; what pays for it is Trail Credit, which
// only real effort mints (`src/state/economy.js`).
//
// The balance and earn sources are both on screen. The bar reports Trail
// Credit directly; it does not translate a price into mileage or imply that
// reception/the shop tracks distance.

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, PixelText, PixelSprite, FieldCard, TrailAction, Window } from '../components';
import { palette, space, tokens, scale } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { shelvesFor } from '../data/shop';
import { getItem } from '../data/items';
import { CREDIT_PER_SESSION, CREDIT_PER_GOAL } from '../state/economy';

function Wallet({ credits }) {
  return (
    <FieldCard title="Your tab" accent={tokens.accent}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <PixelText size="body" color={palette.secondary}>{`${credits} credit`}</PixelText>
        <PixelText size="tiny" color={tokens.textOnDarkDim}>Trail Credit</PixelText>
      </View>
      <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 6, lineHeight: 14 }}>
        {`Earned by effort, never bought: selected trail work, ${CREDIT_PER_SESSION} a completed session, and ${CREDIT_PER_GOAL} for a habit goal. Gym cardio does not mint it.`}
      </PixelText>
    </FieldCard>
  );
}

function StockLine({ line, owned, credits, onBuy }) {
  const item = getItem(line.itemId);
  const short = line.price - credits;
  // Deliberately NOT disabled when you cannot afford it. A greyed-out row that
  // will not answer a tap tells you nothing; this one tells you exactly how
  // far short you are, in the same credit unit as the displayed price.
  const sublabel = short > 0
    ? `${line.price} credit · ${short} credit short`
    : `${line.price} credit · ${line.note}`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.sm }}>
      <View
        style={{
          width: 56,
          height: 56,
          backgroundColor: palette.windowFill,
          borderWidth: 2,
          borderColor: palette.windowBorder,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: space.sm,
        }}
      >
        <PixelSprite spriteKey={item.sprite} palette={item.palette} size={48} />
      </View>
      <View style={{ flex: 1, marginLeft: space.sm }}>
        <TrailAction
          label={`${item.name}${owned ? `  (${owned})` : ''}`}
          sublabel={sublabel}
          tone={short > 0 ? 'quiet' : 'primary'}
          onPress={() => onBuy(line, item)}
        />
      </View>
    </View>
  );
}

export default function SmoothieBarScreen() {
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const { navigate, goBack, back } = useNav();
  const credits = state.credits || 0;
  const shelves = shelvesFor(state.discoveredCharms);
  const [toast, setToast] = useState(
    'Blended to order. Your companion drinks half of everything, which is the arrangement.'
  );

  const buy = (line, item) => {
    if (credits < line.price) {
      // Say what is missing rather than just refusing, in the same currency as
      // the price. The bar does not translate a shortfall into mileage.
      const short = line.price - credits;
      playSfx('cancel');
      setToast(`${short} credit short for the ${item.name}.`);
      return;
    }
    dispatch({ type: 'BUY_ITEM', payload: { itemId: line.itemId } });
    playSfx('item');
    setToast(`${item.name} bought — it is in your bag. ${line.price} credit off the tab.`);
  };

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary}>The Smoothie Bar</PixelText>
      <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6, lineHeight: 15 }}>
        At the front of the gym, beside reception.
      </PixelText>

      <View style={{ marginTop: space.md }}>
        <Wallet credits={credits} />
      </View>

      <Window tone="cream" pad={10} style={{ marginTop: space.sm }}>
        <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 14 }}>
          {toast}
        </PixelText>
      </Window>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.sm }}>
        {shelves.map((shelf) => (
          <View key={shelf.id} style={{ marginBottom: space.md }}>
            <PixelText size="tiny" color={tokens.textOnDark} style={{ letterSpacing: 1, marginBottom: 4 }}>
              {shelf.name.toUpperCase()}
            </PixelText>
            <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ lineHeight: 14, marginBottom: space.sm }}>
              {shelf.blurb}
            </PixelText>
            {shelf.stock.map((line) => (
              <StockLine
                key={line.itemId}
                line={line}
                owned={state.bag[line.itemId] || 0}
                credits={credits}
                onBuy={buy}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.sm }}>
        {companion ? (
          <PixelSprite
            spriteKey={companion.creature.sprite}
            palette={companion.creature.palette}
            size={30}
            bob
          />
        ) : null}
        <PixelText
          size="tiny"
          color={tokens.textOnDarkDim}
          style={{ flex: 1, marginLeft: companion ? scale.gap.sm : 0, lineHeight: 14 }}
        >
          Drink one from your Bag when you want it.
        </PixelText>
      </View>

      <TrailAction label={back.label} tone="quiet" onPress={goBack} />
    </Screen>
  );
}
