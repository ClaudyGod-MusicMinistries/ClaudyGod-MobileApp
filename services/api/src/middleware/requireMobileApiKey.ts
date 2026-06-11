import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { UnauthorizedError } from '../lib/errors';

export const requireMobileApiKey: RequestHandler = (req, _res, next) => {
  const apiKey = req.header('x-mobile-api-key')?.trim();

  if (!apiKey || apiKey !== env.MOBILE_API_KEY) {
    next(new UnauthorizedError('Invalid mobile API key', 'INVALID_MOBILE_API_KEY'));
    return;
  }

  next();
};
