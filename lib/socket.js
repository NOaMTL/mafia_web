import { io } from 'socket.io-client';
import { API_URL, getToken } from './api';

let socket = null;

/** Singleton socket on the /game namespace, authenticated with the JWT. */
export function getSocket() {
  if (socket && socket.connected) return socket;
  if (socket) { socket.connect(); return socket; }

  socket = io(`${API_URL}/game`, {
    transports: ['websocket'],
    auth: { token: getToken() },
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

/** Existing socket instance without creating one (for status displays). */
export function peekSocket() {
  return socket;
}
