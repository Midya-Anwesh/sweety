import request from 'supertest';
import { expect, it } from 'vitest';
import bcrypt from 'bcrypt';
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
  expect(await bcrypt.compare(password, stored.passwordHash)).toBe(true);

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

it('rejects passwords longer than bcrypt’s 72-byte limit', async () => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Test', email: 'test@example.com', password: 'é'.repeat(40), role: 'patient',
  });
  expect(response.status).toBe(400);
});

it('sets CORS headers only for configured origins', async () => {
  const allowed = await request(app).get('/api/healthz').set('Origin', 'http://localhost:5173');
  expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  const disallowed = await request(app).get('/api/healthz').set('Origin', 'https://untrusted.example');
  expect(disallowed.headers['access-control-allow-origin']).toBeUndefined();
});
