// Catalogue des avatars — cache mémoire id → url.
import { api } from './api';

let cache = null;
let pending = null;

/** Returns a Map-like object { [avatarId]: url }. Cached after first call. */
export async function getAvatarMap() {
  if (cache) return cache;
  if (pending) return pending;
  pending = api.getAvatars()
    .then((list) => {
      cache = Object.fromEntries(list.map((a) => [a.id, a.url]));
      return cache;
    })
    .catch(() => ({}))
    .finally(() => { pending = null; });
  return pending;
}
