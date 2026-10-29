import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { requirePrivilegedMfa } from '../../middleware/requirePrivilegedMfa';
import { requireCapability } from '../../middleware/rbac';
import { youtubeImportSchema, youtubeListQuerySchema, youtubeSyncSchema } from './youtube.schema';
import {
  fetchYouTubeVideos,
  getYouTubeSyncStatus,
  getYouTubeThumbnailBuffer,
  importYouTubeSelectionsToContent,
  listYouTubeImportQueue,
  syncYouTubeVideosToContent,
} from './youtube.service';

export const youtubeRouter = Router();

// Public thumbnail proxy — allows browsers on networks that block or connection-reset
// i.ytimg.com (net::ERR_CONNECTION_RESET) to load thumbnails reliably through the ClaudyGod API.
youtubeRouter.get(
  '/thumbnail/:videoId',
  asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      res.status(400).end();
      return;
    }
    const preferredSrc = typeof req.query.src === 'string' && req.query.src.startsWith('https://')
      ? req.query.src
      : undefined;
    const result = await getYouTubeThumbnailBuffer(videoId, preferredSrc);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.status(200).send(result.buffer);
  }),
);

youtubeRouter.use(authenticate, requirePrivilegedMfa, requireCapability('youtube.manage'));

youtubeRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const result = await getYouTubeSyncStatus();
    res.status(200).json(result);
  }),
);

youtubeRouter.get(
  '/imports',
  asyncHandler(async (_req, res) => {
    const result = await listYouTubeImportQueue();
    res.status(200).json(result);
  }),
);

youtubeRouter.get(
  '/videos',
  asyncHandler(async (req, res) => {
    const query = validateSchema(youtubeListQuerySchema, req.query);
    const result = await fetchYouTubeVideos(query);
    res.status(200).json(result);
  }),
);

youtubeRouter.post(
  '/sync',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(youtubeSyncSchema, req.body);
    const result = await syncYouTubeVideosToContent({
      actorUserId: req.user!.sub,
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
  asyncHandler(async (req, res) => {
    const payload = validateSchema(youtubeImportSchema, req.body);
    const result = await importYouTubeSelectionsToContent({
      actorUserId: req.user!.sub,
      selections: payload.selections,
    });

    res.status(200).json(result);
  }),
);
