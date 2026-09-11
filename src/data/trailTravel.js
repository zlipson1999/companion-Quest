// Visual scale only. Never used by the distance ledger or encounter rewards.
export const TRAIL_PIXELS_PER_MILE = 8046.72;
export function trailTravelPixels(miles) {
  return Math.max(0, Number.isFinite(miles) ? miles : 0) * TRAIL_PIXELS_PER_MILE;
}
export const TRAIL_NOTES = [
  'Maple leaves shade the path. Your companion watches the branches as you pass.',
  'Small cairns mark the firm ground. Follow the worn centre of the trail.',
  'The meadow opens into long grass. Wind bends the seed heads along the verge.',
  'Ferns crowd the shaded path. Your footfalls soften on the forest floor.',
  'Shells mark the high-water line. The route follows the dry sand above it.',
  'Reeds shelter the muddy banks. The marked path keeps to firmer ground.',
  'Snow gathers against the rocks. Old tracks trace the sheltered route.',
  'Pale stone catches the cave light. The trail follows the broad ledge.',
  'Red gravel crunches underfoot. Dark cooled rock borders the trail.',
  'Golden leaves collect at the roots. Your companion noses through the autumn air.',
  'Weathered rock marks the ridge. Low plants cling to the sheltered cracks.',
  'Moonlight catches tiny crystals. Violet moss softens the edges of the path.',
];
