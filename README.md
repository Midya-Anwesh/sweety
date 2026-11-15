# Sweety

A blood glucose tracker built for a full-stack developer assessment.

```text
sweety/
├── backend/     # Express + TypeScript + TypeORM + PostgreSQL API
└── frontend/    # Reserved for the React frontend
```

The backend is implemented; the frontend is not built yet.

Start with **[backend/README.md](backend/README.md)** for database setup,
environment variables, migrations, running the server, API examples, tests,
and documented assumptions.

Use Node.js 22+, pnpm 10, and PostgreSQL 14+.

```sh
cd backend
pnpm install
cp .env.example .env
# Configure .env and create sweety + sweety_test databases.
pnpm migration:run
pnpm dev
```

The repository deliberately omits a demo seed script at the project owner's
request, although the assessment asks for one. Tests create their own fixtures
in a separate test database.
