// Quest Fitness reception records presence, not performance. Walking up to the
// desk creates at most one dated check-in per local calendar day. That keeps a
// player from manufacturing a streak by bumping the counter repeatedly while
// preserving the exact time they first arrived that day.

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDay(day) {
  if (!DAY_RE.test(day || '')) return false;
  const [year, month, date] = day.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === date;
}

export function localDayKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ordinal(day) {
  if (!validDay(day)) return null;
  const [year, month, date] = day.split('-').map(Number);
  const value = Date.UTC(year, month - 1, date) / 86400000;
  return Number.isFinite(value) ? value : null;
}

export function normalizeGymCheckIns(value) {
  if (!Array.isArray(value)) return [];
  const byDay = new Map();
  value.forEach((entry) => {
    if (!entry || !validDay(entry.day)) return;
    const checkedAt = new Date(entry.checkedAt);
    if (!Number.isFinite(checkedAt.getTime())) return;
    const normalized = { day: entry.day, checkedAt: checkedAt.toISOString() };
    const existing = byDay.get(entry.day);
    if (!existing || normalized.checkedAt < existing.checkedAt) byDay.set(entry.day, normalized);
  });
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export function appendGymCheckIn(value, { checkedAt, day } = {}) {
  const entries = normalizeGymCheckIns(value);
  const when = new Date(checkedAt || Date.now());
  const checkInDay = day || localDayKey(when);
  if (!Number.isFinite(when.getTime()) || !validDay(checkInDay)) return entries;
  if (entries.some((entry) => entry.day === checkInDay)) return entries;
  return [...entries, { day: checkInDay, checkedAt: when.toISOString() }]
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function gymCheckInStats(value, now = new Date()) {
  const entries = normalizeGymCheckIns(value);
  const ordinals = entries.map((entry) => ordinal(entry.day)).filter(Number.isFinite);
  let longestStreak = 0;
  let run = 0;
  let previous = null;
  ordinals.forEach((day) => {
    run = previous != null && day === previous + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day;
  });

  const todayOrdinal = ordinal(localDayKey(now));
  const lastOrdinal = ordinals.length ? ordinals[ordinals.length - 1] : null;
  let currentStreak = 0;
  if (lastOrdinal != null && todayOrdinal != null && todayOrdinal - lastOrdinal <= 1) {
    currentStreak = 1;
    for (let i = ordinals.length - 1; i > 0; i -= 1) {
      if (ordinals[i] !== ordinals[i - 1] + 1) break;
      currentStreak += 1;
    }
  }

  return {
    totalDays: entries.length,
    currentStreak,
    longestStreak,
    first: entries[0] || null,
    last: entries[entries.length - 1] || null,
  };
}

export default { localDayKey, normalizeGymCheckIns, appendGymCheckIn, gymCheckInStats };
