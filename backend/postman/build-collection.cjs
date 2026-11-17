// Offline authoring helper. No HTTP calls, dependencies, credentials, or database access.
// Run from any directory: node backend/postman/build-collection.cjs
const fs = require('node:fs');
const path = require('node:path');

const event = (listen, lines) => ({
  listen,
  script: { type: 'text/javascript', exec: lines },
});
const status = (code) => `pm.test("HTTP ${code}", () => pm.response.to.have.status(${code}));`;
const errorShape = 'pm.test("Readable error", () => pm.expect(pm.response.json().message).to.be.a("string").and.not.empty);';
const noHash = (value) => `pm.test("No password hash exposed", () => pm.expect(${value}).not.to.have.property("passwordHash"));`;
const requireVariables = (...names) => names.map((name) =>
  `if (!pm.collectionVariables.get("${name}")) { pm.execution.skipRequest(); throw new Error("Set ${name} or complete the preceding setup request first."); }`);
const bearerGuard = requireVariables('access_token');
const readingGuard = requireVariables('reading_id');

function example(name, code, body) {
  return {
    name,
    status: ({ 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request',
      401: 'Unauthorized', 404: 'Not Found', 409: 'Conflict', 413: 'Payload Too Large',
      429: 'Too Many Requests' })[code],
    code,
    header: code === 204 ? [] : [{ key: 'Content-Type', value: 'application/json' }],
    _postman_previewlanguage: 'json',
    cookie: [],
    body: body === undefined ? '' : JSON.stringify(body, null, 2),
  };
}

function request(name, method, endpoint, description, options = {}) {
  const headers = [{ key: 'Accept', value: 'application/json' }];
  if (options.body !== undefined) headers.push({ key: 'Content-Type', value: 'application/json' });
  const definition = {
    name,
    request: {
      method,
      header: headers,
      url: '{{BASE_URL}}/api' + endpoint,
      description: description + '\n\nExamples are illustrative, not captured production data.',
      ...(options.noauth ? { auth: { type: 'noauth' } } : {}),
      ...(options.body !== undefined ? {
        body: { mode: 'raw', raw: JSON.stringify(options.body, null, 2),
          options: { raw: { language: 'json' } } },
      } : {}),
    },
    event: [
      ...(options.before ? [event('prerequest', options.before)] : []),
      event('test', [
        status(options.code ?? 200),
        ...(options.tests ?? []),
      ]),
    ],
  };
  if (options.examples) {
    definition.response = options.examples.map((item) => ({
      ...item,
      originalRequest: definition.request,
    }));
  }
  return definition;
}

const user = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Postman Demo Patient', email: 'postman-demo@example.com', role: 'patient',
  createdAt: '2026-01-15T09:00:00.000Z', updatedAt: '2026-01-15T09:00:00.000Z',
};
const reading = {
  id: '20000000-0000-4000-8000-000000000001', userId: user.id,
  date: '2026-01-15', slot: 'morning_fasting', value: 100,
  createdAt: '2026-01-15T09:05:00.000Z', updatedAt: '2026-01-15T09:05:00.000Z',
};
const sampleReport = {
  type: 'daily', selectedDate: reading.date, from: reading.date, to: reading.date,
  count: 1, highest: 100, lowest: 100, average: 100, message: null, readings: [reading],
};
const reportTests = [
  'const report = pm.response.json();',
  'pm.test("Report structure", () => { pm.expect(report.count).to.be.a("number"); pm.expect(report.selectedDate).to.eql(new URL(pm.variables.replaceIn(pm.request.url.toString())).searchParams.get("date")); });',
  'pm.test("Statistics or friendly empty state", () => {',
  '  if (report.count === 0) {',
  '    ["highest", "lowest", "average"].forEach(key => pm.expect(report[key]).to.eql(null));',
  '    pm.expect(report.message).to.be.a("string").and.not.empty;',
  '  } else {',
  '    ["highest", "lowest", "average"].forEach(key => pm.expect(report[key]).to.be.a("number"));',
  '    pm.expect(report.lowest).to.be.at.most(report.average);',
  '    pm.expect(report.average).to.be.at.most(report.highest);',
  '  }',
  '});',
];
const readingBody = { date: '2026-01-15', slot: 'morning_fasting', value: 100 };
const demoCredentials = { email: 'postman-demo@example.com', password: 'Demo-password-123!' };

