// The voice of Companion Quest. "Coach" is the warm guide who introduces the
// journey; once paired, your companion speaks by name. Always encouraging,
// always in your corner — never preachy, never guilt-trippy.

export const COACH = 'Coach Maple';

export const introLines = [
  { speaker: COACH, text: 'Welcome to Companion Quest! I’m Coach Maple, and I’ll help you learn how this world works.' },
  { speaker: COACH, text: 'Here, caring for yourself powers an adventure you can see and share.' },
  { speaker: COACH, text: 'Your real movement, workouts, meals, water, rest, and daily habits help you explore, grow, and bond with companions.' },
  { speaker: COACH, text: 'Your journey begins at home. Come outside and meet me at the gym next door—I’ll teach you everything there.' },
];

export function pairingLines(companionName, goalName) {
  return [
    { speaker: COACH, text: `"${goalName}" — a wonderful goal. I know just the friend for you.` },
    { speaker: COACH, text: '...' },
    { speaker: COACH, text: `Say hello to ${companionName}!` },
    { speaker: companionName, text: `Hi! I\'m ${companionName}. I already believe in you, you know.` },
    { speaker: companionName, text: 'Let\'s grow strong together — one real step, one real rep at a time. Ready?' },
  ];
}

const hubGreetings = [
  'Great to see you! What should we tackle today?',
  'I\'ve got a good feeling about today. Where to?',
  'Every little bit counts. Let\'s make today count too!',
  'I\'m right here with you. Just say the word.',
  'You showed up. That\'s already a win.',
];

export function hubGreeting() {
  return hubGreetings[Math.floor(Math.random() * hubGreetings.length)];
}

const routeCheers = [
  'Look at you go!',
  'Every step makes me a little stronger!',
  'Keep that pace — you\'ve got this!',
  'I can feel us getting closer!',
  'This is the good stuff. Real progress!',
];

export function routeCheer() {
  return routeCheers[Math.floor(Math.random() * routeCheers.length)];
}

export function milestoneLine() {
  return 'A milestone! Something\'s up ahead...';
}

export function pickupLine(itemName) {
  return `We found a ${itemName}! Nice pickup.`;
}

export function encounterLine(obstacleName) {
  return `The trail shifts — ${obstacleName} is holding the way ahead.`;
}

export function battleIntro(companionName, obstacleName) {
  return [
    { speaker: 'Trail', text: `${obstacleName} gathers across the path.` },
    { speaker: companionName, text: 'Don\'t worry — we beat this kind of thing with real effort. Let\'s move!' },
  ];
}

export function movePrompt(move) {
  if (move.kind === 'hold') {
    return `${move.blurb}\n\nHold for ${move.target} seconds, then confirm!`;
  }
  return `${move.blurb}\n\nDo ${move.target} ${move.exercise.toLowerCase()}, then confirm!`;
}

export function moveLanded(companionName, move) {
  const cheers = [
    `Nice work! That ${move.exercise.toLowerCase()} set really landed!`,
    'Direct hit! Your effort hurts that obstacle, not you!',
    `${companionName} feels your energy — great hit!`,
    'Boom! Real reps, real damage!',
  ];
  return cheers[Math.floor(Math.random() * cheers.length)];
}

export function victoryLines(companionName, obstacleName, xp) {
  return [
    { speaker: 'Narration', text: `The ${obstacleName} faded away!` },
    { speaker: companionName, text: `We did it! That\'s ${xp} XP earned the honest way.` },
    { speaker: companionName, text: 'I\'m proud of us. Onward!' },
  ];
}

export function defeatLines(companionName) {
  return [
    { speaker: companionName, text: 'Whew — let\'s rest a moment. No shame in that.' },
    { speaker: companionName, text: 'The obstacle will wait. We\'ll come back stronger, together.' },
  ];
}

export function levelUpLine(companionName, level) {
  return `${companionName} grew to Level ${level}! All that real effort is paying off.`;
}

export function evolveLines(oldName, newName) {
  return [
    { speaker: 'Trail', text: `${oldName}'s bond is shining brighter...` },
    { speaker: 'Trail', text: 'Your shared work is taking a new shape.' },
    { speaker: 'Trail', text: `${oldName} has grown into ${newName}!` },
    { speaker: newName, text: 'Look how far we\'ve come. And we\'re just getting started!' },
  ];
}

