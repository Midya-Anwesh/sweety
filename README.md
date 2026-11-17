# Sweety

A blood glucose tracker built for a full-stack developer assessment.

```text
sweety/
├── backend/     # Express + TypeScript + TypeORM + PostgreSQL API
└── frontend/    # React + TypeScript + Vite
```

## Start here

- **[Backend setup, migrations and tests](backend/README.md)**
- **[Frontend setup and Vercel publishing](frontend/README.md)**
- **[API payloads, responses and error behavior](backend/api-reference.md)**
- **[Postman collection and Render environment](backend/postman/README.md)**
- **[Assessment assumptions and differences](backend/assessment-notes.md)**

Use Node.js 22+, pnpm 10 and PostgreSQL 14+. Each folder installs independently,
with its own lockfile; there is no root workspace setup required after cloning.

The backend is hosted at `https://sweety-qj4d.onrender.com`. The repository owner
publishes the frontend on Vercel with Root Directory `frontend`, then adds that
exact frontend origin to the backend's comma-separated CORS allowlist.

## Features

Signup/login with patient/doctor selection; own-data-only access; reading CRUD;
one reading per slot/day, four slots, integer values 40–600 mg/dl; no future
dates; grouped daily history with date/range filters; daily, month-to-date and
previous-calendar-month reports. Reading history is ordered by creation time,
not measurement date. Reading edits change only value.

## Current verification boundary

The frontend handoff has TypeScript and production-build checks, plus a static
unauthenticated login preview. Per the owner's request, functional browser and
live end-to-end testing is deferred until
they publish on Vercel and provide the frontend URL. No production test records
were created for this handoff. Screenshots/recording for submission remain to
be captured after the deployed app is checked.

The backend uses Argon2id rather than the brief's requested bcrypt, by explicit
choice. A demo seed script is deliberately omitted at the owner's request.
Doctor self-registration does not grant access to another user's records;
assigned-patient doctor access is an optional feature not implemented here.
See the assessment notes and component READMEs for limitations and future work.
