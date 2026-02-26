import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { mostPlayedQuerySchema } from './analytics.schema';
import { listMostPlayedContent } from './analytics.service';

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
