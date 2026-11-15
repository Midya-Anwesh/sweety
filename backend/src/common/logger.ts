import pino from 'pino';

// Never log bodies, authorization headers, passwords, tokens, or DB URLs.
export const logger = pino({ level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' });
