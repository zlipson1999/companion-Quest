// The Coach, answering from your own data with no server and no model.
//
// The LLM proxy (src/coach/api.js) needs a deployed backend and an API key that
// costs money per message. That is fine for one person running it locally and
// wrong for an app you hand to other people: every visitor who tapped Coach got
// "set EXPO_PUBLIC_COACH_API_URL", which is a developer's error message wearing
// a character's face.
//
// This answers the questions people actually ask a fitness app, out of the
// numbers they generated themselves. It is not a language model and does not
// pretend to be one. What it gives up in conversation it gains in never being
// wrong: every figure below is read from the save, so it cannot invent a
// personal best you did not set or a streak you do not have.
//
// The rule throughout: when there is no data, SAY there is no data. A confident
// answer built on nothing is worse than admitting the app has not seen you
// train yet.

import { MODULES, moduleProgress, moduleStateFor } from '../modules';
import { todayKey } from '../modules/daily';
import { computeRecovery } from '../state/recovery';
import { isActive, lastDays, previousWeekOf, totals, weekOf } from '../state/history';
import { getMovement } from '../data/movements';
import { MUSCLES } from '../data/muscles';
import { analysePlan } from '../modules/forge/analysis';
import { formatRecord, unitLabel, weightOf } from '../modules/forge/weight';
import { neglectedMuscles } from './context';

const RECENT_DAYS = 14;
const WEIGHT_INCREMENT = 5;

