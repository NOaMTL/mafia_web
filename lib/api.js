// REST client — talks to the NestJS backend.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://mafiabackend-production-4ee5.up.railway.app';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mafia_token');
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('mafia_token');
  if (!token) return null;
  return {
    token,
    userId:   localStorage.getItem('mafia_userId'),
    username: localStorage.getItem('mafia_username'),
  };
}

export function saveSession({ accessToken, userId, username }) {
  localStorage.setItem('mafia_token', accessToken);
  localStorage.setItem('mafia_userId', userId);
  localStorage.setItem('mafia_username', username);
}

export function clearSession() {
  localStorage.removeItem('mafia_token');
  localStorage.removeItem('mafia_userId');
  localStorage.removeItem('mafia_username');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try { message = (await res.json()).message ?? message; } catch {}
    const error = new Error(Array.isArray(message) ? message.join(', ') : message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  login:    (email, password)           => request('/auth/login',    { method: 'POST', body: { email, password } }),
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: { username, email, password } }),
  profile:  ()                          => request('/users/me'),
  createLobby: ()      => request('/lobby/create', { method: 'POST', body: {} }),
  joinLobby:   (code)  => request(`/lobby/join/${encodeURIComponent(code)}`, { method: 'POST' }),
  getLobby:    (id)    => request(`/lobby/${id}`),
  // Profil & méta
  getStats:        () => request('/stats/me'),
  getHistory:      () => request('/stats/history'),
  getLeaderboard:  () => request('/stats/leaderboard'),
  getAchievements: () => request('/achievements/me'),
  getAvatars:      () => request('/avatars/me'),
  buyAvatar:     (id) => request(`/avatars/${id}/buy`, { method: 'POST' }),
  setAvatar:     (id) => request('/users/me/avatar', { method: 'PATCH', body: { avatarId: id } }),
};
