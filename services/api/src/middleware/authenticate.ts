import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';
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
      next(new UnauthorizedError('Missing authentication session', 'AUTH_SESSION_MISSING'));
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
      next(new UnauthorizedError('Missing authentication session', 'AUTH_SESSION_MISSING'));
    }
    return;
  }

  try {
    req.user = await resolveAuthenticatedUser(token);
    next();
  } catch {
    if (!refreshToken) {
      next(new UnauthorizedError('Invalid or expired token', 'AUTH_TOKEN_INVALID'));
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
      next(new UnauthorizedError('Invalid or expired token', 'AUTH_TOKEN_INVALID'));
    }
  }
};
