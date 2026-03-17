import { z } from 'zod';

const visibilitySchema = z.enum(['draft', 'published']);
const youtubeChannelIdentifierSchema = z
  .string()
  .trim()
  .min(2)
  .max(255)
  .refine((value) => {
    if (/^UC[a-zA-Z0-9_-]{20,}$/.test(value)) return true;
    if (/^@[\w.-]{2,}$/i.test(value)) return true;
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) return false;
      const host = url.hostname.toLowerCase();
      const isYouTubeHost =
        host === 'youtube.com' ||
        host === 'www.youtube.com' ||
        host === 'm.youtube.com' ||
        host === 'youtu.be';
      return isYouTubeHost;
    } catch {
      return false;
    }
  }, 'channelId must be a YouTube channel ID (UC...), @handle, or YouTube channel URL');

const optionalChannelIdentifierSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  youtubeChannelIdentifierSchema.optional(),
) as unknown as z.ZodType<string | undefined>;

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
  z
    .array(
      z
        .string()
        .trim()
        .min(2)
        .max(80),
    )
    .max(12)
    .optional(),
) as unknown as z.ZodType<string[] | undefined>;

const optionalTagsSchema = z.preprocess(
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
  z
    .array(
      z
        .string()
        .trim()
        .min(2)
        .max(60),
    )
    .max(16)
    .optional(),
) as unknown as z.ZodType<string[] | undefined>;

export const youtubeListQuerySchema = z
  .object({
    channelId: optionalChannelIdentifierSchema,
    maxResults: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const youtubeSyncSchema = z
  .object({
    channelId: optionalChannelIdentifierSchema,
    maxResults: z.coerce.number().int().min(1).max(50).optional(),
    visibility: visibilitySchema.default('draft'),
    appSections: optionalSectionsSchema,
    tags: optionalTagsSchema,
  })
  .strict();

const youtubeImportSelectionSchema = z
  .object({
    youtubeVideoId: z.string().trim().min(6).max(64),
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(5000).default(''),
    channelTitle: z.string().trim().min(1).max(180),
    publishedAt: z.string().trim().min(10).max(64),
    thumbnailUrl: z.string().trim().url(),
    url: z.string().trim().url(),
    duration: z.string().trim().min(1).max(24),
    isLive: z.boolean().default(false),
    liveViewerCount: z.number().int().nonnegative().optional(),
    visibility: visibilitySchema.default('draft'),
    appSections: optionalSectionsSchema,
    tags: optionalTagsSchema,
  })
  .strict();

export const youtubeImportSchema = z
  .object({
    selections: z.array(youtubeImportSelectionSchema).min(1).max(50),
  })
  .strict();
