import type { RequestHandler } from 'express';
import { HttpError } from '../lib/httpError';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.header('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    next(new HttpError(401, 'Missing bearer token'));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    next(new HttpError(401, 'Missing bearer token'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(new HttpError(401, 'Invalid or expired token', error));
  }
};
