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
  importYouTubeSelectionsToContent,
  listYouTubeImportQueue,
  syncYouTubeVideosToContent,
} from './youtube.service';

export const youtubeRouter = Router();
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
