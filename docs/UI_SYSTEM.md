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

## Nothing is legacy any more

The table below used to say which screens kept `Window` and why. All of
them have moved: nineteen files, seventy-nine panels, in one pass.

The reasoning it replaced was sound at the time — converting a dense
screen like the Forge alongside the journal ones would leave it
half-finished, worse than a known leftover. What changed is that the
conversion turned out not to be a redesign. `Window`'s cream fill sits at
luminance 243 and `FieldCard`'s paper at 244; its dark fill at 28 and ink
at 44. Every text colour that was readable on the old surface is readable
on the new one, so the migration is a frame swap and the dense screens
keep their layouts intact. `pad` moved onto `FieldCard` rather than being
dropped, because a status strip at 3 and a summary at 18 are different
objects and collapsing both to 12 loses that.

Two things did NOT come across and had to be handled by hand:

- **`tone` is `ink` / `paper`, never `cream` / `dark`.** Hand a card the
  old vocabulary and `onPaper` is simply false, so it falls through to ink
  — with the cream-page text still on it. Two sites passed a computed tone
  (`tone={active ? 'dark' : 'cream'}`) and a mechanical rewrite left both
  props in place, where the last one silently wins. `PartyScreen`'s roster
  rendered every row dark with unreadable dim text until it was fixed.
- **`innerStyle` has no equivalent.** One site used it for a minimum
  height, which is a style on the card.

`tools/test_panels.mjs` now holds all of it: no file renders a `Window`,
no card is handed `cream`/`dark`, no tag carries two `tone` props, and
every text colour inside a card clears 45 luminance against its surface.
That last one is the check that matters — the failure it catches lints
clean and type-checks, and screenshots only reach the screen you happen to
be looking at. It reads 243 colours across every screen at once.

### The old table, kept for the reasoning

These were the arguments for leaving each one alone. They are worth
keeping because most of them are still the right argument for any FUTURE
sweep that is a redesign rather than a frame swap.

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

None of them keep a Window now; the receipt and debug sheets are cards on
the same two stocks as everything else.

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
