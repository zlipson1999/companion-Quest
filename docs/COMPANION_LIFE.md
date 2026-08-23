# Companion Quest — Make Companions Feel Alive

The 40 Horizon families already carried encounter rules, passives,
personality, and behavioral evolve needs as data. This layer is what
makes those fields do something, without restyling the game.

## Conditional encounters

`rollWildEncounter` still uses the trail's `companions` pool. It now
also receives a wellness context (`encounterContext`):

- time of day (morning / midday / evening)
- miles on this walk
- hydration / sleep / meals logged today
- workout, recovery, streak, personal best

A companion whose `encounter.when` is not met cannot step out. If
nobody qualifies, the trail rolls its obstacle instead of a random
face. Rarity weights the pick among those who do qualify.

## Passives

The active companion's `passive.id` is resolved in
`src/state/companionLife.js` (`PASSIVE_FX`). Events that fire it:

| Event | From |
| --- | --- |
| hydration / sleep / meal / workout | life-module log |
| distance / cardio | outdoor miles |
| recovery | rest day |
| pr | new personal best |
| pin | first Warden clear |

Examples: Tidal Sip extra bond+heal on a drink; Sunplate double evolve
points on a strength session; Comet Pace 1.5× morning trail miles.

## Behavioral evolution

Level and evolve points are still the baseline. Horizon families also
need a behavior count (`evolveNeed.behavior`): drinks, workouts, nights
of sleep, miles, meals, recovery days, cardio, or a streak.

The Status page and the Growth Ceremony show the same checklist:

```
Level 5/5 ✓
Bond Points 30/30 ✓
Hydration 4 / 6
```

`canEvolve` is false until all three are true.

## Personality

Idle lines appear on the companion HUD, Team, and Status. Encourage
lines fire after a habit log and when someone steps onto the trail.
Bond 10 / 25 / 50 / 100 writes the family's milestone text into
Memories.

## Memories

Each companion keeps a short scrapbook on the member record:

- First Walk Together
- First Workout / First Drink
- Bond 10 / 25 / 50 / 100
- Evolved into …
- Cleared (Quest Pin)
- Longest Adventure

Shown on Status. Capped at 24 entries.

## Index

Undiscovered rows can show an encounter hint. Owned rows show habitat
(trail · biome · region), the passive, personality, the next form, and
miles/sessions together.

## What this does not change

No new screens. No restyle of Hub, Route, Battle, or gym. Grove
trails and their cumulative pools stay as they were.
