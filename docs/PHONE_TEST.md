# Phone test: does the engine actually turn on?

Everything in this app rests on one code path that has never run: the pedometer
counting real steps and turning them into miles. Every other feature is
decoration on top of it. This is the test that proves it works.

You need a real phone. A simulator has no pedometer and will report exactly the
failure this test is looking for, so a simulator pass means nothing.

## Setup

```bash
npm install
npx expo start          # scan the QR with Expo Go
```

Android needs **Physical activity** permission; iOS needs **Motion & Fitness**.
Both are declared in `app.json`, but Expo Go asks at runtime — say yes. If you
say no by accident, revoke and re-grant in system settings; the app does not
ask twice.

---

## Test 1 — Is the pedometer even detected?  ⬅ the one that matters

Go to **Route 1**.

| What you see | What it means |
|---|---|
| "Movement detected — walk or run to advance!" | ✅ `Pedometer.isAvailableAsync()` returned true. The engine exists. |
| A red **`DEV ONLY · no pedometer detected`** box with `+0.05mi` buttons | ❌ **This is the failure case.** On a real phone this box should never appear. |

If you get the red box on a real phone, stop and tell me — nothing else in this
list is worth running. Note your phone model and OS version; the likely causes
are a denied permission, an Android device without a step-counter sensor, or
`expo-sensors` not being available inside Expo Go on your OS version.

## Test 2 — Do steps become miles at the right rate?

Stay on the Route screen, phone in hand, and **walk 100 steps**, counting them
yourself.

- Expected: **0.05 mi** added. The conversion is `STEPS_PER_MILE = 2000`
  (`src/data/route.js`), so 100 steps = 0.05 mi exactly.
- The "mi total" readout is 2 decimal places, so watch for it to tick 0.05.

If miles move but the number is wrong, the conversion is the bug, not the
sensor — tell me the steps you took and the miles you got and I can fix the
constant.

## Test 3 — Does it count with the screen off?

This is the make-or-break one for a fitness app: nobody walks staring at the
Route screen.

1. Note your mile total.
2. **Lock the phone.** Put it in your pocket.
3. Walk about 200 steps.
4. Unlock, return to the app.

- Expected: roughly **0.1 mi** more than when you locked it.
- If it gained **nothing**, `watchStepCount` is being suspended in the
  background. That is a real, fixable problem but it changes the design — tell
  me and I'll switch to reading the step *total* since a timestamp rather than
  watching a live stream.

## Test 4 — Does a milestone fire?

Milestone distance depends on the goal you picked (`src/data/route.js`):

| Goal | Milestone every |
|---|---|
| Go the Distance | 0.20 mi |
| Build Strength | 0.30 mi |
| Find Balance | 0.25 mi |

Walk past one. Expected: a sound, an item drop, and the milestone counter on the
Route header advancing.

## Test 5 — Does an encounter roll?

Encounters roll off distance walked, between `encMin` and `encMax` for your
goal — for "Go the Distance" that's every **0.08–0.16 mi**. So roughly every
160–320 steps you should hit a battle.

Walk ~0.3 mi. Expected: at least one encounter. Check that:
- the battle transition plays
- the creature sprite and both status plates render
- a move can be selected and resolves
- **Run** returns you to the Route with the Route music playing (not battle music)

## Test 6 — Does GPS running work?

Tap **Start Run**. Grant location. Walk outdoors for ~2 minutes.

- Expected: distance accrues from GPS rather than steps, and it does not
  double-count (while running, step-derived miles are deliberately suppressed).
- Indoors or with a poor fix this will be noisy — do it outside.

## Test 7 — Does it survive being closed?

1. Note level, XP, mile total, and any habit streaks.
2. Fully quit Expo Go (swipe it away, don't just background it).
3. Reopen.

Expected: everything exactly as you left it. Save format is `version: 4`
(`src/state/GameContext.js`) persisted to AsyncStorage.

## Test 8 — Does the day roll cleanly?

If you can leave it overnight: log a habit today, then open the app tomorrow.

Expected: today's counters reset to zero, the streak *survives* (a streak
survives a day roll if the goal was met today or yesterday), and nothing shows
yesterday's numbers.

---

## What to send me

For anything that fails:

1. Which test number.
2. Phone model + OS version.
3. A screenshot.
4. What you did vs. what happened — exact numbers where there are numbers
   ("walked 100 steps, got 0.02 mi" is fixable; "distance seemed off" is not).

If Test 1 fails, send me that and nothing else — everything downstream is
meaningless until the sensor is reachable.
