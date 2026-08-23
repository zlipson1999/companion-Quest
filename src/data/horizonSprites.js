// Horizon first-pass pipeline sprites (unique stage plates).
// Replaces Grove stand-ins. Hand-painted art can replace later without id changes.
import { HORIZON_SPRITES_BATCH_0 } from './horizonSprites_batch0';
import { HORIZON_SPRITES_BATCH_1 } from './horizonSprites_batch1';
import { HORIZON_SPRITES_BATCH_2 } from './horizonSprites_batch2';
import { HORIZON_SPRITES_BATCH_3 } from './horizonSprites_batch3';

export const HORIZON_SPRITES = {
  ...HORIZON_SPRITES_BATCH_0,
  ...HORIZON_SPRITES_BATCH_1,
  ...HORIZON_SPRITES_BATCH_2,
  ...HORIZON_SPRITES_BATCH_3,
};

export default HORIZON_SPRITES;
