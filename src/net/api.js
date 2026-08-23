// The friends API, from the phone's side.
//
// One place that knows the base URL, carries the session token, and turns a
// non-2xx into a thrown Error with a message a screen can show a person. Every
// call goes through `request`, so there is exactly one place that could ever
// forget the Authorization header.
//
// The base URL is the SAME proxy the Coach already uses — friends live on it
// too — so a player who has configured one has configured both.

const BASE = (process.env.EXPO_PUBLIC_COACH_API_URL || '').replace(/\/+$/, '');

export const configured = () => !!BASE;

// Long enough for a cold server, short enough that a dead one does not hang a
// screen forever behind a spinner.
const TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  if (!BASE) {
    throw new ApiError('No server is set up for this app yet.', 0, 'not_configured');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(
      err.name === 'AbortError' ? 'The server did not answer.' : 'Could not reach the server.',
      0,
      'offline'
    );
  } finally {
    clearTimeout(timer);
  }

  let json = null;
  try { json = await res.json(); } catch (e) { /* some responses carry no body */ }

  if (!res.ok) {
    const code = (json && json.error) || `http_${res.status}`;
    throw new ApiError(messageFor(code, json), res.status, code);
  }
  return json || {};
}

// Server codes turned into something worth reading on a phone.
function messageFor(code, json) {
  switch (code) {
    case 'sign_in_required': return 'You are signed out. Sign in again to see your friends.';
    case 'no_such_code': return 'No trailkeeper has that code.';
    case 'sign_in_failed': return (json && json.message) || 'That sign-in could not be verified.';
    case 'too_much': return 'That was more history than one sync can carry.';
    case 'bad_name': return 'That name will not work — try a shorter one.';
    case 'save_too_large': return 'Your journey is too big to store — tell us, this should never happen.';
    default: return (json && json.message) || 'Something went wrong on the server.';
  }
}

export const api = {
  signIn: (provider, idToken, displayName) =>
    request(`/auth/${provider}`, { method: 'POST', body: { idToken, displayName } }),
  signOut: (token) => request('/auth/logout', { method: 'POST', token }),
  me: (token) => request('/me', { token }),
  rename: (token, displayName) => request('/me', { method: 'PATCH', token, body: { displayName } }),
  deleteAccount: (token) => request('/me', { method: 'DELETE', token }),

  sync: (token, payload) => request('/sync', { method: 'POST', token, body: payload }),

  getSave: (token) => request('/save', { token }),
  putSave: (token, save) => request('/save', { method: 'PUT', token, body: { save } }),

  friends: (token) => request('/friends', { token }),
  lookup: (token, code) => request(`/friends/lookup/${encodeURIComponent(code)}`, { token }),
  addFriend: (token, code) => request('/friends/request', { method: 'POST', token, body: { code } }),
  acceptFriend: (token, id) => request('/friends/accept', { method: 'POST', token, body: { id } }),
  removeFriend: (token, id) => request(`/friends/${encodeURIComponent(id)}`, { method: 'DELETE', token }),

  board: (token, id) => request(`/board/${id}`, { token }),
  records: (token, movementId) =>
    request(`/records${movementId ? `?movementId=${encodeURIComponent(movementId)}` : ''}`, { token }),
};

export default api;
