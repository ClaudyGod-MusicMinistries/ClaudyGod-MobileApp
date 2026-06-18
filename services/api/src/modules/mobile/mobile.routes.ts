import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { requireMobileApiKey } from '../../middleware/requireMobileApiKey';
import { listContentQuerySchema } from '../content/content.schema';
import { listPublicContent } from '../content/content.service';
import { createDonationIntentSchema } from '../me/me.schema';
import { createPublicDonationIntent, saveMeLibraryItem } from '../me/me.service';
import { signedUploadRequestSchema, uploadPoliciesResponse } from '../uploads/uploads.schema';
import { requestSignedUploadUrl } from '../uploads/uploads.service';
import { youtubeListQuerySchema } from '../youtube/youtube.schema';
import { fetchYouTubeVideos } from '../youtube/youtube.service';
import { buildMobileFeed } from './mobile.service';

const guestFavoriteItemSchema = z.object({
  id:       z.string().min(1),
  title:    z.string().min(1),
  subtitle: z.string().optional(),
  type:     z.enum(['audio', 'video', 'live', 'playlist']),
  imageUrl: z.string().optional(),
  mediaUrl: z.string().optional(),
  duration: z.string().optional(),
});

const guestSyncSchema = z.object({
  favorites:  z.array(guestFavoriteItemSchema).max(200).default([]),
  historyIds: z.array(z.string()).max(100).default([]),
});

export const mobileRouter = Router();

mobileRouter.get(
  '/feed',
  asyncHandler(async (_req, res) => {
    const data = await buildMobileFeed();
    res.status(200).json(data);
  }),
);

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
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Sign in required to upload files.' });
      return;
    }

    const parsed = validateSchema(signedUploadRequestSchema, req.body);
    const payload = {
      ...parsed,
      folder: parsed.folder ?? 'mobile-content',
    };
    const result = await requestSignedUploadUrl({
      ...payload,
      channel: 'mobile',
      requestedByUserId: req.user.sub,
    });

    res.status(201).json(result);
  }),
);

mobileRouter.post(
  '/donation-intents',
  requireMobileApiKey,
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createDonationIntentSchema, req.body);
    const result = await createPublicDonationIntent(payload);
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

// Syncs guest-session favourites to a newly signed-in account.
mobileRouter.post(
  '/guest-sync',
  requireMobileApiKey,
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Sign in required.' });
      return;
    }

    const { favorites } = validateSchema(guestSyncSchema, req.body);

    await Promise.allSettled(
      favorites.map((item) =>
        saveMeLibraryItem(req.user!, {
          bucket: 'liked',
          contentId: item.id,
          contentType: item.type as 'audio' | 'video' | 'live' | 'playlist',
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          mediaUrl: item.mediaUrl,
          duration: item.duration,
        }),
      ),
    );

    res.status(200).json({ synced: favorites.length });
  }),
);
