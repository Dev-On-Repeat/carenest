import type { User } from '../types';

export const DEMO_TOKEN = 'carenest-demo-visit';

/** Deliberately document-local: a reload or a new tab starts signed out. */
let current: { access_token: string; user: User } | null = null;

export const visitSession = {
  get token() { return current?.access_token ?? null; },
  get user() { return current?.user ?? null; },
  get isDemo() { return current?.access_token === DEMO_TOKEN; },
  start(auth: { access_token: string; user: User }) { current = auth; },
  updateUser(user: User) { if (current) current = { ...current, user }; },
  end() { current = null; },
};

/** Remove only this app's legacy persistence; never clear another app's data. */
export function clearLegacyBrowserData() {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      keys.forEach(key => { if (key?.startsWith('carenest_')) storage.removeItem(key); });
    } catch { /* Browser storage may be disabled. This visit does not depend on it. */ }
  }
  try { window.indexedDB?.deleteDatabase('carenest_local_db'); } catch { /* Legacy cache is not read. */ }
}
