// Trail Credit: the only currency, and there is no way to buy it.
//
// A shop needs something to spend, and the moment a game has a shop it has a
// pressure to sell the currency. This one cannot be sold, gifted, granted at
// the start, or awarded for opening the app. It is minted by REAL EFFORT and
// nothing else: miles you actually walked, sessions you actually finished,
// challenges you actually won, and habit goals you actually hit. That is the
// same rule the rest of the game runs on — there are no walk buttons, so there
// is no wallet button either.
//
// Two consequences worth keeping:
//   - Rest days pay bond and healing but never credit, for the same reason they
//     never pay XP. Resting is a training decision, not a way to earn.
//   - Logging past a habit's daily goal pays nothing, because `applyLog`
//     already only credits the portion inside the goal. A log button must never
//     become a money button.

// A walked mile is the reference unit; everything else is priced against it.
export const CREDIT_PER_MILE = 10;
export const CREDIT_PER_SESSION = 8;
export const CREDIT_PER_WIN = 6;
export const CREDIT_PER_GOAL = 4;

// Credit arrives a thousandth of a mile at a time, so the fraction is carried
// between dispatches. Rounding each dispatch on its own would floor every one
// of them to zero and a walk would pay nothing at all — the same trap the
// walking XP carry exists to avoid.
export function mint(state, amount) {
  const carry = (state.stats.creditCarry || 0) + Math.max(0, amount || 0);
  const whole = Math.floor(carry);
  return {
    credits: (state.credits || 0) + whole,
    creditCarry: carry - whole,
  };
}

export function canAfford(state, price) {
  return (state.credits || 0) >= price;
}

// What a day of ordinary effort is worth, for the shop to explain itself with.
// Derived from the constants above so it cannot drift away from them.
export function dayEstimate(miles = 2, sessions = 1, goals = 2) {
  return Math.round(miles * CREDIT_PER_MILE + sessions * CREDIT_PER_SESSION + goals * CREDIT_PER_GOAL);
}

export default { CREDIT_PER_MILE, CREDIT_PER_SESSION, CREDIT_PER_WIN, CREDIT_PER_GOAL, mint, canAfford };
