import { z } from 'zod';

const contentTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement']);
const contentFilterTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement', 'live', 'ad']);
const visibilitySchema = z.enum(['draft', 'published']);

export const createContentSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(2).max(5000),
  type: contentTypeSchema,
  url: z.string().url().optional(),
  visibility: visibilitySchema.default('draft'),
});

export const listContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: contentFilterTypeSchema.optional(),
  status: visibilitySchema.optional(),
  visibility: visibilitySchema.optional(),
});

export const contentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateVisibilitySchema = z.object({
  visibility: visibilitySchema,
});
