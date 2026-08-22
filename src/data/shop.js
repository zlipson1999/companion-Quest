// Quest Fitness' smoothie bar — what is on the board, and what it costs.
//
// Prices are set against ONE number: `CREDIT_PER_MILE`. A walked mile is the
// reference unit, so every price here reads as "this many miles of real
// walking", which is the honest way to price something in a game where the
// currency can only be earned by moving. If the earn rate is ever retuned,
// retune it there and the whole board moves with it.
//
// Nothing here is a shortcut past effort. The Kinship Knot is the one item that
// unlocks something (befriending a wild companion) and it is also the one the
// Route already hands out free at milestones — the bar is a reliable way to get
// one, not the only way. The rest are consumables that make a hard day easier
// and cannot be stockpiled into progression, because using one pays the same
// capped rewards it always did.

import { CREDIT_PER_MILE } from '../state/economy';
import { getItem } from './items';

// Priced in miles, converted once. Written this way so the intent survives a
// balance pass: "a token is worth about two and a half miles" is a design
// decision, `25` is not.
const MILES = (n) => Math.round(n * CREDIT_PER_MILE);

export const SHELVES = [
  {
    id: 'blends',
    name: 'The Board',
    blurb: 'Blended to order. One for you, one for them.',
    stock: [
      { itemId: 'greens', price: MILES(1.2), note: 'Recovery. Counts as your vegetables.' },
      { itemId: 'berryblend', price: MILES(1.8), note: 'Shared. Deepens the bond.' },
      { itemId: 'sunrise', price: MILES(2.0), note: 'Fuel before, not after.' },
    ],
  },
  {
    id: 'counter',
    name: 'On the Counter',
    blurb: 'The plain things, for when a blend is more than you need.',
    stock: [
      { itemId: 'water', price: MILES(0.4), note: 'Cold, and free if you use the station instead.' },
      { itemId: 'apple', price: MILES(0.5), note: 'From the bowl.' },
      { itemId: 'energybar', price: MILES(1.0), note: 'Keeps in a pocket.' },
    ],
  },
  {
    id: 'tokens',
    name: 'Behind the Till',
    blurb: 'Kept behind the counter because people ask for them by name.',
    stock: [
      { itemId: 'knot', price: MILES(2.5), note: 'Braided here. Offer one loop, keep the other.' },
      { itemId: 'charm', price: MILES(1.5), note: 'For the companion you already have.' },
    ],
  },
];

// Flat view, for lookups that do not care which shelf something sits on.
export const STOCK = SHELVES.flatMap((shelf) => shelf.stock);

export function priceOf(itemId) {
  const line = STOCK.find((l) => l.itemId === itemId);
  return line ? line.price : null;
}

// Asserted at import: a price for an item that does not exist would show up as
// a blank row on the board rather than as an error, and blank rows are exactly
// the kind of thing that ships.
const missing = STOCK.filter((line) => !getItem(line.itemId));
if (missing.length) {
  throw new Error(`shop.js: unknown itemId on ${missing.map((l) => l.itemId).join(', ')}`);
}

export default SHELVES;
