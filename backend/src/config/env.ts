import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const allowedOrigins = required('CORS_ALLOWED_ORIGINS').split(',')
  .map((origin) => origin.trim()).filter(Boolean);
if (!allowedOrigins.length) throw new Error('CORS_ALLOWED_ORIGINS cannot be empty');
for (const origin of allowedOrigins) {
  let valid = false;
  try {
    const url = new URL(origin);
    valid = ['http:', 'https:'].includes(url.protocol) && url.origin === origin;
  } catch { /* Report the variable name, never its value. */ }
  if (!valid) throw new Error('CORS_ALLOWED_ORIGINS must contain exact HTTP(S) origins without paths or trailing slashes');
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');

const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
const duration = /^([1-9]\d*)([smhd])$/.exec(jwtExpiresIn);
if (!duration) throw new Error('JWT_EXPIRES_IN must be a duration such as 30m or 7d');
const secondsPerUnit: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
const jwtTtlSeconds = Number(duration[1]) * secondsPerUnit[duration[2]];
if (!Number.isSafeInteger(jwtTtlSeconds)) throw new Error('JWT_EXPIRES_IN is too large');

const timezone = process.env.APP_TIMEZONE ?? 'Asia/Kolkata';
try {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone });
} catch {
  throw new Error('APP_TIMEZONE must be a valid IANA timezone');
}

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? '0');
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a nonnegative integer');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: port,
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn,
  JWT_TTL_SECONDS: jwtTtlSeconds,
  CORS_ALLOWED_ORIGINS: allowedOrigins,
  APP_TIMEZONE: timezone,
  TRUST_PROXY_HOPS: trustProxyHops,
};
