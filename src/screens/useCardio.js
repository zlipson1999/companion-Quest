// Real distance becomes progress. The one path, shared by the trail outdoors
// and the cardio deck indoors.
//
// Both used to own a copy of this: read the pedometer, dispatch the delta,
// pulse a "moving" flag, and notice when a milestone rolled over. Two copies of
// "real movement counts" is exactly the thing this game cannot afford to have
// drift, so there is one.
//
// What it deliberately does NOT do is roll encounters. That belongs to the
// trail and only to the trail — indoors there is nothing to meet — so the
// caller gets the delta and decides.

import { useEffect, useRef, useState } from 'react';
import { useGame, useDistance } from '../state';
import { PICKUP_POOL, getItem } from '../data/items';
import { playSfx } from '../audio';

// How long the walking pulse stays lit after the last step arrives.
const MOVING_MS = 900;

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
    moveTimer.current = setTimeout(() => setMoving(false), MOVING_MS);

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

  useEffect(() => () => moveTimer.current && clearTimeout(moveTimer.current), []);

  return { dist, moving };
}
