// Fallback only. When a spriteKey is missing from sprites.js, PixelSprite
// maps Horizon forms to a same-palette Grove stage so the UI never blanks.
//
// Traced masters in sprites.js / horizonSprites always win. After Horizon
// plates ship, this file should not be hit for those ids in normal play.

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
};

export function standinSprite(spriteKey, palette, stage) {
  const creature = HORIZON_CREATURES[spriteKey];
  const pal = palette || (creature && creature.palette) || 'sprout';
  const st = stage || (creature && creature.stage) || 1;
  const row = STAGE_KEYS[pal] || STAGE_KEYS.sprout;
  const i = Math.max(0, Math.min(2, (st | 0) - 1));
  return row[i];
}
