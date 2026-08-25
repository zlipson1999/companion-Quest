// Real distance becomes progress. The one path, shared by the trail outdoors
// and the cardio deck indoors.
//
// Both used to own a copy of this: read the pedometer, dispatch the delta,
// pulse a "moving" flag, and notice when a milestone rolled over. Two copies of
// "real movement counts" is exactly the thing this game cannot afford to have
// drift, so there is one.
//
// What it deliberately does NOT do is decide rewards or roll encounters. The
// reducer's distance policy reserves trail quota, milestones and Quest Credits
// for a selected route; the trail caller alone decides encounters.

import { useEffect, useRef, useState } from 'react';
import { useGame, useDistance } from '../state';
import { PICKUP_POOL, getItem } from '../data/items';
import { playSfx } from '../audio';

// A step counter speaks at footfall cadence; GPS speaks in coarser samples.
// Holding the bike pose across the expected gap prevents a rider from visibly
// freezing between valid location updates. Both return to idle when their real
// sensor goes quiet.
export const STEP_MOVING_MS = 900;
export const GPS_MOVING_MS = 3200;

export function movementHoldMs(gpsOnly) {
  return gpsOnly ? GPS_MOVING_MS : STEP_MOVING_MS;
}

// The ANIMATION hold above and the PAYMENT lease below are deliberately two
// different numbers, because they answer two different questions.
//
// 900ms is right for animation: a character who keeps running for a second
// after you stop looks wrong, and a brief freeze between footfalls does not.
// It is far too tight to decide whether a second of real work gets PAID.
// `Pedometer.watchStepCount` batches its callbacks — roughly one a second on
// both platforms — and the accelerometer fallback fires once per detected
// step, which for a slow walk on a stair climber is also about a second. A
// 900ms lease against a ~1000ms delivery cadence expires in the gap and banks
// genuine exercise as unpaid, and the machine most at risk is the elliptical,
// whose stride keeps a foot on the pedal and gives a pedometer very little to
// hear.
//
// So payment gets a lease long enough to bridge the sensor's own silence:
// three seconds for step machines, and the same 3.2s the bike already uses
// for GPS. This cannot become an exploit — the lease only ever refreshes on a
// real measured delta, so standing still still stops paying, three seconds
// later. Erring by three seconds at the end of a set is honest; erring by
// dropping one second in ten of a real workout is not.
export const STEP_PAY_LEASE_MS = 3000;
export const GPS_PAY_LEASE_MS = GPS_MOVING_MS;

export function payLeaseMs(gpsOnly) {
  return gpsOnly ? GPS_PAY_LEASE_MS : STEP_PAY_LEASE_MS;
}

// The rower has no sensor to lease against, so its movement signal is the
// stroke the player logs, and the lease has to span a rowing cadence rather
// than a sensor's reporting gap — a steady pull is one every two or three
// seconds. It serves as both the animation hold and the payment lease, since
// there is only the one signal. Like the others it refreshes only on a real
// stroke, and unlike them the gym screen must clear it by hand whenever the
// session stops being a rowing session.
export const STROKE_LEASE_MS = 5000;

export default function useCardio({ active = true, gpsOnly = false, activity, onDelta, onMilestone, routeId } = {}) {
  const { state, dispatch } = useGame();
  const dist = useDistance();
  const [moving, setMoving] = useState(false);
  // Separate from `moving`: this one decides whether a second is PAID.
  const [paying, setPaying] = useState(false);

  const lastMiles = useRef(0);
  const lastSteps = useRef(0);
  const prevMilestones = useRef(state.stats.milestonesReached);
  const moveTimer = useRef(null);
  const payTimer = useRef(null);
  const cbs = useRef({ onDelta, onMilestone, routeId, activity });
  cbs.current = { onDelta, onMilestone, routeId, activity };

  useEffect(() => {
    // Starting a machine must start at zero. The distance sensor remains live
    // while somebody walks around the room, so park the baseline whenever the
    // console is inactive. A bike is GPS-only for the same reason: walking to
    // the gym cannot become the first hundred metres of a ride.
    if (!active || (gpsOnly && !dist.running)) {
      lastMiles.current = dist.miles;
      lastSteps.current = dist.steps;
      return;
    }
    const dM = dist.miles - lastMiles.current;
    const dS = dist.steps - lastSteps.current;
    if (dM <= 0 && dS <= 0) return;
    lastMiles.current = dist.miles;
    lastSteps.current = dist.steps;
    dispatch({
      type: 'ADD_DISTANCE',
      payload: {
        miles: dM,
        steps: gpsOnly ? 0 : dS,
        routeId: cbs.current.routeId,
        activity: cbs.current.activity,
      },
    });

    setMoving(true);
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => setMoving(false), movementHoldMs(gpsOnly));

    setPaying(true);
    if (payTimer.current) clearTimeout(payTimer.current);
    payTimer.current = setTimeout(() => setPaying(false), payLeaseMs(gpsOnly));

    if (cbs.current.onDelta) cbs.current.onDelta(dM, dS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dist.miles, dist.steps, dist.running, active, gpsOnly]);

  // Milestones are counted by the reducer, so watching the stat is the honest
  // way to notice one: it cannot report a milestone that was not actually paid.
  useEffect(() => {
    const cur = state.stats.milestonesReached;
    if (cur <= prevMilestones.current) return;
    prevMilestones.current = cur;
    if (!active) return;
    playSfx('milestone');
    const itemId = PICKUP_POOL[Math.floor(Math.random() * PICKUP_POOL.length)];
    dispatch({ type: 'COLLECT_ITEM', payload: { itemId } });
    playSfx('item');
    if (cbs.current.onMilestone) cbs.current.onMilestone(getItem(itemId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stats.milestonesReached]);

  useEffect(() => () => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    if (payTimer.current) clearTimeout(payTimer.current);
  }, []);

  // A machine that goes inactive must stop paying as well as stop animating,
  // so both leases are dropped the moment the console leaves its running
  // state — otherwise a lease started just before a pause would keep paying
  // into it.
  useEffect(() => {
    if (active) return;
    if (moveTimer.current) clearTimeout(moveTimer.current);
    if (payTimer.current) clearTimeout(payTimer.current);
    setMoving(false);
    setPaying(false);
  }, [active]);

  return { dist, moving, paying };
}
