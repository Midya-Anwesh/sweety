import type { User } from '@/types/models';

const KEY = 'sweety.session';
const TOKEN_KEY = 'token';

function probe(): boolean {
  try {
    const k = 'sweety.probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** False when the browser blocks localStorage; the session then lives only in memory for this page load. */
export const STORAGE_AVAILABLE = probe();
export interface StoredSession { token: string; user: User | null }

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    const rawToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('jwt');

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      if (typeof parsed.token === 'string' && parsed.token) {
        return { token: parsed.token, user: parsed.user ?? null };
      }
    }

    if (rawToken && typeof rawToken === 'string') {
      return { token: rawToken, user: null };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('jwt');
      try {
        sessionStorage.removeItem(KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem('jwt');
      } catch {
        /* storage unavailable */
      }
    } else {
      const u = session.user;
      const publicUser = u ? { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, updatedAt: u.updatedAt } : null;
      localStorage.setItem(KEY, JSON.stringify({ token: session.token, user: publicUser }));
      localStorage.setItem(TOKEN_KEY, session.token);
    }
  } catch {
    /* storage unavailable */
  }
}
