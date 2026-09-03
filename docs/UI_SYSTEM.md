# Trailkeeper UI system

The field-journal primitives live in `src/theme/tokens.js` and
`FieldCard` / `TrailAction` / `ObjectiveRibbon`. `palette` still works.
A screen moves over when it is restyled, not in one sweep.

Touch targets never go below 44 (`tokens.scale.touchMin`). `TrailAction`
already honours that. `PixelButton` now does too, so leftover Window
screens are not 28px tall.

## Already on Trailkeeper

| Screen | Notes |
|---|---|
| Hub, Gym, HomeIntro, HomeRest | `WorldScreen` (ribbon + TrailAction menu) |
| Friends, Board | FieldCard / TrailAction / ObjectiveRibbon |
| Cookbook, SmoothieBar | mixed: FieldCard + leftover Window for a receipt strip |
| Route | CardioConsole + TrailAction sheet; Window for the step panel |

## Converted in this pass

Title, Options, Week — journal screens that were still Window/PixelButton
for no reason other than they had not been touched.

## Stay legacy, and why

These keep `Window` / `PixelButton` on purpose. Converting them in the
same pass as the journal screens would make a half-finished Forge or
challenge console, which is worse than a known leftover.

| Screen | Why it stays |
|---|---|
| Battle, SparIntro | Original Resolve/Growth challenge console. `BattleStage` / `StatusPlate` / `DualPane` are their own composition. A FieldCard here would flatten the stage. |
| Forge, ForgeEdit | Session runner + plan builder. Dense +/- steppers, body map, perk list. Needs its own Trailkeeper pass, not a search-replace. |
| FormCheck | Camera mirror + cue ticker. The dark Window *is* the fascia. |
| Workout | Preset runner with DialogueBox result. Same family as Battle. |
| Habits, HabitLog | Module cards already have a layout. Convert with the next module, not alone. |
| Bag, Party, Index, Summary | Inventory / record. Same journal pattern as Week; next pass. |
| Coach, CoachTutorial | DualPane + DialogueBox. Tutorial is currently unreachable (see audit A1). |
| Goal, Outfit, Pairing, Intro | First-rendition plates. They show the three-face card; Window is the mat. |
| Loading | No chrome. |

Cookbook / SmoothieBar / Route keep a Window where it is a receipt or a
debug sheet, not a page.

## How to convert a leftover

1. `ObjectiveRibbon` for the place name + what to do next.
2. `FieldCard tone="paper"` for journal information, `tone="ink"` in the world.
3. `TrailAction` for every action. Do not mix PixelButton on the same row
   unless it is a stepper (`+/-`) that already meets `touchMin`.
4. Screenshot the screen. A bundle is not a visual check.
5. Do not change copy that names Quest Fitness / the gym / Sunkist Lane /
   the trails.


## One panel, two stocks

`DialogueBox` and `CardioConsole` are on the token system now, so the game has
one idea of what a panel is instead of three.

The dialogue used to be a `Window`: cream fill, purple frame, bevelled
highlights — chrome that appeared nowhere else, so which panel you saw depended
on which screen you were standing on. It is a `FieldCard` with `tone="paper"`
now: the same card the lane and the objective ribbon use, in the same tokens,
with the same offset shadow, border and stepped corner.

Paper is kept on purpose. Dialogue reading as a page is the point, and the token
set already carries the stock for it (`sheet`, `sheetEdge`, `textOnPaper`). What
went is the one-off frame, not the character. A card is ink OR paper — pass
`tone`, and mind that it is `tone="paper"` and not an `onPaper` flag: spelling
it wrong renders an ink card with paper-coloured text, which is dark ink on a
dark surface and cannot be read.

The console's shell was a hand-typed `#101219ee` that happened to equal
`tokens.surfaceSunken`. It asks for the token now.
