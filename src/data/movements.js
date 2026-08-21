// The movement library the Workout Forge builds plans from.
//
// Each movement declares the muscles it actually trains, the pattern it belongs
// to, and the coaching cues shown during a set (and on the form-check camera).
// The on-device analyser reads `primary`/`secondary`/`pattern`/`load` to work
// out what a plan trains and which perks it earns — so adding a movement here
// immediately changes what the game can recognise.
//
// `unit`: 'reps' | 'seconds' | 'steps'
// `load`: 1 easy .. 3 hard — relative systemic cost per set.

export const MOVEMENTS = [
  // --- push -------------------------------------------------------------
  { id: 'pushup', name: 'Push-Up', pattern: 'push', unit: 'reps', load: 2,
    primary: ['chest', 'triceps'], secondary: ['shoulders', 'core'],
    cues: ['Hands under your shoulders', 'Squeeze your glutes, ribs down', 'Lower until elbows pass 90', 'Push the floor away'] },
  { id: 'pikepress', name: 'Pike Press', pattern: 'push', unit: 'reps', load: 3,
    primary: ['shoulders', 'triceps'], secondary: ['core'],
    cues: ['Hips high, body in a V', 'Crown of the head toward the floor', 'Elbows track forward, not flared', 'Press tall at the top'] },
  { id: 'dip', name: 'Chair Dip', pattern: 'push', unit: 'reps', load: 2,
    primary: ['triceps'], secondary: ['chest', 'shoulders'],
    cues: ['Shoulders down away from ears', 'Elbows point straight back', 'Stop at 90 degrees', 'Lock out gently'] },

  // --- pull -------------------------------------------------------------
  { id: 'row', name: 'Table Row', pattern: 'pull', unit: 'reps', load: 2,
    primary: ['lats', 'biceps'], secondary: ['upperBack', 'forearms', 'core'],
    cues: ['Chest to the edge, not chin', 'Pull elbows past your ribs', 'Body stays one straight line', 'Lower under control'] },
  { id: 'pullup', name: 'Bar Pull-Up', pattern: 'pull', unit: 'reps', load: 3,
    primary: ['lats', 'biceps'], secondary: ['upperBack', 'forearms', 'core'],
    cues: ['Start from a dead hang', 'Pull your chest to the bar', 'Shoulders down and back', 'No kicking — control the descent'] },
  { id: 'hang', name: 'Dead Hang', pattern: 'pull', unit: 'seconds', load: 1,
    primary: ['forearms'], secondary: ['lats', 'upperBack'],
    cues: ['Full grip, thumb around', 'Shoulders active, not slack', 'Breathe slowly', 'Step down, do not drop'] },

  // --- squat ------------------------------------------------------------
  { id: 'squat', name: 'Bodyweight Squat', pattern: 'squat', unit: 'reps', load: 2,
    primary: ['quads', 'glutes'], secondary: ['core', 'calves'],
    cues: ['Feet shoulder width, toes slightly out', 'Sit back and down', 'Knees track over your toes', 'Drive through mid-foot'] },
  { id: 'lunge', name: 'Reverse Lunge', pattern: 'squat', unit: 'reps', load: 2,
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'],
    cues: ['Step back, not forward', 'Back knee lightly kisses the floor', 'Torso stays tall', 'Push the front heel down'] },
  { id: 'calfraise', name: 'Calf Raise', pattern: 'squat', unit: 'reps', load: 1,
    primary: ['calves'], secondary: [],
    cues: ['Rise to the top slowly', 'Pause at full height', 'Lower all the way down', 'No bouncing'] },

  // --- hinge ------------------------------------------------------------
  { id: 'hipbridge', name: 'Hip Bridge', pattern: 'hinge', unit: 'reps', load: 1,
    primary: ['glutes', 'hamstrings'], secondary: ['lowerBack', 'core'],
    cues: ['Heels close to your hips', 'Drive through the heels', 'Squeeze at the top, ribs down', 'Lower one vertebra at a time'] },
  { id: 'goodmorning', name: 'Standing Hinge', pattern: 'hinge', unit: 'reps', load: 2,
    primary: ['hamstrings', 'lowerBack'], secondary: ['glutes'],
    cues: ['Soft knees, long spine', 'Push your hips back', 'Feel the stretch, not a round back', 'Stand tall by squeezing your glutes'] },
  { id: 'singleleg', name: 'Single-Leg Reach', pattern: 'hinge', unit: 'reps', load: 2,
    primary: ['hamstrings', 'glutes'], secondary: ['core', 'obliques'],
    cues: ['One line from crown to back heel', 'Hips stay square to the floor', 'Reach, do not rush', 'Return under control'] },

  // --- brace / core -----------------------------------------------------
  { id: 'plank', name: 'Front Plank', pattern: 'brace', unit: 'seconds', load: 2,
    primary: ['core'], secondary: ['shoulders', 'glutes'],
    cues: ['Elbows under shoulders', 'Ribs down, tailbone tucked', 'Squeeze glutes and quads', 'Breathe — do not hold your breath'] },
  { id: 'sideplank', name: 'Side Plank', pattern: 'brace', unit: 'seconds', load: 2,
    primary: ['obliques'], secondary: ['core', 'shoulders'],
    cues: ['Stack your feet and shoulders', 'Lift the hips high', 'Do not let the top shoulder roll forward', 'Even time on both sides'] },
  { id: 'deadbug', name: 'Dead Bug', pattern: 'brace', unit: 'reps', load: 1,
    primary: ['core'], secondary: ['lowerBack'],
    cues: ['Low back stays flat to the floor', 'Move the opposite arm and leg', 'Slow — three seconds out', 'Exhale as you extend'] },
  { id: 'superman', name: 'Back Extension', pattern: 'brace', unit: 'reps', load: 1,
    primary: ['lowerBack'], secondary: ['glutes', 'upperBack'],
    cues: ['Look at the floor, neck long', 'Lift chest and thighs together', 'Small range is plenty', 'Lower softly'] },

  // --- conditioning -----------------------------------------------------
  { id: 'jumpingjack', name: 'Jumping Jacks', pattern: 'condition', unit: 'reps', load: 2,
    primary: ['calves', 'shoulders'], secondary: ['quads', 'core'],
    cues: ['Land soft, knees bent', 'Full arm sweep overhead', 'Keep a steady rhythm', 'Breathe in time'] },
  { id: 'highknees', name: 'High Knees', pattern: 'condition', unit: 'seconds', load: 2,
    primary: ['quads', 'calves'], secondary: ['core'],
    cues: ['Knees to hip height', 'Stay on the balls of your feet', 'Arms drive with the legs', 'Tall posture, no leaning back'] },
  { id: 'burpee', name: 'Burpee', pattern: 'condition', unit: 'reps', load: 3,
    primary: ['quads', 'chest'], secondary: ['core', 'shoulders', 'triceps'],
    cues: ['Hands down before the feet jump back', 'Keep the plank rigid', 'Chest up as you stand', 'Pace it — this one bites'] },
  { id: 'mountain', name: 'Mountain Climbers', pattern: 'condition', unit: 'seconds', load: 2,
    primary: ['core', 'quads'], secondary: ['shoulders'],
    cues: ['Hips level, do not pike', 'Drive the knee to the chest', 'Shoulders stay over the hands', 'Quick but controlled'] },

  // --- mobility ---------------------------------------------------------
  { id: 'catcow', name: 'Cat-Cow', pattern: 'mobility', unit: 'reps', load: 1,
    primary: ['lowerBack'], secondary: ['core', 'upperBack'],
    cues: ['Move with your breath', 'Round fully, then arch fully', 'Let the movement start at the tailbone', 'No forcing the end range'] },
  { id: 'hipopener', name: 'Hip Opener', pattern: 'mobility', unit: 'seconds', load: 1,
    primary: ['glutes'], secondary: ['hamstrings', 'lowerBack'],
    cues: ['Front shin as parallel as it goes', 'Hips square, chest tall', 'Breathe into the stretch', 'Match the time on both sides'] },
  { id: 'shoulderopener', name: 'Shoulder Opener', pattern: 'mobility', unit: 'seconds', load: 1,
    primary: ['shoulders'], secondary: ['chest', 'upperBack'],
    cues: ['Hands wide on a doorway or strap', 'Chest through, ribs down', 'Stop before any pinching', 'Slow, even breathing'] },
  { id: 'hamstretch', name: 'Hamstring Stretch', pattern: 'mobility', unit: 'seconds', load: 1,
    primary: ['hamstrings'], secondary: ['calves', 'lowerBack'],
    cues: ['Hinge from the hip, spine long', 'Soft knee is fine', 'Ease in — no bouncing', 'Thirty seconds each side'] },
];

export const PATTERNS = {
  push:      { id: 'push',      name: 'Push',         color: 'accent' },
  pull:      { id: 'pull',      name: 'Pull',         color: 'primary' },
  squat:     { id: 'squat',     name: 'Squat',        color: 'grass' },
  hinge:     { id: 'hinge',     name: 'Hinge',        color: 'secondary' },
  brace:     { id: 'brace',     name: 'Brace',        color: 'water' },
  condition: { id: 'condition', name: 'Conditioning', color: 'danger' },
  mobility:  { id: 'mobility',  name: 'Mobility',     color: 'success' },
};

export const PATTERN_IDS = Object.keys(PATTERNS);

export function getMovement(id) {
  return MOVEMENTS.find((m) => m.id === id) || null;
}

export function movementsByPattern(pattern) {
  return MOVEMENTS.filter((m) => m.pattern === pattern);
}

// Every muscle a movement touches, primary first.
export function musclesOf(movement) {
  if (!movement) return [];
  return [...(movement.primary || []), ...(movement.secondary || [])];
}

export default MOVEMENTS;
