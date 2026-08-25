import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { listContentQuerySchema } from '../content/content.schema';
import { listPublicContent } from '../content/content.service';
import { createDonationIntentSchema } from '../me/me.schema';
import { createPublicDonationIntent } from '../me/me.service';
import { attributeGuestReferral, createGuestRating, createGuestSupportRequest, getGuestSupportRequestStatuses, getOrCreateGuestReferral, recordGuestReferralShare } from '../me/me.service';
import { guestFeedbackLimiter, guestSupportLimiter, referralLimiter } from '../../middleware/rateLimiter';
import { youtubeListQuerySchema } from '../youtube/youtube.schema';
import { fetchYouTubeVideos } from '../youtube/youtube.service';
import { buildMobileFeed, getMobileSectionDetail } from './mobile.service';

export const mobileRouter = Router();

const guestSupportRequestSchema = z.object({
  deviceId: z.string().uuid(), contactEmail: z.string().trim().toLowerCase().email().max(254),
  category: z.enum(['playback', 'account', 'content', 'billing', 'technical']),
  subject: z.string().trim().min(4).max(120), message: z.string().trim().min(12).max(4000),
}).strict();
const guestSupportStatusSchema = z.object({
  deviceId: z.string().uuid(),
  tickets: z.array(z.object({ id: z.string().uuid(), trackingToken: z.string().min(32).max(256) }).strict()).max(10),
}).strict();
const guestRatingSchema = z.object({
  deviceId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  channel: z.literal('mobile').default('mobile'),
  comment: z.string().trim().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();
const guestReferralSchema = z.object({ deviceId: z.string().uuid() }).strict();
const guestReferralAttributionSchema = z.object({
  deviceId: z.string().uuid(),
  code: z.string().trim().toUpperCase().regex(/^CG[A-F0-9]{8}$/),
}).strict();

mobileRouter.post('/support-requests', guestSupportLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestSupportRequestSchema, req.body);
  res.status(201).json(await createGuestSupportRequest(payload));
}));

mobileRouter.post('/support-requests/status', guestSupportLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestSupportStatusSchema, req.body);
  res.status(200).json(await getGuestSupportRequestStatuses(payload));
}));

mobileRouter.post('/ratings', guestFeedbackLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestRatingSchema, req.body);
  res.status(201).json(await createGuestRating(payload));
}));

mobileRouter.post('/referrals/profile', referralLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestReferralSchema, req.body);
  res.status(200).json(await getOrCreateGuestReferral(payload.deviceId));
}));

mobileRouter.post('/referrals/share', referralLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestReferralSchema, req.body);
  res.status(200).json(await recordGuestReferralShare(payload.deviceId));
}));

mobileRouter.post('/referrals/attribute', referralLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestReferralAttributionSchema, req.body);
  res.status(200).json(await attributeGuestReferral(payload));
}));

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
      section: parsed.section,
      search: parsed.search,
      updatedAfter: parsed.updatedAfter,
    };
    const data = await listPublicContent(query);
    res.status(200).json(data);
  }),
);

const sectionDetailQuerySchema = z.object({
  screen: z.enum(['home', 'videos', 'player', 'library']).default('home'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

mobileRouter.get(
  '/sections/:sectionId',
  asyncHandler(async (req, res) => {
    const { screen, page, limit } = validateSchema(sectionDetailQuerySchema, req.query);
    const data = await getMobileSectionDetail({ screen, sectionId: req.params.sectionId, page, limit });
    if (!data) {
      throw new NotFoundError('Section not found', 'SECTION_NOT_FOUND');
    }
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
  '/donation-intents',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createDonationIntentSchema, req.body);
    const result = await createPublicDonationIntent(payload);
    res.status(201).json(result);
  }),
);
