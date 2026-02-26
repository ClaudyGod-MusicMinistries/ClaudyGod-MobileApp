import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { getAdminWordOfDayDashboard, getMobileWordOfDay, upsertWordOfDayEntry } from './wordOfDay.service';
import { upsertWordOfDaySchema, wordOfDayListQuerySchema } from './wordOfDay.schema';

export const mobileWordOfDayRouter = Router();
export const adminWordOfDayRouter = Router();

mobileWordOfDayRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await getMobileWordOfDay();
    res.status(200).json(result);
  }),
);

adminWordOfDayRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const query = validateSchema(wordOfDayListQuerySchema, req.query);
    const result = await getAdminWordOfDayDashboard({ limit: query.limit });
    res.status(200).json(result);
  }),
);

adminWordOfDayRouter.put(
  '/current',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await upsertWordOfDayEntry({
      actor: req.user,
      input: payload,
    });
    res.status(200).json(result);
  }),
);
