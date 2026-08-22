// The kitchen shelf: a small book of things worth cooking.
//
// Deliberately not a calorie database. Nourish is check-in based because the
// game rewards showing up and eating well and never restriction or guilt, and
// the cookbook has to agree with that — these are plain meals with a time, a
// short ingredient list and steps you can follow while tired.
//
// Every recipe names which Nourish check-in it honestly counts as, so cooking
// one and logging it is a single motion rather than a guess.

export const RECIPES = [
  {
    id: 'trailbowl',
    name: 'Trailkeeper Bowl',
    minutes: 20,
    blurb: 'The one to learn first. Any grain, any protein, whatever is in the drawer.',
    logAs: 'balanced',
    tags: ['balanced', 'batch-friendly'],
    ingredients: [
      '1 cup rice, couscous or quinoa',
      '2 eggs, a tin of beans, or leftover chicken',
      'Whatever vegetable is closest to turning',
      'Olive oil, lemon, salt, something spicy',
    ],
    steps: [
      'Start the grain — it needs the longest and wants no attention.',
      'Cut the vegetable into pieces that cook in the time you have left.',
      'Get colour on the vegetable in a hot pan. Do not crowd it.',
      'Add the protein just to warm through.',
      'Grain in the bowl, everything on top, oil and lemon over it.',
    ],
  },
  {
    id: 'overnight',
    name: 'Night-Before Oats',
    minutes: 5,
    blurb: 'Made when you are not hungry, eaten when you have no time.',
    logAs: 'balanced',
    tags: ['breakfast', 'no-cook'],
    ingredients: [
      '1/2 cup rolled oats',
      '2/3 cup milk or a plant milk',
      '2 tbsp yoghurt',
      'Fruit, and something with crunch',
    ],
    steps: [
      'Oats, milk and yoghurt into a jar. Stir once.',
      'Fruit on top. Lid on. Fridge.',
      'Add the crunchy thing in the morning, not the night before.',
    ],
  },
  {
    id: 'panfish',
    name: 'Fifteen-Minute Fish',
    minutes: 15,
    blurb: 'The fastest real dinner there is, and almost impossible to overwork.',
    logAs: 'balanced',
    tags: ['protein', 'quick'],
    ingredients: [
      'A fillet of whatever fish looked good',
      'A bag of greens',
      'Half a lemon, butter or oil, salt',
      'Bread, if you want it',
    ],
    steps: [
      'Dry the fish properly. Wet fish steams instead of browning.',
      'Salt it. Hot pan, oil, skin side down, and leave it alone.',
      'Flip once when the edges have gone opaque.',
      'Greens into the same pan off the heat — they will wilt in the residue.',
      'Lemon over everything.',
    ],
  },
  {
    id: 'soup',
    name: 'Cupboard Soup',
    minutes: 30,
    blurb: 'For the evening when there is nothing in and you refuse to go out.',
    logAs: 'produce',
    tags: ['batch-friendly', 'cheap'],
    ingredients: [
      'An onion, a carrot, a stick of celery',
      'A tin of tomatoes and a tin of beans',
      'Stock, or water and something salty',
      'A handful of pasta or rice',
    ],
    steps: [
      'Chop the onion, carrot and celery small. Sweat them slowly in oil.',
      'Tomatoes in, cook them down for a few minutes.',
      'Stock, beans and pasta. Simmer until the pasta is done.',
      'Taste it. It almost certainly needs more salt and something acidic.',
    ],
  },
  {
    id: 'recovery',
    name: 'Recovery Plate',
    minutes: 25,
    blurb: 'For the evening after a hard session. Carbs are the point, not the enemy.',
    logAs: 'balanced',
    tags: ['post-training', 'protein'],
    ingredients: [
      'Two potatoes or a large sweet potato',
      'A protein you like, roughly a palm-sized piece',
      'Yoghurt, lemon and herbs, stirred together',
      'Anything green',
    ],
    steps: [
      'Potatoes into a hot oven, cut side down, while you deal with the rest.',
      'Cook the protein simply. Salt, heat, patience.',
      'Stir the yoghurt sauce. It takes a minute and makes the plate.',
      'Green thing raw or barely cooked, for texture.',
    ],
  },
  {
    id: 'snack',
    name: 'Actual Snack',
    minutes: 3,
    blurb: 'Assembled, not cooked. The alternative to standing in front of the fridge.',
    logAs: 'produce',
    tags: ['no-cook', 'snack'],
    ingredients: [
      'An apple or a pear',
      'Cheese, nuts or nut butter',
      'Salt',
    ],
    steps: [
      'Cut the fruit. Cutting it is the whole trick — whole fruit gets ignored.',
      'Put the fatty thing beside it so the snack actually holds you.',
      'Salt on the fruit. Trust this.',
    ],
  },
];

export function getRecipe(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export default RECIPES;
