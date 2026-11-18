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
- **Server-side date range filtering:** Network-level date filtering with `from` and `to` query parameters, both inclusive (`from <= date <= to`), with automatic validation rejecting inverted ranges. Also accepts `date` as an alias for `to` when `from` is provided.
- **Reports:** Daily, month-to-date, and previous-calendar-month statistical reports calculated directly by backend endpoints.

## Installation and Setup

### Prerequisites
- **Node.js**: v22 or later
- **Package Manager**: `pnpm` 10 (`npm install -g pnpm@10`) or `npm`
- **Database**: PostgreSQL 14 or later

### 1. Clone the repository
```sh
git clone https://github.com/Midya-Anwesh/sweety.git
cd sweety
```

### 2. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```sh
   cd backend
   pnpm install
   ```
2. Create two local PostgreSQL databases (main and test):
   ```sql
   CREATE DATABASE sweety;
   CREATE DATABASE sweety_test;
   ```
3. Create your environment configuration:
   ```sh
   cp .env.example .env
   ```
   Fill in `.env` with your PostgreSQL credentials and generate a random 32-byte JWT secret:
   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Run TypeORM migrations:
   ```sh
   pnpm migration:run
   ```
5. Start the backend development server:
   ```sh
   pnpm dev
   ```
   The API will be available at `http://localhost:3000/api`.

### 3. Frontend Setup
1. Open a new terminal, navigate to the frontend directory, and install dependencies:
   ```sh
   cd frontend
   pnpm install
   ```
2. Create your environment configuration:
   ```sh
   cp .env.example .env
   ```
   To connect to your local backend, set:
   ```dotenv
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_APP_TIMEZONE=Asia/Kolkata
   ```
   *(To use the deployed Render API instead, keep `VITE_API_BASE_URL=https://sweety-qj4d.onrender.com/api`)*
3. Start the frontend development server:
   ```sh
   pnpm dev
   ```
   The application opens at `http://localhost:5173`.

## Notes

### Argon2id Instead of Bcrypt (Password Hashing Limit)
- **Why Argon2id was used:** This project deliberately chose **Argon2id** (`@node-rs/argon2`) instead of bcrypt specifically to **overcome bcrypt's 72-byte password hashing limit**.
- **Bcrypt's limitation:** Bcrypt internally caps password input at 72 bytes. When passwords contain multibyte UTF-8 Unicode characters (or passphrases longer than 72 bytes), bcrypt silently truncates any excess bytes beyond 72. This introduces security vulnerabilities (e.g., characters beyond the 72nd byte are disregarded during verification) and prevents users from using secure, long passphrases.
- **Argon2id solution:** Argon2id has no 72-byte restriction and natively processes inputs of arbitrary lengths without truncation or pre-hashing. This allows a consistent and robust application policy of **8–128 Unicode code points** on both registration and login.
- **Enhanced security:** Argon2id is the winner of the Password Hashing Competition (PHC) and is memory-hard (configured with 64 MiB memory, 3 iterations, and parallelism 1), providing state-of-the-art protection against GPU/ASIC-accelerated brute-force attacks.

### Reading Immutability
- Once recorded, a reading's `date` and `slot` are immutable. Only the glucose `value` (integer 40–600 mg/dl) can be updated via `PATCH`. Correcting a date or slot requires deleting the reading and creating a new one.

### Other Deliberate Scope Decisions
- **No seed script:** In accordance with project instructions, synthetic accounts and readings are created through the standard API endpoints, Postman collection, or frontend UI.
- **Data isolation:** Every authenticated user (`patient` or `doctor`) accesses exclusively their own reading records and reports. Doctor-patient assignments and cross-user reports are not part of this version.

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
