// Regional badge masters. One per region's FINAL trail / Warden.
// The live pin is still `trails.progress[routeId].pin` — this file only names
// the art so existing screens can look a badge up without a UI rewrite.

export const REGIONAL_BADGES = [
  { id: 'grove-badge', name: 'Grove Badge', regionId: 'grove', trailId: 'ember', sprite: 'grove-badge' },
  { id: 'tideglass-badge', name: 'Tideglass Badge', regionId: 'tideglass', trailId: 'tideglass', sprite: 'tideglass-badge' },
  { id: 'mesa-badge', name: 'Mesa Badge', regionId: 'redmesa', trailId: 'redmesa', sprite: 'mesa-badge' },
  { id: 'fen-badge', name: 'Moonfen Badge', regionId: 'moonfen', trailId: 'moonfen', sprite: 'fen-badge' },
  { id: 'frost-badge', name: 'Frostpine Badge', regionId: 'frostpine', trailId: 'frostpine', sprite: 'frost-badge' },
  { id: 'copper-badge', name: 'Copper Canyon Badge', regionId: 'copper', trailId: 'copper', sprite: 'copper-badge' },
  { id: 'prairie-badge', name: 'Starfall Badge', regionId: 'starfall', trailId: 'starfall', sprite: 'prairie-badge' },
  { id: 'orchard-badge', name: 'Amber Orchard Badge', regionId: 'amber', trailId: 'amber', sprite: 'orchard-badge' },
  { id: 'summit-badge', name: 'Thunderstep Badge', regionId: 'thunderstep', trailId: 'thunderstep', sprite: 'summit-badge' },
  { id: 'rootwater-badge', name: 'Mangrove Badge', regionId: 'mangrove', trailId: 'mangrove', sprite: 'rootwater-badge' },
  { id: 'horizon-badge', name: 'Deep Horizon Badge', regionId: 'deephorizon', trailId: 'deephorizon', sprite: 'horizon-badge' },
];

export const BADGE_BY_REGION = Object.fromEntries(REGIONAL_BADGES.map((b) => [b.regionId, b]));
export const BADGE_BY_TRAIL = Object.fromEntries(REGIONAL_BADGES.map((b) => [b.trailId, b]));

export function badgeForRegion(regionId) {
  return BADGE_BY_REGION[regionId] || null;
}

export default REGIONAL_BADGES;
