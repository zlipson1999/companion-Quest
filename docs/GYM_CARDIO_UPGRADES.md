# Quest Fitness cardio upgrades

Quest Fitness now has a complete cardio line along its east wall: three
treadmills, two stationary bikes, and two rowers. The equipment remains the
interface — walk into a machine to use it — and Coach Maple's full-floor tour
now stops at the bikes and explains what crosses into the real world.

![Quest Fitness cardio floor](previews/gym-cardio-floor.png)

## Bike Rides

The bike in the gym is stationary; the player rides a real moving bicycle.
The in-game bicycle exists only inside Quest Fitness, and the activity is
always called a Bike Ride. Stepping onto the in-game bike opens a dedicated
ride console. The player starts GPS while parked, secures the phone, rides,
then ends the session only after stopping again.

![Bike console ready to start GPS](previews/gym-bike-ready.png)

Once GPS is live, distance updates the console and the character pedals only
when a real location delta arrives. The console reports elapsed time, measured
distance, average speed, GPS state, and a clearly labelled calorie estimate.

![Bike console receiving a simulated GPS delta during web QA](previews/gym-bike-gps-live.png)

Ride miles pay distance XP and companion cardio progress — real movement
still grows the companion — but they mint no Quest Credits and never touch
the trail system: no trail id, no trail quota, no milestone meter, no trail
encounters (`src/state/distancePolicy.js` enforces all four). They are
recorded separately as cycling miles, completed Bike Rides and cardio
sessions in the Phone; reception records attendance only and holds no
mileage.

## Treadmills

Treadmills keep using the phone's real step source. The player walk/run frames
animate only while step deltas arrive, so a stationary phone never makes the
character run. The browser development build can show its existing step
injector for QA; release builds and the bike never expose manual distance.

![Treadmill console](previews/gym-treadmill-ready.png)

The same save migration adds `cyclingMi` and `ridesDone` without inventing
history for existing players. Cycling speed/MET calculations and both old-save
migration paths have deterministic checks in `tools/`.
