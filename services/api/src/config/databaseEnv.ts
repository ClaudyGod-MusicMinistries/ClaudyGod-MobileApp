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
      const parsed = new URL(value);
      return ['postgres:', 'postgresql:'].includes(parsed.protocol)
        && !/(?:your-project|example|placeholder|validation)/i.test(parsed.hostname);
    } catch {
      return false;
    }
  }, 'DATABASE_URL must be a real postgres:// or postgresql:// URL without placeholder hosts'),
  DATABASE_SSL: toBoolean(false),
  DATABASE_SSL_REJECT_UNAUTHORIZED: toBoolean(true),
  DATABASE_SSL_CA_BASE64: z.string().trim().optional().default(''),
});

const parsed = databaseEnvSchema.safeParse(process.env);
if (!parsed.success) {
  process.stderr.write(`Invalid database environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}\n`);
  throw new Error('Database environment validation failed');
}

export const databaseEnv = parsed.data;
