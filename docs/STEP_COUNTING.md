# Why steps sometimes come from the accelerometer

The app has two ways to count steps and prefers the first.

## 1. The OS step counter (`expo-sensors` Pedometer) — preferred

The phone counts steps in hardware. It works with the screen off and in your
pocket, costs almost no battery, and is what the game is designed around.

It needs three things: a device with a step-counter sensor, the **Physical
activity** (Android) / **Motion & Fitness** (iOS) permission, and a build that
can reach the sensor.

That last one is the catch. **Expo Go cannot always reach it.** Expo Go is a
shared sandbox hosting arbitrary projects, so its native module access is
limited and its permissions are its own, not this app's. On a phone whose
hardware works fine, `Pedometer.isAvailableAsync()` can still return false
inside Expo Go — and that is exactly what happened on the first real-device
test.

## 2. Our own detector (`src/state/stepDetector.js`) — fallback

When the OS counter is unreachable, the app counts steps itself from the
accelerometer: peak detection on acceleration magnitude, with hysteresis and a
refractory gap so handling noise and shaking do not mint steps.

The accelerometer needs **no permission**, exists on every phone, and works
inside Expo Go. The trade-off is real, and the Route says so on screen — it
reads "Counting your steps — keep the app open and walk!", where the OS
pedometer's line does not mention keeping anything open.

Close the app and your steps stop counting. This is a fallback, not a
replacement.

## 2b. When the phone reports motion too slowly

The Route can also say, in amber:

> This phone reports motion at N Hz, which is too slow to catch every footfall —
> your real step count is higher than this. A development build fixes it
> properly; see docs/STEP_COUNTING.md.

That line sends you here, so here is the answer it was pointing at.

A footfall impulse lasts about **90 ms**. Sampling slower than roughly **15 Hz**
starts missing peaks entirely between samples: measured at 10 Hz the detector
lost **40% of steps**. So `useDistance` asks for 50 Hz (`MOTION_INTERVAL_MS = 20`),
which leaves headroom for platforms that clamp the rate or throttle under battery
saver, and it measures what it actually gets (`motionHz`). Below
`MOTION_MIN_HZ = 15` it sets `motionSlow` and the Route says so.

It reports rather than hides, because a step count that is quietly 40% low is
worse than one that tells you it is low. The usual cause is Expo Go throttling
the sensor; a development build (§5) gets the full rate and usually the OS
pedometer as well, which sidesteps the accelerometer path completely.

## 3. The stand-in buttons — DEVELOPMENT ONLY

When neither source exists at all (a desktop browser, a simulator), the trail
and the treadmill/rower console offer `+0.05mi` / `+0.25mi` / `+1mi` buttons.
The bike never does: a Bike Ride is GPS-only even in development.

Regardless of sensor source, gym treadmill and bicycle deltas are tagged as gym
cardio. They update fitness/cardio history but cannot carry a `routeId`, advance
a trail or its milestone meter, roll an encounter, or mint Trail Credit.

These are gated on three things: `__DEV__ && source === 'none' && !running`.
The last one means they also disappear for the duration of a GPS run or ride,
which is correct — GPS is already measuring real distance — but surprising enough that
a reader who did not know would report it as a bug. A button that adds
distance you did not walk is the exact thing this game is built not to have —
real life is the game, there are no walk buttons — so they exist to test on a
desktop and never reach a phone or the published web build.

The consequence is worth knowing before you go looking for it: **a release
build cannot be driven.** Testing anything downstream of distance end to end
means building once with the gate lifted, and putting it back afterwards.

## Getting the real thing: a development build

To reach the hardware step counter, build a real app instead of running inside
Expo Go. `app.json` already declares the permissions
(`ACTIVITY_RECOGNITION`, `NSMotionUsageDescription`).

```bash
npm install -g eas-cli
eas login                 # needs a free Expo account
npx expo install expo-dev-client
eas build --profile development --platform android
```

Roughly 15 minutes on the free tier. It produces an APK to install; from then
on `npx expo start --dev-client` runs against it, and the Route should say
**"Step counter connected"** instead of falling back.

The same command with `--platform ios` works, but installing on a physical
iPhone needs an Apple Developer account.

## How to tell which one is running

Open **the trails** (Maple Trail):

| Message | Source |
|---|---|
| "Step counter connected — walk to advance!" | OS pedometer. Counts in your pocket. |
| "Counting your steps — keep the app open and walk!" | Accelerometer fallback. Foreground only. |
| "Looking for a step counter..." | `source === 'probing'`. The detector listens for `MOTION_PROBE_MS` (1200 ms) before deciding the phone delivers motion at all, so this is the honest state in between rather than a wrong answer given early. |
| Red "No step counter available" box | Neither works. The box prints platform, permission status and error. |
