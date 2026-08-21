import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { requireCapability } from '../../middleware/rbac';
import { requirePrivilegedMfa } from '../../middleware/requirePrivilegedMfa';
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
adminWordOfDayRouter.use(authenticate, requirePrivilegedMfa, requireCapability('word_of_day.manage'));

mobileWordOfDayRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await getMobileWordOfDay();
    res.status(200).json(result);
  }),
);

adminWordOfDayRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = validateSchema(wordOfDayListQuerySchema, req.query);
    const result = await getAdminWordOfDayDashboard({ limit: query.limit });
    res.status(200).json(result);
  }),
);

adminWordOfDayRouter.put(
  '/current',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await upsertWordOfDayEntry({
      actor: req.user!,
      input: payload,
    });
    res.status(200).json(result);
  }),
);

adminWordOfDayRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await createWordOfDayEntry({ actor: req.user!, input: payload });
    res.status(201).json(result.entry);
  }),
);

adminWordOfDayRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const params = validateSchema(wordOfDayIdParamsSchema, req.params);
    const payload = validateSchema(upsertWordOfDaySchema, req.body);
    const result = await updateWordOfDayEntryById({ actor: req.user!, id: params.id, input: payload });
    res.status(200).json(result.entry);
  }),
);

adminWordOfDayRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const params = validateSchema(wordOfDayIdParamsSchema, req.params);
    await deleteWordOfDayEntry(params.id);
    res.status(204).send();
  }),
);
