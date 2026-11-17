# Backend review before frontend integration

Reviewed repository state: `b487174` (following `94834d2`).
This document records findings, not applied fixes. No live database was inspected,
migrated, reset, or used for integration tests.

## Verified

- Fresh dependency installation with the committed pnpm lockfile succeeded.
- Source/test TypeScript checks and the production TypeScript build passed.
- Render `GET /api/healthz` returned HTTP 200 after approximately 51 seconds.
- This health route confirms the HTTP server is serving requests; it is not an
  independent database query. Protected live flows were not exercised.
- No HTTP route or request/response contract changed in the reviewed commits,
  so the Postman collection matches the current controller/service contract.

## 1. High priority: restore fail-closed test isolation

`backend/vitest.config.ts` no longer enforces the dedicated `_test` name rule.
`backend/tests/setup.ts` still retrieves the connected database name but no longer
checks it before migrations and unconditional cleanup of **all users/readings**.

The remaining URL comparison is not proof of isolation. Aliases or a direct
endpoint and a pooler endpoint can reach the same database using different
hostnames. Conversely, Supabase projects using a shared pooler can have the same
host/path while the username identifies different projects, so genuine separate
projects can also be rejected.

**Do not point `TEST_DATABASE_URL` at the deployed Supabase project.** Do not rely
only on it looking different from `DATABASE_URL`.

Recommended fix: use an explicitly disposable test target and verify its identity
before migrations or deletion. For local PostgreSQL, restore the `_test` naming
and connected-database checks. For hosted databases whose names cannot follow
that convention, use a deliberate test-only marker plus verification of the
effective target/project. Fail closed if safety cannot be established. Keep
destructive cleanup out of all normal application/deployment startup commands.

## 2. Conditional migration risk for existing databases

The old initial migration was removed and replaced by a new timestamped initial
migration. The new migration creates the enums and tables from scratch.

That is plausible for a fresh, empty Supabase schema. It is **not** an upgrade
path for a database where the old migration already ran: TypeORM sees the new
migration as pending and its CREATE statements conflict with existing objects.
The server also refuses startup while migrations are pending.

Preserve applied migration history and add incremental migrations for deployed
databases. Any reconciliation of an existing database needs an explicit,
backed-up plan; do not drop tables, revert the baseline, or edit migration
history blindly.

## 3. Repair local onboarding and migration command documentation

- `.env.example` was removed, but the README still asks users to copy it. Restore
  a credential-free template or document every required variable directly.
- The migration-generation script now prefixes `src/database/migrations/`,
  while the README's invocation already includes that prefix. Following the
  README produces a doubled path.
- The same script concatenates its argument into a shell command. Prefer the
  direct TypeORM CLI with a documented destination argument, or `execFileSync`
  with separate arguments rather than interpolating shell text.
- The README's test-isolation guarantees must match the safeguards actually
  enforced, particularly when documenting Supabase setup.

## Suggested order

1. Resolve test isolation before anyone runs destructive integration tests.
2. Confirm whether each existing database uses the old or new baseline before
   running migrations; the live Supabase database was not queried in this review.
3. Repair onboarding/migration instructions, then continue frontend integration.
