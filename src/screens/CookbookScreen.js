// The kitchen shelf, opened.
//
// Reached by walking up to the shelf in your own kitchen rather than from a
// menu, which is the same rule the Training Hall runs on: the thing that does
// the job is the thing you walk to.
//
// A shelf with six books on it can be a list. This one holds seventy-odd
// recipes across a dozen cuisines, so it is browsed the way you actually look
// for food: by the shape of the thing you want (fast, no cooking, meat-free,
// something to cook once and eat four times), or by typing an ingredient you
// already have. Categories are derived from tags in `data/recipes.js` — the
// counts here are computed from the same predicates that build the lists, so
// they can never drift.
//
// Cooking something and logging it is still one motion. Every recipe names the
// Nourish check-in it honestly counts as, so the button at the bottom of a
// recipe dispatches that module's action through the same reducer path as every
// other log — the cookbook never learns how progression works.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Screen, PixelText, FieldCard, TrailAction, Window } from '../components';
import { palette, space, tokens, scale, FONT_FAMILY } from '../theme';
import { useGame } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import {
  RECIPES,
  CATEGORIES,
  countIn,
  cuisineOf,
  CUISINES,
  getRecipe,
  recipesIn,
  searchRecipes,
} from '../data/recipes';
import { getModule, moduleActions, moduleStateFor } from '../modules';

// Tags are slugs because code reads them; a person should not have to. The
// cuisine already has its own line, so it is dropped from the tag run rather
// than printed twice in two different spellings.
const readable = (tag) => tag.replace(/-/g, ' ');
const notCuisine = (tag) => !CUISINES.includes(tag);

// One shelf row: a colour chip, the name, and how many are behind it. The chip
// is not decoration — it is the only thing that makes a list of eighteen
// near-identical rows scannable at a glance.
function CategoryRow({ category, count, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${count} recipes`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: scale.touchMin,
        paddingHorizontal: scale.gap.md,
        paddingVertical: scale.gap.sm,
        marginBottom: scale.gap.sm,
        backgroundColor: pressed ? tokens.surface : tokens.surfaceRaised,
        borderColor: tokens.line,
        borderWidth: 2,
        borderRadius: scale.radius.small,
      })}
    >
      <View
        style={{
          width: 14,
          height: 14,
          backgroundColor: category.color,
          borderColor: tokens.lineStrong,
          borderWidth: 2,
          marginRight: scale.gap.md,
        }}
      />
      <PixelText size="tiny" color={tokens.textOnDark} style={{ flex: 1, lineHeight: 14 }}>
        {category.name}
      </PixelText>
      <PixelText size="tiny" color={tokens.textOnDarkDim}>
        {String(count)}
      </PixelText>
    </Pressable>
  );
}

function SearchField({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={`Search ${RECIPES.length} recipes or an ingredient`}
        placeholderTextColor={palette.windowTextDim}
        autoCorrect={false}
        style={{
          flex: 1,
          fontFamily: FONT_FAMILY,
          fontSize: 8,
          color: palette.windowText,
          backgroundColor: palette.windowFill,
          borderWidth: 3,
          borderColor: palette.ink,
          paddingHorizontal: 10,
          paddingVertical: 9,
        }}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={() => onChange('')}
          style={{
            marginLeft: scale.gap.sm,
            width: scale.touchMin,
            height: scale.touchMin,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tokens.surfaceRaised,
            borderColor: tokens.line,
            borderWidth: 2,
            borderRadius: scale.radius.small,
          }}
        >
          <PixelText size="tiny" color={tokens.textOnDark}>X</PixelText>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function CookbookScreen() {
  const { state, dispatch } = useGame();
  const { navigate } = useNav();
  const [catId, setCatId] = useState(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [logged, setLogged] = useState(null);

  const category = CATEGORIES.find((c) => c.id === catId) || null;

  // Searching inside a category keeps the shelf you chose; searching from the
  // index searches everything. Both are what you'd expect from where you are.
  const results = useMemo(() => {
    const pool = category ? recipesIn(category.id) : RECIPES;
    return searchRecipes(query, pool);
  }, [category, query]);

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

  // --- a recipe, open ------------------------------------------------------
  const recipe = getRecipe(openId);
  if (recipe) {
    const origin = cuisineOf(recipe);
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary}>{recipe.name}</PixelText>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 6, lineHeight: 14 }}>
          {[`${recipe.minutes} min`, origin, ...recipe.tags.filter(notCuisine).map(readable)]
            .filter(Boolean).join(' · ')}
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
          label={category ? `Back to ${category.name}` : 'Back to the shelf'}
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

  // --- a shelf, or a search across the whole book --------------------------
  const browsing = category || query.trim();
  if (browsing) {
    return (
      <Screen style={{ padding: space.md }}>
        <PixelText size="heading" color={palette.secondary}>
          {category ? category.name : 'Search'}
        </PixelText>
        <PixelText size="tiny" color={tokens.textOnDarkDim} style={{ marginTop: 6, lineHeight: 14 }}>
          {results.length === 1 ? '1 recipe' : `${results.length} recipes`}
          {query.trim() && category ? ` in ${category.name}` : ''}
        </PixelText>

        <View style={{ marginTop: space.sm }}>
          <SearchField value={query} onChange={setQuery} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.sm }}>
          {results.length === 0 ? (
            <PixelText size="tiny" color={palette.windowFill} style={{ lineHeight: 15, marginTop: space.sm }}>
              Nothing here matches that. Try one ingredient rather than a dish —
              the shelf searches what things are made of.
            </PixelText>
          ) : null}
          {results.map((r) => (
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

        <TrailAction
          label="All categories"
          tone="quiet"
          onPress={() => {
            setQuery('');
            setCatId(null);
          }}
        />
      </Screen>
    );
  }

  // --- the shelf itself ----------------------------------------------------
  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary}>The Kitchen Shelf</PixelText>
      <PixelText size="tiny" color={palette.windowFill} style={{ marginTop: 6, lineHeight: 15 }}>
        {`${RECIPES.length} recipes. Short lists, steps you can follow while tired, no calorie maths — cook one and log it as the check-in it actually is.`}
      </PixelText>

      <View style={{ marginTop: space.md }}>
        <SearchField value={query} onChange={setQuery} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: space.md }}>
        {CATEGORIES.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            count={countIn(c.id)}
            onPress={() => setCatId(c.id)}
          />
        ))}
      </ScrollView>

      <TrailAction label="Back to the kitchen" tone="quiet" onPress={() => navigate('rest')} />
    </Screen>
  );
}
