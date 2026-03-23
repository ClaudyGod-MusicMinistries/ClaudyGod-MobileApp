import { z } from 'zod';

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max).optional(),
  ) as unknown as z.ZodType<string | undefined>;

const optionalHttpUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'URL must start with http:// or https://')
    .optional(),
) as unknown as z.ZodType<string | undefined>;

const optionalDateTimeSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().datetime().optional(),
) as unknown as z.ZodType<string | undefined>;

const optionalStringArraySchema = (maxItems: number, maxItemLength: number) =>
  z.preprocess(
    (value) => {
      if (value == null || value === '') return undefined;
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return value;
    },
    z.array(z.string().trim().min(1).max(maxItemLength)).max(maxItems).optional(),
  ) as unknown as z.ZodType<string[] | undefined>;

export const liveSessionStatusSchema = z.enum(['scheduled', 'live', 'ended', 'cancelled']);
export const liveMessageKindSchema = z.enum(['comment', 'suggestion']);
export const liveMessageVisibilitySchema = z.enum(['visible', 'hidden']);
export const liveScopeSchema = z.enum(['all', 'live', 'upcoming', 'archive']);

export const liveSessionIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const createLiveSessionSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    description: z.string().trim().min(3).max(6000),
    channelId: optionalTrimmedString(120),
    coverImageUrl: optionalHttpUrlSchema,
    streamUrl: optionalHttpUrlSchema,
    playbackUrl: optionalHttpUrlSchema,
    scheduledFor: optionalDateTimeSchema,
    notifySubscribers: z.boolean().default(true),
    viewerCount: z.coerce.number().int().min(0).max(1000000).optional(),
    tags: optionalStringArraySchema(20, 40),
    appSections: optionalStringArraySchema(12, 80),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const updateLiveSessionSchema = z
  .object({
    title: z.string().trim().min(3).max(180).optional(),
    description: z.string().trim().min(3).max(6000).optional(),
    status: liveSessionStatusSchema.optional(),
    channelId: optionalTrimmedString(120),
    coverImageUrl: optionalHttpUrlSchema,
    streamUrl: optionalHttpUrlSchema,
    playbackUrl: optionalHttpUrlSchema,
    scheduledFor: optionalDateTimeSchema,
    notifySubscribers: z.boolean().optional(),
    viewerCount: z.coerce.number().int().min(0).max(1000000).optional(),
    tags: optionalStringArraySchema(20, 40),
    appSections: optionalStringArraySchema(12, 80),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one live session field is required',
  });

export const endLiveSessionSchema = z
  .object({
    playbackUrl: optionalHttpUrlSchema,
    viewerCount: z.coerce.number().int().min(0).max(1000000).optional(),
  })
  .strict();

export const listLiveSessionsQuerySchema = z
  .object({
    scope: liveScopeSchema.default('all'),
  })
  .strict();

export const createLiveMessageSchema = z
  .object({
    kind: liveMessageKindSchema.default('comment'),
    message: z.string().trim().min(2).max(1200),
  })
  .strict();
