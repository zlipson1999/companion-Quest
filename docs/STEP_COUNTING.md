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
inside Expo Go. The trade-off is real, and the Route says so on screen:

> it only counts while the app is open on that screen.

Close the app and your steps stop counting. This is a fallback, not a
replacement.

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

Open **Route 1**:

| Message | Source |
|---|---|
| "Step counter connected — walk to advance!" | OS pedometer. Counts in your pocket. |
| "Counting your steps — keep the app open and walk!" | Accelerometer fallback. Foreground only. |
| Red "No step counter available" box | Neither works. The box prints platform, permission status and error. |
