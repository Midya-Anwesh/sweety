import type { User } from '@/types/models';

const KEY = 'sweety.session';

function probe(): boolean {
  try {
    const k = 'sweety.probe';
    sessionStorage.setItem(k, '1');
    sessionStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** False when the browser blocks sessionStorage; the session then lives only in memory for this page load. */
export const STORAGE_AVAILABLE = probe();
export interface StoredSession { token: string; user: User | null }

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.token !== 'string' || !parsed.token) return null;
    return { token: parsed.token, user: parsed.user ?? null };
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession | null): void {
  try {
    if (!session) sessionStorage.removeItem(KEY);
    else {
      const u = session.user;
      const publicUser = u ? { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, updatedAt: u.updatedAt } : null;
      sessionStorage.setItem(KEY, JSON.stringify({ token: session.token, user: publicUser }));
    }
  } catch {
    /* storage unavailable */
  }
}
