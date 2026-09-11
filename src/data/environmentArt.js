// Original connected environments, shared by walking and encounters.
// Biomes remain distinct even when several routes belong to the same landscape.
import { sceneTone } from './sceneSky';

const BY_CODE = { grass: 0, earth: 1, open: 2, path: 2, shade: 3, sand: 4, reef: 4, marsh: 5, snow: 6, cave: 7, floor: 1 };
const BY_TONE = {
  rill: 4, ember: 8, redmesa: 8, suncrack: 1,
  honeyfall: 9, amber: 9, ringwood: 9,
  staticridge: 10, thunderstep: 10,
  moonfen: 11, cometgrass: 11, starfall: 11, dusk: 11,
};
export function environmentCell(tone) {
  return BY_TONE[tone] ?? BY_CODE[sceneTone(tone).codes] ?? 0;
}
