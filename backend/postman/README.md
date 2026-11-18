# Sweety Postman collection

## Import and run

1. Import **`sweety.postman_collection.json`** into Postman.
2. Import **`sweety-render.postman_environment.json`** and select **Sweety — Render**.
3. In **Settings → General**, set **Request timeout in ms** to **180000**.
   Render may need a minute or more to wake up. The first health check during
   preparation took approximately 51 seconds. The collection cannot change
   Postman's global timeout; importing it alone does not set this.
4. Send **00 → Health / warm up Render** first. Expect HTTP 200:
   `{"status":"ok","service":"Sweety API"}`.
5. Before running the full collection, edit the direct JSON bodies in **Register**
   and **Login** to use the same unique synthetic email and demo password.
   The bundled credentials are public examples, not a pre-created account.
6. For a complete demonstration, run folders **00 through 05 in order**, once.
   Use one iteration. All expected-error requests have assertions for their
   expected 4xx status; those are successful tests, not collection failures.

**Side effects:** the complete collection creates a synthetic account and one
reading, updates that reading, then deletes the reading. The account remains:
there is no account-delete endpoint. Importing does not send any requests.
The supplied environment targets the live Render service backed by Supabase.
Never use real patient data or run the lifecycle against an important account.
Only the health request was sent to the live service while preparing this
collection; no live account, reading, update or deletion was performed.

## Base URL

Every request uses `{{BASE_URL}}/api/...`.

```text
BASE_URL = https://sweety-qj4d.onrender.com
APP_TIMEZONE = Asia/Kolkata
```

Do not append `/api` or a trailing slash. For local testing, duplicate the
environment and change `BASE_URL` to `http://localhost:3000`.
Changing the origin automatically clears captured tokens and IDs before the
next request, preventing cross-server reuse. It never rewrites request bodies.

## Variables

The environment contains **exactly two fields**:

| Environment variable | Initial value / behavior |
| --- | --- |
| `BASE_URL` | Render origin above; required |
| `APP_TIMEZONE` | `Asia/Kolkata`; must match the backend's `APP_TIMEZONE` |

Payload fields are **direct JSON values**, not environment or collection
variables. Edit each request's **Body → raw → JSON** directly. Date filters and
report dates are literal values in each request's **Params** tab.
`APP_TIMEZONE` should match the backend; it does not automatically change dates.

Only captured response values and a server-switch guard are collection variables:

| Collection variable | Initial value / behavior |
| --- | --- |
| `access_token` | Blank; Login fills it automatically |
| `user_id` | Set by successful Register/Login |
| `reading_id` | Saved only by a successful Create request |
| `created_reading_id` | Cleanup guard; do not edit manually |
| `deleted_reading_id` | Saved after a successful DELETE for the final 404 check |
| `active_base_url` | Internal guard; automatically tracks the selected server |

No real password or token is bundled. The password in the example JSON bodies
is a public dummy value; replace it for your synthetic account. Bodies and
collection variables may sync with Postman and are not a secret vault.
Use synthetic accounts only with this saved workflow.
Do not commit or share populated **collection** exports, and
remember that Postman Console can display request Authorization headers.

For all endpoint payload structures, success response JSON and failure behavior,
see **[API reference](../api-reference.md)**. The same success examples and status
descriptions are included on each request inside Postman.

## Common workflows

### Direct JSON payload examples

**Register** — edit the values directly:

```json
{
  "name": "Postman Demo Patient",
  "email": "postman-demo@example.com",
  "password": "Demo-password-123!",
  "role": "patient"
}
```

**Login** — enter the same credentials as Register:

```json
{
  "email": "postman-demo@example.com",
  "password": "Demo-password-123!"
}
```

**Create reading**:

```json
{ "date": "2026-01-15", "slot": "morning_fasting", "value": 100 }
```

**Update reading**:

```json
{ "value": 125 }
```

There are no `{{name}}`, `{{email}}`, `{{role}}`, date, slot or password
placeholders in request bodies. Scripts never generate credentials or rewrite
payloads. Tokens and IDs are captured automatically after successful responses.

### New synthetic account and complete lifecycle

Choose a unique synthetic email in Register and copy the same email/password
into Login. Run the entire collection once in order. Login captures the token.
Create captures the reading ID used by retrieval, update, validation and cleanup.

For a fresh full run, choose another email in **both** JSON bodies. Otherwise
registration correctly receives 409 because that account already exists.
No POST, PATCH or DELETE is automatically retried. If you edit the Create
date/slot, copy those values into **Reject duplicate date and slot** too.

### Existing account, read-only exploration

First send Health to select/warm up the server (this clears state on origin
changes). Edit the Login JSON body with your synthetic account credentials.
Send **Login** (not Register), then
**Current user**, either list endpoint, or reports. Do not run the entire
collection or cleanup against an important account. Login clears old reading
IDs to prevent an account switch from carrying over cleanup targets.

