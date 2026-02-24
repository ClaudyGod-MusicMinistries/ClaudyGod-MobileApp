import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const asInt = (fallback: number) => z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return fallback;
  return Number(value);
}, z.number().int());

const asBool = (fallback: boolean) => z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  return Boolean(value);
}, z.boolean());

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: asInt(4000).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: asBool(false).default(false),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_ACCESS_TTL: z.string().default('1d'),
  BCRYPT_ROUNDS: asInt(12).default(12),

  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('mobile-uploads'),

  MOBILE_API_KEY: z.string().min(8).default('dev-mobile-api-key'),

  MAIL_FROM: z.string().default('Claudy Platform <noreply@claudygod.example>'),
  ADMIN_ALERT_EMAILS: z.string().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: asInt(587).default(587),
  SMTP_SECURE: asBool(false).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@claudygod.example'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
  SEED_ADMIN_DISPLAY_NAME: z.string().default('Claudy Admin'),
});

const env = EnvSchema.parse(process.env);

const splitCsv = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const inferredDatabaseSsl = env.DATABASE_SSL || /supabase\./i.test(env.DATABASE_URL);

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  server: {
    host: env.API_HOST,
    port: env.API_PORT,
    corsOrigins: splitCsv(env.CORS_ORIGIN),
  },
  logLevel: env.LOG_LEVEL,
  security: {
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtAccessTtl: env.JWT_ACCESS_TTL,
    bcryptRounds: env.BCRYPT_ROUNDS,
    mobileApiKey: env.MOBILE_API_KEY,
  },
  database: {
    url: env.DATABASE_URL,
    ssl: inferredDatabaseSsl,
  },
  redis: {
    url: env.REDIS_URL,
  },
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: env.SUPABASE_STORAGE_BUCKET,
    enabled: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  },
  email: {
    from: env.MAIL_FROM,
    adminAlertEmails: splitCsv(env.ADMIN_ALERT_EMAILS),
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      enabled: Boolean(env.SMTP_HOST),
    },
  },
  seedAdmin: {
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    displayName: env.SEED_ADMIN_DISPLAY_NAME,
  },
} as const;

export type AppConfig = typeof config;
