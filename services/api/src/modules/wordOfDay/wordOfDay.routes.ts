import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { hasMinRole } from '../../middleware/rbac';
import {
  createWordOfDayEntry,
  deleteWordOfDayEntry,
  getAdminWordOfDayDashboard,
  getMobileWordOfDay,
  updateWordOfDayEntryById,
  upsertWordOfDayEntry,
} from './wordOfDay.service';
import { upsertWordOfDaySchema, wordOfDayIdParamsSchema, wordOfDayListQuerySchema } from './wordOfDay.schema';

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
    if (!req.user || !hasMinRole(req.user.role, 'MODERATOR')) {
      throw new ForbiddenError('Moderator role or higher required', 'MODERATOR_REQUIRED');
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
    if (!req.user || !hasMinRole(req.user.role, 'MODERATOR')) {
      throw new ForbiddenError('Moderator role or higher required', 'MODERATOR_REQUIRED');
    }

    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await upsertWordOfDayEntry({
      actor: req.user,
      input: payload,
    });
    res.status(200).json(result);
  }),
);

adminWordOfDayRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || !hasMinRole(req.user.role, 'MODERATOR')) {
      throw new ForbiddenError('Moderator role or higher required', 'MODERATOR_REQUIRED');
    }

    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await createWordOfDayEntry({ actor: req.user, input: payload });
    res.status(201).json(result.entry);
  }),
);

adminWordOfDayRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || !hasMinRole(req.user.role, 'MODERATOR')) {
      throw new ForbiddenError('Moderator role or higher required', 'MODERATOR_REQUIRED');
    }

    const params = validateSchema(wordOfDayIdParamsSchema, req.params);
    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await updateWordOfDayEntryById({ actor: req.user, id: params.id, input: payload });
    res.status(200).json(result.entry);
  }),
);

adminWordOfDayRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || !hasMinRole(req.user.role, 'MODERATOR')) {
      throw new ForbiddenError('Moderator role or higher required', 'MODERATOR_REQUIRED');
    }

    const params = validateSchema(wordOfDayIdParamsSchema, req.params);
    await deleteWordOfDayEntry(params.id);
    res.status(204).send();
  }),
);
