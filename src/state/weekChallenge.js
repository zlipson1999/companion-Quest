// One shared trail among friends each Monday. Display only — no extra XP,
// bond or Trail Credit. The existing week boards already hold the numbers.

import { todayKey } from '../modules/daily';

export const WEEK_CHALLENGES = [
  { id: 'distance', tab: 'Miles', line: 'This week: walk more real miles than your circle.' },
  { id: 'active', tab: 'Days', line: 'This week: more active days than your circle.' },
  { id: 'workouts', tab: 'Sessions', line: 'This week: more logged sessions than your circle.' },
];

function ymd(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function mondayKey(dateKey) {
  const d = new Date(`${dateKey || todayKey()}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return ymd(d);
}

export function weekChallenge(dateKey) {
  const monday = mondayKey(dateKey);
  const [y, m, day] = monday.split('-').map(Number);
  const ordinal = Math.floor(Date.UTC(y, m - 1, day) / 86400000);
  const weeks = Math.floor(ordinal / 7);
  const row = WEEK_CHALLENGES[((weeks % 3) + 3) % 3];
  return { ...row, weekStart: monday };
}

export default weekChallenge;
