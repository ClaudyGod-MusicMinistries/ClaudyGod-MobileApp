import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { hasMinRole } from '../../middleware/rbac';
import { createAdCampaignSchema, listAdCampaignsQuerySchema, updateAdCampaignSchema } from './ads.schema';
import { createAdCampaign, listAdCampaigns, updateAdCampaign } from './ads.service';

export const adminAdsRouter = Router();

adminAdsRouter.use(authenticate);

adminAdsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user || !hasMinRole(req.user.role, 'ADMIN')) {
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }

    const query = validateSchema(listAdCampaignsQuerySchema, req.query);
    const items = await listAdCampaigns(query);
    res.status(200).json({
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      hasMore: false,
    });
  }),
);

adminAdsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user || !hasMinRole(req.user.role, 'ADMIN')) {
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }

    const input = validateSchema(createAdCampaignSchema, req.body);
    const item = await createAdCampaign(req.user, input);
    res.status(201).json(item);
  }),
);

adminAdsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!req.user || !hasMinRole(req.user.role, 'ADMIN')) {
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }

    const input = validateSchema(updateAdCampaignSchema, req.body);
    const item = await updateAdCampaign(req.user, req.params.id, input);
    res.status(200).json(item);
  }),
);
