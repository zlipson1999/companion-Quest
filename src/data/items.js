// Items. Pickups spawn at distance milestones on the Route; the Bond Token is
// used in battle to befriend a wild companion.

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
  token: {
    id: 'token', name: 'Bond Token', sprite: 'item_token', palette: 'item',
    description: 'Offer it to a weakened wild companion to befriend it. Used in battle.',
    catchItem: true,
  },
};

// Weighted pool for milestone pickups (tokens show up so you can keep catching).
export const PICKUP_POOL = ['apple', 'water', 'apple', 'energybar', 'token', 'water', 'charm', 'token'];

export function getItem(id) {
  return ITEMS[id] || null;
}

export default ITEMS;
