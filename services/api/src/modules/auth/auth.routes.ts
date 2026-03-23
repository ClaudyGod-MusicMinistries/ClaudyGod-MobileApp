import { type Request, Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import {
  clearAuthSessionCookie,
  getAuthTokenFromRequest,
  respondWithAuthSession,
} from './authSessionCookie';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
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
import type { AuthResponse } from './auth.types';
import { resolveAuthenticatedUser } from './authIdentity.service';

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

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

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(registerSchema, req.body);
    const result = await registerUser(payload, req.ip);
    if (result.requiresEmailVerification || !result.accessToken || !result.user) {
      res.status(201).json(result);
      return;
    }

    respondWithAuthSession(req, res, result as AuthResponse, 201);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(loginSchema, req.body);
    const result = await loginUser(payload);
    respondWithAuthSession(req, res, result, 200);
  }),
);

authRouter.post(
  '/email/verify',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(verifyEmailSchema, req.body);
    const result = await verifyEmail(payload);
    respondWithAuthSession(req, res, result, 200);
  }),
);

authRouter.post(
  '/email/verify/request',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(resendVerificationEmailSchema, req.body);
    const result = await resendVerificationEmail(payload, req.ip);
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/password/forgot',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(forgotPasswordSchema, req.body);
    const result = await requestPasswordReset(payload, req.ip);
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/password/reset',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(resetPasswordSchema, req.body);
    const result = await resetPassword(payload);
    res.status(200).json(result);
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (_req, res) => {
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
        res.status(200).json({ authenticated: false, user: null });
        return;
      }

      res.status(200).json({ authenticated: true, user: session.user });
    } catch {
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
        res.status(200).json({ authenticated: false, user: null });
        return;
      }

      res.status(200).json({ authenticated: true, user: session.user });
    } catch {
      clearAuthSessionCookie(res);
      res.status(200).json({ authenticated: false, user: null });
    }
  }),
);
