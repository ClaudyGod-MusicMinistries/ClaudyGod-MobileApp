import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validateSchema } from '../../lib/validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { UnauthorizedError } from '../../lib/errors.js';
import {
  setupMfa,
  verifyMfaSetup,
  disableMfa,
  regenerateBackupCodes,
} from './mfa.service.js';
import { z } from 'zod';

export const mfaRouter = Router();

mfaRouter.use(authenticate);

const totpCodeSchema = z.object({ code: z.string().trim().length(6).regex(/^\d{6}$/).or(z.string().trim().length(8).toUpperCase()) });
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
    const { code } = validateSchema(totpCodeSchema, req.body);
    const result = await verifyMfaSetup(req.user, code);
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
    const { code } = validateSchema(totpCodeSchema, req.body);
    const result = await regenerateBackupCodes(req.user, code);
    res.status(200).json(result);
  }),
);
