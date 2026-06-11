import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validateSchema } from '../../lib/validation.js';
import { signInWithGoogle, signInWithApple } from './oauth.service.js';

export const oauthRouter = Router();

const googleSchema = z.object({
  idToken: z.string().trim().min(10),
  displayName: z.string().trim().min(1).max(120).optional(),
});

const appleSchema = z.object({
  idToken: z.string().trim().min(10),
  displayName: z.string().trim().min(1).max(120).optional(),
});

oauthRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { idToken, displayName } = validateSchema(googleSchema, req.body);
    const result = await signInWithGoogle(idToken, displayName);
    res.status(200).json(result);
  }),
);

oauthRouter.post(
  '/apple',
  asyncHandler(async (req, res) => {
    const { idToken, displayName } = validateSchema(appleSchema, req.body);
    const result = await signInWithApple(idToken, displayName);
    res.status(200).json(result);
  }),
);
