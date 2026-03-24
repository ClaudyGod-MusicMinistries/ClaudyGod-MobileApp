import type { RequestHandler } from 'express';
import { HttpError } from '../lib/httpError';
import {
  applyAuthSessionCookies,
  getAuthTokenFromRequest,
  getRefreshTokenFromRequest,
} from '../modules/auth/authSessionCookie';
import { refreshAuthSession } from '../modules/auth/authSession.service';
import { resolveAuthenticatedUser } from '../modules/auth/authIdentity.service';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const authorization = req.header('authorization');
  const cookieToken = getAuthTokenFromRequest(req);
  const refreshToken = !authorization ? getRefreshTokenFromRequest(req) : null;

  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : cookieToken?.trim() ?? '';

  if (!token) {
    if (!refreshToken) {
      next(new HttpError(401, 'Missing authentication session'));
      return;
    }

    try {
      const session = await refreshAuthSession(refreshToken, {
        requestIp: req.ip,
        userAgent: req.header('user-agent') || undefined,
      });
      applyAuthSessionCookies(_res, session);
      req.user = {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
        displayName: session.user.displayName,
      };
      next();
    } catch {
      next(new HttpError(401, 'Missing authentication session'));
    }
    return;
  }

  try {
    req.user = await resolveAuthenticatedUser(token);
    next();
  } catch {
    if (!refreshToken) {
      next(new HttpError(401, 'Invalid or expired token'));
      return;
    }

    try {
      const session = await refreshAuthSession(refreshToken, {
        requestIp: req.ip,
        userAgent: req.header('user-agent') || undefined,
      });
      applyAuthSessionCookies(_res, session);
      req.user = {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
        displayName: session.user.displayName,
      };
      next();
    } catch {
      next(new HttpError(401, 'Invalid or expired token'));
    }
  }
};
