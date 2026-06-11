import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validateSchema } from '../../lib/validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { UnauthorizedError } from '../../lib/errors.js';
import {
  registerBiometric,
  createBiometricChallenge,
  verifyBiometricSignature,
  revokeBiometric,
} from './biometric.service.js';

export const biometricRouter = Router();

const registerSchema = z.object({
  deviceId: z.string().uuid(),
  publicKey: z.string().trim().min(20),
  algorithm: z.enum(['EC', 'RSA', 'ECDSA', 'RSASSA-PKCS1-v1_5']),
  deviceLabel: z.string().trim().max(120).optional(),
});

const challengeSchema = z.object({
  userId: z.string().uuid(),
  deviceId: z.string().uuid(),
});

const verifySchema = z.object({
  challengeId: z.string().trim().min(16),
  signature: z.string().trim().min(10),
});

const revokeSchema = z.object({
  deviceId: z.string().uuid(),
});

biometricRouter.post(
  '/register',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const { deviceId, publicKey, algorithm, deviceLabel } = validateSchema(registerSchema, req.body);
    const result = await registerBiometric(req.user.sub, deviceId, publicKey, algorithm, deviceLabel);
    res.status(201).json(result);
  }),
);

biometricRouter.post(
  '/challenge',
  asyncHandler(async (req, res) => {
    const { userId, deviceId } = validateSchema(challengeSchema, req.body);
    const result = await createBiometricChallenge(userId, deviceId);
    res.status(200).json(result);
  }),
);

biometricRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { challengeId, signature } = validateSchema(verifySchema, req.body);
    const result = await verifyBiometricSignature(challengeId, signature);
    res.status(200).json(result);
  }),
);

biometricRouter.delete(
  '/revoke',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const { deviceId } = validateSchema(revokeSchema, req.body);
    await revokeBiometric(req.user.sub, deviceId);
    res.status(200).json({ message: 'Biometric credential revoked' });
  }),
);