export function restLines(companionName) {
  return [
    { speaker: 'Caretaker', text: 'Welcome to the Hearth. Let\'s make room to recover.' },
    { speaker: 'Caretaker', text: 'Breathe in. Settle down. Let the trail wait.' },
    { speaker: 'Caretaker', text: `${companionName}'s resolve is restored. Return whenever you need.` },
  ];
}

const workoutCheers = [
  'That was real work. I felt every rep!',
  'You showed up and put in the effort. Respect!',
  'Strong work! That\'s how we grow.',
  'Logged it! Your consistency is the secret weapon.',
];

export function workoutComplete() {
  return workoutCheers[Math.floor(Math.random() * workoutCheers.length)];
}

// --- Phase 1.5: wild companions, catching, team swaps ---

export function sparIntro(activeName, partnerName) {
  return [
    { speaker: 'Coach Maple', text: `${partnerName} sets up. On my count — best effort, both of you.` },
    { speaker: activeName, text: 'Pick a movement and do it for real. Every rep you finish is Resolve I can spend.' },
  ];
}

export function trainerSparLines(activeName, trainerName, companionName) {
  return [
    { speaker: trainerName, text: `${companionName} has been working with me all morning. Your turn.` },
    { speaker: 'Coach Maple', text: `Same rules as any challenge. ${activeName} carries the Resolve — you do the work.` },
  ];
}

export function wardenTrainerLines(activeName, trainerName, companionName, line) {
  return [
    { speaker: trainerName, text: line || `${companionName} stands with me. This trail is ours until you earn it.` },
    { speaker: 'Coach Maple', text: `A Warden fight. ${activeName} carries the Resolve — you do the work. No Knot. Stay standing.` },
  ];
}

export function wildIntro(activeName, wildName, isCompanion, grownForm) {
  if (isCompanion) {
    return [
      { speaker: 'Trail', text: `${wildName} steps out to meet you.` },
      { speaker: activeName, text: 'A possible new friend! Match its effort, stay standing, then offer a Kinship Knot.' },
    ];
  }
  if (grownForm) {
    return [
      { speaker: 'Trail', text: `${wildName} is a grown form you already know.` },
      { speaker: activeName, text: 'Not an invitation — a challenge. Stay standing.' },
    ];
  }
  return [
    { speaker: 'Trail', text: `${wildName} gathers across the path.` },
    { speaker: activeName, text: 'A bad-habit type — we clear these with real effort. Let\'s move!' },
  ];
}

export function catchSuccessLines(wildName) {
  return [
    { speaker: 'Narration', text: 'You hold out the Kinship Knot, one loop open...' },
    { speaker: 'Trail', text: `${wildName} pushes its head through and pulls the braid tight. It joins your Circle!` },
    { speaker: wildName, text: 'I\'ll give it my all alongside you!' },
  ];
}

export function catchFailLine(wildName) {
  return `${wildName} steps back — it hasn't seen enough from you yet. Keep pace with it and stay standing.`;
}

export function catchFullLine(wildName) {
  return `Your Circle is full — six companions. ${wildName} cannot join, and the Knot stays with you. Make room first.`;
}

export function noKnotLine() {
  return 'You\'re out of Kinship Knots! The trail leaves them at milestones, and the smoothie bar braids them.';
}

export function pinLines(wardenName, pinName, nextTrail) {
  return [
    { speaker: 'Narration', text: `${wardenName} nods. The trail is yours.` },
    {
      speaker: 'Trail',
      text: nextTrail
        ? `You earn the ${pinName}. A Kinship Knot settles in your bag, and ${nextTrail} opens.`
        : `You earn the ${pinName}. A Kinship Knot settles in your bag.`,
    },
  ];
}

export function companionFledLines(wildName) {
  return [{ speaker: 'Trail', text: `${wildName} turns and disappears down a side path.` }];
}

export function swapLine(name) {
  return `${name}, take the lead with me.`;
}

// --- Phase 3: life modules (habits) ---

const habitCheers = [
  'Logged! That counts for both of us.',
  'Small thing, real thing. Nice.',
  'I felt that one. Keep stacking them.',
  'Honest log, honest growth.',
];

export function habitLogged() {
  return habitCheers[Math.floor(Math.random() * habitCheers.length)];
}

export function habitGoalLine(moduleName) {
  return `${moduleName} goal complete for today! That is the good stuff.`;
}

export function habitStreakLine(days) {
  if (days <= 1) return 'Day one of a new streak. I like where this is going.';
  return `${days} days running. Consistency is the real superpower.`;
}

export function habitsIntro() {
  return 'Your everyday choices count here too. Log them honestly — I only grow from what really happened.';
}

