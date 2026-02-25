import { z } from 'zod';

const contentTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement']);
const contentFilterTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement', 'live', 'ad']);
const visibilitySchema = z.enum(['draft', 'published']);
const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'URL must start with http:// or https://');

const optionalHttpUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  httpUrlSchema.optional(),
) as unknown as z.ZodType<string | undefined>;

const optionalTrimmedSearchSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).max(120).optional(),
) as unknown as z.ZodType<string | undefined>;

const optionalUpdatedAfterSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().datetime().optional(),
) as unknown as z.ZodType<string | undefined>;

export const createContentSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().min(2).max(5000),
    type: contentTypeSchema,
    url: optionalHttpUrlSchema,
    visibility: visibilitySchema.default('draft'),
  })
  .strict()
  .superRefine((value, ctx) => {
    const requiresUrl = value.type === 'audio' || value.type === 'video';
    if (requiresUrl && !value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: `A media URL is required for ${value.type} content`,
      });
    }
  });

export const listContentQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: contentFilterTypeSchema.optional(),
    status: visibilitySchema.optional(),
    visibility: visibilitySchema.optional(),
    search: optionalTrimmedSearchSchema,
    updatedAfter: optionalUpdatedAfterSchema,
  })
  .strict();

export const contentIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const updateVisibilitySchema = z
  .object({
    visibility: visibilitySchema,
  })
  .strict();
