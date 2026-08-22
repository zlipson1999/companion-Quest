// The kitchen shelf, opened.
//
// Reached by walking up to the shelf in your own kitchen rather than from a
// menu, which is the same rule the Training Hall runs on: the thing that does
// the job is the thing you walk to.
//
// Cooking something and logging it is one motion here. Every recipe names the
// Nourish check-in it honestly counts as, so the button at the bottom of a
// recipe dispatches that module's action through the same reducer path as every
// other log — the cookbook never learns how progression works.

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, PixelText, FieldCard, TrailAction, Window } from '../components';
import { palette, space, tokens } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { RECIPES } from '../data/recipes';
import { getModule, moduleActions, moduleStateFor } from '../modules';

export default function CookbookScreen() {
  const { state, dispatch } = useGame();
  const { navigate } = useNav();
  const [openId, setOpenId] = useState(null);
  const [logged, setLogged] = useState(null);

  const recipe = RECIPES.find((r) => r.id === openId);

  const logMeal = (r) => {
    const diet = getModule('diet');
    if (!diet) return;
    const actions = moduleActions(diet, moduleStateFor(state.modules, 'diet'));
    const action = actions.find((a) => a.id === r.logAs) || actions[0];
    if (!action) return;
    playSfx('item');
    dispatch({ type: 'MODULE_LOG', payload: { moduleId: 'diet', actionId: action.id } });
    setLogged(`${r.name} logged as ${action.label}.`);
  };

  if (recipe) {
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary}>{recipe.name}</PixelText>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 6 }}>
          {`${recipe.minutes} min · ${recipe.tags.join(' · ')}`}
        </PixelText>

        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.md }}>
          <PixelText size="tiny" color={palette.windowFill} style={{ lineHeight: 15 }}>
            {recipe.blurb}
          </PixelText>

          <FieldCard title="You need" style={{ marginTop: space.md }}>
            {recipe.ingredients.map((line) => (
              <PixelText key={line} size="tiny" color={tokens.textOnDark} style={{ lineHeight: 16 }}>
                {`· ${line}`}
              </PixelText>
            ))}
          </FieldCard>

          <FieldCard title="Method" style={{ marginTop: space.sm }}>
            {recipe.steps.map((line, i) => (
              <PixelText key={line} size="tiny" color={tokens.textOnDark} style={{ lineHeight: 16, marginBottom: 6 }}>
                {`${i + 1}. ${line}`}
              </PixelText>
            ))}
          </FieldCard>

          {logged ? (
            <Window tone="cream" pad={10} style={{ marginTop: space.sm }}>
              <PixelText size="tiny" color={palette.windowText} style={{ lineHeight: 14 }}>
                {logged}
              </PixelText>
            </Window>
          ) : null}
        </ScrollView>

        <TrailAction
          label="I Made This"
          sublabel="log it to Nourish"
          tone="primary"
          style={{ marginTop: space.sm }}
          onPress={() => logMeal(recipe)}
        />
        <TrailAction
          label="Back to the shelf"
          tone="quiet"
          style={{ marginTop: space.sm }}
          onPress={() => {
            setLogged(null);
            setOpenId(null);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary}>The Kitchen Shelf</PixelText>
      <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6, lineHeight: 15 }}>
        Plain food, short lists, steps you can follow while tired. No calorie maths —
        cook one and log it as the check-in it actually is.
      </PixelText>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.md }}>
        {RECIPES.map((r) => (
          <TrailAction
            key={r.id}
            label={r.name}
            sublabel={`${r.minutes} min · ${r.blurb}`}
            tone="quiet"
            style={{ marginBottom: space.sm }}
            onPress={() => setOpenId(r.id)}
          />
        ))}
      </ScrollView>

      <TrailAction label="Back to the kitchen" tone="quiet" onPress={() => navigate('rest')} />
    </Screen>
  );
}
