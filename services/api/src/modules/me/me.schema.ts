import { z } from 'zod';

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max).optional(),
  ) as unknown as z.ZodType<string | undefined>;

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'URL must start with http:// or https://')
    .optional(),
) as unknown as z.ZodType<string | undefined>;

const contentTypeSchema = z.enum(['audio', 'video', 'playlist', 'announcement', 'live', 'ad']);

export const updateMeProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[\p{L}\p{N} .,'_-]+$/u, 'Display name contains unsupported characters')
      .optional(),
    avatarUrl: optionalHttpUrl,
    phone: optionalTrimmedString(30),
    country: optionalTrimmedString(80),
    locale: optionalTrimmedString(16),
    timezone: optionalTrimmedString(80),
    bio: optionalTrimmedString(500),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field is required',
  });

export const updateMePreferencesSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    autoplayEnabled: z.boolean().optional(),
    highQualityEnabled: z.boolean().optional(),
    diagnosticsEnabled: z.boolean().optional(),
    personalizationEnabled: z.boolean().optional(),
    themePreference: z.enum(['system', 'light', 'dark']).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one preference field is required',
  });

export const trackPlayEventSchema = z
  .object({
    contentId: z.string().trim().min(1).max(160),
    contentType: contentTypeSchema,
    title: z.string().trim().min(1).max(240),
    source: optionalTrimmedString(80),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const liveSubscriptionSchema = z
  .object({
    channelId: z.string().trim().min(1).max(160),
    label: optionalTrimmedString(120),
  })
  .strict();

export const saveLibraryItemSchema = z
  .object({
    bucket: z.enum(['liked', 'downloaded', 'playlist']),
    playlistName: optionalTrimmedString(120),
    contentId: z.string().trim().min(1).max(160),
    contentType: contentTypeSchema,
    title: z.string().trim().min(1).max(240),
    subtitle: optionalTrimmedString(240),
    description: optionalTrimmedString(2000),
    imageUrl: optionalHttpUrl,
    mediaUrl: optionalHttpUrl,
    duration: optionalTrimmedString(32),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.bucket === 'playlist' && !value.playlistName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['playlistName'],
        message: 'playlistName is required when bucket is playlist',
      });
    }
  });

export const removeLibraryItemSchema = z
  .object({
    bucket: z.enum(['liked', 'downloaded', 'playlist']),
    contentId: z.string().trim().min(1).max(160),
    playlistName: optionalTrimmedString(120),
  })
  .strict();

export const createPrivacyExportRequestSchema = z
  .object({
    notes: optionalTrimmedString(500),
  })
  .strict();

export const createPrivacyDeleteRequestSchema = z
  .object({
    fullName: z.string().trim().min(3).max(120),
    confirmText: z.string().trim().min(3).max(40),
    notes: optionalTrimmedString(500),
  })
  .strict();

export const createSupportRequestSchema = z
  .object({
    category: z.string().trim().min(2).max(80),
    subject: z.string().trim().min(3).max(200),
    message: z.string().trim().min(5).max(5000),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const createRatingSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: optionalTrimmedString(1000),
    channel: z.enum(['mobile', 'admin', 'web']).default('mobile'),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const createDonationIntentSchema = z
  .object({
    amount: z.string().trim().min(1).max(32),
    mode: z.enum(['once', 'monthly']),
    methodId: z.string().trim().min(1).max(80),
    currency: z.string().trim().length(3).optional(),
    planId: optionalTrimmedString(80),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();
