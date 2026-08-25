// Deterministic checks for Quest Fitness reception attendance.
//
//   node --import ./tools/register-esm.mjs tools/test_gym_checkins.mjs

import {
  appendGymCheckIn,
  gymCheckInStats,
  normalizeGymCheckIns,
} from '../src/state/gymCheckIns.js';

const failures = [];
const equal = (label, got, want) => {
  if (got !== want) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

let entries = [];
entries = appendGymCheckIn(entries, { day: '2026-08-20', checkedAt: '2026-08-20T12:15:00.000Z' });
entries = appendGymCheckIn(entries, { day: '2026-08-21', checkedAt: '2026-08-21T13:30:00.000Z' });
entries = appendGymCheckIn(entries, { day: '2026-08-22', checkedAt: '2026-08-22T14:45:00.000Z' });
equal('three distinct attendance days', entries.length, 3);

const duplicate = appendGymCheckIn(entries, { day: '2026-08-22', checkedAt: '2026-08-22T18:00:00.000Z' });
equal('one check-in per local day', duplicate.length, 3);
equal('repeat visit keeps first arrival time', duplicate[2].checkedAt, '2026-08-22T14:45:00.000Z');

const active = gymCheckInStats(entries, new Date('2026-08-23T12:00:00.000Z'));
equal('streak stays active the day after last visit', active.currentStreak, 3);
equal('longest consecutive streak', active.longestStreak, 3);
equal('total check-in days', active.totalDays, 3);

const expired = gymCheckInStats(entries, new Date('2026-08-25T12:00:00.000Z'));
equal('streak expires after a missed day', expired.currentStreak, 0);

const normalized = normalizeGymCheckIns([
  { day: '2026-08-22', checkedAt: '2026-08-22T18:00:00.000Z' },
  { day: '2026-08-22', checkedAt: '2026-08-22T14:45:00.000Z' },
  { day: 'bad-date', checkedAt: 'not-a-time' },
  { day: '2026-99-99', checkedAt: '2026-08-22T14:45:00.000Z' },
]);
equal('normalizer deduplicates a day', normalized.length, 1);
equal('normalizer keeps earliest check-in', normalized[0].checkedAt, '2026-08-22T14:45:00.000Z');

if (failures.length) {
  console.error(`FAIL ${failures.length} reception check-in check(s):`);
  failures.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('ok     reception attendance, daily dedupe and streak calculations');
