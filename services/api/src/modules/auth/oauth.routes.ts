import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validateSchema } from '../../lib/validation.js';
import { signInWithGoogle, signInWithApple } from './oauth.service.js';
import type { Request } from 'express';
import type { AuthSessionContext } from './authSession.service.js';

export const oauthRouter = Router();

const deviceIdentityShape = {
  deviceFingerprint: z.string().min(8).max(256).optional(),
  deviceName: z.string().max(120).optional(),
  platform: z.string().max(32).optional(),
};

const googleSchema = z.object({
  idToken: z.string().trim().min(10),
  displayName: z.string().trim().min(1).max(120).optional(),
  ...deviceIdentityShape,
});

const appleSchema = z.object({
  idToken: z.string().trim().min(10),
  displayName: z.string().trim().min(1).max(120).optional(),
  ...deviceIdentityShape,
});

function getOAuthRequestContext(
  req: Request,
  device: { deviceFingerprint?: string; deviceName?: string; platform?: string },
): AuthSessionContext {
  return {
    requestIp: req.ip,
    userAgent: req.header('user-agent') || undefined,
    ...device,
  };
}

oauthRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { idToken, displayName, deviceFingerprint, deviceName, platform } = validateSchema(googleSchema, req.body);
    const result = await signInWithGoogle(
      idToken,
      displayName,
      getOAuthRequestContext(req, { deviceFingerprint, deviceName, platform }),
    );
    res.status(200).json(result);
  }),
);

oauthRouter.post(
  '/apple',
  asyncHandler(async (req, res) => {
    const { idToken, displayName, deviceFingerprint, deviceName, platform } = validateSchema(appleSchema, req.body);
    const result = await signInWithApple(
      idToken,
      displayName,
      getOAuthRequestContext(req, { deviceFingerprint, deviceName, platform }),
    );
    res.status(200).json(result);
  }),
);
