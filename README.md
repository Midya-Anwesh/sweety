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

- **Authentication & session management:** Signup/login with patient/doctor role selection; JWT tokens persisted in `localStorage` with automatic verification via `/api/auth/me`; auto-redirection preventing re-login for authenticated sessions; logout confirmation modal.
- **Form architecture:** Centralized `CustomInput` component with type-safe field binding via React Hook Form `Controller` and `render` prop (no direct `...register` calls).
- **Reading CRUD:** One reading per slot per day, four distinct slots, integer values 40–600 mg/dl, strict rejection of future dates; updates modify glucose value only (date and slot immutable).
- **Server pagination & navigation:** Backend paginated queries (`?page=1&limit=20`) with selectable page limits (`10`, `20`, `50`, `100`), returning structured metadata and responsive pagination button links with ellipsis windowing.
- **Server-side date range filtering:** Network-level date filtering with `from` and `to` query parameters, both inclusive (`from <= date <= to`), with automatic validation rejecting inverted ranges.
- **Reports:** Daily, month-to-date, and previous-calendar-month statistical reports calculated directly by backend endpoints.

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
