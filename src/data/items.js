// Items. Pickups spawn at distance milestones on the Route; the Kinship Knot
// is what a trail companion ties with you when it decides to travel along. The gym's smoothie bar sells
// most of them for Trail Credit (see `src/data/shop.js`).
//
// A smoothie is a TWO-PART item, which is the point of the bar: the blend does
// something for your companion, and `logAs` records the drink as your own
// Nourish check-in. That log runs through the module's normal path, so the
// daily-goal cap applies and buying one can never pay more than showing up
// would have.

export const ITEMS = {
  apple: {
    id: 'apple', name: 'Crisp Apple', sprite: 'item_apple', palette: 'item',
    description: 'A healthy snack. Restores a bit of your companion\'s energy.',
    effect: { heal: 20, xp: 5 },
  },
  water: {
    id: 'water', name: 'Spring Water', sprite: 'item_water', palette: 'dew',
    description: 'Fresh and cool. Refreshes and restores energy.',
    effect: { heal: 35 },
  },
  energybar: {
    id: 'energybar', name: 'Energy Bar', sprite: 'item_energybar', palette: 'ember',
    description: 'A burst of fuel. Grants a chunk of experience.',
    effect: { xp: 25 },
  },
  charm: {
    id: 'charm', name: 'Bond Charm', sprite: 'item_charm', palette: 'item',
    description: 'A token of friendship. Deepens the bond with your active companion.',
    effect: { bond: 15, xp: 5 },
  },
  knot: {
    id: 'knot', name: 'Kinship Knot', sprite: 'item_knot', palette: 'cord',
    description: 'A braided cord with two loops. Offer one, keep one, and you have agreed to keep going together. Used on the trail.',
    catchItem: true,
  },
  greens: {
    id: 'greens', name: 'Field Greens Blend', sprite: 'item_smoothie_green', palette: 'blend_green',
    description: 'Spinach, apple, ginger. Tastes like a decision rather than a treat.',
    effect: { heal: 45 },
    logAs: { moduleId: 'diet', actionId: 'produce' },
  },
  berryblend: {
    id: 'berryblend', name: 'Bramble Blend', sprite: 'item_smoothie_berry', palette: 'blend_berry',
    description: 'Berries and yoghurt. Shared two-straws with your companion, which is most of what it is for.',
    effect: { heal: 20, bond: 14 },
    logAs: { moduleId: 'diet', actionId: 'balanced' },
  },
  sunrise: {
    id: 'sunrise', name: 'Sunrise Blend', sprite: 'item_smoothie_gold', palette: 'blend_gold',
    description: 'Mango, oats and peanut butter. What you drink on the way out, not the way home.',
    effect: { heal: 15, xp: 30 },
    logAs: { moduleId: 'diet', actionId: 'balanced' },
  },
};

// Weighted pool for milestone pickups. Knots show up so the trail keeps
// offering you the chance to travel with somebody new.
export const PICKUP_POOL = ['apple', 'water', 'apple', 'energybar', 'knot', 'water', 'charm', 'knot'];

export function getItem(id) {
  return ITEMS[id] || null;
}

export default ITEMS;
