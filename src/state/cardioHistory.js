// A small, bounded log of completed cardio-machine sessions.
//
// Daily history keeps rollups for recovery and weekly comparisons. This list
// keeps the human detail those totals cannot answer: which machine, how far,
// and how long. It is additive in save v12; old saves begin with an empty list
// rather than invented sessions.

export const KEEP_CARDIO_SESSIONS = 120;
export const CARDIO_STATIONS = ['treadmill', 'bike', 'rower'];

export function cardioSession(raw) {
  if (!raw || !CARDIO_STATIONS.includes(raw.station)) return null;
  const miles = Math.max(0, Number(raw.miles) || 0);
  const seconds = Math.max(0, Math.floor(Number(raw.seconds) || 0));
  if (miles < 0.01 || seconds < 5) return null;
  const endedAt = typeof raw.endedAt === 'string' && raw.endedAt ? raw.endedAt : null;
  if (!endedAt || Number.isNaN(Date.parse(endedAt))) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `${endedAt}:${raw.station}`,
    station: raw.station,
    miles: Math.round(miles * 1000) / 1000,
    seconds,
    endedAt,
  };
}

export function appendCardioSession(sessions, raw, keep = KEEP_CARDIO_SESSIONS) {
  const session = cardioSession(raw);
  if (!session) return Array.isArray(sessions) ? sessions : [];
  return [...(Array.isArray(sessions) ? sessions : []), session].slice(-keep);
}

export function normalizeCardioSessions(sessions) {
  return (Array.isArray(sessions) ? sessions : [])
    .map(cardioSession)
    .filter(Boolean)
    .slice(-KEEP_CARDIO_SESSIONS);
}

export function cardioStationLabel(station) {
  if (station === 'bike') return 'Bike Ride';
  if (station === 'rower') return 'Rower';
  return 'Treadmill';
}

export default {
  KEEP_CARDIO_SESSIONS,
  CARDIO_STATIONS,
  cardioSession,
  appendCardioSession,
  normalizeCardioSessions,
  cardioStationLabel,
};
