import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { requireMobileApiKey } from '../../middleware/requireMobileApiKey';
import { searchClickSchema, searchQuerySchema, trendingSearchQuerySchema } from './search.schema';
import { getTrendingSearches, recordSearchClick, searchContent } from './search.service';

export const searchRouter = Router();

searchRouter.use(requireMobileApiKey);

// Public (no `authenticate`) — aggregate query popularity, not personal data,
// and useful to show guests before they've ever signed in or typed anything.
searchRouter.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const query = validateSchema(trendingSearchQuerySchema, req.query);
    const result = await getTrendingSearches(query.limit);
    res.status(200).json(result);
  }),
);

// Public (optionalAuthenticate, not authenticate) — search is core to the
// "brand-new anonymous user looks for content" journey and `searchContent`
// already supports an undefined `userId`. A signed-in caller still gets
// personalization: we still resolve a valid session for that signal, we just
// don't reject guests who have none (or an expired one).
searchRouter.get(
  '/',
  optionalAuthenticate,
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
