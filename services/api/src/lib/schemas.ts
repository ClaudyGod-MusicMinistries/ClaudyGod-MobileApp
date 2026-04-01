import { z } from 'zod';

// ============ Shared Schemas ============
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number');

export const idSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============ Auth Schemas ============
const displayNameSchema = z.string().min(2, 'Display name must be at least 2 characters').max(100).trim();

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    username: displayNameSchema.optional(),
    displayName: displayNameSchema.optional(),
    role: z.enum(['CLIENT', 'ADMIN']).optional(),
    adminSignupCode: z.string().trim().min(8).max(128).optional(),
  })
  .transform((value) => ({
    email: value.email,
    password: value.password,
    username: (value.username ?? value.displayName ?? '').trim(),
    role: value.role,
    adminSignupCode: value.adminSignupCode,
  }))
  .refine((value) => value.username.length >= 2, {
    path: ['username'],
    message: 'Display name must be at least 2 characters',
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
});

export const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only digits'),
  email: emailSchema,
});

export const emailVerifyRequestSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  password: passwordSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// ============ Content Schemas ============
export const contentTypeEnum = z.enum(['ARTICLE', 'VIDEO', 'IMAGE', 'PODCAST']);

export const createContentSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().min(1, 'Description required').max(1000),
  body: z.string().min(1).max(10000).optional(),
  contentType: contentTypeEnum,
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  publishedAt: z.string().datetime().optional(),
  sectionId: idSchema.optional(),
});

export const updateContentSchema = createContentSchema.partial();

export const getContentListSchema = z.object({
  ...paginationSchema.shape,
  contentType: contentTypeEnum.optional(),
  sectionId: idSchema.optional(),
  search: z.string().max(200).optional(),
});

export const deleteContentSchema = z.object({
  id: idSchema,
});

// ============ YouTube Schemas ============
export const syncYouTubeSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(50).default(12),
  forceRefresh: z.coerce.boolean().default(false),
});

// ============ Ads Schemas ============
export const createAdSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  imageUrl: z.string().url(),
  redirectUrl: z.string().url(),
  placement: z.enum(['BANNER', 'INLINE', 'FULLSCREEN']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateAdSchema = createAdSchema.partial();

// ============ Mobile Config Schemas ============
export const updateMobileConfigSchema = z.object({
  config: z.record(z.any()).optional(),
});

// ============ Word of Day Schemas ============
export const createWordOfDaySchema = z.object({
  word: z.string().min(1).max(100),
  definition: z.string().min(1).max(500),
  exampleUsage: z.string().min(1).max(500),
});

// ============ Live Stream Schemas ============
export const createLiveStreamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  startTime: z.string().datetime(),
  streamUrl: z.string().url(),
  isActive: z.boolean().default(false),
});
