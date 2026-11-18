# Sweety API reference

Base URL: `https://sweety-qj4d.onrender.com`. All routes below include `/api`.
Allow 180 seconds for the first Render request. No `x-api-key` is required.

Send JSON bodies with `Content-Type: application/json`. All routes except health,
register and login require `Authorization: Bearer <token>`. GET and DELETE
requests have **no body**. Protected endpoints always use the token's owner;
do not supply `userId`. Both doctor and patient roles have own-data access only.

## Shared response objects

Examples are illustrative, not data retrieved from the deployed database.
Timestamps are ISO strings. UUIDs below stand for IDs returned by your requests.

**Public user** (password hashes are never returned):

```json
{
  "id": "10000000-0000-4000-8000-000000000001",
  "name": "Demo Patient",
  "email": "patient@example.com",
  "role": "patient",
  "createdAt": "2026-01-15T09:00:00.000Z",
  "updatedAt": "2026-01-15T09:00:00.000Z"
}
```

**Reading**:

```json
{
  "id": "20000000-0000-4000-8000-000000000001",
  "userId": "10000000-0000-4000-8000-000000000001",
  "date": "2026-01-15",
  "slot": "morning_fasting",
  "value": 100,
  "createdAt": "2026-01-15T09:05:00.000Z",
  "updatedAt": "2026-01-15T09:05:00.000Z"
}
```

In response shapes below, `<user>` and `<reading>` mean these complete objects,
not literal strings to send or expect.

## Health

### GET `/api/healthz`

Public; no payload or query parameters.

**200**:

```json
{ "status": "ok", "service": "Sweety API" }
```

Confirms the HTTP service is running; the handler is not a database health probe.

## Authentication

### POST `/api/auth/register`

Public. Request:

```json
{
  "name": "Demo Patient",
  "email": "patient@example.com",
  "password": "Choose-your-own-password",
  "role": "patient"
}
```

All four fields are required. Name: trimmed, 1–255 characters. Email: trimmed,
lowercased, valid email, maximum 255 characters. Password: 8–128 Unicode code
points, never trimmed or truncated. Role: exactly `doctor` or `patient`.
Unknown properties are rejected.

- **201:** `{ "user": <user> }`. Creates the account using Argon2id; does **not**
  issue a token. Call login next.
- **400:** invalid/missing fields, unsupported role, short/long password or
  unknown properties.
- **409:** `{ "message": "An account with this email already exists." }`.
- **429:** authentication rate limit reached.

### POST `/api/auth/login`

Public. Request:

```json
{
  "email": "patient@example.com",
  "password": "Choose-your-own-password"
}
```

Email normalization and password length policy match registration.

**200** shape:

```text
{
  "token": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": "7d",
  "user": <user>
}
```

`expiresIn` reflects the backend's `JWT_EXPIRES_IN` setting, normally `7d`.
Use `token` as the Bearer token. No refresh token, token table or logout endpoint
exists; client logout discards the token.

- **400:** malformed email/password, missing fields or unknown properties.
- **401:** `{ "message": "Invalid email or password." }` for unknown email,
  incorrect password or unsupported legacy password hash. No account existence
  disclosure. Existing bcrypt hashes are not accepted.
- **429:** authentication rate limit reached.

### GET `/api/auth/me`

Protected; no payload.

- **200:** `{ "user": <user> }`.
- **401:** missing, malformed, forged or expired token, or no associated user.

## Readings

Rules for creation and filters:

- `date`: a real `YYYY-MM-DD` calendar date no later than today in server
  `APP_TIMEZONE`; historical dates are accepted.
- `slot`: exactly `morning_fasting`, `after_breakfast`, `after_lunch` or
  `after_dinner`.
- `value`: a JSON **number**, integer 40–600 mg/dl inclusive, not a string.
- One reading per user/date/slot, hence at most four readings per day.
- IDs must be UUIDs. Another user's reading is treated as not found.

### POST `/api/readings`

Protected. Request:

```json
{ "date": "2026-01-15", "slot": "morning_fasting", "value": 100 }
```

- **201:** `{ "reading": <reading> }`. Ownership and timestamps set by server.
- **400:** invalid/missing date, future date, unsupported slot, invalid value
  or unknown properties (including supplied `userId`).
- **409:** that user already has a reading for the date/slot; nothing overwritten.
- **401:** unauthenticated.

### GET `/api/readings`

Protected; no payload. Supports query parameters for pagination and filtering:

- `page`: optional integer, 1-based index (default `1`).
- `limit`: optional integer, page size (default `20`).
- `date`: optional `YYYY-MM-DD` string for exact date matching.
- `from`: optional `YYYY-MM-DD` start date for inclusive range filtering.
- `to`: optional `YYYY-MM-DD` end date for inclusive range filtering.

Both `from` and `to` (or `date` as alias for `to` when `from` is supplied) boundary dates are **inclusive** (`from <= date <= to`).

Examples:
- `/api/readings?page=1&limit=20`
- `/api/readings?date=2026-01-15`
- `/api/readings?from=2026-01-01&to=2026-01-15&page=1&limit=20`
- `/api/readings?from=2026-11-01&date=2026-11-18`

**200** shape:

