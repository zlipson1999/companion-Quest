// The voice of Companion Quest. "Coach" is the warm guide who introduces the
// journey; once paired, your companion speaks by name. Always encouraging,
// always in your corner — never preachy, never guilt-trippy.

export const COACH = 'Coach';

export const introLines = [
  { speaker: COACH, text: 'Oh! Hello there. I was hoping you\'d come.' },
  { speaker: COACH, text: 'Welcome, trailkeeper. You can call me Coach.' },
  { speaker: COACH, text: 'This is a world where your real life is the adventure. Every step you take outside... moves you here too.' },
  { speaker: COACH, text: 'There are no fake shortcuts. No "walk" buttons. Your effort is the only magic that works here.' },
  { speaker: COACH, text: 'And you won\'t go alone. A companion is waiting to grow alongside you — cheering every healthy choice you make.' },
  { speaker: COACH, text: 'First things first. Tell me... what are you hoping for?' },
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

export function wildIntro(activeName, wildName, isCompanion) {
  if (isCompanion) {
    return [
      { speaker: 'Trail', text: `${wildName} steps out to meet you.` },
      { speaker: activeName, text: 'A possible new friend! Build trust through real effort, then offer a Bond Token.' },
    ];
  }
  return [
    { speaker: 'Trail', text: `${wildName} gathers across the path.` },
    { speaker: activeName, text: 'A bad-habit type — we clear these with real effort. Let\'s move!' },
  ];
}

export function catchSuccessLines(wildName) {
  return [
    { speaker: 'Narration', text: 'You hold out a Bond Token...' },
    { speaker: 'Trail', text: `${wildName} accepts and joins your Circle!` },
    { speaker: wildName, text: 'I\'ll give it my all alongside you!' },
  ];
}

export function catchFailLine(wildName) {
  return `${wildName} isn't quite ready to trust you. Wear it down a little more, then try again!`;
}

export function catchFullLine(wildName) {
  return `Your Circle has no open place, so ${wildName} can't join yet — the meeting is recorded in your Journal.`;
}

export function noTokenLine() {
  return 'You\'re out of Bond Tokens! Find more on the Route.';
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

