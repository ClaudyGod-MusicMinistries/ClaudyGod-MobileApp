import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { createAdCampaignSchema, listAdCampaignsQuerySchema, updateAdCampaignSchema } from './ads.schema';
import { createAdCampaign, listAdCampaigns, updateAdCampaign } from './ads.service';

export const adminAdsRouter = Router();

adminAdsRouter.use(authenticate);

adminAdsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const query = validateSchema(listAdCampaignsQuerySchema, req.query);
    const items = await listAdCampaigns(query);
    res.status(200).json({ items });
  }),
);

adminAdsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const input = validateSchema(createAdCampaignSchema, req.body);
    const item = await createAdCampaign(req.user, input);
    res.status(201).json(item);
  }),
);

adminAdsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const input = validateSchema(updateAdCampaignSchema, req.body);
    const item = await updateAdCampaign(req.user, req.params.id, input);
    res.status(200).json(item);
  }),
);
