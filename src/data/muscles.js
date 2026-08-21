// Muscle groups, and where each one sits on the 3D body map.
//
// `mesh` describes the low-poly plate drawn for the group in BodyMap3D: a box
// of `size` centred at `pos` (metres-ish, origin at the hips, +y up, +z toward
// the viewer's front). `mirror: true` draws the same plate at -x as well, so an
// arm or leg group is authored once.
//
// Names are the ordinary anatomical ones — real vocabulary, so the app teaches
// something true. Nothing here is borrowed from anyone's game.

export const MUSCLES = {
  chest:      { id: 'chest',      name: 'Chest',        short: 'CHEST', region: 'push',  mesh: { pos: [0.17, 1.22, 0.17], size: [0.30, 0.26, 0.10], mirror: true } },
  shoulders:  { id: 'shoulders',  name: 'Shoulders',    short: 'DELT',  region: 'push',  mesh: { pos: [0.44, 1.32, 0.00], size: [0.20, 0.20, 0.28], mirror: true } },
  triceps:    { id: 'triceps',    name: 'Triceps',      short: 'TRI',   region: 'push',  mesh: { pos: [0.47, 1.03, -0.07], size: [0.15, 0.30, 0.13], mirror: true } },
  upperBack:  { id: 'upperBack',  name: 'Upper Back',   short: 'TRAP',  region: 'pull',  mesh: { pos: [0.16, 1.30, -0.16], size: [0.30, 0.24, 0.10], mirror: true } },
  lats:       { id: 'lats',       name: 'Lats',         short: 'LATS',  region: 'pull',  mesh: { pos: [0.24, 1.06, -0.14], size: [0.18, 0.32, 0.13], mirror: true } },
  biceps:     { id: 'biceps',     name: 'Biceps',       short: 'BI',    region: 'pull',  mesh: { pos: [0.47, 1.03, 0.07], size: [0.15, 0.28, 0.13], mirror: true } },
  forearms:   { id: 'forearms',   name: 'Forearms',     short: 'FORE',  region: 'pull',  mesh: { pos: [0.50, 0.72, 0.00], size: [0.14, 0.30, 0.14], mirror: true } },
  core:       { id: 'core',       name: 'Core',         short: 'CORE',  region: 'brace', mesh: { pos: [0.00, 0.92, 0.17], size: [0.34, 0.36, 0.09], mirror: false } },
  obliques:   { id: 'obliques',   name: 'Obliques',     short: 'OBLQ',  region: 'brace', mesh: { pos: [0.24, 0.90, 0.06], size: [0.10, 0.32, 0.24], mirror: true } },
  lowerBack:  { id: 'lowerBack',  name: 'Lower Back',   short: 'LBACK', region: 'brace', mesh: { pos: [0.00, 0.90, -0.17], size: [0.32, 0.30, 0.09], mirror: false } },
  glutes:     { id: 'glutes',     name: 'Glutes',       short: 'GLUT',  region: 'hinge', mesh: { pos: [0.16, 0.60, -0.13], size: [0.28, 0.26, 0.16], mirror: true } },
  hamstrings: { id: 'hamstrings', name: 'Hamstrings',   short: 'HAM',   region: 'hinge', mesh: { pos: [0.17, 0.28, -0.10], size: [0.24, 0.36, 0.13], mirror: true } },
  quads:      { id: 'quads',      name: 'Quads',        short: 'QUAD',  region: 'squat', mesh: { pos: [0.17, 0.28, 0.10], size: [0.24, 0.38, 0.13], mirror: true } },
  calves:     { id: 'calves',     name: 'Calves',       short: 'CALF',  region: 'squat', mesh: { pos: [0.17, -0.22, -0.05], size: [0.18, 0.30, 0.16], mirror: true } },
};

export const MUSCLE_IDS = Object.keys(MUSCLES);

// The neutral body underneath the muscle plates — head, torso block, limb
// shafts. Drawn in a dim colour so highlighted groups read instantly.
export const BODY_FRAME = [
  { pos: [0.00, 1.68, 0.00], size: [0.34, 0.34, 0.32] },   // head
  { pos: [0.00, 1.45, 0.00], size: [0.16, 0.14, 0.16] },   // neck
  { pos: [0.00, 1.18, 0.00], size: [0.60, 0.40, 0.26] },   // ribcage
  { pos: [0.00, 0.88, 0.00], size: [0.50, 0.34, 0.24] },   // waist
  { pos: [0.00, 0.62, 0.00], size: [0.54, 0.24, 0.26] },   // pelvis
  { pos: [0.44, 1.03, 0.00], size: [0.16, 0.34, 0.16], mirror: true },  // upper arm
  { pos: [0.50, 0.72, 0.00], size: [0.13, 0.32, 0.13], mirror: true },  // forearm
  { pos: [0.52, 0.51, 0.00], size: [0.13, 0.14, 0.13], mirror: true },  // hand
  { pos: [0.17, 0.28, 0.00], size: [0.22, 0.42, 0.22], mirror: true },  // thigh
  { pos: [0.17, -0.20, 0.00], size: [0.17, 0.38, 0.17], mirror: true }, // shank
  { pos: [0.17, -0.43, 0.05], size: [0.18, 0.09, 0.28], mirror: true }, // foot
];

export function getMuscle(id) {
  return MUSCLES[id] || null;
}

export function muscleNames(ids) {
  return (ids || []).map((id) => (MUSCLES[id] ? MUSCLES[id].name : id));
}

export default MUSCLES;
