import request from 'supertest';
import { expect, it } from 'vitest';
import { verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { app, createLoggedInUser } from './helpers';

const { AppDataSource } = require('../dist/database/data-source') as typeof import('../src/database/data-source');
const { User } = require('../dist/modules/users/user.entity') as typeof import('../src/modules/users/user.entity');

it.each(['patient', 'doctor'] as const)('registers and logs in a %s without exposing the password hash', async (role) => {
  const { token, user, email, password } = await createLoggedInUser(role);
  expect(user.role).toBe(role);
  expect(user).not.toHaveProperty('passwordHash');
  const claims = jwt.decode(token) as jwt.JwtPayload;
  expect(claims.exp! - claims.iat!).toBe(7 * 86400);
  expect(claims.sub).toBe(user.id);

  const stored = await AppDataSource.getRepository(User).createQueryBuilder('user')
    .addSelect('user.passwordHash').where('user.email = :email', { email }).getOneOrFail();
  expect(stored.passwordHash).not.toBe(password);
  expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
  expect(await verify(stored.passwordHash, password)).toBe(true);

  const me = await request(app).get('/api/auth/me').auth(token, { type: 'bearer' });
  expect(me.status).toBe(200);
  expect(me.body.user.id).toBe(user.id);
  expect(me.body.user).not.toHaveProperty('passwordHash');
});

it('normalizes email and rejects duplicate accounts', async () => {
  const { email } = await createLoggedInUser();
  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Another User', email: ` ${email.toUpperCase()} `, password: 'Test-password-123', role: 'patient',
  });
  expect(duplicate.status).toBe(409);
});

it('rejects wrong passwords and missing, forged, or expired tokens', async () => {
  const { email, user } = await createLoggedInUser();
  expect((await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' })).status).toBe(401);
  expect((await request(app).get('/api/readings')).status).toBe(401);
  expect((await request(app).get('/api/readings').auth('forged', { type: 'bearer' })).status).toBe(401);
  const expired = jwt.sign({}, process.env.JWT_SECRET!, {
    subject: user.id, expiresIn: -1, issuer: 'sweety-api', audience: 'sweety-client', algorithm: 'HS256',
  });
  expect((await request(app).get('/api/readings').auth(expired, { type: 'bearer' })).status).toBe(401);
});

it('rejects unsupported roles and unexpected signup fields', async () => {
  const payload = { name: 'Test', email: 'test@example.com', password: 'Test-password-123', role: 'admin' };
  expect((await request(app).post('/api/auth/register').send(payload)).status).toBe(400);
  expect((await request(app).post('/api/auth/register').send({ ...payload, role: 'doctor', doctorId: 'anything' })).status).toBe(400);
});

it.each(['é'.repeat(40), 'a'.repeat(100), '🔒'.repeat(128)])('registers and logs in passwords beyond 72 bytes without truncation (%#)', async (password) => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Test', email: 'test@example.com', password, role: 'patient',
  });
  expect(response.status).toBe(201);
  const login = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password });
  expect(login.status).toBe(200);
  // A different character after byte 72 must not authenticate.
  const changed = Array.from(password).slice(0, -1).join('') + 'z';
  expect((await request(app).post('/api/auth/login').send({
    email: 'test@example.com', password: changed,
  })).status).toBe(401);
});

it('enforces the same password length boundaries on signup and login', async () => {
  for (const password of ['a'.repeat(7), 'a'.repeat(129), '🔒'.repeat(129)]) {
    const payload = { name: 'Test', email: 'test@example.com', password, role: 'patient' };
    expect((await request(app).post('/api/auth/register').send(payload)).status).toBe(400);
    expect((await request(app).post('/api/auth/login').send({
      email: payload.email, password: payload.password,
    })).status).toBe(400);
  }
  const payload = { name: 'Test', email: 'test@example.com', password: 'a'.repeat(8), role: 'patient' };
  expect((await request(app).post('/api/auth/register').send(payload)).status).toBe(201);
  expect((await request(app).post('/api/auth/login').send({
    email: payload.email, password: payload.password,
  })).status).toBe(200);
});

it('rejects unsupported stored hash formats without exposing internal errors', async () => {
  const { user, email, password } = await createLoggedInUser();
  await AppDataSource.getRepository(User).update(user.id, { passwordHash: 'unsupported-legacy-hash' });
  const result = await request(app).post('/api/auth/login').send({ email, password });
  expect(result.status).toBe(401);
  expect(result.body.message).toBe('Invalid email or password.');
});

it('rejects malformed JSON and bodies above the explicit 16KB limit', async () => {
  const malformed = await request(app).post('/api/auth/register')
    .set('Content-Type', 'application/json').send('{"name":');
  expect(malformed.status).toBe(400);
  const oversized = await request(app).post('/api/auth/register').send({
    name: 'a'.repeat(17 * 1024), email: 'test@example.com', password: 'password-123', role: 'patient',
  });
  expect(oversized.status).toBe(413);
});

it('sets CORS headers only for configured origins', async () => {
  const allowed = await request(app).get('/api/healthz').set('Origin', 'http://localhost:5173');
  expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  const disallowed = await request(app).get('/api/healthz').set('Origin', 'https://untrusted.example');
  expect(disallowed.headers['access-control-allow-origin']).toBeUndefined();
});
