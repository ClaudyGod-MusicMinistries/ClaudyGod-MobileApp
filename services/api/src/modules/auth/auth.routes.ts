import { z } from 'zod';
import { type Request, type Response, Router } from 'express';
import { pool } from '../../db/pool';
import { asyncHandler } from '../../lib/asyncHandler';
import { UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { validateBody } from '../../lib/validationMiddleware';
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  inviteLimiter,
  accessRequestLimiter,
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
  validateAdminInviteToken,
  acceptAdminInvite,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  verifyMfaLogin,
  createAccessRequest,
} from './auth.service';
import { requestEmailOtp, verifyEmailOtp } from './emailOtp.service';
import {
  registerTrustedDevice,
  verifyTrustedDeviceToken,
  listTrustedDevices,
  revokeTrustedDevice,
} from './trustedDevice.service';
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

interface DeviceIdentityInput {
  deviceFingerprint?: string;
  deviceName?: string;
  platform?: string;
}

const buildSessionPayload = async (
  authPayload: Pick<AuthResponse, 'user' | 'message'>,
  req: Request,
  device?: DeviceIdentityInput,
): Promise<AuthResponse> => {
  const session = await issueAuthSession(authPayload.user, getAuthRequestContext(req, device));
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

function getAuthRequestContext(req: Request, device?: DeviceIdentityInput) {
  return {
    requestIp: req.ip,
    userAgent: req.header('user-agent') || undefined,
    deviceFingerprint: device?.deviceFingerprint,
    deviceName: device?.deviceName,
    platform: device?.platform,
  };
}

async function handleSignIn(req: Request, res: Response) {
  const result = await loginUser(req.validated, getAuthRequestContext(req));
  if (result.mfaRequired) {
    res.status(200).json({
      mfaRequired: true,
      mfaToken: result.mfaToken,
      message: result.message ?? 'MFA verification required',
    });
    return;
  }
  const session = await buildSessionPayload(result, req, req.validated);
  respondWithAuthSession(req, res, session, 200);
}

async function handleForgotPassword(req: Request, res: Response) {
  const result = await requestPasswordReset(req.validated, getAuthRequestContext(req));
  res.status(202).json(result);
}

async function handleResetPassword(req: Request, res: Response) {
  const result = await resetPassword(req.validated, getAuthRequestContext(req));
  res.status(200).json(result);
}

authRouter.post(
  '/register',
  authLimiter,
  validateBody(signUpSchema),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.validated, getAuthRequestContext(req));
    if (result.requiresEmailVerification || !result.accessToken || !result.user) {
      res.status(201).json(result);
      return;
    }

    const session = await buildSessionPayload(result as AuthResponse, req, req.validated);
    respondWithAuthSession(req, res, session, 201);
  }),
);

authRouter.post(
  '/sign-in',
  authLimiter,
  validateBody(signInSchema),
  asyncHandler(handleSignIn),
);

authRouter.post(
  '/login',
  authLimiter,
  validateBody(signInSchema),
  asyncHandler(handleSignIn),
);

const mfaVerifyLoginSchema = z.object({
  mfaToken: z.string().min(32, 'Invalid MFA token'),
  code: z.string().trim().min(6).max(8),
});

authRouter.post(
  '/mfa/verify',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { mfaToken, code } = validateSchema(mfaVerifyLoginSchema, req.body);
    const result = await verifyMfaLogin({ mfaToken, code }, getAuthRequestContext(req));
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
  asyncHandler(handleForgotPassword),
);

authRouter.post(
  '/password/forgot',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(handleForgotPassword),
);

authRouter.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(handleResetPassword),
);

authRouter.post(
  '/password/reset',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(handleResetPassword),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(refreshSessionSchema, req.body ?? {});
    const refreshToken = payload.refreshToken || getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      clearAuthSessionCookie(res);
      throw new UnauthorizedError('Session expired. Sign in again.', 'SESSION_EXPIRED');
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


// ── Admin access request (public, rate-limited) ──────────────────────────────

const accessRequestSchema = z.object({
  name:    z.string().min(1, 'Name is required').max(120),
  email:   z.string().email('Valid email required'),
  role:    z.enum(['CREATOR', 'MODERATOR', 'ADMIN']).default('MODERATOR'),
  message: z.string().max(500).optional(),
});

authRouter.post(
  '/access-requests',
  accessRequestLimiter,
  asyncHandler(async (req, res) => {
    const input = validateSchema(accessRequestSchema, req.body);
    const result = await createAccessRequest(input);
    res.status(201).json({ id: result.id, message: 'Access request received. You will be contacted if approved.' });
  }),
);

// ── Admin invite: validate + accept (public, no auth required) ───────────────

authRouter.get(
  '/invitations/validate',
  inviteLimiter,
  asyncHandler(async (req, res) => {
    const token = String(req.query.token ?? '').trim();
    if (!token || token.length < 32) {
      res.status(400).json({ message: 'Invalid invitation token', code: 'INVITE_INVALID' });
      return;
    }
    const details = await validateAdminInviteToken(token);
    res.status(200).json(details);
  }),
);

const acceptInviteSchema = z.object({
  token:       z.string().min(32, 'Invalid invitation token'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  name:        z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
}).refine((d) => d.name ?? d.displayName, { message: 'name or displayName is required' });

authRouter.post(
  '/invitations/accept',
  inviteLimiter,
  asyncHandler(async (req, res) => {
    const { token, name, displayName, password } = validateSchema(acceptInviteSchema, req.body);
    const result = await acceptAdminInvite(
      { token, name: name ?? displayName ?? '', displayName: displayName ?? name ?? '', password },
      getAuthRequestContext(req),
    );
    const session = await buildSessionPayload(result, req);
    respondWithAuthSession(req, res, session, 201);
  }),
);

// ── Email OTP (passwordless sign-in) ─────────────────────────────────────────

const otpRequestSchema = z.object({
  email:   z.string().email('Valid email required'),
  purpose: z.enum(['sign_in', 'sign_up']).default('sign_in'),
});

const otpVerifySchema = z.object({
  email:   z.string().email(),
  code:    z.string().trim().length(6, 'Code must be 6 digits'),
  purpose: z.enum(['sign_in', 'sign_up']).default('sign_in'),
  deviceFingerprint: z.string().min(8).max(256).optional(),
  deviceName: z.string().max(120).optional(),
  platform: z.string().max(32).optional(),
});

authRouter.post(
  '/otp/request',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, purpose } = validateSchema(otpRequestSchema, req.body);
    await requestEmailOtp(email, purpose);
    res.status(202).json({ message: 'Verification code sent to your email.' });
  }),
);

