import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const runtimeEnv =
  process.env.CLAUDYGOD_ENV === 'production' || process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development';
const repoRoot = path.resolve(__dirname, '../../../../');
const envFileName = `.env.${runtimeEnv}`;
const envCandidates = [
  path.resolve(process.cwd(), envFileName),
  path.resolve(process.cwd(), '../..', envFileName),
  path.resolve(repoRoot, envFileName),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

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

const pathSegment = (fieldName: string, fallback: string) =>
  z
    .string()
    .trim()
    .min(2)
    .max(120)
    .default(fallback)
    .refine((value) => value.startsWith('/'), {
      message: `${fieldName} must start with /`,
    });

const optionalUrl = () =>
  z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((value) => value === '' || /^https?:\/\//i.test(value), {
      message: 'Must be a valid http:// or https:// URL',
    });

const isPrivateOrLocalHostname = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    normalized === 'host.docker.internal' ||
    normalized === '10.0.2.2'
  ) {
    return true;
  }

  if (normalized.endsWith('.local')) {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
    return true;
  }

  const private172 = normalized.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (private172) {
    const secondOctet = Number(private172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
};

const isPlaceholderHostname = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (normalized.endsWith('.example')) {
    return true;
  }

  return ['example.com', 'your-domain.com'].some(
    (candidate) => normalized === candidate || normalized.endsWith(`.${candidate}`),
  );
};

const isPlaceholderSupabaseHost = (value: string): boolean =>
  /your-project\.supabase\.co/i.test(value) || /your-project/i.test(value);

