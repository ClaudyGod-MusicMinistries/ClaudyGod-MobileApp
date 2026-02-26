import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { requireMobileApiKey } from '../../middleware/requireMobileApiKey';
import { listContentQuerySchema } from '../content/content.schema';
import { listPublicContent } from '../content/content.service';
import { signedUploadRequestSchema, uploadPoliciesResponse } from '../uploads/uploads.schema';
import { requestSignedUploadUrl } from '../uploads/uploads.service';
import { youtubeListQuerySchema } from '../youtube/youtube.schema';
import { fetchYouTubeVideos } from '../youtube/youtube.service';

export const mobileRouter = Router();

mobileRouter.get(
  '/content',
  asyncHandler(async (req, res) => {
    const parsed = validateSchema(listContentQuerySchema, req.query);
    const query = {
      page: parsed.page ?? 1,
      limit: parsed.limit ?? 20,
      type: parsed.type,
      status: parsed.status,
      visibility: parsed.visibility,
      search: parsed.search,
      updatedAfter: parsed.updatedAfter,
    };
    const data = await listPublicContent(query);
    res.status(200).json(data);
  }),
);

mobileRouter.get(
  '/youtube/videos',
  asyncHandler(async (req, res) => {
    const query = validateSchema(youtubeListQuerySchema, req.query);
    const data = await fetchYouTubeVideos(query);
    res.status(200).json(data);
  }),
);

mobileRouter.post(
  '/uploads/signed-url',
  requireMobileApiKey,
  asyncHandler(async (req, res) => {
    const parsed = validateSchema(signedUploadRequestSchema, req.body);
    const payload = {
      ...parsed,
      folder: parsed.folder ?? 'mobile-content',
    };
    const result = await requestSignedUploadUrl({
      ...payload,
      channel: 'mobile',
    });

    res.status(201).json(result);
  }),
);

mobileRouter.get(
  '/uploads/policies',
  requireMobileApiKey,
  asyncHandler(async (_req, res) => {
    res.status(200).json(uploadPoliciesResponse);
  }),
);
