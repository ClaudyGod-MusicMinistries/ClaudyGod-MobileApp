import { z } from 'zod';

const visibilitySchema = z.enum(['draft', 'published']);

export const youtubeListQuerySchema = z.object({
  channelId: z.string().trim().optional(),
  maxResults: z.coerce.number().int().min(1).max(50).optional(),
});

export const youtubeSyncSchema = z.object({
  channelId: z.string().trim().optional(),
  maxResults: z.coerce.number().int().min(1).max(50).optional(),
  visibility: visibilitySchema.default('draft'),
});
