import { z } from 'zod';

export const notificationCategorySchema = z.enum([
  'new_release',
  'ministry_update',
  'live_service',
  'daily_devotional',
  'announcement',
]);

export const targetAudienceSchema = z.enum([
  'all',
  'registered',
  'guests',
]);

export const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  category: notificationCategorySchema.default('new_release'),
  contentId: z.string().uuid().optional().nullable(),
  contentType: z.enum(['audio', 'video', 'playlist', 'announcement']).optional().nullable(),
  targetAudience: targetAudienceSchema.default('all'),
  imageUrl: z.string().url().optional().nullable(),
  deepLinkUrl: z.string().trim().max(200).optional().nullable(),
}).strict();

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: notificationCategorySchema.optional(),
  targetAudience: targetAudienceSchema.optional(),
}).strict();

export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
