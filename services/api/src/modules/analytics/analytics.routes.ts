import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { adminContentInsightsQuerySchema, mostPlayedQuerySchema } from './analytics.schema';
import {
  getAdminCommunityInsights,
  getAdminContentInsights,
  getAdminEngagementOverview,
  listMostPlayedContent,
} from './analytics.service';

export const analyticsRouter = Router();

analyticsRouter.get(
  '/most-played',
  asyncHandler(async (req, res) => {
    const query = validateSchema(mostPlayedQuerySchema, req.query);
    const result = await listMostPlayedContent({
      limit: query.limit,
      windowDays: query.windowDays,
    });
    res.status(200).json(result);
  }),
);

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.use(authenticate);

adminAnalyticsRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }
    const result = await getAdminEngagementOverview();
    res.status(200).json(result);
  }),
);

adminAnalyticsRouter.get(
  '/content-insights',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }
    const query = validateSchema(adminContentInsightsQuerySchema, req.query);
    const result = await getAdminContentInsights(query.limit);
    res.status(200).json(result);
  }),
);

adminAnalyticsRouter.get(
  '/community',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }
    const result = await getAdminCommunityInsights();
    res.status(200).json(result);
  }),
);
