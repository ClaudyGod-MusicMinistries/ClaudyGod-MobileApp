import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  createDonationIntentSchema,
  createPrivacyDeleteRequestSchema,
  createPrivacyExportRequestSchema,
  createRatingSchema,
  createSupportRequestSchema,
  liveSubscriptionSchema,
  removeLibraryItemSchema,
  saveLibraryItemSchema,
  trackPlayEventSchema,
  updateMePreferencesSchema,
  updateMeProfileSchema,
} from './me.schema';
import {
  createMeDonationIntent,
  createMePrivacyDeleteRequest,
  createMePrivacyExportRequest,
  createMeRating,
  createMeSupportRequest,
  getMeBootstrap,
  getMeLibrary,
  getMeMetrics,
  getMePreferences,
  getMePrivacyOverview,
  getMeProfile,
  recordMePlayEvent,
  removeMeLibraryItem,
  resetMeRecommendationSignals,
  saveMeLibraryItem,
  updateMePreferences,
  updateMeProfile,
  upsertMeLiveSubscription,
} from './me.service';

export const meRouter = Router();

meRouter.use(authenticate);

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return req.user;
}

meRouter.get(
  '/bootstrap',
  asyncHandler(async (req, res) => {
    const result = await getMeBootstrap(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const result = await getMeProfile(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(updateMeProfileSchema, req.body);
    const result = await updateMeProfile(requireUser(req), payload);
    res.status(200).json(result);
  }),
);

meRouter.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const result = await getMeMetrics(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const result = await getMePreferences(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.patch(
  '/preferences',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(updateMePreferencesSchema, req.body);
    const result = await updateMePreferences(requireUser(req), payload);
    res.status(200).json(result);
  }),
);

meRouter.get(
  '/library',
  asyncHandler(async (req, res) => {
    const result = await getMeLibrary(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.post(
  '/library/items',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(saveLibraryItemSchema, req.body);
    const result = await saveMeLibraryItem(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.delete(
  '/library/items',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(removeLibraryItemSchema, req.body);
    const result = await removeMeLibraryItem(requireUser(req), payload);
    res.status(200).json(result);
  }),
);

meRouter.get(
  '/privacy',
  asyncHandler(async (req, res) => {
    const result = await getMePrivacyOverview(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.post(
  '/privacy/export-request',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createPrivacyExportRequestSchema, req.body);
    const result = await createMePrivacyExportRequest(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.post(
  '/privacy/reset-history',
  asyncHandler(async (req, res) => {
    const result = await resetMeRecommendationSignals(requireUser(req));
    res.status(200).json(result);
  }),
);

meRouter.post(
  '/privacy/delete-request',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createPrivacyDeleteRequestSchema, req.body);
    const result = await createMePrivacyDeleteRequest(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.post(
  '/engagement/play-events',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(trackPlayEventSchema, req.body);
    const result = await recordMePlayEvent(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.post(
  '/engagement/live-subscriptions',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(liveSubscriptionSchema, req.body);
    const result = await upsertMeLiveSubscription(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.post(
  '/support-requests',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createSupportRequestSchema, req.body);
    const result = await createMeSupportRequest(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.post(
  '/ratings',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createRatingSchema, req.body);
    const result = await createMeRating(requireUser(req), payload);
    res.status(201).json(result);
  }),
);

meRouter.post(
  '/donation-intents',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(createDonationIntentSchema, req.body);
    const result = await createMeDonationIntent(requireUser(req), payload);
    res.status(201).json(result);
  }),
);
