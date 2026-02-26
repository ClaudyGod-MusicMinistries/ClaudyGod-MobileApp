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
  })
  .strict();
