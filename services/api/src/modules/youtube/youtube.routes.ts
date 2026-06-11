import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { youtubeImportSchema, youtubeListQuerySchema, youtubeSyncSchema } from './youtube.schema';
import { fetchYouTubeVideos, importYouTubeSelectionsToContent, syncYouTubeVideosToContent } from './youtube.service';

export const youtubeRouter = Router();

youtubeRouter.get(
  '/videos',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    }

    const query = validateSchema(youtubeListQuerySchema, req.query);
    const result = await fetchYouTubeVideos(query);
    res.status(200).json(result);
  }),
);

youtubeRouter.post(
  '/sync',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    }

    const payload = validateSchema(youtubeSyncSchema, req.body);
    const result = await syncYouTubeVideosToContent({
      actorUserId: req.user.sub,
      visibility: payload.visibility ?? 'draft',
      channelId: payload.channelId,
      maxResults: payload.maxResults,
      appSections: payload.appSections,
    });

    res.status(200).json(result);
  }),
);

youtubeRouter.post(
  '/import',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    }

    const payload = validateSchema(youtubeImportSchema, req.body);
    const result = await importYouTubeSelectionsToContent({
      actorUserId: req.user.sub,
      selections: payload.selections,
    });

    res.status(200).json(result);
  }),
);
