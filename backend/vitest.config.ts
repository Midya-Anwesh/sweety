import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';

dotenv.config({ quiet: true });
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('Set TEST_DATABASE_URL to a separate PostgreSQL database ending in _test.');

const testDatabase = new URL(testUrl);
if (!['postgres:', 'postgresql:'].includes(testDatabase.protocol) ||
    !/^\/[a-zA-Z0-9_]+_test$/.test(testDatabase.pathname)) {
  throw new Error('Refusing to run tests: TEST_DATABASE_URL must point to a database ending in _test.');
}
if (process.env.DATABASE_URL) {
  const developmentDatabase = new URL(process.env.DATABASE_URL);
  const sameDatabase = developmentDatabase.hostname === testDatabase.hostname &&
    (developmentDatabase.port || '5432') === (testDatabase.port || '5432') &&
    developmentDatabase.pathname === testDatabase.pathname;
  if (sameDatabase) throw new Error('Refusing to run tests against the development database.');
}

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testUrl,
      JWT_SECRET: randomBytes(32).toString('hex'),
      JWT_EXPIRES_IN: '7d',
      CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
      APP_TIMEZONE: 'Asia/Kolkata',
      TRUST_PROXY_HOPS: '0',
    },
  },
});
