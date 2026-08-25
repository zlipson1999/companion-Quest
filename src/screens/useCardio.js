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

// Payment has no forward-looking lease. A later real signal confirms the
// interval BEFORE it, up to these plausible reporting gaps. The tail after
// the final signal is never confirmed and therefore never paid.
export const STEP_CONFIRM_GAP_MS = 3000;
export const GPS_CONFIRM_GAP_MS = 3200;
export const STROKE_CONFIRM_GAP_MS = 5000;

export function confirmationGapMs(gpsOnly) {
  return gpsOnly ? GPS_CONFIRM_GAP_MS : STEP_CONFIRM_GAP_MS;
}

// Rower taps still need a visual pulse, but this number controls animation
// only. It never controls credits. It is longer than the 900ms step hold
// because it spans a different thing: footfalls are half a second apart, a
// rowing stroke two or three seconds. At 1.2s the character finished its pull
// and stood idle before the next one, which reads as somebody who keeps
// giving up rather than somebody rowing. Three seconds covers a real cadence
// and still drops the pose about three seconds after the last pull — and it
// stays under STROKE_CONFIRM_GAP_MS, so the figure can never be animating
// through a stretch that has already stopped being creditable.
export const STROKE_MOVING_MS = 3000;

export default function useCardio({ active = true, gpsOnly = false, activity, onDelta, onMilestone, routeId } = {}) {
  const { state, dispatch } = useGame();
  const dist = useDistance();
  const [moving, setMoving] = useState(false);

  const lastMiles = useRef(0);
  const lastSteps = useRef(0);
  const prevMilestones = useRef(state.stats.milestonesReached);
  const moveTimer = useRef(null);
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
  }, []);

  // Payment is not a timer here at all; the gym confirms past intervals from
  // real deltas. Going inactive only has an animation hold to clear.
  useEffect(() => {
    if (active) return;
    if (moveTimer.current) clearTimeout(moveTimer.current);
    setMoving(false);
  }, [active]);

  return { dist, moving };
}
