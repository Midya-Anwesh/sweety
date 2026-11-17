# Sweety backend

Express + TypeScript + decorator-based controllers, TypeORM, and PostgreSQL.
This directory is self-contained: no Replit-specific runtime is required.

## Requirements

- Node.js 22 or later
- pnpm 10 (`npm install -g pnpm@10` if you do not already have it)
- PostgreSQL 14 or later

Use pnpm consistently. `pnpm-lock.yaml` is the only dependency lockfile; do not
commit an npm `package-lock.json`. For a reproducible install, run
`pnpm install --frozen-lockfile`.

## Local setup

From this directory:

```sh
pnpm install
cp .env.example .env
```

Create two empty PostgreSQL databases using pgAdmin, psql, or your usual tool:

```sql
CREATE DATABASE sweety;
CREATE DATABASE sweety_test;
```

Fill in `.env` with your own connection details and a random JWT secret. All
variables are described in `.env.example`. Generate a JWT secret locally:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit the populated `.env`. Run commands from `backend/` so dotenv can find it.

```sh
pnpm migration:run
pnpm dev
```

Default API: `http://localhost:3000/api`.

There is deliberately **no seed script**. Register users and add readings through
the API. The original assignment requests a demo seed script; this is a known
submission gap retained at the project owner's request.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Restart the TypeScript server when source files change |
| `pnpm typecheck` | Check application and test types |
| `pnpm build` | Compile to `dist/` using TypeScript, preserving decorator metadata |
| `pnpm start` | Run the compiled backend |
| `pnpm migration:run` | Explicitly apply pending migrations |
| `pnpm migration:show` | List migration status |
| `pnpm migration:generate src/database/migrations/DescribeChange` | Generate a migration from entity changes |
| `pnpm migration:revert` | Undo the last migration; may delete data, so review it first |
| `pnpm test` | Compile the app and run the PostgreSQL integration tests |
| `pnpm test:watch` | Compile once and watch tests; rerun after changing application source |

Schema synchronization and automatic startup migrations are disabled. The server
refuses to start with pending migrations. After compiling, migrations can also
be run with `pnpm exec typeorm migration:run -d dist/database/data-source.js`.
Do not generate migrations into `dist/`; it is generated output.

## API

For an importable, documented Postman collection with the deployed Render
environment, token/reading ID capture and example responses, see
**[postman/README.md](postman/README.md)**. Set a 180-second request timeout for
the first Render call. Running the full collection creates a demo account and
creates, edits and deletes its test reading; importing alone sends nothing.
The Postman environment has only `BASE_URL` and `APP_TIMEZONE`. Payload fields
are direct editable JSON values, and date queries are literal examples.
Only captured tokens/IDs and a server-switch guard use collection variables.
Edit Register and Login with matching synthetic credentials before a full run.
See the
**[complete API reference](api-reference.md)** for each request payload, success
response shape, and error behavior.

All endpoints accept/return JSON. Protected endpoints require:

```text
Authorization: Bearer <token returned by login>
```

| Method | Path | Request / purpose |
| --- | --- | --- |
| GET | `/api/healthz` | Server health |
| POST | `/api/auth/register` | `{ name, email, password, role }`, returns user (201) |
| POST | `/api/auth/login` | `{ email, password }`, returns token and user |
| GET | `/api/auth/me` | Current user |
| POST | `/api/readings` | `{ date, slot, value }` (201) |
| GET | `/api/readings` | Own readings, newest creation time first (ID breaks ties) |
| GET | `/api/readings?date=YYYY-MM-DD` | Own readings for a date |
| GET | `/api/readings/:id` | Own reading |
| PATCH | `/api/readings/:id` | `{ value }`; date and slot cannot be changed |
| DELETE | `/api/readings/:id` | Delete own reading (204, no response body) |
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Daily statistics plus slot readings |
| GET | `/api/reports/month-to-date?date=YYYY-MM-DD` | First of month through selected date |
| GET | `/api/reports/monthly?date=YYYY-MM-DD` | Entire previous calendar month |

Registration requires `role` to be `doctor` or `patient`. Both signup and login
accept passwords of 8–128 Unicode code points, without trimming, normalizing,
or truncating them. Passwords are hashed with Argon2id using a random salt,
64 MiB memory, 3 iterations, and parallelism 1. There is no 72-byte input limit.
Emails are trimmed, lowercased, and unique. Roles do not grant cross-user access
in this version. See [assessment-notes.md](assessment-notes.md) for the deliberate
choice of Argon2id instead of the assessment's requested bcrypt.

**Existing accounts:** bcrypt is no longer installed or supported. Old hashes
cannot be converted to Argon2id without the original passwords. These accounts
receive the normal 401 login response and require password recovery or manual
account recreation. No recovery endpoint or automatic deletion is implemented.
To retain old account data, implement a deliberate password-reset process before
using this version with existing users. New accounts use Argon2id immediately;
no database schema migration is necessary because the existing hash column fits it.

Reading slots:

```text
morning_fasting
after_breakfast
after_lunch
after_dinner
```

Values must be JSON numbers, whole integers from 40 through 600 mg/dl. Dates must
be real calendar dates in `YYYY-MM-DD`, no later than today in `APP_TIMEZONE`.
One row represents one reading. A unique `(userId, date, slot)` constraint and
the four-value database enum enforce the four-per-day limit even under concurrent
requests. Creation supports today and past dates, but never future dates.
Updates require a valid `value`; `date` and `slot` are immutable and are rejected
even when supplied alongside a valid value. To correct either, delete and recreate
the reading. Unknown fields are rejected.

