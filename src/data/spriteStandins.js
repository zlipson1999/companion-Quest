// Horizon families have no traced pixel masters yet. Until plates land in
// tools/reference_art/ and make_sprites emits them, PixelSprite looks here
// so a missing key still draws — same palette family, matching stage.
//
// A stand-in is not a new drawing. Traced art always wins when present.

import { HORIZON_CREATURES } from './horizonCreatures';

const STAGE_KEYS = {
  dew: ['dewbble', 'tidewade', 'maelstride'],
  rock: ['pebblepup', 'cairnhound', 'monolithound'],
  moss: ['stillcup', 'dewbasin', 'rainhold'],
  sprout: ['sproutle', 'bloomtail', 'groveheart'],
  chock: ['chockit', 'crackwedge', 'cliffchock'],
  air: ['wispurr', 'galegait', 'skywhorl'],
  tide: ['dewbble', 'tidewade', 'maelstride'],
  ember: ['emberkit', 'pyrelynx', 'cindermane'],
  lantern: ['lanternbud', 'gleambud', 'grovelamp'],
  cinder: ['emberkit', 'pyrelynx', 'cindermane'],
  bloom: ['sproutle', 'bloomtail', 'groveheart'],
  quartz: ['facetel', 'prismore', 'quartzspire'],
  bramble: ['bramblet', 'briarthicket', 'hedgeroot'],
  kite: ['kitefin', 'ribbonsail', 'skysheet'],
  fern: ['fernap', 'fiddlefrond', 'frondrest'],
  puff: ['loftburr', 'driftpuff', 'cloudburr'],
  grove: ['sproutle', 'bloomtail', 'groveheart'],
  samara: ['spinseed', 'whirlkey', 'samaraile'],
  scorch: ['emberkit', 'pyrelynx', 'cindermane'],
  spore: ['sporelet', 'mycobloom', 'canopore'],
  dapple: ['dapple', 'glimmoth', 'leaflight'],
  brine: ['dewbble', 'tidewade', 'maelstride'],
  shore: ['dewbble', 'tidewade', 'maelstride'],
  pyre: ['emberkit', 'pyrelynx', 'cindermane'],
};

const BY_KEY = {};
Object.keys(HORIZON_CREATURES).forEach((id) => {
  const c = HORIZON_CREATURES[id];
  const row = STAGE_KEYS[c.palette] || STAGE_KEYS.sprout;
  const i = Math.max(0, Math.min(2, (c.stage || 1) - 1));
  BY_KEY[c.sprite || id] = row[i] || row[0];
});

export function standinSprite(spriteKey, palette, stage) {
  if (BY_KEY[spriteKey]) return BY_KEY[spriteKey];
  const row = STAGE_KEYS[palette] || STAGE_KEYS.sprout;
  const i = Math.max(0, Math.min(2, (stage || 1) - 1));
  return row[i] || row[0];
}

export default STAGE_KEYS;
