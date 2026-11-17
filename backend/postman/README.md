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
5. For a complete demonstration, run folders **00 through 05 in order**, once.
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
Changing the origin automatically clears saved collection credentials, token,
IDs and dates before the next request, preventing cross-server reuse.

## Variables

The environment contains **exactly two fields**:

| Environment variable | Initial value / behavior |
| --- | --- |
| `BASE_URL` | Render origin above; required |
| `APP_TIMEZONE` | `Asia/Kolkata`; must match the backend's `APP_TIMEZONE` |

Request payload fields and saved request state are **collection variables**, not
environment settings. Open the collection → **Variables** to view or change them:

| Collection variable | Initial value / behavior |
| --- | --- |
| `name` | `Postman Demo Patient` |
| `role` | `patient`; can be changed to `doctor`, which still has own-data access only |
| `email` | Blank; Register generates a unique synthetic address if empty |
| `password` | Blank; Register generates a random demo password if empty |
| `access_token` | Blank; Login fills it automatically |
| `user_id` | Set by successful Register/Login |
| `reading_date` | Blank; filled once with today in `APP_TIMEZONE`; can be set to a past date |
| `reading_slot` | `morning_fasting`; also accepts `after_breakfast`, `after_lunch`, `after_dinner` |
| `reading_id` | Saved only by a successful Create request |
| `selected_date` | Defaults once to `reading_date`; used by all three report queries |
| `created_reading_id` | Cleanup guard; do not edit manually |
| `deleted_reading_id` | Saved after a successful DELETE for the final 404 check |
| `active_base_url` | Internal guard; automatically tracks the selected server |

No real password or token is bundled. Postman stores generated demo credentials
in collection variables, which may sync with your Postman workspace and are not
a secret vault. Use synthetic accounts only with this saved workflow.
Do not commit or share populated **collection** exports, and
remember that Postman Console can display request Authorization headers.

For all endpoint payload structures, success response JSON and failure behavior,
see **[API reference](../api-reference.md)**. The same success examples and status
descriptions are included on each request inside Postman.

## Common workflows

### New synthetic account and complete lifecycle

Leave `email` and `password` empty, run the entire collection once in order.
Registration generates credentials; Login captures the token. Create captures
the reading ID used by retrieval, update, validation and cleanup.

For a fresh full run, clear `email` and `password` first. Otherwise registration
correctly receives 409 because that account already exists. There is no
automatic retry of a POST, PATCH, or DELETE.

### Existing account, read-only exploration

First send Health to select/warm up the server (this clears state on origin
changes). Set synthetic account credentials in collection Variables.
Send **Login** (not Register), then
**Current user**, either list endpoint, or reports. Do not run the entire
collection or cleanup against an important account. Login clears old reading
IDs to prevent an account switch from carrying over cleanup targets.

### Change report date

Set `selected_date` to a real `YYYY-MM-DD` date no later than today:

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
| 02 | Create, Get by ID, List all, List by date, PATCH value only |
| 03 | Daily, Month-to-date, Previous-calendar-month reports |
| 04 | Missing auth 401, duplicate slot 409, invalid value 400, immutable date 400, invalid report date 400 |
| 05 | Guarded DELETE 204 and confirmation GET 404 |

All 12 unique API method/path combinations are covered, with an additional date
filter variant and validation requests. Each request documents its prerequisites,
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
| 409 on registration | Email exists. Login instead, or clear email/password for another synthetic account. |
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

This runs the **write-enabled** full lifecycle against Render by default.
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
