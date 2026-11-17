const DEFAULT_API = 'https://sweety-qj4d.onrender.com/api';
const DEFAULT_TZ = 'Asia/Kolkata';

export const CONFIG_ERRORS: string[] = [];

function resolveTimezone(raw: string | undefined): string {
  if (raw === undefined || raw.trim() === '') return DEFAULT_TZ;
  const tz = raw.trim();
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return tz;
  } catch {
    CONFIG_ERRORS.push(`VITE_APP_TIMEZONE "${tz}" is not a valid IANA timezone (for example Asia/Kolkata).`);
    return DEFAULT_TZ;
  }
}

function resolveApiBase(raw: string | undefined): string {
  if (raw === undefined || raw.trim() === '') return DEFAULT_API;
  const value = raw.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    CONFIG_ERRORS.push(`VITE_API_BASE_URL "${value}" is not an absolute URL.`);
    return DEFAULT_API;
  }
  const problems: string[] = [];
  if (url.protocol !== 'http:' && url.protocol !== 'https:') problems.push('must use http or https');
  if (url.search || value.includes('?')) problems.push('must not contain a query string');
  if (url.hash || value.includes('#')) problems.push('must not contain a hash fragment');
  if (url.username || url.password) problems.push('must not contain credentials');
  const path = url.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/api')) problems.push('must end with /api (for example https://sweety-qj4d.onrender.com/api)');
  if (problems.length) {
    CONFIG_ERRORS.push(`VITE_API_BASE_URL "${value}" ${problems.join('; ')}.`);
    return DEFAULT_API;
  }
  return `${url.origin}${path}`;
}

export const API_BASE_URL = resolveApiBase(import.meta.env.VITE_API_BASE_URL);
export const APP_TIMEZONE = resolveTimezone(import.meta.env.VITE_APP_TIMEZONE);
export const HAS_CONFIG_ERRORS = CONFIG_ERRORS.length > 0;
export const REQUEST_TIMEOUT_MS = 180_000;
export const SLOW_NOTICE_MS = 8_000;
