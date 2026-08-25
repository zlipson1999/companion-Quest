# Quest Fitness cardio upgrades

Quest Fitness now has a complete cardio line along its east wall: three
treadmills, two stationary bikes, and two rowers. The equipment remains the
interface — walk into a machine to use it — and Coach Maple's full-floor tour
now stops at the bikes and explains what crosses into the real world.

![Quest Fitness cardio floor](previews/gym-cardio-floor.png)

## Outdoor bicycle rides

The bike in the gym is stationary; the player rides a real moving bicycle
outside. Stepping onto the in-game bike opens a dedicated ride console. The
player starts GPS while parked, secures the phone, rides, then ends the session
only after stopping again.

![Bike console ready to start GPS](previews/gym-bike-ready.png)

Once GPS is live, distance updates the console and the character pedals only
when a real location delta arrives. The console reports elapsed time, measured
distance, average speed, GPS state, and a clearly labelled calorie estimate.

![Bike console receiving a simulated GPS delta during web QA](previews/gym-bike-gps-live.png)

Ride miles earn the same distance XP, Trail Credit, milestones, and companion
cardio progress as other honest mileage. They are recorded separately as
cycling miles and completed bike rides in the Phone and Reception, but never
receive a trail id, never fill a walking trail, and never roll trail encounters.

## Treadmills

Treadmills keep using the phone's real step source. The player walk/run frames
animate only while step deltas arrive, so a stationary phone never makes the
character run. The browser development build can show its existing step
injector for QA; release builds and the bike never expose manual distance.

![Treadmill console](previews/gym-treadmill-ready.png)

The same save migration adds `cyclingMi` and `ridesDone` without inventing
history for existing players. Cycling speed/MET calculations and both old-save
migration paths have deterministic checks in `tools/`.
