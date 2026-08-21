// Battle "moves" are REAL exercises. You pick one, do it in real life, confirm,
// and that's how you deal damage. No fake attacks — your effort is the attack.
//
// kind: 'reps'  -> do `target` repetitions
//       'hold'  -> hold for `target` seconds (battle shows a live timer)
// power: base damage dealt on confirm (scaled a little by companion level)

export const EXERCISES = {
  pushups: { id: 'pushups', name: 'Push-Up Press', exercise: 'Push-ups', kind: 'reps', target: 10, power: 18, blurb: 'Drop and give your obstacle ten!' },
  squats: { id: 'squats', name: 'Squat Quake', exercise: 'Squats', kind: 'reps', target: 15, power: 20, blurb: 'Sink low and rise strong — 15 squats.' },
  jacks: { id: 'jacks', name: 'Jumping Jolt', exercise: 'Jumping jacks', kind: 'reps', target: 20, power: 16, blurb: 'Get the heart pumping — 20 jumping jacks.' },
  plank: { id: 'plank', name: 'Plank Guard', exercise: 'Plank', kind: 'hold', target: 20, power: 24, blurb: 'Hold a steady plank and brace.' },
  lunges: { id: 'lunges', name: 'Lunge Lash', exercise: 'Lunges', kind: 'reps', target: 12, power: 19, blurb: 'Step through 12 alternating lunges.' },
  highknees: { id: 'highknees', name: 'High-Knee Rush', exercise: 'High knees', kind: 'reps', target: 30, power: 17, blurb: 'Drive those knees — 30 high knees.' },
  burpees: { id: 'burpees', name: 'Burpee Blast', exercise: 'Burpees', kind: 'reps', target: 8, power: 28, blurb: 'The big one — 8 full burpees.' },
  situps: { id: 'situps', name: 'Core Crunch', exercise: 'Sit-ups', kind: 'reps', target: 15, power: 18, blurb: 'Engage the core — 15 sit-ups.' },
};

// The 4 moves shown in the battle's 2x2 action menu.
export const BATTLE_MOVES = ['pushups', 'squats', 'jacks', 'plank'];

export function getExercise(id) {
  return EXERCISES[id] || null;
}

export default EXERCISES;
