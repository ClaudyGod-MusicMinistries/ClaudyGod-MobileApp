import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: z.enum(['audio', 'video', 'playlist', 'announcement']).optional(),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((t) => t.trim()).filter(Boolean) : undefined)),
  after: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const searchClickSchema = z.object({
  searchEventId: z.string().uuid(),
  contentId: z.string().uuid(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchClick = z.infer<typeof searchClickSchema>;
