import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { UnauthorizedError } from '../../lib/errors';
import { getRefreshTokenFromRequest } from './authSessionCookie';
import { markRefreshSessionMfaVerified } from './authSession.service';
import {
  setupMfa,
  verifyMfaSetup,
  disableMfa,
  regenerateBackupCodes,
  requestMfaActionCode,
} from './mfa.service';
import { z } from 'zod';

export const mfaRouter = Router();

mfaRouter.use(authenticate);

const mfaCodeSchema = z.object({ code: z.string().trim().length(6).regex(/^\d{6}$/).or(z.string().trim().length(8).toUpperCase()) });
const disableMfaSchema = z.object({ code: z.string().trim().min(6).max(8) });

mfaRouter.post(
  '/setup',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const result = await setupMfa(req.user);
    res.status(200).json(result);
  }),
);

mfaRouter.post(
  '/verify-setup',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const { code } = validateSchema(mfaCodeSchema, req.body);
    const result = await verifyMfaSetup(req.user, code);
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      await markRefreshSessionMfaVerified(refreshToken, req.user.sub);
    }
    res.status(200).json(result);
  }),
);

mfaRouter.post(
  '/disable',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const { code } = validateSchema(disableMfaSchema, req.body);
    await disableMfa(req.user, code);
    res.status(200).json({ message: 'MFA disabled successfully' });
  }),
);

mfaRouter.post(
  '/backup-codes/regenerate',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const { code } = validateSchema(mfaCodeSchema, req.body);
    const result = await regenerateBackupCodes(req.user, code);
    res.status(200).json(result);
  }),
);

mfaRouter.post(
  '/code/request',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const result = await requestMfaActionCode(req.user);
    res.status(202).json(result);
  }),
);
