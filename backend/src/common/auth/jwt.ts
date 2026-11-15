import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export function issueToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256', subject: userId,
    issuer: 'sweety-api', audience: 'sweety-client',
    expiresIn: env.JWT_TTL_SECONDS,
  });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'], issuer: 'sweety-api', audience: 'sweety-client',
  });
  if (typeof payload === 'string' || typeof payload.sub !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sub)) {
    throw new Error('Invalid token subject');
  }
  return payload.sub;
}
