import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';

export const requireMobileApiKey: RequestHandler = (req, _res, next) => {
  const apiKey = req.header('x-mobile-api-key')?.trim();

  if (!apiKey || apiKey !== env.MOBILE_API_KEY) {
    next(new HttpError(401, 'Invalid mobile API key'));
    return;
  }

  next();
};
