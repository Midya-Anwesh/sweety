import request from 'supertest';
import { expect, it } from 'vitest';
import { app, addReading, createLoggedInUser } from './helpers';

it('calculates daily, month-to-date, and previous-month reports for the selected date', async () => {
  const { token } = await createLoggedInUser();
  const fixtures = [
    { date: '2025-12-31', value: 90 },
    { date: '2026-01-01', value: 40 },
    { date: '2026-01-15', value: 101 },
    { date: '2026-01-15', value: 102, slot: 'after_lunch' },
    { date: '2026-01-15', value: 102, slot: 'after_dinner' },
    { date: '2026-01-16', value: 600 },
  ];
  for (const fixture of fixtures) expect((await addReading(token, fixture)).status).toBe(201);
  const other = await createLoggedInUser();
  await addReading(other.token, { value: 500 });

  const daily = await request(app).get('/api/reports/daily?date=2026-01-15').auth(token, { type: 'bearer' });
  expect(daily.status).toBe(200);
  expect(daily.body).toMatchObject({ count: 3, highest: 102, lowest: 101, average: 101.7 });
  expect(daily.body.readings.map((reading: { slot: string }) => reading.slot))
    .toEqual(['morning_fasting', 'after_lunch', 'after_dinner']);

  const mtd = await request(app).get('/api/reports/month-to-date?date=2026-01-15').auth(token, { type: 'bearer' });
  expect(mtd.body).toMatchObject({ from: '2026-01-01', to: '2026-01-15', count: 4, average: 86.3, lowest: 40, highest: 102 });

  const monthly = await request(app).get('/api/reports/monthly?date=2026-01-15').auth(token, { type: 'bearer' });
  expect(monthly.body).toMatchObject({ from: '2025-12-01', to: '2025-12-31', count: 1, average: 90 });
});

it('returns a friendly empty report rather than misleading zero statistics', async () => {
  const { token } = await createLoggedInUser();
  const result = await request(app).get('/api/reports/daily?date=2026-01-15').auth(token, { type: 'bearer' });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ count: 0, highest: null, lowest: null, average: null, readings: [] });
  expect(result.body.message).toContain('No readings');
});

it('handles leap-year month boundaries and validates report queries', async () => {
  const { token } = await createLoggedInUser();
  const leap = await request(app).get('/api/reports/monthly?date=2024-03-15').auth(token, { type: 'bearer' });
  expect(leap.body).toMatchObject({ from: '2024-02-01', to: '2024-02-29' });
  for (const query of ['', '?date=invalid', '?date=2999-01-01', '?date=2026-02-30']) {
    expect((await request(app).get(`/api/reports/daily${query}`).auth(token, { type: 'bearer' })).status).toBe(400);
  }
});
