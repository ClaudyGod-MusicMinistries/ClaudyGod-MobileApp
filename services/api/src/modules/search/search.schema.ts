import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: z.enum(['audio', 'video', 'live', 'playlist', 'announcement']).optional(),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((t) => t.trim()).filter(Boolean) : undefined)),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(1000).optional(),
});

export const searchClickSchema = z.object({
  searchEventId: z.string().uuid(),
  contentId: z.string().uuid(),
});

export const trendingSearchQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchClick = z.infer<typeof searchClickSchema>;
export type TrendingSearchQuery = z.infer<typeof trendingSearchQuerySchema>;
