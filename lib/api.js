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

/** Timeout réseau par requête. */
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Erreur API enrichie : toujours un message français actionnable,
 * plus `status`, `path` et `url` pour le débogage.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, path = '', cause = null } = {}) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;     // 0 = jamais atteint le serveur
    this.path   = path;
    this.url    = `${API_URL}${path}`;
    this.cause  = cause;
  }
}

const STATUS_HINTS = {
  400: 'Requête invalide.',
  401: 'Session expirée — reconnectez-vous.',
  403: 'Accès refusé pour ce compte.',
  404: 'Ressource introuvable côté serveur.',
  429: 'Trop de tentatives — patientez une minute.',
  500: 'Erreur interne du serveur.',
  502: 'Le serveur est en cours de redéploiement — réessayez dans un instant.',
  503: 'Le serveur est indisponible — réessayez dans un instant.',
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    // fetch n'a même pas atteint le serveur : réseau, serveur éteint, CORS…
    const isLocal = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
    const message = cause?.name === 'AbortError'
      ? `Le serveur ne répond pas (délai de ${REQUEST_TIMEOUT_MS / 1000}s dépassé) — ${API_URL}`
      : isLocal
        ? `Impossible de joindre le backend local (${API_URL}). Est-il démarré ? (npm run start:dev dans backend/)`
        : `Impossible de joindre le serveur (${API_URL}). Vérifiez votre connexion — ou le serveur est peut-être en panne.`;
    throw new ApiError(message, { status: 0, path, cause });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // Message du backend s'il existe, sinon un indice selon le statut HTTP.
    let serverMessage = null;
    try {
      const data = await res.json();
      serverMessage = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    } catch {}
    const hint = STATUS_HINTS[res.status] ?? `Erreur ${res.status}.`;
    throw new ApiError(serverMessage || hint, { status: res.status, path });
  }

  try {
    return await res.json();
  } catch (cause) {
    throw new ApiError(
      `Réponse illisible du serveur pour ${method} ${path} (JSON attendu).`,
      { status: res.status, path, cause },
    );
  }
}

export const api = {
  login:    (email, password)           => request('/auth/login',    { method: 'POST', body: { email, password } }),
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: { username, email, password } }),
  profile:  ()                          => request('/users/me'),
  createLobby: (options = {}) => request('/lobby/create', { method: 'POST', body: options }),
  joinLobby:   (code)  => request(`/lobby/join/${encodeURIComponent(code)}`, { method: 'POST' }),
  listPublicLobbies: () => request('/lobby/public/open'),
  joinPublicLobby: (id) => request(`/lobby/public/${encodeURIComponent(id)}/join`, { method: 'POST' }),
  getLobby:    (id)    => request(`/lobby/${id}`),
  // Profil & méta
  getStats:        () => request('/stats/me'),
  getHistory:      () => request('/stats/history'),
  getGameDetail: (id) => request(`/stats/history/${encodeURIComponent(id)}`),
  getLeaderboard:  () => request('/stats/leaderboard'),
  getAchievements: () => request('/achievements/me'),
  getAvatars:      () => request('/avatars/me'),
  buyAvatar:     (id) => request(`/avatars/${id}/buy`, { method: 'POST' }),
  setAvatar:     (id) => request('/users/me/avatar', { method: 'PATCH', body: { avatarId: id } }),
  discordAuthorize:    () => request('/discord/authorize'),
  discordCompleteLink: (code, state) => request('/discord/callback', { method: 'POST', body: { code, state } }),
  discordUnlink:       () => request('/discord/link', { method: 'DELETE' }),
  // Administration — every endpoint is independently protected by the backend.
  adminMe:       () => request('/admin/me'),
  adminUsers:    ({ search = '', page = 1, pageSize = 30 } = {}) => {
    const query = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
    return request(`/admin/users?${query}`);
  },
  adminGetRoles: () => request('/admin/roles'),
  adminSetRoles: (disabled) => request('/admin/roles', { method: 'PATCH', body: { disabled } }),
  adminGetDiscord: () => request('/admin/discord'),
  adminStartDiscord: () => request('/admin/discord/start', { method: 'POST' }),
  adminStopDiscord: () => request('/admin/discord/stop', { method: 'POST' }),
  adminListGames: (limit = 50) => request(`/admin/games?limit=${limit}`),
  adminGetGame:   (id) => request(`/admin/games/${encodeURIComponent(id)}`),
  adminResetPassword: (userId, adminPassword, newPassword) => request(
    `/admin/users/${encodeURIComponent(userId)}/password`,
    { method: 'PATCH', body: { adminPassword, newPassword } },
  ),
};
