# Connected-world gameplay overhaul

Sunkist Lane, the home and Quest Fitness now use continuous landscapes or architectural floors. Furniture and gym equipment are independently positioned from the interaction map, with contact shadows and depth ordering. The collision grid remains invisible. Trails and encounters use twelve matching biome families with connected ground. The trail HUD and battle controls leave more room for the scene.

The sprite renderer draws 282 existing traced sprites as complete PNG sheets, preserving authored palettes, aspect ratios and idle frames. This improves rendering; it does not claim 282 new character designs.

## Actual in-game screenshots

Captured from real Expo web screens using an isolated development fixture. The fixture and preview save namespace are excluded from the production web bundle.

![Town](town-seamless.jpg)
![Gym](gym.jpg)
![Downstairs](home.jpg)
![Bedroom](bedroom.jpg)
![Trail](trail.jpg)
![Battle](battle.jpg)

## Verification

- Walked into the house and returned to its matching doorstep; checked the pond-side bench and Stillness return.
- Traversed the stairs in both directions and entered/exited a treadmill. No movement correctly produced zero credits and nothing to save.
- Checked trail save-and-return and battle move selection/cancel.
- All 21 commands from the repository test script passed individually, including lint, docs, art, client rules, server auth and friends. Lint has 11 existing hook warnings, zero errors.
- Sprite/audio regeneration reproduced tracked output.
- Final Android export: 1171 modules. Final web export: 912 modules. Both succeeded.
- Physical-phone pedometer/GPS, native touch, performance and sign-in remain unverified.

## Asset provenance and maintenance

Original raster assets were created with the built-in image generation tool. Direction: richly shaded late-1990s handheld RPG art, consistent top-down perspective, connected materials without checkerboard ground, dimensional objects and contact shadows. No franchise characters or UI are baked into scenes.

- `sunkist-lane-v2.png`: continuous grass and sandy paths, red cottage, blue fitness hall, pond, bench, garden and tree border, using the previous gameplay layout as a spatial reference.
- `home-floor-v2.png`: empty warm plank floor, cream perimeter walls and two north windows; furniture remains independent.
- `quest-fitness-floor-v2.png`: empty rubber floor, wooden north lifting deck, lower turf and mat areas, mirrors and perimeter walls.
- `home-furniture-v2.png`: transparent 4-by-5 atlas of kitchen, living-room, bedroom and stair furniture.
- `gym-equipment-v2.png`: transparent 4-by-5 atlas of gym machines, racks, weights and service furniture.
- `trail-environments-v2.png`: 3-by-4 atlas of continuous forest, earth, grassland, shade, coast, marsh, snow, cave, ember, autumn, storm and moonlit trails.
- `battle-environments-v2.png`: corresponding 3-by-4 encounter clearings, with open space for separate combatant sprites.

`SceneProps` crops original RGBA atlases using source alpha bounds in `propBounds.js`; pixels are not rewritten. `worldArt.js` selects room floors. `environmentArt.js` selects biome panels. Existing interaction codes remain authoritative. The old tile atlas remains available for fallback art.

## Placement, travel and regional platforms follow-up

Downstairs now groups kitchen counters on the north wall, dining furniture northeast, and the sofa/coffee table/TV around a southwest rug. The eastern aisle and entry remain clear. Upstairs the bedside lamp/nightstand and desk/chair form usable groups, with storage and a smaller central rug.

Moved downstairs codes: `a`, `m`, `v`, `x`, `f`, `l`, `p`, `o`; upstairs: `k`, `m`, `o`, `v`, `l`, `p`. Doors, stairs and the bed trigger retain their coordinates. All codes have atlas renderers. The new reachability test checks every usable station and both floors' exits; the two bed codes represent one object. Browser checks covered the desk, dining table, return positions and stairs in both directions.

Trail scenery now tracks accumulated measured distance instead of a repeating timer. No distance means no travel, including when GPS is enabled. Foreground details and inspectable trail markers use a separate travel depth; markers reveal regional observations without awarding progress. The player faces along the trail. Reduced motion snaps scenery to the new distance. A disposable development input of 0.05 miles moved the scene and marker; later paused scenery pixels matched exactly. No real fitness session was created.

Battle platforms use twelve original transparent terrain patches, selected with the same biome index as the trail and clearing. Rill maps to coastal sand and Gale to open meadow. The gym uses a training mat.

![Coastal battle](battle-coast.jpg)
![Trail before distance](trail-before.jpg)
![Trail after distance](trail.jpg)

All 22 repository test commands passed individually, including the new placement/travel suite. Native sensor cadence and performance still need a phone.
