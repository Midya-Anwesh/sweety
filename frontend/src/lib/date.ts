import { APP_TIMEZONE } from '@/constants/env';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayInAppTz(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function isRealDate(value: string): boolean {
  const m = ISO.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function isNotFuture(value: string): boolean {
  return value <= todayInAppTz();
}

function toUtc(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDay(value: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!isRealDate(value)) return value;
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(toUtc(value));
}

export function relativeDayLabel(value: string): string | null {
  const today = todayInAppTz();
  if (value === today) return 'Today';
  const t = toUtc(today);
  t.setUTCDate(t.getUTCDate() - 1);
  if (t.toISOString().slice(0, 10) === value) return 'Yesterday';
  return null;
}