function plural(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

// ---------------------------------------------------------------- gathering
// Everything the answers below are allowed to draw on, read once.
function gather(state, companion) {
  const today = todayKey();
  const forge = moduleStateFor(state.modules, 'forge', today);
  return {
    today,
    companion,
    units: unitLabel(state.settings),
    recovery: computeRecovery(state.history, today),
    week: totals(weekOf(state.history, today)),
    lastWeek: totals(previousWeekOf(state.history, today)),
    recent: totals(lastDays(state.history, today, RECENT_DAYS)),
    activeThisWeek: weekOf(state.history, today).filter(isActive).length,
    modules: MODULES.map((m) => {
      const st = moduleStateFor(state.modules, m.id, today);
      return { module: m, state: st, progress: moduleProgress(m, st) };
    }),
    forge,
    log: forge.log || [],
    records: forge.records || {},
    plans: forge.plans || [],
  };
}

function moduleByName(f, id) {
  return f.modules.find((x) => x.module.id === id) || null;
}

function list(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ----------------------------------------------------------------- answers
// Each entry is a question people actually ask, a matcher, and an answer built
// only from `f`. Order matters: the first match wins, so put the specific
// patterns above the general ones.
const INTENTS = [
  {
    id: 'rest',
    test: /\b(rest|recover|recovery|overtrain|over-?training|day off|sore|tired|burn(ed|t)? out|deload)\b/i,
    answer: (f) => {
      const r = f.recovery;
      if (!r.observed) {
        return "I have not seen you train yet, so I have nothing to base a rest call on. Log a few days and I can tell you when you are pushing too hard.";
      }
      const parts = [r.headline + '.', r.advice];
      if (r.streak >= 2) parts.push(`That is ${r.streak} active days in a row.`);
      if (r.ratioReliable) {
        parts.push(`Your last 7 days of load come to ${r.acute} against a usual ${r.chronic}.`);
      } else {
        parts.push('I do not have enough history yet to compare this week against your normal, so treat that as a rough read.');
      }
      if (!r.restedInLast7) parts.push('You have not logged a rest day in the last week — resting pays bond and healing, and it is a training decision, not a gap in one.');
      return parts.join(' ');
    },
  },
  {
    id: 'pr',
    test: /\b(pr|prs|personal (best|record)|max(es)?|best lift|strongest|one rep)\b/i,
    answer: (f) => {
      const ids = Object.keys(f.records);
      if (!ids.length) return 'No personal records yet — they get set the first time you log a session in the Forge. Every movement you log starts one.';
      const top = ids
        .map((id) => ({ id, mv: getMovement(id), rec: f.records[id] }))
        .filter((x) => x.mv)
        .sort((a, b) => weightOf(b.rec) - weightOf(a.rec))
        .slice(0, 5);
      const lines = top.map((x) => `${x.mv.name}: ${formatRecord(x.rec, x.mv, f.units)} (${x.rec.date})`);
      const weighted = top.filter((x) => weightOf(x.rec) > 0).length;
      const tail = weighted
        ? ' To beat one, add load before you add reps — the record scores on estimated one-rep max, so a heavier set at fewer reps still counts as progress.'
        : ' These are all bodyweight records, scored on reps. Adding weight to any of them counts as progress straight away.';
      return `Your best sets so far:\n${lines.join('\n')}.${tail}`;
    },
  },
  {
    id: 'whatToTrain',
    test: /\b(what should i (do|train|work)|what.s next|which (workout|plan)|train today|workout today|hit today)\b/i,
    answer: (f) => {
      if (f.recovery.needsRest) {
        return `Honestly? Not much. ${f.recovery.advice} If you want to move anyway, walk it — distance still counts and it will not add to the load that is already high.`;
      }
      const stale = neglectedMuscles(f.log, f.today);
      const bits = [];
      if (stale.length) {
        // Name a few but state the real total: listing four and then saying a
        // plan "covers 9 of them" made the number look invented.
        const names = stale.slice(0, 4).map((id) => MUSCLES[id].name);
        const more = stale.length - names.length;
        bits.push(
          `Nothing has hit ${list(names)}${more > 0 ? ` and ${more} other${more === 1 ? '' : 's'}` : ''} in two weeks` +
            `${stale.length > names.length ? ` (${stale.length} groups in all)` : ''} — that is where the gap is.`
        );
      }
      if (f.plans.length) {
        // Recommend the saved plan that best covers what has been neglected.
        const scored = f.plans
          .map((p) => {
            const a = analysePlan(p);
            const covers = stale.filter((id) => (a.muscle[id] || 0) > 0).length;
            return { p, a, covers };
          })
          .filter((x) => x.a.sets)
          .sort((a, b) => b.covers - a.covers || b.a.sets - a.a.sets);
        if (scored.length) {
          const best = scored[0];
          bits.push(
            best.covers
              ? `"${best.p.name}" covers ${best.covers} of them — ${best.a.sets} sets, about ${best.a.minutes} minutes.`
              : `Of your saved plans, "${best.p.name}" is the fullest — ${best.a.sets} sets, about ${best.a.minutes} minutes.`
          );
        }
      } else {
        bits.push('You have no saved plans yet. The Forge builds one from 140 movements — sets, reps and weight per block.');
      }
      if (!bits.length) bits.push('Nothing is obviously neglected. Pick whatever you will actually do today.');
      return bits.join(' ');
    },
  },
  {
    id: 'progress',
    test: /\b(how am i|progress|doing well|improving|this week|last week|better|getting stronger)\b/i,
    answer: (f) => {
      if (!f.week.activeDays && !f.week.restDays) {
        return 'Nothing logged this week yet. That is not a verdict — the week turns around on one small thing today.';
      }
      const d = f.week.activeDays - f.lastWeek.activeDays;
      const dir = d > 0 ? `up ${d} on last week` : d < 0 ? `down ${Math.abs(d)} from last week` : 'the same as last week';
      const bits = [
        `${f.week.activeDays} active ${f.week.activeDays === 1 ? 'day' : 'days'} this week, ${dir}.`,
        `${plural(f.week.sessions + f.week.workouts, 'workout')}, ${Math.round(f.week.distanceMi * 10) / 10} miles, ${plural(f.week.habitLogs, 'habit log')}.`,
      ];
      if (f.week.restDays) bits.push(`${f.week.restDays} rest ${f.week.restDays === 1 ? 'day' : 'days'} logged, which is the part most people skip.`);
      else if (f.week.activeDays >= 6) bits.push('Six days on and none off is a lot to repeat.');
      return bits.join(' ');
    },
  },
  {
    id: 'water',
    test: /\b(water|hydrat|drink|thirsty|fluid)\b/i,
    answer: (f) => {
      const h = moduleByName(f, 'hydration');
      if (!h) return 'Hydration is not installed in this build.';
      const { progress: p, state: st, module: m } = h;
      const head = p.done
        ? `Goal met — ${p.value} of ${p.goal} ${m.unit} today.`
        : `${p.value} of ${p.goal} ${m.unit} today, so ${p.goal - p.value} to go.`;
      return `${head}${st.streak ? ` ${st.streak}-day streak.` : ''} Log it on the Habits screen; it feeds the same XP as everything else.`;
    },
  },
  {
    id: 'sleep',
    test: /\b(sleep|slept|bed|insomnia|rested|nap)\b/i,
    answer: (f) => {
      const s = moduleByName(f, 'sleep');
      if (!s) return 'Sleep is not installed in this build.';
      const { progress: p, state: st, module: m } = s;
      if (!p.value) return `No sleep logged for today yet. Logging it sets the night rather than adding to it, so correcting the number later is safe.${st.streak ? ` Your streak is ${st.streak} days.` : ''}`;
      return `${p.value} ${m.unit} logged against a ${p.goal} goal.${st.streak ? ` ${st.streak}-day streak.` : ''} Sleep is the input that moves recovery most and the one this app can least verify — be honest with it and it will be useful.`;
    },
  },
  {
    id: 'food',
    test: /\b(eat|food|diet|nutrition|protein|meal|calorie|carbs?)\b/i,
    answer: (f) => {
      const d = moduleByName(f, 'diet');
      const head = d
        ? `${d.progress.value} of ${d.progress.goal} ${d.module.unit} logged today.${d.state.streak ? ` ${d.state.streak}-day streak.` : ''}`
        : '';
      return `${head} I track whether you logged a meal, not what was in it — this app has no calorie or macro database, so I would be guessing. For anything specific about intake, a dietitian beats me.`.trim();
    },
  },
  {
    id: 'streak',
    test: /\b(streak|habit|daily|consistent|chain)\b/i,
    answer: (f) => {
      const live = f.modules.filter((x) => x.state.streak > 0);
      if (!live.length) return 'No live streaks right now. A streak survives a day roll if you hit the goal today or yesterday, so one log restarts any of them.';
      const bits = live
        .sort((a, b) => b.state.streak - a.state.streak)
        .map((x) => `${x.module.name} ${x.state.streak} days${x.state.bestStreak > x.state.streak ? ` (best ${x.state.bestStreak})` : ''}`);
      const unmet = f.modules.filter((x) => !x.progress.done).map((x) => x.module.name);
      return `Running: ${list(bits)}.${unmet.length ? ` Not yet met today: ${list(unmet)}.` : ' Everything is met today.'}`;
    },
  },
  {
    id: 'plans',
    test: /\b(my plans?|saved plan|routine|program|what.s in|forge)\b/i,
    answer: (f) => {
      if (!f.plans.length) return 'No saved plans yet. Walk into any of the iron here — a rack, the dumbbells, a bench — and New Plan builds one: search 140 movements, then set sets, reps and weight per block.';
      const bits = f.plans.map((p) => {
        const a = analysePlan(p);
        return a.sets ? `"${p.name}" — ${a.focus}, ${a.sets} sets, about ${a.minutes} min` : `"${p.name}" — empty`;
      });
      return `${bits.join('\n')}\nOpen one to see what it trains on the body map, or Start Session to log it.`;
    },
  },
  {
    id: 'howMuchWeight',
    test: /\b(how much (weight|should i lift)|what weight|add weight|heavier|overload|progress(ive)? overload)\b/i,
    answer: (f) => {
      const ids = Object.keys(f.records).filter((id) => weightOf(f.records[id]) > 0);
      if (!ids.length) {
        return 'You have no weighted records yet, so I have nothing to base a number on. Log a session with weight in it and I can tell you what you have already done.';
      }
      const lines = ids.slice(0, 3).map((id) => {
        const mv = getMovement(id);
        const rec = f.records[id];
        // Must be strictly heavier than the record — rounding a 2.5% bump to
        // the nearest 5 lands back on the same number for light lifts, which
        // told you to beat 40 lb by lifting 40 lb.
        const w = weightOf(rec);
        const next = Math.max(w + WEIGHT_INCREMENT, Math.ceil((w * 1.025) / WEIGHT_INCREMENT) * WEIGHT_INCREMENT);
        return `${mv.name}: best is ${formatRecord(rec, mv, f.units)}; ${next} ${f.units} at the same reps would beat it`;
      });
      return `Going off what you have actually lifted:\n${lines.join('\n')}.\nSmall jumps beat big ones — the record scores on estimated one-rep max, so more reps at the same weight counts too.`;
    },
  },
  {
    id: 'steps',
    test: /\b(step|walk|distance|mile|run|running|cardio|pedometer)\b/i,
    answer: (f) => {
      const mi = Math.round(f.recent.distanceMi * 10) / 10;
      if (!mi) return 'No distance logged in the last two weeks. The Route only moves on real steps or a GPS run — there is no walk button, which is the whole point.';
      return `${mi} miles over the last ${RECENT_DAYS} days, ${Math.round(f.week.distanceMi * 10) / 10} of them this week. Distance advances the Route and rolls encounters; it is the part of the game that only real movement can unlock.`;
    },
  },
];

// A last resort that still says something true, rather than "I don't understand".
function fallback(f) {
  const bits = [];
  if (f.recovery.needsRest) bits.push(f.recovery.advice);
  else if (f.activeThisWeek) bits.push(`${f.activeThisWeek} active ${f.activeThisWeek === 1 ? 'day' : 'days'} this week so far.`);
  else bits.push('Nothing logged this week yet.');
  bits.push('I can talk about rest and recovery, what to train next, your records, your streaks, your saved plans, or how the week is going. Ask me any of those and I will answer from what you have actually logged.');
  return bits.join(' ');
}

// ------------------------------------------------------------------- entry
// Returns a grounded answer, or null when there is no save to read.
export function answerLocally(question, state, companion) {
  if (!state || !state.started) return null;
  const f = gather(state, companion);
  const q = String(question || '');
  const hit = INTENTS.find((i) => i.test.test(q));
  return hit ? hit.answer(f) : fallback(f);
}

// Whether a question is one the local coach handles precisely. Used to answer
// from data even when a server is available: an LLM asked for your bench PR
// will guess, and the save knows.
export function hasLocalAnswer(question) {
  return INTENTS.some((i) => i.test.test(String(question || '')));
}

export default answerLocally;
