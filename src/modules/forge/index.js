// Workout Forge — the life module where the player writes their own content.
//
// Hydration and Nourish have fixed actions. The Forge's actions ARE the plans
// the player built, so it declares `actions` as a function of its own state and
// asks the analyser what each plan is worth. That is the whole reason the
// registry grew `actions(modState)`, `initialState()` and `screen`: a module
// with user-authored content needed them, and now any future module can use
// them too.
//
// One session a day is what growth is paid for. A second session still gets
// logged — it happened, and the tally should say so — but the day's growth is
// already banked. The game does not reward grinding itself into the ground.

import { palette } from '../../theme/colors';
import { analysePlan } from './analysis';

// Two plans to open with, so the screen teaches by example rather than starting
// on an empty list. Both are editable and deletable like any the player writes.
const SEED_PLANS = [
  {
    id: 'seed-fullbody',
    name: 'First Circuit',
    note: 'A balanced starter. Everything gets asked to show up.',
    blocks: [
      { movementId: 'squat', sets: 3, amount: 12 },
      { movementId: 'pushup', sets: 3, amount: 8 },
      { movementId: 'row', sets: 3, amount: 8 },
      { movementId: 'hipbridge', sets: 3, amount: 12 },
      { movementId: 'plank', sets: 2, amount: 30 },
    ],
  },
  {
    id: 'seed-unwind',
    name: 'Evening Unwind',
    note: 'Slow work for a tired day. Still counts.',
    blocks: [
      { movementId: 'catcow', sets: 2, amount: 10 },
      { movementId: 'hipopener', sets: 2, amount: 40 },
      { movementId: 'hamstretch', sets: 2, amount: 40 },
      { movementId: 'shoulderopener', sets: 2, amount: 40 },
    ],
  },
];

export function makePlanId() {
  // Monotonic enough for a local list, and no dependency on a uuid package.
  return `plan-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}

export function emptyPlan() {
  return { id: makePlanId(), name: 'New Plan', note: '', blocks: [] };
}

const FORGE = {
  id: 'forge',
  name: 'Workout Forge',
  tagline: 'Build it, log it, own it',
  sprite: 'mod_barbell',
  spritePalette: 'rock',
  color: palette.windowBorderLight,
  unit: 'sessions',
  dailyGoal: 1,
  screen: 'forge',
  // Forge logs are physical training, so they feed the recovery model. Habit
  // modules like Sleep deliberately do not.
  training: true,
  blurb: 'Write your own workouts. The Forge reads what each one actually trains and decides what it is worth.',

  initialState() {
    return { plans: SEED_PLANS };
  },

  // One action per saved plan, priced by the analyser at the moment it is read
  // — so editing a plan changes its reward immediately, with no stored copy to
  // drift out of date.
  actions(modState) {
    const plans = (modState && modState.plans) || [];
    return plans.map((plan) => {
      const a = analysePlan(plan);
      return {
        id: `plan:${plan.id}`,
        planId: plan.id,
        label: plan.name,
        sublabel: a.sets ? `${a.focus}  ·  ~${a.minutes} min` : 'empty plan',
        amount: 1,
        reward: { xp: a.reward.xp, bond: a.reward.bond, heal: a.reward.heal },
        analysis: a,
      };
    });
  },

  goalReward: { xp: 20, bond: 6 },

  summary(day) {
    const plans = (day.plans || []).length;
    if (day.goalHit) return `Session logged. ${plans} plan${plans === 1 ? '' : 's'} in the Forge.`;
    if (!plans) return 'No plans yet. Build one and the Forge will price it.';
    return `${plans} plan${plans === 1 ? '' : 's'} ready. Nothing logged today.`;
  },

  cheer(day) {
    if (day.goalHit) return 'That was real work. I felt every set.';
    return 'Whenever you are ready. I will be right here.';
  },
};

export default FORGE;
export { analysePlan };
export { SEED_PLANS };
