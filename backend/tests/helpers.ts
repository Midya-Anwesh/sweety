import request from 'supertest';
import { randomUUID } from 'node:crypto';

export const { app } = require('../dist/app') as typeof import('../src/app');

export async function createLoggedInUser(role: 'patient' | 'doctor' = 'patient') {
  const email = `test-${randomUUID()}@example.com`;
  const password = 'Test-password-123';
  const registration = await request(app).post('/api/auth/register')
    .send({ name: 'Test User', email, password, role });
  if (registration.status !== 201) throw new Error(`Test signup failed: ${registration.body.message}`);
  const login = await request(app).post('/api/auth/login').send({ email, password });
  if (login.status !== 200) throw new Error(`Test login failed: ${login.body.message}`);
  return { token: login.body.token as string, user: registration.body.user, email, password };
}

export function addReading(token: string, overrides: Record<string, unknown> = {}) {
  return request(app).post('/api/readings').auth(token, { type: 'bearer' })
    .send({ date: '2026-01-15', slot: 'morning_fasting', value: 100, ...overrides });
}
