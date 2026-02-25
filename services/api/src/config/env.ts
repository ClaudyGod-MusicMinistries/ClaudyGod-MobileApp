import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const looksLikeJwtToken = (value: string): boolean => {
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  return parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part) && part.length > 0);
};

const toBoolean = (fallback: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
      if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    }
    return value;
  }, z.boolean());

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    API_HOST: z.string().trim().min(1).default('0.0.0.0'),
    DATABASE_URL: z.string().trim().min(1),
    DATABASE_SSL: toBoolean(false),
    REDIS_URL: z.string().trim().min(1),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must contain at least 32 characters'),
    JWT_ACCESS_TTL: z.string().trim().min(1).default('1d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    SUPABASE_URL: z.string().optional().default(''),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
    SUPABASE_STORAGE_BUCKET: z.string().trim().min(3).max(120).default('mobile-uploads'),

    MOBILE_API_KEY: z.string().min(8).default('dev-mobile-api-key'),

    MAIL_FROM: z.string().default('Claudy Platform <noreply@claudygod.example>'),
    ADMIN_ALERT_EMAILS: z.string().default(''),
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: toBoolean(false),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),

    YOUTUBE_API_KEY: z
      .string()
      .optional()
      .default('')
      .refine((value) => value === '' || /^AIza[0-9A-Za-z_-]{30,}$/.test(value), {
        message: 'YOUTUBE_API_KEY must look like a valid YouTube Data API key',
      }),
    YOUTUBE_CHANNEL_ID: z.string().optional().default(''),
    YOUTUBE_MAX_RESULTS: z.coerce.number().int().min(1).max(50).default(12),
    ADMIN_SIGNUP_CODE: z.string().optional().default(''),

    SEED_ADMIN_EMAIL: z.string().email().default('admin@claudygod.example'),
    SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
    SEED_ADMIN_DISPLAY_NAME: z.string().trim().min(2).max(80).default('Claudy Admin'),
  })
  .superRefine((value, ctx) => {
    if (looksLikeJwtToken(value.JWT_ACCESS_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message:
          'JWT_ACCESS_SECRET must be a signing secret (random string), not a JWT token string',
      });
    }

    if (value.ADMIN_SIGNUP_CODE && value.ADMIN_SIGNUP_CODE.trim().length > 0 && value.ADMIN_SIGNUP_CODE.trim().length < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ADMIN_SIGNUP_CODE'],
        message: 'ADMIN_SIGNUP_CODE should be at least 12 characters',
      });
    }

    if (value.NODE_ENV === 'production') {
      if (
        value.JWT_ACCESS_SECRET.includes('replace-this') ||
        value.JWT_ACCESS_SECRET.toLowerCase().includes('changeme')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'JWT_ACCESS_SECRET must be rotated before production',
        });
      }

      if (value.MOBILE_API_KEY === 'dev-mobile-api-key' || value.MOBILE_API_KEY.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MOBILE_API_KEY'],
          message: 'MOBILE_API_KEY must be a strong non-default secret in production',
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const raw = parsedEnv.data;

export const env = {
  ...raw,
  CORS_ORIGINS: splitCsv(raw.CORS_ORIGIN),
  ADMIN_ALERT_EMAILS_LIST: splitCsv(raw.ADMIN_ALERT_EMAILS),
  SUPABASE_ENABLED: Boolean(raw.SUPABASE_URL && raw.SUPABASE_SERVICE_ROLE_KEY),
  SMTP_ENABLED: Boolean(raw.SMTP_HOST),
  YOUTUBE_ENABLED: Boolean(raw.YOUTUBE_API_KEY && raw.YOUTUBE_CHANNEL_ID),
  ADMIN_SIGNUP_ENABLED: Boolean(raw.ADMIN_SIGNUP_CODE),
};

export type Env = typeof env;
