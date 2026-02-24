import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
});
