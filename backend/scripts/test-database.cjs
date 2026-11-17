// Configuration checks only: this module never opens a database connection.
function getTestDatabaseUrl(environment) {
  const value = environment.TEST_DATABASE_URL;
  if (!value?.trim()) {
    throw new Error('Set TEST_DATABASE_URL to your separate test database. Tests never fall back to DATABASE_URL.');
  }
  let test;
  try {
    test = new URL(value);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (!['postgres:', 'postgresql:'].includes(test.protocol) || !test.hostname || test.pathname.length < 2) {
    throw new Error('TEST_DATABASE_URL must specify a PostgreSQL host and database name.');
  }
  if (environment.DATABASE_URL) {
    const app = new URL(environment.DATABASE_URL);
    // Supabase poolers can share host/database; the username identifies the project.
    const sameTarget = app.hostname === test.hostname &&
      (app.port || '5432') === (test.port || '5432') &&
      app.pathname === test.pathname && app.username === test.username;
    if (sameTarget) {
      throw new Error('Refusing to run tests against DATABASE_URL. Use a separate test database.');
    }
  }
  return value;
}

module.exports = { getTestDatabaseUrl };
