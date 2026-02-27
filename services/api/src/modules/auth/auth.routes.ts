import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
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
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(registerSchema, req.body);
    const result = await registerUser(payload);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(loginSchema, req.body);
    const result = await loginUser(payload);
    res.status(200).json(result);
  }),
);

authRouter.post(
  '/email/verify',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(verifyEmailSchema, req.body);
    const result = await verifyEmail(payload);
    res.status(200).json(result);
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

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const user = await getUserById(req.user.sub);
    res.status(200).json({ user });
  }),
);