const parseDatabaseUrl = (
  value: string,
): { hostname: string; username: string; searchParams: URLSearchParams } | null => {
  try {
    const parsed = new URL(value);
    return {
      hostname: parsed.hostname,
      username: decodeURIComponent(parsed.username),
      searchParams: parsed.searchParams,
    };
  } catch {
    return null;
  }
};

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
    JWT_REFRESH_SECRET: z.string().trim().default(''),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(180).default(30),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGIN: z.string().trim().default(''),

    AUTH_PUBLIC_BASE_URL: optionalUrl(),
    AUTH_VERIFY_EMAIL_PATH: pathSegment('AUTH_VERIFY_EMAIL_PATH', '/verify-email'),
    AUTH_RESET_PASSWORD_PATH: pathSegment('AUTH_RESET_PASSWORD_PATH', '/reset-password'),
    AUTH_SIGN_IN_PATH: pathSegment('AUTH_SIGN_IN_PATH', '/sign-in'),
    AUTH_ACCOUNT_REVIEW_PATH: pathSegment('AUTH_ACCOUNT_REVIEW_PATH', '/settings/account'),
    AUTH_SESSION_COOKIE_NAME: z.string().trim().min(3).max(80).default('claudygod_session'),
    AUTH_REFRESH_COOKIE_NAME: z.string().trim().min(3).max(80).default('claudygod_refresh_session'),
    AUTH_VERIFICATION_TOKEN_TTL_MINUTES: z.coerce.number().int().min(10).max(10080).default(1440),
    AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
    AUTH_REQUIRE_EMAIL_VERIFICATION: toBoolean(false),

    SUPABASE_URL: z.string().optional().default(''),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
    SUPABASE_STORAGE_BUCKET: z.string().trim().min(3).max(120).default('mobile-uploads'),

    MOBILE_API_KEY: z.string().min(8).default('dev-mobile-api-key'),

    MAIL_FROM: z.string().default('ClaudyGod <noreply@claudygod.example>'),
    MAIL_REPLY_TO: z.string().optional().default(''),
    EMAIL_BRAND_NAME: z.string().trim().min(2).max(80).default('ClaudyGod'),
    EMAIL_SUPPORT_EMAIL: z.string().optional().default(''),
    EMAIL_SUPPORT_URL: optionalUrl(),
    ADMIN_ALERT_EMAILS: z.string().default(''),
    SMTP_PROVIDER: z.enum(['generic', 'postfix', 'brevo']).default('generic'),
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: toBoolean(false),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    SMTP_POOL: toBoolean(true),
    SMTP_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(20).default(5),
    SMTP_MAX_MESSAGES: z.coerce.number().int().min(1).max(1000).default(100),
    SMTP_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
    SMTP_GREETING_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
    SMTP_REQUIRE_TLS: toBoolean(false),
    SMTP_TLS_REJECT_UNAUTHORIZED: toBoolean(true),

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

    SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
    SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
    SEED_ADMIN_DISPLAY_NAME: z.string().trim().min(2).max(80).default('Claudy Admin'),
    SEED_ADMIN_ON_BOOT: toBoolean(runtimeEnv === 'development'),
    AI_PROVIDER_NAME: z.string().trim().min(2).max(80).default('Integrated AI'),
    AI_PROVIDER_URL: optionalUrl(),
    AI_PROVIDER_API_KEY: z.string().optional().default(''),
    AI_MODEL: z.string().trim().max(120).default(''),
    AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(15000),
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
      const parsedDatabaseUrl = parseDatabaseUrl(value.DATABASE_URL);
      const publicOrigins = value.CORS_ORIGIN
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (value.DATABASE_URL.includes('replace-with-supabase-db-password')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL must use the real Supabase Postgres password in production',
        });
      }

      if (isPlaceholderSupabaseHost(value.DATABASE_URL) || value.DATABASE_URL.includes('ci-password')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL must point to your real Supabase Postgres host in production',
        });
      }

      if (!parsedDatabaseUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL must be a valid Postgres connection string in production',
        });
      } else {
        if (
          parsedDatabaseUrl.hostname.includes('.pooler.supabase.com') &&
          parsedDatabaseUrl.username === 'postgres'
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['DATABASE_URL'],
            message:
              'Supabase pooler connections must use the project-scoped username from the Connect dialog, for example postgres.<project-ref>, not plain postgres',
          });
        }

        if (
          parsedDatabaseUrl.hostname.includes('.pooler.supabase.com') &&
          !parsedDatabaseUrl.searchParams.has('prefer_simple_protocol')
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['DATABASE_URL'],
            message:
              'Supabase pooler connections should include prefer_simple_protocol=true to avoid prepared statement issues',
          });
        }
      }

      if (!value.SUPABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SUPABASE_URL'],
          message: 'SUPABASE_URL is required in production',
        });
      }

      if (value.SUPABASE_URL && isPlaceholderSupabaseHost(value.SUPABASE_URL)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SUPABASE_URL'],
          message: 'SUPABASE_URL must use your real Supabase project URL in production',
        });
      }

      if (!value.SUPABASE_SERVICE_ROLE_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SUPABASE_SERVICE_ROLE_KEY'],
          message: 'SUPABASE_SERVICE_ROLE_KEY is required in production',
        });
      }

      if (!value.AUTH_PUBLIC_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AUTH_PUBLIC_BASE_URL'],
          message: 'AUTH_PUBLIC_BASE_URL is required in production',
        });
      }

      if (value.AUTH_PUBLIC_BASE_URL && !value.AUTH_PUBLIC_BASE_URL.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AUTH_PUBLIC_BASE_URL'],
          message: 'AUTH_PUBLIC_BASE_URL must use https:// in production',
        });
      }

      try {
        const authPublicBaseUrl = new URL(value.AUTH_PUBLIC_BASE_URL);
        if (isPrivateOrLocalHostname(authPublicBaseUrl.hostname)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['AUTH_PUBLIC_BASE_URL'],
            message: 'AUTH_PUBLIC_BASE_URL cannot use localhost or a private host in production',
          });
        }

        if (isPlaceholderHostname(authPublicBaseUrl.hostname)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['AUTH_PUBLIC_BASE_URL'],
            message: 'AUTH_PUBLIC_BASE_URL must use your real public app domain in production',
          });
        }
      } catch {
        if (value.AUTH_PUBLIC_BASE_URL) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['AUTH_PUBLIC_BASE_URL'],
            message: 'AUTH_PUBLIC_BASE_URL must be a valid public URL in production',
          });
        }
      }

      if (publicOrigins.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: 'CORS_ORIGIN must include your public admin and app domains in production',
        });
      }

      if (
        publicOrigins.some((origin) => {
          try {
            const { hostname } = new URL(origin);
            return isPrivateOrLocalHostname(hostname) || isPlaceholderHostname(hostname);
          } catch {
            return true;
          }
        })
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message:
            'CORS_ORIGIN cannot include localhost, private hosts, or placeholder domains in production',
        });
      }

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

      if (
        value.JWT_REFRESH_SECRET &&
        (value.JWT_REFRESH_SECRET.includes('replace-this') ||
          value.JWT_REFRESH_SECRET.toLowerCase().includes('changeme'))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'JWT_REFRESH_SECRET must be rotated before production',
        });
      }

      if (value.MOBILE_API_KEY === 'dev-mobile-api-key' || value.MOBILE_API_KEY.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MOBILE_API_KEY'],
          message: 'MOBILE_API_KEY must be a strong non-default secret in production',
        });
      }

      if (value.AUTH_REQUIRE_EMAIL_VERIFICATION && !value.SMTP_HOST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_HOST'],
          message:
            'SMTP_HOST is required in production when AUTH_REQUIRE_EMAIL_VERIFICATION is enabled',
        });
      }

      if (value.SMTP_PROVIDER === 'brevo' && (!value.SMTP_USER || !value.SMTP_PASS)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_USER'],
          message: 'Brevo SMTP requires SMTP_USER and SMTP_PASS in production',
        });
      }

      if (value.SMTP_PROVIDER === 'postfix' && !value.SMTP_HOST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_HOST'],
          message: 'Postfix relay requires SMTP_HOST in production',
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
const smtpHostConfigured = Boolean(raw.SMTP_HOST || raw.SMTP_PROVIDER === 'brevo');
const smtpAuthConfigured = Boolean(raw.SMTP_USER && raw.SMTP_PASS);
const smtpEnabled =
  raw.SMTP_PROVIDER === 'brevo'
    ? smtpHostConfigured && smtpAuthConfigured
    : Boolean(raw.SMTP_HOST);

export const env = {
  ...raw,
  JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET || raw.JWT_ACCESS_SECRET,
  CORS_ORIGINS: splitCsv(raw.CORS_ORIGIN),
  ADMIN_ALERT_EMAILS_LIST: splitCsv(raw.ADMIN_ALERT_EMAILS),
  SUPABASE_ENABLED: Boolean(raw.SUPABASE_URL && raw.SUPABASE_SERVICE_ROLE_KEY),
  SMTP_ENABLED: smtpEnabled,
  SMTP_PROVIDER_LABEL:
    raw.SMTP_PROVIDER === 'brevo'
      ? 'Brevo SMTP'
      : raw.SMTP_PROVIDER === 'postfix'
        ? 'Postfix Relay'
        : 'Generic SMTP',
  YOUTUBE_ENABLED: Boolean(raw.YOUTUBE_API_KEY && raw.YOUTUBE_CHANNEL_ID),
  ADMIN_SIGNUP_ENABLED: Boolean(raw.ADMIN_SIGNUP_CODE),
};

export type Env = typeof env;
