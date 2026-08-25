import { z } from 'zod';
import { loadEnvironment } from './loadEnvironment';

loadEnvironment();

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

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1).refine((value) => {
    try {
      return ['postgres:', 'postgresql:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, 'DATABASE_URL must be a valid postgres:// or postgresql:// URL'),
  DATABASE_SSL: toBoolean(false),
  DATABASE_SSL_REJECT_UNAUTHORIZED: toBoolean(true),
});

const parsed = databaseEnvSchema.safeParse(process.env);
if (!parsed.success) {
  process.stderr.write(`Invalid database environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}\n`);
  throw new Error('Database environment validation failed');
}

export const databaseEnv = parsed.data;
