import { type Request, Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { validateBody } from '../../lib/validationMiddleware';
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} from '../../middleware/rateLimiter';
import {
  signUpSchema,
  signInSchema,
  verifyEmailSchema,
  emailVerifyRequestSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../lib/schemas';
import { logoutSchema, refreshSessionSchema } from './auth.schema';
import {
  applyAuthSessionCookies,
  clearAuthSessionCookie,
  getRefreshTokenFromRequest,
  getAuthTokenFromRequest,
  respondWithAuthSession,
} from './authSessionCookie';
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
  validateBody(signUpSchema),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.validated, getAuthRequestContext(req));
    if (result.requiresEmailVerification || !result.accessToken || !result.user) {
      res.status(201).json(result);
      return;
    }

    const session = await buildSessionPayload(result as AuthResponse, req);
    respondWithAuthSession(req, res, session, 201);
  }),
);

authRouter.post(
  '/sign-in',
  authLimiter,
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    const result = await loginUser(req.validated, getAuthRequestContext(req));
    const session = await buildSessionPayload(result, req);
    respondWithAuthSession(req, res, session, 200);
  }),
);

authRouter.post(
  '/email/verify',
  emailVerificationLimiter,
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const result = await verifyEmail(req.validated, getAuthRequestContext(req));
    const session = await buildSessionPayload(result, req);
    respondWithAuthSession(req, res, session, 200);
  }),
);

authRouter.post(
  '/email/verify/request',
  emailVerificationLimiter,
  validateBody(emailVerifyRequestSchema),
  asyncHandler(async (req, res) => {
    const result = await resendVerificationEmail(
      { email: req.validated.email },
      getAuthRequestContext(req)
    );
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await requestPasswordReset(req.validated, getAuthRequestContext(req));
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await resetPassword(req.validated, getAuthRequestContext(req));
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
