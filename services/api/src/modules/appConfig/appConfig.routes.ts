import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { updateMobileAppConfigSchema } from './appConfig.schema';
import { getMobileAppConfig, updateMobileAppConfig } from './appConfig.service';

export const mobileAppConfigRouter = Router();
export const adminAppConfigRouter = Router();

mobileAppConfigRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const result = await getMobileAppConfig();
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
