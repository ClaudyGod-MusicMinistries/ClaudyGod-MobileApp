import type { RequestHandler } from 'express';
import { HttpError } from '../lib/httpError';
import { getAuthTokenFromRequest } from '../modules/auth/authSessionCookie';
import { resolveAuthenticatedUser } from '../modules/auth/authIdentity.service';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const authorization = req.header('authorization');
  const cookieToken = getAuthTokenFromRequest(req);

  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : cookieToken?.trim() ?? '';

  if (!token) {
    next(new HttpError(401, 'Missing authentication session'));
    return;
  }

  try {
    req.user = await resolveAuthenticatedUser(token);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
};
