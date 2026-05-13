import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { updateMobileAppConfigSchema } from './appConfig.schema';
import {
  getMobileAppConfig,
  getMobileScreenLayout,
  getMobileScreensManifest,
  type MobileScreenKey,
  updateMobileAppConfig,
} from './appConfig.service';

export const mobileAppConfigRouter = Router();
export const adminAppConfigRouter = Router();

mobileAppConfigRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const result = await getMobileAppConfig();
    res.status(200).json(result);
  }),
);

mobileAppConfigRouter.get(
  '/screens',
  asyncHandler(async (_req, res) => {
    const result = await getMobileScreensManifest();
    res.status(200).json(result);
  }),
);

mobileAppConfigRouter.get(
  '/screens/:screen',
  asyncHandler(async (req, res) => {
    const screen = String(req.params.screen || '').trim() as MobileScreenKey;
    const allowed: MobileScreenKey[] = ['landing', 'home', 'videos', 'player', 'live', 'library', 'search', 'settings'];
    if (!allowed.includes(screen)) {
      throw new HttpError(404, 'Mobile screen layout not found');
    }

    const result = await getMobileScreenLayout(screen);
    res.status(200).json(result);
  }),
);

adminAppConfigRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }
    const result = await getMobileAppConfig();
    res.status(200).json(result);
  }),
);

adminAppConfigRouter.put(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const payload = validateSchema(updateMobileAppConfigSchema, req.body);
    const result = await updateMobileAppConfig({
      config: payload.config,
      updatedByUserId: req.user.sub,
    });
    res.status(200).json(result);
  }),
);