authRouter.post(
  '/otp/verify',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, code, purpose, deviceFingerprint, deviceName, platform } = validateSchema(otpVerifySchema, req.body);
    const { email: resolvedEmail } = await verifyEmailOtp(email, code, purpose);

    const userResult = await pool.query<{
      id: string; email: string; display_name: string; role: string; tier: string;
      mfa_enabled: boolean; created_at: string; email_verified_at: string | null;
    }>(
      `SELECT id, email, display_name, role, COALESCE(tier,'free') AS tier,
              COALESCE(mfa_enabled, FALSE) AS mfa_enabled, created_at, email_verified_at
       FROM app_users WHERE email = $1 LIMIT 1`,
      [resolvedEmail],
    );

    if (!userResult.rows[0]) {
      res.status(404).json({ message: 'Account not found', code: 'USER_NOT_FOUND' });
      return;
    }

    const u = userResult.rows[0];
    const safeUser = {
      id: u.id, email: u.email, displayName: u.display_name,
      role: u.role as never, tier: (u.tier ?? 'free') as never,
      mfaEnabled: u.mfa_enabled, createdAt: u.created_at,
      emailVerifiedAt: u.email_verified_at,
    };

    const session = await issueAuthSession(
      safeUser,
      getAuthRequestContext(req, { deviceFingerprint, deviceName, platform }),
    );
    respondWithAuthSession(req, res, session, 200);
  }),
);

// ── Trusted devices ───────────────────────────────────────────────────────────

const trustedDeviceRegisterSchema = z.object({
  deviceLabel:       z.string().max(120).optional(),
  deviceFingerprint: z.string().min(8).max(256),
  platform:          z.string().max(32).default('mobile'),
});

const trustedDeviceVerifySchema = z.object({
  token: z.string().min(32),
});

authRouter.post(
  '/trusted-devices/register',
  asyncHandler(async (req, res) => {
    const authHeader = req.header('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) { throw new UnauthorizedError('Authentication required'); }

    const identity = await resolveAuthenticatedUser(token);
    const input = validateSchema(trustedDeviceRegisterSchema, req.body);
    const result = await registerTrustedDevice({ userId: identity.sub, ...input });
    res.status(201).json({ token: result.token, expiresAt: result.expiresAt.toISOString() });
  }),
);

authRouter.post(
  '/trusted-devices/verify',
  asyncHandler(async (req, res) => {
    const { token } = validateSchema(trustedDeviceVerifySchema, req.body);
    const userId = await verifyTrustedDeviceToken(token);

    const userResult = await pool.query<{
      id: string; email: string; display_name: string; role: string; tier: string;
      mfa_enabled: boolean; created_at: string; email_verified_at: string | null; is_active: boolean;
    }>(
      `SELECT id, email, display_name, role, COALESCE(tier,'free') AS tier,
              COALESCE(mfa_enabled, FALSE) AS mfa_enabled, created_at, email_verified_at, is_active
       FROM app_users WHERE id = $1 LIMIT 1`,
      [userId],
    );

    const u = userResult.rows[0];
    if (!u || !u.is_active) {
      throw new UnauthorizedError('Account not found or inactive', 'USER_INACTIVE');
    }

    const safeUser = {
      id: u.id, email: u.email, displayName: u.display_name,
      role: u.role as never, tier: (u.tier ?? 'free') as never,
      mfaEnabled: u.mfa_enabled, createdAt: u.created_at,
      emailVerifiedAt: u.email_verified_at,
    };

    const session = await issueAuthSession(safeUser, getAuthRequestContext(req));
    respondWithAuthSession(req, res, session, 200);
  }),
);

authRouter.get(
  '/trusted-devices',
  asyncHandler(async (req, res) => {
    const authHeader = req.header('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) { throw new UnauthorizedError('Authentication required'); }
    const identity = await resolveAuthenticatedUser(token);
    const devices = await listTrustedDevices(identity.sub);
    res.status(200).json({ devices });
  }),
);

authRouter.delete(
  '/trusted-devices/:id',
  asyncHandler(async (req, res) => {
    const authHeader = req.header('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) { throw new UnauthorizedError('Authentication required'); }
    const identity = await resolveAuthenticatedUser(token);
    await revokeTrustedDevice(identity.sub, req.params.id!);
    res.status(204).send();
  }),
);
