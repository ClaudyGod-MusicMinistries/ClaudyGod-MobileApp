import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { requireMobileApiKey } from '../../middleware/requireMobileApiKey';
import { searchClickSchema, searchQuerySchema } from './search.schema';
import { recordSearchClick, searchContent } from './search.service';

export const searchRouter = Router();

searchRouter.use(requireMobileApiKey);

searchRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const query = validateSchema(searchQuerySchema, req.query);
    const userId = req.user?.sub;
    const result = await searchContent(query, userId);
    res.status(200).json(result);
  }),
);

searchRouter.post(
  '/click',
  authenticate,
  asyncHandler(async (req, res) => {
    const payload = validateSchema(searchClickSchema, req.body);
    await recordSearchClick(payload.searchEventId, payload.contentId);
    res.status(204).send();
  }),
);