JSON request bodies have an explicit 16KB limit. Malformed JSON receives 400 and
oversized bodies receive 413.

For selected date `2026-10-15`, monthly means `2026-09-01` through `2026-09-30`;
month-to-date means `2026-10-01` through `2026-10-15`.

Example report:

```json
{
  "type": "daily",
  "selectedDate": "2026-01-15",
  "from": "2026-01-15",
  "to": "2026-01-15",
  "count": 2,
  "highest": 120,
  "lowest": 100,
  "average": 110,
  "message": null,
  "readings": []
}
```

The example omits actual reading rows. Daily responses include them. Averages are
rounded to one decimal numerically; JSON represents `110.0` as `110`. The UI may
format with `.toFixed(1)`. Empty reports return zero count, null statistics, a
friendly message, and an empty readings array for daily reports.

Errors use `{ "message": "..." }`, with an additional `errors` array for field
validation. Statuses: 400 invalid input, 401 unauthenticated, 404 missing/not-owned
reading, 409 duplicate email/slot, 429 authentication rate limit. Internal errors
never expose database details or stack traces.

### Try it with curl

```sh
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Patient","email":"patient@example.com","password":"Choose-your-own-password","role":"patient"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@example.com","password":"Choose-your-own-password"}'

# Replace YOUR_TOKEN with the login response token.
curl -X POST http://localhost:3000/api/readings \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"date":"2026-01-15","slot":"morning_fasting","value":100}'

curl 'http://localhost:3000/api/reports/daily?date=2026-01-15' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Simple tests

Tests are requests to the real Express app using Supertest, with assertions made
by Vitest. No separately running HTTP server and no mocked database are needed.
They compile application code first because controller decorators need TypeScript
metadata. Each test reads as: prepare data → request endpoint → check response.

From `backend/`, run `npm test` (or `pnpm test`). Configure the server-side `.env`:

```dotenv
TEST_DATABASE_URL=postgresql://TEST_USER:TEST_PASSWORD@TEST_HOST:5432/TEST_DATABASE
```

This is a **backend setting**, not a Postman environment variable. Use the
connection URL for your separately created test database. Supabase projects
commonly use the database name `postgres`; no `_test` suffix is required.
`npm test` always replaces the application's `DATABASE_URL` inside the test
worker with `TEST_DATABASE_URL`; it never falls back to the normal app URL.
There is no need to change Render's live `DATABASE_URL`.

`TEST_DATABASE_URL` must point to a **dedicated test database**, different from
the application database. All users/readings in
that test database are deleted between tests and after the suite; never use a
database containing data you need. Tests run sequentially, apply migrations,
create their own fixtures, and close connections afterward. Missing test
configuration fails explicitly rather than silently skipping tests.
Before migration or cleanup, setup checks that the DataSource uses the supplied
test URL and the connected database name matches it. Cleanup runs only after
successful setup. A known-identical application URL is rejected, comparing
host, port, database and username (the username distinguishes Supabase projects
on a shared pooler). URL comparisons cannot detect every alternate endpoint or
database alias: you are responsible for supplying the **separate test project's**
URL, never another connection string for the live project.

`npm run test:config` runs six small offline configuration checks without
connecting to PostgreSQL. They also run at the start of `npm test`.

Tests cover Argon2id storage, long and multibyte passwords without truncation,
matching signup/login length limits, unsupported old hash rejection, both roles,
JWT expiry/rejection, CORS, JSON size/format validation, value-only edits, CRUD,
concurrent duplicate slots, ownership restrictions, report calculations, empty
periods, and leap-year/year-boundary date ranges. The CRUD list test uses the
created reading's date instead of a hardcoded date.

## Structure

- `src/config/`: environment loading and basic startup checks, without schema libraries.
- `src/database/`: TypeORM DataSource and explicit migration files.
- `src/modules/`: feature-specific DTOs, controllers, services, and entities.
- `src/common/`: authentication checks, date helpers, error handling, logging.
- `tests/`: straightforward API integration tests and small shared helpers.

Controllers handle HTTP, services contain business logic and directly use TypeORM
repositories. Entity/migration globs recursively discover files and load only
TypeScript in development or JavaScript after compilation.

## Notes and deliberate limitations

- Backend only; React is deferred to `../frontend/`.
- Users choose doctor/patient at signup. No verification, patient assignments, or
  doctor access to other users' reports is implemented. Doctor self-registration
  is not proof of medical credentials.
- JWT lifetime defaults to 7 days. There is no token table, refresh flow, or
  per-token revocation. Client logout discards its token, but a stolen token works
  until expiry. Shorter-lived tokens would reduce that exposure.
- Browser token storage is a frontend decision. Do not embed secrets or API keys
  in browser code. An `x-api-key` is not an XSS defense.
- CORS restricts which browser origins can read responses, not who may call the
  API. Authentication and ownership checks protect the data. Cookies/credentialed
  CORS are not used.
- `APP_TIMEZONE` is application-wide, defaulting to Asia/Kolkata. Per-user
  timezones would be a later enhancement.
- Authentication is limited to 30 requests per IP per 15 minutes. It uses an
  in-memory store suitable for a single-process assignment, not multiple replicas.
  `TRUST_PROXY_HOPS` defaults to 0. Configure only the actual trusted proxy count;
  blindly trusting forwarded IP headers lets clients bypass rate limits.
- HTTPS, production secret management, account verification/recovery, pagination,
  doctor assignments, observability, and distributed rate limiting would be
  follow-on production work. Never store real patient information in demo data.
- No seed script by explicit choice; the assignment's seed requirement remains unmet.
