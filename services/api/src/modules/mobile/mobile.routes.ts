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
import { buildMobileFeed, getInstallationRecommendations, getMobileSectionDetail } from './mobile.service';
import { authenticateInstallation } from '../../middleware/authenticateInstallation';
import { clearInstallationHistory, getInstallationHistory, getInstallationPreferences, recordInstallationActivation, registerInstallation, resetInstallationRecommendations, updateInstallationPreferences } from './installation.service';

export const mobileRouter = Router();

const guestSupportRequestSchema = z.object({
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  category: z.enum(['playback', 'account', 'content', 'billing', 'technical']),
  subject: z.string().trim().min(4).max(120), message: z.string().trim().min(12).max(4000),
}).strict();
const guestSupportStatusSchema = z.object({
  tickets: z.array(z.object({ id: z.string().uuid(), trackingToken: z.string().min(32).max(256) }).strict()).max(10),
}).strict();
const guestRatingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  channel: z.literal('mobile').default('mobile'),
  comment: z.string().trim().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();
const installationRegistrationSchema = z.object({
  platform: z.enum(['ios', 'android', 'web', 'unknown']),
  appVersion: z.string().trim().min(1).max(40).optional(),
}).strict();
const installationEventSchema = z.object({
  event: z.enum(['onboarding_completed', 'playback_milestone']),
  idempotencyKey: z.string().trim().min(8).max(120),
  contentId: z.string().trim().min(1).max(200).optional(),
  contentType: z.string().trim().min(1).max(40).optional(),
  title: z.string().trim().min(1).max(240).optional(),
  subtitle: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  duration: z.string().trim().max(40).optional(),
  imageUrl: z.string().trim().url().max(2000).optional(),
  mediaUrl: z.string().trim().url().max(2000).optional(),
  source: z.string().trim().min(1).max(80).optional(),
}).strict();
const installationPreferencesSchema = z.object({ personalizationEnabled: z.boolean() }).strict();
const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
}).strict();
const installationHistoryQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(100) }).strict();
const guestReferralSchema = z.object({}).strict();
const guestReferralAttributionSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^CG[A-F0-9]{8}$/),
}).strict();

mobileRouter.post('/installations/register', asyncHandler(async (req, res) => {
  const payload = validateSchema(installationRegistrationSchema, req.body);
  const result = await registerInstallation(payload);
  res.cookie('cg_installation', result.credential, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 180 * 24 * 60 * 60 * 1000,
    path: '/v1/mobile',
  });
  res.status(201).json(result);
}));

mobileRouter.get('/installations/session', authenticateInstallation, asyncHandler(async (req, res) => {
  res.status(200).json({ installation: req.installation });
}));

mobileRouter.post('/installations/events', authenticateInstallation, asyncHandler(async (req, res) => {
  const payload = validateSchema(installationEventSchema, req.body);
  res.status(200).json(await recordInstallationActivation(req.installation!.id, payload));
}));

mobileRouter.get('/installations/preferences', authenticateInstallation, asyncHandler(async (req, res) => {
  res.status(200).json(await getInstallationPreferences(req.installation!.id));
}));

mobileRouter.patch('/installations/preferences', authenticateInstallation, asyncHandler(async (req, res) => {
  const payload = validateSchema(installationPreferencesSchema, req.body);
  res.status(200).json(await updateInstallationPreferences(req.installation!.id, payload));
}));

mobileRouter.get('/recommendations', authenticateInstallation, asyncHandler(async (req, res) => {
  const { limit } = validateSchema(recommendationQuerySchema, req.query);
  res.status(200).json(await getInstallationRecommendations(req.installation!.id, limit));
}));

mobileRouter.post('/recommendations/reset', authenticateInstallation, asyncHandler(async (req, res) => {
  res.status(200).json(await resetInstallationRecommendations(req.installation!.id));
}));

mobileRouter.get('/installations/history', authenticateInstallation, asyncHandler(async (req, res) => {
  const { limit } = validateSchema(installationHistoryQuerySchema, req.query);
  res.status(200).json(await getInstallationHistory(req.installation!.id, limit));
}));

mobileRouter.delete('/installations/history', authenticateInstallation, asyncHandler(async (req, res) => {
  res.status(200).json(await clearInstallationHistory(req.installation!.id));
}));

mobileRouter.post('/support-requests', authenticateInstallation, guestSupportLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestSupportRequestSchema, req.body);
  res.status(201).json(await createGuestSupportRequest({ ...payload, deviceId: req.installation!.id }));
}));

mobileRouter.post('/support-requests/status', authenticateInstallation, guestSupportLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestSupportStatusSchema, req.body);
  res.status(200).json(await getGuestSupportRequestStatuses({ ...payload, deviceId: req.installation!.id }));
}));

mobileRouter.post('/ratings', authenticateInstallation, guestFeedbackLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestRatingSchema, req.body);
  res.status(201).json(await createGuestRating({ ...payload, deviceId: req.installation!.id }));
}));

mobileRouter.post('/referrals/profile', authenticateInstallation, referralLimiter, asyncHandler(async (req, res) => {
  validateSchema(guestReferralSchema, req.body);
  res.status(200).json(await getOrCreateGuestReferral(req.installation!.id));
}));

mobileRouter.post('/referrals/share', authenticateInstallation, referralLimiter, asyncHandler(async (req, res) => {
  validateSchema(guestReferralSchema, req.body);
  res.status(200).json(await recordGuestReferralShare(req.installation!.id));
}));

mobileRouter.post('/referrals/attribute', authenticateInstallation, referralLimiter, asyncHandler(async (req, res) => {
  const payload = validateSchema(guestReferralAttributionSchema, req.body);
  res.status(200).json(await attributeGuestReferral({ deviceId: req.installation!.id, code: payload.code }));
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
