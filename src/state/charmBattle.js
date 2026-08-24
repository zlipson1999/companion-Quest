// Trail Charm battle effects — the shelf copy, made true.
//
// A companion wears at most ONE charm (member.charm, equipped from the
// Backpack's Trail Gear pocket), so effects never stack. Every number lives
// in CHARM_TUNING and nowhere else; the same table is documented in
// GAME_BIBLE §6 and check_docs watches the marquee figures. The module is
// dependency-free on purpose: BattleScreen asks it questions, and a plain
// node script can test every answer without booting the app.
//
// Rowan's scripted push-up contest bypasses all of this — the lesson is
// losing, and no trinket argues with that.

export const CHARM_TUNING = {
  'second-wind-band': { surviveOnce: true },          // lethal hit leaves 1 Resolve, once per battle
  'steady-cord': { firstMoveMult: 1.2 },              // first confirmed move
  'hydration-bead': { healAfterMove: 2 },             // flat Resolve after each confirmed move
  'restleaf-charm': { arrivalHealPct: 0.15 },         // recovered between encounters
  'focus-stone': { everyMoveMult: 1.08 },             // every confirmed move
  'momentum-feather': { perStreak: 0.05, streakCap: 5 }, // +5% per prior move, cap +25%
  'fuelseed': { arrivalHealPct: 0.08 },               // start each battle topped up a little
  'breath-bell': { holdMoveMult: 1.15 },              // timed/hold moves only
  'form-ribbon': { everyMoveMult: 1.1 },              // the full requested effort, confirmed
  'pace-token': { incomingMult: 0.88 },               // every incoming hit
  'morning-dew': { firstHitMult: 0.5 },               // first incoming hit per battle
  'trail-spark': { firstMoveMult: 1.5 },              // first confirmed move
  'balance-root': { shrugKnotBacklash: true },        // one failed Knot offer draws no counter
  'recovery-shell': { victoryHealPct: 0.12 },         // on felling the opponent
  'kinship-thread': { bondDivisor: 2000, bondCap: 0.15 }, // power scales with Bond
};

const tune = (charmId) => (charmId && CHARM_TUNING[charmId]) || null;

// Resolve recovered on arrival (Fuelseed's head start, Restleaf's recovery
// between encounters). Returns the adjusted HP and a line worth saying.
export function charmArrivalHeal(charmId, hp, maxHp, charmName) {
  const t = tune(charmId);
  if (!t || !t.arrivalHealPct || hp >= maxHp) return { hp, note: null };
  const healed = Math.min(maxHp, hp + Math.max(1, Math.round(maxHp * t.arrivalHealPct)));
  if (healed === hp) return { hp, note: null };
  return { hp: healed, note: `${charmName || 'The charm'} glows — Resolve recovered to ${healed}.` };
}

// Outgoing power multiplier for one confirmed move. moveIndex counts the
// moves already confirmed this battle (0 for the first), which doubles as
// the Momentum Feather streak — a battle move cannot half-succeed.
export function charmOutgoingMult(charmId, { hold = false, moveIndex = 0, bond = 0 } = {}) {
  const t = tune(charmId);
  if (!t) return 1;
  let mult = 1;
  if (t.firstMoveMult && moveIndex === 0) mult *= t.firstMoveMult;
  if (t.everyMoveMult) mult *= t.everyMoveMult;
  if (t.holdMoveMult && hold) mult *= t.holdMoveMult;
  if (t.perStreak) mult *= 1 + t.perStreak * Math.min(t.streakCap, moveIndex);
  if (t.bondDivisor) mult *= 1 + Math.min(t.bondCap, bond / t.bondDivisor);
  return mult;
}

// Incoming counter damage. hitIndex counts hits already taken this battle.
export function charmIncoming(charmId, dmg, hitIndex, charmName) {
  const t = tune(charmId);
  if (!t) return { dmg, note: null };
  if (t.firstHitMult && hitIndex === 0) {
    const softened = Math.max(1, Math.round(dmg * t.firstHitMult));
    return { dmg: softened, note: `${charmName || 'The charm'} softens the first blow.` };
  }
  if (t.incomingMult) return { dmg: Math.max(1, Math.round(dmg * t.incomingMult)), note: null };
  return { dmg, note: null };
}

// Flat Resolve back after a confirmed move (Hydration Bead).
export function charmAfterMoveHeal(charmId) {
  const t = tune(charmId);
  return t && t.healAfterMove ? t.healAfterMove : 0;
}

// Resolve back on felling the opponent (Recovery Shell).
export function charmVictoryHeal(charmId, maxHp) {
  const t = tune(charmId);
  return t && t.victoryHealPct ? Math.max(1, Math.round(maxHp * t.victoryHealPct)) : 0;
}

// Does this charm hold a lethal hit at 1 Resolve (Second Wind Band)?
export function charmSurvivesLethal(charmId) {
  const t = tune(charmId);
  return !!(t && t.surviveOnce);
}

// Does this charm shrug the backlash of a failed Knot offer (Balance Root)?
export function charmShrugsKnotBacklash(charmId) {
  const t = tune(charmId);
  return !!(t && t.shrugKnotBacklash);
}