const collection = {
  info: {
    _postman_id: '5a19f2ad-2b8b-4a35-8410-c0b0b79bb712',
    name: 'Sweety — Blood Glucose Tracker API',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description: [
      '# Sweety API',
      'Import the companion **Sweety — Render** environment and select it before sending requests.',
      'The environment contains only `BASE_URL` and `APP_TIMEZONE`. Every URL uses `BASE_URL`, initially `https://sweety-qj4d.onrender.com` (without `/api` or a trailing slash). All payload fields use direct, editable JSON values. Only response-captured tokens/IDs and the server-switch guard use collection variables.',
      '## Cold starts',
      'Set Postman Settings → General → Request timeout in ms to **180000**. The first health request may take a minute or more. This timeout is a client setting, not an environment variable a collection can enforce.',
      '## Run order and side effects',
      'Run folders 00 → 05, in order, for a complete demonstration. This creates a synthetic account and one reading, edits that reading, then deletes only the reading created by this collection. The account remains because no user-delete API exists. Do not use real patient data.',
      'The health folder is read-only. Running the entire collection against Render WILL write to the Supabase-backed service. The collection does not auto-run on import.',
      'Before a full run, edit the Register JSON body with a unique synthetic email and a demo password, and enter the same email/password directly in the Login JSON body. Nothing generates or rewrites credentials. Reusing a registered email correctly returns 409. For an existing demo account, skip Register and start with Login.',
      'Reading bodies and date query parameters have literal examples. Edit them directly; keep the duplicate-reading request aligned with Create and choose the report/filter dates you want. APP_TIMEZONE documents the server timezone; scripts do not rewrite dates.',
      'Login saves `access_token` and `user_id` as collection variables. Creation saves `reading_id` and a cleanup guard. A failed login/create clears stale state rather than reusing another account or reading. Switching BASE_URL automatically clears captured tokens/IDs before sending.',
      '## API rules',
      'Roles: `patient` or `doctor`; both access only their own data. Passwords: Argon2id, 8–128 Unicode code points. JWT lifetime: server-configured, normally 7 days.',
      'Slots: `morning_fasting`, `after_breakfast`, `after_lunch`, `after_dinner`. Values: integer 40–600 mg/dl, maximum one reading per user/date/slot. Past dates are allowed; future dates are not.',
      'PATCH accepts only `{ "value": 125 }`. Date and slot are immutable. Reports: daily, month-to-date through the selected date, and the entire previous calendar month relative to that date.',
      '## Security',
      'No API key is required. Protected routes inherit Bearer `{{access_token}}`. Use synthetic demo credentials only. Request bodies and collection variables may sync with Postman; never publish populated collections or share console Authorization headers.',
      'See the companion README for variables, sample responses, expected errors, rate limits, and a Newman command.',
    ].join('\n\n'),
  },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{access_token}}', type: 'string' }] },
  event: [event('prerequest', [
    'const base = pm.environment.get("BASE_URL");',
    'if (!base || !/^https?:\\/\\/[^\\s/?#]+$/.test(base)) {',
    '  pm.execution.skipRequest(); throw new Error("Select the Sweety environment. BASE_URL must be an HTTP(S) origin, without /api or a trailing slash.");',
    '}',
    'if (pm.collectionVariables.get("active_base_url") !== base) {',
    '  ["access_token", "user_id", "reading_id", "created_reading_id", "deleted_reading_id"].forEach(key => pm.collectionVariables.set(key, ""));',
    '  pm.collectionVariables.set("active_base_url", base);',
    '}',
  ])],
  item: [
    {
      name: '00 — Health and cold-start warm-up',
      description: 'Read-only. Run this first and allow up to 180 seconds. A successful health response confirms the HTTP service is running; it is not a standalone database connectivity probe.',
      item: [request('Health / warm up Render', 'GET', '/healthz',
        'Public health check. Expected 200 with the Sweety API service name. It does not create data or require a token. Retry this GET if the service is waking up; do not automatically retry writes.', {
          noauth: true,
          tests: ['pm.test("Healthy service", () => pm.expect(pm.response.json()).to.deep.equal({ status: "ok", service: "Sweety API" }));'],
          examples: [example('Healthy service', 200, { status: 'ok', service: 'Sweety API' })],
        })],
    },
    {
      name: '01 — Register, log in, and inspect user',
      description: 'Edit credentials directly in both Register and Login JSON bodies so they match. Registration creates a real synthetic account. Login saves the token automatically. Set role to doctor directly in Register to try that role; it does not enable cross-user access.',
      item: [
        request('Register demo user', 'POST', '/auth/register',
          'Creates an account; does not log in automatically. Expected 201. Edit the literal JSON fields directly. Choose a unique synthetic email before registration and copy that email/password into the Login body. Names/emails are trimmed; email is lowercased. Existing email → 409. Invalid fields/role/password → 400. No credentials are generated or rewritten. No accounts are ever deleted automatically.', {
            noauth: true,
            before: [
              '["access_token", "user_id", "reading_id", "created_reading_id", "deleted_reading_id"].forEach(key => pm.collectionVariables.set(key, ""));',
            ],
            body: { name: 'Postman Demo Patient', ...demoCredentials, role: 'patient' },
            code: 201,
            tests: [
              'if (pm.response.code === 201) { const user = pm.response.json().user; pm.collectionVariables.set("user_id", user.id); }',
              'const user = pm.response.json().user;',
              'pm.test("Registered selected role", () => pm.expect(user.role).to.eql(JSON.parse(pm.request.body.raw).role));',
              noHash('user'),
            ],
            examples: [example('Registered patient', 201, { user }), example('Duplicate email', 409, { message: 'An account with this email already exists.' })],
          }),
        request('Log in and save access token', 'POST', '/auth/login',
          'Edit email/password directly in this JSON body to match the registered demo account. Expected 200. Saves access_token and user_id for all protected requests. Clears any previous token and reading IDs before login, preventing reuse after a failed login or account switch. Wrong password, unknown account, unsupported legacy hash format → 401. Invalid password length/email → 400. Old bcrypt accounts require recovery/recreation; they cannot be converted automatically.', {
            noauth: true,
            before: [
              '["access_token", "user_id", "reading_id", "created_reading_id", "deleted_reading_id"].forEach(key => pm.collectionVariables.set(key, ""));',
            ],
            body: demoCredentials,
            tests: [
              'if (pm.response.code === 200) { const data = pm.response.json(); pm.collectionVariables.set("access_token", data.token); pm.collectionVariables.set("user_id", data.user.id); }',
              'const data = pm.response.json();',
              'pm.test("Bearer token returned", () => { pm.expect(data.token).to.be.a("string").and.not.empty; pm.expect(data.tokenType).to.eql("Bearer"); pm.expect(data.expiresIn).to.be.a("string"); });',
              noHash('data.user'),
            ],
            examples: [example('Logged in (illustrative token)', 200, { token: '<JWT returned only by your own login>', tokenType: 'Bearer', expiresIn: '7d', user }), example('Invalid credentials', 401, { message: 'Invalid email or password.' })],
          }),
        request('Get current user', 'GET', '/auth/me', 'Returns the authenticated public user. Missing, forged or expired Bearer token → 401. No password hash is returned.', {
          before: bearerGuard,
          tests: ['pm.test("Correct current user", () => pm.expect(pm.response.json().user.id).to.eql(pm.collectionVariables.get("user_id")));', noHash('pm.response.json().user')],
          examples: [example('Current user', 200, { user })],
        }),
      ],
    },
    {
      name: '02 — Reading lifecycle',
      description: 'Requires login. Create saves the ID used by subsequent requests. Edit date/slot/value directly in each JSON body. Date examples are historical; they are never automatically changed. Do not use a pre-existing patient account for automated demonstrations.',
      event: [event('prerequest', bearerGuard)],
      item: [
        request('Create reading and save its ID', 'POST', '/readings',
          'Creates one reading using the literal date/slot/value in this JSON body. Expected 201; duplicate user/date/slot → 409. The four slots and unique constraint enforce max four per day. Dates may be historical, but not future. Clears old reading state before attempting creation. Never supply userId: ownership comes from JWT.', {
            before: ['["reading_id", "created_reading_id", "deleted_reading_id"].forEach(key => pm.collectionVariables.unset(key));'],
            body: readingBody, code: 201,
            tests: [
              'if (pm.response.code === 201) { const reading = pm.response.json().reading; pm.collectionVariables.set("reading_id", reading.id); pm.collectionVariables.set("created_reading_id", reading.id); }',
              'pm.test("Reading belongs to current user", () => pm.expect(pm.response.json().reading.userId).to.eql(pm.collectionVariables.get("user_id")));',
              'pm.test("Created value", () => pm.expect(pm.response.json().reading.value).to.eql(JSON.parse(pm.request.body.raw).value));',
            ],
            examples: [example('Created reading', 201, { reading }), example('Duplicate slot', 409, { message: 'You already have an morning fasting reading for this date. You can add only 4 readings per day.' })],
          }),
        request('Get created reading', 'GET', '/readings/{{reading_id}}', 'Retrieves only an owned reading. Missing or another user’s ID → 404; malformed UUID → 400.', {
          before: readingGuard,
          tests: ['pm.test("Correct reading", () => pm.expect(pm.response.json().reading.id).to.eql(pm.collectionVariables.get("reading_id")));'],
          examples: [example('Owned reading', 200, { reading }), example('Missing or not owned', 404, { message: 'Reading not found.' })],
        }),
        request('List all own readings', 'GET', '/readings', 'Returns { readings: [] } when empty. Sorted by date descending and slot order ascending. No pagination is implemented.', {
          tests: ['pm.test("Own readings only", () => { const rows = pm.response.json().readings; pm.expect(rows).to.be.an("array"); rows.forEach(row => pm.expect(row.userId).to.eql(pm.collectionVariables.get("user_id"))); });'],
          examples: [example('Readings', 200, { readings: [reading] }), example('Empty list', 200, { readings: [] })],
        }),
        request('List own readings for date', 'GET', '/readings?date=2026-01-15', 'Edit the literal date query parameter (YYYY-MM-DD) directly. Invalid/future date → 400. Report dates are independent query parameters.', {
          tests: ['pm.test("Date filter", () => { const date = new URL(pm.variables.replaceIn(pm.request.url.toString())).searchParams.get("date"); const rows = pm.response.json().readings; pm.expect(rows).to.be.an("array"); rows.forEach(row => pm.expect(row.date).to.eql(date)); });'],
          examples: [example('Filtered readings', 200, { readings: [reading] })],
        }),
        request('Update glucose value only', 'PATCH', '/readings/{{reading_id}}', 'Changes value to 125 mg/dl. value is required, integer 40–600. Empty body, null/string/decimal/out-of-range value, date, slot or other unknown fields → 400. Correcting date/slot requires delete and recreate.', {
          before: readingGuard, body: { value: 125 },
          tests: ['pm.test("Updated value", () => pm.expect(pm.response.json().reading.value).to.eql(JSON.parse(pm.request.body.raw).value));'],
          examples: [example('Updated reading', 200, { reading: { ...reading, value: 125 } })],
        }),
      ],
    },
    {
      name: '03 — Reports',
      description: 'Read-only, authenticated. Edit the date=YYYY-MM-DD query parameter directly on each request. Statistics include only the current user. Numeric averages are rounded to one decimal but JSON may show 125 instead of 125.0.',
      event: [event('prerequest', bearerGuard)],
      item: [
        request('Daily report', 'GET', '/reports/daily?date=2026-01-15', 'For the selected date query parameter only. Edit it directly. Includes reading rows in slot order plus highest, lowest, average, count. Empty: count=0, null statistics, friendly message, readings=[].', {
          tests: [...reportTests, 'pm.test("Daily readings included", () => { const data = pm.response.json(); pm.expect(data.readings).to.be.an("array"); pm.expect(data.readings.length).to.eql(data.count); });'],
          examples: [example('Daily report', 200, sampleReport), example('Empty daily report', 200, { ...sampleReport, count: 0, highest: null, lowest: null, average: null, message: 'No readings recorded for this period yet.', readings: [] })],
        }),
        request('Month-to-date report', 'GET', '/reports/month-to-date?date=2026-01-15', 'From the first day of the selected date’s month through the date query parameter, inclusive. Edit the query directly. Not necessarily the current real-world month. Does not include a readings array.', {
          tests: [...reportTests, 'pm.test("Month-to-date boundaries", () => { const data = pm.response.json(); pm.expect(data.from).to.eql(data.selectedDate.slice(0, 7) + "-01"); pm.expect(data.to).to.eql(data.selectedDate); });'],
          examples: [example('Month-to-date example', 200, { type: 'month-to-date', selectedDate: reading.date, from: '2026-01-01', to: reading.date, count: 1, highest: 100, lowest: 100, average: 100, message: null })],
        }),
        request('Entire previous calendar month report', 'GET', '/reports/monthly?date=2026-01-15', 'The full calendar month before the date query parameter’s month—not a rolling 30 days. For 2026-01-15, range is 2025-12-01 through 2025-12-31. Edit the query directly. Handles leap years and year boundaries. Does not include reading rows.', {
          tests: [...reportTests, 'pm.test("Previous calendar month boundaries", () => { const data = pm.response.json(); const first = new Date(data.selectedDate.slice(0, 7) + "-01T00:00:00Z"); const last = new Date(first.getTime() - 86400000).toISOString().slice(0, 10); pm.expect(data.to).to.eql(last); pm.expect(data.from).to.eql(last.slice(0, 7) + "-01"); });'],
          examples: [example('Empty previous month', 200, { type: 'monthly', selectedDate: reading.date, from: '2025-12-01', to: '2025-12-31', count: 0, highest: null, lowest: null, average: null, message: 'No readings recorded for this period yet.' })],
        }),
      ],
    },
    {
      name: '04 — Expected validation errors',
      description: 'These tests PASS when the server rejects the request. Use only synthetic test data. Successful rejection does not create or modify a reading.',
      item: [
        request('Reject missing authentication', 'GET', '/readings', 'Intentionally sends no Bearer token. Expected 401.', {
          noauth: true, code: 401, tests: [errorShape],
          examples: [example('Unauthenticated', 401, { message: 'Authorization is required for request on GET /api/readings' })],
        }),
        request('Reject duplicate date and slot', 'POST', '/readings', 'Run after creating the reading, before deleting it. Keep the literal date and slot in this body identical to Create if you edit those examples. Expected 409; does not overwrite the original value.', {
          before: [...bearerGuard, ...readingGuard], body: readingBody, code: 409, tests: [errorShape],
        }),
        request('Reject invalid glucose value', 'POST', '/readings', '601 is outside 40–600 and must be rejected before database insertion. Expected 400.', {
          before: bearerGuard, body: { ...readingBody, value: 601 }, code: 400, tests: [errorShape],
        }),
        request('Reject date change on update', 'PATCH', '/readings/{{reading_id}}', 'Even with a valid value, a supplied date is forbidden. Expected 400. No reading fields should change.', {
          before: [...bearerGuard, ...readingGuard], body: { value: 150, date: '2026-01-15' }, code: 400, tests: [errorShape],
        }),
        request('Reject invalid report date', 'GET', '/reports/daily?date=not-a-date', 'Calendar validation rejects this query. Missing or future dates are also rejected. Expected 400.', {
          before: bearerGuard, code: 400, tests: [errorShape],
        }),
      ],
    },
    {
      name: '05 — Clean up the created reading',
      description: 'Destructive: deletes only the ID saved after a successful Create reading request. Never substitutes another ID. The demo account remains, as the API has no account-deletion endpoint.',
      event: [event('prerequest', bearerGuard)],
      item: [
        request('Delete collection-created reading', 'DELETE', '/readings/{{reading_id}}', 'Expected 204 and an empty response body. A guard refuses to send if reading_id does not match created_reading_id. Only execute against a disposable collection-created reading.', {
          before: [...readingGuard,
            'if (pm.collectionVariables.get("reading_id") !== pm.collectionVariables.get("created_reading_id")) { pm.execution.skipRequest(); throw new Error("Refusing cleanup: this reading was not saved by the Create request."); }'],
          code: 204,
          tests: [
            'pm.test("No response body", () => pm.expect(pm.response.text()).to.eql(""));',
            'if (pm.response.code === 204) { pm.collectionVariables.set("deleted_reading_id", pm.collectionVariables.get("reading_id")); pm.collectionVariables.unset("reading_id"); pm.collectionVariables.unset("created_reading_id"); }',
          ],
          examples: [example('Deleted', 204)],
        }),
        request('Confirm deleted reading is gone', 'GET', '/readings/{{deleted_reading_id}}', 'Expected 404 after successful deletion. Keeps deleted_reading_id solely so this confirmation can be repeated.', {
          before: requireVariables('deleted_reading_id'), code: 404, tests: [errorShape],
          examples: [example('Reading deleted', 404, { message: 'Reading not found.' })],
        }),
      ],
    },
  ],
};

collection.variable = [
  ['access_token', ''],
  ['user_id', ''],
  ['reading_id', ''],
  ['created_reading_id', ''],
  ['deleted_reading_id', ''],
  ['active_base_url', ''],
].map(([key, value]) => ({ key, value, type: 'string' }));
const environment = {
  id: 'b9c03168-a802-4b4d-9d29-ebfda3ed71a7',
  name: 'Sweety — Render',
  values: [
    { key: 'BASE_URL', value: 'https://sweety-qj4d.onrender.com', type: 'default', enabled: true },
    { key: 'APP_TIMEZONE', value: 'Asia/Kolkata', type: 'default', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};
for (const [filename, data] of [
  ['sweety.postman_collection.json', collection],
  ['sweety-render.postman_environment.json', environment],
]) {
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2) + '\n');
}
console.log('Generated Sweety Postman collection and blank-safe Render environment.');
