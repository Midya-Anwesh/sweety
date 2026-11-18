# Sweety frontend

A React + TypeScript frontend for the existing Sweety Express API. This folder
is self-contained: no Replit workspace packages are needed on Vercel.

## Run locally

Use Node.js 22+ and pnpm 10.

```sh
cd frontend
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

On Windows, copy `.env.example` to `.env` using your editor or
`Copy-Item .env.example .env` in PowerShell.

The local frontend opens at `http://localhost:5173`. Allow that exact origin in
the backend's `CORS_ALLOWED_ORIGINS`. A blocked browser request may appear as a
network error even when Postman works.

## Public configuration

```dotenv
VITE_API_BASE_URL=https://sweety-qj4d.onrender.com/api
VITE_APP_TIMEZONE=Asia/Kolkata
```

- Include `/api` exactly once in the API base URL.
- The timezone must match the backend's `APP_TIMEZONE`, so future-date checks
  agree around midnight.
- Both are public build-time values. The defaults target the existing Render
  API and Asia/Kolkata. Changing Vercel values requires a new frontend build.
- Never add database credentials, `JWT_SECRET`, passwords or an API key to a
  `VITE_` variable: these values are embedded in the browser bundle.
- To use a local backend, set `VITE_API_BASE_URL=http://localhost:3000/api`.

## Pages and behavior

- `/`: Login, linking to signup. Stored JWT in `localStorage` is automatically verified on `/api/auth/me` on mount; authenticated users are redirected directly to `/readings` and prevented from accessing login again.
- `/signup`: Name, email, password and patient/doctor role. Uses a custom reusable `CustomInput` component powered by React Hook Form's `Controller` and `render` method instead of direct `...register`. Registration redirects to login.
- `/readings`: Protected readings and reports, with collapsible sidebar, logout confirmation dialog, and server-side paginated reading history. Both roles see only their own records.

Daily rows contain the four slots. Add from the page or an empty slot, edit only
an existing value, or confirm deletion of one reading. Date and slot are
immutable when editing. Values must be whole numbers from 40 through 600 mg/dl.
Dates cannot be in the future; one reading per slot per day, at most four.

Readings are fetched with server-side pagination and inclusive date filtering:
- **Server-side pagination:** Supports configurable page limits (`10`, `20`, `50`, `100`), with interactive navigation buttons returned directly from the API (`previous`, `first`, ellipses, dynamic window of neighboring pages, `last`, `next`).
- **Server-side date range filter:** Invokes a network request with `from` and `to` query parameters, with both boundary dates inclusive.
- Rows are grouped by measurement date and sorted descending.

Reports use the real API rather than statistics from the filtered table:

- Daily: selected date, including slot rows.
- Month-to-date: first of selected month through selected date.
- Monthly: the complete previous calendar month relative to selected date.

Each shows highest, lowest, average to one decimal and count. Empty reports
show a friendly message rather than fabricated statistics. No glucose value is
labelled medically normal/high/low and no treatment advice is generated.

## Folder structure and code flow

The uploaded Eaziquote project informed the separation of responsibilities,
without copying its business features, secrets, Firebase setup or assets.

```text
src/
├── api/
│   ├── axiosInstance.ts       # Shared transport, Bearer token and errors
│   └── services/              # Auth, readings and report endpoint calls
├── components/
│   ├── common/               # Reusable controls, dialogs and feedback
│   └── ...                   # Auth/layout/readings/report UI
├── constants/                # Endpoints, routes and slot definitions
├── guards/                   # Public-only and authenticated access
├── hooks/
│   └── apis/                 # React Query queries and mutations
├── lib/                      # Query client and focused utilities
├── pages/                    # Route-level screens
├── redux/                    # Minimal auth/session state and typed hooks
├── routes/                   # Route composition
├── types/                    # Request and response contracts
├── App.tsx
└── main.tsx                  # Application providers
```

**Flow:** a page calls a feature hook; the hook manages React Query state and
calls an API service; the service uses the shared Axios client; the returned
API data is rendered by the page. Redux holds session state, not a second copy
of every reading/report. Forms use React Hook Form and Yup.

API request/response envelopes and error statuses are documented in
[the backend API reference](../backend/api-reference.md).

## Session and network behavior

- Bearer tokens and public-user state are kept in session storage for reloads
  within the browser tab. Passwords are never persisted.
- Closing the tab normally ends its stored session, even if the server JWT
  still has time remaining. Duplicated tabs may inherit a browser-provided copy.
- A restored token is checked with `/auth/me` before exposing the protected UI.
- Logout or a protected 401 clears the session and user-scoped query cache.
  Client logout does not revoke a JWT on the backend.
- Browser storage is accessible to JavaScript and is not XSS-proof. This is
  an assignment-scale tradeoff, not a medical-production security claim.
- Requests allow up to 180 seconds because the Render service may be asleep.
  Longer waits show a cold-start notice. Writes are not automatically retried,
  because a timed-out write may already have succeeded.
- Mutations refresh readings and reports. Queries refresh when revisiting or
  refocusing the page. No API key, cookies or credentialed CORS is required.

## Publish on Vercel

The repository owner publishes the frontend; the implementation agent does not.

1. Import the `Midya-Anwesh/sweety` GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Select **Vite**, Node.js **22.x**, and these settings:

   | Setting | Value |
   | --- | --- |
   | Install Command | `pnpm install --frozen-lockfile` |
   | Build Command | `pnpm build` |
   | Output Directory | `dist` |

4. Set the two public variables above in Vercel. Do not add backend secrets.
5. Publish. `vercel.json` includes SPA rewrites so refreshing `/signup` or
   `/readings` loads the React application.
6. In **Render**, append your exact Vercel origin to
   `CORS_ALLOWED_ORIGINS`, preserving other needed origins:

   ```text
   http://localhost:5173,https://YOUR-PROJECT.vercel.app
   ```

   No trailing slash or path. Apply the backend environment change using
   Render's normal redeployment process. Preview deployments have different
   origins; each must be explicitly allowed before browser API calls can work.

7. Share the published frontend URL for the deferred browser checks.

The reading-list order changed in the accompanying backend commit, without any
schema change. If Render does not automatically deploy GitHub updates, the owner
must redeploy that backend revision to activate server-side newest-entry ordering.
The frontend groups/sorts by the returned timestamps independently.

## Checks and intentionally deferred testing

```sh
pnpm typecheck
pnpm build
```

TypeScript and production-build checks are performed for this handoff. The
unauthenticated login preview is inspected without interacting with the forms.
No functional browser/end-to-end tests, deployed API writes, or backend
integration tests are run at the owner's request. A successful build is not a
claim that the deployed frontend/backend integration has passed.

After the owner publishes to Vercel and supplies its URL, check signup/login,
session restoration/expiry/logout, reading validation and CRUD, date filtering,
report ranges/rounding/empty states, mobile layouts and route refreshes.