```json
{
  "data": [<reading>, ...],
  "readings": [<reading>, ...],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "first": 1,
    "last": 3,
    "previous": null,
    "next": 2,
    "current": 1
  },
  "linked": [
    { "type": "previous", "label": "previous", "page": null, "active": false, "disabled": true },
    { "type": "first", "label": "1", "page": 1, "active": true, "disabled": false },
    { "type": "page", "label": "2", "page": 2, "active": false, "disabled": false },
    { "type": "last", "label": "3", "page": 3, "active": false, "disabled": false },
    { "type": "next", "label": "next", "page": 2, "active": false, "disabled": false }
  ],
  "links": {
    "first": 1,
    "last": 3,
    "previous": null,
    "next": 2,
    "current": 1,
    "buttons": [...]
  }
}
```

- When total pages exceed 7, the `linked` array includes `{ type: "ellipsis", label: "ellipces", page: null, active: false, disabled: true }` markers.
- `data` and `readings` contain the items on the current page, ordered by measurement date descending (ID descending breaks ties).
- **400:** supplied date is invalid, future date, or `from` is after `to` (`"from" date must be on or before "to" date.`).
- **401:** unauthenticated.

### GET `/api/readings/:id`

Protected; replace `:id` with the reading UUID. No payload.

- **200:** `{ "reading": <reading> }`.
- **400:** malformed UUID.
- **404:** `{ "message": "Reading not found." }` for missing or unowned reading.
- **401:** unauthenticated.

### PATCH `/api/readings/:id`

Protected. Request:

```json
{ "value": 125 }
```

- **200:** `{ "reading": <reading> }` with updated `value` and `updatedAt`.
- `date` and `slot` are immutable. Delete and recreate to correct them.
- **400:** invalid UUID; missing/invalid value; empty body; unknown properties,
  including `date`, `slot` or `userId`, even with a valid value.
- **404:** reading missing or unowned.
- **401:** unauthenticated.

### DELETE `/api/readings/:id`

Protected; no payload.

- **204:** deleted successfully; **empty response body**, not JSON.
- **400:** malformed UUID.
- **404:** missing or unowned reading, including a second delete of the same ID.
- **401:** unauthenticated.

## Reports

All three are protected GET requests with **required** `date=YYYY-MM-DD`, no
body. Invalid, missing or future dates receive **400**; unauthenticated calls
receive **401**. Statistics are scoped to the current user's readings.

### GET `/api/reports/daily?date=2026-01-15`

**200** example, including actual row structure:

```json
{
  "type": "daily",
  "selectedDate": "2026-01-15",
  "from": "2026-01-15",
  "to": "2026-01-15",
  "count": 1,
  "highest": 100,
  "lowest": 100,
  "average": 100,
  "message": null,
  "readings": [{
    "id": "20000000-0000-4000-8000-000000000001",
    "userId": "10000000-0000-4000-8000-000000000001",
    "date": "2026-01-15",
    "slot": "morning_fasting",
    "value": 100,
    "createdAt": "2026-01-15T09:05:00.000Z",
    "updatedAt": "2026-01-15T09:05:00.000Z"
  }]
}
```

Rows are returned in slot order.

### GET `/api/reports/month-to-date?date=2026-01-15`

**200** example. Inclusive first-of-month through selected date, not necessarily
the current real-world month. No `readings` property.

```json
{
  "type": "month-to-date",
  "selectedDate": "2026-01-15",
  "from": "2026-01-01",
  "to": "2026-01-15",
  "count": 2,
  "highest": 125,
  "lowest": 100,
  "average": 112.5,
  "message": null
}
```

### GET `/api/reports/monthly?date=2026-01-15`

**200** example. Entire previous calendar month relative to selected date,
inclusive; not a rolling 30 days. Handles year boundaries and leap years.
No `readings` property.

```json
{
  "type": "monthly",
  "selectedDate": "2026-01-15",
  "from": "2025-12-01",
  "to": "2025-12-31",
  "count": 0,
  "highest": null,
  "lowest": null,
  "average": null,
  "message": "No readings recorded for this period yet."
}
```

All report types return **200** for an empty period: `count: 0`, null statistics,
and the friendly message shown above. Daily additionally includes `readings: []`.
Nonempty reports have `message: null`; averages are rounded to one decimal
numerically (`110` rather than `110.0` is valid JSON output).

## Shared failure behavior

Errors normally return JSON:

```json
{ "message": "Reading not found." }
```

DTO validation errors additionally include field messages:

```json
{
  "message": "value must not be greater than 600",
  "errors": [
    { "field": "value", "message": "value must not be greater than 600" }
  ]
}
```

Exact generated validation/auth messages may vary; rely on status and field
names rather than matching every sentence.

| Status | Behavior |
| --- | --- |
| 400 | Invalid payload/query/UUID, unknown body fields or malformed JSON; fix input |
| 401 | Missing/invalid/expired authentication; log in again |
| 404 | Reading missing or unowned; no other-user disclosure |
| 409 | Duplicate email or reading slot; original data retained |
| 413 | Body exceeds 16KB; reduce payload |
| 429 | Auth routes exceed 30 requests per IP per 15 minutes; retry after the indicated limit window |
| 500 | Unexpected internal failure; generic message without database details or stack trace |

Render/proxy errors during a cold start can be non-JSON. Warm up with the
read-only health GET; do not blindly retry writes after a timeout, since a write
may have succeeded before the client lost the response.
