import { z } from 'zod';

const contentTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement']);
const contentFilterTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement', 'live', 'ad']);
const visibilitySchema = z.enum(['draft', 'published']);
const sourceKindSchema = z.enum(['upload', 'youtube', 'external']);
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

const sectionNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[\p{L}\p{N} .,'()&:_/-]+$/u, 'Section name contains unsupported characters');

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

const optionalSectionsSchema = z.preprocess(
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
  z.array(sectionNameSchema).max(12).optional(),
) as unknown as z.ZodType<string[] | undefined>;

const optionalJsonRecordSchema = z
  .record(z.unknown())
  .optional();

export const createContentSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().min(2).max(5000),
    type: contentTypeSchema,
    url: optionalHttpUrlSchema,
    thumbnailUrl: optionalHttpUrlSchema,
    channelName: z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().max(180).optional()) as unknown as z.ZodType<string | undefined>,
    duration: z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().max(32).optional()) as unknown as z.ZodType<string | undefined>,
    sourceKind: sourceKindSchema.default('upload'),
    externalSourceId: z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().max(200).optional()) as unknown as z.ZodType<string | undefined>,
    appSections: optionalSectionsSchema,
    tags: optionalStringArraySchema(20, 40),
    metadata: optionalJsonRecordSchema,
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

    if (requiresUrl && value.sourceKind === 'upload' && !value.thumbnailUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['thumbnailUrl'],
        message: 'A thumbnail URL is required for uploaded audio or video content',
      });
    }
  });

export const updateContentSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    description: z.string().trim().min(2).max(5000).optional(),
    type: contentTypeSchema.optional(),
    url: optionalHttpUrlSchema,
    thumbnailUrl: optionalHttpUrlSchema,
    channelName: z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().max(180).optional()) as unknown as z.ZodType<string | undefined>,
    duration: z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().max(32).optional()) as unknown as z.ZodType<string | undefined>,
    sourceKind: sourceKindSchema.optional(),
    externalSourceId: z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().max(200).optional()) as unknown as z.ZodType<string | undefined>,
    appSections: optionalSectionsSchema,
    tags: optionalStringArraySchema(20, 40),
    metadata: optionalJsonRecordSchema,
    visibility: visibilitySchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })
  .superRefine((value, ctx) => {
    const nextType = value.type;
    if ((nextType === 'audio' || nextType === 'video') && !value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: `A media URL is required when changing type to ${nextType}`,
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

export const assignContentSectionsSchema = z
  .object({
    appSections: z.array(sectionNameSchema).max(12),
  })
  .strict();