### Paginated and filtered reading listings

Readings listing supports pagination and date filtering:

- **All readings (default pagination):** `GET /api/readings` returns the first 20 readings sorted by date descending, including pagination metadata (`total`, `page`, `limit`, `totalPages`) and pre-calculated UI navigation buttons (`linked`).
- **Explicit pagination:** `GET /api/readings?page=1&limit=20`. Edit `page` and `limit` in the request's query parameters.
- **Specific date:** `GET /api/readings?date=2026-01-15`.
- **Date range:** `GET /api/readings?from=2026-01-01&to=2026-01-15` (or `?from=2026-01-01&date=2026-01-15`). Both boundary dates are **inclusive**. Supplying `from > to` or an invalid date string returns HTTP 400.

### Change report date

Edit `date` directly in each report request's query parameters, for example
`/api/reports/daily?date=2026-01-15`. Use a real `YYYY-MM-DD` date no later than
today in the server's timezone. Queries are independent, not linked variables:

- **Daily:** that date only, including the slot readings.
- **Month-to-date:** first of that date's month through the selected date.
- **Monthly:** the complete preceding calendar month. For `2026-11-17`,
  this is `2026-10-01` through `2026-10-31`, not the preceding 30 days.

An empty period is valid: count 0, null statistics, a friendly message, and
`readings: []` on daily reports. Average values are numerically rounded to one
decimal; JSON may display `125` rather than `125.0`.

## Endpoint coverage

| Folder | Requests |
| --- | --- |
| 00 | Public health check / cold-start warm-up |
| 01 | Register, Login with token capture, Current user |
| 02 | Create, Get by ID, List all (paginated), List with pagination params, List by date, List by date range (inclusive), PATCH value only |
| 03 | Daily, Month-to-date, Previous-calendar-month reports |
| 04 | Missing auth 401, duplicate slot 409, invalid value 400, immutable date 400, invalid report date 400, inverted date range 400 |
| 05 | Guarded DELETE 204 and confirmation GET 404 |

All 12 unique API method/path combinations are covered, with additional pagination, date filter and date-range variants, along with comprehensive validation requests. Each request documents its prerequisites,
effects, expected status and behavior. Representative responses appear in
Postman's **Examples** menu; they are illustrative fixtures, not production data.

## Troubleshooting

| Result | Meaning / action |
| --- | --- |
| Timeout, HTML, 502/503 during warm-up | Allow 180 seconds, wait for Render to wake, then retry the health GET. Inspect service logs if it persists. Do not blindly retry writes. |
| Request skipped by script | Select the environment and complete the preceding Login/Create request. No stale token or fallback ID is substituted. |
| 400 | Check JSON types, date, role, password length and unknown fields. Values must be integer JSON numbers 40–600. |
| 401 | Log in again; the token may be missing, invalid or expired. Old bcrypt accounts require recovery/recreation. |
| 404 for a reading | Not found or not owned by this user. It does not disclose another user's data. |
| 409 on registration | Email exists. Login instead, or edit both Register and Login JSON bodies with a new synthetic email. |
| 409 on creation | That user already has a reading for this date and slot. Choose a different slot/date or intentionally clean up your own test reading. |
| 413 | Request body exceeds the explicit 16KB limit. |
| 429 | Auth endpoints are limited to 30 requests per IP per 15 minutes. Avoid repeated full runs. |

Passwords use Argon2id and share an 8–128 Unicode code point policy on signup and
login. PATCH accepts **only** `{ "value": 125 }`. Supplied `date`, `slot`,
`userId`, missing values, nulls, decimals and strings are rejected. JWT auth is
required; there is no `x-api-key` requirement. Postman is not subject to browser
CORS restrictions, so a successful request here does not prove browser CORS is
configured for your future frontend origin.

## Optional Newman CLI

From `backend/postman/`, with Node.js installed:

```sh
npx newman run sweety.postman_collection.json \
  --environment sweety-render.postman_environment.json \
  --timeout-request 180000 \
  --timeout-script 10000 \
  --delay-request 250 \
  --bail
```

Before running this command, edit the saved collection's Register and Login
bodies with matching unique synthetic credentials (or save your edits in Postman
and export the collection). This runs the **write-enabled** full lifecycle
against Render by default. Repeated unedited runs can fail with duplicate email.
For a read-only warm-up, add `--folder "00 — Health and cold-start warm-up"`.
Newman's collection-variable changes are in memory unless you explicitly export
the collection. Protect a populated collection export: it contains demo
credentials/token. The environment remains limited to the two deployment settings.
On Windows PowerShell, place the command on one line or use backticks instead
of shell backslash continuations.

## Maintaining these files

The checked-in JSON files are ready to import. To regenerate them after changing
the documented API contract, run the offline helper from the repository root:

```sh
node backend/postman/build-collection.cjs
```

It only writes the collection and blank-safe environment files next to itself.
It never contacts Render, Supabase, or any other service.
