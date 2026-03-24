import { type Request, Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import {
  applyAuthSessionCookies,
  clearAuthSessionCookie,
  getRefreshTokenFromRequest,
  getAuthTokenFromRequest,
  respondWithAuthSession,
} from './authSessionCookie';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  registerSchema,
  refreshSessionSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema';
import {
  getUserById,
  loginUser,
  registerUser,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from './auth.service';
import {
  issueAuthSession,
  refreshAuthSession,
  revokeRefreshSession,
} from './authSession.service';
import type { AuthResponse } from './auth.types';
import { resolveAuthenticatedUser } from './authIdentity.service';

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const buildSessionPayload = async (
  authPayload: Pick<AuthResponse, 'user' | 'message'>,
  req: Request,
): Promise<AuthResponse> => {
  const session = await issueAuthSession(authPayload.user, getAuthRequestContext(req));
  return {
    ...session,
    message: authPayload.message,
  };
};

async function resolveSessionUser(req: Request) {
  const authorization = req.header('authorization');
  const cookieToken = getAuthTokenFromRequest(req);
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : cookieToken?.trim() ?? '';

  if (!token) {
    return null;
  }

  const identity = await resolveAuthenticatedUser(token);
  const user = await getUserById(identity.sub);
  return { token, user };
}

async function resolveSessionFromRefresh(req: Request) {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    return null;
  }

  const session = await refreshAuthSession(refreshToken, getAuthRequestContext(req));
  return { token: session.accessToken, user: session.user, refreshedSession: session };
}

function getAuthRequestContext(req: Request) {
  return {
    requestIp: req.ip,
    userAgent: req.header('user-agent') || undefined,
  };
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(registerSchema, req.body);
    const result = await registerUser(payload, getAuthRequestContext(req));
    if (result.requiresEmailVerification || !result.accessToken || !result.user) {
      res.status(201).json(result);
      return;
    }

    const session = await buildSessionPayload(result as AuthResponse, req);
    respondWithAuthSession(req, res, session, 201);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(loginSchema, req.body);
    const result = await loginUser(payload, getAuthRequestContext(req));
    const session = await buildSessionPayload(result, req);
    respondWithAuthSession(req, res, session, 200);
  }),
);

authRouter.post(
  '/email/verify',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(verifyEmailSchema, req.body);
    const result = await verifyEmail(payload, getAuthRequestContext(req));
    const session = await buildSessionPayload(result, req);
    respondWithAuthSession(req, res, session, 200);
  }),
);

authRouter.post(
  '/email/verify/request',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(resendVerificationEmailSchema, req.body);
    const result = await resendVerificationEmail(payload, getAuthRequestContext(req));
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/password/forgot',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(forgotPasswordSchema, req.body);
    const result = await requestPasswordReset(payload, getAuthRequestContext(req));
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/password/reset',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(resetPasswordSchema, req.body);
    const result = await resetPassword(payload, getAuthRequestContext(req));
    res.status(200).json(result);
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(refreshSessionSchema, req.body ?? {});
    const refreshToken = payload.refreshToken || getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      clearAuthSessionCookie(res);
      res.status(401).json({ message: 'Session expired. Sign in again.' });
      return;
    }

    const session = await refreshAuthSession(refreshToken, getAuthRequestContext(req));
    respondWithAuthSession(req, res, session, 200);
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(logoutSchema, req.body ?? {});
    const refreshToken = payload.refreshToken || getRefreshTokenFromRequest(req);
    if (refreshToken) {
      await revokeRefreshSession(refreshToken);
    }
    clearAuthSessionCookie(res);
    res.status(204).send();
  }),
);

authRouter.get(
  '/session',
  asyncHandler(async (req, res) => {
    try {
      const session = await resolveSessionUser(req);
      if (!session) {
        const restored = await resolveSessionFromRefresh(req);
        if (!restored) {
          res.status(200).json({ authenticated: false, user: null });
          return;
        }
        if (getRefreshTokenFromRequest(req)) {
          applyAuthSessionCookies(res, restored.refreshedSession);
        }
        res.status(200).json({ authenticated: true, user: restored.user });
        return;
      }

      res.status(200).json({ authenticated: true, user: session.user });
    } catch {
      try {
        const restored = await resolveSessionFromRefresh(req);
        if (restored) {
          if (getRefreshTokenFromRequest(req)) {
            applyAuthSessionCookies(res, restored.refreshedSession);
          }
          res.status(200).json({ authenticated: true, user: restored.user });
          return;
        }
      } catch {
        // Fall through to anonymous state.
      }
      clearAuthSessionCookie(res);
      res.status(200).json({ authenticated: false, user: null });
    }
  }),
);

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    try {
      const session = await resolveSessionUser(req);
      if (!session) {
        const restored = await resolveSessionFromRefresh(req);
        if (!restored) {
          res.status(200).json({ authenticated: false, user: null });
          return;
        }
        if (getRefreshTokenFromRequest(req)) {
          applyAuthSessionCookies(res, restored.refreshedSession);
        }
        res.status(200).json({ authenticated: true, user: restored.user });
        return;
      }

      res.status(200).json({ authenticated: true, user: session.user });
    } catch {
      try {
        const restored = await resolveSessionFromRefresh(req);
        if (restored) {
          if (getRefreshTokenFromRequest(req)) {
            applyAuthSessionCookies(res, restored.refreshedSession);
          }
          res.status(200).json({ authenticated: true, user: restored.user });
          return;
        }
      } catch {
        // Fall through to anonymous state.
      }
      clearAuthSessionCookie(res);
      res.status(200).json({ authenticated: false, user: null });
    }
  }),
);
