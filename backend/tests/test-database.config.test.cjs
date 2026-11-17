// Beginner-friendly, offline checks. No database or secrets are used.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getTestDatabaseUrl } = require('../scripts/test-database.cjs');
const app = 'postgresql://app:example@localhost:5432/sweety';
const separate = 'postgresql://app:example@localhost:5432/sweety_test';

test('missing TEST_DATABASE_URL never falls back to the app database', () => {
  assert.throws(() => getTestDatabaseUrl({ DATABASE_URL: app }), /never fall back/);
});
test('rejects invalid or non-PostgreSQL test URLs', () => {
  for (const url of ['not-a-url', 'https://example.com/test', 'postgresql://localhost/']) {
    assert.throws(() => getTestDatabaseUrl({ TEST_DATABASE_URL: url }));
  }
});
test('rejects the same app database even if its password differs', () => {
  assert.throws(() => getTestDatabaseUrl({
    DATABASE_URL: app, TEST_DATABASE_URL: app.replace('example', 'different'),
  }), /separate test database/);
});
test('accepts a separate database and returns only its URL', () => {
  assert.equal(getTestDatabaseUrl({ DATABASE_URL: app, TEST_DATABASE_URL: separate }), separate);
});
test('accepts a separately provisioned test database without an app URL', () => {
  assert.equal(getTestDatabaseUrl({ TEST_DATABASE_URL: separate }), separate);
});
test('accepts separate Supabase projects sharing a pooler and database name', () => {
  const shared = 'postgresql://postgres.project-one:example@pooler.example.com:6543/postgres';
  const other = shared.replace('project-one', 'project-two');
  assert.equal(getTestDatabaseUrl({ DATABASE_URL: shared, TEST_DATABASE_URL: other }), other);
});
