import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
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
      throw new NotFoundError('Mobile screen layout not found', 'SCREEN_LAYOUT_NOT_FOUND');
    }

    const result = await getMobileScreenLayout(screen);
    res.status(200).json(result);
  }),
);

adminAppConfigRouter.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const result = await getMobileAppConfig();
    res.status(200).json(result);
  }),
);

adminAppConfigRouter.put(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = validateSchema(updateMobileAppConfigSchema, req.body);
    const result = await updateMobileAppConfig({
      config: payload.config,
      updatedByUserId: req.user!.sub,
    });
    res.status(200).json(result);
  }),
);
