import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { youtubeListQuerySchema, youtubeSyncSchema } from './youtube.schema';
import { fetchYouTubeVideos, syncYouTubeVideosToContent } from './youtube.service';

export const youtubeRouter = Router();

youtubeRouter.get(
  '/videos',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
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
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const payload = validateSchema(youtubeSyncSchema, req.body);
    const result = await syncYouTubeVideosToContent({
      actorUserId: req.user.sub,
      visibility: payload.visibility ?? 'draft',
      channelId: payload.channelId,
      maxResults: payload.maxResults,
    });

    res.status(200).json(result);
  }),
);
